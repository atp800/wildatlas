export function startConservationTracker() {
  const total = document.getElementById('conservation-total');
  const period = document.getElementById('conservation-period');
  const status = document.getElementById('conservation-status');
  if (!total || !period || !status) return;
  const money = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });
  let pending = false;
  let loaded = false;
  async function refresh() {
    if (pending || document.hidden) return;
    pending = true;
    try {
      const response = await fetch('/api/conservation', { cache: 'no-store', signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error('Unavailable');
      const data = await response.json();
      if (!Number.isSafeInteger(data.committedPence) || data.committedPence < 0 || typeof data.period !== 'string') {
        throw new Error('Invalid total');
      }
      total!.textContent = money.format(data.committedPence / 100);
      total!.removeAttribute('aria-label');
      period!.textContent = data.period;
      status!.textContent = 'Updates automatically, usually within a minute of payment confirmation.';
      loaded = true;
    } catch {
      status!.textContent = loaded
        ? 'Showing the last available total. Reconnecting…'
        : 'Live totals are temporarily unavailable. Please check again shortly.';
      if (!loaded) total!.setAttribute('aria-label', 'Total unavailable');
    } finally {
      pending = false;
    }
  }
  void refresh();
  const timer = window.setInterval(refresh, 15000);
  document.addEventListener('visibilitychange', refresh);
  document.addEventListener('astro:before-swap', () => {
    window.clearInterval(timer);
    document.removeEventListener('visibilitychange', refresh);
  }, { once: true });
}
