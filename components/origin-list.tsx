"use client"

import { DUMMY_ADDRESSES } from "@/lib/dummy-addresses"
import type { Place } from "@/lib/types"
import { cn } from "@/lib/utils"

interface Props {
  value: Place | null
  onChange: (place: Place) => void
}

export default function OriginList({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-white/50 uppercase tracking-widest">출발지 선택</p>
      <div className="flex flex-wrap gap-2">
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
    </div>
  )
}
