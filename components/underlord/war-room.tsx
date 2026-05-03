"use client"

import Image from "next/image"
import { useMemo, useState } from "react"
import { Coins, Crown, Flame, Map, Skull, Swords, Users, X, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Region, SaveState } from "@/lib/underlord/types"
import { REGIONS } from "@/lib/underlord/regions"
import { MINION_TEMPLATES } from "@/lib/underlord/units"
import { getHero } from "@/lib/elementum-flavor"
import { haptic } from "@/lib/underlord/haptics"
import { xpProgress } from "@/lib/underlord/meta"

const TONE_TO_VAR: Record<string, string> = {
  primary: "var(--primary)",
  destructive: "var(--destructive)",
  accent: "var(--accent)",
  gold: "var(--gold)",
  foreground: "var(--foreground)",
}

const BIOME_COLOR: Record<Region["biome"], string> = {
  ash: "oklch(0.55 0.21 22)",
  moor: "oklch(0.45 0.04 220)",
  iron: "oklch(0.55 0.02 240)",
  verdant: "oklch(0.55 0.12 140)",
  crown: "oklch(0.78 0.14 78)",
}

export function WarRoom({
  save,
  onPickRegion,
  onOpenSquad,
  streakBonus,
}: {
  save: SaveState
  onPickRegion: (regionId: string) => void
  onOpenSquad: () => void
  streakBonus?: number | null
}) {
  const xp = xpProgress(save.xp)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = REGIONS.find((r) => r.id === selectedId) ?? null

  const cleared = useMemo(
    () => REGIONS.filter((r) => save.regions[r.id] === "cleared").length,
    [save.regions],
  )
  const total = REGIONS.length

  function pickRegion(id: string) {
    haptic.tap()
    setSelectedId(id)
  }

  return (
    <div className="flex min-h-dvh w-full flex-col bg-background pb-safe pt-safe">
      {/* Header — meta progression */}
      <header className="sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto w-full max-w-5xl px-3 py-2 sm:px-6 sm:py-2.5">
          {/* Top row: title + chips */}
          <div className="flex items-center gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <Map className="size-4 shrink-0 text-accent" />
              <h1 className="truncate font-display text-sm font-black uppercase tracking-[0.18em] text-foreground sm:text-base">
                Sala de Guerra
              </h1>
            </div>
            <div className="ml-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {save.dailyStreak > 0 ? (
                <span className="flex shrink-0 items-center gap-1 rounded border border-gold/50 bg-gold/10 px-1.5 py-1 font-mono text-[9px] font-black uppercase tracking-wider text-gold">
                  <Flame className="size-3" />
                  {save.dailyStreak}D
                </span>
              ) : null}
              <Stat icon={<Coins className="size-3.5" />} label="OURO" value={save.gold} />
              <Stat icon={<Skull className="size-3.5" />} label="HERÓIS" value={`${save.heroesKilled.length}/14`} />
              <Stat icon={<Crown className="size-3.5" />} label="REG." value={`${cleared}/${total}`} />
            </div>
          </div>
          {/* XP bar + level */}
          <div className="mt-2 flex items-center gap-2">
            <span className="flex shrink-0 items-center gap-1 rounded border border-accent/60 bg-accent/15 px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider text-accent">
              <Zap className="size-3" />
              LV {xp.level}
            </span>
            <div className="relative flex-1 overflow-hidden rounded-full border border-border bg-secondary/40">
              <div
                className="h-2 bg-gradient-to-r from-primary to-accent transition-[width] duration-700"
                style={{ width: `${xp.pct * 100}%` }}
              />
            </div>
            <span className="shrink-0 font-mono text-[9px] tabular-nums text-muted-foreground">
              {xp.intoLevel}/{xp.needed}
            </span>
          </div>
        </div>
        {/* Streak bonus banner */}
        {streakBonus && streakBonus > 0 ? (
          <div className="slam-in border-t border-gold/40 bg-gold/15 px-3 py-1.5 sm:px-6">
            <p className="text-center font-mono text-[10px] uppercase tracking-[0.22em] text-gold">
              <Flame className="mr-1 inline size-3" />
              Streak {save.dailyStreak} dia{save.dailyStreak > 1 ? "s" : ""} · +{streakBonus} ouro
            </p>
          </div>
        ) : null}
      </header>

      {/* Map — bigger nodes, portrait-friendly viewBox */}
      <main className="relative flex flex-1 flex-col">
        <div className="grain relative mx-auto w-full max-w-5xl flex-1 overflow-hidden">
          <svg
            viewBox="0 0 100 100"
            className="h-full w-full"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <radialGradient id="land" cx="50%" cy="55%" r="70%">
                <stop offset="0%" stopColor="oklch(0.18 0.014 22)" />
                <stop offset="100%" stopColor="oklch(0.10 0.012 22)" />
              </radialGradient>
              <pattern id="grid" width="4" height="4" patternUnits="userSpaceOnUse">
                <path
                  d="M4 0 L0 0 0 4"
                  fill="none"
                  stroke="oklch(0.24 0.012 30)"
                  strokeWidth="0.1"
                />
              </pattern>
            </defs>
            <rect x="0" y="0" width="100" height="100" fill="url(#land)" />
            <rect x="0" y="0" width="100" height="100" fill="url(#grid)" opacity="0.5" />

            {/* Region links */}
            {REGIONS.map((r) =>
              r.links.map((linkId) => {
                const target = REGIONS.find((x) => x.id === linkId)
                if (!target) return null
                if (r.id > target.id) return null
                const status = save.regions[r.id]
                const linkStatus = save.regions[linkId]
                const active =
                  status === "cleared" ||
                  status === "available" ||
                  linkStatus === "cleared" ||
                  linkStatus === "available"
                return (
                  <line
                    key={`${r.id}-${linkId}`}
                    x1={r.x}
                    y1={r.y * 1.25}
                    x2={target.x}
                    y2={target.y * 1.25}
                    stroke={active ? "oklch(0.55 0.21 22 / 0.55)" : "oklch(0.24 0.012 30)"}
                    strokeWidth={active ? 0.5 : 0.3}
                    strokeDasharray={active ? "0.9 0.6" : "0.4 0.4"}
                  />
                )
              }),
            )}

            {/* Region nodes — 60% bigger for thumb tapping */}
            {REGIONS.map((r) => {
              const status = save.regions[r.id]
              const fill = BIOME_COLOR[r.biome]
              const isSelected = selectedId === r.id
              const isCleared = status === "cleared"
              const isLocked = status === "locked"
              const isAvailable = status === "available"
              const cy = r.y * 1.25 // stretch vertically into the 100x100 view
              return (
                <g
                  key={r.id}
                  transform={`translate(${r.x}, ${cy})`}
                  className="cursor-pointer"
                  onClick={() => !isLocked && pickRegion(r.id)}
                  style={{ pointerEvents: isLocked ? "none" : "auto" }}
                >
                  {/* Larger transparent hit-area */}
                  <circle r={9} fill="transparent" />
                  {/* Available pulse aura */}
                  {isAvailable && !isSelected ? (
                    <circle r={6} fill={fill} opacity="0.18">
                      <animate attributeName="r" values="5.5;7.5;5.5" dur="2.4s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.30;0.05;0.30" dur="2.4s" repeatCount="indefinite" />
                    </circle>
                  ) : null}
                  <circle
                    r={isSelected ? 6.4 : 5.6}
                    fill="oklch(0.10 0.012 22)"
                    stroke={isLocked ? "oklch(0.24 0.012 30)" : fill}
                    strokeWidth={isSelected ? 0.9 : 0.55}
                    opacity={isLocked ? 0.5 : 1}
                  />
                  <circle
                    r={3.2}
                    fill={isLocked ? "oklch(0.18 0.008 30)" : fill}
                    opacity={isLocked ? 0.4 : isCleared ? 0.4 : 1}
                  />
                  {isCleared ? (
                    <text
                      textAnchor="middle"
                      y={1.4}
                      className="fill-foreground font-mono"
                      style={{ fontSize: "3.6px", fontWeight: 900 }}
                    >
                      ✕
                    </text>
                  ) : null}
                  {!isCleared && !isLocked ? (
                    <text
                      textAnchor="middle"
                      y={1.3}
                      className="fill-foreground font-mono"
                      style={{ fontSize: "3.4px", fontWeight: 700 }}
                    >
                      {r.stage}
                    </text>
                  ) : null}
                  <text
                    textAnchor="middle"
                    y={-7.4}
                    className="font-mono"
                    style={{
                      fontSize: "2.1px",
                      fontWeight: 700,
                      letterSpacing: "0.15em",
                      fill: isLocked ? "oklch(0.45 0.018 60)" : "oklch(0.93 0.014 80)",
                    }}
                  >
                    {r.name}
                  </text>
                  {isSelected ? (
                    <circle
                      r={8.4}
                      fill="none"
                      stroke="oklch(0.72 0.17 60)"
                      strokeWidth={0.4}
                      strokeDasharray="0.8 0.5"
                    >
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from="0"
                        to="360"
                        dur="20s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  ) : null}
                </g>
              )
            })}
          </svg>
        </div>
      </main>

      {/* Bottom squad bar */}
      <div className="border-t border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-2 px-3 py-2.5 sm:px-6 sm:py-3">
          <button
            type="button"
            onClick={() => {
              haptic.select()
              onOpenSquad()
            }}
            className="flex h-12 shrink-0 items-center gap-2 rounded-md border-2 border-border bg-card px-3 font-mono text-[10px] uppercase tracking-[0.22em] text-foreground transition active:scale-[0.97] hover:border-accent/60"
          >
            <Users className="size-4" />
            <span className="font-black">{save.squad.length}/3</span>
          </button>
          <div className="flex flex-1 items-center gap-1.5 overflow-x-auto no-scrollbar">
            {save.squad.length === 0 ? (
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                monte o esquadrão →
              </span>
            ) : (
              save.squad.map((id) => {
                const u = save.roster.find((x) => x.id === id)
                if (!u) return null
                const tpl = MINION_TEMPLATES[u.templateId]
                const tone = TONE_TO_VAR[tpl.tone]
                return (
                  <span
                    key={id}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded border border-border bg-secondary/60 py-1 pl-1 pr-2 font-mono text-[9px] uppercase tracking-wider text-foreground"
                  >
                    <span
                      className="relative size-7 shrink-0 overflow-hidden rounded border"
                      style={{ borderColor: tone }}
                    >
                      <Image
                        src={`/images/minions/${u.templateId}.jpg`}
                        alt={tpl.name}
                        fill
                        sizes="28px"
                        className="object-cover"
                      />
                    </span>
                    {u.name}
                  </span>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Region detail drawer */}
      {selected ? (
        <RegionDrawer
          region={selected}
          status={save.regions[selected.id]}
          squadCount={save.squad.length}
          onClose={() => setSelectedId(null)}
          onInvade={() => {
            haptic.select()
            onPickRegion(selected.id)
          }}
        />
      ) : null}
    </div>
  )
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
}) {
  return (
    <div className="flex shrink-0 items-center gap-1.5 rounded border border-border bg-card/60 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground sm:text-[10px] sm:tracking-[0.2em]">
      <span className="text-accent">{icon}</span>
      <span className="text-foreground tabular-nums">{value}</span>
      <span className="hidden sm:inline">{label}</span>
    </div>
  )
}

function RegionDrawer({
  region,
  status,
  squadCount,
  onClose,
  onInvade,
}: {
  region: Region
  status: "available" | "cleared" | "locked"
  squadCount: number
  onClose: () => void
  onInvade: () => void
}) {
  const heroDetails = region.heroIds
    .map((heroId) => {
      for (let s = 1; s <= 14; s++) {
        const h = getHero(s)
        if (h.id === heroId) return h
      }
      return null
    })
    .filter((h): h is NonNullable<typeof h> => h !== null)

  const canInvade = status === "available" && squadCount > 0
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-background/70 backdrop-blur sm:items-center">
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <div className="vellum drop-in relative w-full max-w-md overflow-hidden rounded-t-lg border-2 border-border sm:rounded-lg">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-2 border-b border-border bg-card/80 px-4 py-3">
          <div className="min-w-0">
            <p className="font-mono text-[9px] tracking-[0.3em] text-accent">
              ESTÁGIO {String(region.stage).padStart(2, "0")} ·{" "}
              {region.biome.toUpperCase()}
            </p>
            <h3 className="truncate font-display text-xl font-black uppercase leading-tight text-foreground sm:text-2xl">
              {region.name}
            </h3>
            <p className="truncate font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {region.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 shrink-0 place-items-center rounded text-muted-foreground transition hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-3 p-4">
          <p className="text-pretty text-sm leading-relaxed text-foreground/85">
            {region.lore}
          </p>

          <div>
            <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
              Defensores
            </p>
            <div className="flex flex-col gap-2">
              {heroDetails.map((h) => (
                <div
                  key={h.id}
                  className="flex items-start gap-2.5 rounded border border-destructive/40 bg-destructive/5 p-2"
                >
                  <span className="relative size-12 shrink-0 overflow-hidden rounded border border-destructive/60">
                    <Image
                      src={`/images/heroes/${h.id}.jpg`}
                      alt={h.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-xs font-black uppercase leading-tight text-destructive sm:text-sm">
                      {h.name}
                    </p>
                    <p className="truncate font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground sm:text-[10px]">
                      {h.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded border border-border bg-secondary/40 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em]">
            <span className="text-muted-foreground">Recompensa</span>
            <span className="flex items-center gap-1.5 text-gold">
              <Coins className="size-3.5" />
              {region.goldReward} ouro + saque
            </span>
          </div>
        </div>

        {/* Footer — primary action in the thumb zone */}
        <div className="border-t border-border bg-card/60 p-3">
          <button
            type="button"
            onClick={onInvade}
            disabled={!canInvade}
            className={cn(
              "flex h-14 w-full items-center justify-center gap-2 rounded-md border-2 px-4 font-display text-sm font-black uppercase tracking-[0.22em] transition active:scale-[0.97] sm:h-16 sm:tracking-[0.25em]",
              canInvade
                ? "border-primary bg-primary text-primary-foreground pulse-glow"
                : "cursor-not-allowed border-border bg-secondary/60 text-muted-foreground",
            )}
          >
            <Swords className="size-5" />
            {status === "cleared"
              ? "JÁ LIMPO"
              : status === "locked"
                ? "BLOQUEADO"
                : squadCount === 0
                  ? "MONTE O ESQUADRÃO"
                  : "INVADIR"}
          </button>
        </div>
      </div>
    </div>
  )
}
