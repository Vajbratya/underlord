/**
 * Pure battle logic — independent of React. Used by the battle screen reducer.
 *
 * Battle flow:
 *  1. All units sorted by SPD descending → initiative order.
 *  2. On each unit's turn:
 *     - If minion: player picks move + action.
 *     - If hero: AI computes move + action automatically.
 *  3. Round ends when every unit has acted; reset acted flags, repeat.
 *  4. Battle ends when one side has no living units.
 */

import { axialEqual, axialKey, hexDistance, neighbors } from './hex'
import type { Axial, Unit } from './types'

export type BattleState = {
  cols: number
  rows: number
  units: Unit[]
  /** Initiative order: ids in turn order. */
  order: string[]
  /** Index into order — whose turn it is. */
  turn: number
  /** Round counter for HUD. */
  round: number
  /** Selected unit (if any). */
  selectedId: string | null
  /** Last action log lines for the side panel. */
  log: string[]
  /** Set when victory condition reached. */
  done: 'victory' | 'defeat' | null
}

export function initBattle(units: Unit[], cols: number, rows: number): BattleState {
  const order = sortInitiative(units)
  return {
    cols,
    rows,
    units,
    order,
    turn: 0,
    round: 1,
    selectedId: null,
    log: ['As paredes da torre suspiram. O combate começou.'],
    done: null,
  }
}

function sortInitiative(units: Unit[]): string[] {
  return units
    .filter((u) => !u.dead)
    .slice()
    .sort((a, b) => {
      if (b.spd !== a.spd) return b.spd - a.spd
      // Tiebreak: minions go first (Underlord's home turf advantage)
      if (a.faction !== b.faction) return a.faction === 'minion' ? -1 : 1
      return a.id.localeCompare(b.id)
    })
    .map((u) => u.id)
}

export function activeUnit(s: BattleState): Unit | null {
  const id = s.order[s.turn]
  return s.units.find((u) => u.id === id) ?? null
}

export function unitAt(s: BattleState, a: Axial): Unit | null {
  return s.units.find((u) => !u.dead && axialEqual(u.pos, a)) ?? null
}

export function blockedSet(s: BattleState, except?: string): Set<string> {
  const out = new Set<string>()
  for (const u of s.units) {
    if (u.dead) continue
    if (except && u.id === except) continue
    out.add(axialKey(u.pos))
  }
  return out
}

/** Move unit to dest if reachable. Returns updated state and whether successful. */
export function moveUnit(
  s: BattleState,
  unitId: string,
  dest: Axial,
): BattleState {
  const u = s.units.find((x) => x.id === unitId)
  if (!u || u.dead) return s
  const dist = hexDistance(u.pos, dest)
  if (dist === 0 || dist > u.move) return s
  const occupied = blockedSet(s, u.id)
  if (occupied.has(axialKey(dest))) return s
  const nextUnits = s.units.map((x) =>
    x.id === unitId ? { ...x, pos: dest } : x,
  )
  return { ...s, units: nextUnits }
}

export type AttackOutcome = {
  state: BattleState
  hit: boolean
  damage: number
  /** True when the roll landed a critical strike (×1.7 damage). */
  crit: boolean
  killed: boolean
  attackerName: string
  targetName: string
}

/** Probability a given attack rolls a critical (variable-ratio dopamine). */
const CRIT_CHANCE = 0.18
const CRIT_MULT = 1.7

/** Attack target if in range. Marks attacker as acted. */
export function attackUnit(
  s: BattleState,
  attackerId: string,
  targetId: string,
): AttackOutcome {
  const att = s.units.find((u) => u.id === attackerId)
  const tgt = s.units.find((u) => u.id === targetId)
  if (!att || !tgt || att.dead || tgt.dead) {
    return {
      state: s,
      hit: false,
      damage: 0,
      crit: false,
      killed: false,
      attackerName: att?.name ?? '?',
      targetName: tgt?.name ?? '?',
    }
  }
  const dist = hexDistance(att.pos, tgt.pos)
  if (dist > att.range) {
    return {
      state: s,
      hit: false,
      damage: 0,
      crit: false,
      killed: false,
      attackerName: att.name,
      targetName: tgt.name,
    }
  }
  // Damage roll: atk ±20% with chance of critical (variable-ratio reward)
  const crit = Math.random() < CRIT_CHANCE
  const variance = 1 + (Math.random() - 0.5) * 0.4
  const baseDmg = att.atk * variance * (crit ? CRIT_MULT : 1)
  const dmg = Math.max(1, Math.round(baseDmg))
  const newHp = Math.max(0, tgt.hp - dmg)
  const killed = newHp === 0
  const nextUnits = s.units.map((u) => {
    if (u.id === tgt.id) return { ...u, hp: newHp, dead: killed }
    if (u.id === att.id) return { ...u, acted: true }
    return u
  })
  const log = [
    ...s.log,
    `${att.name} → ${tgt.name}: -${dmg}${crit ? ' CRIT' : ''}${killed ? ' (abatido)' : ''}`,
  ].slice(-6)
  return {
    state: { ...s, units: nextUnits, log },
    hit: true,
    damage: dmg,
    crit,
    killed,
    attackerName: att.name,
    targetName: tgt.name,
  }
}

