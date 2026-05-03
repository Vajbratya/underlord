"use client"

import Image from "next/image"
import { useEffect, useMemo, useReducer, useRef, useState } from "react"
import { Skull, Swords, Zap, Flame } from "lucide-react"
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
import { haptic } from "@/lib/underlord/haptics"

/* Portrait-first hex map: narrower & taller so phones in portrait
   show big touch targets without squeezing the playfield. */
const COLS = 6
const ROWS = 9

const BIOME_BG: Record<Region["biome"], string> = {
  ash: "oklch(0.13 0.018 22)",
  moor: "oklch(0.14 0.020 220)",
  iron: "oklch(0.13 0.010 240)",
  verdant: "oklch(0.13 0.020 140)",
  crown: "oklch(0.14 0.022 78)",
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
  // Heroes at the TOP (low r) of the portrait grid, spread across center columns.
  const heroUnits: Unit[] = region.heroIds.map((heroId, i) => {
    const hero = getHeroById(heroId)
    const r = 0
    const offset = -Math.floor(r / 2)
    const q = offset + 1 + i * 2
    return makeHero(
      heroId,
      hero?.name.split(",")[0] ?? heroId.toUpperCase(),
      heroSymbol(heroId),
      { q: Math.min(q, offset + COLS - 1), r },
      region.stage,
    )
  })
  // Minions at the BOTTOM (high r), spread across.
  const placedSquad: Unit[] = squad.slice(0, 3).map((u, i) => {
    const r = ROWS - 1
    const offset = -Math.floor(r / 2)
    const q = offset + 1 + i * 2
    return makeUnit(u.templateId, { q: Math.min(q, offset + COLS - 1), r }, {
      name: u.name,
      hp: u.hpMax,
      hpMax: u.hpMax,
      atk: u.atk,
      move: u.move,
      range: u.range,
      spd: u.spd,
      equipped: u.equipped,
    })
  })
  return initBattle([...placedSquad, ...heroUnits], COLS, ROWS)
}

function heroSymbol(heroId: string): string {
  switch (heroId) {
    case "bryan": return "✦"
    case "kevin": return "✚"
    case "tyrella": return "✟"
    case "daggor": return "✪"
    case "gandolfini": return "✺"
    case "vexanna": return "✱"
    case "blazborn": return "✜"
    case "gregorius": return "☩"
    case "bianca": return "❄"
    case "baldrik": return "♛"
    case "midas": return "$"
    case "profecia": return "◉"
    case "heliarch": return "☼"
    default: return "?"
  }
}

/* ---------- FX types ---------- */

