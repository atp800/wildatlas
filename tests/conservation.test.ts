import { test } from 'node:test';
import assert from 'node:assert/strict';
import Stripe from 'stripe';
import { productAmount, productRefund, readTotals, readOrderContribution, createTotalsReader, stripeClient } from '../functions/_lib/conservation.ts';
import { onRequestGet } from '../functions/api/conservation.ts';
import { onRequestPost } from '../functions/api/webhook.ts';
import { CONSERVATION_PROGRAM, contributionPence } from '../src/lib/conservation.ts';

const now = new Date('2027-01-20T12:00:00Z');
function session(overrides: Record<string, unknown> = {}, chargeOverrides: Record<string, unknown> = {}) {
  return {
    id: 'cs_test_abcdefghijklmnop', mode: 'payment', status: 'complete', payment_status: 'paid',
    created: Date.parse('2026-12-31T23:00:00Z') / 1000,
    payment_intent: { id: 'pi_order', latest_charge: {
      id: 'ch_order', paid: true, captured: true, amount_refunded: 0,
      created: now.getTime() / 1000, ...chargeOverrides,
    } },
    livemode: false, currency: 'gbp', amount_total: 12600, amount_subtotal: 10000,
    shipping_cost: { amount_total: 600, amount_subtotal: 500, amount_tax: 100 },
    metadata: { conservation_program: CONSERVATION_PROGRAM }, ...overrides,
  } as unknown as Stripe.Checkout.Session;
}
function refund(overrides: Record<string, unknown> = {}) {
  return { id: 're_one', amount: 2000, currency: 'gbp', status: 'succeeded', metadata: {},
    ...overrides } as unknown as Stripe.Refund;
}
function page<T>(data: T[], has_more = false) {
  return { object: 'list', data, has_more, url: '/test' } as Stripe.ApiList<T>;
}
function fakeStripe(sessions = [session()], refunds: Stripe.Refund[] = []) {
  return {
    checkout: { sessions: {
      list: async () => page(sessions),
      retrieve: async () => sessions[0],
    } },
    refunds: { list: async () => page(refunds) },
  } as unknown as Stripe;
}

test('includes product VAT, excludes shipping tax, respects discounts and rounds per order', () => {
  assert.deepEqual(productAmount(session()), { product: 12000, shipping: 600 });
  assert.equal(contributionPence(productAmount(session()).product), 1200);
  assert.equal(productAmount(session({ amount_total: 10200 })).product, 9600);
  assert.equal(productAmount(session({ amount_total: 300, shipping_cost: null })).product, 300);
  assert.equal(contributionPence(105), 11);
  assert.throws(() => productAmount(session({ currency: 'usd' })));
  assert.throws(() => productAmount(session({ amount_total: null })));
  assert.throws(() => productAmount(session({ amount_total: 500 })));
  assert.throws(() => productAmount(session({ shipping_cost: null, total_details: { amount_shipping: 500 } })));
});

test('counts paid shop sessions once; excludes unpaid, unrelated, subscription and wrong-mode sessions', async () => {
  const rows = [session(), session(), ...[
    { payment_status: 'unpaid' }, { metadata: {} }, { mode: 'subscription' },
    { status: 'open' }, { livemode: true },
  ].map((override) => session(override))];
  const totals = await readTotals(fakeStripe(rows), false, now);
  assert.equal(totals.committedPence, 1200);
  assert.equal(totals.allTimePence, 1200);
  assert.equal((await readTotals(fakeStripe([]), false, now)).committedPence, 0);
  await assert.rejects(readTotals(fakeStripe([session({ payment_intent: 'pi_unexpanded' })]), false, now));
});

test('paginates completed sessions and refunds, including refunds beyond the first 100', async () => {
  let sessionPages = 0;
  let refundPages = 0;
  const stripe = fakeStripe();
  stripe.checkout.sessions.list = (async (params: Stripe.Checkout.SessionListParams) => {
    sessionPages++;
    assert.deepEqual(params.expand, ['data.payment_intent.latest_charge']);
    assert.equal(params.limit, 100);
    if (!params.starting_after) return page([session({}, { amount_refunded: 1000 })], true);
    assert.equal(params.starting_after, session().id);
    return page([session({ id: 'cs_second' }, { id: 'ch_second' })]);
  }) as typeof stripe.checkout.sessions.list;
  stripe.refunds.list = (async (params: Stripe.RefundListParams) => {
    refundPages++;
    assert.equal(params.charge, 'ch_order');
    if (!params.starting_after) return page(Array.from({ length: 100 }, (_, i) => refund({ id: 're_' + i, amount: 10 })), true);
    assert.equal(params.starting_after, 're_99');
    return page([refund({ id: 're_last', amount: 2000 })]);
  }) as typeof stripe.refunds.list;
  assert.equal((await readTotals(stripe, false, now)).committedPence, 2100);
  assert.equal(sessionPages, 2);
  assert.equal(refundPages, 2);
});

