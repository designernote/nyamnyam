// 저장소 계층: 지금은 IndexedDB(기기 로컬). 나중에 Supabase 등으로 바꿀 때 이 파일만 교체하면 됩니다.
const DB_NAME = 'eat-itfree';
const STORE = 'places';
let dbp;

function open() {
  dbp ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const s = req.result.createObjectStore(STORE, { keyPath: 'id' });
      s.createIndex('updatedAt', 'updatedAt');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbp;
}

async function tx(mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const result = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(result?.result ?? result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

export const listPlaces = () => tx('readonly', (s) => s.getAll());
export const getPlace = (id) => tx('readonly', (s) => s.get(id));
export const deletePlace = (id) => tx('readwrite', (s) => { s.delete(id); });
export const clearPlaces = () => tx('readwrite', (s) => { s.clear(); });

export function savePlace(place) {
  const now = Date.now();
  const rec = { ...place, createdAt: place.createdAt || now, updatedAt: now };
  return tx('readwrite', (s) => { s.put(rec); }).then(() => rec);
}

export const bulkSave = (places) => tx('readwrite', (s) => { places.forEach((p) => s.put(p)); });
