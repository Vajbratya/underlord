"use client"

import { useMemo } from "react"
import { ChevronLeft, Skull, Swords, X, Eye } from "lucide-react"
import {
  ASHFEN_REGIONS,
  BOSSES,
  FACTION_LABEL,
  LOOT_TIER_LABEL,
} from "@/lib/underlord/data"
import type { Region, SaveState } from "@/lib/underlord/types"
import { cn } from "@/lib/utils"

interface Props {
  save: SaveState
  selectedRegion: string | null
  onSelect: (id: string | null) => void
  onBack: () => void
  onRaid: (regionId: string) => void
}

/* hex math (pointy-top) */
const HEX_SIZE = 52
const HEX_W = HEX_SIZE * Math.sqrt(3)
const HEX_H = HEX_SIZE * 2

function axialToXY(q: number, r: number) {
  return {
    x: HEX_W * (q + r / 2),
    y: HEX_SIZE * 1.5 * r,
  }
}

function hexPoints(cx: number, cy: number, size: number) {
  const pts: string[] = []
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30)
    pts.push(`${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`)
  }
  return pts.join(" ")
}

const FACTION_FILL: Record<string, string> = {
  concord: "oklch(0.92 0.04 80 / 0.18)",
  verdant: "oklch(0.55 0.10 145 / 0.18)",
  coin: "oklch(0.78 0.14 75 / 0.18)",
  court: "oklch(0.55 0.22 25 / 0.18)",
  wild: "oklch(0.30 0.018 35 / 0.5)",
}

const FACTION_STROKE: Record<string, string> = {
  concord: "oklch(0.92 0.04 80)",
  verdant: "oklch(0.55 0.10 145)",
  coin: "oklch(0.78 0.14 75)",
  court: "oklch(0.55 0.22 25)",
  wild: "oklch(0.45 0.02 35)",
}

