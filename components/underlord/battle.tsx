"use client"

import Image from "next/image"
import { useEffect, useMemo, useReducer, useRef, useState } from "react"
import {
  Crown,
  Flame,
  Heart,
  RotateCcw,
  ShieldAlert,
  Skull,
  Sparkles,
  Sparkle,
  Undo2,
  Wand2,
  X as XIcon,
  Zap,
} from "lucide-react"
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
  blockedSetFor,
  endTurn,
  healUnit,
  initBattle,
  moveUnit,
  unitAt,
  castBarrier,
  castInferno,
  castResurrect,
  castShadow,
  castTaunt,
  castOverlordSkill,
} from "@/lib/underlord/battle"
import type { BattleState } from "@/lib/underlord/battle"
import type { Axial, Region, Unit } from "@/lib/underlord/types"
import {
  MINION_TEMPLATES,
  makeHero,
  makeHeroMinion,
  makeOverlord,
  makeUnit,
} from "@/lib/underlord/units"
import { SPECIALS } from "@/lib/underlord/specials"
import { aggregateBoons } from "@/lib/underlord/boons"
import { ascensionMods } from "@/lib/underlord/ascension"
import {
  OVERLORD_SKILLS,
  type SkillDef,
} from "@/lib/underlord/overlord-skills"
import { rand, getHeroById, UNDERLORD_LINES } from "@/lib/elementum-flavor"
import { Atmosphere } from "./atmosphere"
import { ObjectiveBanner } from "./objective-banner"
import { haptic } from "@/lib/underlord/haptics"
import {
  flashFor,
  playAttackVoice,
  type FlashSpec,
} from "@/lib/underlord/sfx-archetype"
import {
  comboBonusPerStack,
  critChanceBonus,
  healMultiplier,
} from "@/lib/underlord/perks"
import {
  GROUND_TONES,
  TERRAIN_GLYPH,
  TERRAIN_LABEL,
  pickMapLayout,
} from "@/lib/underlord/maps"

// Portrait-oriented grid: narrower than tall.
/** Default fallback only — actual battle dims come from the biome layout. */
const COLS = 6
const ROWS = 9

type LocalAction =
  | { type: "select"; id: string | null }
  | { type: "set"; state: BattleState }
  | { type: "snapshot"; state: BattleState }
  | { type: "undo" }

type LocalState = {
  state: BattleState
  /** Snapshot taken right before active unit moved — used for UNDO MOVE. */
  preMove: BattleState | null
}

function reducer(local: LocalState, action: LocalAction): LocalState {
  switch (action.type) {
    case "select":
      return { ...local, state: { ...local.state, selectedId: action.id } }
    case "set":
      return { state: action.state, preMove: null }
    case "snapshot":
      return { state: action.state, preMove: local.state }
    case "undo":
      return local.preMove ? { state: local.preMove, preMove: null } : local
  }
}

/** Build initial battle from the region's biome layout.
 *
 * Player side (front to back):
 *   - row rows-2: up to 3 minions on the front line.
 *   - row rows-3: extras (squad cap 4-5) flank slightly back.
 *   - row rows-1: the OVERLORD itself, dead-center, behind the wall.
 *
 * Enemy side (top, mirrored):
 *   - row 0: each named hero.
 *   - row 1: every hero's personal entourage spreads out behind them.
 *
 * Obstacles + pre-lit fires come from the layout. We slide any deployment
 * that lands on an obstacle to the nearest free hex so the map shape is
 * never able to crash a fight. */
function buildBattle(
  squad: Unit[],
  region: Region,
  overlordLevel: number,
  overlordName: string,
  boons: string[] = [],
  ascMods: { hp: number; atk: number; move: number } = { hp: 1, atk: 1, move: 0 },
): BattleState {
  // Boon multipliers that apply at unit-creation time (Overlord stats,
  // starting attack bonus, special CD reduction). Per-action effects
  // (crit, lifesteal, dmg-taken, regen) are applied at the call sites.
  const bag = aggregateBoons(boons)
  const layout = pickMapLayout(region)
  const cols = layout.cols
  const rows = layout.rows
  const obstacleKeys = new Set(layout.obstacles.map((o) => `${o.pos.q},${o.pos.r}`))
  const taken = new Set<string>(obstacleKeys)
  const offsetFor = (r: number) => -Math.floor(r / 2)
  const inBounds = (a: { q: number; r: number }) => {
    if (a.r < 0 || a.r >= rows) return false
    const off = offsetFor(a.r)
    return a.q >= off && a.q < cols + off
  }

  /** Snap a desired position to the nearest legal hex on the same row,
   *  spiraling outward in row+col before falling back to row above/below. */
  function place(desired: { q: number; r: number }): { q: number; r: number } {
    const k0 = `${desired.q},${desired.r}`
    if (inBounds(desired) && !taken.has(k0)) {
      taken.add(k0)
      return desired
    }
    for (let radius = 1; radius < cols + rows; radius++) {
      for (const dr of [0, -1, 1, -2, 2]) {
        for (let sign = -1; sign <= 1; sign += 2) {
          const cand = { q: desired.q + sign * radius, r: desired.r + dr }
          const k = `${cand.q},${cand.r}`
          if (inBounds(cand) && !taken.has(k)) {
            taken.add(k)
            return cand
          }
        }
      }
    }
    taken.add(k0)
    return desired
  }

  // ---- Player squad ----
  // Squad size is variable (3 to SQUAD_CAP_LIMIT). Distribute units across
  // back rows starting at rows-3, packing ~PER_ROW per line and cascading
  // upward as needed. The Overlord owns rows-2 alone, so deployment never
  // collides with him. `place()` handles obstacle/edge collisions.
  const PER_ROW = Math.min(5, Math.max(3, cols - 4))
  const placedSquad: Unit[] = squad.map((u, i) => {
    const rowIdx = Math.floor(i / PER_ROW) // 0 = front, 1 = back, 2+ = deeper
    const colIdx = i % PER_ROW
    const row = rows - 3 - rowIdx
    // Center the line: even spacing of 2 columns, anchored mid-board.
    const startQ = Math.max(1, Math.floor((cols - PER_ROW * 2) / 2))
    const q = startQ + colIdx * 2 + offsetFor(row)
    const pos = place({ q, r: row })
    const built = makeUnit(u.templateId, pos, {
      name: u.name,
      hp: u.hpMax,
      hpMax: u.hpMax,
      atk: u.atk,
      move: u.move,
      range: u.range,
      spd: u.spd,
      equipped: u.equipped,
    })
    // Boon: Iniciativa Sombria stamps a one-shot attack multiplier on each
    // minion. It's consumed on the very first attack via the existing
    // `nextAttackBonus` channel (already cleared in attackUnit).
    if (bag.startingAttackBonus > 0) {
      built.nextAttackBonus = 1 + bag.startingAttackBonus
    }
    return built
  })

  // ---- Overlord ----
  // Deploy the Overlord behind the squad but still inside the board (rows-2,
  // which is one above the very last row). Keeps him safely on a tile.
  const overlordRow = rows - 2
  const overlordCol = Math.floor(cols / 2) + offsetFor(overlordRow)
  const overlordPos = place({ q: overlordCol, r: overlordRow })
  const overlordBase = makeOverlord(overlordLevel, overlordPos, overlordName)
  // Boon: Voz do Submundo / Pacto: Meteoro alter Overlord stats.
  const overlordHpMax = Math.max(1, Math.round(overlordBase.hpMax * bag.overlordHpMult))
  const overlordAtk = Math.max(1, Math.round(overlordBase.atk * bag.overlordAtkMult))
  // Boon: Recarga Profana / Pacto: Meteoro shave starting CDs off all skills.
  const skillCooldowns = { ...(overlordBase.skillCooldowns ?? {}) }
  if (bag.specialCdReduce > 0) {
    for (const k of Object.keys(skillCooldowns)) {
      skillCooldowns[k] = Math.max(0, (skillCooldowns[k] ?? 0) - bag.specialCdReduce)
    }
  }
  const overlord: Unit = {
    ...overlordBase,
    hpMax: overlordHpMax,
    hp: overlordHpMax,
    atk: overlordAtk,
    skillCooldowns,
  }

  // ---- Heroes + their entourages ----
  // Build a quick id → elite descriptor map. Heroes not in `eliteHeroes`
  // spawn as regular units. Boss-tier regions usually flag the named
  // marquee hero; mid-stage tracts flag a miniboss instead.
  const eliteById = new Map<
    string,
    { kind: "miniboss" | "boss"; passiveId: import("@/lib/underlord/types").ElitePassiveId }
  >()
  for (const e of region.eliteHeroes ?? []) {
    eliteById.set(e.id, { kind: e.kind, passiveId: e.passiveId })
  }

  const heroUnits: Unit[] = []
  region.heroIds.forEach((heroId, i) => {
    const hero = getHeroById(heroId)
    const heroRow = 0
    const heroOffset = offsetFor(heroRow)
    const slot = region.heroIds.length === 1 ? 0.5 : i / (region.heroIds.length - 1)
    const desiredCol = Math.round(heroOffset + slot * (cols - 1))
    const heroPos = place({ q: desiredCol, r: heroRow })
    const elite = eliteById.get(heroId)

    heroUnits.push(
      makeHero(
        heroId,
        hero?.name.split(",")[0] ?? heroId.toUpperCase(),
        "?",
        heroPos,
        region.stage,
        elite,
      ),
    )

    // Boss-tier heroes get TWO extra entourage slots so the encounter
    // feels like a set-piece (3 minions instead of the usual 1-2). The
    // bonus archetypes lean melee so the boss has front-line cover.
    const entRow = 1
    const baseEntourage = hero?.entourage ?? []
    const bonusEntourage: typeof baseEntourage =
      elite?.kind === "boss"
        ? ["brown", "grey"]
        : elite?.kind === "miniboss"
          ? ["brown"]
          : []
    const entourage = [...baseEntourage, ...bonusEntourage]
    entourage.forEach((arch, eIdx) => {
      const side = eIdx % 2 === 0 ? -1 : 1
      const stride = Math.ceil((eIdx + 1) / 2)
      const candidateCol = heroPos.q + side * stride
      const desired = { q: candidateCol, r: entRow }
      const pos = place(desired)
      heroUnits.push(
        makeHeroMinion(
          arch,
          pos,
          region.stage,
          hero?.name.split(",")[0]?.split(" ")[0] ?? "HERÓI",
        ),
      )
    })
  })

  const prelitFires = layout.prelitFires.map((pos) => ({
    pos,
    ttl: 99, // ambient hazards stay all battle (gameplay-meaningful, not nuisance)
    damage: 4,
    source: 'biome',
  }))

  // If this region declared any elite heroes, fire the boss-intro stinger
  // ONCE at battle build. Adds drama before the player even sees the board.
  // Tries with a tiny rAF delay so the AudioContext has a chance to be
  // unlocked by the click that started the battle.
  if (region.eliteHeroes && region.eliteHeroes.length > 0) {
    if (typeof window !== "undefined") {
      const fire = () => {
        try {
          // Lazy import to avoid pulling sound code into any SSR path that
          // somehow imports this builder. Browser-only.
          void import("@/lib/elementum-sounds").then(({ sfx }) => {
            sfx.bossIntro()
          })
        } catch {
          /* swallow — audio failures must not block the build */
        }
      }
      // requestAnimationFrame so the click's user-gesture audio unlock has
      // already resolved by the time we hit `getAudioContext().resume()`.
      window.requestAnimationFrame(fire)
    }
  }

  // v11 — Ascension scaling. Toughen every enemy by the active tier +
  // curses. Applied here (post-spawn) so it stacks cleanly on top of the
  // stage/elite scaling already baked into makeHero / makeHeroMinion.
  const scaledHeroUnits =
    ascMods.hp === 1 && ascMods.atk === 1 && ascMods.move === 0
      ? heroUnits
      : heroUnits.map((u) => {
          const hpMax = Math.max(1, Math.round(u.hpMax * ascMods.hp))
          return {
            ...u,
            hpMax,
            hp: hpMax,
            atk: Math.max(1, Math.round(u.atk * ascMods.atk)),
            move: u.move + ascMods.move,
          }
        })

  return initBattle(
    [...placedSquad, overlord, ...scaledHeroUnits],
    cols,
    rows,
    layout.obstacles.map((o) => ({ pos: o.pos, kind: o.kind })),
    prelitFires,
    {
      // Boon: Couraça Negra (and Pacto: Berserker inverse) — multiplier on
      // incoming damage for minions only.
      minionDmgTakenMult: bag.minionDmgTakenMult,
      // Boon: Sopro Vital — start-of-round regen as % of hpMax.
      hpRegenStartOfRound: bag.hpRegenStartOfRound,
    },
    // v9 — region-defined battle objective. Defaults to classic rout
    // when the field is missing, which preserves every legacy region.
    region.objective ?? { kind: "rout" },
    // v9 — interactive walkable features (vents, spike pits) drawn
    // from the bespoke map layout. Empty for legacy biome maps.
    layout.features ?? [],
  )
}

