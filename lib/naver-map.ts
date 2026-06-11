import type { Place } from "./types"

export function buildNaverRouteUrl(origin: Place, destText: string): string {
  const sname = encodeURIComponent(origin.name)
  const ename = encodeURIComponent(destText)

  // 신형 Naver Maps directions URL 구조:
  //   /directions/{출발 경도,위도,이름,장소ID,타입}/{도착 ...}/{경유지}/{이동수단}
  // 각 지점은 콤마 5필드. 출발지는 좌표가 있어 정확히 채워지고,
  // 도착지는 좌표/장소ID가 없으므로 이름만 넣어 검색 상태로 열린다.
  const start = `${origin.lng},${origin.lat},${sname},,`
  const goal = `,,${ename},,`

  return `https://map.naver.com/p/directions/${start}/${goal}/-/car`
}
