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

// 모바일: 좌표 없는 도착지(`,,이름,,`)는 네이버 서버를 크래시시킨다.
// 좌표가 없는 지점은 `-`(미지정)로 표현해야 하므로, 출발지(좌표 보유)만 채우고
// 도착지는 미지정으로 둔 길찾기 URL을 만든다 → 선택한 출발지가 그대로 넘어간다.
export function buildNaverRouteUrlOriginOnly(origin: Place): string {
  const sname = encodeURIComponent(origin.name)
  const start = `${origin.lng},${origin.lat},${sname},,`
  return `https://map.naver.com/p/directions/${start}/-/-/car`
}

export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(
    navigator.userAgent,
  )
}
