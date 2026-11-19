# 🍽️ 냠냠 맛집노트 — eat.itfree.app

다녀온 맛집을 기록하고, 링크 하나로 친구에게 공유하는 PWA입니다.
빌드 없이 정적 파일만으로 동작하며 GitHub Pages로 배포합니다.

## 기능
- 맛집 기록: 이름, 카테고리, 평점, 방문일, "또 갈래요", 위치(지도 탭/현재 위치/주소 검색), 링크, 메모, 사진(최대 6장, 자동 리사이즈)
- 목록: 검색, 카테고리·평점 필터, 정렬
- 지도: 전체 맛집을 카테고리 이모지 핀으로 표시
- 공유: 맛집 1곳 또는 필터된 목록을 **URL 하나로 공유** (데이터를 압축해 URL `#` 뒤에 담음, 서버 없음, 사진 제외)
  - 받은 사람은 링크만 열면 보고, "내 맛집에 담기"로 저장 가능
- 카카오맵/네이버지도 바로가기
- 백업/복원(JSON, 사진 포함), 홈 화면 설치, 오프라인 동작

## 구조
```
index.html, manifest.webmanifest, sw.js(서비스워커), CNAME
src/
  app.js        라우트 등록, 설치 프롬프트, SW 등록
  router.js     해시 라우터 (#/, #/map, #/new, #/p/:id, #/s/:data, #/settings)
  db.js         저장소 계층 (IndexedDB) ← Supabase 등으로 교체 시 이 파일만 수정
  share.js      공유 링크 인코딩/디코딩 (deflate + base64url)
  mapkit.js     Leaflet 지도, 위치, 주소 검색(Nominatim)
  image.js      사진 리사이즈, 백업용 변환
  views/        화면별 모듈
vendor/leaflet  Leaflet 1.9.4 (BSD-2)
```

## 로컬 실행
```bash
python3 -m http.server 8080
# http://localhost:8080
```
서비스워커는 `localhost` 또는 HTTPS에서만 동작합니다.

## 배포 (GitHub Pages + eat.itfree.app)
1. 저장소 **Settings → Pages** → Source: `Deploy from a branch`, Branch: `main` / `/ (root)`
2. Custom domain에 `eat.itfree.app` 입력 (CNAME 파일 포함되어 있음)
3. itfree.app DNS에 레코드 추가: `eat  CNAME  designernote.github.io`
4. DNS 반영 후 **Enforce HTTPS** 체크

## 업데이트 배포 시 주의
앱 파일을 수정했다면 `sw.js`의 `VERSION`을 올려야 사용자 기기에 새 버전이 반영됩니다.
새 파일을 추가했다면 `SHELL_FILES`에도 추가하세요.

## 데이터 관련
- 모든 기록은 사용자 기기의 브라우저(IndexedDB)에만 저장됩니다. 서버로 전송되지 않습니다.
- 지도 타일과 주소 검색은 OpenStreetMap을 사용합니다 (API 키 불필요).

## 다음 단계 아이디어
- Supabase 연동: 로그인, 기기 간 동기화, 사진 포함 공유
- 카카오 로컬 API로 국내 장소 검색 정확도 향상
