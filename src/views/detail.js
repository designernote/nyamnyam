import { getPlace, deletePlace } from '../db.js';
import { catOf } from '../constants.js';
import { esc, stars, fmtDate, blobUrl, safeUrl, toast, setActions, ask } from '../util.js';
import { createMap, pinIcon, hasCoords, kakaoMapUrl, naverMapUrl } from '../mapkit.js';
import { shareLink } from '../share.js';
import { go } from '../router.js';

export function placeInfo(p) {
  const c = catOf(p.category);
  const link = safeUrl(p.link);
  return `
    <h2 class="detail-title">${esc(p.name)}</h2>
    <div class="detail-meta">
      <span class="stars big">${stars(p.rating)}</span>
      <span class="tag">${c.emoji} ${esc(c.label)}</span>
      ${p.revisit ? '<span class="badge">또 갈래요</span>' : ''}
    </div>
    ${p.visitedAt ? `<p class="muted">🗓️ ${fmtDate(p.visitedAt)} 방문</p>` : ''}
    ${p.address ? `<p>📍 ${esc(p.address)}</p>` : ''}
    ${p.memo ? `<p class="memo">${esc(p.memo)}</p>` : ''}
    ${link ? `<p><a href="${esc(link)}" target="_blank" rel="noopener">🔗 ${esc(new URL(link).hostname)}</a></p>` : ''}
    ${hasCoords(p) ? '<div class="map-mini" id="dmap"></div>' : ''}
    <div class="row wrap">
      <a class="btn small" href="${kakaoMapUrl(p)}" target="_blank" rel="noopener">카카오맵</a>
      <a class="btn small" href="${naverMapUrl(p)}" target="_blank" rel="noopener">네이버지도</a>
    </div>`;
}

export function mountMiniMap(el, p) {
  const box = el.querySelector('#dmap');
  if (!box) return;
  const map = createMap(box, { center: [p.lat, p.lng], zoom: 16 });
  L.marker([p.lat, p.lng], { icon: pinIcon(p.category) }).addTo(map);
}

export async function detailView(el, { id }) {
  const p = await getPlace(id);
  if (!p) { toast('맛집을 찾을 수 없어요'); return go('/'); }

  setActions(`<a class="icon-btn" href="#/p/${p.id}/edit" title="수정">✏️</a>`);

  el.innerHTML = `
    ${p.photos?.length ? `<div class="gallery">${p.photos.map((b) => `<img src="${blobUrl(b)}" alt="">`).join('')}</div>` : ''}
    <article class="detail">
      ${placeInfo(p)}
      <div class="form-actions">
        <button class="btn danger ghost" id="del">삭제</button>
        <button class="btn primary" id="share">📤 공유하기</button>
      </div>
    </article>`;
  mountMiniMap(el, p);

  el.querySelector('#share').addEventListener('click', async () => {
    const r = await shareLink(p.name, [p]);
    if (r === 'copied') toast('링크를 복사했어요 (사진 제외)');
  });
  el.querySelector('#del').addEventListener('click', async () => {
    if (!(await ask({ title: `'${p.name}'을(를) 삭제할까요?`, message: '사진과 메모도 함께 삭제돼요.', ok: '삭제', danger: true }))) return;
    await deletePlace(p.id);
    toast('삭제했어요');
    go('/');
  });
}