export function Overworld({
  save,
  selectedRegion,
  onSelect,
  onBack,
  onRaid,
}: Props) {
  const layout = useMemo(() => {
    const positions = ASHFEN_REGIONS.map((reg) => {
      const { x, y } = axialToXY(reg.q, reg.r)
      return { region: reg, x, y }
    })
    const xs = positions.map((p) => p.x)
    const ys = positions.map((p) => p.y)
    const pad = 80
    const minX = Math.min(...xs) - pad
    const maxX = Math.max(...xs) + pad
    const minY = Math.min(...ys) - pad
    const maxY = Math.max(...ys) + pad
    return {
      positions,
      viewBox: `${minX} ${minY} ${maxX - minX} ${maxY - minY}`,
    }
  }, [])

  const region = selectedRegion
    ? ASHFEN_REGIONS.find((r) => r.id === selectedRegion) ?? null
    : null

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-6xl flex-col px-4 pb-safe pt-safe sm:px-6">
      <header className="flex items-center justify-between pt-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 font-mono text-[10px] tracking-[0.3em] text-muted-foreground transition hover:text-foreground"
        >
          <ChevronLeft className="size-3.5" />
          SPIRE
        </button>
        <div className="text-center">
          <p className="font-display text-sm font-black tracking-[0.3em] text-foreground sm:text-base">
            ASHFEN COAST
          </p>
          <p className="font-mono text-[9px] tracking-[0.3em] text-muted-foreground sm:text-[10px]">
            CYCLE {String(save.cycle).padStart(2, "0")} · {ASHFEN_REGIONS.length} REGIONS
          </p>
        </div>
        <span className="w-12" />
      </header>

      <section className="parchment relative mt-4 flex-1 overflow-hidden rounded-md border border-border bg-card/30 sm:mt-6">
        <svg
          viewBox={layout.viewBox}
          className="h-full w-full select-none"
          role="img"
          aria-label="Ashfen Coast hex map"
        >
          {/* connection lines between adjacent regions */}
          <g aria-hidden="true">
            {layout.positions.flatMap((a, i) =>
              layout.positions.slice(i + 1).map((b) => {
                const dq = Math.abs(a.region.q - b.region.q)
                const dr = Math.abs(a.region.r - b.region.r)
                const adj = (dq + dr <= 1) || (dq === 1 && dr === 1 && Math.sign(a.region.q - b.region.q) !== Math.sign(a.region.r - b.region.r))
                if (!adj) return null
                return (
                  <line
                    key={`${a.region.id}-${b.region.id}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="oklch(0.30 0.018 35)"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                  />
                )
              }),
            )}
          </g>

          {/* hexes */}
          {layout.positions.map(({ region: reg, x, y }) => {
            const corruption = save.regionCorruption[reg.id] ?? 0
            const isSel = selectedRegion === reg.id
            return (
              <RegionHex
                key={reg.id}
                region={reg}
                x={x}
                y={y}
                corruption={corruption}
                selected={isSel}
                onClick={() => onSelect(isSel ? null : reg.id)}
              />
            )
          })}
        </svg>

        <Legend />
      </section>

      {region ? (
        <RegionPanel
          region={region}
          corruption={save.regionCorruption[region.id] ?? 0}
          onClose={() => onSelect(null)}
          onRaid={() => onRaid(region.id)}
        />
      ) : null}
    </main>
  )
}

/* ------------------------------------------------------------------ */
/* Hex                                                                   */
/* ------------------------------------------------------------------ */

function RegionHex({
  region: reg,
  x,
  y,
  corruption,
  selected,
  onClick,
}: {
  region: Region
  x: number
  y: number
  corruption: number
  selected: boolean
  onClick: () => void
}) {
  const fill = FACTION_FILL[reg.faction] ?? FACTION_FILL.wild
  const stroke = FACTION_STROKE[reg.faction] ?? FACTION_STROKE.wild
  const isBoss = !!reg.bossId
  const isLandmark = !!reg.landmark && !isBoss
  const corrPct = corruption / 10
  return (
    <g
      tabIndex={0}
      role="button"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick()
        }
      }}
      className="cursor-pointer outline-none focus-visible:[&_polygon]:stroke-[3]"
      aria-label={`${reg.name}, ${FACTION_LABEL[reg.faction]}, garrison ${reg.garrison}`}
    >
      {/* shadow */}
      <polygon
        points={hexPoints(x, y + 3, HEX_SIZE)}
        fill="oklch(0 0 0 / 0.4)"
      />
      {/* base */}
      <polygon
        points={hexPoints(x, y, HEX_SIZE)}
        fill={fill}
        stroke={stroke}
        strokeWidth={selected ? 3 : 1.5}
        className="transition-all"
      />
      {/* corruption overlay */}
      {corrPct > 0 ? (
        <polygon
          points={hexPoints(x, y, HEX_SIZE)}
          fill="oklch(0.55 0.22 25)"
          opacity={corrPct * 0.45}
        />
      ) : null}
      {/* boss / landmark marker */}
      {isBoss ? (
        <g transform={`translate(${x}, ${y - HEX_SIZE * 0.35})`}>
          <circle r={9} fill="oklch(0.55 0.22 25)" stroke="oklch(0.13 0.018 35)" strokeWidth={2} />
          <text
            textAnchor="middle"
            y={3.5}
            fontSize={11}
            fontWeight={900}
            fill="oklch(0.96 0.02 80)"
            fontFamily="var(--font-mono)"
          >
            X
          </text>
        </g>
      ) : isLandmark ? (
        <circle
          cx={x}
          cy={y - HEX_SIZE * 0.35}
          r={5}
          fill="oklch(0.78 0.14 75)"
          stroke="oklch(0.13 0.018 35)"
          strokeWidth={1.5}
        />
      ) : null}
      {/* name */}
      <text
        x={x}
        y={y + 4}
        textAnchor="middle"
        fontSize={9}
        fontWeight={700}
        fill="oklch(0.92 0.025 80)"
        fontFamily="var(--font-mono)"
        className="pointer-events-none"
        style={{ letterSpacing: "0.1em" }}
      >
        {reg.name.split(" ")[0]}
      </text>
      {/* garrison */}
      <text
        x={x}
        y={y + HEX_SIZE * 0.55}
        textAnchor="middle"
        fontSize={8}
        fontWeight={500}
        fill="oklch(0.66 0.03 60)"
        fontFamily="var(--font-mono)"
        className="pointer-events-none"
        style={{ letterSpacing: "0.15em" }}
      >
        G{reg.garrison}
      </text>
      {selected ? (
        <polygon
          points={hexPoints(x, y, HEX_SIZE + 6)}
          fill="none"
          stroke="oklch(0.68 0.18 45)"
          strokeWidth={2}
          strokeDasharray="4 3"
          className="seal-rotate"
          style={{ transformOrigin: `${x}px ${y}px` }}
        />
      ) : null}
    </g>
  )
}

/* ------------------------------------------------------------------ */
/* Legend                                                               */
/* ------------------------------------------------------------------ */

function Legend() {
  const items = [
    { f: "concord", label: "CONCORD" },
    { f: "coin", label: "COIN HOUSE" },
    { f: "court", label: "ASH COURT" },
    { f: "wild", label: "UNTENDED" },
  ]
  return (
    <div className="absolute left-2 top-2 flex flex-col gap-1 rounded border border-border bg-background/80 p-2 backdrop-blur">
      <p className="font-mono text-[8px] tracking-[0.3em] text-muted-foreground">FACTIONS</p>
      {items.map((it) => (
        <div key={it.f} className="flex items-center gap-1.5">
          <span
            className="size-2.5 rounded-sm border"
            style={{
              background: FACTION_FILL[it.f],
              borderColor: FACTION_STROKE[it.f],
            }}
            aria-hidden="true"
          />
          <span className="font-mono text-[9px] tracking-wider text-foreground">
            {it.label}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Region panel                                                          */
/* ------------------------------------------------------------------ */

function RegionPanel({
  region: reg,
  corruption,
  onClose,
  onRaid,
}: {
  region: Region
  corruption: number
  onClose: () => void
  onRaid: () => void
}) {
  const boss = reg.bossId ? BOSSES.find((b) => b.id === reg.bossId) : null
  return (
    <aside
      className="drop-in fixed inset-x-0 bottom-0 z-40 mx-auto max-w-3xl rounded-t-md border-t-2 border-primary/60 bg-card/95 p-4 shadow-[0_-12px_48px_oklch(0.68_0.18_45/0.2)] backdrop-blur sm:p-5"
      role="dialog"
      aria-label={`${reg.name} details`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[9px] tracking-[0.3em] text-muted-foreground">
            {FACTION_LABEL[reg.faction].toUpperCase()}
          </p>
          <h2 className="font-display mt-0.5 text-lg font-black tracking-[0.15em] text-foreground sm:text-xl">
            {reg.name}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded p-1 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{reg.blurb}</p>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <PanelStat label="GARRISON" value={`${reg.garrison}/10`} />
        <PanelStat label="LOOT" value={LOOT_TIER_LABEL[reg.lootTier]} tone="gold" />
        <PanelStat label="CORRUPT" value={`${corruption}/10`} tone="taint" />
      </div>

      {reg.landmark ? (
        <div className="mt-3 rounded border border-border bg-background/60 px-3 py-2">
          <p className="font-mono text-[9px] tracking-[0.3em] text-muted-foreground">LANDMARK</p>
          <p className="mt-0.5 text-[12px] font-bold text-foreground">{reg.landmark}</p>
        </div>
      ) : null}

      {boss ? (
        <div className="mt-2 rounded border-2 border-destructive/50 bg-destructive/10 px-3 py-2">
          <p className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.3em] text-destructive">
            <Skull className="size-3" /> BOSS — {boss.name}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            <span className="text-foreground">{boss.epithet}.</span> {boss.gimmick}
          </p>
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onRaid}
          className="flex items-center justify-center gap-2 rounded-md border-2 border-border bg-card px-3 py-2.5 font-mono text-[10px] font-bold tracking-[0.25em] text-foreground transition hover:border-primary/60 hover:text-primary active:scale-[0.98]"
        >
          <Eye className="size-4" />
          RECON
        </button>
        <button
          type="button"
          disabled
          className="flex cursor-not-allowed items-center justify-center gap-2 rounded-md bg-secondary/60 px-3 py-2.5 font-mono text-[10px] font-bold tracking-[0.25em] text-muted-foreground"
          title="Battle prototype lands in next slice"
        >
          <Swords className="size-4" />
          RAID · LOCKED
        </button>
      </div>
      <p className="mt-2 text-center font-mono text-[9px] tracking-[0.3em] text-muted-foreground/70">
        TACTICAL BATTLE · ARRIVING NEXT MILESTONE
      </p>
    </aside>
  )
}

function PanelStat({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: "gold" | "taint"
}) {
  return (
    <div className="rounded border border-border bg-background/60 px-2 py-1.5">
      <p className="font-mono text-[8px] tracking-[0.25em] text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-0.5 font-mono text-xs font-black tabular-nums",
          tone === "gold" && "text-[var(--gold)]",
          tone === "taint" && "text-[var(--taint)]",
          !tone && "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  )
}

