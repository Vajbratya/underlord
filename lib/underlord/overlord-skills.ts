/**
 * UNDERLORD ACTIVE SKILLS — alterable loadout.
 *
 * The Overlord (the player's avatar in battle) has 3 skill slots. Skills
 * are unlocked at level milestones and the player picks which 3 to bring
 * into each fight from a growing pool. The "Skill Map" in the war room
 * is the configuration UI; the in-battle skill bar shows whatever the
 * player equipped.
 *
 * Each skill is shape-compatible with {@link SpecialDef} so the existing
 * targeting flow can drive activation, but skills are interpreted by a
 * dedicated reducer in `battle.ts` keyed on `skill.kind`.
 */

import type { Axial, Unit } from './types'

/** What clicking a hex during skill-targeting mode means. */
export type SkillTarget =
  | 'self' // No target — fires immediately on activation.
  | 'free-hex' // An empty in-bounds hex within range.
  | 'enemy' // An enemy unit within range.
  | 'ally' // A living friendly minion within range.
  | 'fallen-ally' // A dead minion within range (revive).

/** Everything the battle reducer needs to apply a skill's effect. */
export type SkillKind =
  /** AOE damage centered on a free hex. atkMult applied to caster ATK. */
  | 'aoe-damage'
  /** Heal an ally for a fraction of their hpMax. */
  | 'heal-ally'
  /** Teleport caster to a free hex (no damage). */
  | 'teleport-self'
  /** Buff caster: dmgIn=0.5 for 1 round. */
  | 'shield-self'
  /** Self AOE: every adjacent ally gets +nextAttackBonus for 1 round. */
  | 'rally-allies'
  /** Curse target enemy: damageTakenMod=2 for 2 rounds. */
  | 'doom-enemy'
  /** Revive a fallen ally at 75% hpMax. Once per battle. */
  | 'revive-ally'
  /** Single-target heavy strike: atkMult vs one enemy. */
  | 'smite-enemy'
  /** Grant a living ally a temporary absorb shield (v11). */
  | 'ward-ally'
  /** Bleed an enemy: applies BLEED stacks at range (v11). */
  | 'hex-bleed'

export type SkillDef = {
  /** Stable id used in the save state slots. */
  id: string
  /** Display name. */
  name: string
  /** Compact 4-7 char tag for buttons. */
  short: string
  /** What clicking does. */
  kind: SkillKind
  /** Targeting mode. */
  target: SkillTarget
  /** Range in hexes from caster (0 = self / adjacent). */
  range: number
  /** Cooldown in rounds after each cast. */
  cooldown: number
  /** 0 = unlimited per battle; 1 = once per battle (one-shot ultimates). */
  uses: number
  /** AOE radius around the targeted hex (0 = single-hex effect). */
  aoeRadius: number
  /** Multiplier applied to caster ATK for damage skills (0 if non-damage). */
  atkMult: number
  /** Underlord level required to unlock this skill. 1 = starter. */
  unlockLevel: number
  /** Long-form tooltip describing the effect. */
  text: string
}

/* ------------------------------------------------------------------ */
/* Catalog — stays small + curated. Six slots total in v1, room to     */
/* grow without breaking saves.                                        */
/* ------------------------------------------------------------------ */

