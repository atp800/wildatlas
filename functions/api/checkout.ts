import Stripe from 'stripe';

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


export async function onRequestPost({ request, env }) {
  try {
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient()
    });

    const body = await request.json();
    const items = body.items;

    const requiresShipping = items.some((item: any) => item.physical === true);

    const lineItems = items.map((item: any) => ({
      price: item.priceId,
      quantity: item.quantity,
    }));

    const url = new URL(request.url);

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${url.origin}/success`, // Simplified!
      cancel_url: `${url.origin}/cart`,
    };

    if (requiresShipping) {
      sessionConfig.shipping_address_collection = {
        allowed_countries: ALLOWED_COUNTRIES as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[],
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return new Response(JSON.stringify({ url: session.url }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}