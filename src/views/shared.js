import { decodeShare } from '../share.js';
import { listPlaces, bulkSave } from '../db.js';
import { esc, uid, toast } from '../util.js';
import { placeCard } from './list.js';
import { placeInfo, mountMiniMap } from './detail.js';
import { createMap } from '../mapkit.js';
import { addMarkers } from './map.js';

// 받은 맛집을 내 목록에 담기 (이름+좌표가 같으면 중복으로 보고 건너뜀)
async function importPlaces(places) {
  const mine = await listPlaces();
  const key = (p) => `${p.name}|${p.lat ?? ''}|${p.lng ?? ''}`;
  const have = new Set(mine.map(key));
  const now = Date.now();
  const fresh = places.filter((p) => !have.has(key(p)))
    .map((p) => ({ ...p, id: uid(), photos: [], createdAt: now, updatedAt: now, sharedFrom: true }));
  if (fresh.length) await bulkSave(fresh);
  return fresh.length;
}

export async function sharedView(el, { data }) {
  let shared;
  try { shared = await decodeShare(data); }
  catch { el.innerHTML = '<div class="empty"><p>공유 링크가 올바르지 않아요 😢</p><a class="btn" href="#/">내 맛집으로</a></div>'; return; }
  const { title, places } = shared;

  const save = async (list) => {
    const n = await importPlaces(list);
    toast(n ? `${n}곳을 내 맛집에 담았어요` : '이미 모두 담겨 있어요');
  };

  if (places.length === 1) {
    const p = places[0];
    el.innerHTML = `<div class="shared-banner">🎁 친구가 맛집을 공유했어요</div>
      <article class="detail">${placeInfo(p)}
        <div class="form-actions"><button class="btn primary" id="save">⭐ 내 맛집에 담기</button></div>
      </article>`;
    mountMiniMap(el, p);
    el.querySelector('#save').addEventListener('click', () => save(places));
    return;
  }

  el.innerHTML = `<div class="shared-banner">🎁 친구가 맛집 리스트를 공유했어요</div>
    <h2 class="list-title">${esc(title)} <span class="muted">${places.length}곳</span></h2>
    <div class="map-mini tall" id="smap"></div>
    <div class="cards">${places.map((p, i) => placeCard(p, `#/s/${data}/${i}`)).join('')}</div>
    <div class="form-actions sticky"><button class="btn primary" id="save">⭐ 전부 내 맛집에 담기</button></div>`;
  const map = createMap(el.querySelector('#smap'));
  if (!addMarkers(map, places, (p) => `#/s/${data}/${places.indexOf(p)}`)) el.querySelector('#smap').remove();
  el.querySelector('#save').addEventListener('click', () => save(places));
}

export async function sharedItemView(el, { data, i }) {
  let shared;
  try { shared = await decodeShare(data); } catch { location.hash = '#/'; return; }
  const p = shared.places[+i];
  if (!p) { location.hash = `#/s/${data}`; return; }
  el.innerHTML = `<div class="shared-banner"><a href="#/s/${data}">← ${esc(shared.title)}</a></div>
    <article class="detail">${placeInfo(p)}
      <div class="form-actions"><button class="btn primary" id="save">⭐ 내 맛집에 담기</button></div>
    </article>`;
  mountMiniMap(el, p);
  el.querySelector('#save').addEventListener('click', async () => {
    const n = await importPlaces([p]);
    toast(n ? '내 맛집에 담았어요' : '이미 담겨 있어요');
  });
}
