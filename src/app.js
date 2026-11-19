import { route, start } from './router.js';
import { listView } from './views/list.js';
import { mapView } from './views/map.js';
import { formView } from './views/form.js';
import { detailView } from './views/detail.js';
import { sharedView, sharedItemView } from './views/shared.js';
import { settingsView } from './views/settings.js';
import { exploreView, exploreItemView } from './views/explore.js';

const clean = (fn) => (el, params) => { el.classList.remove('no-pad'); return fn(el, params); };

route('/', clean(listView), 'list');
route('/map', clean(mapView), 'map');
route('/new', clean(formView), 'new');
route('/p/:id', clean(detailView), 'list');
route('/p/:id/edit', clean(formView), 'list');
route('/s/:data', clean(sharedView), '');
route('/s/:data/:i', clean(sharedItemView), '');
route('/settings', clean(settingsView), 'settings');
route('/explore', clean(exploreView), 'explore');
route('/explore/:id', clean(exploreItemView), 'explore');

// 설치 프롬프트 (Android/데스크톱 Chrome)
let deferred = null;
export const installPrompt = () => deferred;
export async function promptInstall() {
  if (!deferred) return;
  deferred.prompt();
  await deferred.userChoice;
  deferred = null;
  document.getElementById('install')?.setAttribute('hidden', '');
}
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferred = e;
  document.getElementById('install')?.removeAttribute('hidden');
  document.getElementById('ios-tip')?.setAttribute('hidden', '');
});

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(console.error);
}

// 저장소가 브라우저에 의해 임의로 지워지지 않도록 요청
navigator.storage?.persist?.();

start();
