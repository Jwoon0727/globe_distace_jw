"use client"

import { useEffect, useRef, useState } from "react"
import { buildNaverRouteUrl, buildNaverSearchUrl, isMobileDevice } from "@/lib/naver-map"
import { useRecentSearches } from "@/hooks/use-recent-searches"
import type { Place } from "@/lib/types"
import { cn } from "@/lib/utils"

interface Props {
  origin: Place | null
}

export default function DistanceForm({ origin }: Props) {
  const [destText, setDestText] = useState("")
  const [mobile, setMobile] = useState(false)
  const linkRef = useRef<HTMLAnchorElement>(null)
  const { add } = useRecentSearches()

  // navigator는 클라이언트에서만 접근 가능하므로 마운트 후 판별(hydration mismatch 방지)
  useEffect(() => {
    setMobile(isMobileDevice())
  }, [])

  const dest = destText.trim()
  const canSearch = !!origin && dest.length > 0

  // 도착지 좌표가 없어 모바일 길찾기 URL이 크래시하므로,
  // 모바일에서는 도착지 검색 URL로 폴백한다(자동 길찾기는 미지원).
  const href = canSearch
    ? mobile
      ? buildNaverSearchUrl(dest)
      : buildNaverRouteUrl(origin!, dest)
    : undefined

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
        placeholder="도착지를 입력하세요"
        className="glass w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30"
      />

      {!origin && (
        <p className="text-xs text-white/30">출발지를 먼저 선택하세요</p>
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
          canSearch ? "opacity-100 cursor-pointer" : "opacity-30 cursor-not-allowed pointer-events-none"
        )}
      >
        거리측정 →
      </a>
    </div>
  )
}
