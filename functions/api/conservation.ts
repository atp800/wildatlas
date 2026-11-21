import { createTotalsReader, readOrderContribution, stripeClient, liveMode, type ConservationEnv } from '../_lib/conservation.ts';

const readCachedTotals = createTotalsReader();

export async function onRequestGet({ request, env }: { request: Request; env: ConservationEnv }) {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  const sessionId = new URL(request.url).searchParams.get('session_id');
  if (sessionId !== null && !/^cs_(test_|live_)?[A-Za-z0-9]{10,255}$/.test(sessionId)) {
    return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 400, headers });
  }
  try {
    // Purchase confirmation bypasses the aggregate cache and never scans all orders.
    const result = sessionId
      ? { contributionPence: await readOrderContribution(stripeClient(env), liveMode(env), sessionId) }
      : await readCachedTotals(env);
    // No customer information or order details are exposed by this endpoint.
    return new Response(JSON.stringify(result), { headers });
  } catch (error) {
    console.error('Conservation totals unavailable', error);
    return new Response(JSON.stringify({ error: 'Live totals are temporarily unavailable.' }), { status: 503, headers });
  }
}
