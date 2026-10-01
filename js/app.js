import { renderToday } from './today.js';
import { renderDashboard } from './dashboard.js';

const main = document.getElementById('view');

// Routes: #today, #today/2026-10-05, #dashboard
function route() {
  const [name, arg] = (location.hash.slice(1) || 'today').split('/');
  const view = document.createElement('div');
  main.replaceChildren(view);
  if (name === 'dashboard') renderDashboard(view);
  else renderToday(view, /^\d{4}-\d{2}-\d{2}$/.test(arg || '') ? arg : undefined);

  document.querySelectorAll('.tabbar a').forEach((a) =>
    a.setAttribute('aria-current', a.dataset.tab === (name === 'dashboard' ? 'dashboard' : 'today') ? 'page' : 'false'));
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', route);
// The date may have rolled over while the app sat in the background.
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && !document.activeElement?.matches('input, textarea')) route();
});
route();

navigator.storage?.persist?.();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
