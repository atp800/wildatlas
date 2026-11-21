# Testing

[Documentation index](README.md)

## Routine checks

Run these from the project root:

```sh
npm run test:conservation
npm run build
```

The tracker tests use mocked Stripe responses; they do not charge a card or contact
a live account. They cover money/tax/shipping calculations, refunds, pagination,
cache expiry/concurrency, quarter boundaries, mode validation, error handling and
email-webhook compatibility. The last implementation check passed 14 tests.

The Astro build checks content and produces static pages. It does not establish
that all TypeScript or .astro type errors are absent. There is currently no
project-wide typecheck script. A previous targeted TypeScript check and function
bundle check passed for the tracking change; these are not a full-project audit.

## Browser checks

Use npm run dev while editing; for production-style static output run npm run build
then npm run preview. Use the terminal's actual URL rather than assuming a fixed port.

Check Home, Travel, Nature, Eco, Store, Conservation, an article and a product:

- Navigation, footer and heading styles at desktop and mobile widths.
- Images, fonts, links and keyboard navigation.
- Site switches after rebuilding, including Conservation menu/page visibility.
- Conservation loading/error states; static-only previews cannot return live totals.

## Payment and refund checks

Use the full [test-mode setup](DEPLOYMENT.md#local-preview-with-payments), including
test Stripe price IDs and a test key. Verify:

1. Successful checkout shows the correct product and shipping amounts.
2. The success page confirms the contribution, and the public fund updates.
3. The order email contains the expected download links or physical-order message.
4. Full and partial product refunds reduce the total.
5. Shipping-only refund metadata preserves the product contribution.
6. Test payments never appear in the production fund.

A real Stripe test checkout in Cloudflare remains to be verified; automated test
success alone is not end-to-end payment verification. See the
[refund examples](CONSERVATION_TRACKING.md#refunds).

## Performance and deployment

Measure the production build with the browser's Lighthouse tools. Record the URL,
commit, device profile and date, and compare repeated runs with matching settings.
Old numerical estimates are not current benchmark results.

After deployment, confirm the deployed commit, the API response and visible
Conservation total. Changing local files or checking out a branch does not change
the live site until deployment occurs.