test('full order or product-only returns remove the entire contribution; pending refunds do not', async () => {
  for (const amount of [12000, 12600]) {
    const stripe = fakeStripe([session({}, { amount_refunded: amount })], [refund({ amount })]);
    assert.equal((await readTotals(stripe, false, now)).committedPence, 0);
  }
  assert.equal(productRefund(refund({ status: 'pending' })), 0);
  assert.equal(productRefund(refund({ status: 'failed' })), 0);
});

test('shipping overrides and later metadata corrections are read directly from Stripe', async () => {
  const refunds = [refund({ amount: 600 })];
  const stripe = fakeStripe([session({}, { amount_refunded: 600 })], refunds);
  assert.equal((await readTotals(stripe, false, now)).committedPence, 1140);
  refunds[0].metadata = { conservation_shipping_refund_pence: '600' };
  assert.equal((await readTotals(stripe, false, now)).committedPence, 1200);
  refunds.push(refund({ id: 're_mixed', amount: 1500, metadata: { conservation_shipping_refund_pence: '500' } }));
  assert.equal((await readTotals(stripe, false, now)).committedPence, 1100);
  assert.throws(() => productRefund(refund({ metadata: { conservation_shipping_refund_pence: '-1' } })));
  assert.throws(() => productRefund(refund({ metadata: { conservation_shipping_refund_pence: '99999' } })));
});

test('quarters use successful charge dates, not checkout dates; old refunds stay with the old sale', async () => {
  const stripe = fakeStripe([
    session({}, { id: 'ch_old', created: Date.parse('2026-12-31T23:59:59Z') / 1000, amount_refunded: 2000 }),
    session({ id: 'cs_new' }, { id: 'ch_new', created: Date.parse('2027-01-01T00:00:00Z') / 1000 }),
    session({ id: 'cs_future' }, { id: 'ch_future', created: Date.parse('2027-04-01T00:00:00Z') / 1000 }),
  ], [refund()]);
  const totals = await readTotals(stripe, false, now);
  assert.equal(totals.committedPence, 1200);
  assert.equal(totals.allTimePence, 3400);
  assert.equal(totals.period, 'January–March 2027');
});

test('individual contribution is verified directly and unpaid/unrelated/missing orders return null', async () => {
  assert.equal(await readOrderContribution(fakeStripe(), false, session().id), 1200);
  for (const override of [{ payment_status: 'unpaid' }, { metadata: {} }, { livemode: true }]) {
    assert.equal(await readOrderContribution(fakeStripe([session(override)]), false, session().id), null);
  }
  const stripe = fakeStripe();
  stripe.checkout.sessions.retrieve = (async () => {
    throw new Stripe.errors.StripeInvalidRequestError({ message: 'Missing', code: 'resource_missing' });
  }) as typeof stripe.checkout.sessions.retrieve;
  assert.equal(await readOrderContribution(stripe, false, session().id), null);
});

test('cache coalesces requests, expires, isolates accounts and rolls over at the quarter boundary', async () => {
  let time = Date.parse('2026-12-31T23:59:50Z');
  let loads = 0;
  const reader = createTotalsReader(async () => ({
    committedPence: ++loads, allTimePence: loads, period: 'test', currency: 'GBP',
  }), () => time);
  const env = { STRIPE_SECRET_KEY: 'sk_test_one', CONSERVATION_MODE: 'test' };
  const results = await Promise.all([reader(env), reader(env)]);
  assert.equal(results[0].committedPence, 1);
  assert.equal(results[1].committedPence, 1);
  await reader(env);
  assert.equal(loads, 1);
  time += 10000; // Quarter changes even though the TTL has not expired.
  await reader(env);
  assert.equal(loads, 2);
  time += 45001;
  await reader(env);
  assert.equal(loads, 3);
  await reader({ ...env, STRIPE_SECRET_KEY: 'sk_test_two' });
  assert.equal(loads, 4);
  await reader({ STRIPE_SECRET_KEY: 'sk_live_one' });
  assert.equal(loads, 5);
});

