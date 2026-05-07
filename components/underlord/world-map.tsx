"use client"

/**
 * WorldMap — the actual interactive crusade map.
 *
 * The previous "MAPA DA CRUZADA" section was a vertical list of region
 * cards. The Region type already carries `x`, `y` (0-100 board space)
 * and a `links` adjacency list, so this component finally puts that
 * data on screen as a real graph:
 *
 *   - SVG canvas, viewBox 0..100 in both axes, so node positions match
 *     the values authored in `lib/underlord/regions.ts` exactly.
 *   - Edges first, nodes on top, labels last (z-order = readability).
 *   - Each region is a clickable node colored by biome with the stage
 *     number embossed inside. The status (`locked` / `available` /
 *     `cleared`) controls outline + glow.
 *   - Boss-tier regions (with `eliteHeroes` containing a `boss`) get a
 *     crown sigil overlay so they read as marquee fights at a glance.
 *   - Selected region pulses; the parent owns the drawer.
 *
 * Mobile: the SVG sits inside a horizontally-scrollable wrapper with a
 * min-width of 720px so it always pans on small screens. Keyboard:
 * each node is a real <button> so Tab + Enter just works.
 */

import { useMemo } from "react"
import { Coins, Crown, Lock, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Region, SaveState } from "@/lib/underlord/types"
import { REGIONS } from "@/lib/underlord/regions"

// Same color palette used by the (now-replaced) list view, kept here so
// the dot color matches the drawer banner color exactly.
const BIOME_COLOR: Record<Region["biome"], string> = {
  ash: "oklch(0.55 0.21 22)",
  moor: "oklch(0.50 0.07 220)",
  iron: "oklch(0.62 0.025 240)",
  verdant: "oklch(0.55 0.13 140)",
  crown: "oklch(0.78 0.14 78)",
  tundra: "oklch(0.85 0.04 220)",
  dunes: "oklch(0.78 0.14 90)",
  abyss: "oklch(0.30 0.08 220)",
}

type Status = "available" | "cleared" | "locked"

