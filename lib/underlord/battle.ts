/**
 * Pure battle logic — independent of React. Used by the battle screen reducer.
 *
 * Action economy (XCOM-ish):
 *  - Each unit gets ONE move and ONE action per turn.
 *  - Move and action can be done in any order; doing both does NOT auto-end the turn.
 *  - Player presses END TURN explicitly (or chooses WAIT to skip both).
 *  - Round ends when every unit has been advanced once; flags reset.
 *
 * Attack kinds:
 *  - basic   : single target.
 *  - cleave  : target + 1 adjacent enemy at 50%.
 *  - splash  : target + ALL enemies within 1 hex of target at 50%.
 *  - pierce  : target + 1 hex beyond in attacker→target line at 50%.
 *  - execute : target with ×1.5 damage if HP < 40%.
 *  - heal    : target an ally → restore 30% hpMax (separate path; see healUnit).
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

/** Move unit to dest if reachable AND not already moved this turn. */
export function moveUnit(
  s: BattleState,
  unitId: string,
  dest: Axial,
): BattleState {
  const u = s.units.find((x) => x.id === unitId)
  if (!u || u.dead || u.moved) return s
  const dist = hexDistance(u.pos, dest)
  if (dist === 0 || dist > u.move) return s
  const occupied = blockedSet(s, u.id)
  if (occupied.has(axialKey(dest))) return s
  const nextUnits = s.units.map((x) =>
    x.id === unitId ? { ...x, pos: dest, moved: true } : x,
  )
  return { ...s, units: nextUnits }
}

export type AttackOutcome = {
  state: BattleState
  hit: boolean
  /** Total damage to primary target. */
  damage: number
  /** True when the roll landed a critical strike. */
  crit: boolean
  /** True when primary target was killed. */
  killed: boolean
  /** Splash/cleave/pierce collateral hits. */
  splashHits: { unitId: string; damage: number; killed: boolean; pos: Axial }[]
  /** True when this is an execute proc. */
  executed: boolean
  attackerName: string
  targetName: string
  attackKind: Unit['attackKind']
}

const CRIT_CHANCE = 0.18
const CRIT_MULT = 1.7
const EXECUTE_THRESHOLD = 0.4
const EXECUTE_MULT = 1.5
const SPLASH_RATIO = 0.5

function emptyOutcome(s: BattleState, attName: string, tgtName: string, kind: Unit['attackKind']): AttackOutcome {
  return {
    state: s,
    hit: false,
    damage: 0,
    crit: false,
    killed: false,
    splashHits: [],
    executed: false,
    attackerName: attName,
    targetName: tgtName,
    attackKind: kind,
  }
}

