"use client"

/**
 * WorldMap — interactive crusade map with fog of war + biome zones.
 *
 * Design notes (v9 redesign):
 *   - The previous map dumped all 68 regions on screen at once. New
 *     players saw stage-20 bosses before clearing stage 1, which was
 *     overwhelming AND killed campaign mystery.
 *   - Visibility rules (fog of war):
 *       * "cleared" regions: always shown, desaturated.
 *       * "available" regions: always shown, glowing.
 *       * "locked" regions: shown ONLY if they neighbor an available
 *         region (one-step preview), as a dim parchment silhouette
 *         with a "?" instead of the stage number.
 *       * Everything else is hidden completely.
 *   - Biome blobs: each biome paints a soft tinted hull behind its
 *     visible regions, so the map reads as territory rather than a
 *     forest of disconnected dots.
 *   - Auto-frame: viewBox is the bounding box of visible regions,
 *     padded. Early game shows the starting cluster, large; late game
 *     gradually reveals the world.
 *   - Boss crowns: real, bigger, drawn above the node with a sigil
 *     bar so they read as marquee fights at a glance.
 *   - Pan: horizontal scroll preserved on mobile, but the auto-frame
 *     usually makes that unnecessary now.
 *
 * The component is a pure view: it dispatches `onSelectRegion(id)` and
 * lets the parent open the existing RegionDrawer.
 */

import { useMemo } from "react"
import { Coins, Crown, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Region, SaveState } from "@/lib/underlord/types"
import { REGIONS } from "@/lib/underlord/regions"

type Status = "available" | "cleared" | "locked"

// Biome palette. Tuned so cleared/available/peek versions are clearly
// distinguishable while every node still reads as "this biome".
const BIOME: Record<
  Region["biome"],
  { core: string; halo: string; label: string }
> = {
  ash: {
    core: "oklch(0.58 0.20 22)",
    halo: "oklch(0.58 0.20 22 / 0.10)",
    label: "CINZAS",
  },
  moor: {
    core: "oklch(0.50 0.07 220)",
    halo: "oklch(0.50 0.07 220 / 0.10)",
    label: "BREJOS",
  },
  iron: {
    core: "oklch(0.62 0.025 240)",
    halo: "oklch(0.62 0.025 240 / 0.10)",
    label: "FERRO",
  },
  verdant: {
    core: "oklch(0.55 0.13 140)",
    halo: "oklch(0.55 0.13 140 / 0.10)",
    label: "VERDOR",
  },
  crown: {
    core: "oklch(0.78 0.14 78)",
    halo: "oklch(0.78 0.14 78 / 0.12)",
    label: "COROA",
  },
  tundra: {
    core: "oklch(0.85 0.04 220)",
    halo: "oklch(0.85 0.04 220 / 0.10)",
    label: "TUNDRA",
  },
  dunes: {
    core: "oklch(0.78 0.14 90)",
    halo: "oklch(0.78 0.14 90 / 0.10)",
    label: "DUNAS",
  },
  abyss: {
    core: "oklch(0.42 0.10 220)",
    halo: "oklch(0.42 0.10 220 / 0.12)",
    label: "ABISMO",
  },
}

