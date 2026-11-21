# Performance and assets

[Documentation index](README.md) · [Testing](TESTING_GUIDE.md)

## Current implementation

The site generates static Astro pages, with build-managed images in src/assets.
Inspect the relevant route/component when changing image sizes or loading priority.
The former OptimizedImage.astro component referenced in old guides no longer exists.

Fonts are self-hosted in public/fonts. global.css declares Urbanist and Nothing You
Could Do with font-display: swap; BaseHead preloads the main font files. The active
approach is not the old Google Fonts preload scheme.

BaseHead defers the Google Tag Manager script until interaction or a timeout after
load. GTMBodyNoScript provides the separate fallback where included. This is a
loading strategy, not a consent-management implementation.

Shared section headings use .page-title and .page-content in src/styles/global.css.
Keep common changes there rather than adding per-page overrides. Responsive media
queries can intentionally override the desktop size.

## Light and dark themes

The shared footer has a Dark mode toggle at the far right (on its own right-aligned
row on narrow screens). It is present on shop, cart, product and payment-result
pages as well as the editorial pages. The initial theme follows the device setting;
a visitor's choice is saved locally as wildatlas-theme and takes precedence.

ThemeInit.astro runs in BaseHead before paint to avoid a light flash. It updates
the toggle's pressed state, follows device changes until a choice is made, and
synchronises changes between tabs. With blocked storage, toggling still works on
the current page. Without JavaScript the site stays light and the toggle is hidden.

Theme colours live in the data-theme='dark' section of src/styles/global.css.
Component styles use semantic variables with the original light colours as fallbacks.
The document and standard navigation backgrounds share --background. BaseHead
must not add fixed body colours that override global.css; the homepage navigation
remains transparent over its photograph.
Keep photo overlays and button text legible; do not invert photographs to create
dark mode. This theme applies to the website, not Stripe's hosted checkout or the
separate CMS interface.

## Images

Prefer the existing Astro image pipeline for source assets. Supply useful alt text
and appropriate dimensions/loading behaviour; inspect the rendered result rather
than assuming every image is optimised automatically.

npm run optimize-images is an optional legacy Sharp script. It scans public
recursively and writes WebP/resized files beside the originals. It can reprocess
generated JPEG variants on subsequent runs and also reaches download files/icons.
Review its input scope and generated changes before using it. Do not make repeated
build:optimized runs the standard deploy workflow; use npm run build.

## Measuring changes

Use the [testing guide](TESTING_GUIDE.md). There is no maintained current Lighthouse
baseline in this repository. The [archived performance notes](archive/performance-notes.md)
contain historical estimates, not verified present-day scores or guaranteed savings.

Measure before and after under the same conditions, and inspect image transfer
sizes, layout shifts, font loading and third-party requests. Do not optimise by
removing essential checkout, accessibility or tracking behaviour without checking it.
