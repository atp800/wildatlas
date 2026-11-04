import Stripe from 'stripe';
import catalog from '../_data/catalog.json';

export const ALLOWED_COUNTRIES = [
  // Anglosphere
  'GB','IE','US','CA','AU','NZ',

  // Western & Northern Europe
  'DE','FR','NL','BE','LU','SE','DK','NO','FI','CH','AT', 'EE', 'SI', 'LV', 'LT',

  // Eastern & Southern Europe
  'IT','ES','PT','PL','CZ','SK','HU', 'CY',

  // Asia
  'SG', 'HK', 'JP', 'AE', 'IL', 'QA', 'KR'

];

// GB - United Kingdom
// IE - Ireland
// US - United States
// CA - Canada
// AU - Australia
// NZ - New Zealand

// DE - Germany
// FR - France
// NL - Netherlands
// BE - Belgium
// ES - Spain
// PT - Portugal
// LU - Luxembourg
// SE - Sweden
// DK - Denmark
// NO - Norway
// FI - Finland
// CH - Switzerland
// AT - Austria

// IT - Italy
// PL - Poland
// CZ - Czechia (Czech Republic)
// SK - Slovakia
// HU - Hungary
// EE - Estonia
// SI - Slovenia
// LV - Latvia
// LT - Lithuania
// CY - Cyprus

// SG - Singapore
// HK - Hong Kong
// JP - Japan
// AE - United Arab Emirates
// IL - Israel
// QA - Qatar
// KR - South Korea

type CatalogProduct = {
  priceId: string;
  unitAmount: number;
  currency: string;
  physical: boolean;
  inStock: boolean;
  live: boolean;
};

// Written by scripts/generate-catalog.mjs from src/content/products on every build.
const PRODUCTS = catalog as Record<string, CatalogProduct>;

const MAX_QUANTITY_PER_ITEM = 10;
const MAX_DISTINCT_ITEMS = 20;

// Shipping is charged in pence (GBP). Adjust these values to your real rates.
const SHIPPING_RATES = {
  uk: { amount: 400, label: 'UK delivery', minDays: 2, maxDays: 4 },
  international: { amount: 1000, label: 'International delivery', minDays: 5, maxDays: 10 },
};

export function buildShippingOptions(): Stripe.Checkout.SessionCreateParams.ShippingOption[] {
  return [
    {
      shipping_rate_data: {
        type: 'fixed_amount',
        display_name: SHIPPING_RATES.uk.label,
        fixed_amount: { amount: SHIPPING_RATES.uk.amount, currency: 'gbp' },
        delivery_estimate: {
          minimum: { unit: 'business_day', value: SHIPPING_RATES.uk.minDays },
          maximum: { unit: 'business_day', value: SHIPPING_RATES.uk.maxDays },
        },
      },
    },
    {
      shipping_rate_data: {
        type: 'fixed_amount',
        display_name: SHIPPING_RATES.international.label,
        fixed_amount: { amount: SHIPPING_RATES.international.amount, currency: 'gbp' },
        delivery_estimate: {
          minimum: { unit: 'business_day', value: SHIPPING_RATES.international.minDays },
          maximum: { unit: 'business_day', value: SHIPPING_RATES.international.maxDays },
        },
      },
    },
  ];
}

