/**
 * ELITE PASSIVES — unique abilities for mini-bosses and bosses.
 *
 * Each passive is a tiny pure function that takes the current battle
 * state + relevant context and returns a *patch* describing what to
 * change. The engine calls these from well-known hooks:
 *
 *   - `onTakeDamage`  : just before the target's HP is reduced.
 *                        Used by THORNS, PHASE.
 *   - `onPostDamage`  : after damage is applied (target HP updated).
 *                        Used by ENRAGE, REVIVE, SUMMON.
 *   - `onDealDamage`  : after the attacker successfully hit a target.
 *                        Used by LIFESTEAL, TIME-STOP.
 *   - `outgoingMult`  : queried each time a hero/minion attacks.
 *                        Used by AURA-RAGE, ENRAGE.
 *
 * Adding a new passive means: add the id to `ElitePassiveId` in
 * types.ts, then add a branch here. The engine logs every triggered
 * passive to the battle log so the player can read what hit them.
 *
 * No new types are introduced — every patch is plain Unit fields.
 */

import { neighbors } from './hex'
import type { Axial } from './types'
import type { ElitePassiveId, Unit } from './types'

/* -------------------------------------------------------------- */
/* outgoingMult — queried by the engine before an attack lands.   */
/* Returns a multiplier on the attacker's outgoing damage.        */
/* -------------------------------------------------------------- */

/**
 * `aura-rage` boosts adjacent allied heroes and minions by +25%.
 * `enrage` (already triggered) gives the hero itself an `enrageMult`
 * which the engine reads off the unit directly. We still expose a
 * helper here so the resolution path has one consistent entry point.
 */
export function outgoingMult(
  attacker: Unit,
  allUnits: readonly Unit[],
): number {
  let mult = 1

  // Self-applied enrage stack (multiple bosses won't overlap because
  // each unit only ever fires its own passive once).
  if (attacker.enrageMult && attacker.enrageMult > 1) {
    mult *= attacker.enrageMult
  }

  // Aura buff from any adjacent ELITE ally with `aura-rage`. The aura
  // emanator itself also benefits — bosses are intimidating to themselves.
  const allies = allUnits.filter(
    (u) => u.faction === attacker.faction && !u.dead,
  )
  for (const a of allies) {
    if (a.passiveId !== 'aura-rage') continue
    if (a.id === attacker.id) {
      mult *= 1.25
      continue
    }
    if (isAdjacent(a.pos, attacker.pos)) {
      mult *= 1.25
    }
  }
  return mult
}

/* -------------------------------------------------------------- */
/* onTakeDamage — runs BEFORE hp is reduced.                       */
/* Mutates `dmg` (returns new value) and may reflect damage back.  */
/* -------------------------------------------------------------- */

export type IncomingPatch = {
  /** Possibly reduced damage to apply to the target. */
  damage: number
  /** Damage to reflect to the attacker (thorns). 0 = none. */
  reflect: number
  /** Optional log line if the passive fired. */
  log?: string
}

export function onTakeDamage(
  target: Unit,
  attacker: Unit,
  rawDamage: number,
): IncomingPatch {
  const passive = target.eliteKind ? target.passiveId : undefined

  // PHASE — the FIRST hit of every round is reduced to 1 dmg. The
  // engine clears `passiveFired` at round start so this re-arms.
  if (passive === 'phase' && !target.passiveFired) {
    return {
      damage: 1,
      reflect: 0,
      log: `${target.name} entra em FASE — dano absorvido pelo plano astral.`,
    }
  }

  // THORNS — dmg goes through unchanged but a portion ricochets back.
  if (passive === 'thorns') {
    const reflect = Math.max(1, Math.round(rawDamage * 0.3))
    return {
      damage: rawDamage,
      reflect,
      log: `${target.name} reflete ${reflect} (ESPINHOS).`,
    }
  }

  return { damage: rawDamage, reflect: 0 }
}

/* -------------------------------------------------------------- */
/* onPostDamage — runs AFTER hp is reduced.                        */
/* Returns the unit list to swap in (or null = no change).         */
/* -------------------------------------------------------------- */

export type PostPatch = {
  /** Updated unit list. null = no structural changes. */
  units: Unit[] | null
  /** Spawn requests (for `summon`). Each entry is built into a Unit
   * by the caller via `makeHeroMinion` since this module can't import
   * the unit factory without a circular dep. */
  summons?: Array<{ archetype: Unit['templateId']; near: Axial }>
  /** Optional log line. */
  log?: string
}

