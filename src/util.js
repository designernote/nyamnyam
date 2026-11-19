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

// 앱 내 대화상자 (브라우저 기본 confirm/prompt 대체)
// input이 있으면 입력값(문자열) 또는 null, 없으면 true/false를 돌려줍니다.
export function ask({ title, message = '', input = null, readonly = false, ok = '확인', cancel = '취소', danger = false }) {
  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.className = 'modal-back';
    wrap.innerHTML = `<form class="modal" role="dialog" aria-modal="true">
      <h3>${esc(title)}</h3>
      ${message ? `<p class="muted">${esc(message)}</p>` : ''}
      ${input !== null ? `<input name="v" value="${esc(input)}" ${readonly ? 'readonly' : ''}>` : ''}
      <div class="form-actions">
        ${cancel ? `<button type="button" class="btn ghost" data-act="no">${esc(cancel)}</button>` : ''}
        <button type="submit" class="btn ${danger ? 'danger' : 'primary'}">${esc(ok)}</button>
      </div></form>`;
    document.body.appendChild(wrap);
    const field = wrap.querySelector('input');
    (field || wrap.querySelector('[type=submit]')).focus();
    if (field && readonly) field.select();
    const done = (v) => { wrap.remove(); resolve(v); };
    wrap.querySelector('form').addEventListener('submit', (e) => { e.preventDefault(); done(field ? field.value : true); });
    wrap.querySelector('[data-act=no]')?.addEventListener('click', () => done(field ? null : false));
    wrap.addEventListener('click', (e) => { if (e.target === wrap) done(field ? null : false); });
    wrap.addEventListener('keydown', (e) => { if (e.key === 'Escape') done(field ? null : false); });
  });
}