export function buildSessionConfig(
  origin: string,
  lineItems: Stripe.Checkout.SessionCreateParams.LineItem[],
  requiresShipping: boolean
): Stripe.Checkout.SessionCreateParams {
  const sessionConfig: Stripe.Checkout.SessionCreateParams = {
    automatic_payment_methods: { enabled: true },
    line_items: lineItems,
    mode: 'payment',
    success_url: `${origin}/success`, // Simplified!
    cancel_url: `${origin}/cart`,
  };

  if (requiresShipping) {
    sessionConfig.shipping_address_collection = {
      allowed_countries: ALLOWED_COUNTRIES as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[],
    };
    sessionConfig.shipping_options = buildShippingOptions();
  }

  return sessionConfig;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export class PriceCheckError extends Error {
  productId: string;

  constructor(productId: string, message: string) {
    super(message);
    this.productId = productId;
  }
}

export async function verifyStripePrice(stripe: Stripe, id: string, product: CatalogProduct) {
  let price: Stripe.Price;
  try {
    price = await stripe.prices.retrieve(product.priceId);
  } catch (error: any) {
    if (error?.type === 'StripeInvalidRequestError' && error?.code === 'resource_missing') {
      throw new PriceCheckError(id, `Stripe price ${product.priceId} no longer exists`);
    }
    throw error;
  }

  const expected = `${product.currency} ${product.unitAmount}`;

  if (!price.active) {
    throw new PriceCheckError(id, `Stripe price ${product.priceId} is inactive, expected ${expected}`);
  }
  if (price.type !== 'one_time') {
    throw new PriceCheckError(id, `Stripe price ${product.priceId} is ${price.type}, expected one_time`);
  }
  if (price.currency !== product.currency || price.unit_amount !== product.unitAmount) {
    throw new PriceCheckError(
      id,
      `Stripe price ${product.priceId} is ${price.currency} ${price.unit_amount}, catalog expects ${expected}`
    );
  }

  return price;
}

export async function onRequestPost({ request, env }) {
  try {
    const stripe = new Stripe(env.STRIPE_SECRET_KEY.trim(), {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient()
    });

    let body: any;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Invalid checkout request.' }, 400);
    }

    const rawItems = body?.items;
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return jsonResponse({ error: 'Your cart is empty.' }, 400);
    }
    if (rawItems.length > MAX_DISTINCT_ITEMS) {
      return jsonResponse({ error: 'Your cart contains too many items.' }, 400);
    }

    // The browser is only trusted for product ids and quantities. Prices,
    // availability and shipping requirements all come from the catalog.
    const quantities = new Map<string, number>();

    for (const raw of rawItems) {
      const id = raw?.id;
      if (typeof id !== 'string') {
        return jsonResponse({ error: 'Invalid item in cart.' }, 400);
      }

      const product = PRODUCTS[id];
      if (!product || !product.live || !product.inStock) {
        return jsonResponse({ error: 'One of the items in your cart is no longer available.' }, 400);
      }

      const quantity = raw?.quantity;
      if (!Number.isInteger(quantity) || quantity < 1) {
        return jsonResponse({ error: 'Invalid quantity in cart.' }, 400);
      }

      const total = (quantities.get(id) ?? 0) + quantity;
      if (total > MAX_QUANTITY_PER_ITEM) {
        return jsonResponse({ error: `You can order at most ${MAX_QUANTITY_PER_ITEM} of each item.` }, 400);
      }

      quantities.set(id, total);
    }

    // Confirm Stripe still charges exactly what the product pages show.
    const ids = Array.from(quantities.keys());
    try {
      await Promise.all(ids.map((id) => verifyStripePrice(stripe, id, PRODUCTS[id])));
    } catch (error) {
      if (error instanceof PriceCheckError) {
        console.error(`❌ Price check failed for ${error.productId}: ${error.message}`);
        return jsonResponse({ error: 'One of the items in your cart is temporarily unavailable. Please try again later.' }, 409);
      }
      throw error;
    }

    const lineItems = Array.from(quantities, ([id, quantity]) => ({
      price: PRODUCTS[id].priceId,
      quantity,
    }));

    const requiresShipping = Array.from(quantities.keys()).some((id) => PRODUCTS[id].physical);

    const url = new URL(request.url);
    const sessionConfig = buildSessionConfig(url.origin, lineItems, requiresShipping);

    const session = await stripe.checkout.sessions.create(sessionConfig);

    if (!session.url) {
      console.error(`❌ Stripe session ${session.id} returned no checkout URL`);
      return jsonResponse({ error: 'We could not start checkout. Please try again.' }, 502);
    }

    return jsonResponse({ url: session.url });
  } catch (error: any) {
    // Log the real cause (e.g. a deleted Stripe price) for the site owner,
    // but don't leak Stripe internals to the browser.
    console.error(`❌ Checkout error: ${error?.message ?? error}`);
    return jsonResponse({ error: 'We could not start checkout. Please try again.' }, 500);
  }
}
