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
  //
  // We split visibility into two tiers:
  //   - "active" = available + cleared. These DRIVE the auto-frame.
  //   - "peek"   = locked neighbors of available regions. These are
  //                shown ONLY if they fit inside the padded bbox of
  //                the active set; peeks that would stretch the
  //                viewport into empty space are dropped instead.
  //
  // This is the key fix for the "FERRO label floating in empty
  // space" bug: previously, peek regions far from the active cluster
  // dragged the bbox, leaving a wide letterboxed frame and biome
  // labels orphaned over nothing.
  // ---------------------------------------------------------------
  const { activeIds, peekCandidates } = useMemo(() => {
    const active = new Set<string>()
    const peek = new Set<string>()
    const byId = new Map(REGIONS.map((r) => [r.id, r] as const))
    for (const r of REGIONS) {
      const status = save.regions[r.id]
      if (status === "available" || status === "cleared") active.add(r.id)
    }
    for (const r of REGIONS) {
      if (save.regions[r.id] !== "available") continue
      for (const n of r.links) {
        const nb = byId.get(n)
        if (!nb) continue
        if (save.regions[n] === "locked" && !active.has(n)) peek.add(n)
      }
    }
    return { activeIds: active, peekCandidates: peek }
  }, [save.regions])

  const activeRegions = useMemo(
    () => REGIONS.filter((r) => activeIds.has(r.id)),
    [activeIds],
  )

  // ---------------------------------------------------------------
  // Auto-frame: viewBox = padded bbox of ACTIVE regions only.
  //
  // We deliberately ignore peeks here. Peeks that fall inside the
  // resulting frame are kept; peeks outside are hidden. This keeps
  // the camera anchored on the player's working set.
  // ---------------------------------------------------------------
  const view = useMemo(() => {
    if (activeRegions.length === 0) {
      // Defensive — early-game saves always contain at least one
      // `available` region, but if something nukes the save we
      // fall back to the full world rather than crash.
      return { x: 0, y: 0, w: 100, h: 100 }
    }
    let minX = 100,
      minY = 100,
      maxX = 0,
      maxY = 0
    for (const r of activeRegions) {
      if (r.x < minX) minX = r.x
      if (r.y < minY) minY = r.y
      if (r.x > maxX) maxX = r.x
      if (r.y > maxY) maxY = r.y
    }
    // Generous padding so nodes never kiss the edge AND so the
    // closest peeks tend to fit inside the frame rather than be
    // dropped.
    const span = Math.max(maxX - minX, maxY - minY)
    const pad = Math.max(12, span * 0.32)
    let x = Math.max(0, minX - pad)
    let y = Math.max(0, minY - pad)
    let w = Math.min(100 - x, maxX - minX + pad * 2)
    let h = Math.min(100 - y, maxY - minY + pad * 2)
    // Force a SQUARE-ish frame so the SVG doesn't letterbox into a
    // thin horizontal strip when the active cluster is wide-and-short
    // (or vice versa). We pick whichever axis is bigger and grow
    // the other to match.
    const frame = Math.max(w, h, 42)
    if (w < frame) {
      const cx = x + w / 2
      x = Math.max(0, Math.min(100 - frame, cx - frame / 2))
      w = frame
    }
    if (h < frame) {
      const cy = y + h / 2
      y = Math.max(0, Math.min(100 - frame, cy - frame / 2))
      h = frame
    }
    return { x, y, w, h }
  }, [activeRegions])

  // Peek nodes that actually lie inside the auto-frame. Peeks
  // outside the frame are dropped — they'd be invisible anyway,
  // and including them would have stretched the bbox.
  const { visibleIds, peekIds, visibleRegions } = useMemo(() => {
    const peek = new Set<string>()
    for (const id of peekCandidates) {
      const r = REGIONS.find((x) => x.id === id)
      if (!r) continue
      const inside =
        r.x >= view.x &&
        r.x <= view.x + view.w &&
        r.y >= view.y &&
        r.y <= view.y + view.h
      if (inside) peek.add(id)
    }
    const all = new Set<string>([...activeIds, ...peek])
    return {
      visibleIds: all,
      peekIds: peek,
      visibleRegions: REGIONS.filter((r) => all.has(r.id)),
    }
  }, [activeIds, peekCandidates, view])

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
  // Biome blob centroids — soft territory backgrounds.
  //
  // Computed strictly from ACTIVE (non-peek) regions so the label
  // sits inside the player's actual working area, never floating
  // over empty space pulled out by a far-away peek.
  // ---------------------------------------------------------------
  const biomeBlobs = useMemo(() => {
    const groups = new Map<Region["biome"], Region[]>()
    for (const r of activeRegions) {
      const arr = groups.get(r.biome) ?? []
      arr.push(r)
      groups.set(r.biome, arr)
    }
    const out: {
      biome: Region["biome"]
      cx: number
      cy: number
      r: number
      count: number
    }[] = []
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
      // Single-region biomes still get a generous radius so the
      // territory reads as a territory, not a halo on one dot.
      const r = list.length === 1 ? 8 : Math.max(7.5, maxD + 5)
      out.push({ biome, cx, cy, r, count: list.length })
    }
    return out
  }, [activeRegions])

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

      <div
        className="relative overflow-hidden rounded-md border-2 border-border/70 backdrop-blur"
        style={{
          // Parchment-toned base with a subtle radial fall-off so the
          // map feels like a worn document, not a flat black canvas.
          background:
            "radial-gradient(ellipse at 50% 30%, oklch(0.20 0.015 35 / 0.85) 0%, oklch(0.12 0.01 35 / 0.95) 60%, oklch(0.08 0.005 30) 100%)",
        }}
      >
        {/* Parchment dot pattern — much subtler than the previous grid */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.10]"
          style={{
            backgroundImage:
              "radial-gradient(oklch(0.85 0.05 80 / 0.8) 0.6px, transparent 0.7px)",
            backgroundSize: "18px 18px",
          }}
        />

        <svg
          viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
          preserveAspectRatio="xMidYMid meet"
          className="relative block h-[460px] w-full sm:h-[520px]"
          role="img"
          aria-label="Mapa da Cruzada"
        >
          <defs>
            {/* Per-biome territory gradient. We generate one per biome
                so each blob has its own tint without leaking to others.
                Stops: bright core → quick fade → fully transparent edge. */}
            {(Object.keys(BIOME) as Region["biome"][]).map((b) => (
              <radialGradient
                key={`grad-${b}`}
                id={`territory-${b}`}
                cx="50%"
                cy="50%"
                r="50%"
              >
                <stop offset="0%" stopColor={BIOME[b].core} stopOpacity="0.32" />
                <stop offset="55%" stopColor={BIOME[b].core} stopOpacity="0.14" />
                <stop offset="100%" stopColor={BIOME[b].core} stopOpacity="0" />
              </radialGradient>
            ))}

            <filter
              id="node-glow"
              x="-100%"
              y="-100%"
              width="300%"
              height="300%"
            >
              <feGaussianBlur stdDeviation="1.1" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Soft halo specifically for "available" nodes so they
                pop against the territory tint. Strong enough to read
                at thumbnail scale. */}
            <filter
              id="available-glow"
              x="-200%"
              y="-200%"
              width="500%"
              height="500%"
            >
              <feGaussianBlur stdDeviation="1.6" result="b" />
              <feFlood floodColor="oklch(0.80 0.18 78)" floodOpacity="0.6" />
              <feComposite in2="b" operator="in" result="g" />
              <feMerge>
                <feMergeNode in="g" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Biome territory blobs — drawn first, layered with edge ring
              so they read as actual zones with borders. The dashed
              outer ring helps separate adjacent biomes. */}
          {biomeBlobs.map((b) => (
            <g key={`blob-${b.biome}`}>
              {/* Filled territory */}
              <circle
                cx={b.cx}
                cy={b.cy}
                r={b.r}
                fill={`url(#territory-${b.biome})`}
              />
              {/* Soft border so the territory has a visible edge */}
              <circle
                cx={b.cx}
                cy={b.cy}
                r={b.r * 0.97}
                fill="none"
                stroke={BIOME[b.biome].core}
                strokeOpacity={0.28}
                strokeWidth={0.18}
                strokeDasharray="0.6 0.9"
              />
            </g>
          ))}

          {/* Biome labels — anchored INSIDE the territory at the top of
              the centroid disc, with a subtle backdrop pill so the
              text doesn't disappear behind nodes or blob edges. */}
          {biomeBlobs.map((b) => {
            const txt = BIOME[b.biome].label
            const w = txt.length * 1.05 + 1.8
            const ly = b.cy - b.r * 0.55
            return (
              <g
                key={`blabel-${b.biome}`}
                transform={`translate(${b.cx}, ${ly})`}
                pointerEvents="none"
              >
                <rect
                  x={-w / 2}
                  y={-1.55}
                  width={w}
                  height={3.1}
                  rx={0.6}
                  fill="oklch(0.10 0.01 35 / 0.78)"
                  stroke={BIOME[b.biome].core}
                  strokeOpacity={0.55}
                  strokeWidth={0.13}
                />
                <text
                  textAnchor="middle"
                  dy="0.45"
                  fontSize={1.55}
                  fontWeight={900}
                  letterSpacing={0.22}
                  fill={BIOME[b.biome].core}
                  style={{
                    fontFamily:
                      "var(--font-display, ui-sans-serif), system-ui, sans-serif",
                  }}
                >
                  {txt}
                </text>
              </g>
            )
          })}

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
            // Peek nodes are deliberately smaller — they're a hint of
            // "what's next", not a co-equal node the player can act on.
            const baseRadius = isBoss ? 3.1 : isMini ? 2.7 : 2.4
            const radius =
              (isPeek ? baseRadius * 0.7 : baseRadius) +
              (isSelected ? 0.4 : 0)
            const ringR = radius + 1.0
            const fill =
              isPeek
                ? "oklch(0.16 0.005 30 / 0.7)"
                : status === "cleared"
                  ? "oklch(0.30 0.015 240)" // muted, distinct from "available"
                  : palette.core
            // Per-state ring color. Cleared rings are intentionally
            // dim so the gold "available" rings are the only thing
            // that draws the eye.
            const ringStroke = isPeek
              ? "oklch(0.42 0.02 30 / 0.7)"
              : status === "available"
                ? "oklch(0.82 0.16 78)"
                : "oklch(0.45 0.015 240 / 0.55)"
            return (
              <g
                key={r.id}
                transform={`translate(${r.x}, ${r.y})`}
                className="cursor-pointer"
                style={{
                  opacity: isPeek ? 0.55 : 1,
                }}
              >
                {/* Selected pulse — drawn FIRST so it sits behind the
                    ring; pulse opacity ramp keeps it from dominating */}
                {isSelected ? (
                  <circle
                    r={ringR + 0.4}
                    fill="none"
                    stroke="oklch(0.82 0.16 78)"
                    strokeWidth={0.4}
                    style={{
                      animation: "wm-pulse 1.6s ease-out infinite",
                      transformOrigin: "center",
                    }}
                  />
                ) : null}

                {/* Outer ring */}
                <circle
                  r={ringR}
                  fill="none"
                  stroke={ringStroke}
                  strokeWidth={isSelected ? 0.7 : 0.45}
                  strokeDasharray={isPeek ? "0.7 0.6" : undefined}
                />

                {/* Filled disc — only "available" gets the gold halo
                    filter so it reads as the playable target. Cleared
                    discs stay flat and recessive. */}
                <circle
                  r={radius}
                  fill={fill}
                  filter={
                    !isPeek && status === "available"
                      ? "url(#available-glow)"
                      : undefined
                  }
                />

                {/* Inner sheen — tiny lighter cap so the disc reads as
                    a 3D coin, not a flat sticker. Skipped on peeks. */}
                {!isPeek ? (
                  <ellipse
                    cx={0}
                    cy={-radius * 0.45}
                    rx={radius * 0.6}
                    ry={radius * 0.22}
                    fill="oklch(1 0 0 / 0.10)"
                    pointerEvents="none"
                  />
                ) : null}

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
