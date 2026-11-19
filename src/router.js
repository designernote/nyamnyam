import { runCleanups } from './util.js';

const routes = [];
export const route = (pattern, view, tab) => {
  const keys = [];
  const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => (keys.push(k), '([^/]+)')) + '$');
  routes.push({ re, keys, view, tab });
};

export const go = (path) => { location.hash = '#' + path; };

async function render() {
  const path = location.hash.slice(1) || '/';
  const el = document.getElementById('view');
  runCleanups();
  document.getElementById('topbar-actions').innerHTML = '';
  for (const r of routes) {
    const m = path.match(r.re);
    if (!m) continue;
    const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
    document.querySelectorAll('.tabbar a').forEach((a) => a.classList.toggle('active', a.dataset.tab === r.tab));
    el.innerHTML = '';
    window.scrollTo(0, 0);
    try { await r.view(el, params); }
    catch (e) { console.error(e); el.innerHTML = `<div class="empty"><p>문제가 생겼어요 😢</p><p class="muted">${e.message}</p></div>`; }
    return;
  }
  go('/');
}

export function start() {
  window.addEventListener('hashchange', render);
  render();
}
