"use client"

import { useState } from "react"
import { DUMMY_ADDRESSES } from "@/lib/dummy-addresses"
import type { Place } from "@/lib/types"
import { cn } from "@/lib/utils"

interface Props {
  value: Place | null
  onChange: (place: Place) => void
}

type GeoStatus = "idle" | "loading" | "error"

const CURRENT_LOCATION_ID = "current-location"

export default function OriginList({ value, onChange }: Props) {
  const [status, setStatus] = useState<GeoStatus>("idle")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  function handleCurrentLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("error")
      setErrorMsg("이 브라우저는 위치 기능을 지원하지 않습니다.")
      return
    }

    setStatus("loading")
    setErrorMsg(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        onChange({
          id: CURRENT_LOCATION_ID,
          name: "현재 위치",
          address: `위도 ${latitude.toFixed(5)}, 경도 ${longitude.toFixed(5)}`,
          lat: latitude,
          lng: longitude,
        })
        setStatus("idle")
      },
      (err) => {
        setStatus("error")
        if (err.code === err.PERMISSION_DENIED) {
          setErrorMsg("위치 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요.")
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setErrorMsg("위치 정보를 가져올 수 없습니다.")
        } else if (err.code === err.TIMEOUT) {
          setErrorMsg("위치 조회 시간이 초과되었습니다.")
        } else {
          setErrorMsg("위치를 가져오지 못했습니다.")
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    )
  }

  const currentSelected = value?.id === CURRENT_LOCATION_ID

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-white/50 uppercase tracking-widest">출발지 선택</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleCurrentLocation}
          disabled={status === "loading"}
          className={cn(
            "glass-btn rounded-xl px-4 py-2 text-sm cursor-pointer select-none",
            currentSelected
              ? "bg-white/20 border-white/40 text-white font-semibold"
              : "text-white/80",
            status === "loading" && "opacity-50 cursor-wait",
          )}
        >
          📍 {status === "loading" ? "위치 확인 중…" : "현재 위치"}
        </button>

        {DUMMY_ADDRESSES.map((place) => {
          const selected = value?.id === place.id
          return (
            <button
              key={place.id}
              type="button"
              onClick={() => onChange(place)}
              className={cn(
                "glass-btn rounded-xl px-4 py-2 text-sm text-white/80 cursor-pointer select-none",
                selected && "bg-white/20 border-white/40 text-white font-semibold"
              )}
            >
              {place.name}
            </button>
          )
        })}
      </div>
      {value && (
        <p className="text-xs text-white/40 mt-1 truncate">{value.address}</p>
      )}
      {status === "error" && errorMsg && (
        <p className="text-xs text-amber-300/70 mt-1">{errorMsg}</p>
      )}
    </div>
  )
}
