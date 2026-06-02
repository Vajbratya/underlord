"use client"

/**
 * O POÇO SEM FUNDO — the between-floor reward picker and the run-over
 * tally. The descent itself reuses BattleScreen; these two screens are the
 * roguelike connective tissue (pick a boon → next floor; die → score).
 */

import { ArrowDown, Coins, Gem, Skull, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { haptic } from "@/lib/underlord/haptics"
import type { GauntletReward } from "@/lib/underlord/gauntlet"

const TONE: Record<GauntletReward["tone"], string> = {
  destructive: "border-destructive/70 bg-destructive/10 text-destructive",
  accent: "border-accent/70 bg-accent/10 text-accent",
  gold: "border-gold/70 bg-gold/10 text-gold",
  primary: "border-primary/70 bg-primary/10 text-primary",
  foreground: "border-border bg-card/70 text-foreground",
}

export function GauntletRewardScreen({
  floorCleared,
  choices,
  onPick,
}: {
  floorCleared: number
  choices: GauntletReward[]
  onPick: (r: GauntletReward) => void
}) {
  return (
    <div className="grid min-h-dvh place-items-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
            Andar {floorCleared} superado
          </p>
          <h2 className="mt-1 font-display text-3xl font-black uppercase tracking-[0.18em] text-gold">
            Espólio do Poço
          </h2>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Escolha 1 — vale o resto da descida
          </p>
        </div>
        <div className="grid gap-3">
          {choices.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                haptic.select()
                onPick(r)
              }}
              className={cn(
                "flex items-center gap-3 rounded-xl border-2 px-4 py-4 text-left transition active:scale-[0.98]",
                TONE[r.tone],
              )}
            >
              <span className="flex-1">
                <span className="block font-display text-lg font-black uppercase tracking-wider">
                  {r.name}
                </span>
                <span className="block font-mono text-[11px] leading-snug text-foreground/80">
                  {r.desc}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2 font-mono text-[10px] font-black uppercase">
                {r.atkMult && r.atkMult !== 1 ? (
                  <span className={r.atkMult > 1 ? "text-destructive" : "text-muted-foreground"}>
                    ATK {r.atkMult > 1 ? "+" : ""}{Math.round((r.atkMult - 1) * 100)}%
                  </span>
                ) : null}
                {r.hpMult && r.hpMult !== 1 ? (
                  <span className={r.hpMult > 1 ? "text-foreground" : "text-muted-foreground"}>
                    HP {r.hpMult > 1 ? "+" : ""}{Math.round((r.hpMult - 1) * 100)}%
                  </span>
                ) : null}
                {r.shards ? (
                  <span className="flex items-center gap-0.5 text-accent">
                    <Gem className="size-3" />+{r.shards}
                  </span>
                ) : null}
              </span>
            </button>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          <ArrowDown className="size-3 animate-bounce" />
          mais fundo
        </div>
      </div>
    </div>
  )
}

export function GauntletEndScreen({
  floorReached,
  best,
  shards,
  xp,
  isRecord,
  onClose,
}: {
  floorReached: number
  best: number
  shards: number
  xp: number
  isRecord: boolean
  onClose: () => void
}) {
  return (
    <div className="grid min-h-dvh place-items-center bg-background px-4 py-8">
      <div className="slam-in w-full max-w-md rounded-2xl border-2 border-destructive/50 bg-card/80 p-8 text-center backdrop-blur">
        <Skull className="mx-auto size-12 text-destructive" />
        <h2 className="mt-3 font-display text-3xl font-black uppercase tracking-[0.18em] text-destructive">
          O Poço Venceu
        </h2>
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Você desceu até o
        </p>
        <p className="font-display text-6xl font-black tabular-nums text-gold">
          ANDAR {floorReached}
        </p>
        {isRecord ? (
          <p className="mt-1 inline-flex items-center gap-1 rounded-full border border-gold/60 bg-gold/15 px-3 py-1 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-gold">
            <TrendingUp className="size-3" /> Novo recorde!
          </p>
        ) : (
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            recorde: andar {best}
          </p>
        )}
        <div className="mt-6 flex items-center justify-center gap-5">
          <span className="flex items-center gap-1.5 font-display text-xl font-black text-accent">
            <Gem className="size-5" /> +{shards}
          </span>
          <span className="flex items-center gap-1.5 font-display text-xl font-black text-primary">
            <Coins className="size-5" /> +{xp} XP
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-8 w-full rounded-lg border-2 border-primary bg-primary py-3 font-display text-sm font-black uppercase tracking-[0.25em] text-primary-foreground"
        >
          Voltar à Sala de Guerra
        </button>
      </div>
    </div>
  )
}
