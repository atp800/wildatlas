# Backlog and known gaps

[Documentation index](README.md)

This is a maintained summary, not a new full security or code audit. The complete
[original backlog](archive/original-backlog.txt) is preserved, including editorial,
business, design and social-media ideas. Old line numbers and claims there need
rechecking before implementation.

## Shop and launch

- Verify live/test price IDs and Stripe Product metadata for every product, including
  physical and digital downloadURL values; verify confirmation emails.
- Complete a real Stripe test-mode purchase/refund flow on Cloudflare.
- Replace public permanent digital downloads with controlled delivery.
- Correct the static success-page behaviour: it still announces success and clears
  the cart on any visit. The contribution itself is now verified separately.
- Review checkout rate limiting/idempotency and email retry behaviour. Resend now
  receives a per-session idempotency key; this is not a persistent order system.
- Fix country-specific shipping selection and paginate email fulfilment line items.
- Confirm fulfilment/dropshipping, order tracking, support contact, delivery/refund
  information and the intended tax configuration before launch.
- Implement conservation voting, cause allocation and donation receipts. Transfers
  to charities remain separate from calculated purchase commitments.

## Content, presentation and maintenance

- Unify draft/deleted/future-date filtering across routes, listings and RSS.
- Review social-preview image URLs, metadata defaults, canonical/RSS host consistency
  and indexing of cart/success/cancel/empty pages.
- Add project-wide TypeScript/Astro checks and address remaining unused/broken code.
- Require or guard product type in the UI; review legacy article and image scripts.
- Review consent handling, mobile-menu keyboard behaviour, external-link attributes,
  image sizes, article spacing and shared colour variables.
- Prioritise editorial plans and design ideas from the archived notes; retained
  [design references](README.md#design-references) are not a list of implemented features.

## Already changed since the older notes

- Conservation uses Stripe directly, without a database; tests and setup documentation
  now exist. Voting remains unfinished.
- Checkout passes a session ID to the success page for contribution verification.
- Optional article dates now handle null/missing values in the content schema.
- Fonts are self-hosted, a webmanifest exists, shared page-heading styles are present,
  and CMS configuration is available. Review details rather than treating the old
  suggestions to introduce these as entirely new tasks.

Do not treat the old customer-portal/shipping-email or social-platform advice as
verified capabilities. Research those services when implementing that work.
