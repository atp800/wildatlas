# Content and products

[Documentation index](README.md)

## Articles

The schema is [src/content.config.ts](../src/content.config.ts). Articles live in
src/content/articles/nature, eco or travel. Both .md and .mdx are accepted.
The folder and filename determine the URL; keep section consistent with the folder.

Example for src/content/articles/nature/example.md (replace the image with an existing file):

```yaml
---
title: "Example article"
description: "A concise description."
image: "../../../assets/nature/example.jpg"
section: "nature"
topic: "wildlife"
tags: "wildlife,conservation"
author: "Andreas"
highlighted: false
status: "live"
created_at: "2026-11-21"
published_at: "2026-11-21"
---
```

Tags are a comma-separated string, not an array. Optional dates can be omitted,
null, or the legacy string "null"; use valid dates when supplied. The current
schema handles empty optional dates. Use ## and ### for body headings because
the article layout supplies the title.

Draft status is **not a privacy control**: the current catch-all route generates
all collection entries, while listings/RSS use different filters. Keep confidential
drafts outside deployed content until publication filtering is unified.

See [Markdown style](markdown-style-guide.md) and [MDX](using-mdx.mdx).

## CMS

The repository configures Sveltia at /admin/ in
[public/admin/config.yml](../public/admin/config.yml). Its comments describe local
repository access in Chrome/Edge and the GitHub token workflow for deployed editing.
Local saves change repository files; review, build and commit them like other edits.
The configured GitHub backend targets atp800/wildatlas on main. Editorial workflow
is currently commented out; do not assume drafts automatically become pull requests.

The older scripts/add-article.js uses CommonJS require in an ES-module project.
It needs repair before being used as the supported authoring workflow.

## Products and Stripe

Keep product .md/.mdx files directly in src/content/products: Astro's loader is
recursive, but scripts/generate-catalog.mjs scans only this top-level directory.
Copy a current product as a starting point.

Required fields include title, description, price, stripePriceId, physical,
category and image. Although type is optional in the schema, provide it because
the Store UI expects it. Use live and inStock to control availability. Price is
in pounds; the generated server catalogue converts it to GBP pence.

1. Create an active one-time GBP price in Stripe and record its price ID.
2. Keep the site's price and stripePriceId aligned with that Stripe price.
3. Set physical correctly. For digital downloads, also set physical and
   downloadURL on the **Stripe Product metadata**. The email webhook reads Stripe
   metadata, not the site's downloadURL field.
4. Run npm run catalog or npm run build. Do not hand-edit functions/_data/catalog.json.
5. Verify a checkout and download email in test mode before enabling real sales.

Test Stripe keys need test price IDs. Public download URLs are currently permanent
and shareable; they are not access-controlled downloads. Physical shipping rates
are currently offered as fixed options rather than automatically filtered by country.
See the [backlog](BACKLOG.md) for these remaining limitations.

## Images

Article/product hero image fields use Astro's image schema and normally point to
files in src/assets via a relative path from the content file. Public assets are
served by URL without Astro processing. Use descriptive alt text for body images
and avoid embedding large base64 images in Markdown.

For loading and optimisation details, see [Performance](PERFORMANCE_OPTIMIZATIONS.md).
