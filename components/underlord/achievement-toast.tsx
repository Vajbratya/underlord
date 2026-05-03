"use client"

import { useEffect, useState } from "react"
import { Coins, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import { ACHIEVEMENTS, type AchievementId } from "@/lib/underlord/meta"

type Toast = {
  key: number
  id: AchievementId
}

let toastCounter = 0
let listeners: ((t: Toast) => void)[] = []

/** Fire an achievement toast from anywhere in the tree. */
export function fireAchievement(id: AchievementId) {
  toastCounter += 1
  const t: Toast = { key: toastCounter, id }
  for (const l of listeners) l(t)
}

export function AchievementToaster() {
  const [queue, setQueue] = useState<Toast[]>([])

  useEffect(() => {
    const listener = (t: Toast) => setQueue((q) => [...q, t])
    listeners.push(listener)
    return () => {
      listeners = listeners.filter((l) => l !== listener)
    }
  }, [])

  // Auto-dismiss head after 3.2s
  useEffect(() => {
    if (queue.length === 0) return
    const t = window.setTimeout(() => {
      setQueue((q) => q.slice(1))
    }, 3200)
    return () => window.clearTimeout(t)
  }, [queue])

  if (queue.length === 0) return null
  return (
    <div className="pointer-events-none fixed left-1/2 top-3 z-[60] flex w-[92vw] max-w-sm -translate-x-1/2 flex-col gap-2 sm:top-6">
      {queue.slice(0, 3).map((t, i) => {
        const def = ACHIEVEMENTS[t.id]
        return (
          <div
            key={t.key}
            className={cn(
              "achievement-pop relative overflow-hidden rounded-md border-2 border-gold/60 bg-card/95 px-3 py-2.5 shadow-[0_0_30px_oklch(0.78_0.14_78/0.4)] backdrop-blur",
            )}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="absolute inset-y-0 left-0 w-1 bg-gold" />
            <div className="flex items-center gap-2.5 pl-1.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gold/20 ring-2 ring-gold/60">
                <Trophy className="size-4 text-gold" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[8.5px] uppercase tracking-[0.3em] text-gold">
                  CONQUISTA
                </p>
                <p className="truncate font-display text-sm font-black uppercase leading-tight text-foreground">
                  {def.title}
                </p>
                <p className="truncate font-mono text-[10px] leading-tight text-muted-foreground">
                  {def.desc}
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-0.5 rounded border border-gold/50 bg-gold/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-gold">
                <Coins className="size-3" />
                {def.reward}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
