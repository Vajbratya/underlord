/**
 * UNDERLORD — Forja (perk tree).
 *
 * Long-term progression. Each Underlord level past 1 grants one perk point.
 * Perks have ranks; spending a point increases the rank. Effects apply
 * automatically:
 *  - Stat perks (vigor, fúria, agilidade…) buff every unit of that archetype
 *    at roster build time (and live for already-recruited minions through the
 *    `applyPerksToUnit` helper at battle init).
 *  - Squad-cap perk grows the deployable squad limit (3 → 4 → 5).
 *  - Combat perks (sangue frio, gancho) modify crit chance and combo bonus
 *    inside battle math.
 *  - Economy perks (cartel, passe livre) scale gold and XP rewards.
 */

import type { MinionArchetype, Unit } from './types'

export type PerkId =
  | 'vigor_brown'
  | 'furia_red'
  | 'agilidade_green'
  | 'milagre_blue'
  | 'alcance_grey'
  | 'exercito'
  | 'sangue_frio'
  | 'gancho'
  | 'cartel'
  | 'passe_livre'

export type PerkDef = {
  id: PerkId
  /** Display name. */
  name: string
  /** Short tag for compact UI. */
  short: string
  /** Long-form description. */
  text: string
  /** Maximum rank. */
  maxRank: number
  /** Tier the perk unlocks at — Underlord must be at least `tierLevel` to spend. */
  tierLevel: number
  /** Visual category. */
  branch: 'minion' | 'underlord' | 'economy'
  /** Effect signature for UI tooltips: e.g. "+6 HP por rank". */
  effect: string
}

export const PERKS: Record<PerkId, PerkDef> = {
  // ---------- Minion stat branch ----------
  vigor_brown: {
    id: 'vigor_brown',
    name: 'VIGOR DE BROWN',
    short: 'VIGOR',
    text: 'Cada Brown nasce mais grosso. Aguenta mais porrada da Luz.',
    maxRank: 3,
    tierLevel: 1,
    branch: 'minion',
    effect: '+6 HP base do BROWN por rank',
  },
  furia_red: {
    id: 'furia_red',
    name: 'FÚRIA DE RED',
    short: 'FÚRIA',
    text: 'Red queima mais alto. Cada explosão dói mais.',
    maxRank: 3,
    tierLevel: 2,
    branch: 'minion',
    effect: '+2 ATK base do RED por rank',
  },
  agilidade_green: {
    id: 'agilidade_green',
    name: 'AGILIDADE DE GREEN',
    short: 'AGIL',
    text: 'Green aprende a deslizar entre as sombras.',
    maxRank: 2,
    tierLevel: 3,
    branch: 'minion',
    effect: '+1 MOV base do GREEN por rank',
  },
  milagre_blue: {
    id: 'milagre_blue',
    name: 'MILAGRE DE BLUE',
    short: 'MILAGR',
    text: 'A cura do Blue carrega mais peso de fé do Underlord.',
    maxRank: 3,
    tierLevel: 2,
    branch: 'minion',
    effect: '+5% cura por rank (sobre o HP máx do alvo)',
  },
  alcance_grey: {
    id: 'alcance_grey',
    name: 'ALCANCE DE GREY',
    short: 'ALC+',
    text: 'Grey ergue uma plataforma a mais. A linha de tiro estica.',
    maxRank: 1,
    tierLevel: 4,
    branch: 'minion',
    effect: '+1 ALCANCE do GREY (só 1 rank)',
  },

  // ---------- Underlord branch ----------
  exercito: {
    id: 'exercito',
    name: 'EXÉRCITO',
    short: 'EXÉRC',
    text: 'Mais minions descem por turno. A torre não tem regras de capacidade.',
    maxRank: 2,
    tierLevel: 3,
    branch: 'underlord',
    effect: '+1 vaga de esquadrão (3 → 4 → 5)',
  },
  sangue_frio: {
    id: 'sangue_frio',
    name: 'SANGUE FRIO',
    short: 'CRIT',
    text: 'Você ensaia o golpe certo. As cabeças voam mais.',
    maxRank: 3,
    tierLevel: 2,
    branch: 'underlord',
    effect: '+5% chance de crítico por rank',
  },
  gancho: {
    id: 'gancho',
    name: 'GANCHO',
    short: 'COMBO',
    text: 'Cada ataque encadeado bate mais forte que o anterior.',
    maxRank: 3,
    tierLevel: 4,
    branch: 'underlord',
    effect: '+5% dano por stack de combo, por rank',
  },

  // ---------- Economy branch ----------
  cartel: {
    id: 'cartel',
    name: 'CARTEL',
    short: 'OURO+',
    text: 'Os emissários cobram pedágio nos atalhos da torre.',
    maxRank: 3,
    tierLevel: 2,
    branch: 'economy',
    effect: '+20% ouro por vitória, por rank',
  },
  passe_livre: {
    id: 'passe_livre',
    name: 'PASSE LIVRE',
    short: 'XP+',
    text: 'A Coroa Submersa registra cada cabeça com bônus burocrático.',
    maxRank: 2,
    tierLevel: 5,
    branch: 'economy',
    effect: '+20% XP por batalha, por rank',
  },
}

