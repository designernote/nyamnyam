import { catOf, DEFAULT_CENTER } from './constants.js';
import { onCleanup } from './util.js';

export function createMap(el, { center = DEFAULT_CENTER, zoom = 13 } = {}) {
  const map = L.map(el, { zoomControl: true, attributionControl: true }).setView(center, zoom);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  // 컨테이너 크기가 렌더 후 확정되는 경우 대비
  const t = setTimeout(() => map.invalidateSize(), 50);
  onCleanup(() => {
    clearTimeout(t); map.stop();
    map._animatingZoom = false; // 줌 애니메이션 중 화면 전환 시 Leaflet 타이머 오류 방지
    map.off(); map.eachLayer((l) => l.off()); map.remove(); });
  return map;
}

export function pinIcon(category) {
  return L.divIcon({
    className: 'pin',
    html: `<span><i>${catOf(category).emoji}</i></span>`,
    iconSize: [36, 36],
    iconAnchor: [18, 34],
    popupAnchor: [0, -30],
  });
}

export const hasCoords = (p) => typeof p.lat === 'number' && typeof p.lng === 'number';

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('위치 기능을 지원하지 않는 브라우저예요'));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve([pos.coords.latitude, pos.coords.longitude]),
      () => reject(new Error('위치 권한을 허용해 주세요')),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });
}

// OpenStreetMap Nominatim 주소/장소 검색 (무료, 과도한 호출 금지 정책 있음)
export async function searchAddress(q) {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=kr&accept-language=ko&q=${encodeURIComponent(q)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('검색에 실패했어요');
  return (await res.json()).map((r) => ({ label: r.display_name, lat: +r.lat, lng: +r.lon }));
}

export const kakaoMapUrl = (p) => hasCoords(p) && !p.approx
  ? `https://map.kakao.com/link/map/${encodeURIComponent(p.name)},${p.lat},${p.lng}`
  : `https://map.kakao.com/link/search/${encodeURIComponent(p.name)}`;
export const naverMapUrl = (p) => `https://map.naver.com/p/search/${encodeURIComponent(p.address || p.name)}`;
