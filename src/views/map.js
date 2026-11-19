import { listPlaces } from '../db.js';
import { catOf } from '../constants.js';
import { esc, stars, toast } from '../util.js';
import { createMap, pinIcon, hasCoords, getCurrentPosition } from '../mapkit.js';

export function addMarkers(map, places, hrefOf) {
  const pts = [];
  for (const p of places.filter(hasCoords)) {
    pts.push([p.lat, p.lng]);
    L.marker([p.lat, p.lng], { icon: pinIcon(p.category) }).addTo(map).bindPopup(
      `<a class="popup" href="${hrefOf(p)}"><b>${esc(p.name)}</b><br><span class="stars">${stars(p.rating)}</span> ${esc(catOf(p.category).label)}</a>`);
  }
  if (pts.length === 1) map.setView(pts[0], 16);
  else if (pts.length > 1) map.fitBounds(pts, { padding: [40, 40], maxZoom: 16 });
  return pts.length;
}

export async function mapView(el) {
  const all = await listPlaces();
  el.innerHTML = `<div class="map-full" id="map"></div>
    <button class="fab-loc" id="loc" title="내 위치">📍</button>`;
  el.classList.add('no-pad');
  const map = createMap(el.querySelector('#map'));
  const n = addMarkers(map, all, (p) => `#/p/${p.id}`);
  if (!n) toast(all.length ? '위치가 등록된 맛집이 없어요' : '맛집을 추가하면 지도에 표시돼요');

  let me;
  el.querySelector('#loc').addEventListener('click', async () => {
    try {
      const pos = await getCurrentPosition();
      me?.remove();
      me = L.circleMarker(pos, { radius: 8, color: '#fff', weight: 3, fillColor: '#2a7fff', fillOpacity: 1 }).addTo(map);
      map.setView(pos, 15);
    } catch (e) { toast(e.message); }
  });
}
