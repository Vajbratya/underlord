/**
 * ObjectiveBanner — battle HUD strip that surfaces the v9 objective.
 *
 * Renders nothing for the default `{kind:'rout'}` so 60 of the 68
 * regions stay quiet. For every other objective it shows a small,
 * tonally-distinct banner so the player knows the win condition at a
 * glance.
 *
 * Lives under the region title and above the initiative ladder so it's
 * the first read after the region name. Uses semantic tokens only.
 */
"use client"

import { Crosshair, Hourglass, Shield, Skull } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BattleState } from "@/lib/underlord/battle"

export function ObjectiveBanner({ state }: { state: BattleState }) {
  const obj = state.objective
  if (!obj || obj.kind === "rout") return null

  // Resolve any human-readable parameter once so the JSX stays small.
  // We never throw — if a referenced unit isn't in the squad (bad data,
  // hot reload), we just hide the banner.
  let icon = <Skull className="size-3.5" />
  let label = ""
  let detail = ""
  let tone: "danger" | "warn" | "info" = "danger"

  switch (obj.kind) {
    case "survive": {
      const remaining = Math.max(0, obj.rounds - state.round + 1)
      icon = <Hourglass className="size-3.5" />
      label = "RESISTIR"
      detail =
        remaining > 0
          ? `Aguente ${remaining} round${remaining === 1 ? "" : "s"}`
          : "Vitória iminente"
      tone = "warn"
      break
    }
    case "assassinate": {
      const target = state.units.find(
        (u) => u.faction === "hero" && u.heroId === obj.targetHeroId,
      )
      if (!target) return null
      icon = <Crosshair className="size-3.5" />
      label = "ASSASSINAR"
      detail = target.name
      tone = "danger"
      break
    }
    case "protect": {
      const ward = state.units.find(
        (u) => u.heroId === obj.protectId || u.id === obj.protectId,
      )
      if (!ward) return null
      icon = <Shield className="size-3.5" />
      label = "PROTEGER"
      detail = ward.name
      tone = "info"
      break
    }
    default:
      return null
  }

  return (
    <div
      className={cn(
        "border-y border-border/40 bg-background/70",
        "animate-in fade-in slide-in-from-top-1 duration-300",
      )}
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex w-full max-w-2xl items-center gap-2 px-3 py-1.5">
        <div
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-sm border-2 px-2 py-1 font-mono text-[9px] font-black uppercase tracking-[0.22em]",
            tone === "danger" && "border-destructive bg-destructive/15 text-destructive",
            tone === "warn" && "border-gold bg-gold/15 text-gold",
            tone === "info" && "border-primary bg-primary/15 text-primary",
          )}
        >
          {icon}
          <span>{label}</span>
        </div>
        <p className="min-w-0 flex-1 truncate font-display text-[11px] uppercase tracking-wide text-foreground/85">
          {detail}
        </p>
      </div>
    </div>
  )
}
