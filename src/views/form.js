import { getPlace, savePlace } from '../db.js';
import { CATEGORIES, DEFAULT_CENTER } from '../constants.js';
import { esc, uid, today, toast, blobUrl, $ } from '../util.js';
import { resizeImage } from '../image.js';
import { createMap, pinIcon, hasCoords, getCurrentPosition, searchAddress } from '../mapkit.js';
import { go } from '../router.js';

const MAX_PHOTOS = 6;

export async function formView(el, { id } = {}) {
  const editing = id ? await getPlace(id) : null;
  if (id && !editing) return go('/');
  const p = editing || { id: uid(), category: 'korean', rating: 4, visitedAt: today(), photos: [] };
  let photos = [...(p.photos || [])];
  let coords = hasCoords(p) ? [p.lat, p.lng] : null;

  el.innerHTML = `
    <form class="form" id="f" novalidate>
      <h2>${editing ? '맛집 수정' : '맛집 기록하기'}</h2>

      <label>가게 이름 *<input name="name" required maxlength="60" value="${esc(p.name)}" placeholder="예: 을지로 노가리집"></label>

      <fieldset><legend>카테고리</legend>
        <div class="chips wrap">
          ${CATEGORIES.map((c) => `<label class="chip-radio"><input type="radio" name="category" value="${c.id}" ${p.category === c.id ? 'checked' : ''}><span>${c.emoji} ${c.label}</span></label>`).join('')}
        </div>
      </fieldset>

      <fieldset><legend>평점</legend>
        <div class="rating" id="rating">
          ${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-n="${n}" aria-label="${n}점">★</button>`).join('')}
        </div>
      </fieldset>

      <div class="row2">
        <label>방문일<input type="date" name="visitedAt" value="${esc(p.visitedAt)}"></label>
        <label class="check"><input type="checkbox" name="revisit" ${p.revisit ? 'checked' : ''}> 또 갈래요</label>
      </div>

      <fieldset><legend>위치</legend>
        <div class="search-row">
          <input name="address" value="${esc(p.address)}" placeholder="주소 또는 장소 검색" autocomplete="off">
          <button type="button" class="btn" id="search">검색</button>
        </div>
        <ul class="results" id="results"></ul>
        <div class="map-mini" id="pick"></div>
        <div class="row">
          <button type="button" class="btn small" id="here">📍 현재 위치</button>
          <button type="button" class="btn small ghost" id="clear-loc">위치 지우기</button>
          <span class="muted small">지도를 탭하면 위치가 지정돼요</span>
        </div>
      </fieldset>

      <label>링크 (카카오맵·네이버·인스타 등)<input name="link" type="url" inputmode="url" value="${esc(p.link)}" placeholder="https://"></label>

      <label>메모<textarea name="memo" rows="4" maxlength="1000" placeholder="추천 메뉴, 웨이팅, 분위기...">${esc(p.memo)}</textarea></label>

      <fieldset><legend>사진 (최대 ${MAX_PHOTOS}장)</legend>
        <div class="photos" id="photos"></div>
        <label class="btn small file-btn">📷 사진 추가<input type="file" accept="image/*" multiple id="file" hidden></label>
      </fieldset>

      <div class="form-actions">
        <a class="btn ghost" href="${editing ? `#/p/${p.id}` : '#/'}">취소</a>
        <button class="btn primary" type="submit">저장</button>
      </div>
    </form>`;

  // 평점
  let rating = p.rating || 0;
  const drawRating = () => el.querySelectorAll('#rating button').forEach((b) => b.classList.toggle('on', +b.dataset.n <= rating));
  el.querySelector('#rating').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) { rating = +b.dataset.n; drawRating(); }
  });
  drawRating();

  // 지도에서 위치 선택
  const map = createMap(el.querySelector('#pick'), { center: coords || DEFAULT_CENTER, zoom: coords ? 16 : 12 });
  let marker = null;
  const setCoords = (c, zoom) => {
    coords = c;
    marker?.remove(); marker = null;
    if (!c) return;
    const cat = new FormData($('#f')).get('category');
    marker = L.marker(c, { icon: pinIcon(cat), draggable: true }).addTo(map);
    marker.on('dragend', () => { const ll = marker.getLatLng(); coords = [ll.lat, ll.lng]; });
    if (zoom) map.setView(c, zoom);
  };
  setCoords(coords);
  map.on('click', (e) => setCoords([e.latlng.lat, e.latlng.lng]));
  el.querySelectorAll('input[name=category]').forEach((r) => r.addEventListener('change', () => setCoords(coords)));

  el.querySelector('#here').addEventListener('click', async () => {
    try { setCoords(await getCurrentPosition(), 17); } catch (e) { toast(e.message); }
  });
  el.querySelector('#clear-loc').addEventListener('click', () => setCoords(null));

  const results = el.querySelector('#results');
  const doSearch = async () => {
    const q = el.querySelector('[name=address]').value.trim();
    if (!q) return;
    results.innerHTML = '<li class="muted">검색 중...</li>';
    try {
      const list = await searchAddress(q);
      results.innerHTML = list.length
        ? list.map((r, i) => `<li><button type="button" data-i="${i}">${esc(r.label)}</button></li>`).join('')
        : '<li class="muted">결과가 없어요. 지도를 직접 탭해 위치를 지정해 주세요.</li>';
      results.onclick = (e) => {
        const b = e.target.closest('button[data-i]');
        if (!b) return;
        const r = list[+b.dataset.i];
        setCoords([r.lat, r.lng], 17);
        results.innerHTML = '';
      };
    } catch (e) { results.innerHTML = `<li class="muted">${esc(e.message)}</li>`; }
  };
  el.querySelector('#search').addEventListener('click', doSearch);
  el.querySelector('[name=address]').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); doSearch(); } });

  // 사진
  const drawPhotos = () => {
    el.querySelector('#photos').innerHTML = photos.map((b, i) =>
      `<div class="photo"><img src="${blobUrl(b)}" alt=""><button type="button" data-i="${i}" aria-label="삭제">✕</button></div>`).join('');
  };
  drawPhotos();
  el.querySelector('#photos').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-i]');
    if (b) { photos.splice(+b.dataset.i, 1); drawPhotos(); }
  });
  el.querySelector('#file').addEventListener('change', async (e) => {
    const files = [...e.target.files].slice(0, MAX_PHOTOS - photos.length);
    if (e.target.files.length > files.length) toast(`사진은 최대 ${MAX_PHOTOS}장까지예요`);
    for (const f of files) photos.push(await resizeImage(f));
    e.target.value = '';
    drawPhotos();
  });

  // 저장
  el.querySelector('#f').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const name = fd.get('name').trim();
    if (!name) { toast('가게 이름을 입력해 주세요'); e.target.name.focus(); return; }
    const rec = {
      ...p,
      name,
      category: fd.get('category'),
      rating,
      visitedAt: fd.get('visitedAt'),
      revisit: fd.get('revisit') === 'on',
      address: fd.get('address').trim(),
      link: fd.get('link').trim(),
      memo: fd.get('memo').trim(),
      photos,
      lat: coords ? +coords[0].toFixed(6) : undefined,
      lng: coords ? +coords[1].toFixed(6) : undefined,
    };
    try {
      await savePlace(rec);
    } catch (err) {
      return toast(err.name === 'QuotaExceededError' ? '저장공간이 부족해요. 사진을 줄여 주세요.' : '저장에 실패했어요');
    }
    toast(editing ? '수정했어요' : '저장했어요 🎉');
    go(`/p/${rec.id}`);
  });
}