type Popup = {
  id: string
  x: number
  y: number
  text: string
  tone: "good" | "bad" | "crit" | "heal"
}

export function BattleScreen({
  squad,
  region,
  perks,
  overlordLevel = 1,
  overlordName = "UNDERLORD",
  equippedSkills = [],
  boons = [],
  ascension = 0,
  curses = [],
  onComplete,
}: {
  squad: Unit[]
  region: Region
  /** Perk map from the Underlord's save. Used for crit/combo/heal bonuses. */
  perks?: Record<string, number>
  /** Underlord meta-level — drives the on-field Overlord unit's stats. */
  overlordLevel?: number
  /** Underlord display name — shown on the Overlord unit. */
  overlordName?: string
  /** Skill ids the Underlord has equipped (Skill Map loadout). */
  equippedSkills?: string[]
  /** Owned boon ids — drive crit/lifesteal/regen/dmg-taken at runtime. */
  boons?: string[]
  /** v11 — Ascension tier (0 = base). Scales enemy HP/ATK/move + rewards. */
  ascension?: number
  /** v11 — active Maldição (curse) ids. */
  curses?: string[]
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
  const boonBag = useMemo(() => aggregateBoons(boons), [boons])
  // Crit chance, lifesteal and minion damage-taken modifiers fold the
  // boon contribution on top of the perk contribution. Heroes never get
  // these bonuses — applyDamageMod is only called on minion targets via
  // collateral, and the engine already gates the crit by faction.
  const critBonus = critChanceBonus(perks) + boonBag.critChanceBonus
  const comboBonusExtra = comboBonusPerStack(perks)
  const healBonus = healMultiplier(perks)
  const layout = useMemo(() => pickMapLayout(region), [region])
  const ascMods = useMemo(() => ascensionMods(ascension, curses), [ascension, curses])
  const initialBattle = useMemo(
    () =>
      buildBattle(squad, region, overlordLevel, overlordName, boons, {
        hp: ascMods.hp,
        atk: ascMods.atk,
        move: ascMods.move,
      }),
    [squad, region, overlordLevel, overlordName, boons, ascMods],
  )
  const [local, dispatch] = useReducer(reducer, {
    state: initialBattle,
    preMove: null,
  })
  const state = local.state
  const [popups, setPopups] = useState<Popup[]>([])
  /** Per-archetype attack flashes painted on the target hex(es). Each one
   * is a short-lived SVG circle that fades out via CSS animation. The
   * battle keeps a list and removes entries on `setTimeout` so the layer
   * stays self-cleaning even if a unit attacks rapid-fire. */
  const [flashes, setFlashes] = useState<
    Array<{ id: string; x: number; y: number; spec: FlashSpec }>
  >([])
  const flashCounter = useRef(0)
  const [shake, setShake] = useState<0 | 1 | 2 | 3>(0)
  const [taunt, setTaunt] = useState<{ from: string; text: string } | null>(null)
  const [combo, setCombo] = useState(0)
  const [comboFlash, setComboFlash] = useState(false)
  const [hint, setHint] = useState<string | null>(null)
  /** Special-targeting mode. When set, the next hex tap routes to the special. */
  const [specialMode, setSpecialMode] = useState<null | {
    casterId: string
    archetype: "red" | "green" | "blue" | "grey"
  }>(null)
  /** Overlord skill targeting mode. When set, the next hex tap fires the skill. */
  const [skillMode, setSkillMode] = useState<null | {
    casterId: string
    skillId: string
  }>(null)
  /** Long-press / hover description popover for the skill bar. */
  const [skillInfo, setSkillInfo] = useState<string | null>(null)
  const popupCounter = useRef(0)
  const comboHighRef = useRef(0)
  const critsLandedRef = useRef(0)
  const firstBloodRef = useRef(false)
  const lastTurnRef = useRef(state.turn)
  const lastRoundRef = useRef(state.round)

  const inBounds = useMemo(
    () => makeBoundsChecker(state.cols, state.rows),
    [state.cols, state.rows],
  )
  const tiles = useMemo(
    () => makeRectMap(state.cols, state.rows),
    [state.cols, state.rows],
  )
  const obstacleByKey = useMemo(() => {
    const m = new Map<string, (typeof state.obstacles)[number]>()
    for (const o of state.obstacles ?? []) m.set(`${o.pos.q},${o.pos.r}`, o)
    return m
  }, [state.obstacles])
  const ground = GROUND_TONES[layout.ground]
  const active = activeUnit(state)
  const isMinionTurn = active?.faction === "minion" && !state.done
  const isHeroTurn = active?.faction === "hero" && !state.done
  const isHealer = active?.attackKind === "heal"

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

  // Reset combo and clear special / skill targeting when active unit changes
  useEffect(() => {
    if (state.turn !== lastTurnRef.current || state.round !== lastRoundRef.current) {
      // v9 — fire a round-start stinger ONCE per actual round bump.
      // Initial round=1 mount also lands here; we skip when the ref is
      // still its default sentinel so the very first frame stays quiet
      // (the bossIntro from `initBattle` carries that moment).
      const roundChanged =
        lastRoundRef.current !== -1 && state.round !== lastRoundRef.current
      if (roundChanged) haptic.roundStart()
      setCombo(0)
      setSpecialMode(null)
      setSkillMode(null)
      setSkillInfo(null)
      lastTurnRef.current = state.turn
      lastRoundRef.current = state.round
    }
  }, [state.turn, state.round])

  // v9 — death detection. Whenever the count of dead units climbs we
  // play a low thud once. Uses a ref so a single death frame never
  // double-fires across re-renders. Drives the `bomb` channel through
  // the haptic coalescer, so a triple-kill in one swing gets a single
  // unified stinger instead of three overlapping booms.
  const deadCountRef = useRef(0)
  useEffect(() => {
    const dead = state.units.filter((u) => u.dead).length
    if (dead > deadCountRef.current) haptic.death()
    deadCountRef.current = dead
  }, [state.units])

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
      // Tactical AI from stage 2 onward; stage 1 stays gentle for tutorial.
      const next = aiTakeTurn(state, active.id, region.stage >= 2)
      // Voice + flash signature for the hero attacker. Plays once per AI
      // turn, before the damage popups loop, so the audio leads the visual.
      playAttackVoice(active.templateId, {
        isOverlord: active.isOverlord,
        faction: active.faction,
      })
      // Visualize damage
      for (const u of next.units) {
        const before = beforeUnits.find((b) => b.id === u.id)
        if (before && before.hp > u.hp) {
          const px = axialToPixel(u.pos)
          const dmg = before.hp - u.hp
          pushPopup(`-${dmg}`, "bad", px.x, px.y)
          // Flash the target hex with the attacker's archetype color so
          // the player can read "what just hit me" without scanning the
          // turn order.
          pushFlash(
            px.x,
            px.y,
            flashFor(active.templateId, {
              isOverlord: active.isOverlord,
              faction: active.faction,
            }),
          )
          triggerShake(dmg >= 12 ? 3 : dmg >= 6 ? 2 : 1)
          haptic.hit()
        }
      }
      dispatch({ type: "set", state: next })
    }, 700)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.turn, state.round, isHeroTurn])

  // Battle done
  useEffect(() => {
    if (!state.done) return
    // Final-blow rumble + the appropriate outcome stinger. `haptic`
    // routes the matching sfx (victory / defeat) too, so this single
    // call handles both vibration and audio in one place.
    haptic.kill()
    if (state.done === "victory") haptic.victory()
    else haptic.defeat()
    const fallenIds = state.units.filter((u) => u.faction === "minion" && u.dead).map((u) => u.id)
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

  function pushPopup(text: string, tone: Popup["tone"], x: number, y: number) {
    popupCounter.current += 1
    const id = `p${popupCounter.current}`
    setPopups((p) => [...p, { id, x, y, text, tone }])
    window.setTimeout(() => setPopups((p) => p.filter((x) => x.id !== id)), 1100)
  }

  /**
   * Spawn a per-archetype attack flash at a board pixel coordinate.
   * Auto-cleans after `spec.ms`, with a small grace window so the CSS
   * fade-out finishes before the SVG node is unmounted.
   */
  function pushFlash(x: number, y: number, spec: FlashSpec) {
    flashCounter.current += 1
    const id = `f${flashCounter.current}`
    setFlashes((f) => [...f, { id, x, y, spec }])
    window.setTimeout(
      () => setFlashes((f) => f.filter((it) => it.id !== id)),
      spec.ms + 60,
    )
  }

  function triggerShake(intensity: 1 | 2 | 3) {
    setShake(intensity)
    window.setTimeout(() => setShake(0), 380)
  }

  function showHint(text: string) {
    // v9 — every hint is, by definition, a denied action. Fires a
    // soft "no" tick centrally so all 30+ rejection paths in this file
    // get audio feedback without per-call wiring. The haptic coalescer
    // keeps spammy taps from buzzing the AudioContext.
    haptic.invalid()
    setHint(text)
    window.setTimeout(() => setHint(null), 1400)
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

  /** Highlights — separates MOVE, ATTACK, HEAL hexes for clarity. */
  const highlights = useMemo(() => {
    const empty = {
      move: new Set<string>(),
      attack: new Set<string>(),
      heal: new Set<string>(),
    }
    if (!isMinionTurn || !active) return empty
    if (state.selectedId !== active.id) return empty

    // Flying units phase over impassable terrain; everyone else is grounded.
    const occ = blockedSetFor(state, active)
    const moveSet = new Set<string>()
    if (!active.moved) {
      const moves = reachable(active.pos, active.move, inBounds, occ)
      for (const m of moves) moveSet.add(axialKey(m))
    }
    moveSet.add(axialKey(active.pos))

    const attackSet = new Set<string>()
    const healSet = new Set<string>()
    if (!active.acted) {
      // Origins: current pos + every move-reachable pos (only if hasn't moved yet)
      const origins: Axial[] = active.moved
        ? [active.pos]
        : [active.pos, ...reachable(active.pos, active.move, inBounds, occ)]
      for (const u of state.units) {
        if (u.dead || u.id === active.id) continue
        const ally = u.faction === active.faction
        // Heal targets ally; basic targets enemy
        const validTarget = isHealer ? ally : !ally
        if (!validTarget) continue
        for (const o of origins) {
          if (hexDistance(o, u.pos) <= active.range) {
            if (isHealer) healSet.add(axialKey(u.pos))
            else attackSet.add(axialKey(u.pos))
            break
          }
        }
      }
    }

    return { move: moveSet, attack: attackSet, heal: healSet }
  }, [active, state, isMinionTurn, isHealer, inBounds])

  /** Special-targeting highlights — only computed while in special mode. */
  const specialHighlights = useMemo(() => {
    const out = {
      freeHex: new Set<string>(),
      fallenAlly: new Set<string>(),
    }
    if (!specialMode || !active || active.id !== specialMode.casterId) return out
    const def = SPECIALS[specialMode.archetype]
    if (!def) return out
    const occ = blockedSet(state)
    if (def.target === "free-hex") {
      for (const t of tiles) {
        if (hexDistance(active.pos, t) > def.range) continue
        if (axialEqual(t, active.pos)) continue
        if (occ.has(axialKey(t))) continue
        out.freeHex.add(axialKey(t))
      }
    } else if (def.target === "fallen-ally") {
      for (const u of state.units) {
        if (!u.dead || u.faction !== "minion" || u.isBarrier) continue
        if (hexDistance(active.pos, u.pos) > def.range) continue
        out.fallenAlly.add(axialKey(u.pos))
      }
    }
    return out
  }, [specialMode, active, state, tiles])

  /** Overlord-skill targeting highlights: free hexes, enemies, allies, fallen. */
  const skillHighlights = useMemo(() => {
    const out = {
      freeHex: new Set<string>(),
      enemy: new Set<string>(),
      ally: new Set<string>(),
      fallenAlly: new Set<string>(),
      kind: null as null | "free-hex" | "enemy" | "ally" | "fallen-ally",
    }
    if (!skillMode || !active || active.id !== skillMode.casterId) return out
    const def = OVERLORD_SKILLS[skillMode.skillId]
    if (!def) return out
    out.kind = def.target as typeof out.kind
    const occ = blockedSet(state)
    if (def.target === "free-hex") {
      for (const t of tiles) {
        if (hexDistance(active.pos, t) > def.range) continue
        if (axialEqual(t, active.pos)) continue
        if (occ.has(axialKey(t))) continue
        out.freeHex.add(axialKey(t))
      }
    } else if (def.target === "enemy") {
      for (const u of state.units) {
        if (u.dead || u.faction !== "hero") continue
        if (hexDistance(active.pos, u.pos) > def.range) continue
        out.enemy.add(axialKey(u.pos))
      }
    } else if (def.target === "ally") {
      for (const u of state.units) {
        if (u.dead || u.faction !== "minion" || u.isBarrier || u.id === active.id) continue
        if (hexDistance(active.pos, u.pos) > def.range) continue
        out.ally.add(axialKey(u.pos))
      }
    } else if (def.target === "fallen-ally") {
      for (const u of state.units) {
        if (!u.dead || u.faction !== "minion" || u.isBarrier) continue
        if (hexDistance(active.pos, u.pos) > def.range) continue
        out.fallenAlly.add(axialKey(u.pos))
      }
    }
    return out
  }, [skillMode, active, state, tiles])

  /** True iff it's the Overlord's turn (he's a minion-faction unit). */
  const isOverlordTurn =
    isMinionTurn && active != null && active.isOverlord === true

  /** Activate an Overlord skill: self-target fires immediately, others enter
   * targeting mode where the next valid hex tap consumes the cast. */
  function activateOverlordSkill(skillId: string) {
    if (!isOverlordTurn || !active) return
    const def = OVERLORD_SKILLS[skillId]
    if (!def) return
    if (active.acted) {
      showHint("já agiu — encerre o turno")
      return
    }
    if ((active.skillCooldowns?.[skillId] ?? 0) > 0) {
      showHint(`recarregando ${active.skillCooldowns![skillId]}r`)
      return
    }
    if (def.uses === 1 && active.skillSpent?.[skillId]) {
      showHint("já usou nesta batalha")
      return
    }
    if (def.target === "self") {
      // Fire immediately.
      dispatch({ type: "snapshot", state })
      const out = castOverlordSkill(state, active.id, skillId, null, null)
      if (!out.ok) {
        showHint(out.reason)
        return
      }
      haptic.kill()
      triggerShake(1)
      const px = axialToPixel(active.pos)
      pushPopup(def.short, "crit", px.x, px.y)
      dispatch({ type: "set", state: out.state })
      return
    }
    // Pre-validate fallen-ally skills (ERGUER) — aborting before entering
    // targeting mode prevents the dead-end where the player sees nothing
    // tappable on the board with no idea why.
    if (def.target === "fallen-ally") {
      const anyInRange = state.units.some(
        (u) =>
          u.dead &&
          u.faction === "minion" &&
          !u.isBarrier &&
          hexDistance(active.pos, u.pos) <= def.range,
      )
      const anyDead = state.units.some(
        (u) => u.dead && u.faction === "minion" && !u.isBarrier,
      )
      if (!anyInRange) {
        showHint(anyDead ? "nenhum caído ao alcance" : "ninguém caiu ainda")
        return
      }
    }
    setSkillMode({ casterId: active.id, skillId })
    // Hero skill arming — same wind-up cue as minion specials.
    haptic.specialReady()
  }

  function cancelSkillMode() {
    setSkillMode(null)
    haptic.cancel()
  }

  function activateSpecial() {
    if (!isMinionTurn || !active) return
    if (active.faction !== "minion" || active.isBarrier) return
    // Only the original five archetypes have active specials.
    if (!MINION_TEMPLATES[active.templateId]?.hasActiveSpecial) return
    const def = SPECIALS[active.templateId]
    if (!def) return
    if (active.specialCd > 0) {
      showHint(`recarregando ${active.specialCd}r`)
      return
    }
    if (def.uses === 1 && active.specialSpent) {
      showHint("já usou nesta batalha")
      return
    }
    if (def.cost === "action" && active.acted) {
      showHint("já agiu — encerre o turno")
      return
    }
    if (def.cost === "move" && active.moved) {
      showHint("já se moveu")
      return
    }
    // BROWN's PROVOCAR is self-target — fire immediately.
    if (active.templateId === "brown") {
      dispatch({ type: "snapshot", state })
      const out = castTaunt(state, active.id)
      if (!out.ok) {
        showHint(out.reason)
        return
      }
      haptic.kill()
      triggerShake(2)
      const px = axialToPixel(active.pos)
      pushPopup("PROVOCAR", "crit", px.x, px.y)
      dispatch({ type: "set", state: out.state })
      return
    }
    // BLUE's RENASCER targets a fallen ally; abort early if none are in
    // range so the player gets clear feedback instead of an empty grid.
    if (def.target === "fallen-ally") {
      const anyInRange = state.units.some(
        (u) =>
          u.dead &&
          u.faction === "minion" &&
          !u.isBarrier &&
          hexDistance(active.pos, u.pos) <= def.range,
      )
      const anyDead = state.units.some(
        (u) => u.dead && u.faction === "minion" && !u.isBarrier,
      )
      if (!anyInRange) {
        showHint(anyDead ? "nenhum caído ao alcance" : "ninguém caiu ainda")
        return
      }
    }
    // BLUE / RED / GREEN / GREY → enter targeting mode
    setSpecialMode({
      casterId: active.id,
      archetype: active.templateId as "red" | "green" | "blue" | "grey",
    })
    // Wind-up tone — same channel used by Rage-ready meters.
    haptic.specialReady()
  }

  function cancelSpecial() {
    setSpecialMode(null)
    haptic.cancel()
  }

  function handleHexClick(a: Axial) {
    if (!isMinionTurn || !active) return
    // Hard guard: never let any code path act on a hex outside the board,
    // regardless of how the click reached us.
    if (!inBounds(a)) return
    const target = unitAt(state, a)

    // -------- Overlord skill targeting --------
    if (skillMode && active.id === skillMode.casterId) {
      const def = OVERLORD_SKILLS[skillMode.skillId]
      if (!def) {
        setSkillMode(null)
        return
      }
      let unitId: string | null = null
      let hexTarget: Axial | null = null
      if (def.target === "enemy") {
        if (!target || target.faction !== "hero" || target.dead) {
          showHint("escolha um inimigo")
          return
        }
        if (hexDistance(active.pos, target.pos) > def.range) {
          showHint("fora de alcance")
          return
        }
        unitId = target.id
      } else if (def.target === "ally") {
        if (
          !target ||
          target.faction !== "minion" ||
          target.dead ||
          target.isBarrier ||
          target.id === active.id
        ) {
          showHint("escolha um aliado")
          return
        }
        if (hexDistance(active.pos, target.pos) > def.range) {
          showHint("fora de alcance")
          return
        }
        unitId = target.id
      } else if (def.target === "fallen-ally") {
        const fallen = state.units.find(
          (u) =>
            u.dead &&
            u.faction === "minion" &&
            !u.isBarrier &&
            axialEqual(u.pos, a),
        )
        if (!fallen) {
          showHint("escolha um aliado caído")
          return
        }
        if (hexDistance(active.pos, fallen.pos) > def.range) {
          showHint("fora de alcance")
          return
        }
        unitId = fallen.id
      } else if (def.target === "free-hex") {
        if (target && !target.dead) {
          showHint("hex precisa estar livre")
          return
        }
        if (hexDistance(active.pos, a) > def.range) {
          showHint("fora de alcance")
          return
        }
        hexTarget = a
      }
      const out = castOverlordSkill(state, active.id, skillMode.skillId, hexTarget, unitId)
      if (!out.ok) {
        showHint(out.reason || "alvo inválido")
        return
      }
      dispatch({ type: "snapshot", state })
      haptic.select()
      triggerShake(def.kind === "aoe-damage" || def.kind === "smite-enemy" ? 2 : 1)
      const fxPos = out.fxAt ?? hexTarget ?? (target?.pos ?? active.pos)
      const px = axialToPixel(fxPos)
      pushPopup(def.short, "crit", px.x, px.y)
      setSkillMode(null)
      dispatch({ type: "set", state: out.state })
      return
    }

    // -------- Special-targeting mode --------
    if (specialMode && active.id === specialMode.casterId) {
      const arch = specialMode.archetype
      let outcomeOk = false
      let outcomeReason = ""
      let nextState = state
      let fxAt: Axial | undefined
      if (arch === "red") {
        const out = castInferno(state, active.id, a)
        outcomeOk = out.ok
        outcomeReason = out.reason
        nextState = out.state
        fxAt = out.fxAt
      } else if (arch === "green") {
        const out = castShadow(state, active.id, a)
        outcomeOk = out.ok
        outcomeReason = out.reason
        nextState = out.state
        fxAt = out.fxAt
      } else if (arch === "grey") {
        const out = castBarrier(state, active.id, a)
        outcomeOk = out.ok
        outcomeReason = out.reason
        nextState = out.state
        fxAt = out.fxAt
      } else if (arch === "blue") {
        // Need to find the dead ally clicked
        const fallen = state.units.find(
          (u) =>
            u.dead &&
            u.faction === "minion" &&
            !u.isBarrier &&
            axialEqual(u.pos, a),
        )
        if (!fallen) {
          showHint("escolha um aliado caído")
          return
        }
        const out = castResurrect(state, active.id, fallen.id)
        outcomeOk = out.ok
        outcomeReason = out.reason
        nextState = out.state
        fxAt = out.fxAt
      }
      if (!outcomeOk) {
        showHint(outcomeReason || "alvo inválido")
        return
      }
      dispatch({ type: "snapshot", state })
      haptic.select()
      triggerShake(arch === "red" ? 2 : 1)
      if (fxAt) {
        const px = axialToPixel(fxAt)
        const label =
          arch === "red"
            ? "INFERNO"
            : arch === "green"
              ? "SOMBRA"
              : arch === "blue"
                ? "RENASC"
                : "MURALHA"
        pushPopup(label, "crit", px.x, px.y)
      }
      setSpecialMode(null)
      dispatch({ type: "set", state: nextState })
      return
    }

    // Tap self → toggle selection
    if (target && target.id === active.id) {
      dispatch({ type: "select", id: state.selectedId === active.id ? null : active.id })
      return
    }
    // Auto-select active unit on first tap
    if (state.selectedId !== active.id) {
      dispatch({ type: "select", id: active.id })
      return
    }

    // HEAL path (blue): tap injured ally in heal range
    if (isHealer && target && target.faction === "minion" && target.id !== active.id) {
      if (active.acted) {
        showHint("já agiu")
        return
      }
      // Pre-move if needed to reach (flying ignores terrain).
      const occ = blockedSetFor(state, active)
      const reach = active.moved
        ? [active.pos]
        : [active.pos, ...reachable(active.pos, active.move, inBounds, occ)]
      let bestOrigin: Axial | null = null
      let bestDist = Infinity
      for (const o of reach) {
        const d = hexDistance(o, target.pos)
        if (d <= active.range && d < bestDist) {
          bestOrigin = o
          bestDist = d
        }
      }
      if (!bestOrigin) {
        showHint("fora de alcance")
        return
      }
      dispatch({ type: "snapshot", state })
      let next = state
      if (!axialEqual(bestOrigin, active.pos)) {
        next = moveUnit(next, active.id, bestOrigin)
      }
      const out = healUnit(next, active.id, target.id, healBonus)
      next = out.state
      if (out.hit) {
        haptic.select()
        const px = axialToPixel(target.pos)
        pushPopup(`+${out.amount}`, "heal", px.x, px.y)
      }
      dispatch({ type: "set", state: next })
      return
    }

    // ATTACK path: tap enemy
    if (target && target.faction === "hero" && !target.dead) {
      if (active.acted) {
        showHint("já agiu — encerre o turno")
        return
      }
      const occ = blockedSetFor(state, active)
      const reach = active.moved
        ? [active.pos]
        : [active.pos, ...reachable(active.pos, active.move, inBounds, occ)]
      let bestOrigin: Axial | null = null
      let bestDist = Infinity
      for (const o of reach) {
        const d = hexDistance(o, target.pos)
        if (d <= active.range && d < bestDist) {
          bestOrigin = o
          bestDist = d
        }
      }
      if (!bestOrigin) {
        showHint(active.moved ? "fora de alcance" : "não alcança nem se mover")
        return
      }
      dispatch({ type: "snapshot", state })
      let next = state
      if (!axialEqual(bestOrigin, active.pos)) {
        next = moveUnit(next, active.id, bestOrigin)
      }
      const comboBonus = 1 + combo * (0.15 + comboBonusExtra)
      const outcome = attackUnit(next, active.id, target.id, comboBonus, critBonus)
      next = outcome.state
      // Boon: Sede de Sangue / Pacto: Berserker — heal the attacker for a
      // fraction of damage dealt. Caps at hpMax. Only applies to minion
      // attackers (heroes never get boons).
      if (outcome.hit && active.faction === "minion" && boonBag.lifestealPct > 0) {
        const healed = Math.max(1, Math.round(outcome.damage * boonBag.lifestealPct))
        next = {
          ...next,
          units: next.units.map((u) =>
            u.id === active.id && !u.dead
              ? { ...u, hp: Math.min(u.hpMax, u.hp + healed) }
              : u,
          ),
        }
        const px = axialToPixel(active.pos)
        pushPopup(`+${healed}`, "heal", px.x, px.y - 18)
        // Lifesteal chime — light, won't compete with the hit voice
        // because uiSfx coalesces and the heal channel is distinct.
        haptic.healTick()
      }
      if (outcome.hit) {
        if (!firstBloodRef.current) firstBloodRef.current = true
        if (outcome.crit) critsLandedRef.current += 1
        haptic.hit()
        // Per-archetype voice + flash. Fires once for the primary target,
        // and again (smaller) for each splash hex below — keeps cleave/
        // splash/volley feeling chunky without spamming sound.
        const voiceCtx = {
          isOverlord: active.isOverlord,
          faction: active.faction,
        }
        playAttackVoice(active.templateId, voiceCtx)
        // Primary popup
        const px = axialToPixel(target.pos)
        const text = outcome.executed
          ? `EXEC -${outcome.damage}`
          : outcome.crit
            ? `-${outcome.damage}!`
            : `-${outcome.damage}`
        pushPopup(text, outcome.crit || outcome.executed ? "crit" : "good", px.x, px.y)
        const primarySpec = flashFor(active.templateId, voiceCtx)
        // Crits and executes paint the flash slightly bigger to sell the
        // moment — same color, fatter ring/burst.
        const primaryScale =
          outcome.crit || outcome.executed
            ? primarySpec.scale * 1.25
            : primarySpec.scale
        pushFlash(px.x, px.y, { ...primarySpec, scale: primaryScale })
        triggerShake(outcome.damage >= 14 ? 3 : outcome.damage >= 7 ? 2 : 1)
        bumpCombo(outcome.killed)
        // Splash popups + smaller flashes on each splash tile.
        for (const sh of outcome.splashHits) {
          const px2 = axialToPixel(sh.pos)
          pushPopup(`-${sh.damage}`, "good", px2.x, px2.y)
          pushFlash(px2.x, px2.y, {
            ...primarySpec,
            scale: primarySpec.scale * 0.75,
            ms: Math.round(primarySpec.ms * 0.7),
          })
        }
        if (outcome.killed && Math.random() < 0.5) {
          setTaunt({ from: "UNDERLORD", text: rand(UNDERLORD_LINES.roundWin) })
          window.setTimeout(() => setTaunt(null), 1500)
        }
      }
      dispatch({ type: "set", state: next })
      return
    }

    // MOVE path
    if (highlights.move.has(axialKey(a)) && !target) {
      if (active.moved) {
        showHint("já se moveu")
        return
      }
      dispatch({ type: "snapshot", state })
      const next = moveUnit(state, active.id, a)
      // Footstep tap — distinct from `tap` (UI click) so movement reads
      // as a board action rather than a button press.
      haptic.move()
      dispatch({ type: "set", state: next })
      return
    }
  }

  function handleEndTurn() {
    if (!isMinionTurn) return
    // Heavier than a UI click — confirms a hand-off of control.
    haptic.endTurn()
    dispatch({ type: "set", state: endTurn(state) })
  }

  function handleUndoMove() {
    if (!local.preMove) return
    haptic.undo()
    dispatch({ type: "undo" })
  }

  // Tone for END TURN button: golden if both done, accent if one done, default otherwise
  const turnState: "idle" | "partial" | "ready" = !active
    ? "idle"
    : active.moved && active.acted
      ? "ready"
      : active.moved || active.acted
        ? "partial"
        : "idle"

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
        <div className="mx-auto flex w-full max-w-2xl items-center gap-2 px-3 pt-2.5 pb-2">
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
              <span className="font-display text-base leading-none tabular-nums">{combo}</span>
              <span>COMBO</span>
            </div>
          ) : null}
        </div>
        {/* v9 — Objective banner. Renders only when the region declares
            anything other than the default `rout`, keeping the standard
            "kill them all" missions clean. The banner shows a goal
            label, a parameter (rounds remaining, target name, ward
            name), and an icon. Tucked between the header text and the
            initiative ladder so it's the first thing read after the
            region name. */}
        <ObjectiveBanner state={state} />
        <div className="border-t border-border/40">
          <div className="mx-auto w-full max-w-2xl px-2 py-1.5">
            <InitiativeLadder state={state} />
          </div>
        </div>
      </header>

      {/* Battle area */}
      <main className="relative z-10 flex flex-1 items-stretch justify-center overflow-hidden px-2 sm:px-4">
        <div className="relative mx-auto flex w-full max-w-md flex-1 items-stretch sm:max-w-lg">
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

          {/* Inner board frame.
              CRITICAL FIX (v7): the SVG uses preserveAspectRatio="xMidYMid
              meet" — when the container's aspect doesn't match the
              viewBox's, the SVG content letterboxes (centers itself with
              empty bars) but the absolutely-positioned HTML overlays
              (units, popups, flashes) keep using a flat `% of container`,
              so they DRIFT off the hex centers. We lock the inner frame's
              aspect ratio to viewW/viewH so SVG and HTML map 1:1 and the
              units sit exactly on their tiles regardless of viewport. */}
          <div
            className="relative mx-auto flex h-full w-full max-h-full items-center justify-center"
            style={{ paddingTop: "1.5rem", paddingBottom: "1.5rem" }}
          >
            <div
              className="relative w-full max-w-full"
              style={{
                aspectRatio: `${viewW} / ${viewH}`,
                // Don't let the locked aspect push the board taller than
                // the available main area when the device is short.
                maxHeight: "100%",
              }}
            >
            <svg
              viewBox={`0 0 ${viewW} ${viewH}`}
              className="absolute inset-0 h-full w-full"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <radialGradient id="hexFill" cx="50%" cy="40%" r="55%">
                  <stop offset="0%" stopColor={ground.fillStart} />
                  <stop offset="100%" stopColor={ground.fillEnd} />
                </radialGradient>
                <radialGradient id="hexFillObstacle" cx="50%" cy="40%" r="55%">
                  <stop offset="0%" stopColor="oklch(0.32 0.018 250 / 0.85)" />
                  <stop offset="100%" stopColor="oklch(0.18 0.014 250 / 0.95)" />
                </radialGradient>
                <radialGradient id="hexFillMove" cx="50%" cy="40%" r="55%">
                  <stop offset="0%" stopColor="oklch(0.72 0.17 60 / 0.40)" />
                  <stop offset="100%" stopColor="oklch(0.72 0.17 60 / 0.10)" />
                </radialGradient>
                <radialGradient id="hexFillAttack" cx="50%" cy="40%" r="55%">
                  <stop offset="0%" stopColor="oklch(0.55 0.21 22 / 0.55)" />
                  <stop offset="100%" stopColor="oklch(0.55 0.21 22 / 0.18)" />
                </radialGradient>
                <radialGradient id="hexFillHeal" cx="50%" cy="40%" r="55%">
                  <stop offset="0%" stopColor="oklch(0.78 0.14 78 / 0.55)" />
                  <stop offset="100%" stopColor="oklch(0.78 0.14 78 / 0.18)" />
                </radialGradient>
                <radialGradient id="hexFillFire" cx="50%" cy="50%" r="60%">
                  <stop offset="0%" stopColor="oklch(0.78 0.18 50 / 0.85)" />
                  <stop offset="60%" stopColor="oklch(0.55 0.21 22 / 0.65)" />
                  <stop offset="100%" stopColor="oklch(0.40 0.16 22 / 0.4)" />
                </radialGradient>
                <radialGradient id="hexFillSpecial" cx="50%" cy="40%" r="55%">
                  <stop offset="0%" stopColor="oklch(0.78 0.14 78 / 0.55)" />
                  <stop offset="100%" stopColor="oklch(0.55 0.21 22 / 0.20)" />
                </radialGradient>
              </defs>
              {pixelTiles.map((t) => {
                const k = axialKey(t)
                const fire = state.fires.find((f) => axialEqual(f.pos, t))
                const obstacle = obstacleByKey.get(k)
                const inAnyTargetingMode = !!specialMode || !!skillMode
                const inMove = !inAnyTargetingMode && highlights.move.has(k)
                const inAttack = !inAnyTargetingMode && highlights.attack.has(k)
                const inHeal = !inAnyTargetingMode && highlights.heal.has(k)
                const inSpecialHex =
                  !!specialMode && specialHighlights.freeHex.has(k)
                const inSpecialFallen =
                  !!specialMode && specialHighlights.fallenAlly.has(k)
                const inSkillHex =
                  !!skillMode &&
                  (skillHighlights.freeHex.has(k) ||
                    skillHighlights.enemy.has(k) ||
                    skillHighlights.ally.has(k) ||
                    skillHighlights.fallenAlly.has(k))
                const cx = t.x + offsetX
                const cy = t.y + offsetY
                const points = hexPoints(cx, cy, HEX_SIZE - 1.5)
                const fillId = obstacle
                  ? "url(#hexFillObstacle)"
                  : inSpecialHex || inSpecialFallen || inSkillHex
                    ? "url(#hexFillSpecial)"
                    : fire
                      ? "url(#hexFillFire)"
                      : inHeal
                        ? "url(#hexFillHeal)"
                        : inAttack
                          ? "url(#hexFillAttack)"
                          : inMove
                            ? "url(#hexFillMove)"
                            : "url(#hexFill)"
                const stroke = obstacle
                  ? "oklch(0.50 0.020 250 / 0.9)"
                  : inSpecialHex || inSpecialFallen
                    ? "oklch(0.78 0.14 78 / 0.95)"
                    : fire
                      ? "oklch(0.78 0.18 50 / 0.95)"
                      : inHeal
                        ? "oklch(0.78 0.14 78 / 0.85)"
                        : inAttack
                          ? "oklch(0.55 0.21 22 / 0.85)"
                          : inMove
                            ? "oklch(0.72 0.17 60 / 0.75)"
                            : ground.stroke
                const highlighted =
                  inMove || inAttack || inHeal || inSpecialHex || inSpecialFallen || !!fire
                return (
                  <g key={k}>
                    <polygon
                      points={points}
                      fill={fillId}
                      stroke={stroke}
                      strokeWidth={obstacle ? 1.4 : highlighted ? 1.8 : 0.7}
                      className={cn(
                        "transition-colors",
                        fire && "ready-pulse",
                      )}
                      onClick={() => obstacle ? undefined : handleHexClick(t)}
                      style={{
                        cursor: obstacle ? "not-allowed" : "pointer",
                        filter: fire
                          ? "drop-shadow(0 0 10px oklch(0.78 0.18 50 / 0.7))"
                          : inSpecialHex || inSpecialFallen
                            ? "drop-shadow(0 0 8px oklch(0.78 0.14 78 / 0.7))"
                            : inHeal
                              ? "drop-shadow(0 0 6px oklch(0.78 0.14 78 / 0.6))"
                              : inAttack
                                ? "drop-shadow(0 0 6px oklch(0.55 0.21 22 / 0.6))"
                                : inMove
                                  ? "drop-shadow(0 0 6px oklch(0.72 0.17 60 / 0.5))"
                                  : undefined,
                      }}
                    >
                      {obstacle ? (
                        <title>{TERRAIN_LABEL[obstacle.kind]}</title>
                      ) : null}
                    </polygon>
                    {/* Terrain glyph painted on top of obstacle hexes */}
                    {obstacle ? (
                      <text
                        x={cx}
                        y={cy + HEX_SIZE * 0.18}
                        textAnchor="middle"
                        pointerEvents="none"
                        style={{
                          fontSize: HEX_SIZE * 0.72,
                          fontWeight: 900,
                          fill: "oklch(0.78 0.04 78 / 0.85)",
                          filter:
                            "drop-shadow(0 0 4px oklch(0 0 0 / 0.7))",
                        }}
                      >
                        {TERRAIN_GLYPH[obstacle.kind]}
                      </text>
                    ) : null}
                    {/* v9 — walkable feature glyphs.
                        Vents pulse when their cooldown is 1 (about to
                        fire); spike pits stay quiet but readable. We
                        skip drawing when a fire is already on the
                        tile (the fire visual takes over). */}
                    {(() => {
                      if (obstacle || fire) return null
                      const feat = (state.features ?? []).find(
                        (f) => f.pos.q === t.q && f.pos.r === t.r,
                      )
                      if (!feat) return null
                      const isVent = feat.kind === "vent"
                      const armed = isVent && (feat.cooldown ?? 99) <= 1
                      return (
                        <text
                          x={cx}
                          y={cy + HEX_SIZE * 0.18}
                          textAnchor="middle"
                          pointerEvents="none"
                          className={cn(armed && "ready-pulse")}
                          style={{
                            fontSize: HEX_SIZE * 0.6,
                            fontWeight: 900,
                            fill: isVent
                              ? armed
                                ? "oklch(0.78 0.18 50 / 0.95)"
                                : "oklch(0.62 0.10 220 / 0.85)"
                              : "oklch(0.55 0.21 22 / 0.9)",
                            filter:
                              "drop-shadow(0 0 4px oklch(0 0 0 / 0.7))",
                          }}
                        >
                          <title>
                            {isVent
                              ? armed
                                ? "Respiradouro · ignição iminente"
                                : "Respiradouro · vapor"
                              : "Fosso de espinhos · 4 dano ao terminar o turno"}
                          </title>
                          {isVent ? "≋" : "✸"}
                        </text>
                      )
                    })()}
                  </g>
                )
              })}
            </svg>

            {/* Fallen-ally markers — show ALL dead minions while any
                fallen-ally targeting mode is active so the player can SEE
                where the cadavers are. Two sources drive the mode:
                  1. Minion blue special (RENASCER) → specialMode.archetype === "blue"
                  2. Overlord skill (ERGUER)        → skillMode + def.target
                In-range tombstones are gold + clickable (revive). Out-of-
                range tombstones render dim with `not-allowed` cursor and
                shout "fora de alcance" on tap so players never get a
                silent empty board. */}
            {(() => {
              const inFallenAllyMode =
                specialMode?.archetype === "blue" ||
                (skillMode &&
                  OVERLORD_SKILLS[skillMode.skillId]?.target === "fallen-ally")
              if (!inFallenAllyMode) return null
              const inRange = new Set<string>()
              for (const k of specialHighlights.fallenAlly) inRange.add(k)
              for (const k of skillHighlights.fallenAlly) inRange.add(k)
              return state.units
                .filter(
                  (u) =>
                    u.dead && u.faction === "minion" && !u.isBarrier,
                )
                .map((u) => {
                  const px = axialToPixel(u.pos)
                  const cx = px.x + offsetX
                  const cy = px.y + offsetY
                  const xPct = (cx / viewW) * 100
                  const yPct = (cy / viewH) * 100
                  const sizePct = ((HEX_SIZE * 1.2) / viewW) * 100
                  const reachable = inRange.has(axialKey(u.pos))
                  return (
                    <button
                      key={`fallen-${u.id}`}
                      type="button"
                      onClick={() => {
                        if (reachable) {
                          handleHexClick(u.pos)
                        } else {
                          showHint("fora de alcance")
                        }
                      }}
                      className={cn(
                        "absolute -translate-x-1/2 -translate-y-1/2 transition active:scale-95",
                        !reachable && "cursor-not-allowed",
                      )}
                      style={{
                        left: `${xPct}%`,
                        top: `${yPct}%`,
                        width: `${sizePct}%`,
                        aspectRatio: "1",
                      }}
                      aria-label={
                        reachable
                          ? `Reviver ${u.name}`
                          : `${u.name} (fora de alcance)`
                      }
                    >
                      <span
                        className={cn(
                          "absolute inset-0 grid place-items-center rounded-full border-2 border-dashed backdrop-blur-sm",
                          reachable
                            ? "active-ring bg-card/70"
                            : "bg-card/40 opacity-60",
                        )}
                        style={{
                          borderColor: reachable
                            ? "oklch(0.78 0.14 78)"
                            : "oklch(0.55 0.020 250 / 0.7)",
                        }}
                      >
                        <Skull
                          className={cn(
                            "size-5",
                            reachable ? "text-gold" : "text-muted-foreground",
                          )}
                        />
                      </span>
                    </button>
                  )
                })
            })()}

            {state.units.map((u) => {
              if (u.dead) return null

              // Barriers render as a stone wall (no portrait, no HP bar style)
              if (u.isBarrier) {
                const px = axialToPixel(u.pos)
                const cx = px.x + offsetX
                const cy = px.y + offsetY
                const xPct = (cx / viewW) * 100
                const yPct = (cy / viewH) * 100
                const sizePct = ((HEX_SIZE * 1.45) / viewW) * 100
                const hpRatio = u.hp / u.hpMax
                const k = axialKey(u.pos)
                const isAttackTarget = highlights.attack.has(k)
                return (
                  <span
                    key={u.id}
                    className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${xPct}%`,
                      top: `${yPct}%`,
                      width: `${sizePct}%`,
                      aspectRatio: "1",
                      filter: "drop-shadow(0 4px 6px oklch(0 0 0 / 0.6))",
                    }}
                    aria-label={`Muralha (${u.hp}/${u.hpMax} HP)`}
                  >
                    {isAttackTarget ? (
                      <span
                        aria-hidden
                        className="pointer-events-none absolute -inset-1.5 animate-pulse rounded-md border-2"
                        style={{ borderColor: "oklch(0.55 0.21 22 / 0.85)" }}
                      />
                    ) : null}
                    <span
                      className="absolute inset-0 grid place-items-center rounded-md border-2 border-foreground/40 bg-secondary/70 backdrop-blur-[1px]"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(45deg, oklch(0.30 0.012 30 / 0.45) 0 4px, oklch(0.18 0.012 30 / 0.55) 4px 8px)",
                      }}
                    >
                      <ShieldAlert className="size-5 text-foreground/85" />
                    </span>
                    <span
                      aria-hidden
                      className="absolute -bottom-1.5 left-1/2 h-1.5 w-[110%] -translate-x-1/2 overflow-hidden rounded-sm border border-border/80 bg-background/90"
                    >
                      <span
                        className="block h-full transition-all"
                        style={{
                          width: `${hpRatio * 100}%`,
                          backgroundColor: "var(--foreground)",
                        }}
                      />
                    </span>
                  </span>
                )
              }

              const px = axialToPixel(u.pos)
              const cx = px.x + offsetX
              const cy = px.y + offsetY
              const isActive = active?.id === u.id
              const xPct = (cx / viewW) * 100
              const yPct = (cy / viewH) * 100
              const sizePct = ((HEX_SIZE * 1.55) / viewW) * 100
              const isOverlordUnit = !!u.isOverlord
              const isHero = u.faction === "hero"
              const isHeroBoss = isHero && !!u.heroId
              const src = isOverlordUnit
                ? "/images/overlord.jpg"
                : isHeroBoss
                  ? `/images/heroes/${u.heroId}.jpg`
                  : `/images/minions/${u.templateId}.jpg`
              const ringColor = isOverlordUnit
                ? "oklch(0.78 0.16 78)" // gold halo for the commander
                : isHero
                  ? "var(--destructive)"
                  : tonePixel(u.tone)
              const hpRatio = u.hp / u.hpMax
              const k = axialKey(u.pos)
              const isAttackTarget = highlights.attack.has(k)
              const isHealTarget = highlights.heal.has(k)
              const hasShield = (u.damageTakenMod ?? 1) < 1
              const isTaunted = !!u.tauntedBy
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleHexClick(u.pos)}
                  className={cn(
                    "absolute -translate-x-1/2 -translate-y-1/2 transition active:scale-95",
                    isActive && "z-10",
                    u.acted && u.moved && !isActive && "opacity-55",
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
                  {/* Targeting ring (red for attack, gold for heal) */}
                  {isAttackTarget ? (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -inset-2 animate-pulse rounded-full border-2"
                      style={{ borderColor: "oklch(0.55 0.21 22 / 0.85)" }}
                    />
                  ) : null}
                  {isHealTarget ? (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -inset-2 animate-pulse rounded-full border-2"
                      style={{ borderColor: "oklch(0.78 0.14 78 / 0.85)" }}
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
                  <span
                    aria-hidden
                    className="absolute -top-1.5 left-1/2 size-2 -translate-x-1/2 rotate-45"
                    style={{ backgroundColor: ringColor }}
                  />
                  {/* Crown badge: marks the Overlord — death = run lost. */}
                  {isOverlordUnit ? (
                    <span
                      aria-hidden
                      title="OVERLORD — proteja!"
                      className="absolute -top-2.5 left-1/2 grid size-5 -translate-x-1/2 place-items-center rounded-full border-2 shadow"
                      style={{
                        borderColor: "oklch(0.78 0.16 78)",
                        backgroundColor: "oklch(0.18 0.02 70)",
                        color: "oklch(0.85 0.16 78)",
                      }}
                    >
                      <Crown className="size-3" />
                    </span>
                  ) : null}
                  {/* Status badges (taunted / shielded / sombra-charged) */}
                  {hasShield ? (
                    <span
                      aria-hidden
                      title="Couraçado (-50% dano)"
                      className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full border border-foreground/60 bg-card text-foreground shadow"
                    >
                      <ShieldAlert className="size-2.5" />
                    </span>
                  ) : null}
                  {isTaunted ? (
                    <span
                      aria-hidden
                      title="Provocado"
                      className="absolute -left-1 -top-1 grid size-4 place-items-center rounded-full border border-destructive bg-destructive text-destructive-foreground shadow"
                    >
                      <Flame className="size-2.5" />
                    </span>
                  ) : null}
                  {u.nextAttackBonus && u.nextAttackBonus > 1 ? (
                    <span
                      aria-hidden
                      title="Próximo golpe ardente"
                      className="absolute -right-1 -bottom-3 grid size-4 place-items-center rounded-full border border-gold bg-gold text-background shadow"
                    >
                      <Sparkle className="size-2.5" />
                    </span>
                  ) : null}
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
                        : p.tone === "heal"
                          ? "oklch(0.78 0.14 78)"
                          : "var(--destructive)",
                }}
              >
                {p.text}
              </span>
            ))}

            {/* Per-archetype attack flash overlay. Each entry is a tiny
                animated SVG at the target hex; pointer-events-none so it
                never interferes with hex tap. Anim is 100% CSS keyframes
                in globals.css (.flash-burst / .flash-ring). */}
            {flashes.map((f) => {
              const cx = ((f.x + offsetX) / viewW) * 100
              const cy = ((f.y + offsetY) / viewH) * 100
              const sizePct = ((HEX_SIZE * 2 * f.spec.scale) / viewW) * 100
              return (
                <span
                  key={f.id}
                  className={cn(
                    "pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full",
                    f.spec.shape === "burst" ? "flash-burst" : "flash-ring",
                  )}
                  style={{
                    left: `${cx}%`,
                    top: `${cy}%`,
                    width: `${sizePct}%`,
                    aspectRatio: "1",
                    backgroundColor:
                      f.spec.shape === "burst" ? f.spec.color : "transparent",
                    boxShadow:
                      f.spec.shape === "burst"
                        ? `0 0 24px ${f.spec.color}, 0 0 48px ${f.spec.color}`
                        : `0 0 16px ${f.spec.color}`,
                    border:
                      f.spec.shape === "ring"
                        ? `3px solid ${f.spec.color}`
                        : "none",
                    animationDuration: `${f.spec.ms}ms`,
                  }}
                />
              )
            })}

            {state.done ? (
              <div className="slam-in absolute inset-0 z-30 grid place-items-center bg-background/85 backdrop-blur-md">
                <div className="text-center">
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
          </div>
        </div>
      </main>

      {/* Hint toast (centered, transient) */}
      {hint ? (
        <div className="pointer-events-none fixed left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2">
          <div className="slam-in rounded-md border-2 border-destructive/70 bg-card/95 px-4 py-2 backdrop-blur shadow-[0_8px_24px_oklch(0.55_0.21_22/0.5)]">
            <p className="font-display text-sm font-black uppercase tracking-[0.18em] text-destructive">
              {hint}
            </p>
          </div>
        </div>
      ) : null}

      {taunt ? (
        <div className="pointer-events-none fixed bottom-32 left-1/2 z-40 w-[88vw] max-w-md -translate-x-1/2 px-4">
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

      {/* Footer — action panel */}
      <footer className="relative z-20 border-t border-border/60 bg-background/90 backdrop-blur">
        {/* Targeting banner shows above the footer when picking a special target */}
        {specialMode && active && active.faction === "minion" && SPECIALS[active.templateId] ? (
          <div className="border-b border-gold/40 bg-gold/10 px-3 py-1.5">
            <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-2">
              <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-gold">
                <Wand2 className="-mt-0.5 mr-1 inline size-3" />
                {SPECIALS[active.templateId]!.name} — escolha um{" "}
                {SPECIALS[active.templateId]!.target === "fallen-ally"
                  ? "aliado caído"
                  : "hex livre"}
              </p>
              <button
                type="button"
                onClick={cancelSpecial}
                className="flex h-6 shrink-0 items-center gap-1 rounded border border-border/80 bg-secondary/60 px-2 font-mono text-[8px] font-black uppercase tracking-[0.2em] text-foreground transition active:scale-95"
              >
                <XIcon className="size-3" />
                cancelar
              </button>
            </div>
          </div>
        ) : null}
        {/* Overlord skill targeting banner — describes WHAT and WHO the
            current active skill targets so the player isn't guessing. */}
        {skillMode && active && OVERLORD_SKILLS[skillMode.skillId] ? (
          <div className="border-b border-accent/50 bg-accent/10 px-3 py-1.5">
            <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-2">
              <p className="min-w-0 truncate font-mono text-[9px] uppercase tracking-[0.28em] text-accent">
                <Wand2 className="-mt-0.5 mr-1 inline size-3" />
                {OVERLORD_SKILLS[skillMode.skillId].name} — {targetHint(OVERLORD_SKILLS[skillMode.skillId])}
              </p>
              <button
                type="button"
                onClick={cancelSkillMode}
                className="flex h-6 shrink-0 items-center gap-1 rounded border border-border/80 bg-secondary/60 px-2 font-mono text-[8px] font-black uppercase tracking-[0.2em] text-foreground transition active:scale-95"
              >
                <XIcon className="size-3" />
                cancelar
              </button>
            </div>
          </div>
        ) : null}
        {/* Description popover — long-press / hover on a skill button
            opens this panel so the player can read what the ability does
            BEFORE committing the action. */}
        {skillInfo && OVERLORD_SKILLS[skillInfo] ? (
          <div className="border-b border-border/60 bg-card/95 px-3 py-2">
            <div className="mx-auto flex w-full max-w-2xl items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-display text-[12px] font-black uppercase tracking-[0.18em] text-accent">
                  {OVERLORD_SKILLS[skillInfo].name}
                </p>
                <p className="mt-1 text-[11px] leading-snug text-foreground/85">
                  {OVERLORD_SKILLS[skillInfo].text}
                </p>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                  ALC {OVERLORD_SKILLS[skillInfo].range || "—"} · CD{" "}
                  {OVERLORD_SKILLS[skillInfo].cooldown}r
                  {OVERLORD_SKILLS[skillInfo].uses === 1 ? " · 1×" : ""}
                  {OVERLORD_SKILLS[skillInfo].aoeRadius > 0
                    ? ` · AOE ${OVERLORD_SKILLS[skillInfo].aoeRadius}`
                    : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSkillInfo(null)}
                className="flex h-6 shrink-0 items-center gap-1 rounded border border-border/80 bg-secondary/60 px-2 font-mono text-[8px] font-black uppercase tracking-[0.2em] text-foreground transition active:scale-95"
              >
                <XIcon className="size-3" />
                fechar
              </button>
            </div>
          </div>
        ) : null}
        {/* Overlord skill bar — only when the Underlord himself is active. */}
        {isOverlordTurn && active && equippedSkills.length > 0 ? (
          <div className="border-b border-border/60 bg-background/85 px-2.5 py-1.5">
            <div className="mx-auto flex w-full max-w-2xl items-center justify-center gap-2">
              {equippedSkills.map((sid) => {
                const def = OVERLORD_SKILLS[sid]
                if (!def) return null
                return (
                  <SkillBarButton
                    key={sid}
                    skill={def}
                    unit={active}
                    armed={skillMode?.skillId === sid}
                    onActivate={() =>
                      skillMode?.skillId === sid
                        ? cancelSkillMode()
                        : activateOverlordSkill(sid)
                    }
                    onInfo={() => setSkillInfo(skillInfo === sid ? null : sid)}
                  />
                )
              })}
            </div>
          </div>
        ) : null}
        <div className="mx-auto w-full max-w-2xl px-2.5 pt-2 pb-2.5">
          {/* Top row: active card + ability tag */}
          <div className="flex items-center gap-2.5">
            {active ? (
              <div className="min-w-0 flex-1">
                <ActiveUnitCard unit={active} />
              </div>
            ) : (
              <div className="min-w-0 flex-1" />
            )}
          </div>
          {/* Bottom row: action buttons */}
          <div className="mt-2 flex items-center gap-1.5">
            {/* Status pills */}
            <div className="flex shrink-0 items-center gap-1">
              <ActionPill label="MOV" done={!!active?.moved} />
              <ActionPill label={isHealer ? "CURA" : "ATK"} done={!!active?.acted} />
            </div>
            <div className="flex flex-1 items-center justify-end gap-1.5">
              {local.preMove && active?.moved && !active.acted ? (
                <button
                  type="button"
                  onClick={handleUndoMove}
                  className="flex h-10 shrink-0 items-center gap-1 rounded-md border border-border/80 bg-secondary/60 px-2.5 font-display text-[10px] font-black uppercase tracking-[0.18em] text-foreground transition active:scale-95"
                >
                  <Undo2 className="size-3" />
                  Volta
                </button>
              ) : null}
              {/* SPECIAL button — only roster minions whose archetype actually
                  has an active special. New archetypes (bone/harpy/gorger/
                  wraith/lich) are defined by their attack kind only. */}
              {isMinionTurn &&
              active &&
              active.faction === "minion" &&
              !active.isBarrier &&
              !active.isOverlord &&
              MINION_TEMPLATES[active.templateId]?.hasActiveSpecial ? (
                <SpecialButton
                  unit={active}
                  active={!!specialMode}
                  onClick={specialMode ? cancelSpecial : activateSpecial}
                />
              ) : null}
              <button
                type="button"
                onClick={handleEndTurn}
                disabled={!isMinionTurn}
                className={cn(
                  "flex h-12 shrink-0 items-center gap-1.5 rounded-md border-2 px-4 font-display text-[12px] font-black uppercase tracking-[0.22em] transition active:scale-95",
                  !isMinionTurn
                    ? "cursor-not-allowed border-border bg-secondary/60 text-muted-foreground"
                    : turnState === "ready"
                      ? "border-gold bg-gold text-background ready-pulse"
                      : turnState === "partial"
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-secondary/80 text-foreground",
                )}
                style={
                  isMinionTurn
                    ? {
                        boxShadow:
                          "inset 0 1px 0 oklch(1 0 0 / 0.18), inset 0 -2px 0 oklch(0 0 0 / 0.35), 0 4px 16px oklch(0.55 0.21 22 / 0.35)",
                      }
                    : undefined
                }
              >
                {isHeroTurn ? (
                  <>VEZ DELE</>
                ) : turnState === "ready" ? (
                  <>
                    <Sparkles className="size-3.5" />
                    PRÓXIMO
                  </>
                ) : turnState === "partial" ? (
                  <>
                    <RotateCcw className="size-3.5" />
                    ENCERRAR
                  </>
                ) : (
                  <>
                    PASSAR
                    <Zap className="size-3" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function ActionPill({ label, done }: { label: string; done: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded border px-1.5 font-mono text-[8px] font-black uppercase tracking-[0.18em] transition",
        done
          ? "border-accent/60 bg-accent/15 text-accent line-through"
          : "border-border bg-secondary/40 text-muted-foreground",
      )}
    >
      {done ? <span aria-hidden>●</span> : <span aria-hidden>○</span>}
      {label}
    </span>
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
        const src = u.isOverlord
          ? "/images/overlord.jpg"
          : u.faction === "hero" && u.heroId
            ? `/images/heroes/${u.heroId}.jpg`
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
              <Image src={src || "/placeholder.svg"} alt={u.name} fill sizes="20px" className="object-cover" />
            </span>
            <span className="max-w-[60px] truncate">{u.name}</span>
          </span>
        )
      })}
    </div>
  )
}

/**
 * SPECIAL button — shows the active minion's ability with cooldown overlay.
 * Disabled when on cooldown, when the cost can't be paid, or when uses depleted.
 */
function SpecialButton({
  unit,
  active,
  onClick,
}: {
  unit: Unit
  active: boolean
  onClick: () => void
}) {
  const def = SPECIALS[unit.templateId]
  // SpecialButton is only rendered for archetypes whose template flags
  // hasActiveSpecial — but typing-wise SPECIALS is partial, so handle null.
  if (!def) return null
  const onCd = unit.specialCd > 0
  const spent = def.uses === 1 && unit.specialSpent
  const cantAfford =
    (def.cost === "action" && unit.acted) ||
    (def.cost === "move" && unit.moved)
  const disabled = onCd || spent || cantAfford
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled && !active}
      className={cn(
        "relative flex h-12 shrink-0 items-center gap-1.5 rounded-md border-2 px-3 font-display text-[11px] font-black uppercase tracking-[0.18em] transition active:scale-95",
        active
          ? "border-gold bg-gold text-background ready-pulse"
          : disabled
            ? "cursor-not-allowed border-border bg-secondary/60 text-muted-foreground"
            : "border-gold/70 bg-card text-gold hover:bg-gold/10",
      )}
      style={{
        boxShadow: !disabled
          ? "inset 0 1px 0 oklch(1 0 0 / 0.18), 0 4px 12px oklch(0.78 0.14 78 / 0.25)"
          : undefined,
      }}
      aria-label={`${def.name} (${
        onCd
          ? `recarregando ${unit.specialCd}r`
          : spent
            ? "esgotada"
            : cantAfford
              ? def.cost === "action"
                ? "já agiu"
                : "já moveu"
              : "pronta"
      })`}
      title={def.text}
    >
      <Wand2 className="size-3.5" />
      <span>{def.short}</span>
      {onCd ? (
        <span className="grid size-5 place-items-center rounded-full border border-foreground/30 bg-background/70 font-mono text-[9px] tabular-nums text-foreground">
          {unit.specialCd}
        </span>
      ) : spent ? (
        <span className="font-mono text-[8px] tracking-[0.18em] text-foreground/60">
          ×
        </span>
      ) : null}
    </button>
  )
}

/** Short hint string explaining what to click when targeting a skill. */
function targetHint(skill: SkillDef): string {
  switch (skill.target) {
    case "enemy":
      return `escolha um inimigo (alc ${skill.range})`
    case "ally":
      return `escolha um aliado (alc ${skill.range})`
    case "fallen-ally":
      return `escolha um aliado caído (alc ${skill.range})`
    case "free-hex":
      return skill.aoeRadius > 0
        ? `escolha um hex livre — AOE raio ${skill.aoeRadius}`
        : `escolha um hex livre (alc ${skill.range})`
    default:
      return ""
  }
}

function SkillBarButton({
  skill,
  unit,
  armed,
  onActivate,
  onInfo,
}: {
  skill: SkillDef
  unit: Unit
  /** True when this skill is currently in targeting mode. */
  armed: boolean
  /** Press: activate (or cancel if already armed). */
  onActivate: () => void
  /** Long-press / right-click on the button: show description popover. */
  onInfo: () => void
}) {
  const cd = unit.skillCooldowns?.[skill.id] ?? 0
  const onCd = cd > 0
  const spent = skill.uses === 1 && !!unit.skillSpent?.[skill.id]
  const acted = !!unit.acted
  const disabled = onCd || spent || acted
  // Long-press detection so a player can read the description without
  // committing to firing the skill.
  const longRef = useRef<number | null>(null)
  const longFiredRef = useRef(false)
  function startPress() {
    longFiredRef.current = false
    if (longRef.current) window.clearTimeout(longRef.current)
    longRef.current = window.setTimeout(() => {
      longRef.current = null
      longFiredRef.current = true
      onInfo()
    }, 360)
  }
  function endPress(fire: boolean) {
    if (longRef.current) {
      window.clearTimeout(longRef.current)
      longRef.current = null
    }
    if (fire && !longFiredRef.current) onActivate()
  }
  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        type="button"
        onPointerDown={startPress}
        onPointerUp={() => endPress(true)}
        onPointerLeave={() => endPress(false)}
        onContextMenu={(e) => {
          e.preventDefault()
          onInfo()
        }}
        aria-label={`${skill.name} — ${skill.text}`}
        title={skill.text}
        className={cn(
          "relative flex h-11 min-w-[3.25rem] items-center justify-center gap-1 rounded-md border-2 px-2 font-display text-[10px] font-black uppercase tracking-[0.16em] transition active:scale-95",
          armed
            ? "border-accent bg-accent text-background ready-pulse"
            : disabled
              ? "cursor-not-allowed border-border bg-secondary/60 text-muted-foreground"
              : "border-accent/70 bg-card text-accent hover:bg-accent/10",
        )}
        style={{
          boxShadow:
            armed || !disabled
              ? "inset 0 1px 0 oklch(1 0 0 / 0.18), 0 3px 10px oklch(0.7 0.18 282 / 0.2)"
              : undefined,
        }}
      >
        <Wand2 className="size-3" />
        <span>{skill.short}</span>
        {onCd ? (
          <span className="grid size-4 place-items-center rounded-full border border-foreground/30 bg-background/70 font-mono text-[8px] tabular-nums text-foreground">
            {cd}
          </span>
        ) : spent ? (
          <span className="font-mono text-[8px] tracking-[0.18em] text-foreground/60">
            ×
          </span>
        ) : null}
      </button>
      <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">
        {onCd ? `CD ${cd}r` : spent ? "USADA" : `CD ${skill.cooldown}r`}
      </span>
    </div>
  )
}

function ActiveUnitCard({ unit }: { unit: Unit }) {
  const tpl =
    unit.faction === "minion" && !unit.isOverlord
      ? MINION_TEMPLATES[unit.templateId]
      : null
  const src = unit.isOverlord
    ? "/images/overlord.jpg"
    : unit.faction === "hero" && unit.heroId
      ? `/images/heroes/${unit.heroId}.jpg`
      : `/images/minions/${unit.templateId}.jpg`
  const borderColor = unit.isOverlord
    ? "oklch(0.78 0.16 78)"
    : unit.faction === "hero"
      ? "var(--destructive)"
      : tonePixel(unit.tone)
  const hpRatio = unit.hp / unit.hpMax
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span
        className="relative size-12 shrink-0 overflow-hidden rounded-md border-2"
        style={{ borderColor }}
      >
        <Image src={src || "/placeholder.svg"} alt={unit.name} fill sizes="48px" className="object-cover" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <p className="truncate font-display text-xs font-black uppercase leading-tight text-foreground sm:text-sm">
            {unit.name}
            {unit.faction === "hero" ? (
              <Skull className="ml-1 inline size-3 text-destructive" />
            ) : null}
          </p>
          {tpl ? (
            <span className="shrink-0 rounded border border-accent/50 bg-accent/15 px-1 py-px font-mono text-[8px] font-black uppercase tracking-wider text-accent">
              {tpl.attackKind === "heal" ? <Heart className="-mt-0.5 inline size-2.5" /> : null}
              {" "}{tpl.abilityTag}
            </span>
          ) : null}
        </div>
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
        </div>
      </div>
    </div>
  )
}
