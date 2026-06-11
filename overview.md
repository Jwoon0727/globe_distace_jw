# Overview — 구현 계획

> 터미널 1(Opus)이 이 문서에 계획을 작성하고, 터미널 2(Sonnet)가 이 문서를 기준으로 구현을 실행합니다.

---

## 0. 사용자 원본 메모 (Raw Notes)

- DB 사용하지 않음 → 더미데이터 사용 (데이터 양 적음)
- 더미데이터에 주소들이 있음
- 그 주소를 탭하고, 도착하는 주소를 input 박스에 넣어서 거리측정
- 네이버 지도([https://map.naver.com/)로](https://map.naver.com/)로) 들어가서 출발 → 도착을 보여주는 기능
- 최근 검색을 globe 지도 밑에 표시 (localStorage 사용)
- 스타일은 글래스모피즘

### 0-1. 추가 수정사항 (Revisions)

- **네이버 API 키 사용 안 함** → Geocoding 미사용. URL 경로에 좌표를 직접 덧붙여 네이버 지도 URL로 이동.
- **더미주소 5개 미만** (4~5개)
- **"회중찾기" 버튼 추가** → `<a>` 태그 링크로 hub.jw.org 집회찾기 페이지 이동. 이동 중 로그인 필요할 수 있으나 사용자가 직접 처리.
- **"stream" 버튼 추가** → `<a target="_blank">` 링크로 `https://stream.jw.org/home` 이동. (회중찾기와 동일한 외부 링크 패턴, 글래스모피즘 버튼)

---

## 1. 목표 (Goal)

회전하는 dot-matrix globe 화면 아래에서, **더미 주소 목록에서 출발지를 선택**하고 **도착 주소를 입력(자동완성)**하면, **네이버 지도 길찾기**를 새 탭으로 열어 출발→도착 경로/거리를 보여주는 단일 페이지 앱. 추가로 **회중찾기 / stream 외부 링크 버튼** 제공. 검색 기록은 localStorage에 저장해 globe 아래 표시. 전체 UI는 글래스모피즘.

## 2. 확정된 결정사항 (Decisions)


| 항목        | 결정                                |
| --------- | --------------------------------- |
| DB        | 사용 안 함, 더미데이터                     |
| 네이버 지도 연동 | **새 탭으로 열기** (`window.open`)      |
| 거리측정      | 앱 내 계산 없음, **네이버 길찾기로만** 표시       |
| 네이버 API   | **사용 안 함** (Geocoding 없음)         |
| 출발지 데이터   | 더미데이터에 **주소 + 위경도 좌표** 포함         |
| 도착지 입력    | **input 자동완성** — 더미 목록과 매칭해 좌표 확보 |
| 좌표 → URL  | **URL 경로에 좌표 직접 조립**              |
| 최근 검색     | **localStorage** 저장, globe 아래 표시  |
| 회중찾기      | `**<a target="_blank">` 링크 버튼**   |
| stream      | **`<a target="_blank">` 링크 버튼** → stream.jw.org/home |
| 레이아웃      | **상단 globe + 하단 패널** (세로 배치)      |
| 스타일       | **글래스모피즘**                        |
| PWA       | **설치형 PWA로 세팅** (manifest+아이콘+SW) |
| 푸시 알림     | **사용 안 함** (FCM/iOS 알림 전부 제외)     |


## 3. 배경 / 현재 상태 (Context)

- 스택: Next.js 15(App Router) + React 18 + Tailwind v4 + d3, shadcn/ui 설치됨
- `app/page.tsx`: 검은 배경 중앙에 `<RotatingEarth width={700} height={500}/>`만 렌더링
- `components/rotating-earth.tsx`: d3 orthographic 회전 지구본 (dot matrix, 드래그/휠 줌). **이 컴포넌트는 그대로 재사용**, 수정 최소화
- shadcn/ui 사용 가능: `input`, `card`, `button`, `command`(자동완성), `scroll-area` 등 (`components/ui/`)
- `lib/utils.ts`에 `cn()` 유틸 존재

## 4. 핵심 로직 (Naver 연동 — API 없이)

### 4-1. 좌표 확보 (API 미사용)

- **출발지**: 더미데이터에서 탭 선택 → `{lng, lat}` 보유
- **도착지**: input 자동완성으로 더미 목록 중 하나 매칭 → 해당 항목의 `{lng, lat}` 사용
- 자유 텍스트가 더미와 매칭 안 되면 거리측정 버튼 비활성 + 안내("목록에서 선택하세요")

### 4-2. 네이버 길찾기 URL (좌표 직접 조립)

- 검증된 레거시(모바일 웹) 형식, 좌표를 그대로 붙임:
  ```
  https://m.map.naver.com/route.nhn?menu=route&pathType=0&showMap=true
    &sname={출발이름}&sx={출발경도}&sy={출발위도}
    &ename={도착이름}&ex={도착경도}&ey={도착위도}
  ```
- 신형 형식(후보, 구현 시 동작 확인): `https://map.naver.com/p/directions/{sLng},{sLat},{sName}/{eLng},{eLat},{eName}/-/car`
- → **구현 시 두 URL 중 실제로 새 탭에서 정상 동작하는 쪽 채택.** 레거시 route.nhn 우선.
- 이름/주소는 `encodeURIComponent`로 인코딩.

### 4-3. 회중찾기 링크

- 고정 URL(인코딩 유지):
  ```
  https://hub.jw.org/meetings/ko?q=%7B%22meetingType%22%3A%22meetings%22%2C%22location%22%3A%22%22%7D
  ```
  (디코드: `q={"meetingType":"meetings","location":""}`)
- `<a href={URL} target="_blank" rel="noopener noreferrer">` 버튼 형태. 글래스모피즘 스타일 적용.
- 로그인은 사용자가 직접 처리(앱에서 관여 안 함).

### 4-3-1. stream 링크

- 고정 URL:
  ```
  https://stream.jw.org/home
  ```
- 회중찾기와 동일한 `<a href={URL} target="_blank" rel="noopener noreferrer">` 버튼. 글래스모피즘 스타일.
- 회중찾기 버튼과 **같은 컴포넌트(`components/external-links.tsx`)에 나란히 배치** — 두 외부 링크 버튼을 한 묶음으로 관리(파일 수 절감).

### 4-4. PWA 세팅 (푸시 알림 없음)

- **목적**: 홈 화면에 설치 가능한 standalone 웹앱. **푸시/알림 기능은 포함하지 않음**(FCM·서버·토큰 저장 전부 불필요).
- **Manifest**: Next 내장 방식 `app/manifest.ts`(`MetadataRoute.Manifest`)로 생성.
  - `name`, `short_name`, `start_url:"/"`, `display:"standalone"`, `theme_color`(검정 계열), `background_color`, `icons`
- **아이콘**: `public/icons/`에 `192x192`, `512x512`(+`maskable`) PNG. (없으면 임시 플레이스홀더 아이콘 생성)
- **iOS 메타**: `app/layout.tsx` metadata에 `appleWebApp`(apple-touch-icon, `apple-mobile-web-app-capable`, status bar style) 설정 → iOS 홈화면 추가 시 standalone 동작.
- **Service Worker**: 오프라인/설치를 위한 최소 SW.
  - 권장: **Serwist(`@serwist/next`)** 로 빌드 타임 생성(App Router/Next 15 호환). 또는 의존성 추가가 부담이면 `public/sw.js` 수동 작성 + 클라이언트에서 `navigator.serviceWorker.register` 등록.
  - 정적 자산 + globe 지오데이터 캐싱(선택), 오프라인 fallback(선택).
- **설치 안내 UI(선택)**: `beforeinstallprompt`(Android/Chrome) 기반 "설치" 버튼 + iOS는 "공유 → 홈 화면에 추가" 안내 문구.
- ⚠️ 푸시 알림 관련(FCM SDK, `firebase-messaging-sw.js`, VAPID, 토큰 저장, Cloud Functions/Cron)은 **모두 범위 밖** — 구현하지 않음.

## 5. 구현 단계 (Implementation Steps)

- 1. **더미데이터 생성** — `lib/dummy-addresses.ts`: `{ id, name, address, lng, lat }[]` **4~5개**(서울 주요 지점 등, 좌표 포함). 출발지/도착지 공용.
- 1. **타입 정의** — `lib/types.ts`: `Place`, `RecentSearch` 인터페이스
- 1. **localStorage 훅** — `hooks/use-recent-searches.ts`: 최근검색 read/add/clear (최대 N개, 최신순, SSR 가드)
- 1. **네이버 URL 빌더** — `lib/naver-map.ts`: 출발/도착 `{name, lng, lat}` 받아 길찾기 URL 생성 (4-2 형식, 인코딩 포함)
- 1. **출발지 선택 UI** — `components/origin-list.tsx`: 더미 주소 칩/카드 목록, 탭 시 선택 표시(하이라이트)
- 1. **도착지 자동완성 + 실행** — `components/distance-form.tsx`: 도착 input(더미 목록 자동완성/매칭) → 좌표 확보 → "거리측정" 버튼 → `window.open(url, "_blank")` + 최근검색 저장. 매칭 안 되면 버튼 비활성.
- 1. **최근 검색 UI** — `components/recent-searches.tsx`: globe 아래 목록, 클릭 시 재실행, 전체삭제 버튼
- 1. **외부 링크 버튼(회중찾기 + stream)** — `components/external-links.tsx`: `<a target="_blank">` 고정 링크 2개를 나란히 배치 — 회중찾기(4-3) + stream(4-3-1). 글래스모피즘 버튼.
- 1. **글래스모피즘 스타일** — `app/globals.css`에 `.glass` 유틸 추가(`backdrop-blur`, 반투명 bg, border, shadow), 패널/버튼에 적용. globe 배경과 어울리는 배경 고려
- 1. **페이지 조립** — `app/page.tsx`: 상단 globe + 하단 패널(출발지 목록 → 도착 입력폼 → 외부 링크 버튼[회중찾기·stream] → 최근검색) 세로 레이아웃, 반응형
- 1. **PWA manifest + 아이콘** — `app/manifest.ts` 생성, `public/icons/` 아이콘 추가, `app/layout.tsx`에 `appleWebApp` 메타 설정 (4-4)
- 1. **PWA service worker** — Serwist(`@serwist/next`) 설정 또는 `public/sw.js` 수동 등록. 최소 캐싱/오프라인. (4-4)
- 1. **설치 안내 UI(선택)** — `beforeinstallprompt` 버튼 + iOS 홈화면 추가 안내 문구 (4-4)

## 6. 영향받는 파일 (Affected Files)


| 파일                                 | 변경 내용                             |
| ---------------------------------- | --------------------------------- |
| `lib/dummy-addresses.ts`           | 신규 — 더미데이터(주소+좌표) 4~5개            |
| `lib/types.ts`                     | 신규 — 공용 타입                        |
| `lib/naver-map.ts`                 | 신규 — 길찾기 URL 빌더                   |
| `hooks/use-recent-searches.ts`     | 신규 — localStorage 최근검색            |
| `components/origin-list.tsx`       | 신규 — 출발지 선택 목록                    |
| `components/distance-form.tsx`     | 신규 — 도착 자동완성 + 거리측정 실행            |
| `components/recent-searches.tsx`   | 신규 — 최근검색 표시                      |
| `components/external-links.tsx`    | 신규 — 회중찾기 + stream `<a>` 링크 버튼 묶음   |
| `app/page.tsx`                     | 수정 — 전체 레이아웃 조립                   |
| `app/globals.css`                  | 수정 — `.glass` 유틸 추가               |
| `app/manifest.ts`                  | 신규 — PWA manifest                 |
| `app/layout.tsx`                   | 수정 — `appleWebApp`/PWA 메타         |
| `public/icons/`*                   | 신규 — PWA 아이콘(192/512/maskable)    |
| `public/sw.js` 또는 Serwist 설정       | 신규 — service worker               |
| `next.config.mjs`                  | 수정(Serwist 사용 시) — withSerwist 래핑 |
| `components/rotating-earth.tsx`    | 변경 없음 (재사용)                       |


> ❌ 제거됨(불필요): `app/api/geocode/route.ts`, `.env.local` (네이버 API 미사용)
> ❌ 범위 밖(미구현): FCM SDK, `firebase-messaging-sw.js`, VAPID, 토큰 저장소, Cloud Functions/Cron (푸시 알림 전부 제외)

## 7. 검증 방법 (Verification)

- `pnpm build` — 타입/빌드 통과
- `pnpm lint`
- 수동 확인:
  - globe 정상 렌더 + 회전 유지
  - 출발지 탭 선택 표시됨
  - 도착 input 자동완성 → 항목 매칭 → 거리측정 → 네이버 지도 새 탭에서 출발→도착 경로 표시
  - 도착지 미매칭 시 버튼 비활성 + 안내
  - 최근검색이 globe 아래 표시되고, 새로고침 후에도 유지(localStorage)
  - 최근검색 클릭 시 재실행, 전체삭제 동작
  - 회중찾기 버튼 클릭 → hub.jw.org 새 탭 이동
  - stream 버튼 클릭 → stream.jw.org/home 새 탭 이동
  - 글래스모피즘 스타일 적용됨
  - PWA: manifest 인식됨(브라우저 설치 가능 표시), 아이콘 노출
  - PWA: 모바일에서 "홈 화면에 추가" 가능, standalone(주소창 없이)으로 실행됨
  - service worker 정상 등록(DevTools → Application)

## 8. 메모 / 결정사항 (Notes & Decisions)

- 네이버 API 미사용 → 출발/도착 모두 좌표 보유 더미에서 가져와 URL에 직접 조립.
- 도착지는 input 자동완성으로 더미 목록과 매칭(원본 "input 박스" 의도 유지 + 좌표 확보).
- `rotating-earth.tsx`는 건드리지 않는다.
- 새 탭 열기는 사용자 클릭 핸들러 안에서 `window.open` 호출(팝업 차단 회피).
- 회중찾기는 단순 외부 링크, 로그인은 사용자 책임.

## 9. 미해결 / 구현 중 확인할 점 (Open Questions)

- 길찾기 URL: 레거시 `route.nhn` vs 신형 `p/directions` 중 실제 동작 확인
- 더미 주소 위치 기준(서울 위주? 전국?) — 데이터 만들 때 확정
- 회중찾기 버튼 배치 위치(상단 헤더 vs 하단 패널) — 기본: 하단 패널



# 추가할기능 

그리고 stream이라는 버튼을 만들어줘 여기서는 

[https://stream.jw.org/home](https://stream.jw.org/home)로 이동하게 해줘 

> ✅ **반영 완료** — 위 stream 버튼 요구사항은 본문 계획에 통합됨:
> 0-1(Revisions), 2(Decisions 표), 4-3-1(stream 링크 로직), 5(구현 단계 — `external-links.tsx`), 6(영향 파일), 7(검증).
> 회중찾기와 동일한 외부 링크 패턴이라 `components/external-links.tsx` 한 컴포넌트에 두 버튼을 묶었음.



