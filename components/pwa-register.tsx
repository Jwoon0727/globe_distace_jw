"use client"

import { useEffect } from "react"

export default function PwaRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return
    // 프로덕션에서만 등록(개발 중 캐시로 인한 혼선 방지)
    if (process.env.NODE_ENV !== "production") return

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // 등록 실패는 조용히 무시 (PWA는 점진적 향상)
      })
    }

    window.addEventListener("load", register)
    return () => window.removeEventListener("load", register)
  }, [])

  return null
}
