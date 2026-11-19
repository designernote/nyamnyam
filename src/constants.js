export const CATEGORIES = [
  { id: 'korean', label: '한식', emoji: '🍚' },
  { id: 'chinese', label: '중식', emoji: '🥟' },
  { id: 'japanese', label: '일식', emoji: '🍣' },
  { id: 'western', label: '양식', emoji: '🍝' },
  { id: 'snack', label: '분식', emoji: '🍢' },
  { id: 'meat', label: '고기', emoji: '🥩' },
  { id: 'cafe', label: '카페·디저트', emoji: '☕' },
  { id: 'bar', label: '술집', emoji: '🍺' },
  { id: 'etc', label: '기타', emoji: '🍴' },
];
export const catOf = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
export const DEFAULT_CENTER = [37.5665, 126.978]; // 서울시청
