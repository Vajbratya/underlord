"use client"

/**
 * ASCENSÃO — difficulty / replayability configurator.
 *
 * Bottom-sheet modal launched from the war room. Lets the player pick an
 * Ascension tier (0..unlocked) and toggle Maldições (curses). Shows a live
 * preview of the resulting enemy + reward multipliers. Dispatches
 * `set-ascension` up the tree; never mutates state directly.
 */

import { useState } from "react"
import { Flame, Lock, Skull, TrendingUp, X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  ALL_CURSE_IDS,
  CURSES,
  MAX_ASCENSION,
  ascensionLabel,
  ascensionMods,
} from "@/lib/underlord/ascension"
import { haptic } from "@/lib/underlord/haptics"
import type { SaveState } from "@/lib/underlord/types"

export function AscensionPanel({
  save,
  onSet,
  onClose,
}: {
  save: SaveState
  onSet: (tier: number, curses: string[]) => void
  onClose: () => void
}) {
  const unlocked = save.ascensionUnlocked ?? 0
  const [tier, setTier] = useState(Math.min(save.ascension ?? 0, unlocked))
  const [curses, setCurses] = useState<string[]>(save.curses ?? [])

  const mods = ascensionMods(tier, curses)

  function commit(nextTier: number, nextCurses: string[]) {
    setTier(nextTier)
    setCurses(nextCurses)
    onSet(nextTier, nextCurses)
  }

  function toggleCurse(id: string) {
    haptic.select()
    const next = curses.includes(id)
      ? curses.filter((c) => c !== id)
      : [...curses, id]
    commit(tier, next)
  }

  function stepTier(delta: number) {
    const next = Math.max(0, Math.min(unlocked, tier + delta))
    if (next === tier) return
    haptic.tap()
    commit(next, curses)
  }

  const pct = (n: number) => `${Math.round((n - 1) * 100)}%`

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
      <div className="flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border-2 border-primary/40 bg-background shadow-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 bg-primary/10 px-5 py-4">
          <div>
            <h2 className="font-display text-2xl font-black uppercase tracking-[0.2em] text-primary">
              Ascensão
            </h2>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              Suba a aposta. Multiplique o espólio.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full border border-border/60 text-muted-foreground hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {/* Tier stepper */}
          <div className="mb-6 rounded-xl border border-border/60 bg-secondary/30 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                Grau de Ascensão
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                máx desbloqueado: {ascensionLabel(unlocked)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => stepTier(-1)}
                disabled={tier <= 0}
                className="size-11 shrink-0 rounded-lg border-2 border-border bg-secondary/50 font-display text-2xl font-black text-foreground disabled:opacity-30"
              >
                −
              </button>
              <div className="flex-1 text-center">
                <div className="font-display text-3xl font-black uppercase tracking-[0.15em] text-gold">
                  {ascensionLabel(tier)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => stepTier(1)}
                disabled={tier >= unlocked}
                className="grid size-11 shrink-0 place-items-center rounded-lg border-2 border-primary bg-primary/20 font-display text-2xl font-black text-primary disabled:opacity-30"
              >
                {tier >= unlocked && unlocked < MAX_ASCENSION ? (
                  <Lock className="size-4" />
                ) : (
                  "+"
                )}
              </button>
            </div>
            {unlocked === 0 ? (
              <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                Vença uma batalha para destravar o Grau I.
              </p>
            ) : null}
          </div>

          {/* Curses */}
          <div className="mb-5">
            <div className="mb-2 flex items-center gap-2">
              <Skull className="size-4 text-destructive" />
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                Maldições
              </span>
            </div>
            <div className="grid gap-2">
              {ALL_CURSE_IDS.map((id) => {
                const c = CURSES[id]
                const on = curses.includes(id)
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleCurse(id)}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border-2 px-3 py-2.5 text-left transition-colors",
                      on
                        ? "border-destructive/70 bg-destructive/15"
                        : "border-border/60 bg-secondary/20 hover:border-border",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 grid size-7 shrink-0 place-items-center rounded font-mono text-[9px] font-black",
                        on
                          ? "bg-destructive/30 text-destructive"
                          : "bg-secondary/50 text-muted-foreground",
                      )}
                    >
                      {c.short}
                    </span>
                    <span className="flex-1">
                      <span
                        className={cn(
                          "block font-display text-sm font-bold uppercase tracking-wider",
                          on ? "text-destructive" : "text-foreground",
                        )}
                      >
                        {c.name}
                      </span>
                      <span className="block font-mono text-[10px] leading-snug text-muted-foreground">
                        {c.desc}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Preview */}
          <div className="grid grid-cols-3 gap-2">
            <Stat icon={<Flame className="size-3.5" />} label="HP INIMIGO" value={`+${pct(mods.hp)}`} tone="destructive" />
            <Stat icon={<Skull className="size-3.5" />} label="ATK INIMIGO" value={`+${pct(mods.atk)}`} tone="destructive" />
            <Stat icon={<TrendingUp className="size-3.5" />} label="ESPÓLIO" value={`+${pct(mods.reward)}`} tone="gold" />
          </div>
          {mods.move > 0 ? (
            <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.15em] text-destructive">
              Inimigos com +{mods.move} de movimento
            </p>
          ) : null}
        </div>

        <div className="border-t border-border/60 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg border-2 border-primary bg-primary py-3 font-display text-sm font-black uppercase tracking-[0.25em] text-primary-foreground"
          >
            Selar o Pacto
          </button>
        </div>
      </div>
    </div>
  )
}

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: string
  tone: "destructive" | "gold"
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-secondary/30 px-2 py-3 text-center">
      <div
        className={cn(
          "mb-1 flex items-center justify-center",
          tone === "gold" ? "text-gold" : "text-destructive",
        )}
      >
        {icon}
      </div>
      <div
        className={cn(
          "font-display text-lg font-black",
          tone === "gold" ? "text-gold" : "text-destructive",
        )}
      >
        {value}
      </div>
      <div className="font-mono text-[8px] uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </div>
    </div>
  )
}
