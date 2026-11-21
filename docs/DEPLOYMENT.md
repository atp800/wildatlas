# Setup and deployment

[Documentation index](README.md)

## Site switches versus environment variables

Site switches live in [src/config.ts](../src/config.ts) and take effect after
rebuilding/redeploying (restart development when changing the generated routes).

| Switch | Purpose |
| --- | --- |
| `store.isActive` | Enables customer-facing purchase controls; currently false |
| `home.showAbout` | Displays the homepage About section; currently false |
| `conservation.isEnabled` | Generates the Conservation page and its menu link; currently true |

Conservation visibility does not select Stripe test/live data. Hiding the page
does not remove the programme tags from new checkouts. The Store switch is a UI
control, not an authentication boundary for the checkout API.

Runtime environment variables belong in Cloudflare Pages settings, not config.ts:

| Variable | Purpose | Production action |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | Checkout and server-side Stripe reads | Keep your existing live secret key |
| `STRIPE_WEBHOOK_SECRET` | Verifies order-email webhook signatures | Keep the secret for that Stripe endpoint |
| `RESEND_API_KEY` | Sends order confirmation/download emails | Keep your existing key |
| `CONSERVATION_MODE` | Chooses real or simulated purchases for the tracker | Optional: leave absent, or use live |

**CONSERVATION_MODE defaults to live. You do not need to add it to Cloudflare.**
Set it to `test` only in a separate test environment using a Stripe test key.
The tracker rejects a key/mode mismatch so test purchases cannot appear as real
fundraising. This variable does not change which account the checkout key uses.

**wrangler.local.jsonc needs no change before going live.** It sets test mode only
when explicitly selected using `--config=wrangler.local.jsonc`. The normal
Git-connected Cloudflare build does not select it. Do not use that local
configuration for a production Wrangler deployment.

## Deploy to the existing Cloudflare Pages project

1. Review and commit the intended changes, including new files under functions,
   src and tests. Never commit .env or .dev.vars secrets.
2. Push to the branch configured as Cloudflare's production branch.
3. Keep the build command `npm run build` and output directory `dist`; use
   a Node version meeting package.json's requirements.
4. Wait for the Pages deployment to succeed and confirm its commit matches yours.
5. Open /api/conservation on the deployed site. It should return JSON totals,
   then /conservation should display them.
6. Complete the [testing checklist](TESTING_GUIDE.md) before opening the Store.

No database, storage binding or additional conservation webhook is needed.
The root functions directory must be part of the deployment source; uploading
only static files does not supply these APIs. Existing checkout/email secrets
are reused. If using a restricted Stripe key, ensure it can read Checkout
Sessions, PaymentIntents, Charges and Refunds in addition to checkout permissions.

The email webhook still needs checkout.session.completed and
checkout.session.async_payment_succeeded, with the existing 2023-10-16 API contract.
Tracking does not depend on these events; refund events need no new subscription.

Git integration behaviour: [Cloudflare's deployment guide](https://developers.cloudflare.com/pages/get-started/git-integration/).

## Local preview with payments

Astro dev/preview alone cannot serve the Cloudflare functions. For a full preview:

1. Use separate Stripe test credentials and test price IDs in a test checkout.
   Live Stripe price IDs cannot be used with a test key. Do not publish temporary
   test product IDs to production.
2. Put test STRIPE_SECRET_KEY in the ignored .dev.vars file. Add test email/webhook
   secrets only when testing emails. The local Wrangler configuration selects test mode.
3. Run `npm run build`, then
   `npx wrangler pages dev --config=wrangler.local.jsonc`.
4. Use the URL printed by Wrangler. For email testing, forward Stripe CLI events
   to /api/webhook and use the CLI's signing secret.
5. Keep production secrets separate from previews and restore any temporary
   Store/product changes before publishing.

For refunds and tracker-specific details, use the [Conservation guide](CONSERVATION_TRACKING.md).

## Troubleshooting

- **Tracker unavailable:** inspect function logs; check secret permissions and
  live/test mode. An error is deliberately not shown as £0.
- **£0 despite past sales:** only new tagged shop sessions count. Older untagged
  sales are not backfilled.
- **Product unavailable at checkout:** compare the active one-time GBP Stripe price
  with product frontmatter; the server rejects mismatched prices.
- **No download email:** check Resend configuration and Stripe product metadata
  (see the content guide). Tracking success does not establish email delivery.
- **A deployment regresses:** use the last known-good deployment through your
  deployment workflow and fix/redeploy the source. Checking out a local Git branch
  alone does not roll back the live website.