/** End current unit's turn. Advances to next non-dead unit; new round if needed. */
export function endTurn(s: BattleState): BattleState {
  const cur = activeUnit(s)
  let units = s.units
  if (cur) units = units.map((u) => (u.id === cur.id ? { ...u, acted: true } : u))

  // Find next unit in order who isn't dead
  let next = s.turn + 1
  let round = s.round
  let nextOrder = s.order
  for (let i = 0; i < s.order.length + 1; i++) {
    if (next >= nextOrder.length) {
      // New round — recompute order and reset acted flags
      units = units.map((u) => ({ ...u, acted: false }))
      nextOrder = sortInitiative(units)
      next = 0
      round += 1
    }
    const cand = units.find((u) => u.id === nextOrder[next])
    if (cand && !cand.dead) break
    next += 1
  }

  const done = computeDone(units)
  return {
    ...s,
    units,
    order: nextOrder,
    turn: next,
    round,
    selectedId: null,
    done,
  }
}

function computeDone(units: Unit[]): BattleState['done'] {
  const minionsAlive = units.some((u) => u.faction === 'minion' && !u.dead)
  const heroesAlive = units.some((u) => u.faction === 'hero' && !u.dead)
  if (!minionsAlive) return 'defeat'
  if (!heroesAlive) return 'victory'
  return null
}

/* ---------------- AI ---------------- */

/**
 * Hero AI: pick the nearest/lowest-HP minion, move toward it, attack if in range.
 * Returns a sequence of moves applied to state, with descriptive log lines.
 */
export function aiTakeTurn(s: BattleState, heroId: string): BattleState {
  const hero = s.units.find((u) => u.id === heroId)
  if (!hero || hero.dead) return endTurn(s)

  // Find target — prefer lowest HP minion within reasonable distance
  const targets = s.units.filter((u) => u.faction === 'minion' && !u.dead)
  if (targets.length === 0) return endTurn(s)

  targets.sort((a, b) => {
    const da = hexDistance(hero.pos, a.pos)
    const db = hexDistance(hero.pos, b.pos)
    if (da !== db) return da - db
    return a.hp - b.hp
  })
  const target = targets[0]

  // Step toward target up to `move` hexes (greedy)
  let cur = hero.pos
  const occ = blockedSet(s, hero.id)
  let state = s
  for (let i = 0; i < hero.move; i++) {
    const ns = neighbors(cur)
      .filter((n) => {
        if (occ.has(axialKey(n))) return false
        if (n.r < 0 || n.r >= s.rows) return false
        const offset = -Math.floor(n.r / 2)
        if (n.q < offset || n.q >= s.cols + offset) return false
        return true
      })
      .sort((a, b) => hexDistance(a, target.pos) - hexDistance(b, target.pos))
    if (!ns.length) break
    const best = ns[0]
    if (hexDistance(best, target.pos) >= hexDistance(cur, target.pos)) break
    // Apply move
    state = {
      ...state,
      units: state.units.map((u) =>
        u.id === hero.id ? { ...u, pos: best } : u,
      ),
    }
    occ.delete(axialKey(cur))
    occ.add(axialKey(best))
    cur = best
    if (hexDistance(cur, target.pos) <= hero.range) break
  }

  // Attempt attack
  const updatedHero = state.units.find((u) => u.id === hero.id)
  if (updatedHero && hexDistance(updatedHero.pos, target.pos) <= updatedHero.range) {
    const outcome = attackUnit(state, hero.id, target.id)
    state = outcome.state
  }

  return endTurn(state)
}