type Popup = {
  id: string
  x: number
  y: number
  text: string
  tone: "good" | "bad" | "crit"
}
type Puff = { id: string; x: number; y: number }
type FlashSet = Set<string>

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
  const [puffs, setPuffs] = useState<Puff[]>([])
  const [flashIds, setFlashIds] = useState<FlashSet>(new Set())
  const [shake, setShake] = useState<"soft" | "hard" | null>(null)
  const [taunt, setTaunt] = useState<{ from: string; text: string } | null>(null)
  const [streak, setStreak] = useState(0)
  const [turnBanner, setTurnBanner] = useState<string | null>(null)
  const fxCounter = useRef(0)

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
  const padding = HEX_SIZE * 1.05
  const viewW = maxX - minX + padding * 2
  const viewH = maxY - minY + padding * 2
  const offsetX = -minX + padding
  const offsetY = -minY + padding

  /* "Banner" whenever it becomes the player's turn (per active unit) */
  useEffect(() => {
    if (!isMinionTurn || !active) return
    setTurnBanner(active.name)
    const t = window.setTimeout(() => setTurnBanner(null), 1300)
    haptic.select()
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id, isMinionTurn])

  /* Reset streak whenever the round changes */
  useEffect(() => {
    setStreak(0)
  }, [state.round])

  /* AI auto-run on hero turn */
  useEffect(() => {
    if (!isHeroTurn || !active) return
    const timer = window.setTimeout(() => {
      const hero = getHeroById(active.heroId ?? "")
      if (hero && hero.taunts.length && Math.random() < 0.6) {
        setTaunt({ from: active.name, text: rand(hero.taunts) })
        window.setTimeout(() => setTaunt(null), 1500)
      }
      const beforeUnits = state.units
      const next = aiTakeTurn(state, active.id)
      for (const u of next.units) {
        const before = beforeUnits.find((b) => b.id === u.id)
        if (before && before.hp > u.hp) {
          const px = axialToPixel(u.pos)
          pushPopup(`-${before.hp - u.hp}`, "bad", px.x, px.y)
          flashUnit(u.id)
          setShake("hard")
          window.setTimeout(() => setShake(null), 550)
          haptic.hit()
          if (u.dead) {
            pushPuff(px.x, px.y)
            haptic.kill()
          }
        }
      }
      dispatch({ type: "set", state: next })
    }, 600)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.turn, state.round, isHeroTurn])

  /* Battle done → haptic + callback */
  useEffect(() => {
    if (!state.done) return
    if (state.done === "victory") haptic.victory()
    else haptic.defeat()
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
    }, 1700)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.done])

  function nextFxId(prefix: string): string {
    fxCounter.current += 1
    return `${prefix}${fxCounter.current}`
  }

  function pushPopup(text: string, tone: Popup["tone"], x: number, y: number) {
    const id = nextFxId("p")
    setPopups((p) => [...p, { id, x, y, text, tone }])
    window.setTimeout(() => {
      setPopups((p) => p.filter((x) => x.id !== id))
    }, tone === "crit" ? 1400 : 1100)
  }

  function pushPuff(x: number, y: number) {
    const id = nextFxId("k")
    setPuffs((p) => [...p, { id, x, y }])
    window.setTimeout(() => {
      setPuffs((p) => p.filter((x) => x.id !== id))
    }, 750)
  }

  function flashUnit(unitId: string) {
    setFlashIds((s) => {
      const n = new Set(s)
      n.add(unitId)
      return n
    })
    window.setTimeout(() => {
      setFlashIds((s) => {
        const n = new Set(s)
        n.delete(unitId)
        return n
      })
    }, 380)
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

  const attackTargetsLeft = highlights.attack.size

  function handleHexClick(a: Axial) {
    if (!isMinionTurn || !active) return
    haptic.tap()
    const target = unitAt(state, a)

    if (target && target.id === active.id) {
      dispatch({ type: "select", id: state.selectedId === active.id ? null : active.id })
      return
    }
    if (state.selectedId !== active.id) {
      dispatch({ type: "select", id: active.id })
      return
    }

    if (target && target.faction === "hero" && !target.dead) {
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
        if (outcome.crit) {
          pushPopup(`CRÍTICO -${outcome.damage}`, "crit", px.x, px.y)
          haptic.crit()
        } else {
          pushPopup(`-${outcome.damage}`, "good", px.x, px.y)
          haptic.hit()
        }
        flashUnit(target.id)
        setShake(outcome.crit ? "hard" : "soft")
        window.setTimeout(() => setShake(null), outcome.crit ? 550 : 380)
        if (outcome.killed) {
          pushPuff(px.x, px.y)
          haptic.kill()
          setStreak((s) => s + 1)
          if (Math.random() < 0.45) {
            setTaunt({ from: "UNDERLORD", text: rand(UNDERLORD_LINES.roundWin) })
            window.setTimeout(() => setTaunt(null), 1400)
          }
        }
      }
      dispatch({ type: "set", state: endTurn(next) })
      return
    }

    if (highlights.move.has(axialKey(a)) && !target) {
      const next = moveUnit(state, active.id, a)
      dispatch({ type: "set", state: next })
      return
    }
  }

  function handleEndTurn() {
    if (!isMinionTurn) return
    haptic.select()
    dispatch({ type: "set", state: endTurn(state) })
  }

  const minionsAlive = state.units.filter((u) => u.faction === "minion" && !u.dead).length
  const heroesAlive = state.units.filter((u) => u.faction === "hero" && !u.dead).length

  return (
    <div
      className="flex min-h-dvh w-full flex-col bg-background pb-safe pt-safe"
      style={{ backgroundColor: BIOME_BG[region.biome] }}
    >
      {/* TOP HUD — info only, away from the thumb zone */}
      <header className="shrink-0 border-b border-border bg-card/70 px-3 py-2 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[9px] tracking-[0.3em] text-accent">
              R{state.round} · ESTÁGIO {region.stage}
            </p>
            <h1 className="truncate font-display text-sm font-black uppercase leading-none tracking-tight text-foreground">
              {region.name}
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-2 font-mono text-[10px] uppercase tracking-wider tabular-nums">
            <span className="flex items-center gap-1 text-accent">
              <span className="size-1.5 rounded-full bg-accent" />
              {minionsAlive}
            </span>
            <span className="text-muted-foreground">vs</span>
            <span className="flex items-center gap-1 text-destructive">
              <span className="size-1.5 rounded-full bg-destructive" />
              {heroesAlive}
            </span>
          </div>
        </div>
        <InitiativeStrip state={state} />
      </header>

      {/* BATTLEFIELD */}
      <main
        className={cn(
          "relative flex flex-1 items-center justify-center overflow-hidden p-1.5",
          shake === "soft" && "screen-shake",
          shake === "hard" && "screen-shake-hard",
        )}
      >
        <div
          className="relative grain mx-auto h-full w-full max-w-md rounded-md border border-border/60"
          style={{ aspectRatio: `${viewW} / ${viewH}`, maxHeight: "100%" }}
        >
          <svg viewBox={`0 0 ${viewW} ${viewH}`} className="h-full w-full">
            <defs>
              <clipPath id="unitClip">
                <circle r={HEX_SIZE * 0.6} />
              </clipPath>
              <radialGradient id="puffGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="oklch(0.78 0.14 78 / 0.95)" />
                <stop offset="60%" stopColor="oklch(0.55 0.21 22 / 0.7)" />
                <stop offset="100%" stopColor="oklch(0.55 0.21 22 / 0)" />
              </radialGradient>
            </defs>
            {/* Tiles: visible polygon + larger transparent hit area */}
            {pixelTiles.map((t) => {
              const k = axialKey(t)
              const inMove = highlights.move.has(k)
              const inAttack = highlights.attack.has(k)
              const cx = t.x + offsetX
              const cy = t.y + offsetY
              const points = hexPoints(cx, cy, HEX_SIZE - 1)
              const hitPoints = hexPoints(cx, cy, HEX_SIZE * 1.05)
              return (
                <g key={k}>
                  <polygon
                    points={points}
                    fill={
                      inAttack
                        ? "oklch(0.55 0.21 22 / 0.32)"
                        : inMove
                          ? "oklch(0.72 0.17 60 / 0.20)"
                          : "oklch(0.18 0.014 22 / 0.4)"
                    }
                    stroke={
                      inAttack
                        ? "oklch(0.55 0.21 22 / 0.85)"
                        : inMove
                          ? "oklch(0.72 0.17 60 / 0.7)"
                          : "oklch(0.24 0.012 30)"
                    }
                    strokeWidth={inMove || inAttack ? 1.5 : 0.6}
                    className="transition"
                    style={{ pointerEvents: "none" }}
                  />
                  <polygon
                    points={hitPoints}
                    fill="transparent"
                    className="cursor-pointer"
                    onClick={() => handleHexClick(t)}
                  />
                </g>
              )
            })}

            {/* Units */}
            {state.units.map((u) => {
              if (u.dead) return null
              const px = axialToPixel(u.pos)
              const cx = px.x + offsetX
              const cy = px.y + offsetY
              const isActive = active?.id === u.id
              const flashing = flashIds.has(u.id)
              return (
                <g
                  key={u.id}
                  transform={`translate(${cx}, ${cy})`}
                  className="pointer-events-none"
                >
                  {isActive ? (
                    <circle
                      r={HEX_SIZE * 0.92}
                      fill="none"
                      stroke={u.faction === "minion" ? "oklch(0.72 0.17 60)" : "oklch(0.55 0.21 22)"}
                      strokeWidth={2}
                      strokeDasharray="4 2.5"
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
                  <circle
                    r={HEX_SIZE * 0.6}
                    fill={
                      u.faction === "hero"
                        ? "oklch(0.55 0.21 22)"
                        : tonePixel(u.tone)
                    }
                  />
                  <image
                    href={
                      u.faction === "hero"
                        ? `/images/heroes/${u.heroId ?? "bryan"}.jpg`
                        : `/images/minions/${u.templateId}.jpg`
                    }
                    x={-HEX_SIZE * 0.6}
                    y={-HEX_SIZE * 0.6}
                    width={HEX_SIZE * 1.2}
                    height={HEX_SIZE * 1.2}
                    clipPath="url(#unitClip)"
                    preserveAspectRatio="xMidYMid slice"
                  />
                  {flashing ? (
                    <circle
                      r={HEX_SIZE * 0.6}
                      fill="oklch(0.96 0.012 80 / 0.7)"
                      className="hit-flash"
                    />
                  ) : null}
                  <circle
                    r={HEX_SIZE * 0.6}
                    fill="none"
                    stroke={
                      u.faction === "hero"
                        ? "oklch(0.55 0.21 22)"
                        : tonePixel(u.tone)
                    }
                    strokeWidth={1.6}
                  />
                  <rect
                    x={-HEX_SIZE * 0.65}
                    y={HEX_SIZE * 0.62}
                    width={HEX_SIZE * 1.3}
                    height={3.5}
                    fill="oklch(0.10 0.012 22)"
                    stroke="oklch(0.24 0.012 30)"
                    strokeWidth={0.4}
                  />
                  <rect
                    x={-HEX_SIZE * 0.65}
                    y={HEX_SIZE * 0.62}
                    width={HEX_SIZE * 1.3 * (u.hp / u.hpMax)}
                    height={3.5}
                    fill={
                      u.faction === "hero"
                        ? "oklch(0.55 0.21 22)"
                        : "oklch(0.72 0.17 60)"
                    }
                  />
                  {u.acted ? (
                    <circle r={HEX_SIZE * 0.6} fill="oklch(0 0 0 / 0.55)" />
                  ) : null}
                </g>
              )
            })}

            {/* Kill puffs */}
            {puffs.map((p) => {
              const cx = p.x + offsetX
              const cy = p.y + offsetY
              return (
                <circle
                  key={p.id}
                  cx={cx}
                  cy={cy}
                  r={HEX_SIZE * 0.9}
                  fill="url(#puffGrad)"
                  className="kill-puff"
                  style={{ transformOrigin: `${cx}px ${cy}px` }}
                />
              )
            })}
          </svg>

          {/* Floating popups */}
          {popups.map((p) => (
            <span
              key={p.id}
              className={cn(
                "pointer-events-none absolute font-display font-black text-outline",
                p.tone === "crit"
                  ? "crit-pop text-4xl text-gold sm:text-5xl"
                  : "dmg-pop text-3xl sm:text-4xl",
                p.tone === "good" && "text-accent",
                p.tone === "bad" && "text-destructive",
              )}
              style={{
                left: `${((p.x + offsetX) / viewW) * 100}%`,
                top: `${((p.y + offsetY) / viewH) * 100}%`,
              }}
            >
              {p.text}
            </span>
          ))}

          {/* Streak counter */}
          {streak >= 2 ? (
            <div
              key={streak}
              className="streak-bump pointer-events-none absolute right-2 top-2 rounded-md border-2 border-gold bg-background/85 px-2.5 py-1 text-right backdrop-blur"
            >
              <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-gold">
                Domínio
              </p>
              <p className="font-display text-xl font-black leading-none text-gold">
                ×{streak}
              </p>
            </div>
          ) : null}

          {/* Hero turn indicator */}
          {isHeroTurn ? (
            <div className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 rounded-full border border-destructive/60 bg-background/80 px-3 py-1 backdrop-blur">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-destructive">
                · vez do {active?.name ?? "herói"} ·
              </p>
            </div>
          ) : null}

          {/* Turn banner */}
          {turnBanner && isMinionTurn ? (
            <div className="pointer-events-none absolute inset-x-0 top-1/3 flex justify-center">
              <div className="turn-banner border-y-2 border-accent bg-accent/15 px-6 py-1.5 backdrop-blur">
                <p className="font-display text-2xl font-black uppercase tracking-[0.18em] text-accent">
                  {turnBanner}
                </p>
              </div>
            </div>
          ) : null}

          {/* Result overlay */}
          {state.done ? (
            <div className="slam-in absolute inset-0 grid place-items-center bg-background/85 backdrop-blur">
              <div className="text-center">
                <p
                  className={cn(
                    "font-display text-5xl font-black uppercase tracking-tight sm:text-7xl",
                    state.done === "victory" ? "text-accent" : "text-destructive",
                  )}
                >
                  {state.done === "victory" ? "LIMPOU" : "CAIU"}
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
        <div className="pointer-events-none fixed bottom-28 left-1/2 z-30 w-[92vw] max-w-md -translate-x-1/2 px-3">
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

      {/* BOTTOM ACTION PANEL — primary thumb zone */}
      <footer className="shrink-0 border-t border-border bg-card/85 px-2.5 pb-3 pt-2 backdrop-blur">
        <div className="mx-auto flex w-full max-w-md items-stretch gap-2">
          {active ? <ActiveUnitCard unit={active} /> : <div className="flex-1" />}
          <button
            type="button"
            onClick={handleEndTurn}
            disabled={!isMinionTurn}
            aria-label="Encerrar turno"
            className={cn(
              "flex h-16 min-w-[5.5rem] flex-col items-center justify-center gap-0.5 rounded-md border-2 px-3 font-display text-[11px] font-black uppercase tracking-[0.18em] transition active:scale-[0.96]",
              isMinionTurn
                ? attackTargetsLeft > 0 && state.selectedId === active?.id
                  ? "border-accent bg-accent text-accent-foreground ready-pulse"
                  : "border-primary bg-primary text-primary-foreground"
                : "cursor-not-allowed border-border bg-secondary/60 text-muted-foreground",
            )}
          >
            {isHeroTurn ? (
              <>
                <Flame className="size-5" />
                <span>VEZ DELE</span>
              </>
            ) : attackTargetsLeft > 0 && state.selectedId === active?.id ? (
              <>
                <Swords className="size-5" />
                <span>ATAQUE</span>
              </>
            ) : (
              <>
                <Zap className="size-5" />
                <span>TURNO</span>
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  )
}

function tonePixel(tone: Unit["tone"]): string {
  switch (tone) {
    case "primary":
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

/* Compact initiative strip — fits the top HUD */
function InitiativeStrip({ state }: { state: BattleState }) {
  return (
    <div className="mt-1.5 flex w-full items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
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
            <span
              className="size-1.5 rounded-full"
              style={{
                backgroundColor:
                  u.faction === "minion" ? "oklch(0.72 0.17 60)" : "oklch(0.55 0.21 22)",
              }}
            />
            {u.name}
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
  const hpPct = unit.hp / unit.hpMax
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md border border-border bg-background/40 px-2 py-1.5">
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
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 truncate font-display text-sm font-black uppercase leading-none text-foreground">
          {unit.name}
          {unit.faction === "hero" ? (
            <Skull className="inline size-3 text-destructive" />
          ) : null}
        </p>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-sm border border-border bg-background/60">
          <div
            className="h-full transition-[width] duration-300"
            style={{
              width: `${hpPct * 100}%`,
              backgroundColor:
                unit.faction === "hero"
                  ? "oklch(0.55 0.21 22)"
                  : "oklch(0.72 0.17 60)",
            }}
          />
        </div>
        <div className="mt-1 flex items-center gap-2 font-mono text-[9px] tabular-nums uppercase tracking-wider text-muted-foreground">
          <span className="text-foreground">
            {unit.hp}/{unit.hpMax}
          </span>
          <span>·</span>
          <span>{unit.atk} ATK</span>
          <span>{unit.range} ALC</span>
          <span>{unit.move} MOV</span>
        </div>
        {tpl ? (
          <p className="truncate font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            {tpl.role}
          </p>
        ) : null}
      </div>
    </div>
  )
}
