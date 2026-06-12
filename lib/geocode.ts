export interface GeocodeResult {
  lat: number
  lng: number
  displayName: string
}

// 키가 필요 없는 OpenStreetMap(Nominatim) 지오코더로 자유 텍스트 → 좌표 변환.
// 한국 주소를 우선하도록 countrycodes=kr, accept-language=ko 적용.
export async function geocodeAddress(
  query: string,
  signal?: AbortSignal,
): Promise<GeocodeResult | null> {
  const trimmed = query.trim()
  if (!trimmed) return null

  const url =
    "https://nominatim.openstreetmap.org/search" +
    `?format=jsonv2&limit=1&countrycodes=kr&accept-language=ko&q=${encodeURIComponent(trimmed)}`

  const res = await fetch(url, {
    signal,
    headers: { Accept: "application/json" },
  })
  if (!res.ok) return null

  const data: Array<{ lat: string; lon: string; display_name: string }> = await res.json()
  if (!Array.isArray(data) || data.length === 0) return null

  const top = data[0]
  const lat = Number.parseFloat(top.lat)
  const lng = Number.parseFloat(top.lon)
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null

  return { lat, lng, displayName: top.display_name }
}
