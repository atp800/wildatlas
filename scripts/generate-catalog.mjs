// Generates functions/_data/catalog.json from the product content files.
// The checkout Function uses it to resolve prices server-side, so the browser
// can never choose what a product costs. Run automatically by `npm run build`
// (prebuild) and `npm run dev` (predev).
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const productsDir = path.join(root, 'src', 'content', 'products');
const outputPath = path.join(root, 'functions', '_data', 'catalog.json');

function fail(message) {
  console.error(`✖ catalog: ${message}`);
  process.exit(1);
}

function readFrontmatter(source, file) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source.replace(/^\uFEFF/, ''));
  if (!match) fail(`${file} has no frontmatter block`);
  return match[1];
}

function readValue(frontmatter, key) {
  const match = new RegExp(`^${key}:[ \\t]*(.*)$`, 'm').exec(frontmatter);
  if (!match) return undefined;
  const value = match[1].trim();
  if (!value) return undefined;
  return value.replace(/^["'](.*)["']$/, '$1');
}

function readBoolean(frontmatter, key, file, fallback) {
  const value = readValue(frontmatter, key);
  if (value === undefined) {
    if (fallback === undefined) fail(`${file} is missing "${key}"`);
    return fallback;
  }
  if (value === 'true') return true;
  if (value === 'false') return false;
  fail(`${file} has a non-boolean "${key}": ${value}`);
}

const files = (await readdir(productsDir)).filter((file) => /\.mdx?$/.test(file)).sort();
if (files.length === 0) fail(`no products found in ${path.relative(root, productsDir)}`);

const entries = [];
const priceOwners = new Map();

for (const file of files) {
  const source = await readFile(path.join(productsDir, file), 'utf8');
  const frontmatter = readFrontmatter(source, file);
  const id = file.replace(/\.mdx?$/, '');

  const priceId = readValue(frontmatter, 'stripePriceId');
  if (!priceId) fail(`${file} is missing "stripePriceId"`);
  if (!/^price_[A-Za-z0-9]+$/.test(priceId)) fail(`${file} has an invalid "stripePriceId": ${priceId}`);

  if (priceOwners.has(priceId)) {
    fail(`${file} and ${priceOwners.get(priceId)} share the same Stripe price ID (${priceId})`);
  }
  priceOwners.set(priceId, file);

  entries.push({
    id,
    priceId,
    physical: readBoolean(frontmatter, 'physical', file),
    inStock: readBoolean(frontmatter, 'inStock', file, true),
    live: readBoolean(frontmatter, 'live', file, false),
  });
}

const catalog = Object.fromEntries(entries.map(({ id, ...product }) => [id, product]));
const json = `${JSON.stringify(catalog, null, 2)}\n`;

await mkdir(path.dirname(outputPath), { recursive: true });
const existing = await readFile(outputPath, 'utf8').catch(() => null);

if (existing === json) {
  console.log(`✔ catalog: ${entries.length} products up to date`);
} else {
  await writeFile(outputPath, json);
  console.log(`✔ catalog: wrote ${entries.length} products to ${path.relative(root, outputPath)}`);
}
