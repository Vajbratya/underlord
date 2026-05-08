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
import type { Axial, BattleObjective, Unit } from './types'
import { SPECIALS } from './specials'
import { OVERLORD_SKILLS } from './overlord-skills'
import { makeBarrier, makeHeroMinion } from './units'
import {
  onDealDamage,
  onPostDamage,
  onTakeDamage,
  outgoingMult,
  rearmPhasePassives,
} from './elite-passives'

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

export type Obstacle = {
  pos: Axial
  /** Visual / tooltip kind — drives the glyph in the renderer. The
   * authoritative union lives in `./maps` so any new terrain authored
   * for the v7 biomes (bones/idol/wreck/ice/dune/coral) widens this
   * automatically without editing the engine. */
  kind: import('./maps').TerrainKind
}

/** Boon-derived effects the engine consults during a battle. The UI
 * builds this from the player's owned boons before calling initBattle.
 * Defaults are no-ops (1.0 multipliers / 0 bonuses). */
export type BattleBoonEffects = {
  /** Multiplier on incoming damage applied to minions only. <1 = tankier. */
  minionDmgTakenMult: number
  /** % of round-start hpMax restored to living minions. 0 = off. */
  hpRegenStartOfRound: number
}

export type BattleState = {
  cols: number
  rows: number
  units: Unit[]
  /** Active fire tiles. */
  fires: FireTile[]
  /** Impassable terrain hexes. They block movement and special targeting,
   * but ranged attacks pass over them (no LoS modeling — keeps tactics
   * readable). Empty for the default open biome. */
  obstacles: Obstacle[]
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
  /** Boon-derived passive effects. Engine reads these to apply lifestyle
   * modifiers (damage taken, regen). Always present; defaults are no-ops
   * so legacy callers don't have to think about it. */
  boonEffects: BattleBoonEffects
  /** v9 — Battle objective. Default `{kind:'rout'}`. Drives `computeDone`.
   * Always present so the engine never has to null-check; legacy regions
   * without `Region.objective` get the default at `initBattle` time. */
  objective: BattleObjective
}

