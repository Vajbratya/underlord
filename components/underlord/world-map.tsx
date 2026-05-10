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

/**
 * Maps region IDs to the minion archetype unlocked when that region is
 * cleared. Used to show minion portrait badges on the world map.
 * 27 minions spread across the campaign.
 */
const MINION_UNLOCK: Record<string, string> = {
  // Stage 1 — core starters
  'lichmoor': 'brown',
  'putrid-shoals': 'blue',
  'meat-market': 'red',
  // Stage 2
  'rotwell': 'green',
  'bog-cathedral': 'grey',
  'salt-cloister': 'bone',
  'drowned-warden': 'behemoth',
  'sermon-fork': 'harpy',
  'flesh-foundry': 'golem',
  // Stage 3
  'hex-orchard': 'spore',
  'tideglass': 'leech',
  'ironreach': 'gorger',
  'rootlich': 'gargoyle',
  'wraith-fen': 'ratking',
  'gilded-rookery': 'oracle',
  'cinder-grove': 'tidesinger',
  // Stage 4+
  'wyrm-shelf': 'swarm',
  'salt-tomb': 'wraith',
  'thorn-arena': 'succubus',
  'sunkencrown': 'thornbeast',
  'pyre-quay': 'pyrelich',
  'umbra-canal': 'mortar',
  // Stage 5+
  'volcan-temple': 'ravager',
  'hollow-belfry': 'wyrmling',
  'kingreach': 'bulwark',
  'crown-causeway': 'lich',
  'usurper-hall': 'chimera',
  'forge-spire': 'crowlord',
  'mind-archive': 'shade',
  'eternity-foyer': 'colossus',
  'eternity-loop': 'banshee',
}

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
      {/* Legend — simple dots matching reference UI */}
      <div className="mb-2 flex items-center gap-x-4 px-1 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
        <LegendDot color="oklch(0.55 0.18 25)" label="DISPONÍVEL" glow />
        <LegendDot color="oklch(0.50 0.02 220)" label="LIMPA" muted />
      </div>

      {/* Ornate gold frame — matches reference UI */}
      <div
        className="relative overflow-hidden rounded-lg"
        style={{
          // Double border: outer gold, inner dark
          border: "3px solid oklch(0.62 0.14 65)",
          boxShadow:
            "inset 0 0 0 2px oklch(0.12 0.01 30), 0 4px 24px oklch(0 0 0 / 0.6)",
        }}
      >
        {/* Painted fantasy map background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/map-bg.jpg')" }}
        />
        {/* Dark vignette overlay so nodes pop */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 50%, transparent 30%, oklch(0 0 0 / 0.55) 100%)",
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
            {/* Gold glow for available nodes — strong teal-cyan pop */}
            <filter
              id="available-glow"
              x="-150%"
              y="-150%"
              width="400%"
              height="400%"
            >
              <feGaussianBlur stdDeviation="1.4" result="b" />
              <feFlood floodColor="oklch(0.70 0.16 200)" floodOpacity="0.7" />
              <feComposite in2="b" operator="in" result="g" />
              <feMerge>
                <feMergeNode in="g" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Gold ring glow for selected */}
            <filter
              id="ring-glow"
              x="-100%"
              y="-100%"
              width="300%"
              height="300%"
            >
              <feGaussianBlur stdDeviation="0.8" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Biome labels — simple floating text, no pills, matching reference */}
          {biomeBlobs.map((b) => {
            const txt = BIOME[b.biome].label
            return (
              <text
                key={`blabel-${b.biome}`}
                x={b.cx}
                y={b.cy - b.r * 0.45}
                textAnchor="middle"
                fontSize={2.2}
                fontWeight={900}
                letterSpacing={0.28}
                fill={BIOME[b.biome].core}
                opacity={0.95}
                pointerEvents="none"
                style={{
                  fontFamily:
                    "var(--font-display, ui-sans-serif), system-ui, sans-serif",
                  textShadow: "0 1px 4px oklch(0 0 0 / 0.9)",
                }}
              >
                {txt}
              </text>
            )
          })}

          {/* Edges — glowing gold for active paths, dashed grey for locked */}
          {edges.map(({ a, b }, i) => {
            const sa = save.regions[a.id]
            const sb = save.regions[b.id]
            const peek = peekIds.has(a.id) || peekIds.has(b.id)
            const hot = a.id === selectedId || b.id === selectedId
            const bothCleared = sa === "cleared" && sb === "cleared"
            const active = !peek && (sa === "available" || sb === "available")
            return (
              <line
                key={`edge-${i}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={
                  hot
                    ? "oklch(0.85 0.18 55)" // bright gold
                    : active
                      ? "oklch(0.72 0.14 55 / 0.85)" // warm gold
                      : bothCleared
                        ? "oklch(0.50 0.03 55 / 0.5)" // muted tan
                        : "oklch(0.45 0.02 30 / 0.5)" // grey dashed
                }
                strokeWidth={hot ? 0.6 : active ? 0.45 : 0.32}
                strokeDasharray={peek ? "0.8 0.8" : undefined}
                strokeLinecap="round"
                filter={active && !hot ? "url(#ring-glow)" : undefined}
              />
            )
          })}

          {/* Nodes — teal discs with gold rings matching reference */}
          {visibleRegions.map((r) => {
            const status = save.regions[r.id]
            const isPeek = peekIds.has(r.id)
            const isSelected = r.id === selectedId
            const isBoss =
              r.eliteHeroes?.some((e) => e.kind === "boss") ?? false
            const isMini =
              r.eliteHeroes?.some((e) => e.kind === "miniboss") ?? false
            // Sizing: base 2.6, boss bumps, peek shrinks
            const baseRadius = isBoss ? 3.2 : isMini ? 2.9 : 2.6
            const radius =
              (isPeek ? baseRadius * 0.72 : baseRadius) +
              (isSelected ? 0.35 : 0)
            const ringR = radius + 0.9
            // Fill: teal for available, dark grey for cleared/peek
            const fill =
              isPeek
                ? "oklch(0.22 0.01 220 / 0.85)"
                : status === "cleared"
                  ? "oklch(0.32 0.015 220)" // dark slate
                  : "oklch(0.52 0.12 200)" // teal-cyan
            // Ring: gold for available, grey otherwise
            const ringStroke = isPeek
              ? "oklch(0.45 0.02 30 / 0.65)"
              : status === "available"
                ? "oklch(0.78 0.16 65)" // warm gold
                : "oklch(0.50 0.02 30 / 0.6)"
            return (
              <g
                key={r.id}
                transform={`translate(${r.x}, ${r.y})`}
                className="cursor-pointer"
                style={{ opacity: isPeek ? 0.6 : 1 }}
              >
                {/* Selection pulse */}
                {isSelected ? (
                  <circle
                    r={ringR + 0.5}
                    fill="none"
                    stroke="oklch(0.82 0.18 65)"
                    strokeWidth={0.4}
                    style={{
                      animation: "wm-pulse 1.5s ease-out infinite",
                      transformOrigin: "center",
                    }}
                  />
                ) : null}

                {/* Outer gold ring */}
                <circle
                  r={ringR}
                  fill="none"
                  stroke={ringStroke}
                  strokeWidth={isSelected ? 0.65 : 0.4}
                  strokeDasharray={isPeek ? "0.65 0.55" : undefined}
                  filter={
                    !isPeek && status === "available"
                      ? "url(#ring-glow)"
                      : undefined
                  }
                />

                {/* Filled disc */}
                <circle
                  r={radius}
                  fill={fill}
                  filter={
                    !isPeek && status === "available"
                      ? "url(#available-glow)"
                      : undefined
                  }
                />

                {/* Glossy highlight on disc */}
                {!isPeek ? (
                  <ellipse
                    cx={0}
                    cy={-radius * 0.4}
                    rx={radius * 0.55}
                    ry={radius * 0.18}
                    fill="oklch(1 0 0 / 0.18)"
                    pointerEvents="none"
                  />
                ) : null}

                {/* Content: ? for peek, checkmark for cleared, number for available */}
                {isPeek ? (
                  <text
                    textAnchor="middle"
                    dy="0.6"
                    fontSize={radius * 1.1}
                    fontWeight={900}
                    fill="oklch(0.70 0 0 / 0.8)"
                    pointerEvents="none"
                    style={{
                      fontFamily:
                        "var(--font-display, ui-sans-serif), system-ui, sans-serif",
                    }}
                  >
                    ?
                  </text>
                ) : status === "cleared" ? (
                  <path
                    d="M -1.1 0.1 L -0.3 1.0 L 1.3 -0.8"
                    stroke="oklch(0.90 0 0 / 0.9)"
                    strokeWidth={0.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    pointerEvents="none"
                  />
                ) : (
                  <text
                    textAnchor="middle"
                    dy="0.5"
                    fontSize={radius * 0.9}
                    fontWeight={900}
                    fill="oklch(1 0 0)"
                    pointerEvents="none"
                    style={{
                      fontFamily:
                        "var(--font-display, ui-sans-serif), system-ui, sans-serif",
                      textShadow: "0 1px 2px oklch(0 0 0 / 0.6)",
                    }}
                  >
                    {r.stage}
                  </text>
                )}

                {/* Elite/Boss badge — small red pill on top-left, matching reference */}
                {!isPeek && (isBoss || isMini) ? (
                  <g
                    transform={`translate(${-radius * 0.8}, ${-radius * 0.9})`}
                    pointerEvents="none"
                  >
                    <rect
                      x={-2.4}
                      y={-0.9}
                      width={4.8}
                      height={1.8}
                      rx={0.4}
                      fill={isBoss ? "oklch(0.55 0.22 25)" : "oklch(0.50 0.20 25)"}
                      stroke="oklch(0 0 0 / 0.6)"
                      strokeWidth={0.1}
                    />
                    <text
                      textAnchor="middle"
                      dy="0.32"
                      fontSize={1.0}
                      fontWeight={900}
                      letterSpacing={0.1}
                      fill="oklch(0.95 0 0)"
                      style={{
                        fontFamily:
                          "var(--font-display, ui-sans-serif), system-ui, sans-serif",
                      }}
                    >
                      {isBoss ? "BOSS" : "ELITE"}
                    </text>
                  </g>
                ) : null}

                {/* Skull icon below elite badge for minibosses */}
                {!isPeek && isMini && !isBoss ? (
                  <g
                    transform={`translate(${-radius * 0.8}, ${radius * 0.5})`}
                    pointerEvents="none"
                  >
                    <text
                      textAnchor="middle"
                      fontSize={1.4}
                      fill="oklch(0.85 0.15 40)"
                      style={{ fontFamily: "system-ui" }}
                    >
                      ☠
                    </text>
                  </g>
                ) : null}

                {/* Minion unlock portrait — shows which minion you get */}
                {!isPeek && MINION_UNLOCK[r.id] ? (
                  <g
                    transform={`translate(${radius * 0.75}, ${radius * 0.65})`}
                    pointerEvents="none"
                  >
                    {/* Gold ring around portrait */}
                    <circle
                      r={1.8}
                      fill="oklch(0.12 0.01 30)"
                      stroke="oklch(0.72 0.14 65)"
                      strokeWidth={0.25}
                    />
                    {/* Minion portrait as foreignObject for proper img */}
                    <clipPath id={`clip-${r.id}`}>
                      <circle r={1.55} />
                    </clipPath>
                    <image
                      href={`/images/minions/${MINION_UNLOCK[r.id]}.jpg`}
                      x={-1.55}
                      y={-1.55}
                      width={3.1}
                      height={3.1}
                      clipPath={`url(#clip-${r.id})`}
                      preserveAspectRatio="xMidYMid slice"
                    />
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
