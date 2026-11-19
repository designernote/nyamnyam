import { listPlaces } from '../db.js';
import { CATEGORIES, catOf } from '../constants.js';
import { esc, stars, fmtDate, blobUrl, setActions, toast } from '../util.js';
import { shareLink } from '../share.js';

const state = { q: '', cat: '', sort: 'recent', minRating: 0 };

export function placeCard(p, href) {
  const c = catOf(p.category);
  const thumb = p.photos?.[0]
    ? `<img src="${blobUrl(p.photos[0])}" alt="" loading="lazy">`
    : `<span class="thumb-emoji">${c.emoji}</span>`;
  return `<a class="card" href="${href}">
    <div class="thumb">${thumb}</div>
    <div class="card-body">
      <div class="card-title">${esc(p.name)} ${p.revisit ? '<span class="badge">또 갈래요</span>' : ''}</div>
      <div class="card-meta"><span class="stars">${stars(p.rating)}</span> · ${esc(c.label)}${p.visitedAt ? ' · ' + fmtDate(p.visitedAt) : ''}</div>
      ${p.address ? `<div class="card-sub">${esc(p.address)}</div>` : ''}
      ${p.memo ? `<div class="card-memo">${esc(p.memo)}</div>` : ''}
    </div>
  </a>`;
}

function filtered(all) {
  const q = state.q.trim().toLowerCase();
  const out = all.filter((p) =>
    (!state.cat || p.category === state.cat) &&
    (p.rating || 0) >= state.minRating &&
    (!q || [p.name, p.address, p.memo].some((v) => v?.toLowerCase().includes(q))));
  const by = {
    recent: (a, b) => (b.visitedAt || '').localeCompare(a.visitedAt || '') || b.updatedAt - a.updatedAt,
    rating: (a, b) => (b.rating || 0) - (a.rating || 0),
    name: (a, b) => a.name.localeCompare(b.name, 'ko'),
  }[state.sort];
  return out.sort(by);
}

export async function listView(el) {
  const all = await listPlaces();

  if (!all.length) {
    el.innerHTML = `<div class="empty">
      <div class="empty-emoji">🍜</div>
      <h2>아직 기록한 맛집이 없어요</h2>
      <p class="muted">다녀온 맛집을 기록하고<br>친구에게 링크로 공유해 보세요.</p>
      <a class="btn primary" href="#/new">첫 맛집 기록하기</a>
    </div>`;
    return;
  }

  setActions(`<button class="icon-btn" id="share-list" title="목록 공유">📤</button>`);

  el.innerHTML = `
    <div class="filters">
      <input type="search" id="q" placeholder="이름, 주소, 메모 검색" value="${esc(state.q)}">
      <div class="chips" id="chips">
        <button class="chip ${!state.cat ? 'on' : ''}" data-cat="">전체</button>
        ${CATEGORIES.map((c) => `<button class="chip ${state.cat === c.id ? 'on' : ''}" data-cat="${c.id}">${c.emoji} ${c.label}</button>`).join('')}
      </div>
      <div class="row">
        <select id="sort">
          <option value="recent">최근 방문순</option>
          <option value="rating">평점순</option>
          <option value="name">이름순</option>
        </select>
        <select id="min">
          <option value="0">평점 전체</option>
          <option value="3">★3 이상</option>
          <option value="4">★4 이상</option>
          <option value="5">★5만</option>
        </select>
        <span class="muted" id="count"></span>
      </div>
    </div>
    <div class="cards" id="cards"></div>`;

  el.querySelector('#sort').value = state.sort;
  el.querySelector('#min').value = String(state.minRating);

  const draw = () => {
    const items = filtered(all);
    el.querySelector('#count').textContent = `${items.length} / ${all.length}곳`;
    el.querySelector('#cards').innerHTML = items.length
      ? items.map((p) => placeCard(p, `#/p/${p.id}`)).join('')
      : `<p class="empty muted">조건에 맞는 맛집이 없어요</p>`;
  };
  draw();

  el.querySelector('#q').addEventListener('input', (e) => { state.q = e.target.value; draw(); });
  el.querySelector('#sort').addEventListener('change', (e) => { state.sort = e.target.value; draw(); });
  el.querySelector('#min').addEventListener('change', (e) => { state.minRating = +e.target.value; draw(); });
  el.querySelector('#chips').addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    state.cat = b.dataset.cat;
    el.querySelectorAll('.chip').forEach((x) => x.classList.toggle('on', x === b));
    draw();
  });

  document.getElementById('share-list').addEventListener('click', async () => {
    const items = filtered(all);
    if (!items.length) return toast('공유할 맛집이 없어요');
    const title = prompt('공유할 목록 이름', state.cat ? `내 ${catOf(state.cat).label} 맛집` : '내 맛집 리스트');
    if (title === null) return;
    const r = await shareLink(title || '내 맛집 리스트', items);
    if (r === 'copied') toast(`링크를 복사했어요 (${items.length}곳, 사진 제외)`);
  });
}
