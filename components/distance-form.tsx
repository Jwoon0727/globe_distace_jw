"use client"

import { useState } from "react"
import { buildNaverRouteUrl, buildNaverSearchUrl, isMobileDevice } from "@/lib/naver-map"
import { useRecentSearches } from "@/hooks/use-recent-searches"
import type { Place } from "@/lib/types"
import { cn } from "@/lib/utils"

interface Props {
  origin: Place | null
}

export default function DistanceForm({ origin }: Props) {
  const [destText, setDestText] = useState("")
  const { add } = useRecentSearches()

  const canSearch = !!origin && destText.trim().length > 0

  function handleSearch() {
    if (!origin || !destText.trim()) return
    const dest = destText.trim()
    // 도착지 좌표가 없어 모바일 길찾기 URL이 크래시하므로,
    // 모바일에서는 도착지 검색 URL로 폴백한다(자동 길찾기는 미지원).
    const url = isMobileDevice()
      ? buildNaverSearchUrl(dest)
      : buildNaverRouteUrl(origin, dest)
    window.open(url, "_blank", "noopener,noreferrer")
    add({ origin, destText: dest, url })
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-white/50 uppercase tracking-widest">도착지 입력</p>
      <input
        type="text"
        value={destText}
        onChange={(e) => setDestText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        placeholder="도착지를 입력하세요"
        className="glass w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30"
      />

      {!origin && (
        <p className="text-xs text-white/30">출발지를 먼저 선택하세요</p>
      )}

      <button
        type="button"
        onClick={handleSearch}
        disabled={!canSearch}
        className={cn(
          "glass-btn rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity",
          canSearch ? "opacity-100 cursor-pointer" : "opacity-30 cursor-not-allowed"
        )}
      >
        거리측정 →
      </button>
    </div>
  )
}
