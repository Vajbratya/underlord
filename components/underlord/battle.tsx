"use client"

import Image from "next/image"
import { useEffect, useMemo, useReducer, useRef, useState } from "react"
import { Skull, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  HEX_SIZE,
  axialEqual,
  axialKey,
  axialToPixel,
  hexDistance,
  makeBoundsChecker,
  makeRectMap,
  reachable,
} from "@/lib/underlord/hex"
import {
  activeUnit,
  aiTakeTurn,
  attackUnit,
  blockedSet,
  endTurn,
  initBattle,
  moveUnit,
  unitAt,
} from "@/lib/underlord/battle"
import type { BattleState } from "@/lib/underlord/battle"
import type { Axial, Region, Unit } from "@/lib/underlord/types"
import { MINION_TEMPLATES, makeHero, makeUnit } from "@/lib/underlord/units"
import { rand, getHeroById, UNDERLORD_LINES } from "@/lib/elementum-flavor"

const COLS = 8
const ROWS = 7

const BIOME_BG: Record<Region["biome"], string> = {
  ash: "oklch(0.13 0.018 22)",
  moor: "oklch(0.14 0.020 220)",
  iron: "oklch(0.13 0.010 240)",
  verdant: "oklch(0.13 0.020 140)",
  crown: "oklch(0.14 0.022 78)",
}

const TONE_TO_VAR = {
  primary: "var(--primary)",
  destructive: "var(--destructive)",
  accent: "var(--accent)",
  gold: "var(--gold)",
  foreground: "var(--foreground)",
}

type Action =
  | { type: "select"; id: string | null }
  | { type: "set"; state: BattleState }

function reducer(state: BattleState, action: Action): BattleState {
  switch (action.type) {
    case "select":
      return { ...state, selectedId: action.id }
    case "set":
      return action.state
  }
}

/* ---------- Build initial battle from squad + region ---------- */

function buildBattle(squad: Unit[], region: Region): BattleState {
  // Place minions on left columns of grid
  const placedSquad: Unit[] = squad.slice(0, 3).map((u, i) => {
    const r = 1 + i * 2
    const offset = -Math.floor(r / 2)
    return makeUnit(u.templateId, { q: offset + 0, r }, { name: u.name, hp: u.hpMax, hpMax: u.hpMax, atk: u.atk, move: u.move, range: u.range, spd: u.spd, equipped: u.equipped })
  })
  // Heroes on right columns
  const heroUnits: Unit[] = region.heroIds.map((heroId, i) => {
    const hero = getHeroById(heroId)
    const r = 1 + i * 2
    const offset = -Math.floor(r / 2)
    const q = offset + COLS - 1
    return makeHero(
      heroId,
      hero?.name.split(",")[0] ?? heroId.toUpperCase(),
      heroSymbol(heroId),
      { q, r },
      region.stage,
    )
  })
  return initBattle([...placedSquad, ...heroUnits], COLS, ROWS)
}

function heroSymbol(heroId: string): string {
  // Single-character symbol per hero — readable on map
  switch (heroId) {
    case "bryan":
      return "✦"
    case "kevin":
      return "✚"
    case "tyrella":
      return "✟"
    case "daggor":
      return "✪"
    case "gandolfini":
      return "✺"
    case "vexanna":
      return "✱"
    case "blazborn":
      return "✜"
    case "gregorius":
      return "☩"
    case "bianca":
      return "❄"
    case "baldrik":
      return "♛"
    case "midas":
      return "$"
    case "profecia":
      return "◉"
    case "heliarch":
      return "☼"
    default:
      return "?"
  }
}

/* ---------- Damage popups ---------- */

type Popup = { id: string; x: number; y: number; text: string; tone: "good" | "bad" }

/* ---------- Component ---------- */

