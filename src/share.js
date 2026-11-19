// 공유 링크: 맛집 정보(사진 제외)를 압축해서 URL 해시에 담습니다. 서버가 필요 없어요.
const KEYS = { name: 'n', category: 'c', rating: 'r', memo: 'm', address: 'a', lat: 'y', lng: 'x', link: 'l', visitedAt: 'v', revisit: 'w' };

function pack(p) {
  const o = {};
  for (const [k, s] of Object.entries(KEYS)) if (p[k] !== undefined && p[k] !== '' && p[k] !== null && p[k] !== false) o[s] = p[k];
  return o;
}
function unpack(o) {
  const p = {};
  for (const [k, s] of Object.entries(KEYS)) if (o[s] !== undefined) p[k] = o[s];
  return p;
}

const b64url = (bytes) => {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const unb64url = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

async function stream(bytes, T) {
  return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new T('deflate-raw'))).arrayBuffer());
}

export async function encodeShare(title, places) {
  const json = JSON.stringify({ t: title, i: places.map(pack) });
  const bytes = new TextEncoder().encode(json);
  if ('CompressionStream' in window) return '1' + b64url(await stream(bytes, CompressionStream));
  return '0' + b64url(bytes);
}

export async function decodeShare(code) {
  const ver = code[0];
  let bytes = unb64url(code.slice(1));
  if (ver === '1') bytes = await stream(bytes, DecompressionStream);
  const data = JSON.parse(new TextDecoder().decode(bytes));
  return { title: String(data.t || '공유된 맛집'), places: (data.i || []).map(unpack) };
}

export async function shareLink(title, places) {
  const code = await encodeShare(title, places);
  const url = `${location.origin}${location.pathname}#/s/${code}`;
  const text = places.length === 1 ? `🍽️ ${places[0].name} 추천해요!` : `🍽️ ${title} (${places.length}곳)`;
  if (navigator.share) {
    try { await navigator.share({ title, text, url }); return 'shared'; }
    catch (e) { if (e.name === 'AbortError') return 'cancel'; }
  }
  await navigator.clipboard.writeText(url);
  return 'copied';
}
