import { FAMOUS, AREAS, FAMOUS_UPDATED } from '../data/famous.js';
import { catOf } from '../constants.js';
import { listPlaces, bulkSave } from '../db.js';
import { esc, uid, toast } from '../util.js';
import { createMap } from '../mapkit.js';
import { addMarkers } from './map.js';
import { placeInfo, mountMiniMap } from './detail.js';

const state = { area: '' };
const sameKey = (p) => p.name.replace(/\s+/g, '');

async function savedNames() {
  return new Set((await listPlaces()).map(sameKey));
}

// 추천 맛집을 내 목록에 '가볼 곳'으로 저장
async function addToMine(items) {
  const have = await savedNames();
  const now = Date.now();
  const fresh = items.filter((p) => !have.has(sameKey(p))).map((p) => ({
    id: uid(), name: p.name, category: p.category, address: p.address, lat: p.lat, lng: p.lng, approx: true,
    memo: `대표 메뉴: ${p.menu}\n${p.memo}`, rating: 0, wish: true, visitedAt: '', photos: [],
    createdAt: now, updatedAt: now,
  }));
  if (fresh.length) await bulkSave(fresh);
  return fresh.length;
}

function card(p, saved) {
  const c = catOf(p.category);
  return `<a class="card" href="#/explore/${p.id}">
    <div class="thumb"><span class="thumb-emoji">${c.emoji}</span></div>
    <div class="card-body">
      <div class="card-title">${esc(p.name)} ${saved ? '<span class="badge">담음</span>' : ''}</div>
      <div class="card-meta">${esc(c.label)} · ${esc(p.area)}${p.since ? ` · ${p.since}년~` : ''}</div>
      <div class="card-sub">🍽️ ${esc(p.menu)}</div>
      <div class="card-memo">${esc(p.memo)}</div>
    </div>
  </a>`;
}

export async function exploreView(el) {
  let have = await savedNames();
  el.innerHTML = `
    <h2 class="list-title">서울 유명 맛집 <span class="muted">${FAMOUS.length}곳</span></h2>
    <p class="muted small">리뷰가 많고 오래 사랑받은 곳을 골랐어요. 정보 확인: ${FAMOUS_UPDATED} · 방문 전 영업시간을 확인하세요.</p>
    <div class="chips" id="areas">
      <button class="chip ${!state.area ? 'on' : ''}" data-a="">전체</button>
      ${AREAS.map((a) => `<button class="chip ${state.area === a ? 'on' : ''}" data-a="${esc(a)}">${esc(a)}</button>`).join('')}
    </div>
    <div class="map-mini tall" id="emap"></div>
    <div class="cards" id="cards"></div>
    <div class="form-actions sticky"><button class="btn primary" id="add-all">⭐ 이 목록 전부 '가볼 곳'에 담기</button></div>`;

  const map = createMap(el.querySelector('#emap'));
  let layer = L.layerGroup().addTo(map);
  const items = () => FAMOUS.filter((p) => !state.area || p.area === state.area);
  const draw = () => {
    const list = items();
    el.querySelector('#cards').innerHTML = list.map((p) => card(p, have.has(sameKey(p)))).join('');
    layer.remove();
    layer = L.layerGroup().addTo(map);
    addMarkers(layer, list, (p) => `#/explore/${p.id}`, map);
  };
  draw();

  el.querySelector('#areas').addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    state.area = b.dataset.a;
    el.querySelectorAll('#areas .chip').forEach((x) => x.classList.toggle('on', x === b));
    draw();
  });
  el.querySelector('#add-all').addEventListener('click', async () => {
    const n = await addToMine(items());
    toast(n ? `${n}곳을 '가볼 곳'에 담았어요` : '이미 모두 담겨 있어요');
    if (n) { have = await savedNames(); draw(); }
  });
}

export async function exploreItemView(el, { id }) {
  const p = FAMOUS.find((x) => x.id === id);
  if (!p) { location.hash = '#/explore'; return; }
  const saved = (await savedNames()).has(sameKey(p));
  el.innerHTML = `<div class="shared-banner"><a href="#/explore">← 서울 유명 맛집</a></div>
    <article class="detail">
      ${placeInfo({ ...p, memo: `대표 메뉴: ${p.menu}${p.since ? ` · ${p.since}년 개업` : ''}\n${p.memo}` })}
      <p class="muted small">지도 위치는 근사치예요. 정확한 위치는 카카오맵·네이버지도 버튼으로 확인하세요.</p>
      <div class="form-actions"><button class="btn primary" id="save" ${saved ? 'disabled' : ''}>${saved ? '✓ 이미 담았어요' : "⭐ '가볼 곳'에 담기"}</button></div>
    </article>`;
  mountMiniMap(el, p);
  el.querySelector('#save').addEventListener('click', async (e) => {
    await addToMine([p]);
    toast("'가볼 곳'에 담았어요");
    e.target.disabled = true;
    e.target.textContent = '✓ 이미 담았어요';
  });
}