export const OVERLORD_SKILLS: Record<string, SkillDef> = {
  // ---------- Starter trio (level 1) ----------
  bolt: {
    id: 'bolt',
    name: 'TIRO ARCANO',
    short: 'TIRO',
    kind: 'smite-enemy',
    target: 'enemy',
    range: 5,
    cooldown: 1,
    uses: 0,
    aoeRadius: 0,
    atkMult: 1.9,
    unlockLevel: 1,
    text: 'Disparo arcano em alc 5. Causa 140% do ATK em um alvo.',
  },
  command: {
    id: 'command',
    name: 'VOZ DE COMANDO',
    short: 'BOOST',
    kind: 'rally-allies',
    target: 'self',
    range: 0,
    cooldown: 4,
    uses: 0,
    aoeRadius: 1,
    atkMult: 0,
    unlockLevel: 1,
    text: 'Inspira aliados em 1 hex. Próximo ataque deles causa +60% dano.',
  },
  aegis: {
    id: 'aegis',
    name: 'ÉGIDE',
    short: 'ÉGIDE',
    kind: 'shield-self',
    target: 'self',
    range: 0,
    cooldown: 3,
    uses: 0,
    aoeRadius: 0,
    atkMult: 0,
    unlockLevel: 1,
    text: 'Reduz em 50% o dano que tu recebe até o próximo turno.',
  },

  // ---------- Mid game ----------
  meteor: {
    id: 'meteor',
    name: 'METEORO',
    short: 'METEORO',
    kind: 'aoe-damage',
    target: 'free-hex',
    range: 6,
    cooldown: 4,
    uses: 0,
    aoeRadius: 2,
    atkMult: 1.7,
    unlockLevel: 4,
    text: 'Meteoro a 6 hex. 120% ATK no centro + AOE raio 2 (50% colateral).',
  },
  miracle: {
    id: 'miracle',
    name: 'MILAGRE',
    short: 'CURA',
    kind: 'heal-ally',
    target: 'ally',
    range: 4,
    cooldown: 3,
    uses: 0,
    aoeRadius: 0,
    atkMult: 0,
    unlockLevel: 5,
    text: 'Toque um aliado em alc 4 e restaura 60% do HP máximo.',
  },
  warp: {
    id: 'warp',
    name: 'PORTAL',
    short: 'PORTAL',
    kind: 'teleport-self',
    target: 'free-hex',
    range: 6,
    cooldown: 3,
    uses: 0,
    aoeRadius: 0,
    atkMult: 0,
    unlockLevel: 6,
    text: 'Teletransporta até 6 hex. Não consome ataque, só move.',
  },

  // ---------- Late game ----------
  doom: {
    id: 'doom',
    name: 'CONDENAR',
    short: 'CONDEN',
    kind: 'doom-enemy',
    target: 'enemy',
    range: 5,
    cooldown: 4,
    uses: 0,
    aoeRadius: 0,
    atkMult: 0,
    unlockLevel: 8,
    text: 'Marca um inimigo. Dobra o dano que ele recebe nos próximos 2 rounds.',
  },
  raise: {
    id: 'raise',
    name: 'ERGUER',
    short: 'ERGUER',
    kind: 'revive-ally',
    target: 'fallen-ally',
    range: 4,
    cooldown: 0,
    uses: 1,
    aoeRadius: 0,
    atkMult: 0,
    unlockLevel: 10,
    text: 'Revive um aliado caído com 75% HP. Uma vez por batalha.',
  },
  apocalypse: {
    id: 'apocalypse',
    name: 'APOCALIPSE',
    short: 'APOCAL',
    kind: 'aoe-damage',
    target: 'free-hex',
    range: 8,
    cooldown: 0,
    uses: 1,
    aoeRadius: 3,
    atkMult: 3,
    unlockLevel: 13,
    text: 'Tempestade arcana a 8 hex. 200% ATK + AOE raio 3 (50% colateral). 1×.',
  },

  // ---------- v11 — status-effect skills ----------
  ward: {
    id: 'ward',
    name: 'ÉGIDE PARTILHADA',
    short: 'ESCUDO',
    kind: 'ward-ally',
    target: 'ally',
    range: 4,
    cooldown: 3,
    uses: 0,
    aoeRadius: 0,
    atkMult: 1.0,
    unlockLevel: 7,
    text: 'Envolve um aliado em alc 4 num escudo de absorção igual ao teu ATK.',
  },
  rupture: {
    id: 'rupture',
    name: 'RUPTURA',
    short: 'SANGRA',
    kind: 'hex-bleed',
    target: 'enemy',
    range: 5,
    cooldown: 2,
    uses: 0,
    aoeRadius: 0,
    atkMult: 0.5,
    unlockLevel: 9,
    text: 'Abre uma ferida a 5 hex: 50% ATK imediato + SANGRA por 3 turnos.',
  },

  /* v11 — ASCENSION skills */
  spite: {
    id: 'spite',
    name: 'FAÍSCA DE DESPREZO',
    short: 'FAÍSCA',
    kind: 'smite-enemy',
    target: 'enemy',
    range: 4,
    cooldown: 0,
    uses: 0,
    aoeRadius: 0,
    atkMult: 1.2,
    unlockLevel: 2,
    text: 'Centelha barata a 4 hex: 80% ATK num alvo, sem cooldown. Cospe vezes sem conta.',
  },
  cataclysm: {
    id: 'cataclysm',
    name: 'CATACLISMO',
    short: 'CATACL',
    kind: 'aoe-damage',
    target: 'free-hex',
    range: 7,
    cooldown: 5,
    uses: 0,
    aoeRadius: 2,
    atkMult: 2.3,
    unlockLevel: 11,
    text: 'Queda de ruína a 7 hex: 170% ATK no centro + AOE raio 2 (50% colateral).',
  },
  chainlightning: {
    id: 'chainlightning',
    name: 'RAIO EM CADEIA',
    short: 'CADEIA',
    kind: 'aoe-damage',
    target: 'free-hex',
    range: 6,
    cooldown: 3,
    uses: 0,
    aoeRadius: 1,
    atkMult: 1.0,
    unlockLevel: 5,
    text: 'Descarga que salta a 6 hex: 100% ATK e estala em raio 1 (50% nos vizinhos).',
  },
  warcry: {
    id: 'warcry',
    name: 'BERRO DE GUERRA',
    short: 'BERRO',
    kind: 'rally-allies',
    target: 'self',
    range: 0,
    cooldown: 5,
    uses: 0,
    aoeRadius: 2,
    atkMult: 0,
    unlockLevel: 7,
    text: 'Urro que sacode raio 2 de aliados. Próximo golpe deles causa +90% dano.',
  },
  anathema: {
    id: 'anathema',
    name: 'ANÁTEMA',
    short: 'ANATEM',
    kind: 'doom-enemy',
    target: 'enemy',
    range: 7,
    cooldown: 3,
    uses: 0,
    aoeRadius: 0,
    atkMult: 0,
    unlockLevel: 6,
    text: 'Maldição de longe a 7 hex. Dobra o dano recebido pelo inimigo por 2 rounds.',
  },
  sanctuary: {
    id: 'sanctuary',
    name: 'SANTUÁRIO',
    short: 'SANTUA',
    kind: 'ward-ally',
    target: 'ally',
    range: 6,
    cooldown: 4,
    uses: 0,
    aoeRadius: 0,
    atkMult: 1.5,
    unlockLevel: 12,
    text: 'Veste um aliado distante (alc 6) num escudo de absorção igual a 150% do teu ATK.',
  },
  plaguelance: {
    id: 'plaguelance',
    name: 'LANÇA PESTILENTA',
    short: 'PESTE',
    kind: 'hex-bleed',
    target: 'enemy',
    range: 8,
    cooldown: 3,
    uses: 0,
    aoeRadius: 0,
    atkMult: 0.7,
    unlockLevel: 14,
    text: 'Ferroada vinda do além a 8 hex: 70% ATK imediato + SANGRA empoçada por 3 turnos.',
  },

  /* v12 — more skills */
  blink: {
    id: 'blink',
    name: 'PISCAR SOMBRIO',
    short: 'PISCA',
    kind: 'teleport-self',
    target: 'free-hex',
    range: 4,
    cooldown: 2,
    uses: 0,
    aoeRadius: 0,
    atkMult: 0,
    unlockLevel: 2,
    text: 'Some e reaparece até 4 hex. Curto, barato e covarde — do jeito que o senhor gosta.',
  },
  emberlash: {
    id: 'emberlash',
    name: 'CHICOTE DE BRASA',
    short: 'BRASA',
    kind: 'smite-enemy',
    target: 'enemy',
    range: 4,
    cooldown: 2,
    uses: 0,
    aoeRadius: 0,
    atkMult: 2.1,
    unlockLevel: 4,
    text: 'Lambida de fogo a 4 hex: 160% ATK num inimigo. Deixa marca e cheiro de churrasco.',
  },
  benediction: {
    id: 'benediction',
    name: 'BENÇÃO PROFANA',
    short: 'BENÇÃO',
    kind: 'heal-ally',
    target: 'ally',
    range: 6,
    cooldown: 4,
    uses: 0,
    aoeRadius: 0,
    atkMult: 0,
    unlockLevel: 7,
    text: 'Toque blasfemo a 6 hex: restaura 70% do HP máximo de um aliado. Sem santidade inclusa.',
  },
  bulwark: {
    id: 'bulwark',
    name: 'MURALHA VIVA',
    short: 'MURO',
    kind: 'shield-self',
    target: 'self',
    range: 0,
    cooldown: 4,
    uses: 0,
    aoeRadius: 0,
    atkMult: 0,
    unlockLevel: 8,
    text: 'Endurece a própria carne: reduz em 50% o dano que tu recebe até o próximo turno.',
  },
  excommunicate: {
    id: 'excommunicate',
    name: 'EXCOMUNHÃO',
    short: 'EXCOM',
    kind: 'doom-enemy',
    target: 'enemy',
    range: 6,
    cooldown: 5,
    uses: 0,
    aoeRadius: 0,
    atkMult: 0,
    unlockLevel: 11,
    text: 'Expulsa um inimigo da graça a 6 hex. Dobra o dano que ele recebe nos próximos 2 rounds.',
  },
  resurrection: {
    id: 'resurrection',
    name: 'SEGUNDA CHANCE',
    short: 'VOLTA',
    kind: 'revive-ally',
    target: 'fallen-ally',
    range: 6,
    cooldown: 0,
    uses: 1,
    aoeRadius: 0,
    atkMult: 0,
    unlockLevel: 13,
    text: 'Arranca um aliado caído da terra a 6 hex com 75% HP. Uma vez por batalha — a morte tem orgulho.',
  },
}

