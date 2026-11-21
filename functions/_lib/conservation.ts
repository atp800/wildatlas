import Stripe from 'stripe';
import { CONSERVATION_PROGRAM, contributionPence, conservationQuarter } from '../../src/lib/conservation.ts';

export interface ConservationEnv {
  STRIPE_SECRET_KEY?: string;
  // Opt into test data only on a separate preview/test deployment.
  CONSERVATION_MODE?: string;
}

export function liveMode(env: ConservationEnv): boolean {
  if (env.CONSERVATION_MODE && !['live', 'test'].includes(env.CONSERVATION_MODE)) {
    throw new Error('Invalid CONSERVATION_MODE');
  }
  return env.CONSERVATION_MODE !== 'test';
}

export function stripeClient(env: ConservationEnv) {
  const key = env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new Error('Missing STRIPE_SECRET_KEY');
  const mode = liveMode(env) ? 'live' : 'test';
  if (!key.startsWith(`sk_${mode}_`) && !key.startsWith(`rk_${mode}_`)) {
    throw new Error('Stripe key does not match CONSERVATION_MODE');
  }
  return new Stripe(key, {
    // @ts-expect-error Preserve the shop's existing API version.
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
    timeout: 8000,
    maxNetworkRetries: 0,
  });
}

function pence(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new Error('Invalid Stripe amount');
  }
  return value;
}

export function productAmount(session: Stripe.Checkout.Session) {
  if (session.currency !== 'gbp') throw new Error('Conservation currently supports GBP checkout only');
  const total = pence(session.amount_total);
  // amount_total includes shipping tax too, so none of it enters the fund.
  const shipping = session.shipping_cost ? pence(session.shipping_cost.amount_total) : 0;
  if (!session.shipping_cost && (session.total_details?.amount_shipping ?? 0) !== 0) {
    throw new Error('Missing Stripe shipping breakdown');
  }
  if (shipping > total) throw new Error('Shipping exceeds checkout total');
  return { product: total - shipping, shipping };
}

function eligible(session: Stripe.Checkout.Session, live: boolean) {
  return session.metadata?.conservation_program === CONSERVATION_PROGRAM &&
    session.mode === 'payment' && session.status === 'complete' &&
    session.payment_status === 'paid' && session.livemode === live;
}

function paidCharge(session: Stripe.Checkout.Session): Stripe.Charge {
  const payment = session.payment_intent;
  const charge = payment && typeof payment !== 'string' ? payment.latest_charge : null;
  if (!charge || typeof charge === 'string' || !charge.paid || !charge.captured) {
    throw new Error('Paid checkout is missing its captured charge');
  }
  return charge;
}

export function productRefund(refund: Stripe.Refund): number {
  if (refund.status !== 'succeeded') return 0;
  if (refund.currency !== 'gbp') throw new Error('Unsupported refund currency');
  const amount = pence(refund.amount);
  const rawShipping = refund.metadata?.conservation_shipping_refund_pence;
  if (rawShipping !== undefined && !/^\d+$/.test(rawShipping)) throw new Error('Invalid shipping refund metadata');
  const shipping = rawShipping === undefined ? 0 : pence(Number(rawShipping));
  if (shipping > amount) throw new Error('Shipping refund exceeds refund');
  return amount - shipping;
}

// Bound serverless work; never return a truncated/undercounted total.
// With pages of 100 this suits an early-stage shop; revisit as it grows.
function requestBudget() {
  let remaining = 40;
  return () => { if (--remaining < 0) throw new Error('Conservation Stripe request budget exceeded'); };
}

async function* pages<T extends { id: string }>(
  getPage: (startingAfter?: string) => PromiseLike<Stripe.ApiList<T>>,
  consume: () => void,
) {
  let cursor: string | undefined;
  while (true) {
    consume();
    const page = await getPage(cursor);
    for (const item of page.data) yield item;
    if (!page.has_more) return;
    const next = page.data.at(-1)?.id;
    if (!next || next === cursor) throw new Error('Invalid Stripe pagination');
    cursor = next;
  }
}

async function orderContribution(stripe: Stripe, session: Stripe.Checkout.Session, consume: () => void) {
  const amount = productAmount(session);
  const charge = paidCharge(session);
  let refundedProducts = 0;
  if (charge.amount_refunded > 0) {
    // Fetch current metadata and every page, not just the charge's first ten refunds.
    for await (const refund of pages((starting_after) => stripe.refunds.list({
      charge: charge.id, limit: 100, ...(starting_after ? { starting_after } : {}),
    }), consume)) {
      refundedProducts += productRefund(refund);
    }
  }
  return contributionPence(Math.max(0, amount.product - refundedProducts));
}

export async function readTotals(stripe: Stripe, live: boolean, now = new Date()) {
  const quarter = conservationQuarter(now);
  const consume = requestBudget();
  let committedPence = 0;
  let allTimePence = 0;
  const seenCharges = new Set<string>();
  // Scan all completed sessions: a checkout started before a quarter boundary
  // can be paid afterwards. Filtering by session.created would miss it.
  for await (const session of pages((starting_after) => stripe.checkout.sessions.list({
    status: 'complete', limit: 100, expand: ['data.payment_intent.latest_charge'],
    ...(starting_after ? { starting_after } : {}),
  }), consume)) {
    if (!eligible(session, live)) continue;
    const charge = paidCharge(session);
    if (seenCharges.has(charge.id)) continue;
    seenCharges.add(charge.id);
    const amount = await orderContribution(stripe, session, consume);
    allTimePence += amount;
    // Use the successful Stripe charge's UTC date, not checkout creation or payout.
    if (charge.created >= quarter.start && charge.created < quarter.end) committedPence += amount;
  }
  return { committedPence, allTimePence, period: quarter.label, currency: 'GBP' as const };
}

export async function readOrderContribution(stripe: Stripe, live: boolean, sessionId: string) {
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['payment_intent.latest_charge'] });
  } catch (error) {
    if (error instanceof Stripe.errors.StripeInvalidRequestError && error.code === 'resource_missing') return null;
    throw error;
  }
  if (!eligible(session, live)) return null;
  return orderContribution(stripe, session, requestBudget());
}

// Disposable process-local cache: no binding, database, disk or counter to maintain.
// Safe to lose on a cold start. Account/mode/quarter changes invalidate it.
export function createTotalsReader(
  load = (env: ConservationEnv, now: Date) => readTotals(stripeClient(env), liveMode(env), now),
  clock = Date.now,
) {
  let cached: { key: string; expires: number; value: Awaited<ReturnType<typeof readTotals>> } | undefined;
  const pending = new Map<string, Promise<Awaited<ReturnType<typeof readTotals>>>>();
  return async (env: ConservationEnv) => {
    const now = new Date(clock());
    const key = `${env.STRIPE_SECRET_KEY?.trim()}|${liveMode(env)}|${conservationQuarter(now).start}`;
    if (cached?.key === key && cached.expires > clock()) return cached.value;
    const existing = pending.get(key);
    if (existing) return existing;
    const refresh = load(env, now).then((value) => {
      cached = { key, expires: clock() + 45000, value };
      return value;
    }).finally(() => pending.delete(key));
    pending.set(key, refresh);
    return refresh;
  };
}