export function WorldMap({
  save,
  selectedId,
  onSelectRegion,
}: {
  save: SaveState
  selectedId: string | null
  onSelectRegion: (id: string) => void
}) {
  // Pre-compute the unique edge list. `links` is authored both ways in
  // many regions (A links B, B links A) — dedupe by sorting the pair.
  const edges = useMemo(() => {
    const seen = new Set<string>()
    const out: { a: Region; b: Region }[] = []
    const byId = new Map(REGIONS.map((r) => [r.id, r] as const))
    for (const r of REGIONS) {
      for (const n of r.links) {
        const target = byId.get(n)
        if (!target) continue
        const key = [r.id, n].sort().join("|")
        if (seen.has(key)) continue
        seen.add(key)
        out.push({ a: r, b: target })
      }
    }
    return out
  }, [])

  return (
    <div className="relative">
      {/* Legend */}
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 px-1 font-mono text-[8.5px] uppercase tracking-[0.22em] text-muted-foreground">
        <LegendDot color="oklch(0.55 0.21 22)" label="DISPONÍVEL" />
        <LegendDot color="oklch(0.62 0.025 240)" label="LIMPA" muted />
        <LegendDot color="oklch(0.40 0 0)" label="BLOQ." dashed />
        <span className="ml-auto hidden items-center gap-1 sm:inline-flex">
          <Crown className="size-3 text-gold" />
          <span>BOSS</span>
        </span>
      </div>

      {/* Scroll container — keeps the map readable on mobile by giving
          it a guaranteed min-width to pan within. */}
      <div className="relative overflow-x-auto overflow-y-hidden rounded-md border-2 border-border/70 bg-background/40 backdrop-blur">
        {/* Subtle parchment grid behind the map */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(oklch(1 0 0 / 0.5) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 0.5) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
          className="block h-[460px] w-full min-w-[720px] sm:h-[520px]"
          role="img"
          aria-label="Mapa da Cruzada"
        >
          {/* Defs: glow filter for the active node and a soft drop
              shadow for boss markers. */}
          <defs>
            <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="0.9" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <radialGradient id="parchment" cx="0.5" cy="0.5" r="0.7">
              <stop offset="0%" stopColor="oklch(0.18 0.01 30 / 0)" />
              <stop offset="100%" stopColor="oklch(0.10 0.01 30 / 0.55)" />
            </radialGradient>
          </defs>

          {/* Vignette */}
          <rect x="0" y="0" width="100" height="100" fill="url(#parchment)" />

          {/* Edges — drawn first so nodes sit on top. The line goes dim
              when both endpoints are locked, gold when one endpoint is
              the selected region. */}
          {edges.map(({ a, b }, i) => {
            const sa = save.regions[a.id]
            const sb = save.regions[b.id]
            const dim = sa === "locked" && sb === "locked"
            const hot = a.id === selectedId || b.id === selectedId
            const cleared = sa === "cleared" && sb === "cleared"
            return (
              <line
                key={`edge-${i}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={
                  hot
                    ? "oklch(0.78 0.14 78)"
                    : cleared
                      ? "oklch(0.55 0.02 240 / 0.6)"
                      : dim
                        ? "oklch(0.40 0 0 / 0.45)"
                        : "oklch(0.65 0.04 30 / 0.65)"
                }
                strokeWidth={hot ? 0.6 : 0.35}
                strokeDasharray={dim ? "1 1.2" : undefined}
                strokeLinecap="round"
              />
            )
          })}

          {/* Nodes */}
          {REGIONS.map((r) => {
            const status: Status = save.regions[r.id]
            const isSelected = r.id === selectedId
            const isBoss =
              r.eliteHeroes?.some((e) => e.kind === "boss") ?? false
            const fill = BIOME_COLOR[r.biome]
            // Radius scales with stage so late-game looms larger.
            const radius = 1.6 + Math.min(2.2, r.stage * 0.12)
            const ringR = radius + 1.1
            return (
              <g
                key={r.id}
                transform={`translate(${r.x}, ${r.y})`}
                className={cn(
                  "cursor-pointer transition-opacity",
                  status === "locked" && "opacity-55",
                )}
              >
                {/* Outer ring — outline by status */}
                <circle
                  r={ringR}
                  fill="none"
                  stroke={
                    status === "available"
                      ? "oklch(0.55 0.21 22)"
                      : status === "cleared"
                        ? "oklch(0.55 0.02 240 / 0.7)"
                        : "oklch(0.40 0 0 / 0.7)"
                  }
                  strokeWidth={isSelected ? 0.7 : 0.45}
                  strokeDasharray={status === "locked" ? "0.8 0.6" : undefined}
                />

                {/* Selected pulse — second ring, animated via CSS */}
                {isSelected ? (
                  <circle
                    r={ringR + 0.4}
                    fill="none"
                    stroke="oklch(0.78 0.14 78)"
                    strokeWidth={0.35}
                    style={{
                      animation: "wm-pulse 1.6s ease-out infinite",
                      transformOrigin: "center",
                    }}
                  />
                ) : null}

                {/* Filled disc — biome color, dimmed for cleared */}
                <circle
                  r={radius}
                  fill={status === "cleared" ? "oklch(0.45 0.02 240)" : fill}
                  filter={status === "available" ? "url(#node-glow)" : undefined}
                  opacity={status === "locked" ? 0.55 : 1}
                />

                {/* Stage number, embossed white */}
                <text
                  textAnchor="middle"
                  dy="0.4"
                  fontSize={radius * 0.95}
                  fontWeight={900}
                  fill={status === "cleared" ? "oklch(0.85 0 0 / 0.7)" : "oklch(1 0 0)"}
                  style={{
                    fontFamily:
                      "var(--font-display, ui-sans-serif), system-ui, sans-serif",
                    pointerEvents: "none",
                    paintOrder: "stroke",
                    stroke: "oklch(0 0 0 / 0.55)",
                    strokeWidth: 0.18,
                  }}
                >
                  {r.stage}
                </text>

                {/* Boss crown sigil — small triangle above the node */}
                {isBoss ? (
                  <g
                    transform={`translate(0, ${-(radius + 1.6)})`}
                    pointerEvents="none"
                  >
                    <polygon
                      points="-1.1,0.9 0,-0.6 1.1,0.9"
                      fill="oklch(0.78 0.14 78)"
                      stroke="oklch(0 0 0 / 0.5)"
                      strokeWidth={0.12}
                    />
                  </g>
                ) : null}

                {/* Hit area — separate so click is forgiving */}
                <circle
                  r={ringR + 1.6}
                  fill="transparent"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectRegion(r.id)
                  }}
                  // Keyboard parity — Enter/Space when focused.
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      onSelectRegion(r.id)
                    }
                  }}
                  role="button"
                  aria-label={`${r.name} — estágio ${r.stage}, ${labelFor(status)}`}
                  style={{ outline: "none" }}
                />
              </g>
            )
          })}

          {/* Region label for the selected node — drawn last so it sits
              above everything, with its own background pill. */}
          {selectedId
            ? (() => {
                const r = REGIONS.find((x) => x.id === selectedId)
                if (!r) return null
                // Place the label just below the node, clamped so it
                // doesn't run off the SVG edges.
                const labelY = Math.min(96, r.y + 5.2)
                const labelX = Math.max(14, Math.min(86, r.x))
                const text = r.name
                const w = Math.min(40, Math.max(18, text.length * 1.45))
                return (
                  <g
                    transform={`translate(${labelX}, ${labelY})`}
                    pointerEvents="none"
                  >
                    <rect
                      x={-w / 2}
                      y={-2.2}
                      width={w}
                      height={4.4}
                      rx={1}
                      fill="oklch(0.10 0.005 30 / 0.92)"
                      stroke="oklch(0.78 0.14 78 / 0.7)"
                      strokeWidth={0.18}
                    />
                    <text
                      textAnchor="middle"
                      dy="0.55"
                      fontSize={2.1}
                      fontWeight={900}
                      letterSpacing={0.2}
                      fill="oklch(0.95 0 0)"
                      style={{
                        fontFamily:
                          "var(--font-display, ui-sans-serif), system-ui, sans-serif",
                      }}
                    >
                      {text.toUpperCase()}
                    </text>
                  </g>
                )
              })()
            : null}
        </svg>

        {/* Inline stylesheet for the map-only pulse keyframe — scoped to
            this component to avoid polluting globals.css. */}
        <style>{`
          @keyframes wm-pulse {
            0% { transform: scale(1); opacity: 0.85; }
            70% { transform: scale(1.45); opacity: 0; }
            100% { transform: scale(1.45); opacity: 0; }
          }
        `}</style>
      </div>

      {/* Footer caption — quick stats so the map doesn't feel stranded.
          Reads off the same `save.regions` map the SVG uses. */}
      <MapFooter save={save} />
    </div>
  )
}

function LegendDot({
  color,
  label,
  muted,
  dashed,
}: {
  color: string
  label: string
  muted?: boolean
  dashed?: boolean
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={cn(
          "inline-block size-2.5 rounded-full",
          dashed && "border border-dashed",
        )}
        style={{
          backgroundColor: dashed ? "transparent" : color,
          borderColor: dashed ? color : undefined,
          opacity: muted ? 0.55 : 1,
        }}
      />
      <span>{label}</span>
    </span>
  )
}

function MapFooter({ save }: { save: SaveState }) {
  const counts = REGIONS.reduce(
    (acc, r) => {
      const s = save.regions[r.id]
      acc[s] += 1
      return acc
    },
    { available: 0, cleared: 0, locked: 0 } as Record<Status, number>,
  )
  const totalGold = REGIONS.filter(
    (r) => save.regions[r.id] === "available",
  ).reduce((sum, r) => sum + r.goldReward, 0)
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 px-1 font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
      <span>
        <span className="text-foreground tabular-nums">{counts.available}</span> abertas
      </span>
      <span className="opacity-50">·</span>
      <span>
        <span className="text-foreground tabular-nums">{counts.cleared}</span> limpas
      </span>
      <span className="opacity-50">·</span>
      <span>
        <span className="text-foreground tabular-nums">{counts.locked}</span> bloq.
      </span>
      <span className="ml-auto flex items-center gap-1 text-gold">
        <Coins className="size-3" />
        <span className="font-black tabular-nums">{totalGold}</span>
        <span>disponível</span>
      </span>
    </div>
  )
}

function labelFor(s: Status): string {
  return s === "available" ? "disponível" : s === "cleared" ? "limpa" : "bloqueada"
}

// Re-export icons used elsewhere in the file to keep tree-shaking happy.
export { Lock, Shield }