export const SKILL_LIST: SkillDef[] = Object.values(OVERLORD_SKILLS).sort(
  (a, b) => a.unlockLevel - b.unlockLevel,
)

/** Maximum equipped skills the Underlord brings into battle. */
export const SKILL_SLOTS = 3

/** Default starter loadout (used by freshSave + by anyone who hasn't
 * configured their skill map yet). */
export const DEFAULT_LOADOUT: string[] = ['bolt', 'command', 'aegis']

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** All skill ids whose unlockLevel is at most `level`. Sorted ascending. */
export function unlockedSkillIds(level: number): string[] {
  return SKILL_LIST.filter((s) => s.unlockLevel <= level).map((s) => s.id)
}

/** Skill ids whose unlockLevel is exactly `level` (for "newly unlocked"). */
export function newlyUnlockedSkills(level: number): string[] {
  return SKILL_LIST.filter((s) => s.unlockLevel === level).map((s) => s.id)
}

/** Cooldown remaining for a skill on the Overlord unit (0 if ready). */
export function skillCooldown(unit: Unit, skillId: string): number {
  return unit.skillCooldowns?.[skillId] ?? 0
}

/** True if the Overlord has already used a once-per-battle skill. */
export function skillSpent(unit: Unit, skillId: string): boolean {
  return !!unit.skillSpent?.[skillId]
}

/**
 * Pure check: can the Overlord cast this skill right now? Caller must
 * separately decide which resource to consume (most are 'action' cost).
 */
export function canCastSkill(unit: Unit, skill: SkillDef): {
  ok: boolean
  reason?: string
} {
  if (unit.dead) return { ok: false, reason: 'caído' }
  if (!unit.isOverlord) return { ok: false, reason: 'só o Underlord' }
  if (skill.uses === 1 && skillSpent(unit, skill.id)) {
    return { ok: false, reason: 'já usou' }
  }
  if (skillCooldown(unit, skill.id) > 0) return { ok: false, reason: 'em cooldown' }
  if (unit.acted) return { ok: false, reason: 'já agiu' }
  return { ok: true }
}

/** Distance helper (axial). Local copy to avoid an import cycle. */
export function hexDist(a: Axial, b: Axial): number {
  return (
    (Math.abs(a.q - b.q) +
      Math.abs(a.q + a.r - b.q - b.r) +
      Math.abs(a.r - b.r)) /
    2
  )
}
