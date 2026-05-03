"use client"

import Image from "next/image"
import { useMemo, useState } from "react"
import { Coins, Crown, Map, Skull, Swords, Users, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Region, SaveState } from "@/lib/underlord/types"
import { REGIONS } from "@/lib/underlord/regions"
import { MINION_TEMPLATES } from "@/lib/underlord/units"
import { getHero } from "@/lib/elementum-flavor"

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
}: {
  save: SaveState
  onPickRegion: (regionId: string) => void
  onOpenSquad: () => void
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = REGIONS.find((r) => r.id === selectedId) ?? null

  const cleared = useMemo(
    () => REGIONS.filter((r) => save.regions[r.id] === "cleared").length,
    [save.regions],
  )
  const total = REGIONS.length

  return (
    <div className="flex min-h-dvh w-full flex-col bg-background pb-safe pt-safe">
      {/* Header */}
      <header className="border-b border-border bg-card/40 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <Map className="size-4 text-accent" />
            <h1 className="font-display text-base font-black uppercase tracking-[0.18em] text-foreground sm:text-lg">
              Sala de Guerra
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Stat icon={<Coins className="size-3.5" />} label="OURO" value={save.gold} />
            <Stat icon={<Skull className="size-3.5" />} label="HERÓIS MORTOS" value={save.heroesKilled.length} />
            <Stat icon={<Crown className="size-3.5" />} label="REGIÕES" value={`${cleared}/${total}`} />
          </div>
        </div>
      </header>

      {/* Map */}
      <main className="relative flex flex-1 flex-col">
        <div className="grain relative mx-auto w-full max-w-5xl flex-1 overflow-hidden">
          <svg
            viewBox="0 0 100 80"
            className="h-full w-full"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Background land texture */}
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
            <rect x="0" y="0" width="100" height="80" fill="url(#land)" />
            <rect x="0" y="0" width="100" height="80" fill="url(#grid)" opacity="0.5" />

            {/* Region links */}
            {REGIONS.map((r) =>
              r.links.map((linkId) => {
                const target = REGIONS.find((x) => x.id === linkId)
                if (!target) return null
                if (r.id > target.id) return null // dedupe
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
                    y1={r.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={active ? "oklch(0.55 0.21 22 / 0.5)" : "oklch(0.24 0.012 30)"}
                    strokeWidth={active ? 0.4 : 0.25}
                    strokeDasharray={active ? "0.8 0.6" : "0.4 0.4"}
                  />
                )
              }),
            )}

            {/* Region nodes */}
            {REGIONS.map((r) => {
              const status = save.regions[r.id]
              const fill = BIOME_COLOR[r.biome]
              const isSelected = selectedId === r.id
              const isCleared = status === "cleared"
              const isLocked = status === "locked"
              return (
                <g
                  key={r.id}
                  transform={`translate(${r.x}, ${r.y})`}
                  className="cursor-pointer"
                  onClick={() => !isLocked && setSelectedId(r.id)}
                  style={{ pointerEvents: isLocked ? "none" : "auto" }}
                >
                  {/* Outer ring */}
                  <circle
                    r={isSelected ? 4.6 : 4}
                    fill="oklch(0.10 0.012 22)"
                    stroke={isLocked ? "oklch(0.24 0.012 30)" : fill}
                    strokeWidth={isSelected ? 0.7 : 0.4}
                    opacity={isLocked ? 0.5 : 1}
                  />
                  {/* Inner mark */}
                  <circle
                    r={2.2}
                    fill={isLocked ? "oklch(0.18 0.008 30)" : fill}
                    opacity={isLocked ? 0.4 : isCleared ? 0.4 : 1}
                  />
                  {/* Cleared check */}
                  {isCleared ? (
                    <text
                      textAnchor="middle"
                      y={1}
                      className="fill-foreground font-mono"
                      style={{ fontSize: "2.6px", fontWeight: 900 }}
                    >
                      ✕
                    </text>
                  ) : null}
                  {/* Stage tier */}
                  {!isCleared && !isLocked ? (
                    <text
                      textAnchor="middle"
                      y={0.9}
                      className="fill-foreground font-mono"
                      style={{ fontSize: "2.4px", fontWeight: 700 }}
                    >
                      {r.stage}
                    </text>
                  ) : null}
                  {/* Label */}
                  <text
                    textAnchor="middle"
                    y={-5.8}
                    className="font-mono"
                    style={{
                      fontSize: "1.8px",
                      fontWeight: 700,
                      letterSpacing: "0.15em",
                      fill: isLocked ? "oklch(0.45 0.018 60)" : "oklch(0.93 0.014 80)",
                    }}
                  >
                    {r.name}
                  </text>
                  {/* Selection ring */}
                  {isSelected ? (
                    <circle
                      r={6}
                      fill="none"
                      stroke="oklch(0.72 0.17 60)"
                      strokeWidth={0.3}
                      strokeDasharray="0.6 0.4"
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
      <div className="border-t border-border bg-card/40 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={onOpenSquad}
            className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-foreground transition hover:border-accent/60 hover:text-accent"
          >
            <Users className="size-3.5" />
            ESQUADRÃO ({save.squad.length}/3)
          </button>
          <div className="flex flex-1 items-center gap-1.5 overflow-x-auto no-scrollbar">
            {save.squad.map((id) => {
              const u = save.roster.find((x) => x.id === id)
              if (!u) return null
              const tpl = MINION_TEMPLATES[u.templateId]
              const tone = TONE_TO_VAR[tpl.tone]
              return (
                <span
                  key={id}
                  className="inline-flex shrink-0 items-center gap-2 rounded border border-border bg-secondary/60 py-1 pl-1 pr-2 font-mono text-[9px] uppercase tracking-wider text-foreground"
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
            })}
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
          onInvade={() => onPickRegion(selected.id)}
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
    <div className="flex items-center gap-1.5 rounded border border-border bg-card/60 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground sm:text-[10px]">
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
  // Resolve heroes by id (search across all 14 stages)
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
          <div>
            <p className="font-mono text-[9px] tracking-[0.3em] text-accent">
              ESTÁGIO {String(region.stage).padStart(2, "0")} ·{" "}
              {region.biome.toUpperCase()}
            </p>
            <h3 className="font-display text-xl font-black uppercase leading-tight text-foreground sm:text-2xl">
              {region.name}
            </h3>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {region.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-muted-foreground transition hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 p-4">
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
                    <p className="font-display text-xs font-black uppercase leading-tight text-destructive sm:text-sm">
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

        {/* Footer */}
        <div className="border-t border-border bg-card/60 p-4">
          <button
            type="button"
            onClick={onInvade}
            disabled={!canInvade}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-md border-2 px-4 py-3 font-display text-sm font-black uppercase tracking-[0.25em] transition active:scale-[0.98]",
              canInvade
                ? "border-primary bg-primary text-primary-foreground"
                : "cursor-not-allowed border-border bg-secondary/60 text-muted-foreground",
            )}
          >
            <Swords className="size-4" />
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
