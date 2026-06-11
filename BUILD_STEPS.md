# Build Steps — 구현 순서 (실행용)

> `overview.md`의 계획을 **의존성 순서**로 재배열한 실행 체크리스트입니다.
> 터미널 2(Sonnet)가 이 문서를 위에서 아래로 따라가며 구현합니다.
> 원칙: ① 기반부터 쌓기 → ② 빨리 "동작하는 화면" 만들기(MVP) → ③ 기능 확장 → ④ PWA → ⑤ 검증.
> `[병렬]` 표시된 항목은 서로 의존성이 없어 동시에 만들어도 됩니다.

---

## Phase 0 — 기반: 타입 / 데이터 / 유틸 (UI 없음)

> 모든 컴포넌트가 여기에 의존. 가장 먼저.

- [ ] **0-1. 타입 정의** — `lib/types.ts` `[병렬]`
  - `Place { id, name, address, lng, lat }`
  - `RecentSearch { id, origin: Place, dest: Place, url, ts }`
- [ ] **0-2. 더미데이터** — `lib/dummy-addresses.ts` (deps: 0-1) `[병렬]`
  - `Place[]` **4~5개** (서울 주요 지점, 실제 위경도 좌표 포함). 출발/도착 공용.
- [ ] **0-3. 네이버 URL 빌더** — `lib/naver-map.ts` (deps: 0-1) `[병렬]`
  - `buildNaverRouteUrl(origin, dest): string` — overview 4-2 형식
  - 레거시 `m.map.naver.com/route.nhn` 우선, 이름/주소 `encodeURIComponent`
- [ ] **0-4. 최근검색 훅** — `hooks/use-recent-searches.ts` (deps: 0-1) `[병렬]`
  - `read / add / clear`, 최대 N개(최신순), **SSR 가드**(`typeof window` 체크), localStorage

**✔ 게이트:** `pnpm build` 타입 통과 (UI 없이 lib만).

---

## Phase 1 — 글래스모피즘 스타일 토큰

- [ ] **1-1. `.glass` 유틸** — `app/globals.css` 수정 `[병렬 가능]`
  - `backdrop-blur`, 반투명 bg, border, shadow. globe 검정 배경과 어울리게.
  - 컴포넌트들이 이 클래스를 쓰므로 Phase 2보다 먼저(또는 병렬로) 준비.

---

## Phase 2 — 핵심 거리측정 플로우 (MVP, 첫 동작 화면)

> 여기까지 끝나면 "출발 선택 → 도착 입력 → 네이버 새 탭"이 실제로 동작.

- [ ] **2-1. 출발지 선택 UI** — `components/origin-list.tsx` (deps: 0-1,0-2,1-1)
  - 더미 주소 칩/카드 목록, 탭 시 선택 하이라이트. `value/onChange` 제어형.
- [ ] **2-2. 도착 자동완성 + 실행** — `components/distance-form.tsx` (deps: 0-1~0-4,1-1)
  - 도착 input 자동완성(더미 매칭) → 좌표 확보 → "거리측정" 버튼
  - 클릭 핸들러에서 `window.open(url, "_blank")` (팝업 차단 회피) + 최근검색 `add`
  - 미매칭 시 버튼 비활성 + 안내("목록에서 선택하세요")
- [ ] **2-3. 최소 페이지 조립** — `app/page.tsx` 수정 (deps: 2-1,2-2)
  - 상단 `<RotatingEarth>`(그대로) + 하단에 origin-list, distance-form만 우선 배치.

**✔ 게이트(수동):** globe 회전 유지 / 출발 선택 표시 / 도착 매칭 → 네이버 새 탭에서 경로 표시 / 미매칭 시 버튼 비활성.

---

## Phase 3 — 최근 검색 표시

- [ ] **3-1. 최근검색 UI** — `components/recent-searches.tsx` (deps: 0-1,0-4,1-1)
  - globe 아래 목록, 클릭 시 재실행(`window.open`), 전체삭제 버튼.
- [ ] **3-2. page에 연결** — `app/page.tsx` 수정 (deps: 3-1)
  - distance-form 아래에 recent-searches 배치, 훅 상태 공유.

**✔ 게이트(수동):** 검색 후 목록 표시 / 새로고침 후 유지 / 클릭 재실행 / 전체삭제 동작.

---

## Phase 4 — 외부 링크 버튼 (회중찾기 + stream)

- [ ] **4-1. 외부 링크 컴포넌트** — `components/external-links.tsx` (deps: 1-1) `[병렬 — Phase 2/3과 독립]`
  - 회중찾기: hub.jw.org (overview 4-3 고정 URL)
  - stream: `https://stream.jw.org/home` (overview 4-3-1)
  - 둘 다 `<a target="_blank" rel="noopener noreferrer">`, 글래스 버튼, 나란히 배치.
