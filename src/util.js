const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));

export const stars = (n) => '★'.repeat(n || 0) + '☆'.repeat(5 - (n || 0));

export const today = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export const fmtDate = (s) => (s ? s.replaceAll('-', '.') : '');

let toastTimer;
export function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

// 화면 전환 시 해제할 objectURL / 지도 등 정리
const cleanups = [];
export const onCleanup = (fn) => cleanups.push(fn);
export const runCleanups = () => { while (cleanups.length) { try { cleanups.pop()(); } catch {} } };

export function blobUrl(blob) {
  const url = URL.createObjectURL(blob);
  onCleanup(() => URL.revokeObjectURL(url));
  return url;
}

export function safeUrl(u) {
  try {
    const url = new URL(u);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
  } catch { return ''; }
}

export function setActions(html) {
  document.getElementById('topbar-actions').innerHTML = html;
}