export function onPostDamage(
  target: Unit,
  allUnits: readonly Unit[],
): PostPatch {
  const passive = target.eliteKind ? target.passiveId : undefined
  if (!passive) return { units: null }

  // ENRAGE — first time HP drops below 50%, double-down.
  if (passive === 'enrage' && !target.passiveFired) {
    if (target.hp > 0 && target.hp / target.hpMax < 0.5) {
      const next = allUnits.map((u) =>
        u.id === target.id
          ? { ...u, enrageMult: 1.5, passiveFired: true }
          : u,
      )
      return {
        units: next,
        log: `${target.name} ENFURECIDO — ATK +50%.`,
      }
    }
  }

  // REVIVE — first death gets reversed to 50% HP.
  if (passive === 'revive' && !target.passiveFired) {
    if (target.hp <= 0) {
      const restored = Math.max(1, Math.round(target.hpMax * 0.5))
      const next = allUnits.map((u) =>
        u.id === target.id
          ? { ...u, hp: restored, dead: false, passiveFired: true }
          : u,
      )
      return {
        units: next,
        log: `${target.name} RESSURGE da morte — ${restored} HP.`,
      }
    }
  }

  // SUMMON — first time HP < 50%, spawn 2 archetype minions nearby.
  if (passive === 'summon' && !target.passiveFired) {
    if (target.hp > 0 && target.hp / target.hpMax < 0.5) {
      const next = allUnits.map((u) =>
        u.id === target.id ? { ...u, passiveFired: true } : u,
      )
      // The actual archetypes are encoded in the boss's flavor and
      // surfaced through the hero catalog — but for engine simplicity
      // we always summon two `red` (fire-mage) flunkies. The thematic
      // variety can be tuned later by reading from a boss-specific map.
      return {
        units: next,
        summons: [
          { archetype: 'red', near: target.pos },
          { archetype: 'red', near: target.pos },
        ],
        log: `${target.name} INVOCA REFORÇOS!`,
      }
    }
  }

  return { units: null }
}

/* -------------------------------------------------------------- */
/* onDealDamage — runs after the attacker successfully hits.       */
/* -------------------------------------------------------------- */

export type DealPatch = {
  /** HP gained by the attacker (lifesteal). 0 = none. */
  selfHeal: number
  /** True if the attacker should act AGAIN this turn (time-stop). */
  bonusAction: boolean
  log?: string
}

export function onDealDamage(
  attacker: Unit,
  damage: number,
  killed: boolean,
): DealPatch {
  const passive = attacker.eliteKind ? attacker.passiveId : undefined
  if (!passive) return { selfHeal: 0, bonusAction: false }

  // LIFESTEAL — heal back 25% of damage dealt.
  if (passive === 'lifesteal') {
    const heal = Math.max(1, Math.round(damage * 0.25))
    return {
      selfHeal: heal,
      bonusAction: false,
      log: `${attacker.name} drena vida (+${heal} HP).`,
    }
  }

  // TIME-STOP — when the elite kills a minion, gets a free action.
  if (passive === 'time-stop' && killed) {
    return {
      selfHeal: 0,
      bonusAction: true,
      log: `${attacker.name} BIFURCA O TEMPO — ataca novamente.`,
    }
  }

  return { selfHeal: 0, bonusAction: false }
}

/* -------------------------------------------------------------- */
/* round-start cleanup — engine calls this once per round so the    */
/* phase passive can re-arm.                                       */
/* -------------------------------------------------------------- */

export function rearmPhasePassives(units: readonly Unit[]): Unit[] {
  return units.map((u) =>
    u.eliteKind && u.passiveId === 'phase'
      ? { ...u, passiveFired: false }
      : (u as Unit),
  )
}

/* ------- helpers ------- */

function isAdjacent(a: Axial, b: Axial): boolean {
  return neighbors(a).some((p) => p.q === b.q && p.r === b.r)
}

/** Human-readable label for the badge HUD (PT-BR). */
export function passiveLabel(id: ElitePassiveId): string {
  switch (id) {
    case 'thorns':
      return 'ESPINHOS'
    case 'aura-rage':
      return 'AURA DE FÚRIA'
    case 'enrage':
      return 'ENFURECE'
    case 'phase':
      return 'FASE'
    case 'revive':
      return 'RESSURGE'
    case 'summon':
      return 'INVOCAR'
    case 'lifesteal':
      return 'DRENO'
    case 'time-stop':
      return 'BIFURCA'
  }
}

/** One-line description (for tooltips / briefing). */
export function passiveText(id: ElitePassiveId): string {
  switch (id) {
    case 'thorns':
      return 'Reflete 30% do dano recebido ao atacante.'
    case 'aura-rage':
      return 'Aliados adjacentes causam +25% de dano.'
    case 'enrage':
      return 'Abaixo de 50% HP, ATK +50% permanente.'
    case 'phase':
      return 'O primeiro golpe de cada round vira 1 de dano.'
    case 'revive':
      return 'Ressurge uma vez com 50% HP ao morrer.'
    case 'summon':
      return 'Invoca 2 minions ao cair abaixo de 50% HP.'
    case 'lifesteal':
      return 'Cura 25% do dano causado.'
    case 'time-stop':
      return 'Ao matar um minion, age novamente no mesmo turno.'
  }
}
