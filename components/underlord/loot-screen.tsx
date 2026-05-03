"use client"

import Image from "next/image"
import { ChevronRight, Coins, Flame, Skull, Sparkles, Trophy, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { RARITY_LABEL, RARITY_TONE } from "@/lib/underlord/loot"
import type { LootItem } from "@/lib/underlord/types"
import { rand, UNDERLORD_LINES, getHeroById } from "@/lib/elementum-flavor"
import { useEffect, useMemo, useState } from "react"

export function LootScreen({
  victory,
  goldEarned,
  loot,
  fallenNames,
  killedHeroIds,
  xpEarned = 0,
  levelsGained = 0,
  comboMax = 0,
  flawless = false,
  onContinue,
}: {
  victory: boolean
  goldEarned: number
  loot: LootItem[]
  fallenNames: string[]
  killedHeroIds: string[]
  xpEarned?: number
  levelsGained?: number
  comboMax?: number
  flawless?: boolean
  onContinue: () => void
}) {
  // Gold ticker animates count-up for satisfying victory pop
  const [goldShown, setGoldShown] = useState(0)
  useEffect(() => {
    if (!victory || goldEarned === 0) {
      setGoldShown(goldEarned)
      return
    }
    let frame = 0
    const total = 28
    const id = window.setInterval(() => {
      frame++
      setGoldShown(Math.round((frame / total) * goldEarned))
      if (frame >= total) {
        setGoldShown(goldEarned)
        window.clearInterval(id)
      }
    }, 28)
    return () => window.clearInterval(id)
  }, [victory, goldEarned])
  const headline = useMemo(
    () => (victory ? rand(UNDERLORD_LINES.roundWin) : rand(UNDERLORD_LINES.defeat)),
    [victory],
  )

  return (
    <div className="flex min-h-dvh w-full flex-col bg-background pb-safe pt-safe">
      <main className="flex flex-1 flex-col items-center justify-start px-3 py-5 sm:justify-center sm:px-4 sm:py-6">
        <div className="grain w-full max-w-md">
          {/* Header */}
          <div className="text-center">
            <span
              className={cn(
                "inline-grid size-14 place-items-center rounded-full ring-4 sm:size-20",
                victory
                  ? "bg-accent/15 text-accent ring-accent/40"
                  : "bg-destructive/15 text-destructive ring-destructive/40",
              )}
            >
              {victory ? <Trophy className="size-7 sm:size-10" /> : <Skull className="size-7 sm:size-10" />}
            </span>
            <h1
              className={cn(
                "mt-3 font-display text-3xl font-black uppercase leading-none tracking-tight sm:mt-4 sm:text-5xl",
                victory ? "text-accent" : "text-destructive",
              )}
            >
              {victory ? "Região Limpa" : "Esquadrão Aniquilado"}
            </h1>
            <p className="mt-2 max-w-sm text-balance font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-muted-foreground sm:text-xs">
              UNDERLORD: &ldquo;{headline}&rdquo;
            </p>
          </div>

          {/* Killed heroes */}
          {killedHeroIds.length ? (
            <div className="vellum mt-5 rounded-lg border-2 border-border p-3 sm:mt-6 sm:p-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
                Heróis Abatidos
              </p>
              <ul className="mt-2 space-y-2">
                {killedHeroIds.map((id) => {
                  const h = getHeroById(id)
                  if (!h) return null
                  return (
                    <li
                      key={id}
                      className="flex items-start gap-2.5 rounded border border-destructive/30 bg-destructive/5 p-2"
                    >
                      <span className="relative size-12 shrink-0 overflow-hidden rounded border border-destructive/60 sm:size-14">
                        <Image
                          src={`/images/heroes/${h.id}.jpg`}
                          alt={h.name}
                          fill
                          sizes="(max-width: 640px) 48px, 56px"
                          className="object-cover grayscale"
                        />
                        <span className="absolute inset-0 grid place-items-center bg-destructive/35">
                          <Skull className="size-5 text-foreground drop-shadow sm:size-6" />
                        </span>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-xs font-black uppercase leading-tight text-destructive sm:text-sm">
                          {h.name}
                        </p>
                        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground sm:text-[10px]">
                          {h.title}
                        </p>
                        <p className="mt-1 font-mono text-[10px] leading-snug tracking-wide text-foreground/85 sm:text-[11px]">
                          &ldquo;{h.underlordKill}&rdquo;
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : null}

          {/* Fallen squad */}
          {fallenNames.length ? (
            <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 sm:mt-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-destructive">
                Caídos da sua brood
              </p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-foreground/85 sm:text-xs">
                {fallenNames.join(" · ")}
              </p>
              <p className="mt-1 font-mono text-[10px] tracking-wider text-muted-foreground">
                Não voltam. Outros nascem do chão. É o ciclo.
              </p>
            </div>
          ) : null}

          {/* Gold + Loot */}
          {victory ? (
            <>
              {/* Reward chips: XP, level, combo, flawless */}
              <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5">
                <RewardChip
                  icon={<Zap className="size-3.5" />}
                  label="XP"
                  value={`+${xpEarned}`}
                  tone="accent"
                />
                <RewardChip
                  icon={<Coins className="size-3.5" />}
                  label="Ouro"
                  value={`+${goldShown}`}
                  tone="gold"
                  ticking={goldShown < goldEarned}
                />
                {comboMax >= 2 ? (
                  <RewardChip
                    icon={<Flame className="size-3.5" />}
                    label="Combo Máx"
                    value={`x${comboMax}`}
                    tone="primary"
                  />
                ) : null}
                {flawless ? (
                  <RewardChip
                    icon={<Sparkles className="size-3.5" />}
                    label="Impecável"
                    value="zero perdas"
                    tone="gold"
                  />
                ) : null}
              </div>

              {levelsGained > 0 ? (
                <div className="slam-in mt-3 rounded-lg border-2 border-accent bg-accent/15 px-3 py-2.5 text-center sm:px-4 sm:py-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
                    SUBIU DE NÍVEL
                  </p>
                  <p className="mt-0.5 font-display text-lg font-black uppercase tracking-tight text-foreground sm:text-xl">
                    +{levelsGained} {levelsGained > 1 ? "níveis" : "nível"}
                  </p>
                </div>
              ) : null}

              {loot.length ? (
                <div className="mt-3 sm:mt-4">
                  <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
                    Drops
                  </p>
                  <ul className="space-y-2">
                    {loot.map((item, i) => (
                      <li
                        key={`${item.id}-${i}`}
                        className="rounded-md border border-border bg-card/60 p-2.5 sm:p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className="font-display text-xs font-black uppercase leading-tight sm:text-sm"
                            style={{ color: rarityColor(item.rarity) }}
                          >
                            {item.name}
                          </p>
                          <span
                            className="rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider"
                            style={{
                              color: rarityColor(item.rarity),
                              borderColor: rarityColor(item.rarity, 0.5),
                            }}
                          >
                            {RARITY_LABEL[item.rarity]}
                          </span>
                        </div>
                        <p className="mt-1 font-mono text-[10px] tracking-wider text-muted-foreground">
                          {[
                            item.atkBonus ? `+${item.atkBonus} ATK` : null,
                            item.hpBonus ? `+${item.hpBonus} HP` : null,
                            item.moveBonus ? `+${item.moveBonus} MOV` : null,
                            item.rangeBonus ? `+${item.rangeBonus} ALC` : null,
                            item.spdBonus ? `+${item.spdBonus} SPD` : null,
                            item.taint > 0 ? `+${item.taint.toFixed(1)} TAINT` : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                        <p className="mt-1 text-[11px] leading-relaxed text-foreground/85">
                          {item.flavor}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </main>

      <div className="border-t border-border bg-card/60 p-3 backdrop-blur sm:p-4">
        <button
          type="button"
          onClick={onContinue}
          className="mx-auto flex w-full max-w-md items-center justify-center gap-2 rounded-md border-2 border-primary bg-primary px-5 py-3.5 font-display text-sm font-black uppercase tracking-[0.22em] text-primary-foreground transition active:scale-[0.98] sm:px-6 sm:py-4 sm:text-base sm:tracking-[0.25em]"
        >
          DE VOLTA À SALA DE GUERRA
          <ChevronRight className="size-5" />
        </button>
      </div>
    </div>
  )
}

function RewardChip({
  icon,
  label,
  value,
  tone,
  ticking,
}: {
  icon: React.ReactNode
  label: string
  value: string
  tone: "accent" | "primary" | "gold" | "destructive"
  ticking?: boolean
}) {
  const toneMap: Record<typeof tone, { bg: string; border: string; text: string }> = {
    accent: { bg: "bg-accent/10", border: "border-accent/50", text: "text-accent" },
    primary: { bg: "bg-primary/10", border: "border-primary/50", text: "text-primary" },
    gold: { bg: "bg-gold/10", border: "border-gold/50", text: "text-gold" },
    destructive: {
      bg: "bg-destructive/10",
      border: "border-destructive/50",
      text: "text-destructive",
    },
  }
  const t = toneMap[tone]
  return (
    <div className={cn("flex items-center gap-2 rounded-lg border-2 px-2.5 py-2", t.border, t.bg)}>
      <span className={cn("shrink-0", t.text)}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[8px] uppercase tracking-[0.22em] text-muted-foreground">
          {label}
        </p>
        <p
          className={cn(
            "truncate font-display text-sm font-black uppercase tabular-nums leading-none",
            t.text,
            ticking && "counter-tick",
          )}
        >
          {value}
        </p>
      </div>
    </div>
  )
}

function rarityColor(r: LootItem["rarity"], alpha = 1): string {
  const c = RARITY_TONE[r]
  const m: Record<typeof c, string> = {
    foreground: `oklch(0.93 0.014 80 / ${alpha})`,
    accent: `oklch(0.72 0.17 60 / ${alpha})`,
    destructive: `oklch(0.55 0.21 22 / ${alpha})`,
    gold: `oklch(0.78 0.14 78 / ${alpha})`,
  }
  return m[c]
}
