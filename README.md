# Wild Atlas

Science, nature and travel articles, eco product reviews, and a Stripe shop.
The site builds static pages with Astro; Cloudflare Pages Functions handle
checkout, order emails and conservation totals.

## Documentation

Start with the [documentation index](docs/README.md). The main guides are:

| Task | Guide |
| --- | --- |
| Configure the site, Stripe and Cloudflare; go live | [Setup and deployment](docs/DEPLOYMENT.md) |
| Write articles, manage products and use the CMS | [Content guide](docs/CONTENT.md) |
| Understand charity totals, test mode and refunds | [Conservation tracking](docs/CONSERVATION_TRACKING.md) |
| Check a change before publishing | [Testing](docs/TESTING_GUIDE.md) |
| Maintain images, fonts and loading behaviour | [Performance](docs/PERFORMANCE_OPTIMIZATIONS.md) |
| Find unfinished work and older ideas | [Backlog](docs/BACKLOG.md) |

## Local development

Use Node.js 22.12 or newer as required by package.json, and npm.
The conservation tests run TypeScript directly; use Node 22.18+ for those
(Node 26 was used for the latest checks).

```sh
npm ci
npm run dev
```

Open the address printed in the terminal (normally http://localhost:4321).
This previews the static site; it does not run Cloudflare APIs.
See [full local testing](docs/DEPLOYMENT.md#local-preview-with-payments).

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` / `npm run start` | Generate the catalogue, then start Astro development |
| `npm run catalog` | Generate server prices from product frontmatter |
| `npm run build` | Generate the catalogue and build the site to dist |
| `npm run preview` | Preview the static build |
| `npm run test:conservation` | Run mocked Stripe tracker tests |
| `npm run astro -- --help` | Astro CLI help |
| `npm run optimize-images` | Optional legacy public-image processing; read the performance guide first |
| `npm run build:optimized` | Catalogue + legacy image processing + Astro build; not the normal deploy command |

## Code map

| Location | Purpose |
| --- | --- |
| `src/config.ts` | Store, homepage About and Conservation visibility switches |
| `src/content.config.ts` | Article and product schemas |
| `src/content/articles/{nature,eco,travel}/` | Markdown/MDX articles |
| `src/content/products/` | Product files, kept directly in this folder |
| `src/assets/`, `public/` | Build-managed images; directly served assets |
| `src/pages/`, `src/layouts/`, `src/components/` | Routes and presentation |
| `src/styles/global.css` | Shared styles, including .page-title and .page-content |
| `functions/api/` | Checkout, order email webhook and Conservation API |
| `functions/_lib/conservation.ts` | Stripe totals, refund calculation and temporary cache |
| `src/lib/conservation.ts`, `src/data/conservation.ts` | Shared calculation settings; causes and confirmed charity transfers |
| `public/admin/config.yml` | Sveltia CMS configuration |
| `scripts/`, `tests/` | Catalogue/image helpers and automated tests |

Documentation reflects the source, not a guarantee that the latest code is
deployed. Cloudflare deployment success and a Stripe test checkout must be checked
separately. Keep documentation with the change it describes; add new guides to the
index rather than duplicating setup instructions.