export function WorldMap({
  save,
  selectedId,
  onSelectRegion,
}: {
  save: SaveState
  selectedId: string | null
  onSelectRegion: (id: string) => void
}) {
  // ---------------------------------------------------------------
  // Visibility (fog of war)
  // ---------------------------------------------------------------
  const { visibleIds, peekIds } = useMemo(() => {
    const visible = new Set<string>()
    const peek = new Set<string>()
    const byId = new Map(REGIONS.map((r) => [r.id, r] as const))
    for (const r of REGIONS) {
      const status = save.regions[r.id]
      if (status === "available" || status === "cleared") visible.add(r.id)
    }
    // Add one-step previews: locked neighbors of available regions.
    for (const r of REGIONS) {
      if (save.regions[r.id] !== "available") continue
      for (const n of r.links) {
        const nb = byId.get(n)
        if (!nb) continue
        if (save.regions[n] === "locked") {
          peek.add(n)
          visible.add(n)
        }
      }
    }
    return { visibleIds: visible, peekIds: peek }
  }, [save.regions])

  const visibleRegions = useMemo(
    () => REGIONS.filter((r) => visibleIds.has(r.id)),
    [visibleIds],
  )

  // ---------------------------------------------------------------
  // Auto-frame: viewBox = padded bbox of visible regions.
  // ---------------------------------------------------------------
  const view = useMemo(() => {
    if (visibleRegions.length === 0) {
      // Defensive — shouldn't happen because save always has at least
      // one available region. Render the whole world if it does.
      return { x: 0, y: 0, w: 100, h: 100 }
    }
    let minX = 100,
      minY = 100,
      maxX = 0,
      maxY = 0
    for (const r of visibleRegions) {
      if (r.x < minX) minX = r.x
      if (r.y < minY) minY = r.y
      if (r.x > maxX) maxX = r.x
      if (r.y > maxY) maxY = r.y
    }
    // Pad so nodes don't kiss the edges. Grow more on the short axis
    // to keep the frame from stretching too narrow.
    const padX = Math.max(10, (maxX - minX) * 0.18)
    const padY = Math.max(10, (maxY - minY) * 0.18)
    let x = Math.max(0, minX - padX)
    let y = Math.max(0, minY - padY)
    let w = Math.min(100 - x, maxX - minX + padX * 2)
    let h = Math.min(100 - y, maxY - minY + padY * 2)
    // Force a minimum frame so super-early game (1-2 regions visible)
    // doesn't zoom-bomb the player into a single dot.
    const minFrame = 38
    if (w < minFrame) {
      const cx = x + w / 2
      x = Math.max(0, Math.min(100 - minFrame, cx - minFrame / 2))
      w = minFrame
    }
    if (h < minFrame) {
      const cy = y + h / 2
      y = Math.max(0, Math.min(100 - minFrame, cy - minFrame / 2))
      h = minFrame
    }
    return { x, y, w, h }
  }, [visibleRegions])

  // ---------------------------------------------------------------
  // Edges between visible regions.
  // ---------------------------------------------------------------
  const edges = useMemo(() => {
    const seen = new Set<string>()
    const out: { a: Region; b: Region }[] = []
    const byId = new Map(REGIONS.map((r) => [r.id, r] as const))
    for (const r of visibleRegions) {
      for (const n of r.links) {
        if (!visibleIds.has(n)) continue
        const target = byId.get(n)
        if (!target) continue
        const key = [r.id, n].sort().join("|")
        if (seen.has(key)) continue
        seen.add(key)
        out.push({ a: r, b: target })
      }
    }
    return out
  }, [visibleRegions, visibleIds])

  // ---------------------------------------------------------------
  // Biome blob centroids (soft territory backgrounds).
  // ---------------------------------------------------------------
  const biomeBlobs = useMemo(() => {
    const groups = new Map<Region["biome"], Region[]>()
    for (const r of visibleRegions) {
      // Don't include peek-only locked regions in biome territory —
      // they're previews, not yet "claimed" territory.
      if (peekIds.has(r.id)) continue
      const arr = groups.get(r.biome) ?? []
      arr.push(r)
      groups.set(r.biome, arr)
    }
    const out: { biome: Region["biome"]; cx: number; cy: number; r: number }[] =
      []
    for (const [biome, list] of groups) {
      if (list.length === 0) continue
      let sx = 0,
        sy = 0
      for (const r of list) {
        sx += r.x
        sy += r.y
      }
      const cx = sx / list.length
      const cy = sy / list.length
      let maxD = 0
      for (const r of list) {
        const d = Math.hypot(r.x - cx, r.y - cy)
        if (d > maxD) maxD = d
      }
      out.push({
        biome,
        cx,
        cy,
        // Pad the radius so the blob reads as territory, not a dot.
        r: Math.max(7, maxD + 5),
      })
    }
    return out
  }, [visibleRegions, peekIds])

  // ---------------------------------------------------------------
  // Stats & next-suggestion (lowest-stage available region).
  // ---------------------------------------------------------------
  const counts = useMemo(() => {
    return REGIONS.reduce(
      (acc, r) => {
        acc[save.regions[r.id]] += 1
        return acc
      },
      { available: 0, cleared: 0, locked: 0 } as Record<Status, number>,
    )
  }, [save.regions])

  const nextSuggestion = useMemo(() => {
    return [...REGIONS]
      .filter((r) => save.regions[r.id] === "available")
      .sort((a, b) => a.stage - b.stage || a.goldReward - b.goldReward)[0]
  }, [save.regions])

  const totalGold = useMemo(
    () =>
      REGIONS.filter((r) => save.regions[r.id] === "available").reduce(
        (sum, r) => sum + r.goldReward,
        0,
      ),
    [save.regions],
  )

  return (
    <div className="relative">
      {/* Legend strip — kept compact to leave room for the next-target hint */}
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 px-1 font-mono text-[8.5px] uppercase tracking-[0.22em] text-muted-foreground">
        <LegendDot color="oklch(0.58 0.20 22)" label="DISPONÍVEL" glow />
        <LegendDot color="oklch(0.62 0.025 240)" label="LIMPA" muted />
        <LegendDot color="oklch(0.40 0 0)" label="PEEK" dashed />
        {nextSuggestion ? (
          <span className="ml-auto hidden items-center gap-1.5 text-foreground sm:inline-flex">
            <span className="text-muted-foreground">Sugerido</span>
            <span className="text-gold">·</span>
            <span className="font-black tracking-[0.18em]">
              {nextSuggestion.name}
            </span>
          </span>
        ) : null}
      </div>

      <div className="relative overflow-hidden rounded-md border-2 border-border/70 bg-background/40 backdrop-blur">
        {/* Parchment grid */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(oklch(1 0 0 / 0.5) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 0.5) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <svg
          viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
          preserveAspectRatio="xMidYMid meet"
          className="block h-[460px] w-full sm:h-[520px]"
          role="img"
          aria-label="Mapa da Cruzada"
        >
          <defs>
            <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="0.85" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="blob-blur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.2" />
            </filter>
            <radialGradient id="parchment" cx="0.5" cy="0.5" r="0.7">
              <stop offset="0%" stopColor="oklch(0.18 0.01 30 / 0)" />
              <stop offset="100%" stopColor="oklch(0.10 0.01 30 / 0.55)" />
            </radialGradient>
          </defs>

          {/* Vignette covers the visible viewBox */}
          <rect
            x={view.x}
            y={view.y}
            width={view.w}
            height={view.h}
            fill="url(#parchment)"
          />

          {/* Biome territory blobs — drawn first */}
          {biomeBlobs.map((b) => (
            <g key={`blob-${b.biome}`} filter="url(#blob-blur)">
              <circle
                cx={b.cx}
                cy={b.cy}
                r={b.r}
                fill={BIOME[b.biome].halo}
              />
            </g>
          ))}

          {/* Biome labels — small, non-interactive, stripped above blob centroid */}
          {biomeBlobs.map((b) => (
            <text
              key={`blabel-${b.biome}`}
              x={b.cx}
              y={b.cy - b.r * 0.85}
              textAnchor="middle"
              fontSize={1.65}
              fontWeight={900}
              letterSpacing={0.18}
              fill={BIOME[b.biome].core}
              opacity={0.55}
              pointerEvents="none"
              style={{
                fontFamily:
                  "var(--font-display, ui-sans-serif), system-ui, sans-serif",
              }}
            >
              {BIOME[b.biome].label}
            </text>
          ))}

          {/* Edges */}
          {edges.map(({ a, b }, i) => {
            const sa = save.regions[a.id]
            const sb = save.regions[b.id]
            const peek = peekIds.has(a.id) || peekIds.has(b.id)
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
                      ? "oklch(0.55 0.02 240 / 0.55)"
                      : peek
                        ? "oklch(0.55 0.05 30 / 0.45)"
                        : "oklch(0.65 0.04 30 / 0.7)"
                }
                strokeWidth={hot ? 0.55 : 0.35}
                strokeDasharray={peek ? "0.9 0.9" : undefined}
                strokeLinecap="round"
              />
            )
          })}

          {/* Nodes */}
          {visibleRegions.map((r) => {
            const status = save.regions[r.id]
            const isPeek = peekIds.has(r.id)
            const isSelected = r.id === selectedId
            const isBoss =
              r.eliteHeroes?.some((e) => e.kind === "boss") ?? false
            const isMini =
              r.eliteHeroes?.some((e) => e.kind === "miniboss") ?? false
            const palette = BIOME[r.biome]
            // Bigger, simpler radius. Boss/miniboss bumps the size slightly
            // so the marquee fights read taller in the scene.
            const radius =
              (isBoss ? 3.1 : isMini ? 2.7 : 2.4) +
              (isSelected ? 0.4 : 0)
            const ringR = radius + 1.0
            const fill =
              isPeek
                ? "oklch(0.20 0.005 30)"
                : status === "cleared"
                  ? "oklch(0.45 0.02 240)"
                  : palette.core
            return (
              <g
                key={r.id}
                transform={`translate(${r.x}, ${r.y})`}
                className="cursor-pointer"
                style={{
                  opacity: isPeek ? 0.55 : 1,
                }}
              >
                {/* Outer ring */}
                <circle
                  r={ringR}
                  fill="none"
                  stroke={
                    isPeek
                      ? "oklch(0.45 0.02 30 / 0.7)"
                      : status === "available"
                        ? "oklch(0.78 0.14 78)"
                        : "oklch(0.55 0.02 240 / 0.6)"
                  }
                  strokeWidth={isSelected ? 0.7 : 0.45}
                  strokeDasharray={isPeek ? "0.7 0.6" : undefined}
                />

                {/* Selected pulse */}
                {isSelected ? (
                  <circle
                    r={ringR + 0.4}
                    fill="none"
                    stroke="oklch(0.78 0.14 78)"
                    strokeWidth={0.4}
                    style={{
                      animation: "wm-pulse 1.6s ease-out infinite",
                      transformOrigin: "center",
                    }}
                  />
                ) : null}

                {/* Filled disc */}
                <circle
                  r={radius}
                  fill={fill}
                  filter={
                    !isPeek && status === "available"
                      ? "url(#node-glow)"
                      : undefined
                  }
                />

                {/* Centerpiece: peek = "?", cleared = check, others = stage */}
                {isPeek ? (
                  <text
                    textAnchor="middle"
                    dy="0.55"
                    fontSize={radius * 1.0}
                    fontWeight={900}
                    fill="oklch(0.85 0 0 / 0.75)"
                    pointerEvents="none"
                    style={{
                      fontFamily:
                        "var(--font-display, ui-sans-serif), system-ui, sans-serif",
                    }}
                  >
                    ?
                  </text>
                ) : status === "cleared" ? (
                  // SVG-native check (no lucide dep needed inside <svg>)
                  <path
                    d="M -1.0 0 L -0.2 0.9 L 1.2 -0.9"
                    stroke="oklch(0.95 0 0 / 0.85)"
                    strokeWidth={0.45}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    pointerEvents="none"
                  />
                ) : (
                  <text
                    textAnchor="middle"
                    dy="0.45"
                    fontSize={radius * 0.95}
                    fontWeight={900}
                    fill="oklch(1 0 0)"
                    pointerEvents="none"
                    style={{
                      fontFamily:
                        "var(--font-display, ui-sans-serif), system-ui, sans-serif",
                      paintOrder: "stroke",
                      stroke: "oklch(0 0 0 / 0.55)",
                      strokeWidth: 0.18,
                    }}
                  >
                    {r.stage}
                  </text>
                )}

                {/* Boss/miniboss banner — sigil + small bar above the node */}
                {!isPeek && (isBoss || isMini) ? (
                  <g
                    transform={`translate(0, ${-(radius + 2.4)})`}
                    pointerEvents="none"
                  >
                    {/* Banner pill */}
                    <rect
                      x={isBoss ? -3.4 : -2.8}
                      y={-1.1}
                      width={isBoss ? 6.8 : 5.6}
                      height={2.2}
                      rx={0.6}
                      fill={isBoss ? "oklch(0.78 0.14 78)" : "oklch(0.55 0.21 22)"}
                      stroke="oklch(0 0 0 / 0.5)"
                      strokeWidth={0.12}
                    />
                    <text
                      textAnchor="middle"
                      dy="0.4"
                      fontSize={1.4}
                      fontWeight={900}
                      letterSpacing={0.15}
                      fill="oklch(0.10 0.01 30)"
                      style={{
                        fontFamily:
                          "var(--font-display, ui-sans-serif), system-ui, sans-serif",
                      }}
                    >
                      {isBoss ? "BOSS" : "ELITE"}
                    </text>
                  </g>
                ) : null}

                {/* Hit area — bigger than the visible node */}
                <circle
                  r={ringR + 1.6}
                  fill="transparent"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (isPeek) return // peeks are not selectable
                    onSelectRegion(r.id)
                  }}
                  tabIndex={isPeek ? -1 : 0}
                  onKeyDown={(e) => {
                    if (isPeek) return
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      onSelectRegion(r.id)
                    }
                  }}
                  role="button"
                  aria-label={`${r.name} — estágio ${r.stage}, ${labelFor(
                    isPeek ? "locked" : status,
                  )}`}
                  style={{
                    outline: "none",
                    cursor: isPeek ? "not-allowed" : "pointer",
                  }}
                />
              </g>
            )
          })}

          {/* Selected name pill — clamped inside the visible frame */}
          {selectedId
            ? (() => {
                const r = REGIONS.find((x) => x.id === selectedId)
                if (!r || !visibleIds.has(r.id)) return null
                const labelY = Math.min(view.y + view.h - 3, r.y + 6.5)
                const labelX = Math.max(
                  view.x + 14,
                  Math.min(view.x + view.w - 14, r.x),
                )
                const text = r.name
                const w = Math.min(40, Math.max(20, text.length * 1.4))
                return (
                  <g
                    transform={`translate(${labelX}, ${labelY})`}
                    pointerEvents="none"
                  >
                    <rect
                      x={-w / 2}
                      y={-2.3}
                      width={w}
                      height={4.6}
                      rx={1}
                      fill="oklch(0.10 0.005 30 / 0.94)"
                      stroke="oklch(0.78 0.14 78 / 0.7)"
                      strokeWidth={0.18}
                    />
                    <text
                      textAnchor="middle"
                      dy="0.55"
                      fontSize={2}
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

        <style>{`
          @keyframes wm-pulse {
            0% { transform: scale(1); opacity: 0.85; }
            70% { transform: scale(1.45); opacity: 0; }
            100% { transform: scale(1.45); opacity: 0; }
          }
        `}</style>
      </div>

      {/* Footer */}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 px-1 font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
        <span>
          <span className="text-foreground tabular-nums">
            {counts.available}
          </span>{" "}
          abertas
        </span>
        <span className="opacity-50">·</span>
        <span>
          <span className="text-foreground tabular-nums">{counts.cleared}</span>{" "}
          limpas
        </span>
        <span className="opacity-50">·</span>
        <span>
          <span className="text-foreground tabular-nums">{counts.locked}</span>{" "}
          a desbravar
        </span>
        <span className="ml-auto flex items-center gap-1 text-gold">
          <Coins className="size-3" />
          <span className="font-black tabular-nums">{totalGold}</span>
          <span>disponível</span>
        </span>
      </div>
    </div>
  )
}

function LegendDot({
  color,
  label,
  muted,
  dashed,
  glow,
}: {
  color: string
  label: string
  muted?: boolean
  dashed?: boolean
  glow?: boolean
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
          boxShadow: glow ? `0 0 6px ${color}` : undefined,
        }}
      />
      <span>{label}</span>
    </span>
  )
}

function labelFor(s: Status): string {
  return s === "available"
    ? "disponível"
    : s === "cleared"
      ? "limpa"
      : "bloqueada"
}

// Re-exported for downstream views that want the same iconography.
export { Crown, HelpCircle }