/** Attack target if in range. Marks attacker as acted. */
export function attackUnit(
  s: BattleState,
  attackerId: string,
  targetId: string,
  bonusMult: number = 1,
): AttackOutcome {
  const att = s.units.find((u) => u.id === attackerId)
  const tgt = s.units.find((u) => u.id === targetId)
  if (!att || !tgt || att.dead || tgt.dead) {
    return emptyOutcome(s, att?.name ?? '?', tgt?.name ?? '?', att?.attackKind ?? 'basic')
  }
  if (att.faction === tgt.faction) {
    // Friendly fire blocked here; heal goes through healUnit.
    return emptyOutcome(s, att.name, tgt.name, att.attackKind)
  }
  if (att.acted) return emptyOutcome(s, att.name, tgt.name, att.attackKind)

  const dist = hexDistance(att.pos, tgt.pos)
  if (dist > att.range) return emptyOutcome(s, att.name, tgt.name, att.attackKind)

  // Primary roll
  const crit = Math.random() < CRIT_CHANCE
  const variance = 1 + (Math.random() - 0.5) * 0.4
  const executed =
    att.attackKind === 'execute' && tgt.hp / tgt.hpMax < EXECUTE_THRESHOLD
  const kindMult = executed ? EXECUTE_MULT : 1
  const baseDmg =
    att.atk * variance * (crit ? CRIT_MULT : 1) * bonusMult * kindMult
  const dmg = Math.max(1, Math.round(baseDmg))

  // Apply primary damage
  const newHp = Math.max(0, tgt.hp - dmg)
  const killed = newHp === 0

  // Splash/cleave/pierce collateral candidates
  const collateral: AttackOutcome['splashHits'] = []
  const splashDmg = Math.max(1, Math.round(dmg * SPLASH_RATIO))

  if (att.attackKind === 'splash') {
    // All enemies within 1 hex of target (excluding target itself)
    for (const u of s.units) {
      if (u.dead || u.id === tgt.id) continue
      if (u.faction !== tgt.faction) continue
      if (hexDistance(u.pos, tgt.pos) <= 1) {
        collateral.push({ unitId: u.id, damage: splashDmg, killed: false, pos: u.pos })
      }
    }
  } else if (att.attackKind === 'cleave') {
    // First adjacent enemy of target (excluding primary)
    for (const n of neighbors(tgt.pos)) {
      const adj = s.units.find(
        (u) => !u.dead && u.id !== tgt.id && u.faction === tgt.faction && axialEqual(u.pos, n),
      )
      if (adj) {
        collateral.push({ unitId: adj.id, damage: splashDmg, killed: false, pos: adj.pos })
        break
      }
    }
  } else if (att.attackKind === 'pierce') {
    // The hex beyond target along attacker→target line
    const dq = tgt.pos.q - att.pos.q
    const dr = tgt.pos.r - att.pos.r
    // Normalize step (since dist is integer along axial line, divide by dist)
    const step = { q: Math.sign(dq), r: Math.sign(dr) }
    if (step.q !== 0 || step.r !== 0) {
      const beyond: Axial = { q: tgt.pos.q + step.q, r: tgt.pos.r + step.r }
      const beyondTarget = s.units.find(
        (u) => !u.dead && u.faction === tgt.faction && axialEqual(u.pos, beyond),
      )
      if (beyondTarget) {
        collateral.push({
          unitId: beyondTarget.id,
          damage: splashDmg,
          killed: false,
          pos: beyondTarget.pos,
        })
      }
    }
  }

  // Apply all damage
  let nextUnits = s.units.map((u) => {
    if (u.id === tgt.id) return { ...u, hp: newHp, dead: killed }
    if (u.id === att.id) return { ...u, acted: true }
    return u
  })
  for (const c of collateral) {
    nextUnits = nextUnits.map((u) => {
      if (u.id !== c.unitId) return u
      const after = Math.max(0, u.hp - c.damage)
      const wasKilled = after === 0
      c.killed = wasKilled
      return { ...u, hp: after, dead: wasKilled }
    })
  }

  const collateralKilled = collateral.filter((c) => c.killed).length
  const tag =
    att.attackKind === 'splash'
      ? ' AOE'
      : att.attackKind === 'cleave'
        ? ' CLIVA'
        : att.attackKind === 'pierce'
          ? ' PERFURA'
          : executed
            ? ' EXECUTA'
            : ''
  const log = [
    ...s.log,
    `${att.name} → ${tgt.name}: -${dmg}${crit ? ' CRIT' : ''}${tag}${
      killed ? ' (abatido)' : ''
    }${collateralKilled ? ` +${collateralKilled} colateral` : ''}`,
  ].slice(-6)

  return {
    state: { ...s, units: nextUnits, log },
    hit: true,
    damage: dmg,
    crit,
    killed,
    splashHits: collateral,
    executed,
    attackerName: att.name,
    targetName: tgt.name,
    attackKind: att.attackKind,
  }
}

export type HealOutcome = {
  state: BattleState
  hit: boolean
  amount: number
  healerName: string
  targetName: string
}

/** Heal an ally for 30% of their hpMax. Marks healer as acted. */
export function healUnit(
  s: BattleState,
  healerId: string,
  allyId: string,
): HealOutcome {
  const h = s.units.find((u) => u.id === healerId)
  const a = s.units.find((u) => u.id === allyId)
  if (!h || !a || h.dead || a.dead) {
    return { state: s, hit: false, amount: 0, healerName: h?.name ?? '?', targetName: a?.name ?? '?' }
  }
  if (h.attackKind !== 'heal') {
    return { state: s, hit: false, amount: 0, healerName: h.name, targetName: a.name }
  }
  if (h.faction !== a.faction) {
    return { state: s, hit: false, amount: 0, healerName: h.name, targetName: a.name }
  }
  if (h.id === a.id) {
    return { state: s, hit: false, amount: 0, healerName: h.name, targetName: a.name }
  }
  if (h.acted) {
    return { state: s, hit: false, amount: 0, healerName: h.name, targetName: a.name }
  }
  if (hexDistance(h.pos, a.pos) > h.range) {
    return { state: s, hit: false, amount: 0, healerName: h.name, targetName: a.name }
  }
  const heal = Math.max(1, Math.round(a.hpMax * 0.3))
  const newHp = Math.min(a.hpMax, a.hp + heal)
  const actual = newHp - a.hp
  const nextUnits = s.units.map((u) => {
    if (u.id === a.id) return { ...u, hp: newHp }
    if (u.id === h.id) return { ...u, acted: true }
    return u
  })
  const log = [...s.log, `${h.name} cura ${a.name}: +${actual}`].slice(-6)
  return {
    state: { ...s, units: nextUnits, log },
    hit: true,
    amount: actual,
    healerName: h.name,
    targetName: a.name,
  }
}

