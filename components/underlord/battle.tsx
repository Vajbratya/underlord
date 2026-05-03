"use client"

import Image from "next/image"
import { useEffect, useMemo, useReducer, useRef, useState } from "react"
import { Skull, Zap, Flame } from "lucide-react"
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
import { Atmosphere } from "./atmosphere"

// Portrait-oriented grid: narrower than tall.
const COLS = 6
const ROWS = 9

type LocalAction =
  | { type: "select"; id: string | null }
  | { type: "set"; state: BattleState }

function reducer(state: BattleState, action: LocalAction): BattleState {
  switch (action.type) {
    case "select":
      return { ...state, selectedId: action.id }
    case "set":
      return action.state
  }
}

/** Build initial battle: minions at bottom 2 rows, heroes at top 2 rows. */
function buildBattle(squad: Unit[], region: Region): BattleState {
  const placedSquad: Unit[] = squad.slice(0, 3).map((u, i) => {
    // Spawn across columns 1, 3, 5 of the bottom row
    const q = 1 + i * 2
    const r = ROWS - 2
    const offset = -Math.floor(r / 2)
    return makeUnit(u.templateId, { q: q + offset, r }, {
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
  const heroUnits: Unit[] = region.heroIds.map((heroId, i) => {
    const hero = getHeroById(heroId)
    // Spawn across columns 1, 3, 5 of the top-second row
    const q = 1 + i * 2
    const r = 1
    const offset = -Math.floor(r / 2)
    return makeHero(
      heroId,
      hero?.name.split(",")[0] ?? heroId.toUpperCase(),
      "?",
      { q: q + offset, r },
      region.stage,
    )
  })
  return initBattle([...placedSquad, ...heroUnits], COLS, ROWS)
}

type Popup = {
  id: string
  x: number
  y: number
  text: string
  tone: "good" | "bad" | "crit"
}

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
    comboHigh: number
    flawless: boolean
    critsLanded: number
    firstBlood: boolean
  }) => void
}) {
  const initialBattle = useMemo(() => buildBattle(squad, region), [squad, region])
  const [state, dispatch] = useReducer(reducer, initialBattle)
  const [popups, setPopups] = useState<Popup[]>([])
  const [shake, setShake] = useState<0 | 1 | 2 | 3>(0)
  const [taunt, setTaunt] = useState<{ from: string; text: string } | null>(null)
  const [combo, setCombo] = useState(0)
  const [comboFlash, setComboFlash] = useState(false)
  const popupCounter = useRef(0)
  const comboHighRef = useRef(0)
  const critsLandedRef = useRef(0)
  const firstBloodRef = useRef(false)
  const lastTurnRef = useRef(state.turn)
  const lastRoundRef = useRef(state.round)

  const inBounds = useMemo(() => makeBoundsChecker(COLS, ROWS), [])
  const tiles = useMemo(() => makeRectMap(COLS, ROWS), [])
  const active = activeUnit(state)
  const isMinionTurn = active?.faction === "minion" && !state.done
  const isHeroTurn = active?.faction === "hero" && !state.done

  const pixelTiles = useMemo(() => tiles.map((t) => ({ ...t, ...axialToPixel(t) })), [tiles])
  const minX = Math.min(...pixelTiles.map((p) => p.x))
  const maxX = Math.max(...pixelTiles.map((p) => p.x))
  const minY = Math.min(...pixelTiles.map((p) => p.y))
  const maxY = Math.max(...pixelTiles.map((p) => p.y))
  const padding = HEX_SIZE * 1.3
  const viewW = maxX - minX + padding * 2
  const viewH = maxY - minY + padding * 2
  const offsetX = -minX + padding
  const offsetY = -minY + padding

  // Reset combo when turn/round changes
  useEffect(() => {
    if (state.turn !== lastTurnRef.current || state.round !== lastRoundRef.current) {
      setCombo(0)
      lastTurnRef.current = state.turn
      lastRoundRef.current = state.round
    }
  }, [state.turn, state.round])

  // AI turn
  useEffect(() => {
    if (!isHeroTurn || !active) return
    const timer = window.setTimeout(() => {
      const hero = getHeroById(active.heroId ?? "")
      if (hero && hero.taunts.length && Math.random() < 0.4) {
        setTaunt({ from: active.name, text: rand(hero.taunts) })
        window.setTimeout(() => setTaunt(null), 1600)
      }
      const beforeUnits = state.units
      const next = aiTakeTurn(state, active.id)
      for (const u of next.units) {
        const before = beforeUnits.find((b) => b.id === u.id)
        if (before && before.hp > u.hp) {
          const px = axialToPixel(u.pos)
          const dmg = before.hp - u.hp
          pushPopup(`-${dmg}`, "bad", px.x, px.y)
          triggerShake(dmg >= 12 ? 3 : dmg >= 6 ? 2 : 1)
        }
      }
      dispatch({ type: "set", state: next })
    }, 600)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.turn, state.round, isHeroTurn])

  // Battle done
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
        comboHigh: comboHighRef.current,
        flawless: state.done === "victory" && fallenIds.length === 0,
        critsLanded: critsLandedRef.current,
        firstBlood: firstBloodRef.current,
      })
    }, 1700)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.done])

  function pushPopup(text: string, tone: "good" | "bad" | "crit", x: number, y: number) {
    popupCounter.current += 1
    const id = `p${popupCounter.current}`
    setPopups((p) => [...p, { id, x, y, text, tone }])
    window.setTimeout(() => {
      setPopups((p) => p.filter((x) => x.id !== id))
    }, 1100)
  }

  function triggerShake(intensity: 1 | 2 | 3) {
    setShake(intensity)
    window.setTimeout(() => setShake(0), 380)
  }

  function bumpCombo(killed: boolean) {
    setCombo((c) => {
      const next = c + 1
      comboHighRef.current = Math.max(comboHighRef.current, next)
      if (next >= 2) {
        setComboFlash(true)
        window.setTimeout(() => setComboFlash(false), 400)
      }
      return next
    })
    if (killed) triggerShake(3)
  }

  const highlights = useMemo(() => {
    if (!isMinionTurn || !active)
      return { move: new Set<string>(), attack: new Set<string>() }
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

  function handleHexClick(a: Axial) {
    if (!isMinionTurn || !active) return
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
      const comboBonus = 1 + combo * 0.15
      const outcome = attackUnit(next, active.id, target.id, comboBonus)
      next = outcome.state
      if (outcome.hit) {
        if (!firstBloodRef.current) firstBloodRef.current = true
        if (outcome.crit) critsLandedRef.current += 1
        const px = axialToPixel(target.pos)
        const text = outcome.crit ? `-${outcome.damage}!` : `-${outcome.damage}`
        pushPopup(text, outcome.crit ? "crit" : "good", px.x, px.y)
        triggerShake(outcome.damage >= 14 ? 3 : outcome.damage >= 7 ? 2 : 1)
        bumpCombo(outcome.killed)
        if (outcome.killed && Math.random() < 0.5) {
          setTaunt({ from: "UNDERLORD", text: rand(UNDERLORD_LINES.roundWin) })
          window.setTimeout(() => setTaunt(null), 1500)
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
    dispatch({ type: "set", state: endTurn(state) })
  }

  return (
    <div
      className={cn(
        "relative flex h-dvh w-full flex-col overflow-hidden bg-background",
        shake === 1 && "shake-1",
        shake === 2 && "shake-2",
        shake === 3 && "shake-3",
      )}
    >
      <Atmosphere src="/images/bg/battle.jpg" intensity="default" embers={20} />

      {/* Top HUD */}
      <header className="relative z-20 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="flex items-center gap-2 px-3 pt-2.5 pb-2">
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="font-mono text-[8px] uppercase tracking-[0.32em] text-accent">
              ROUND {String(state.round).padStart(2, "0")}
            </p>
            <h1 className="truncate font-display text-[15px] font-black uppercase leading-tight tracking-tight text-foreground">
              {region.name}
            </h1>
          </div>
          {combo >= 2 ? (
            <div
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-md border-2 px-2.5 py-1.5 font-mono text-[10px] font-black uppercase tracking-[0.18em] transition-transform",
                combo >= 5
                  ? "border-gold bg-gold/20 text-gold pulse-glow"
                  : combo >= 3
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-primary bg-primary/15 text-primary",
                comboFlash && "scale-110",
              )}
            >
              <Flame className="size-4" />
              <span className="font-display text-base leading-none tabular-nums">
                {combo}
              </span>
              <span>COMBO</span>
            </div>
          ) : null}
        </div>
        {/* Initiative ladder */}
        <div className="border-t border-border/40 px-2 py-1.5">
          <InitiativeLadder state={state} />
        </div>
      </header>

      {/* Battle area */}
      <main className="relative z-10 flex flex-1 items-stretch justify-center overflow-hidden">
        {/* Faction floor labels */}
        <div className="pointer-events-none absolute inset-x-0 top-2 z-0 text-center">
          <p className="font-mono text-[8px] uppercase tracking-[0.4em] text-destructive/70">
            ─── FORÇAS DA LUZ ───
          </p>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-2 z-0 text-center">
          <p className="font-mono text-[8px] uppercase tracking-[0.4em] text-accent/70">
            ─── SEU EXÉRCITO ───
          </p>
        </div>

        <div
          className="relative h-full w-full"
          style={{
            // Reserve some vertical room for the floor labels
            paddingTop: "1.5rem",
            paddingBottom: "1.5rem",
          }}
        >
          <svg
            viewBox={`0 0 ${viewW} ${viewH}`}
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <radialGradient id="hexFill" cx="50%" cy="40%" r="55%">
                <stop offset="0%" stopColor="oklch(0.20 0.014 22 / 0.5)" />
                <stop offset="100%" stopColor="oklch(0.10 0.012 22 / 0.55)" />
              </radialGradient>
              <radialGradient id="hexFillMove" cx="50%" cy="40%" r="55%">
                <stop offset="0%" stopColor="oklch(0.72 0.17 60 / 0.40)" />
                <stop offset="100%" stopColor="oklch(0.72 0.17 60 / 0.10)" />
              </radialGradient>
              <radialGradient id="hexFillAttack" cx="50%" cy="40%" r="55%">
                <stop offset="0%" stopColor="oklch(0.55 0.21 22 / 0.55)" />
                <stop offset="100%" stopColor="oklch(0.55 0.21 22 / 0.18)" />
              </radialGradient>
            </defs>
            {pixelTiles.map((t) => {
              const k = axialKey(t)
              const inMove = highlights.move.has(k)
              const inAttack = highlights.attack.has(k)
              const cx = t.x + offsetX
              const cy = t.y + offsetY
              const points = hexPoints(cx, cy, HEX_SIZE - 1.5)
              return (
                <polygon
                  key={k}
                  points={points}
                  fill={
                    inAttack
                      ? "url(#hexFillAttack)"
                      : inMove
                        ? "url(#hexFillMove)"
                        : "url(#hexFill)"
                  }
                  stroke={
                    inAttack
                      ? "oklch(0.55 0.21 22 / 0.85)"
                      : inMove
                        ? "oklch(0.72 0.17 60 / 0.75)"
                        : "oklch(0.30 0.012 30 / 0.55)"
                  }
                  strokeWidth={inMove || inAttack ? 1.8 : 0.7}
                  className="transition-colors"
                  onClick={() => handleHexClick(t)}
                  style={{
                    cursor: "pointer",
                    filter:
                      inMove || inAttack
                        ? `drop-shadow(0 0 6px ${inAttack ? "oklch(0.55 0.21 22 / 0.6)" : "oklch(0.72 0.17 60 / 0.5)"})`
                        : undefined,
                  }}
                />
              )
            })}
          </svg>

          {/* Units overlaid as HTML */}
          {state.units.map((u) => {
            if (u.dead) return null
            const px = axialToPixel(u.pos)
            const cx = px.x + offsetX
            const cy = px.y + offsetY
            const isActive = active?.id === u.id
            const xPct = (cx / viewW) * 100
            const yPct = (cy / viewH) * 100
            const sizePct = ((HEX_SIZE * 1.55) / viewW) * 100
            const isHero = u.faction === "hero"
            const src = isHero
              ? `/images/heroes/${u.heroId ?? "bryan"}.jpg`
              : `/images/minions/${u.templateId}.jpg`
            const ringColor = isHero ? "var(--destructive)" : tonePixel(u.tone)
            const hpRatio = u.hp / u.hpMax
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => handleHexClick(u.pos)}
                className={cn(
                  "absolute -translate-x-1/2 -translate-y-1/2 transition active:scale-95",
                  isActive && "z-10",
                  u.acted && "opacity-50",
                )}
                style={{
                  left: `${xPct}%`,
                  top: `${yPct}%`,
                  width: `${sizePct}%`,
                  aspectRatio: "1",
                  filter: isActive
                    ? `drop-shadow(0 0 12px ${ringColor})`
                    : "drop-shadow(0 4px 6px oklch(0 0 0 / 0.6))",
                }}
                aria-label={`${u.name} (${u.hp}/${u.hpMax} HP)`}
              >
                {isActive ? (
                  <span
                    aria-hidden
                    className="active-ring pointer-events-none absolute -inset-1.5 rounded-full border-2"
                    style={{ borderColor: ringColor, borderStyle: "dashed" }}
                  />
                ) : null}
                <span
                  className="absolute inset-0 overflow-hidden rounded-full border-[3px] shadow-lg"
                  style={{ borderColor: ringColor, backgroundColor: ringColor }}
                >
                  <Image
                    src={src || "/placeholder.svg"}
                    alt={u.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                    draggable={false}
                  />
                </span>
                {/* Faction triangle marker (top of unit) */}
                <span
                  aria-hidden
                  className="absolute -top-1.5 left-1/2 size-2 -translate-x-1/2 rotate-45"
                  style={{ backgroundColor: ringColor }}
                />
                {/* HP bar (bottom of unit) */}
                <span
                  aria-hidden
                  className="absolute -bottom-1.5 left-1/2 h-1.5 w-[115%] -translate-x-1/2 overflow-hidden rounded-sm border border-border/80 bg-background/90"
                >
                  <span
                    className="block h-full transition-all"
                    style={{
                      width: `${hpRatio * 100}%`,
                      backgroundColor: isHero
                        ? "var(--destructive)"
                        : hpRatio > 0.5
                          ? "var(--accent)"
                          : hpRatio > 0.25
                            ? "var(--gold)"
                            : "var(--destructive)",
                    }}
                  />
                </span>
              </button>
            )
          })}

          {popups.map((p) => (
            <span
              key={p.id}
              className={cn(
                "float-up text-outline pointer-events-none absolute -translate-x-1/2 -translate-y-full font-display font-black",
                p.tone === "crit" ? "text-4xl sm:text-5xl" : "text-2xl sm:text-3xl",
              )}
              style={{
                left: `${((p.x + offsetX) / viewW) * 100}%`,
                top: `${((p.y + offsetY) / viewH) * 100}%`,
                color:
                  p.tone === "good"
                    ? "var(--accent)"
                    : p.tone === "crit"
                      ? "var(--gold)"
                      : "var(--destructive)",
              }}
            >
              {p.text}
            </span>
          ))}

          {state.done ? (
            <div className="slam-in absolute inset-0 z-30 grid place-items-center bg-background/85 backdrop-blur-md">
              <div className="text-center">
                <div className="mb-3 flex items-center justify-center gap-3">
                  <span
                    className={cn(
                      "h-px w-12",
                      state.done === "victory"
                        ? "bg-gradient-to-r from-transparent to-accent"
                        : "bg-gradient-to-r from-transparent to-destructive",
                    )}
                  />
                  <span
                    className={cn(
                      "size-2 rotate-45",
                      state.done === "victory" ? "bg-accent" : "bg-destructive",
                    )}
                  />
                  <span
                    className={cn(
                      "h-px w-12",
                      state.done === "victory"
                        ? "bg-gradient-to-l from-transparent to-accent"
                        : "bg-gradient-to-l from-transparent to-destructive",
                    )}
                  />
                </div>
                <p
                  className={cn(
                    "font-display text-6xl font-black uppercase tracking-tight sm:text-7xl",
                    state.done === "victory" ? "text-accent" : "text-destructive",
                  )}
                  style={{
                    textShadow: `0 0 40px ${state.done === "victory" ? "oklch(0.72 0.17 60 / 0.6)" : "oklch(0.55 0.21 22 / 0.6)"}`,
                  }}
                >
                  {state.done === "victory" ? "Limpou" : "Caiu"}
                </p>
                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
                  {state.done === "victory" ? "apurando saque…" : "contando os mortos…"}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      {taunt ? (
        <div className="pointer-events-none fixed bottom-24 left-1/2 z-40 w-[88vw] max-w-md -translate-x-1/2 px-4">
          <div className="slam-in rounded-md border-2 border-destructive/70 bg-card/95 px-4 py-2.5 backdrop-blur shadow-[0_8px_24px_oklch(0.55_0.21_22/0.5)]">
            <p className="font-mono text-[8px] tracking-[0.32em] text-muted-foreground">
              {taunt.from}
            </p>
            <p className="font-display text-sm font-black leading-tight text-destructive sm:text-base">
              &ldquo;{taunt.text}&rdquo;
            </p>
          </div>
        </div>
      ) : null}

      {/* Footer */}
      <footer className="relative z-20 border-t border-border/60 bg-background/90 px-2.5 pt-2 pb-2.5 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-2.5">
          {active ? (
            <div className="min-w-0 flex-1">
              <ActiveUnitCard unit={active} />
            </div>
          ) : (
            <div className="min-w-0 flex-1" />
          )}
          <button
            type="button"
            onClick={handleEndTurn}
            disabled={!isMinionTurn}
            className={cn(
              "flex h-12 shrink-0 items-center gap-1.5 rounded-md border-2 px-3.5 font-display text-[11px] font-black uppercase tracking-[0.22em] transition active:scale-95",
              isMinionTurn
                ? "border-primary bg-primary text-primary-foreground"
                : "cursor-not-allowed border-border bg-secondary/60 text-muted-foreground",
            )}
            style={
              isMinionTurn
                ? {
                    boxShadow:
                      "inset 0 1px 0 oklch(1 0 0 / 0.18), inset 0 -2px 0 oklch(0 0 0 / 0.35), 0 4px 16px oklch(0.55 0.21 22 / 0.45)",
                  }
                : undefined
            }
          >
            {isHeroTurn ? "VEZ DELE" : "TURNO"}
            <Zap className="size-3" />
          </button>
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
    <div className="flex w-full items-center gap-1 overflow-x-auto no-scrollbar">
      {state.order.map((id, i) => {
        const u = state.units.find((x) => x.id === id)
        if (!u) return null
        const isCurrent = i === state.turn
        const src =
          u.faction === "hero"
            ? `/images/heroes/${u.heroId ?? "bryan"}.jpg`
            : `/images/minions/${u.templateId}.jpg`
        return (
          <span
            key={id}
            className={cn(
              "relative flex shrink-0 items-center gap-1.5 rounded-md border py-0.5 pl-0.5 pr-1.5 font-mono text-[8px] uppercase tracking-wider transition",
              u.dead
                ? "border-border/30 bg-transparent text-muted-foreground/40 line-through"
                : isCurrent
                  ? u.faction === "minion"
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-destructive bg-destructive/15 text-destructive"
                  : "border-border bg-secondary/40 text-muted-foreground",
            )}
          >
            <span className="relative size-5 shrink-0 overflow-hidden rounded-sm">
              <Image
                src={src || "/placeholder.svg"}
                alt={u.name}
                fill
                sizes="20px"
                className="object-cover"
              />
            </span>
            <span className="max-w-[60px] truncate">{u.name}</span>
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
  const hpRatio = unit.hp / unit.hpMax
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
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-xs font-black uppercase leading-tight text-foreground sm:text-sm">
          {unit.name}
          {unit.faction === "hero" ? (
            <Skull className="ml-1 inline size-3 text-destructive" />
          ) : null}
        </p>
        <div className="mt-0.5 flex items-center gap-1">
          <div className="relative h-1.5 flex-1 overflow-hidden rounded-sm border border-border/60 bg-background/60">
            <div
              className="absolute inset-y-0 left-0 transition-all"
              style={{
                width: `${hpRatio * 100}%`,
                backgroundColor:
                  unit.faction === "hero"
                    ? "var(--destructive)"
                    : hpRatio > 0.5
                      ? "var(--accent)"
                      : "var(--gold)",
              }}
            />
          </div>
          <span className="font-mono text-[9px] tabular-nums leading-none text-foreground">
            {unit.hp}/{unit.hpMax}
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0 font-mono text-[9px] tabular-nums uppercase tracking-wider text-muted-foreground">
          <span>ATK {unit.atk}</span>
          <span>ALC {unit.range}</span>
          <span>MOV {unit.move}</span>
          {tpl ? <span className="text-accent/80">{tpl.role}</span> : null}
        </div>
      </div>
    </div>
  )
}