- [ ] **4-2. page에 연결** — `app/page.tsx` 수정 (deps: 4-1)
  - 하단 패널(폼 아래, 최근검색 위 권장)에 배치.

**✔ 게이트(수동):** 회중찾기 → hub.jw.org 새 탭 / stream → stream.jw.org/home 새 탭.

---

## Phase 5 — 페이지 최종 조립 / 반응형

- [ ] **5-1. 레이아웃 정리** — `app/page.tsx` 수정 (deps: Phase 2~4)
  - 세로 배치: globe → 출발지 목록 → 도착 폼 → 외부 링크(회중찾기·stream) → 최근검색.
  - 글래스 패널 적용, 모바일/데스크탑 반응형, 간격·정렬 다듬기.

**✔ 게이트:** `pnpm lint` + 전체 플로우 한 번에 동작 확인.

---

## Phase 6 — PWA (푸시 알림 없음) `[Phase 2~5와 독립, 병렬 가능]`

- [ ] **6-1. manifest** — `app/manifest.ts` 신규
  - `MetadataRoute.Manifest`: name/short_name/`start_url:"/"`/`display:"standalone"`/theme·background_color(검정)/icons.
- [ ] **6-2. 아이콘** — `public/icons/` (192/512/maskable PNG)
  - 없으면 임시 플레이스홀더 생성.
- [ ] **6-3. iOS 메타** — `app/layout.tsx` 수정
  - metadata `appleWebApp`(apple-touch-icon, capable, status bar style).
- [ ] **6-4. service worker** — Serwist(`@serwist/next`) 또는 `public/sw.js` 수동 등록
  - 최소 캐싱/오프라인. Serwist 사용 시 `next.config.mjs` `withSerwist` 래핑.
  - ⚠️ FCM/푸시/VAPID/토큰 = **범위 밖, 구현 안 함**.

**✔ 게이트:** manifest 인식(설치 가능 표시) / 아이콘 노출 / DevTools→Application에 SW 등록 / 모바일 "홈 화면 추가" → standalone.

---

## Phase 7 — 설치 안내 UI (선택)

- [ ] **7-1.** `beforeinstallprompt`(Android/Chrome) "설치" 버튼 + iOS "공유→홈 화면에 추가" 안내 문구.

---

## Phase 8 — 최종 검증

- [ ] **8-1.** `pnpm build` 통과
- [ ] **8-2.** `pnpm lint` 통과
- [ ] **8-3.** overview.md §7 수동 체크리스트 전체 통과

---

## 의존성 한눈에 (요약)

```
Phase 0 (lib/types, dummy, naver-map, recent-hook)  ─┐
Phase 1 (.glass)                                     ─┤→ Phase 2 (origin-list, distance-form, page MVP)
                                                       │      └→ Phase 3 (recent-searches)
                                                       └→ Phase 4 (external-links)  ← Phase 0/1만 의존, 병렬
                                                              ↓
                                                       Phase 5 (page 최종 조립)
Phase 6 (PWA) ── 전 구간과 독립, 언제든 병렬 ──────────────→ Phase 8 (검증)
```

**권장 실행 순서(단일 작업자):** 0 → 1 → 2 →(게이트)→ 3 → 4 → 5 →(게이트)→ 6 → 7 → 8
**병렬 여력이 있으면:** Phase 0의 4개 파일 동시 + Phase 6(PWA)를 Phase 2~5와 병행.

---

## 변경 파일 체크리스트 (overview §6 대응)

| 파일 | Phase | 신규/수정 |
|------|-------|-----------|
| `lib/types.ts` | 0-1 | 신규 |
| `lib/dummy-addresses.ts` | 0-2 | 신규 |
| `lib/naver-map.ts` | 0-3 | 신규 |
| `hooks/use-recent-searches.ts` | 0-4 | 신규 |
| `app/globals.css` | 1-1 | 수정 |
| `components/origin-list.tsx` | 2-1 | 신규 |
| `components/distance-form.tsx` | 2-2 | 신규 |
| `components/recent-searches.tsx` | 3-1 | 신규 |
| `components/external-links.tsx` | 4-1 | 신규 (회중찾기+stream) |
| `app/page.tsx` | 2-3/3-2/4-2/5-1 | 수정 |
| `app/manifest.ts` | 6-1 | 신규 |
| `public/icons/*` | 6-2 | 신규 |
| `app/layout.tsx` | 6-3 | 수정 |
| `public/sw.js` 또는 Serwist | 6-4 | 신규 |
| `next.config.mjs` | 6-4 | 수정(Serwist 시) |
| `components/rotating-earth.tsx` | — | 변경 없음(재사용) |
