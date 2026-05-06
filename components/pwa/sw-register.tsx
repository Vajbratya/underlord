"use client"

import { useEffect } from "react"

/**
 * Registers /sw.js once on mount in production. Dev runs without a service
 * worker because Next.js HMR + SW caching is a misery to debug; turning it
 * on only in prod keeps the dev loop fast and avoids stale-chunk hell.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator)) return
    if (process.env.NODE_ENV !== "production") return

    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {
          // Silent — PWA is progressive enhancement; failure must never
          // block the game from rendering.
        })
    }

    if (document.readyState === "complete") onLoad()
    else window.addEventListener("load", onLoad, { once: true })
  }, [])

  return null
}
