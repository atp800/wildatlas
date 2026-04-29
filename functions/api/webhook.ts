import Stripe from 'stripe';
import { Resend } from 'resend';

export async function onRequestPost({ request, env }) {
  // Initialize Stripe and Resend using Cloudflare's env variables (not import.meta.env)
  const stripe = new Stripe(env.STRIPE_SECRET_KEY.trim(), { 
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient() 
  });
  const resend = new Resend(env.RESEND_API_KEY.trim());
  const signature = request.headers.get('stripe-signature');
  
  if (!signature) return new Response('No signature', { status: 400 });
  
  try {
    const body = await request.text();
    const event = await stripe.webhooks.constructEventAsync(body, signature, env.STRIPE_WEBHOOK_SECRET);

    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      if (session.payment_status === 'paid') {
        // "expand" tells Stripe to send us the Product Metadata we saved in the dashboard!
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
          expand: ['data.price.product']
        });
        
        const digitalDownloads: {name: string, url: string}[] =[];
        let hasPhysical = false;

        lineItems.data.forEach(item => {
          // Because we "expanded" the product, item.price.product is a full Product object
          const product = item.price?.product as Stripe.Product;
          
          if (product && product.metadata) {
            // Read metadata directly from Stripe
            const isPhysical = product.metadata.physical === 'true'; 
            const downloadURL = product.metadata.downloadURL;

            if (!isPhysical && downloadURL) {
              // Ensure URL is absolute so it works in the email
              let fullUrl = downloadURL;
              if (!fullUrl.startsWith('http')) {
                const urlObj = new URL(request.url);
                fullUrl = `${urlObj.origin}${fullUrl.startsWith('/') ? '' : '/'}${fullUrl}`;
              }
              digitalDownloads.push({
                name: product.name,
                url: fullUrl
              });
            } else if (isPhysical) {
              hasPhysical = true;
            }
          }
        });

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
            from: 'Wild Atlas <orders@wildatlas.org>',
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
}