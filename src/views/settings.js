import { listPlaces, bulkSave, clearPlaces } from '../db.js';
import { blobToDataURL, dataURLToBlob } from '../image.js';
import { toast, today } from '../util.js';
import { installPrompt, promptInstall } from '../app.js';

export async function settingsView(el) {
  const all = await listPlaces();
  const photoCount = all.reduce((n, p) => n + (p.photos?.length || 0), 0);
  let usage = '';
  if (navigator.storage?.estimate) {
    const { usage: u } = await navigator.storage.estimate();
    usage = ` · 약 ${(u / 1024 / 1024).toFixed(1)}MB 사용 중`;
  }
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;

  el.innerHTML = `
    <section class="panel">
      <h3>내 기록</h3>
      <p>맛집 ${all.length}곳 · 사진 ${photoCount}장${usage}</p>
      <p class="muted small">기록은 이 기기의 브라우저에만 저장돼요. 기기를 바꾸거나 브라우저 데이터를 지우기 전에 꼭 백업해 주세요.</p>
    </section>

    ${standalone ? '' : `<section class="panel">
      <h3>📲 홈 화면에 설치</h3>
      <p class="muted small">앱처럼 아이콘으로 실행되고 오프라인에서도 열려요.</p>
      <button class="btn primary" id="install" ${installPrompt() ? '' : 'hidden'}>앱 설치하기</button>
      <p class="muted small" id="ios-tip" ${installPrompt() ? 'hidden' : ''}>
        iPhone: Safari의 공유 버튼 → <b>홈 화면에 추가</b><br>
        Android: Chrome 메뉴(⋮) → <b>앱 설치</b> 또는 <b>홈 화면에 추가</b></p>
    </section>`}

    <section class="panel">
      <h3>백업 / 복원</h3>
      <div class="row wrap">
        <button class="btn" id="export">⬇️ 백업 파일 저장</button>
        <label class="btn file-btn">⬆️ 백업 불러오기<input type="file" accept="application/json,.json" id="import" hidden></label>
      </div>
      <p class="muted small">백업 파일에는 사진도 포함돼요. 불러오면 같은 항목은 덮어써요.</p>
    </section>

    <section class="panel">
      <h3>데이터 초기화</h3>
      <button class="btn danger ghost" id="wipe">모든 기록 삭제</button>
    </section>

    <p class="muted small center">냠냠 맛집노트 · eat.itfree.app<br>지도 © OpenStreetMap contributors</p>`;

  el.querySelector('#install')?.addEventListener('click', promptInstall);

  el.querySelector('#export').addEventListener('click', async () => {
    const places = await Promise.all((await listPlaces()).map(async (p) => ({
      ...p, photos: await Promise.all((p.photos || []).map(blobToDataURL)),
    })));
    const blob = new Blob([JSON.stringify({ app: 'eat.itfree.app', version: 1, exportedAt: new Date().toISOString(), places })], { type: 'application/json' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `nyamnyam-backup-${today()}.json` });
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('백업 파일을 저장했어요');
  });

  el.querySelector('#import').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.places)) throw new Error();
      const places = await Promise.all(data.places.filter((p) => p.id && p.name).map(async (p) => ({
        ...p, photos: await Promise.all((p.photos || []).map(dataURLToBlob)),
      })));
      await bulkSave(places);
      toast(`${places.length}곳을 불러왔어요`);
      settingsView(el);
    } catch { toast('올바른 백업 파일이 아니에요'); }
  });

  el.querySelector('#wipe').addEventListener('click', async () => {
    if (!confirm('모든 맛집 기록과 사진이 삭제돼요. 계속할까요?')) return;
    if (!confirm('정말 삭제할까요? 되돌릴 수 없어요.')) return;
    await clearPlaces();
    toast('모두 삭제했어요');
    settingsView(el);
  });
}