export function initBattle(
  units: Unit[],
  cols: number,
  rows: number,
  obstacles: Obstacle[] = [],
  prelitFires: FireTile[] = [],
  boonEffects: BattleBoonEffects = {
    minionDmgTakenMult: 1,
    hpRegenStartOfRound: 0,
  },
  // v9 — optional objective. Default: classic rout. The engine threads
  // it through to `computeDone()` so legacy callers don't need to know.
  objective: BattleObjective = { kind: 'rout' },
): BattleState {
  const order = sortInitiative(units)
  return {
    cols,
    rows,
    units,
    fires: prelitFires,
    obstacles,
    order,
    turn: 0,
    round: 1,
    selectedId: null,
    log: ['As paredes da torre suspiram. O combate começou.'],
    done: null,
    boonEffects,
    objective,
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
  // Static terrain — always blocks (non-flying perspective).
  for (const o of s.obstacles ?? []) {
    out.add(axialKey(o.pos))
  }
  return out
}

/** Like {@link blockedSet} but skips obstacles for flying units. Other
 * units' positions still block (you can't share a hex with anyone). */
export function blockedSetFor(
  s: BattleState,
  unit: Unit,
): Set<string> {
  const out = new Set<string>()
  for (const u of s.units) {
    if (u.dead) continue
    if (u.id === unit.id) continue
    out.add(axialKey(u.pos))
  }
  if (!unit.flying) {
    for (const o of s.obstacles ?? []) {
      out.add(axialKey(o.pos))
    }
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
  // Flying units phase over impassable terrain — only other units block them.
  const occupied = blockedSetFor(s, u)
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

/** Apply incoming-damage modifier from `damageTakenMod` (curse, doom, aegis)
 * AND the persistent minion damage-taken multiplier from active boons.
 * Boon effect only applies to minions — heroes never benefit. */
function applyDamageMod(s: BattleState, target: Unit, raw: number): number {
  let mod = target.damageTakenMod ?? 1
  if (
    target.faction === 'minion' &&
    !target.isBarrier &&
    !target.isOverlord
  ) {
    mod *= s.boonEffects?.minionDmgTakenMult ?? 1
  }
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
  // Elite outgoing-damage multiplier (aura-rage from adjacent boss /
  // self-applied enrage stack). Multiplies the attacker's punch BEFORE
  // we run the target's damage-taken modifiers, so passives compound
  // in the natural order: source buff → target resist.
  const eliteOutMult = outgoingMult(att, s.units)
  const baseDmg =
    att.atk *
    variance *
    (crit ? CRIT_MULT : 1) *
    bonusMult *
    kindMult *
    sombraBonus *
    eliteOutMult
  const rawDmg = applyDamageMod(s, tgt, baseDmg)

  // Elite incoming hooks (PHASE absorbs to 1, THORNS schedules a reflect).
  const incoming = onTakeDamage(tgt, att, rawDmg)
  const dmg = incoming.damage

  const newHp = Math.max(0, tgt.hp - dmg)
  const killed = newHp === 0

  const collateral: AttackOutcome['splashHits'] = []
  const splashDmg = Math.max(1, Math.round(dmg * SPLASH_RATIO))

  if (att.attackKind === 'splash') {
    for (const u of s.units) {
      if (u.dead || u.id === tgt.id) continue
      if (u.faction !== tgt.faction || u.isBarrier) continue
      if (hexDistance(u.pos, tgt.pos) <= 1) {
        const d = applyDamageMod(s, u, splashDmg)
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
        const d = applyDamageMod(s, adj, splashDmg)
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
        const d = applyDamageMod(s, beyondTarget, splashDmg)
        collateral.push({
          unitId: beyondTarget.id,
          damage: d,
          killed: false,
          pos: beyondTarget.pos,
        })
      }
    }
  } else if (att.attackKind === 'volley') {
    // Lich tempest — every enemy within 2 hexes of the target eats 50%.
    for (const u of s.units) {
      if (u.dead || u.id === tgt.id) continue
      if (u.faction !== tgt.faction || u.isBarrier) continue
      if (hexDistance(u.pos, tgt.pos) <= 2) {
        const d = applyDamageMod(s, u, splashDmg)
        collateral.push({ unitId: u.id, damage: d, killed: false, pos: u.pos })
      }
    }
  }
  // Curse + siphon don't generate collateral; their effects ride on the
  // primary hit and the post-attack mutation pass below.

  // Curse: target takes +50% damage for the next round (cleared at round end).
  const curseMod =
    att.attackKind === 'curse' && !killed ? 1.5 : null
  // Siphon: attacker heals 30% of damage actually dealt to the target.
  const siphonHeal =
    att.attackKind === 'siphon' ? Math.max(1, Math.round(dmg * 0.3)) : 0

  let nextUnits = s.units.map((u) => {
    if (u.id === tgt.id) {
      const after: Unit = { ...u, hp: newHp, dead: killed }
      if (curseMod !== null) after.damageTakenMod = curseMod
      return after
    }
    if (u.id === att.id) {
      // Consume one-shot bonus + apply siphon self-heal.
      const cleared: Unit = { ...u, acted: true }
      if (cleared.nextAttackBonus) cleared.nextAttackBonus = undefined
      if (siphonHeal > 0) {
        cleared.hp = Math.min(cleared.hpMax, cleared.hp + siphonHeal)
      }
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

  /* ----------------------- ELITE PASSIVES ----------------------- */
  // Build the post-damage patches AFTER target HP has settled. Order:
  //   1. THORNS reflect → attacker takes a chunk back.
  //   2. LIFESTEAL → attacker self-heals on a successful hit.
  //   3. POST hooks on the TARGET (revive/enrage/summon).
  //   4. POST hooks on COLLATERAL (each splash hex can also trigger).
  // Anything that mutates the unit list returns a new array; we keep
  // collapsing into `nextUnits` so each pass sees the latest state.
  const passiveLogs: string[] = []

  // 1. Thorns reflect from the primary target.
  if (incoming.reflect > 0) {
    const reflectDmg = incoming.reflect
    nextUnits = nextUnits.map((u) => {
      if (u.id !== att.id) return u
      const newAttHp = Math.max(0, u.hp - reflectDmg)
      return { ...u, hp: newAttHp, dead: newAttHp === 0 }
    })
    if (incoming.log) passiveLogs.push(incoming.log)
  }

  // 2. Lifesteal / time-stop on the ATTACKER.
  const dealPatch = onDealDamage(att, dmg, killed)
  if (dealPatch.selfHeal > 0) {
    nextUnits = nextUnits.map((u) =>
      u.id === att.id
        ? {
            ...u,
            hp: Math.min(u.hpMax, u.hp + dealPatch.selfHeal),
          }
        : u,
    )
    if (dealPatch.log) passiveLogs.push(dealPatch.log)
  }
  if (dealPatch.bonusAction) {
    // Time-stop: clear the attacker's `acted` flag so it can fire again
    // this same turn. We deliberately don't refund `moved` — only the
    // attack action repeats.
    nextUnits = nextUnits.map((u) =>
      u.id === att.id ? { ...u, acted: false } : u,
    )
    if (dealPatch.log) passiveLogs.push(dealPatch.log)
  }

  // 3. Post-damage on the target — revive/enrage/summon.
  const tgtPost = onPostDamage(
    nextUnits.find((u) => u.id === tgt.id) ?? tgt,
    nextUnits,
  )
  if (tgtPost.units) nextUnits = tgtPost.units
  if (tgtPost.log) passiveLogs.push(tgtPost.log)

  // 3b. Materialize summons spawned by `onPostDamage`. We use
  // `makeHeroMinion` so the spawn shows up correctly in the hero faction
  // with the right archetype stats, then drop it on the closest empty
  // neighbor of the elite. If no free hex, we silently skip (boss
  // surrounded == no reinforcements, by design).
  if (tgtPost.summons && tgtPost.summons.length > 0) {
    const occupied = new Set(
      nextUnits.filter((u) => !u.dead).map((u) => axialKey(u.pos)),
    )
    const elite = nextUnits.find((u) => u.id === tgt.id)
    if (elite) {
      for (const sum of tgtPost.summons) {
        const slot = neighbors(sum.near).find((p) => !occupied.has(axialKey(p)))
        if (!slot) continue
        occupied.add(axialKey(slot))
        const stage = Math.max(1, Math.round(elite.hpMax / 130))
        nextUnits = [
          ...nextUnits,
          makeHeroMinion(sum.archetype, slot, stage, elite.name),
        ]
      }
    }
  }

  // 4. Post-damage on COLLATERAL — every splash victim's elite passive
  // can fire too (a splash that brings two minibosses to 49% will
  // double-summon, by design).
  for (const c of collateral) {
    const colUnit = nextUnits.find((u) => u.id === c.unitId)
    if (!colUnit?.eliteKind) continue
    const colPost = onPostDamage(colUnit, nextUnits)
    if (colPost.units) nextUnits = colPost.units
    if (colPost.log) passiveLogs.push(colPost.log)
  }

  const collateralKilled = collateral.filter((c) => c.killed).length
  const tag =
    att.attackKind === 'splash'
      ? ' AOE'
      : att.attackKind === 'cleave'
        ? ' CLIVA'
        : att.attackKind === 'pierce'
          ? ' PERFURA'
          : att.attackKind === 'volley'
            ? ' TEMPESTADE'
            : att.attackKind === 'curse'
              ? ' MALDIÇÃO'
              : att.attackKind === 'siphon'
                ? ` SIFÃO +${siphonHeal}`
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
    // Append every elite passive that fired this exchange (THORNS,
    // ENRAGE, REVIVE, etc) so the player can read the chain.
    ...passiveLogs,
  ].slice(-8)

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
  if (!def) return { unit: null, reason: 'sem habilidade especial' }
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
  const def = SPECIALS.brown!
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
  const def = SPECIALS.red!
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
  const def = SPECIALS.green!
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
  const def = SPECIALS.blue!
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
  const def = SPECIALS.grey!
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

/* ---------------- Overlord active skills ---------------- */

/**
 * Apply an Overlord active skill. Drives the in-battle skill bar.
 *
 * Mirrors the SpecialOutcome shape so the UI can keep using the same
 * animation hooks. Targeting is interpreted by skill kind:
 *  - 'self' / 'shield-self' / 'rally-allies' — `target` ignored.
 *  - 'enemy' / 'doom-enemy' / 'smite-enemy' — `target` is enemy unit pos.
 *  - 'free-hex' — empty in-bounds hex within range (AOE / teleport).
 *  - 'fallen-ally' — dead minion id (passed in `targetUnitId`).
 *
 * Resource cost: every skill consumes the Overlord's ACTION (acted=true).
 * Success bumps the per-skill cooldown to skill.cooldown rounds; one-shot
 * skills additionally flag skillSpent[id]=true.
 */
export function castOverlordSkill(
  s: BattleState,
  casterId: string,
  skillId: string,
  target: Axial | null,
  targetUnitId: string | null,
): SpecialOutcome {
  const u = s.units.find((x) => x.id === casterId)
  if (!u || u.dead) return fail(s, 'unidade inválida')
  if (!u.isOverlord) return fail(s, 'só o Underlord')
  const skill = OVERLORD_SKILLS[skillId]
  if (!skill) return fail(s, 'habilidade desconhecida')
  if (u.acted) return fail(s, 'já agiu')
  if ((u.skillCooldowns?.[skillId] ?? 0) > 0) {
    return fail(s, `recarregando ${u.skillCooldowns![skillId]}r`)
  }
  if (skill.uses === 1 && u.skillSpent?.[skillId]) {
    return fail(s, 'já usou nesta batalha')
  }

  // Helper: stamp caster acted + skill cooldown / spent flag.
  function consume(unit: Unit): Unit {
    return {
      ...unit,
      acted: true,
      skillCooldowns: {
        ...(unit.skillCooldowns ?? {}),
        [skillId]: skill.cooldown,
      },
      skillSpent:
        skill.uses === 1
          ? { ...(unit.skillSpent ?? {}), [skillId]: true }
          : unit.skillSpent,
    }
  }

  switch (skill.kind) {
    case 'shield-self': {
      const next = s.units.map((x) =>
        x.id === u.id ? { ...consume(x), damageTakenMod: 0.5 } : x,
      )
      const log = [...s.log, `${u.name} ergue a ÉGIDE.`].slice(-6)
      return { state: { ...s, units: next, log }, ok: true, reason: 'Égide.', fxAt: u.pos, fxKind: 'taunt' }
    }

    case 'rally-allies': {
      const next = s.units.map((x) => {
        if (x.id === u.id) return consume(x)
        if (
          x.faction === 'minion' &&
          !x.dead &&
          !x.isBarrier &&
          !x.isOverlord &&
          hexDistance(x.pos, u.pos) <= skill.aoeRadius
        ) {
          return { ...x, nextAttackBonus: 1.6 }
        }
        return x
      })
      const log = [...s.log, `${u.name} ruge: VOZ DE COMANDO.`].slice(-6)
      return { state: { ...s, units: next, log }, ok: true, reason: 'Rally.', fxAt: u.pos, fxKind: 'taunt' }
    }

    case 'teleport-self': {
      if (!target) return fail(s, 'sem alvo')
      if (hexDistance(u.pos, target) > skill.range) return fail(s, 'fora de alcance')
      if (!inBoardBounds(s, target)) return fail(s, 'fora do mapa')
      const occ = blockedSet(s)
      if (occ.has(axialKey(target))) return fail(s, 'hex ocupado')
      const next = s.units.map((x) =>
        x.id === u.id ? { ...consume(x), pos: target } : x,
      )
      const log = [...s.log, `${u.name} abre um PORTAL.`].slice(-6)
      return { state: { ...s, units: next, log }, ok: true, reason: 'Portal.', fxAt: target, fxKind: 'shadow' }
    }

    case 'heal-ally': {
      if (!targetUnitId) return fail(s, 'sem alvo')
      const ally = s.units.find((x) => x.id === targetUnitId)
      if (!ally || ally.dead || ally.isBarrier) return fail(s, 'alvo inválido')
      if (ally.faction !== 'minion' || ally.id === u.id) {
        return fail(s, 'alvo precisa ser aliado')
      }
      if (hexDistance(u.pos, ally.pos) > skill.range) return fail(s, 'fora de alcance')
      const heal = Math.round(ally.hpMax * 0.6)
      const newHp = Math.min(ally.hpMax, ally.hp + heal)
      const next = s.units.map((x) => {
        if (x.id === u.id) return consume(x)
        if (x.id === ally.id) return { ...x, hp: newHp }
        return x
      })
      const log = [
        ...s.log,
        `${u.name} cura ${ally.name}: +${newHp - ally.hp} HP.`,
      ].slice(-6)
      return { state: { ...s, units: next, log }, ok: true, reason: 'Cura.', fxAt: ally.pos, fxKind: 'revive' }
    }

    case 'revive-ally': {
      if (!targetUnitId) return fail(s, 'sem alvo')
      const dead = s.units.find((x) => x.id === targetUnitId)
      if (!dead || !dead.dead || dead.isBarrier) return fail(s, 'alvo inválido')
      if (dead.faction !== 'minion') return fail(s, 'só aliados')
      if (hexDistance(u.pos, dead.pos) > skill.range) return fail(s, 'fora de alcance')
      // Find a free adjacent tile to spawn (or its original tile if free).
      const occ = blockedSet(s)
      const candidates = [dead.pos, ...neighbors(dead.pos)]
      const spawn = candidates.find(
        (p) => !occ.has(axialKey(p)) && inBoardBounds(s, p),
      )
      if (!spawn) return fail(s, 'sem espaço para erguer')
      const restoredHp = Math.round(dead.hpMax * 0.75)
      const next = s.units.map((x) => {
        if (x.id === u.id) return consume(x)
        if (x.id === dead.id) {
          return {
            ...x,
            dead: false,
            hp: restoredHp,
            pos: spawn,
            acted: true,
            moved: true,
          }
        }
        return x
      })
      const log = [...s.log, `${u.name} ERGUE ${dead.name} dos mortos.`].slice(-6)
      return {
        state: { ...s, units: next, log, order: sortInitiative(next) },
        ok: true,
        reason: 'Erguer.',
        fxAt: spawn,
        fxKind: 'revive',
      }
    }

    case 'doom-enemy': {
      if (!targetUnitId) return fail(s, 'sem alvo')
      const enemy = s.units.find((x) => x.id === targetUnitId)
      if (!enemy || enemy.dead || enemy.faction !== 'hero') return fail(s, 'alvo inválido')
      if (hexDistance(u.pos, enemy.pos) > skill.range) return fail(s, 'fora de alcance')
      const next = s.units.map((x) => {
        if (x.id === u.id) return consume(x)
        if (x.id === enemy.id) return { ...x, damageTakenMod: 2 }
        return x
      })
      const log = [...s.log, `${u.name} CONDENA ${enemy.name}.`].slice(-6)
      return { state: { ...s, units: next, log }, ok: true, reason: 'Condenar.', fxAt: enemy.pos, fxKind: 'shadow' }
    }

    case 'smite-enemy': {
      if (!targetUnitId) return fail(s, 'sem alvo')
      const enemy = s.units.find((x) => x.id === targetUnitId)
      if (!enemy || enemy.dead || enemy.faction !== 'hero') return fail(s, 'alvo inválido')
      if (hexDistance(u.pos, enemy.pos) > skill.range) return fail(s, 'fora de alcance')
      const raw = Math.round(u.atk * skill.atkMult)
      const dmg = applyDamageMod(s, enemy, raw)
      const newHp = Math.max(0, enemy.hp - dmg)
      const killed = newHp === 0
      const next = s.units.map((x) => {
        if (x.id === u.id) return consume(x)
        if (x.id === enemy.id) return { ...x, hp: newHp, dead: killed }
        return x
      })
      const log = [
        ...s.log,
        `${u.name} dispara ${skill.name}: ${enemy.name} -${dmg}${killed ? ' (abatido)' : ''}.`,
      ].slice(-6)
      return { state: { ...s, units: next, log }, ok: true, reason: skill.short, fxAt: enemy.pos, fxKind: 'fire' }
    }

    case 'aoe-damage': {
      if (!target) return fail(s, 'sem alvo')
      if (hexDistance(u.pos, target) > skill.range) return fail(s, 'fora de alcance')
      if (!inBoardBounds(s, target)) return fail(s, 'fora do mapa')
      const baseRaw = Math.round(u.atk * skill.atkMult)
      const splashRaw = Math.round(baseRaw * 0.5)
      const next = s.units.map((x) => {
        if (x.id === u.id) return consume(x)
        if (x.dead || x.faction !== 'hero') return x
        const d = hexDistance(x.pos, target)
        if (d === 0) {
          const dmg = applyDamageMod(s, x, baseRaw)
          const newHp = Math.max(0, x.hp - dmg)
          return { ...x, hp: newHp, dead: newHp === 0 }
        }
        if (d <= skill.aoeRadius) {
          const dmg = applyDamageMod(s, x, splashRaw)
          const newHp = Math.max(0, x.hp - dmg)
          return { ...x, hp: newHp, dead: newHp === 0 }
        }
        return x
      })
      const log = [...s.log, `${u.name} invoca ${skill.name}!`].slice(-6)
      return { state: { ...s, units: next, log }, ok: true, reason: skill.short, fxAt: target, fxKind: 'fire' }
    }
  }
}

/** True when the (q,r) hex is inside the board (handles offset rows). */
function inBoardBounds(s: BattleState, p: Axial): boolean {
  if (p.r < 0 || p.r >= s.rows) return false
  const offset = -Math.floor(p.r / 2)
  return p.q >= offset && p.q < s.cols + offset
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
  const dmg = applyDamageMod(s, cur, fire.damage)
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
      const regenPct = s.boonEffects?.hpRegenStartOfRound ?? 0
      units = units.map((u) => {
        // Decrement Overlord skill cooldowns by 1 each round.
        let skillCooldowns = u.skillCooldowns
        if (skillCooldowns) {
          const next: Record<string, number> = {}
          for (const [k, v] of Object.entries(skillCooldowns)) {
            next[k] = Math.max(0, v - 1)
          }
          skillCooldowns = next
        }
        // Boon: Sopro Vital — every minion regens % of hpMax at round start.
        // Skip dead, barriers, heroes. Caps at hpMax.
        let hp = u.hp
        if (
          regenPct > 0 &&
          !u.dead &&
          !u.isBarrier &&
          u.faction === 'minion'
        ) {
          const heal = Math.max(1, Math.round(u.hpMax * regenPct))
          hp = Math.min(u.hpMax, u.hp + heal)
        }
        return {
          ...u,
          hp,
          acted: false,
          moved: false,
          specialCd: Math.max(0, u.specialCd - 1),
          damageTakenMod: undefined,
          tauntedBy: undefined,
          skillCooldowns,
        }
      })
      fires = fires
        .map((f) => ({ ...f, ttl: f.ttl - 1 }))
        .filter((f) => f.ttl > 0)
      // Re-arm PHASE passives so the first hit of the new round is again
      // absorbed. Other one-shot passives (revive, summon, enrage)
      // intentionally stay fired for the rest of the battle.
      units = rearmPhasePassives(units)
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

  const done = computeDone(nextState)
  return { ...nextState, done }
}

/**
 * Decide whether the battle is over and, if so, who won.
 *
 * v9 — now objective-aware. The shared "fail-state" floor is the same
 * for every objective: if the Overlord dies the run is over, and if
 * every minion is dead the field is lost. Each objective layers its
 * own win condition on top.
 *
 * Authored to be safe against partial unit lists / barriers / dead
 * units — this is called every state transition.
 */
function computeDone(state: BattleState): BattleState['done'] {
  const units = state.units

  // Floor 1 — Overlord IS the run.
  const overlord = units.find((u) => u.isOverlord)
  if (overlord && overlord.dead) return 'defeat'

  // Floor 2 — out of attackers. Barriers don't count: if every real
  // minion fell, the army is broken.
  const minionsAlive = units.some(
    (u) => u.faction === 'minion' && !u.dead && !u.isBarrier,
  )
  if (!minionsAlive) return 'defeat'

  const obj = state.objective
  const heroesAlive = units.some((u) => u.faction === 'hero' && !u.dead)

  switch (obj.kind) {
    case 'rout': {
      // Classic — kill them all.
      return heroesAlive ? null : 'victory'
    }
    case 'survive': {
      // Hold the line. `state.round` is 1-indexed; victory triggers the
      // moment the round counter passes the requested length. This is
      // checked BEFORE incrementing in `endTurn`, so the player gets a
      // clean win round-N+1 frame.
      if (state.round > obj.rounds) return 'victory'
      return null
    }
    case 'assassinate': {
      // Surgical strike — only the marked target matters.
      const target = units.find(
        (u) => u.faction === 'hero' && u.heroId === obj.targetHeroId,
      )
      if (!target) return null // target hasn't spawned yet
      if (target.dead) return 'victory'
      // Floor still applies: if all heroes are dead but somehow target
      // is missing (edge case), treat the rout as a partial win.
      if (!heroesAlive) return 'victory'
      return null
    }
    case 'protect': {
      // Escort — if the protected unit dies, instant defeat. Otherwise
      // win on rout.
      const ward = units.find(
        (u) => u.heroId === obj.protectId || u.id === obj.protectId,
      )
      if (ward && ward.dead) return 'defeat'
      return heroesAlive ? null : 'victory'
    }
    default: {
      // Exhaustive fallthrough — if a new objective lands without a
      // case here, fall back to rout so battles still end.
      return heroesAlive ? null : 'victory'
    }
  }
}

/* ---------------- Tactical AI ---------------- */
/**
 * Hero AI — full plan evaluation (XCOM-flavor).
 *
 * For every reachable destination tile (BFS up to `move`) AND for every
 * attackable enemy from that tile (or "no attack"), we score the resulting
 * (move, attack) PLAN as a single number. The best plan wins.
 *
 * Score components:
 *   + 300 if the attack KILLS the target this turn (overkill avoided)
 *   + expectedDamage * 4
 *   + role bonus (sniper kills ranged; striker hunts healers; tank engages tank)
 *   + 800 if it's the unit that taunted us (forced lock, but only if reachable)
 *   + 120 if target is a Blue healer (focus fire on support)
 *   + 60 if target is a Red splash caster (deny AOE)
 *   + 40 if target is already wounded (focus fire)
 *   - threatAt(destination) * roleWeight (squishy heroes care more)
 *   - 80 if standing on fire
 *   - 60 per adjacent ally if a Red is in splash range (avoid clusters)
 *   - 25 per hex of distance to closest enemy (when no attack possible)
 *
 * The result: heroes will reposition behind cover, kite, focus-fire, and
 * intentionally avoid AOE traps — instead of just walking forward.
 */

export type AIRole = 'tank' | 'striker' | 'sniper' | 'soldier'

export function aiRole(u: Unit): AIRole {
  if (u.range >= 3) return 'sniper'
  if (u.move >= 4 && u.atk >= 9 && u.hpMax <= 22) return 'striker'
  if (u.hpMax >= 26) return 'tank'
  return 'soldier'
}

/** Tiles a unit can step onto in `move` steps (BFS, blocked by other units). */
function reachableHexes(s: BattleState, unit: Unit): Axial[] {
  const out: Axial[] = []
  const seen = new Set<string>()
  seen.add(axialKey(unit.pos))
  // Flying enemies (harpy/wraith/bone entourage) ignore obstacles too.
  const occupied = blockedSetFor(s, unit)
  const offsetFor = (r: number) => -Math.floor(r / 2)
  const inBounds = (a: Axial) => {
    if (a.r < 0 || a.r >= s.rows) return false
    const off = offsetFor(a.r)
    return a.q >= off && a.q < s.cols + off
  }
  type Node = { pos: Axial; depth: number }
  const queue: Node[] = [{ pos: unit.pos, depth: 0 }]
  while (queue.length) {
    const { pos, depth } = queue.shift()!
    if (depth >= unit.move) continue
    for (const n of neighbors(pos)) {
      const k = axialKey(n)
      if (seen.has(k)) continue
      if (!inBounds(n)) continue
      if (occupied.has(k)) continue
      seen.add(k)
      out.push(n)
      queue.push({ pos: n, depth: depth + 1 })
    }
  }
  return out
}

/** Approximate damage taken if a hero stands at `pos`, from any minion that
 * can reach + attack it (range OR range+move with discount). */
function threatAt(s: BattleState, pos: Axial): number {
  let total = 0
  for (const m of s.units) {
    if (m.dead || m.faction !== 'minion' || m.isBarrier) continue
    const dist = hexDistance(m.pos, pos)
    if (dist <= m.range) {
      total += m.atk
    } else if (dist <= m.range + m.move) {
      // Approximate: minion would need to spend its move to reach
      total += m.atk * 0.45
    }
  }
  return total
}

/** Estimated damage a hero would deal to a target this turn (no variance). */
function estimateDamage(att: Unit, tgt: Unit): number {
  const base = att.atk * (1 + 0.18 * 0.7) // expected crit value
  const mod = tgt.damageTakenMod ?? 1
  return Math.max(1, Math.round(base * mod))
}

export function aiTakeTurn(s: BattleState, heroId: string, smart: boolean = true): BattleState {
  const hero = s.units.find((u) => u.id === heroId)
  if (!hero || hero.dead) return endTurn(s)

  // ENEMY HEALER BRANCH — if this unit's attack is `heal`, prefer mending the
  // most wounded ally in range over wandering forward. Heroes' Blue clerics
  // become genuinely annoying instead of just chip-damage units.
  if (hero.attackKind === 'heal' && !hero.acted) {
    const wounded = s.units
      .filter(
        (u) =>
          u.faction === hero.faction &&
          !u.dead &&
          !u.isBarrier &&
          u.id !== hero.id &&
          u.hp < u.hpMax &&
          hexDistance(u.pos, hero.pos) <= hero.range,
      )
      .sort((a, b) => a.hp / a.hpMax - b.hp / b.hpMax)
    if (wounded.length) {
      const out = healUnit(s, hero.id, wounded[0].id)
      return endTurn(out.state)
    }
  }

  const allMinions = s.units.filter(
    (u) => u.faction === 'minion' && !u.dead && !u.isBarrier,
  )
  const barriers = s.units.filter((u) => u.isBarrier && !u.dead)
  if (allMinions.length === 0 && barriers.length === 0) return endTurn(s)

  // Tutorial mode for stages 1–3: classic greedy rush. Keeps early game gentle.
  if (!smart) return aiSimple(s, hero, allMinions)

  const role = aiRole(hero)
  const tauntId = hero.tauntedBy
  const tauntTarget =
    tauntId ? s.units.find((u) => u.id === tauntId && !u.dead) : null

  // Roles weighted threat aversion: squishy backliners care a lot, tanks barely.
  const threatWeight =
    role === 'sniper' ? 1.6 : role === 'soldier' ? 0.9 : role === 'striker' ? 1.0 : 0.4

  // Pre-compute fire keys + Red splashers (to deny clustering)
  const fireKeys = new Set(s.fires.map((f) => axialKey(f.pos)))
  const reds = allMinions.filter((m) => m.templateId === 'red')

  // Candidate FROM hexes: reachable + current pos
  const fromCandidates: Axial[] = [hero.pos, ...reachableHexes(s, hero)]

  type Plan = {
    from: Axial
    targetId: string | null
    score: number
    kills: boolean
  }
  let best: Plan | null = null

  for (const from of fromCandidates) {
    // From this tile, what can we attack?
    const inRange = allMinions.filter(
      (m) => hexDistance(from, m.pos) <= hero.range,
    )
    const reachableBarriers = barriers.filter(
      (b) => hexDistance(from, b.pos) <= hero.range,
    )

    const tilThreat = threatAt({ ...s }, from)
    const onFire = fireKeys.has(axialKey(from))

    // Adjacent allies count for splash-cluster penalty
    const alliesAdjacent = s.units.filter(
      (a) =>
        a.faction === 'hero' &&
        !a.dead &&
        a.id !== hero.id &&
        hexDistance(a.pos, from) <= 1,
    ).length
    const inRedSplash = reds.some(
      (r) => hexDistance(r.pos, from) <= r.range + 1,
    )

    // Forced taunt: if reachable from this tile AND in attack range, lock it.
    const tauntInRange =
      tauntTarget && inRange.some((t) => t.id === tauntTarget.id)
        ? tauntTarget
        : null

    const targetOptions: (Unit | null)[] = tauntInRange
      ? [tauntInRange] // taunt is forced when reachable
      : [...inRange, ...(inRange.length === 0 ? reachableBarriers : []), null]

    for (const tgt of targetOptions) {
      let score = 0

      // ---- Positional safety (paid regardless of attack) ----
      score -= tilThreat * threatWeight
      if (onFire) score -= 80
      if (inRedSplash && alliesAdjacent > 0) score -= 60 * alliesAdjacent

      // Slight cost to moving (so heroes don't dance for nothing)
      const moved = !axialEqual(from, hero.pos)
      if (moved) score -= 6

      if (tgt) {
        if (tgt.isBarrier) {
          // Only a fallback — small reward, pricey if real targets exist
          score += 12
          if (allMinions.some((m) => hexDistance(from, m.pos) <= hero.range)) {
            score -= 60
          }
        } else {
          const dmg = estimateDamage(hero, tgt)
          const willKill = dmg >= tgt.hp

          score += dmg * 4
          if (willKill) score += 300 + tgt.atk * 5

          // Priority bumps
          if (tauntTarget && tgt.id === tauntTarget.id) score += 800
          if (tgt.isOverlord) score += 400 // KILL THE COMMANDER — wins the battle
          if (tgt.templateId === 'blue') score += 120 // kill the healer
          if (tgt.templateId === 'red') score += 60 // deny AOE
          if (tgt.hp < tgt.hpMax * 0.5) score += 40 // focus fire wounded
          if (
            tgt.specialCd === 0 &&
            SPECIALS[tgt.templateId] &&
            SPECIALS[tgt.templateId]!.uses !== 1
          ) {
            score += 25 // catch them BEFORE they fire their special
          }

          // Role bonuses
          if (role === 'sniper' && tgt.range >= 2) score += 50
          if (role === 'striker' && tgt.attackKind === 'heal') score += 80
          if (role === 'striker' && tgt.range >= 2) score += 30
          if (role === 'tank' && tgt.templateId === 'brown') score += 50
          if (role === 'soldier' && tgt.hp <= 12) score += 25
        }
      } else {
        // No-attack plan: penalize, but reward closing distance toward best target
        score -= 100
        if (allMinions.length) {
          const closest = Math.min(
            ...allMinions.map((m) => hexDistance(from, m.pos)),
          )
          score -= closest * 25
        }
      }

      // Snipers prefer maximum stand-off range when they can attack
      if (tgt && !tgt.isBarrier && role === 'sniper') {
        const d = hexDistance(from, tgt.pos)
        const ideal = hero.range
        score -= Math.abs(ideal - d) * 12
      }
      // Strikers prefer flanking — i.e. NOT adjacent to other heroes
      if (tgt && !tgt.isBarrier && role === 'striker' && alliesAdjacent === 0) {
        score += 15
      }

      const plan: Plan = {
        from,
        targetId: tgt?.id ?? null,
        score,
        kills: !!tgt && !tgt.isBarrier && estimateDamage(hero, tgt) >= tgt.hp,
      }
      if (!best || plan.score > best.score) best = plan
    }
  }

  if (!best) return endTurn(s)

  // Execute plan
  let state = s
  if (!axialEqual(best.from, hero.pos)) {
    state = moveUnit(state, hero.id, best.from)
  }
  if (best.targetId) {
    const out = attackUnit(state, hero.id, best.targetId)
    state = out.state
  }
  return endTurn(state)
}

/** Tutorial-tier AI: walk straight at lowest-HP target, attack if in range. */
function aiSimple(
  s: BattleState,
  hero: Unit,
  enemies: Unit[],
): BattleState {
  if (!enemies.length) return endTurn(s)
  const target = enemies.slice().sort((a, b) => a.hp - b.hp)[0]
  let state = s
  let cur = hero.pos
  const occ = blockedSet(s, hero.id)
  for (let i = 0; i < hero.move; i++) {
    if (hexDistance(cur, target.pos) <= hero.range) break
    const ns = neighbors(cur)
      .filter((n) => {
        if (occ.has(axialKey(n))) return false
        if (n.r < 0 || n.r >= s.rows) return false
        const off = -Math.floor(n.r / 2)
        return n.q >= off && n.q < s.cols + off
      })
      .sort(
        (a, b) => hexDistance(a, target.pos) - hexDistance(b, target.pos),
      )
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