test('failed refreshes are retried and never cached as a false zero', async () => {
  let calls = 0;
  const reader = createTotalsReader(async () => {
    calls++;
    if (calls === 1) throw new Error('Stripe unavailable');
    return { committedPence: 1200, allTimePence: 1200, period: 'test', currency: 'GBP' };
  });
  await assert.rejects(reader({}));
  assert.equal((await reader({})).committedPence, 1200);
  assert.equal(calls, 2);
});

test('large scans fail explicitly rather than silently truncating the fund', async () => {
  const stripe = fakeStripe();
  let calls = 0;
  stripe.checkout.sessions.list = (async () => page([session({ id: 'cs_' + ++calls, metadata: {} })], true)) as typeof stripe.checkout.sessions.list;
  await assert.rejects(readTotals(stripe, false, now), /request budget exceeded/);
  assert.equal(calls, 40);
});

test('Stripe credential mode validation prevents test data entering production', () => {
  assert.throws(() => stripeClient({}));
  assert.throws(() => stripeClient({ STRIPE_SECRET_KEY: 'sk_test_fake' }));
  assert.throws(() => stripeClient({ STRIPE_SECRET_KEY: 'sk_live_fake', CONSERVATION_MODE: 'test' }));
  assert.throws(() => stripeClient({ STRIPE_SECRET_KEY: 'sk_test_fake', CONSERVATION_MODE: 'typo' }));
  assert.ok(stripeClient({ STRIPE_SECRET_KEY: 'sk_test_fake', CONSERVATION_MODE: 'test' }));
});

test('HTTP endpoint uses Stripe with no database, caches totals, bypasses cache for orders and exposes no private data', async (t) => {
  let scans = 0;
  let lookups = 0;
  t.mock.method(globalThis, 'fetch', async (input: string) => {
    const url = new URL(String(input));
    assert.equal(url.hostname, 'api.stripe.com');
    let data: unknown;
    if (url.pathname.endsWith('/' + session().id)) {
      lookups++;
      data = session();
    } else {
      assert.equal(url.pathname, '/v1/checkout/sessions');
      assert.equal(url.searchParams.get('status'), 'complete');
      scans++;
      data = page([session()]);
    }
    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
  });
  const env = { STRIPE_SECRET_KEY: 'sk_test_endpoint', CONSERVATION_MODE: 'test' };
  const request = new Request('https://wildatlas.org/api/conservation');
  const response = await onRequestGet({ request, env });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal((await response.json()).allTimePence, 1200);
  await onRequestGet({ request, env });
  assert.equal(scans, 1);
  for (let i = 0; i < 2; i++) {
    const order = await onRequestGet({ request: new Request(request.url + '?session_id=' + session().id), env });
    assert.deepEqual(await order.json(), { contributionPence: 1200 });
  }
  assert.equal(lookups, 2);
  assert.equal(scans, 1);
});

test('API returns 503 for failures and rejects malformed session ids before contacting Stripe', async (t) => {
  t.mock.method(console, 'error', () => {});
  const request = new Request('https://wildatlas.org/api/conservation');
  assert.equal((await onRequestGet({ request, env: {} })).status, 503);
  assert.equal((await onRequestGet({ request: new Request(request.url + '?session_id=invalid'), env: {} })).status, 400);
  const stripe = fakeStripe();
  stripe.checkout.sessions.list = (async () => { throw new Error('Stripe unavailable'); }) as unknown as typeof stripe.checkout.sessions.list;
  await assert.rejects(readTotals(stripe, false, now), /Stripe unavailable/);
});

test('order email webhook still verifies signatures and processes paid orders without storage', async (t) => {
  const env = { STRIPE_SECRET_KEY: 'sk_test_fake', STRIPE_WEBHOOK_SECRET: 'whsec_test' };
  const invalid = await onRequestPost({ request: new Request('https://wildatlas.org/api/webhook', {
    method: 'POST', body: '{}', headers: { 'stripe-signature': 'invalid' },
  }), env });
  assert.equal(invalid.status, 400);
  t.mock.method(globalThis, 'fetch', async (url: string) => {
    assert.match(String(url), /\/line_items/);
    return new Response(JSON.stringify(page([])), { headers: { 'Content-Type': 'application/json' } });
  });
  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  for (const type of ['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'refund.updated']) {
    const payload = JSON.stringify({ id: 'evt_test', type, data: { object: session() } });
    const signature = await stripe.webhooks.generateTestHeaderStringAsync({ payload, secret: env.STRIPE_WEBHOOK_SECRET });
    const response = await onRequestPost({ request: new Request('https://wildatlas.org/api/webhook', {
      method: 'POST', body: payload, headers: { 'stripe-signature': signature },
    }), env });
    assert.equal(response.status, 200);
  }
});
