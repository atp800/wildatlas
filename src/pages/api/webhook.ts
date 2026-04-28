export const prerender = false;

import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { Resend } from 'resend';
import { getCollection } from 'astro:content';

export const POST: APIRoute = async ({ request }) => {
  const stripeKey = import.meta.env.STRIPE_SECRET_KEY;
  const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;
  const resendKey = import.meta.env.RESEND_API_KEY;

  if (!stripeKey || !webhookSecret || !resendKey) {
    return new Response('Missing Stripe or Resend Configuration', { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
  const resend = new Resend(resendKey);
  const signature = request.headers.get('stripe-signature');
  
  if (!signature) return new Response('No signature', { status: 400 });
  
  try {
    // Read the RAW body of the request (Required for Stripe signature verification)
    const body = await request.text();

    // Securely construct and verify the event using your Webhook Secret
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);

    // Handle specific events
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      if (session.payment_status === 'paid') {
        // 1. Fetch the items purchased in this session
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        
        // 2. Fetch all your Astro products to match price IDs securely
        // NOTE: Change 'products' to whatever your content collection name is
        const products = await getCollection('products');
        
        const digitalDownloads: {name: string, url: string}[] =[];
        let hasPhysical = false;

        // 3. Match Stripe purchases to your Astro files
        lineItems.data.forEach(item => {
          const matchedProduct = products.find(p => p.data.stripePriceId === item.price?.id);
          
          if (matchedProduct) {
            if (!matchedProduct.data.physical && matchedProduct.data.downloadURL) {
              // Add a base URL so the link works in the email
              const fullUrl = new URL(matchedProduct.data.downloadURL, request.url).toString();
              digitalDownloads.push({
                name: matchedProduct.data.title,
                url: fullUrl
              });
            } else if (matchedProduct.data.physical) {
              hasPhysical = true;
            }
          }
        });

        // 4. Send the Email using Resend
        const customerEmail = session.customer_details?.email;
        const customerName = session.customer_details?.name || 'there';

        if (customerEmail) {
          let emailHtml = `<h1>Thank you for your order, ${customerName}! 🌊</h1>`;
          emailHtml += `<p>Your payment of ${(session.amount_total! / 100).toFixed(2)} was successful.</p>`;
          
          if (digitalDownloads.length > 0) {
            emailHtml += `<h2>Your Digital Downloads:</h2><ul>`;
            digitalDownloads.forEach(dl => {
              emailHtml += `<li><a href="${dl.url}" target="_blank">Download ${dl.name}</a></li>`;
            });
            emailHtml += `</ul>`;
          }
          
          if (hasPhysical) {
            emailHtml += `<p>We are currently preparing the physical items in your order. We'll send another email as soon as they ship!</p>`;
          }

          await resend.emails.send({
            from: 'Wild Atlas <orders@wildatlas.org>', // MUST be a verified domain in Resend
            to: customerEmail,
            subject: 'Order Confirmation & Downloads - Wild Atlas',
            html: emailHtml,
          });
          
          console.log(`✅ Email sent to ${customerEmail}`);
        }
      }
    } 

    return new Response(JSON.stringify({ received: true }), { status: 200 });

  } catch (err: any) {
    console.error(`❌ Webhook Error: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
};