/** End current unit's turn (skip to next, regardless of move/act state). */
export function endTurn(s: BattleState): BattleState {
  const cur = activeUnit(s)
  let units = s.units
  if (cur) {
    units = units.map((u) => (u.id === cur.id ? { ...u, acted: true, moved: true } : u))
  }

  let next = s.turn + 1
  let round = s.round
  let nextOrder = s.order
  for (let i = 0; i < s.order.length + 1; i++) {
    if (next >= nextOrder.length) {
      // New round — reset flags, recompute order
      units = units.map((u) => ({ ...u, acted: false, moved: false }))
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
 * Hero AI — scoring-based target picker plus pathing.
 *
 * Scoring (higher = preferred):
 *  - +200 if reachable + attackable this turn (move+attack will land)
 *  - +(80 - target.hp)         : prefer wounded targets
 *  - +(target.atk * 4)         : prefer high-threat
 *  - +30                        : if target is a brown (taunt aura)
 *  - -(distance_to_reach * 3)  : prefer closer
 *
 * Higher-stage heroes use full scoring; weaker heroes (stage 1-3) just go
 * to nearest.
 */
export function aiTakeTurn(s: BattleState, heroId: string, smart: boolean = true): BattleState {
  const hero = s.units.find((u) => u.id === heroId)
  if (!hero || hero.dead) return endTurn(s)

  const targets = s.units.filter((u) => u.faction === 'minion' && !u.dead)
  if (targets.length === 0) return endTurn(s)

  // Score-based target selection
  const scored = targets.map((t) => {
    const dist = hexDistance(hero.pos, t.pos)
    const reachableNow = dist <= hero.range
    // Can-reach-and-attack-this-turn estimate: dist - range <= move
    const stepsNeeded = Math.max(0, dist - hero.range)
    const reachable = stepsNeeded <= hero.move
    let score = 0
    if (reachableNow) score += 200
    else if (reachable) score += 100
    score += Math.max(0, 80 - t.hp)
    score += t.atk * 4
    if (t.templateId === 'brown') score += 30
    score -= dist * 3
    return { unit: t, score, dist, reachableNow, reachable, stepsNeeded }
  })
  scored.sort((a, b) => b.score - a.score)

  const target = smart ? scored[0].unit : targets.slice().sort((a, b) => hexDistance(hero.pos, a.pos) - hexDistance(hero.pos, b.pos))[0]

  // Step toward target greedily up to `move` hexes (but stop once within range)
  let cur = hero.pos
  const occ = blockedSet(s, hero.id)
  let state = s
  for (let i = 0; i < hero.move; i++) {
    if (hexDistance(cur, target.pos) <= hero.range) break
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
    state = {
      ...state,
      units: state.units.map((u) =>
        u.id === hero.id ? { ...u, pos: best, moved: true } : u,
      ),
    }
    occ.delete(axialKey(cur))
    occ.add(axialKey(best))
    cur = best
  }

  // Attempt attack
  const updatedHero = state.units.find((u) => u.id === hero.id)
  if (updatedHero && hexDistance(updatedHero.pos, target.pos) <= updatedHero.range) {
    const outcome = attackUnit(state, hero.id, target.id)
    state = outcome.state
  }

  return endTurn(state)
}

/* ---------------- Helpers for UI ---------------- */

/** Returns true if `attacker` could legally attack `victim` from `attacker.pos`. */
export function canAttackFrom(s: BattleState, attackerId: string, victimId: string): boolean {
  const a = s.units.find((u) => u.id === attackerId)
  const v = s.units.find((u) => u.id === victimId)
  if (!a || !v || a.dead || v.dead) return false
  if (a.acted) return false
  if (a.attackKind === 'heal') {
    if (a.faction !== v.faction || a.id === v.id) return false
  } else {
    if (a.faction === v.faction) return false
  }
  return hexDistance(a.pos, v.pos) <= a.range
}
