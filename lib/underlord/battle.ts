/**
 * Pure battle logic — independent of React. Used by the battle screen reducer.
 *
 * Action economy (XCOM-ish):
 *  - Each unit gets ONE move and ONE action per turn.
 *  - Move and action can be done in any order; doing both does NOT auto-end the turn.
 *  - Player presses END TURN explicitly (or chooses WAIT to skip both).
 *  - Round ends when every unit has been advanced once; flags reset.
 *
 * Attack kinds: basic / cleave / splash / pierce / execute / heal.
 *
 * Active specials (per archetype, see specials.ts):
 *  - brown  PROVOCAR : self-buff + taunt enemies in 2 hexes (consumes ACTION).
 *  - red    INFERNO  : place fire on a hex within 3 (consumes ACTION).
 *  - green  SOMBRA   : teleport up to 4 + next attack +60% (consumes MOVE).
 *  - blue   RENASCER : revive fallen ally in 2 hexes (consumes ACTION; once / battle).
 *  - grey   MURALHA  : create 8 HP barrier in 3 (consumes ACTION).
 */

import { axialEqual, axialKey, hexDistance, neighbors } from './hex'
import type { Axial, Unit } from './types'
import { SPECIALS } from './specials'
import { makeBarrier } from './units'

/** Fire effect on a tile. Damages anyone standing on it at start of turn. */
export type FireTile = {
  pos: Axial
  /** Rounds remaining. Decrements at end of each round. */
  ttl: number
  /** Flat damage per tick. */
  damage: number
  /** Caster id (for log clarity / future attribution). */
  source: string
}

export type BattleState = {
  cols: number
  rows: number
  units: Unit[]
  /** Active fire tiles. */
  fires: FireTile[]
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
    fires: [],
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
    .filter((u) => !u.dead && !u.isBarrier)
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
  damage: number
  crit: boolean
  killed: boolean
  splashHits: { unitId: string; damage: number; killed: boolean; pos: Axial }[]
  executed: boolean
  /** Bonus from cached nextAttackBonus (e.g. Sombra). 1.0 = none. */
  bonusUsed: number
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
    bonusUsed: 1,
    attackerName: attName,
    targetName: tgtName,
    attackKind: kind,
  }
}

/** Apply incoming-damage modifier from `damageTakenMod` if set. */
function applyDamageMod(target: Unit, raw: number): number {
  const mod = target.damageTakenMod ?? 1
  return Math.max(1, Math.round(raw * mod))
}

/** Attack target if in range. Marks attacker as acted.
 *
 * `bonusMult` already encodes the combo multiplier from the UI (1 + combo*0.15
 * + perk bonus). `critBonus` is added to the base 0.18 crit chance — the
 * Sangue Frio perk passes +0.05/+0.10/+0.15 here. Heroes never get this bonus. */
