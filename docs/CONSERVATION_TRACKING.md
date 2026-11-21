# Conservation tracking — Stripe only

The tracker calculates **10% of the final product amount paid, after discounts,
including VAT/sales tax and excluding shipping and tax on shipping**. For example,
£120 in products including VAT plus £6 shipping adds £12. It uses Checkout's
`amount_total - shipping_cost.amount_total`, without subtracting Stripe fees.

No database, database binding, migration, or saved counter is required. Stripe
is the source of truth. This tracks a commitment; it does not transfer money to charity.

## Setup

1. Keep the existing `STRIPE_SECRET_KEY` secret on the Cloudflare Pages project.
   It must have permission to read Checkout Sessions, PaymentIntents, Charges and
   Refunds, as well as the existing checkout permissions.
2. Production `CONSERVATION_MODE` defaults to `live`. For a separate test/preview
   deployment, set it to `test` and use a Stripe test key. A mismatched key is
   rejected rather than showing test sales as real contributions.
3. Build and deploy the project including the root `functions/` directory to
   the existing Cloudflare Pages project. A static-only `dist/` upload cannot run
   the API. No additional tracking webhook events are needed.
4. Keep the existing order-email webhook and its `STRIPE_WEBHOOK_SECRET` and
   `RESEND_API_KEY`. It still uses `checkout.session.completed` and
   `checkout.session.async_payment_succeeded`. Refund events are not needed by
   the tracker; if already subscribed, they are safely acknowledged.
5. Verify a test checkout before enabling the Store. No production configuration
   or real payments were changed during implementation.

The previous D1 schema and binding requirement have been removed. If you already
created a database, this code no longer reads or writes it; it has not been deleted
from your Cloudflare account.

## Calculation and refresh behaviour

- Only paid, completed, one-time shop sessions tagged
  `conservation_program=wildatlas-v1` count. The checkout endpoint adds this tag.
  Older untagged orders and unrelated Stripe sales are not backfilled.
- Amounts are integer GBP pence, rounded once per order after refunds. Checkout
  remains GBP with Adaptive Pricing disabled. Tax collection settings are unchanged:
  the tracker includes whichever tax Stripe actually charges.
- The API reads every page of eligible Checkout Sessions and successful refunds,
  not just the first 10 or 100. Duplicate charge IDs are counted once.
- Quarters follow the successful charge's creation date in UTC, rather than the
  date checkout was opened or funds paid out to your bank. For delayed payment
  methods, this charge date can precede confirmation; an order only appears once
  paid and captured. A late refund adjusts the original sale's quarter.
- Public totals are cached in server memory for 45 seconds. The visible page polls
  every 15 seconds, so confirmed payments/refunds normally appear within about a
  minute. The cache is disposable and local to each running function instance;
  cold starts or different locations can cause extra Stripe reads.
- The purchase confirmation page bypasses this cache and checks just that order
  directly with Stripe. It does not wait for webhook delivery or scan all orders.
  Visiting the page cannot increment the fund.
- Errors are shown as unavailable rather than a false £0. Failed scans are not
  cached. Concurrent aggregate requests on the same instance share one scan.
- A scan has a 40-request limit, with up to 100 records per list request. Large
  histories or many refunded orders may exceed this; the API then returns an
  error instead of a partial total. This approach suits a small shop. Revisit
  aggregation/caching if volume grows or Stripe rate-limit errors appear.
- The public API returns only totals or the contribution for a supplied checkout
  session ID. It does not return customer details or Stripe secret keys.
- Hiding Conservation in `src/config.ts` hides the page/menu, not the Stripe tags.
- `donatedPence` in `src/data/conservation.ts` still represents actual charity
  transfers and must be updated after those occur. Voting and allocations remain
  coming soon. Changing the percentage would recalculate historical tagged sales;
  introduce a new programme/rate version if that is ever required.

## Refunds

Successful refunds count as product refunds by default, capped at the original
product value. Pending/failed refunds do not reduce the fund.

For a £100 product + £5 shipping, the original contribution is £10:

| Refund | Fund reduction |
| --- | --- |
| Full £105 order refund | £10 |
| £100 product refund, retaining shipping | £10 |
| £20 partial product refund | £2 |
| £5 shipping-only refund, identified below | £0 |

For a shipping-only or mixed partial refund, set **refund metadata**
`conservation_shipping_refund_pence` to the shipping portion, including its tax.
Use `500` for a £5 shipping refund, or for a £25 mixed refund consisting of £20
product + £5 shipping. The latter reduces the fund by £2.

Supply it when creating the refund via Stripe's API, or edit that refund's
metadata afterwards. Unlike the database implementation, later corrections in
Stripe are picked up automatically after the cache expires.

```js
await stripe.refunds.create({
  payment_intent: 'pi_REPLACE_WITH_ORDER_PAYMENT',
  amount: 500,
  metadata: { conservation_shipping_refund_pence: '500' },
});
```

Ordinary full product/order refunds need no metadata. If metadata is added after
a shipping refund, the tracker can temporarily treat it as a product refund until
the correction is read. Dispute/chargeback reconciliation is not included.

## Verification and local preview

Run `npm run test:conservation` for mocked Stripe API tests covering calculations,
pagination, refunds, cache expiry/concurrency, mode isolation, API errors and
webhook compatibility. Run `npm run build` to build the website.

`astro dev` and `astro preview` do not run Pages Functions. To test the full site:

1. Build with `npm run build`.
2. Put Stripe test secrets in ignored `.dev.vars`. The supplied
   `wrangler.local.jsonc` sets `CONSERVATION_MODE=test`; no storage setup is needed.
3. Run `npx wrangler pages dev --config=wrangler.local.jsonc`.
4. Use a test build with the Store enabled, make a Stripe test purchase, then check
   the contribution on the success page and the Conservation total. Test a refund
   and a shipping-metadata correction.
5. Forward Stripe CLI webhooks to the local `/api/webhook` only if testing order
   emails too, using the CLI's signing secret. Tracking itself needs no forwarding.

The local configuration is for testing, not production deployment. Automated tests
mock Stripe; a real Stripe test-mode checkout in Cloudflare has not been performed.

References: [Stripe Checkout Sessions](https://docs.stripe.com/api/checkout/sessions/list),
[Stripe refunds](https://docs.stripe.com/api/refunds/list),
[Stripe pagination](https://docs.stripe.com/api/pagination).