export function BattleScreen({
  squad,
  region,
  onComplete,
}: {
  squad: Unit[]
  region: Region
  onComplete: (result: {
    victory: boolean
    fallenIds: string[]
    killedHeroIds: string[]
  }) => void
}) {
  const initialBattle = useMemo(() => buildBattle(squad, region), [squad, region])
  const [state, dispatch] = useReducer(reducer, initialBattle)
  const [popups, setPopups] = useState<Popup[]>([])
  const [shake, setShake] = useState(false)
  const [taunt, setTaunt] = useState<{ from: string; text: string } | null>(null)
  const popupCounter = useRef(0)

  const inBounds = useMemo(() => makeBoundsChecker(COLS, ROWS), [])

  const tiles = useMemo(() => makeRectMap(COLS, ROWS), [])
  const active = activeUnit(state)
  const isMinionTurn = active?.faction === "minion" && !state.done
  const isHeroTurn = active?.faction === "hero" && !state.done

  /* Visual extents */
  const pixelTiles = useMemo(() => tiles.map((t) => ({ ...t, ...axialToPixel(t) })), [tiles])
  const minX = Math.min(...pixelTiles.map((p) => p.x))
  const maxX = Math.max(...pixelTiles.map((p) => p.x))
  const minY = Math.min(...pixelTiles.map((p) => p.y))
  const maxY = Math.max(...pixelTiles.map((p) => p.y))
  const padding = HEX_SIZE * 1.2
  const viewW = maxX - minX + padding * 2
  const viewH = maxY - minY + padding * 2
  const offsetX = -minX + padding
  const offsetY = -minY + padding

  /* AI auto-run on hero turn */
  useEffect(() => {
    if (!isHeroTurn || !active) return
    const timer = window.setTimeout(() => {
      // Trigger taunt
      const hero = getHeroById(active.heroId ?? "")
      if (hero && hero.taunts.length) {
        setTaunt({ from: active.name, text: rand(hero.taunts) })
        window.setTimeout(() => setTaunt(null), 1800)
      }
      // Run AI
      const beforeUnits = state.units
      const next = aiTakeTurn(state, active.id)
      // Detect attack outcome to flash damage popup
      for (const u of next.units) {
        const before = beforeUnits.find((b) => b.id === u.id)
        if (before && before.hp > u.hp) {
          const px = axialToPixel(u.pos)
          pushPopup(`-${before.hp - u.hp}`, "bad", px.x, px.y)
          setShake(true)
          window.setTimeout(() => setShake(false), 400)
        }
      }
      dispatch({ type: "set", state: next })
    }, 700)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.turn, state.round, isHeroTurn])

  /* Battle done callback */
  useEffect(() => {
    if (!state.done) return
    const fallenIds = state.units
      .filter((u) => u.faction === "minion" && u.dead)
      .map((u) => u.id)
    const killedHeroIds = state.units
      .filter((u) => u.faction === "hero" && u.dead)
      .map((u) => u.heroId ?? "")
      .filter(Boolean)
    const t = window.setTimeout(() => {
      onComplete({
        victory: state.done === "victory",
        fallenIds,
        killedHeroIds,
      })
    }, 1500)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.done])

  function pushPopup(text: string, tone: "good" | "bad", x: number, y: number) {
    popupCounter.current += 1
    const id = `p${popupCounter.current}`
    setPopups((p) => [...p, { id, x, y, text, tone }])
    window.setTimeout(() => {
      setPopups((p) => p.filter((x) => x.id !== id))
    }, 1200)
  }

  /* Compute highlights based on selection */
  const highlights = useMemo(() => {
    if (!isMinionTurn || !active) return { move: new Set<string>(), attack: new Set<string>() }
    if (state.selectedId !== active.id)
      return { move: new Set<string>(), attack: new Set<string>() }
    const occ = blockedSet(state, active.id)
    const moves = reachable(active.pos, active.move, inBounds, occ)
    const moveSet = new Set(moves.map(axialKey))
    moveSet.add(axialKey(active.pos))
    // Attack tiles: any enemy within range from current pos OR any move-tile
    const allOrigins = [active.pos, ...moves]
    const attackSet = new Set<string>()
    for (const u of state.units) {
      if (u.faction !== "hero" || u.dead) continue
      for (const o of allOrigins) {
        if (hexDistance(o, u.pos) <= active.range) {
          attackSet.add(axialKey(u.pos))
          break
        }
      }
    }
    return { move: moveSet, attack: attackSet }
  }, [active, state, isMinionTurn, inBounds])

  /* Click handler */
  function handleHexClick(a: Axial) {
    if (!isMinionTurn || !active) return
    const target = unitAt(state, a)

    // Click own active unit → toggle select
    if (target && target.id === active.id) {
      dispatch({ type: "select", id: state.selectedId === active.id ? null : active.id })
      return
    }
    // Must select first
    if (state.selectedId !== active.id) {
      dispatch({ type: "select", id: active.id })
      return
    }

    // Click enemy → try to attack (move adjacent first if needed)
    if (target && target.faction === "hero" && !target.dead) {
      // If in range, attack directly
      const occ = blockedSet(state, active.id)
      const reach = reachable(active.pos, active.move, inBounds, occ)
      const allOrigins = [active.pos, ...reach]
      let bestOrigin: Axial | null = null
      let bestDist = Infinity
      for (const o of allOrigins) {
        const d = hexDistance(o, target.pos)
        if (d <= active.range && d < bestDist) {
          bestOrigin = o
          bestDist = d
        }
      }
      if (!bestOrigin) return
      let next = state
      if (!axialEqual(bestOrigin, active.pos)) {
        next = moveUnit(next, active.id, bestOrigin)
      }
      const outcome = attackUnit(next, active.id, target.id)
      next = outcome.state
      if (outcome.hit) {
        const px = axialToPixel(target.pos)
        pushPopup(`-${outcome.damage}`, "good", px.x, px.y)
        setShake(true)
        window.setTimeout(() => setShake(false), 400)
        if (outcome.killed && Math.random() < 0.5) {
          setTaunt({ from: "UNDERLORD", text: rand(UNDERLORD_LINES.roundWin) })
          window.setTimeout(() => setTaunt(null), 1500)
        }
      }
      dispatch({ type: "set", state: endTurn(next) })
      return
    }

    // Click empty tile → move
    if (highlights.move.has(axialKey(a)) && !target) {
      const next = moveUnit(state, active.id, a)
      // Don't auto end turn — let player choose to attack or end
      dispatch({ type: "set", state: next })
      return
    }
  }

  function handleEndTurn() {
    if (!isMinionTurn) return
    dispatch({ type: "set", state: endTurn(state) })
  }

  return (
    <div
      className={cn(
        "flex min-h-dvh w-full flex-col bg-background pb-safe pt-safe",
        shake && "screen-shake",
      )}
      style={{ backgroundColor: BIOME_BG[region.biome] }}
    >
      {/* HUD */}
      <header className="flex flex-col gap-1.5 border-b border-border bg-card/60 px-3 py-2 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4">
        <div className="flex items-baseline gap-2 sm:flex-col sm:items-start sm:gap-0">
          <p className="font-mono text-[9px] tracking-[0.25em] text-accent sm:tracking-[0.3em]">
            R{state.round}
          </p>
          <h1 className="truncate font-display text-sm font-black uppercase leading-none tracking-tight text-foreground sm:text-base">
            {region.name}
          </h1>
        </div>
        <InitiativeLadder state={state} />
      </header>

      {/* Battle area */}
      <main className="relative flex flex-1 items-center justify-center overflow-hidden p-2">
        <div
          className="relative grain w-full max-w-2xl rounded-md border border-border/60"
          style={{ aspectRatio: `${viewW} / ${viewH}` }}
        >
          <svg viewBox={`0 0 ${viewW} ${viewH}`} className="h-full w-full">
            <defs>
              {/* Single shared clipPath for circular unit portraits */}
              <clipPath id="unitClip">
                <circle r={HEX_SIZE * 0.55} />
              </clipPath>
            </defs>
            {/* Tiles */}
            {pixelTiles.map((t) => {
              const k = axialKey(t)
              const inMove = highlights.move.has(k)
              const inAttack = highlights.attack.has(k)
              const cx = t.x + offsetX
              const cy = t.y + offsetY
              const points = hexPoints(cx, cy, HEX_SIZE - 1)
              return (
                <polygon
                  key={k}
                  points={points}
                  fill={
                    inAttack
                      ? "oklch(0.55 0.21 22 / 0.30)"
                      : inMove
                        ? "oklch(0.72 0.17 60 / 0.18)"
                        : "oklch(0.18 0.014 22 / 0.4)"
                  }
                  stroke={
                    inAttack
                      ? "oklch(0.55 0.21 22 / 0.7)"
                      : inMove
                        ? "oklch(0.72 0.17 60 / 0.6)"
                        : "oklch(0.24 0.012 30)"
                  }
                  strokeWidth={inMove || inAttack ? 1.5 : 0.6}
                  className="cursor-pointer transition"
                  onClick={() => handleHexClick(t)}
                />
              )
            })}

            {/* Units */}
            {state.units.map((u) => {
              if (u.dead) return null
              const px = axialToPixel(u.pos)
              const cx = px.x + offsetX
              const cy = px.y + offsetY
              const isActive = active?.id === u.id
              return (
                <g
                  key={u.id}
                  transform={`translate(${cx}, ${cy})`}
                  className="pointer-events-none"
                >
                  {/* Active ring */}
                  {isActive ? (
                    <circle
                      r={HEX_SIZE * 0.85}
                      fill="none"
                      stroke={u.faction === "minion" ? "oklch(0.72 0.17 60)" : "oklch(0.55 0.21 22)"}
                      strokeWidth={1.5}
                      strokeDasharray="3 2"
                    >
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from="0"
                        to="360"
                        dur="6s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  ) : null}
                  {/* Body backing (filled circle behind portrait, also serves as fallback while image loads) */}
                  <circle
                    r={HEX_SIZE * 0.55}
                    fill={
                      u.faction === "hero"
                        ? "oklch(0.55 0.21 22)"
                        : tonePixel(u.tone)
                    }
                  />
                  {/* Portrait clipped into a circle */}
                  <image
                    href={
                      u.faction === "hero"
                        ? `/images/heroes/${u.heroId ?? "bryan"}.jpg`
                        : `/images/minions/${u.templateId}.jpg`
                    }
                    x={-HEX_SIZE * 0.55}
                    y={-HEX_SIZE * 0.55}
                    width={HEX_SIZE * 1.1}
                    height={HEX_SIZE * 1.1}
                    clipPath="url(#unitClip)"
                    preserveAspectRatio="xMidYMid slice"
                  />
                  {/* Faction ring stroke on top */}
                  <circle
                    r={HEX_SIZE * 0.55}
                    fill="none"
                    stroke={
                      u.faction === "hero"
                        ? "oklch(0.55 0.21 22)"
                        : tonePixel(u.tone)
                    }
                    strokeWidth={1.5}
                  />
                  {/* HP bar */}
                  <rect
                    x={-HEX_SIZE * 0.6}
                    y={HEX_SIZE * 0.55}
                    width={HEX_SIZE * 1.2}
                    height={3}
                    fill="oklch(0.10 0.012 22)"
                    stroke="oklch(0.24 0.012 30)"
                    strokeWidth={0.4}
                  />
                  <rect
                    x={-HEX_SIZE * 0.6}
                    y={HEX_SIZE * 0.55}
                    width={HEX_SIZE * 1.2 * (u.hp / u.hpMax)}
                    height={3}
                    fill={
                      u.faction === "hero"
                        ? "oklch(0.55 0.21 22)"
                        : "oklch(0.72 0.17 60)"
                    }
                  />
                  {/* Acted indicator */}
                  {u.acted ? (
                    <circle
                      r={HEX_SIZE * 0.55}
                      fill="oklch(0 0 0 / 0.55)"
                    />
                  ) : null}
                </g>
              )
            })}
          </svg>

          {/* Floating popups */}
          {popups.map((p) => (
            <span
              key={p.id}
              className="float-up pointer-events-none absolute font-display text-2xl font-black"
              style={{
                left: `${((p.x + offsetX) / viewW) * 100}%`,
                top: `${((p.y + offsetY) / viewH) * 100}%`,
                color: p.tone === "good" ? "var(--accent)" : "var(--destructive)",
                textShadow: "0 0 8px oklch(0 0 0 / 0.8)",
              }}
            >
              {p.text}
            </span>
          ))}

          {/* Result overlay */}
          {state.done ? (
            <div className="slam-in absolute inset-0 grid place-items-center bg-background/80 backdrop-blur">
              <div className="text-center">
                <p
                  className={cn(
                    "font-display text-4xl font-black uppercase tracking-tight sm:text-6xl",
                    state.done === "victory" ? "text-accent" : "text-destructive",
                  )}
                >
                  {state.done === "victory" ? "Limpou" : "Caiu"}
                </p>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  apurando ganhos…
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      {/* Taunt bubble */}
      {taunt ? (
        <div className="pointer-events-none fixed bottom-32 left-1/2 z-30 w-[88vw] max-w-md -translate-x-1/2 px-4">
          <div className="slam-in rounded-md border-2 border-destructive/60 bg-card/95 px-4 py-2 backdrop-blur">
            <p className="font-mono text-[9px] tracking-[0.3em] text-muted-foreground">
              {taunt.from}
            </p>
            <p className="font-display text-base font-black leading-tight text-destructive">
              &ldquo;{taunt.text}&rdquo;
            </p>
          </div>
        </div>
      ) : null}

      {/* Footer: turn info + actions */}
      <footer className="border-t border-border bg-card/70 px-2.5 py-2.5 backdrop-blur sm:px-3 sm:py-3">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-2.5 sm:gap-3">
          {active ? <ActiveUnitCard unit={active} /> : null}
          <div className="flex shrink-0 flex-col items-end gap-1">
            <p className="hidden truncate text-right font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground sm:block sm:tracking-[0.25em]">
              {state.log[state.log.length - 1]}
            </p>
            <button
              type="button"
              onClick={handleEndTurn}
              disabled={!isMinionTurn}
              className={cn(
                "flex items-center gap-1.5 rounded-md border-2 px-3 py-2 font-display text-[11px] font-black uppercase tracking-[0.18em] transition active:scale-[0.98] sm:px-4 sm:text-xs sm:tracking-[0.25em]",
                isMinionTurn
                  ? "border-primary bg-primary text-primary-foreground"
                  : "cursor-not-allowed border-border bg-secondary/60 text-muted-foreground",
              )}
            >
              {isHeroTurn ? "VEZ DELE…" : "TURNO"}
              <Zap className="size-3" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}

function tonePixel(tone: Unit["tone"]): string {
  switch (tone) {
    case "primary":
      return "oklch(0.55 0.21 22)"
    case "destructive":
      return "oklch(0.55 0.21 22)"
    case "accent":
      return "oklch(0.72 0.17 60)"
    case "gold":
      return "oklch(0.78 0.14 78)"
    default:
      return "oklch(0.93 0.014 80)"
  }
}

function hexPoints(cx: number, cy: number, size: number): string {
  const pts: string[] = []
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i + Math.PI / 6
    const x = cx + size * Math.cos(angle)
    const y = cy + size * Math.sin(angle)
    pts.push(`${x},${y}`)
  }
  return pts.join(" ")
}

function InitiativeLadder({ state }: { state: BattleState }) {
  return (
    <div className="flex w-full items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar sm:w-auto sm:max-w-[60%] sm:pb-0">
      {state.order.map((id, i) => {
        const u = state.units.find((x) => x.id === id)
        if (!u) return null
        const isCurrent = i === state.turn
        return (
          <span
            key={id}
            className={cn(
              "flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider transition",
              u.dead
                ? "border-border/40 bg-transparent text-muted-foreground/40 line-through"
                : isCurrent
                  ? u.faction === "minion"
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-destructive bg-destructive/15 text-destructive"
                  : "border-border bg-secondary/40 text-muted-foreground",
            )}
          >
            {u.glyph} {u.name}
          </span>
        )
      })}
    </div>
  )
}

function ActiveUnitCard({ unit }: { unit: Unit }) {
  const tpl = unit.faction === "minion" ? MINION_TEMPLATES[unit.templateId] : null
  const src =
    unit.faction === "hero"
      ? `/images/heroes/${unit.heroId ?? "bryan"}.jpg`
      : `/images/minions/${unit.templateId}.jpg`
  const borderColor =
    unit.faction === "hero" ? "var(--destructive)" : tonePixel(unit.tone)
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span
        className="relative size-12 shrink-0 overflow-hidden rounded-md border-2"
        style={{ borderColor }}
      >
        <Image
          src={src || "/placeholder.svg"}
          alt={unit.name}
          fill
          sizes="48px"
          className="object-cover"
        />
      </span>
      <div className="min-w-0">
        <p className="truncate font-display text-xs font-black uppercase leading-tight text-foreground sm:text-sm">
          {unit.name}
          {unit.faction === "hero" ? (
            <Skull className="ml-1 inline size-3 text-destructive" />
          ) : null}
        </p>
        <div className="flex flex-wrap gap-x-2 gap-y-0 font-mono text-[9px] tabular-nums uppercase tracking-wider text-muted-foreground">
          <span className="text-foreground">
            {unit.hp}/{unit.hpMax} HP
          </span>
          <span>{unit.atk} ATK</span>
          <span>{unit.range} ALC</span>
          <span>{unit.move} MOV</span>
        </div>
        {tpl ? (
          <p className="mt-0.5 truncate font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            {tpl.role}
          </p>
        ) : null}
      </div>
    </div>
  )
}
