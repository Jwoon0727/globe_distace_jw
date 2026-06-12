"use client"

import { useEffect, useRef, useState } from "react"
import {
  buildNaverRouteUrlWithCoords,
  buildNaverRouteUrlOriginOnly,
  buildNaverSearchUrl,
  isMobileDevice,
} from "@/lib/naver-map"
import { geocodeAddress, type GeocodeResult } from "@/lib/geocode"
import { useRecentSearches } from "@/hooks/use-recent-searches"
import type { Place } from "@/lib/types"
import { cn } from "@/lib/utils"

interface Props {
  origin: Place | null
}

type GeoStatus = "idle" | "loading" | "found" | "notfound" | "error"

export default function DistanceForm({ origin }: Props) {
  const [destText, setDestText] = useState("")
  const [mobile, setMobile] = useState(false)
  const [geo, setGeo] = useState<GeocodeResult | null>(null)
  const [status, setStatus] = useState<GeoStatus>("idle")
  const linkRef = useRef<HTMLAnchorElement>(null)
  const { add } = useRecentSearches()

  useEffect(() => {
    setMobile(isMobileDevice())
  }, [])

  const dest = destText.trim()

  // 입력하는 동안(디바운스) 미리 좌표를 구해 둔다.
  // 클릭 후 비동기 호출을 하면 모바일에서 팝업이 차단되므로, 클릭 시점에는 링크가 이미 준비돼 있어야 한다.
  useEffect(() => {
    if (!dest) {
      setGeo(null)
      setStatus("idle")
      return
    }

    setStatus("loading")
    setGeo(null)
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const result = await geocodeAddress(dest, controller.signal)
        if (controller.signal.aborted) return
        if (result) {
          setGeo(result)
          setStatus("found")
        } else {
          setGeo(null)
          setStatus("notfound")
        }
      } catch (err) {
        if (controller.signal.aborted) return
        setGeo(null)
        setStatus("error")
      }
    }, 500)

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [dest])

  const canSearch = !!origin && dest.length > 0

  // 1순위: 도착지 좌표 확보 → 출발+도착 모두 채운 길찾기(PC/모바일 공통)
  // 폴백: 좌표 못 구함 → 모바일은 출발지만, PC는 이름검색 길찾기
  let href: string | undefined
  if (canSearch && origin) {
    if (geo) {
      href = buildNaverRouteUrlWithCoords(origin, dest, geo.lng, geo.lat)
    } else {
      href = mobile ? buildNaverRouteUrlOriginOnly(origin) : buildNaverSearchUrl(dest)
    }
  }

  function handleOpen() {
    if (!origin || !href) return
    add({ origin, destText: dest, url: href })
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-white/50 uppercase tracking-widest">도착지 입력</p>
      <input
        type="text"
        value={destText}
        onChange={(e) => setDestText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && canSearch) linkRef.current?.click()
        }}
        placeholder="도착지 주소를 입력하세요"
        className="glass w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30"
      />

      {!origin && <p className="text-xs text-white/30">출발지를 먼저 선택하세요</p>}

      {origin && dest && (
        <p className="text-xs">
          {status === "loading" && <span className="text-white/40">좌표 확인 중…</span>}
          {status === "found" && geo && (
            <span className="text-emerald-300/80 truncate block">
              ✓ 위치 확인: {geo.displayName}
            </span>
          )}
          {status === "notfound" && (
            <span className="text-amber-300/70">
              정확한 위치를 못 찾았어요. {mobile ? "출발지만 넘어갑니다." : "도착지 검색으로 열립니다."}
            </span>
          )}
          {status === "error" && (
            <span className="text-amber-300/70">좌표 조회 실패. 잠시 후 다시 시도하세요.</span>
          )}
        </p>
      )}

      <a
        ref={linkRef}
        href={href ?? "#"}
        target="_blank"
        rel="noopener noreferrer"
        aria-disabled={!canSearch}
        onClick={(e) => {
          if (!canSearch) {
            e.preventDefault()
            return
          }
          handleOpen()
        }}
        className={cn(
          "glass-btn rounded-xl px-5 py-2.5 text-center text-sm font-semibold text-white transition-opacity",
          canSearch ? "opacity-100 cursor-pointer" : "opacity-30 cursor-not-allowed pointer-events-none",
        )}
      >
        거리측정 →
      </a>
    </div>
  )
}