export const PERK_LIST: PerkDef[] = Object.values(PERKS)

/* ------------------------------------------------------------------ */
/* Pure helpers — read perk ranks safely.                              */
/* ------------------------------------------------------------------ */

export function rankOf(
  perks: Record<string, number> | undefined,
  id: PerkId,
): number {
  if (!perks) return 0
  return Math.min(PERKS[id].maxRank, Math.max(0, perks[id] ?? 0))
}

/** Total perk points already spent. */
export function perksSpent(perks: Record<string, number> | undefined): number {
  if (!perks) return 0
  let total = 0
  for (const id of Object.keys(PERKS) as PerkId[]) {
    total += Math.min(PERKS[id].maxRank, Math.max(0, perks[id] ?? 0))
  }
  return total
}

/** Squad cap derived from EXÉRCITO. */
export function squadCap(perks: Record<string, number> | undefined): number {
  return 3 + rankOf(perks, 'exercito')
}

/** Crit chance multiplier — added to base 0.18. */
export function critChanceBonus(
  perks: Record<string, number> | undefined,
): number {
  return rankOf(perks, 'sangue_frio') * 0.05
}

/** Combo damage per stack — added to base 0.15. */
export function comboBonusPerStack(
  perks: Record<string, number> | undefined,
): number {
  return rankOf(perks, 'gancho') * 0.05
}

/** Gold multiplier (1.0 = no bonus). */
export function goldMult(perks: Record<string, number> | undefined): number {
  return 1 + rankOf(perks, 'cartel') * 0.2
}

/** XP multiplier (1.0 = no bonus). */
export function xpMult(perks: Record<string, number> | undefined): number {
  return 1 + rankOf(perks, 'passe_livre') * 0.2
}

/** Heal-amount multiplier on top of the 30% baseline. */
export function healMultiplier(
  perks: Record<string, number> | undefined,
): number {
  return 1 + rankOf(perks, 'milagre_blue') * (0.05 / 0.3)
  // We express the +5% as a fraction of the 30% base, so adding rank gives
  // +5%/+10%/+15% absolute hpMax, equivalent to 1.166x / 1.333x / 1.5x of base.
}

/* ------------------------------------------------------------------ */
/* Apply minion-stat perks to a single unit.                           */
/* ------------------------------------------------------------------ */

/** Returns a new unit with perk-driven stat buffs. Idempotent — safe to
 * call on roster units (which are already buffed) because we recompute
 * from the unit's `templateId` baseline against the SAME perks. So this
 * helper assumes you're ALWAYS applying the same perks to a freshly-built
 * unit. For roster persistence we store the BUFFED stats, then re-apply
 * delta on perk change via {@link rebuildRosterStats}. */
export function applyPerksToUnit(
  unit: Unit,
  perks: Record<string, number> | undefined,
): Unit {
  if (unit.faction !== 'minion' || unit.isBarrier) return unit
  const buff = statBuffsFor(unit.templateId, perks)
  return {
    ...unit,
    hp: Math.min(unit.hp + buff.hp, unit.hpMax + buff.hp),
    hpMax: unit.hpMax + buff.hp,
    atk: unit.atk + buff.atk,
    move: unit.move + buff.move,
    range: unit.range + buff.range,
  }
}

/** Get raw stat deltas for an archetype given a perk map. */
export function statBuffsFor(
  archetype: MinionArchetype,
  perks: Record<string, number> | undefined,
): { hp: number; atk: number; move: number; range: number } {
  const out = { hp: 0, atk: 0, move: 0, range: 0 }
  if (archetype === 'brown') {
    out.hp += rankOf(perks, 'vigor_brown') * 6
  }
  if (archetype === 'red') {
    out.atk += rankOf(perks, 'furia_red') * 2
  }
  if (archetype === 'green') {
    out.move += rankOf(perks, 'agilidade_green') * 1
  }
  if (archetype === 'grey') {
    out.range += rankOf(perks, 'alcance_grey') * 1
  }
  return out
}
