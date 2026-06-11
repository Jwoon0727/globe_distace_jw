"use client"

import { useRecentSearches } from "@/hooks/use-recent-searches"

export default function RecentSearches() {
  const { searches, remove, clear } = useRecentSearches()

  if (searches.length === 0) return null

  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/50 uppercase tracking-widest">최근 검색</p>
        <button
          type="button"
          onClick={clear}
          className="text-xs text-white/30 hover:text-white/60 transition-colors"
        >
          전체삭제
        </button>
      </div>
      <ul className="flex flex-col gap-1.5">
        {searches.map((s) => (
          <li key={s.id} className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => window.open(s.url, "_blank", "noopener,noreferrer")}
              className="glass-btn min-w-0 flex-1 rounded-xl px-4 py-2.5 text-left text-sm text-white/70 hover:text-white flex items-center gap-2"
            >
              <span className="font-medium truncate">{s.origin.name}</span>
              <span className="text-white/30 shrink-0">→</span>
              <span className="font-medium truncate">{s.destText}</span>
              <span className="ml-auto shrink-0 text-xs text-white/25">
                {new Date(s.ts).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
              </span>
            </button>
            <button
              type="button"
              onClick={() => remove(s.id)}
              aria-label={`${s.origin.name} → ${s.destText} 삭제`}
              className="shrink-0 rounded-lg px-2 py-2 text-xs text-white/30 hover:text-white/70 transition-colors"
            >
              삭제
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