export function attackUnit(
  s: BattleState,
  attackerId: string,
  targetId: string,
  bonusMult: number = 1,
  critBonus: number = 0,
): AttackOutcome {
  const att = s.units.find((u) => u.id === attackerId)
  const tgt = s.units.find((u) => u.id === targetId)
  if (!att || !tgt || att.dead || tgt.dead) {
    return emptyOutcome(s, att?.name ?? '?', tgt?.name ?? '?', att?.attackKind ?? 'basic')
  }
  if (att.faction === tgt.faction && !tgt.isBarrier) {
    return emptyOutcome(s, att.name, tgt.name, att.attackKind)
  }
  if (att.acted) return emptyOutcome(s, att.name, tgt.name, att.attackKind)

  const dist = hexDistance(att.pos, tgt.pos)
  if (dist > att.range) return emptyOutcome(s, att.name, tgt.name, att.attackKind)

  // Per-attack consumed bonus (e.g. Sombra grants 1.6 once)
  const sombraBonus = att.nextAttackBonus ?? 1

  const critChance =
    att.faction === 'minion' ? CRIT_CHANCE + Math.max(0, critBonus) : CRIT_CHANCE
  const crit = Math.random() < critChance
  const variance = 1 + (Math.random() - 0.5) * 0.4
  const executed =
    att.attackKind === 'execute' && tgt.hp / tgt.hpMax < EXECUTE_THRESHOLD
  const kindMult = executed ? EXECUTE_MULT : 1
  const baseDmg =
    att.atk *
    variance *
    (crit ? CRIT_MULT : 1) *
    bonusMult *
    kindMult *
    sombraBonus
  const dmg = applyDamageMod(tgt, baseDmg)

  const newHp = Math.max(0, tgt.hp - dmg)
  const killed = newHp === 0

  const collateral: AttackOutcome['splashHits'] = []
  const splashDmg = Math.max(1, Math.round(dmg * SPLASH_RATIO))

  if (att.attackKind === 'splash') {
    for (const u of s.units) {
      if (u.dead || u.id === tgt.id) continue
      if (u.faction !== tgt.faction || u.isBarrier) continue
      if (hexDistance(u.pos, tgt.pos) <= 1) {
        const d = applyDamageMod(u, splashDmg)
        collateral.push({ unitId: u.id, damage: d, killed: false, pos: u.pos })
      }
    }
  } else if (att.attackKind === 'cleave') {
    for (const n of neighbors(tgt.pos)) {
      const adj = s.units.find(
        (u) =>
          !u.dead &&
          u.id !== tgt.id &&
          u.faction === tgt.faction &&
          !u.isBarrier &&
          axialEqual(u.pos, n),
      )
      if (adj) {
        const d = applyDamageMod(adj, splashDmg)
        collateral.push({ unitId: adj.id, damage: d, killed: false, pos: adj.pos })
        break
      }
    }
  } else if (att.attackKind === 'pierce') {
    const dq = tgt.pos.q - att.pos.q
    const dr = tgt.pos.r - att.pos.r
    const step = { q: Math.sign(dq), r: Math.sign(dr) }
    if (step.q !== 0 || step.r !== 0) {
      const beyond: Axial = { q: tgt.pos.q + step.q, r: tgt.pos.r + step.r }
      const beyondTarget = s.units.find(
        (u) => !u.dead && u.faction === tgt.faction && !u.isBarrier && axialEqual(u.pos, beyond),
      )
      if (beyondTarget) {
        const d = applyDamageMod(beyondTarget, splashDmg)
        collateral.push({
          unitId: beyondTarget.id,
          damage: d,
          killed: false,
          pos: beyondTarget.pos,
        })
      }
    }
  }

  let nextUnits = s.units.map((u) => {
    if (u.id === tgt.id) return { ...u, hp: newHp, dead: killed }
    if (u.id === att.id) {
      // Consume one-shot bonus
      const cleared: Unit = { ...u, acted: true }
      if (cleared.nextAttackBonus) cleared.nextAttackBonus = undefined
      return cleared
    }
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
            : sombraBonus > 1
              ? ' SOMBRA'
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
    bonusUsed: sombraBonus,
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

/** Heal an ally. `bonusMult` (default 1) is added on top of the 30% base heal
 * — the Milagre de Blue perk passes 1.166 / 1.333 / 1.5 here. */
export function healUnit(
  s: BattleState,
  healerId: string,
  allyId: string,
  bonusMult: number = 1,
): HealOutcome {
  const h = s.units.find((u) => u.id === healerId)
  const a = s.units.find((u) => u.id === allyId)
  if (!h || !a || h.dead || a.dead) {
    return { state: s, hit: false, amount: 0, healerName: h?.name ?? '?', targetName: a?.name ?? '?' }
  }
  if (h.attackKind !== 'heal') {
    return { state: s, hit: false, amount: 0, healerName: h.name, targetName: a.name }
  }
  if (h.faction !== a.faction || a.isBarrier) {
    return { state: s, hit: false, amount: 0, healerName: h.name, targetName: a.name }
  }
  if (h.id === a.id || h.acted) {
    return { state: s, hit: false, amount: 0, healerName: h.name, targetName: a.name }
  }
  if (hexDistance(h.pos, a.pos) > h.range) {
    return { state: s, hit: false, amount: 0, healerName: h.name, targetName: a.name }
  }
  const heal = Math.max(1, Math.round(a.hpMax * 0.3 * Math.max(1, bonusMult)))
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

/* ---------------- Active Specials ---------------- */

export type SpecialOutcome = {
  state: BattleState
  ok: boolean
  /** Human-readable reason for failure (or success log line). */
  reason: string
  /** For UI animations: where on screen the effect happened (axial pos). */
  fxAt?: Axial
  /** Rough effect kind so the UI can pick particles. */
  fxKind?: 'taunt' | 'fire' | 'shadow' | 'revive' | 'wall'
}

function fail(s: BattleState, reason: string): SpecialOutcome {
  return { state: s, ok: false, reason }
}

/** Common pre-checks for all specials. Returns the unit if usable. */
function preflight(s: BattleState, casterId: string): { unit: Unit | null; reason?: string } {
  const u = s.units.find((x) => x.id === casterId)
  if (!u || u.dead || u.isBarrier) return { unit: null, reason: 'unidade inválida' }
  if (u.faction !== 'minion') return { unit: null, reason: 'só minions usam habilidades' }
  if (u.specialCd > 0) return { unit: null, reason: `recarregando ${u.specialCd}r` }
  const def = SPECIALS[u.templateId]
  if (def.uses === 1 && u.specialSpent) return { unit: null, reason: 'já usou nesta batalha' }
  if (def.cost === 'action' && u.acted) return { unit: null, reason: 'já agiu' }
  if (def.cost === 'move' && u.moved) return { unit: null, reason: 'já se moveu' }
  return { unit: u }
}

/** BROWN — PROVOCAR. Self-buff + taunt aura. */
export function castTaunt(s: BattleState, casterId: string): SpecialOutcome {
  const { unit, reason } = preflight(s, casterId)
  if (!unit) return fail(s, reason ?? 'inválido')
  if (unit.templateId !== 'brown') return fail(s, 'errado')
  const def = SPECIALS.brown
  const tauntRange = 2
  const taunted = s.units
    .filter(
      (e) =>
        !e.dead &&
        !e.isBarrier &&
        e.faction === 'hero' &&
        hexDistance(e.pos, unit.pos) <= tauntRange,
    )
    .map((e) => e.id)

  const nextUnits = s.units.map((u) => {
    if (u.id === unit.id) {
      return {
        ...u,
        acted: true,
        specialCd: def.cooldown,
        damageTakenMod: 0.5,
      }
    }
    if (taunted.includes(u.id)) {
      return { ...u, tauntedBy: unit.id }
    }
    return u
  })
  const log = [
    ...s.log,
    `${unit.name} ruge — ${taunted.length} alvo(s) provocado(s).`,
  ].slice(-6)
  return {
    state: { ...s, units: nextUnits, log },
    ok: true,
    reason: 'Provocou.',
    fxAt: unit.pos,
    fxKind: 'taunt',
  }
}

/** RED — INFERNO. Place fire on free hex. */
export function castInferno(s: BattleState, casterId: string, target: Axial): SpecialOutcome {
  const { unit, reason } = preflight(s, casterId)
  if (!unit) return fail(s, reason ?? 'inválido')
  if (unit.templateId !== 'red') return fail(s, 'errado')
  const def = SPECIALS.red
  if (hexDistance(unit.pos, target) > def.range) return fail(s, 'fora de alcance')
  // Tile must be empty
  const occ = blockedSet(s)
  if (occ.has(axialKey(target))) return fail(s, 'hex ocupado')
  const dmg = Math.max(2, Math.round(unit.atk * 0.6))
  const newFire: FireTile = { pos: target, ttl: 2, damage: dmg, source: unit.id }
  const nextUnits = s.units.map((u) =>
    u.id === unit.id ? { ...u, acted: true, specialCd: def.cooldown } : u,
  )
  const log = [...s.log, `${unit.name} acende um inferno (${dmg}/turno).`].slice(-6)
  return {
    state: {
      ...s,
      units: nextUnits,
      // Replace any existing fire on the same hex
      fires: [...s.fires.filter((f) => !axialEqual(f.pos, target)), newFire],
      log,
    },
    ok: true,
    reason: 'Inferno aceso.',
    fxAt: target,
    fxKind: 'fire',
  }
}

/** GREEN — SOMBRA. Teleport up to 4 + next attack bonus. */
export function castShadow(s: BattleState, casterId: string, target: Axial): SpecialOutcome {
  const { unit, reason } = preflight(s, casterId)
  if (!unit) return fail(s, reason ?? 'inválido')
  if (unit.templateId !== 'green') return fail(s, 'errado')
  const def = SPECIALS.green
  if (hexDistance(unit.pos, target) > def.range) return fail(s, 'fora de alcance')
  const occ = blockedSet(s, unit.id)
  if (occ.has(axialKey(target))) return fail(s, 'hex ocupado')
  const nextUnits = s.units.map((u) =>
    u.id === unit.id
      ? {
          ...u,
          pos: target,
          moved: true,
          specialCd: def.cooldown,
          nextAttackBonus: 1.6,
        }
      : u,
  )
  const log = [...s.log, `${unit.name} mergulha na sombra. Próximo golpe ardente.`].slice(-6)
  return {
    state: { ...s, units: nextUnits, log },
    ok: true,
    reason: 'Sombra.',
    fxAt: target,
    fxKind: 'shadow',
  }
}

/** BLUE — RENASCER. Revive a fallen ally within 2 to 50% HP, once per battle. */
export function castResurrect(s: BattleState, casterId: string, allyId: string): SpecialOutcome {
  const { unit, reason } = preflight(s, casterId)
  if (!unit) return fail(s, reason ?? 'inválido')
  if (unit.templateId !== 'blue') return fail(s, 'errado')
  const def = SPECIALS.blue
  const ally = s.units.find((u) => u.id === allyId)
  if (!ally || !ally.dead || ally.isBarrier || ally.faction !== 'minion') {
    return fail(s, 'alvo inválido')
  }
  if (hexDistance(unit.pos, ally.pos) > def.range) return fail(s, 'fora de alcance')
  const occ = blockedSet(s)
  // If the dead ally's hex is occupied (someone walked over the corpse), find adjacent free
  let revivePos: Axial = ally.pos
  if (occ.has(axialKey(revivePos))) {
    const free = neighbors(unit.pos).find((n) => {
      if (occ.has(axialKey(n))) return false
      if (n.r < 0 || n.r >= s.rows) return false
      const offset = -Math.floor(n.r / 2)
      if (n.q < offset || n.q >= s.cols + offset) return false
      return true
    })
    if (!free) return fail(s, 'sem hex livre')
    revivePos = free
  }
  const reviveHp = Math.max(1, Math.round(ally.hpMax * 0.5))
  const nextUnits = s.units.map((u) => {
    if (u.id === ally.id) {
      return {
        ...u,
        dead: false,
        hp: reviveHp,
        pos: revivePos,
        acted: true,
        moved: true,
      }
    }
    if (u.id === unit.id) {
      return { ...u, acted: true, specialCd: def.cooldown, specialSpent: true }
    }
    return u
  })
  // Re-add the revived ally to initiative so they get future turns
  const nextOrder = sortInitiative(nextUnits)
  const log = [...s.log, `${unit.name} chama ${ally.name} de volta (+${reviveHp}).`].slice(-6)
  return {
    state: { ...s, units: nextUnits, order: nextOrder, log },
    ok: true,
    reason: 'Renasceu.',
    fxAt: revivePos,
    fxKind: 'revive',
  }
}

/** GREY — MURALHA. Spawn an 8 HP barrier on a free hex within 3. */
export function castBarrier(s: BattleState, casterId: string, target: Axial): SpecialOutcome {
  const { unit, reason } = preflight(s, casterId)
  if (!unit) return fail(s, reason ?? 'inválido')
  if (unit.templateId !== 'grey') return fail(s, 'errado')
  const def = SPECIALS.grey
  if (hexDistance(unit.pos, target) > def.range) return fail(s, 'fora de alcance')
  const occ = blockedSet(s)
  if (occ.has(axialKey(target))) return fail(s, 'hex ocupado')
  if (target.r < 0 || target.r >= s.rows) return fail(s, 'fora do mapa')
  const offset = -Math.floor(target.r / 2)
  if (target.q < offset || target.q >= s.cols + offset) return fail(s, 'fora do mapa')

  const wall = makeBarrier(target, `MURALHA·${unit.name}`)
  const nextUnits = [
    ...s.units.map((u) =>
      u.id === unit.id ? { ...u, acted: true, specialCd: def.cooldown } : u,
    ),
    wall,
  ]
  const log = [...s.log, `${unit.name} ergue uma muralha.`].slice(-6)
  return {
    state: { ...s, units: nextUnits, log },
    ok: true,
    reason: 'Muralha.',
    fxAt: target,
    fxKind: 'wall',
  }
}

/* ---------------- Turn / round bookkeeping ---------------- */

/**
 * Apply per-turn start-of-turn effects to the unit currently up:
 *  - Fire damage if standing on a fire tile
 * Returns updated state.
 */
function applyStartOfTurnEffects(s: BattleState): BattleState {
  const cur = activeUnit(s)
  if (!cur || cur.dead || cur.isBarrier) return s
  const fire = s.fires.find((f) => axialEqual(f.pos, cur.pos))
  if (!fire) return s
  const dmg = applyDamageMod(cur, fire.damage)
  const newHp = Math.max(0, cur.hp - dmg)
  const killed = newHp === 0
  const nextUnits = s.units.map((u) =>
    u.id === cur.id ? { ...u, hp: newHp, dead: killed } : u,
  )
  const log = [
    ...s.log,
    `${cur.name} queima no inferno: -${dmg}${killed ? ' (abatido)' : ''}.`,
  ].slice(-6)
  return { ...s, units: nextUnits, log }
}

/** End current unit's turn (skip to next). */
export function endTurn(s: BattleState): BattleState {
  const cur = activeUnit(s)
  let units = s.units
  if (cur) {
    units = units.map((u) =>
      u.id === cur.id ? { ...u, acted: true, moved: true } : u,
    )
  }

  let next = s.turn + 1
  let round = s.round
  let nextOrder = s.order
  let fires = s.fires
  for (let i = 0; i < (s.order.length + 1) * 2; i++) {
    if (next >= nextOrder.length) {
      // New round — reset flags, decrement cooldowns, decay fires, clear 1-round buffs
      units = units.map((u) => ({
        ...u,
        acted: false,
        moved: false,
        specialCd: Math.max(0, u.specialCd - 1),
        damageTakenMod: undefined,
        tauntedBy: undefined,
      }))
      fires = fires
        .map((f) => ({ ...f, ttl: f.ttl - 1 }))
        .filter((f) => f.ttl > 0)
      nextOrder = sortInitiative(units)
      next = 0
      round += 1
    }
    const cand = units.find((u) => u.id === nextOrder[next])
    if (cand && !cand.dead && !cand.isBarrier) break
    next += 1
  }

  let nextState: BattleState = {
    ...s,
    units,
    fires,
    order: nextOrder,
    turn: next,
    round,
    selectedId: null,
  }
  // Apply start-of-turn effects to the newly active unit
  nextState = applyStartOfTurnEffects(nextState)

  const done = computeDone(nextState.units)
  return { ...nextState, done }
}

function computeDone(units: Unit[]): BattleState['done'] {
  const minionsAlive = units.some(
    (u) => u.faction === 'minion' && !u.dead && !u.isBarrier,
  )
  const heroesAlive = units.some((u) => u.faction === 'hero' && !u.dead)
  if (!minionsAlive) return 'defeat'
  if (!heroesAlive) return 'victory'
  return null
}

/* ---------------- AI ---------------- */

/**
 * Hero AI — taunt-aware scoring picker plus pathing.
 *
 *  - If hero is `tauntedBy` X and X is alive, X scores +500 (forced lock).
 *  - +200 reachable+attackable
 *  - +(80 - hp), +(atk*4), +30 if brown taunt-aura, -dist*3
 *  - Avoids walking onto fire tiles unless target is on/past them.
 *  - Will attack barriers if blocking the only path AND no minion in range.
 */
export function aiTakeTurn(s: BattleState, heroId: string, smart: boolean = true): BattleState {
  const hero = s.units.find((u) => u.id === heroId)
  if (!hero || hero.dead) return endTurn(s)

  const allTargets = s.units.filter((u) => u.faction === 'minion' && !u.dead)
  const realMinions = allTargets.filter((u) => !u.isBarrier)
  if (allTargets.length === 0) return endTurn(s)

  const tauntId = hero.tauntedBy
  const tauntTarget =
    tauntId ? s.units.find((u) => u.id === tauntId && !u.dead) : null

  // Score targets — taunt overrides everything
  const targets = realMinions.length ? realMinions : allTargets
  const scored = targets.map((t) => {
    const dist = hexDistance(hero.pos, t.pos)
    const reachableNow = dist <= hero.range
    const stepsNeeded = Math.max(0, dist - hero.range)
    const reachable = stepsNeeded <= hero.move
    let score = 0
    if (tauntTarget && t.id === tauntTarget.id) score += 500
    if (reachableNow) score += 200
    else if (reachable) score += 100
    score += Math.max(0, 80 - t.hp)
    score += t.atk * 4
    if (t.templateId === 'brown') score += 30
    score -= dist * 3
    return { unit: t, score, dist, reachableNow, reachable, stepsNeeded }
  })
  scored.sort((a, b) => b.score - a.score)

  const target = smart
    ? scored[0].unit
    : targets.slice().sort((a, b) => hexDistance(hero.pos, a.pos) - hexDistance(hero.pos, b.pos))[0]

  // Step toward target greedily up to `move` hexes, prefer non-fire tiles
  let cur = hero.pos
  const occ = blockedSet(s, hero.id)
  const fireKeys = new Set(s.fires.map((f) => axialKey(f.pos)))
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
      .sort((a, b) => {
        const aDist = hexDistance(a, target.pos)
        const bDist = hexDistance(b, target.pos)
        if (aDist !== bDist) return aDist - bDist
        // Prefer non-fire tile when distance is equal
        const aFire = fireKeys.has(axialKey(a)) ? 1 : 0
        const bFire = fireKeys.has(axialKey(b)) ? 1 : 0
        return aFire - bFire
      })
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

  const updated = state.units.find((u) => u.id === hero.id)
  if (updated && hexDistance(updated.pos, target.pos) <= updated.range) {
    const out = attackUnit(state, hero.id, target.id)
    state = out.state
  } else {
    // No reach — try to chip a barrier in range to clear path
    const barrier = state.units.find(
      (u) =>
        u.isBarrier &&
        !u.dead &&
        updated &&
        hexDistance(updated.pos, u.pos) <= updated.range,
    )
    if (barrier) {
      const out = attackUnit(state, hero.id, barrier.id)
      state = out.state
    }
  }

  return endTurn(state)
}

/* ---------------- Helpers for UI ---------------- */

export function canAttackFrom(s: BattleState, attackerId: string, victimId: string): boolean {
  const a = s.units.find((u) => u.id === attackerId)
  const v = s.units.find((u) => u.id === victimId)
  if (!a || !v || a.dead || v.dead) return false
  if (a.acted) return false
  if (a.attackKind === 'heal') {
    if (a.faction !== v.faction || a.id === v.id) return false
  } else {
    if (a.faction === v.faction && !v.isBarrier) return false
  }
  return hexDistance(a.pos, v.pos) <= a.range
}
