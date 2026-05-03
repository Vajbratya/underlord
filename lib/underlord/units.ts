/**
 * Minion archetypes and starter roster generation.
 */

import type { MinionArchetype, Unit, UnitTemplate, Axial } from './types'
import { BARRIER_HP } from './specials'

export const MINION_TEMPLATES: Record<MinionArchetype, UnitTemplate> = {
  brown: {
    archetype: 'brown',
    name: 'BROWN',
    glyph: '◤',
    role: 'Brawler de linha de frente',
    hp: 28,
    move: 3,
    atk: 7,
    range: 1,
    spd: 4,
    tone: 'foreground',
    flavor: 'Bate, apanha, ri. Repete. Cheira a couro queimado.',
    attackKind: 'cleave',
    abilityTag: 'CLIVA',
    abilityText:
      'Ataque atinge o alvo + um inimigo adjacente (50% dano colateral). Atrai a IA.',
  },
  red: {
    archetype: 'red',
    name: 'RED',
    glyph: '◆',
    role: 'Pirômano de área',
    hp: 18,
    move: 3,
    atk: 9,
    range: 3,
    spd: 6,
    tone: 'destructive',
    flavor: 'Imune a fogo. Não imune a tropeçar no próprio fogo.',
    attackKind: 'splash',
    abilityTag: 'AOE',
    abilityText:
      'Explosão atinge o alvo + todos os inimigos a 1 hex dele (50% colateral).',
  },
  green: {
    archetype: 'green',
    name: 'GREEN',
    glyph: '◇',
    role: 'Assassino executor',
    hp: 14,
    move: 5,
    atk: 11,
    range: 1,
    spd: 9,
    tone: 'accent',
    flavor: 'Aparece pelas costas. Se desculpa enquanto enfia a faca.',
    attackKind: 'execute',
    abilityTag: 'EXECUTA',
    abilityText:
      'Causa +50% dano contra alvos com HP abaixo de 40%. Mata feridos rápido.',
  },
  blue: {
    archetype: 'blue',
    name: 'BLUE',
    glyph: '◈',
    role: 'Xamã curandeiro',
    hp: 20,
    move: 4,
    atk: 5,
    range: 2,
    spd: 5,
    tone: 'primary',
    flavor: 'Cura, ressuscita, dá conselho ruim. Tudo na mesma vibe.',
    attackKind: 'heal',
    abilityTag: 'CURA',
    abilityText:
      'Em vez de atacar, toque um aliado em alcance pra restaurar 30% do HP máximo.',
  },
  grey: {
    archetype: 'grey',
    name: 'GREY',
    glyph: '▣',
    role: 'Cerco perfurante',
    hp: 22,
    move: 2,
    atk: 8,
    range: 4,
    spd: 3,
    tone: 'gold',
    flavor: 'Lê manual. Constrói catapulta. Detesta pressa.',
    attackKind: 'pierce',
    abilityTag: 'PERFURA',
    abilityText:
      'Tiro atravessa: atinge o alvo + o hex atrás dele (50% no segundo).',
  },
}

let unitIdCounter = 0
export function nextUnitId(): string {
  unitIdCounter += 1
  return `u${unitIdCounter.toString(36)}-${Date.now().toString(36).slice(-3)}`
}

/** Build a fresh unit from template at a given position. */
export function makeUnit(
  archetype: MinionArchetype,
  pos: Axial,
  overrides: Partial<Unit> = {},
): Unit {
  const t = MINION_TEMPLATES[archetype]
  return {
    id: nextUnitId(),
    templateId: archetype,
    name: t.name,
    glyph: t.glyph,
    faction: 'minion',
    pos,
    hp: t.hp,
    hpMax: t.hp,
    atk: t.atk,
    move: t.move,
    range: t.range,
    spd: t.spd,
    tone: t.tone,
    acted: false,
    moved: false,
    dead: false,
    attackKind: t.attackKind,
    specialCd: 0,
    specialSpent: false,
    ...overrides,
  }
}

/** Build a Muralha barrier unit (no actions, just blocks a hex). */
export function makeBarrier(pos: Axial, ownerName: string = 'MURALHA'): Unit {
  return {
    id: nextUnitId(),
    templateId: 'grey',
    name: ownerName,
    glyph: '▓',
    faction: 'minion',
    pos,
    hp: BARRIER_HP,
    hpMax: BARRIER_HP,
    atk: 0,
    move: 0,
    range: 0,
    spd: 0,
    tone: 'foreground',
    acted: true,
    moved: true,
    dead: false,
    attackKind: 'basic',
    specialCd: 999,
    specialSpent: true,
    isBarrier: true,
  }
}

/**
 * Build the Underlord avatar — the player's commander on the field.
 *
 * Faction is `'minion'` so it counts as part of your army; the `isOverlord`
 * flag makes its death an instant battle loss (see `computeDone` in battle.ts).
 * Stats scale with the Underlord's meta level so a leveled-up player feels
 * stronger and a fresh save still has a tangible board threat.
 */
export function makeOverlord(
  level: number,
  pos: Axial,
  name: string = 'UNDERLORD',
): Unit {
  const lv = Math.max(1, level)
  const hp = 35 + lv * 5
  const atk = 10 + lv
  return {
    id: nextUnitId(),
    templateId: 'brown', // visual fallback — render path checks isOverlord first
    name: name.toUpperCase(),
    glyph: '✦',
    faction: 'minion',
    pos,
    hp,
    hpMax: hp,
    atk,
    move: 3,
    range: 2,
    spd: 7,
    tone: 'gold',
    acted: false,
    moved: false,
    dead: false,
    attackKind: 'basic',
    specialCd: 999,
    specialSpent: true,
    isOverlord: true,
  }
}

/**
 * Build an enemy minion that marches in with a hero. Same archetype template
 * as the player's roster (so they share rules) but `faction: 'hero'` puts
 * them on the enemy team. Slightly weaker than the hero so the hero remains
 * the priority target — you still want to kill the named villain first.
 */
export function makeHeroMinion(
  archetype: MinionArchetype,
  pos: Axial,
  stage: number,
  ownerName: string,
): Unit {
  const t = MINION_TEMPLATES[archetype]
  // Scale with stage but capped beneath a stage-tier hero.
  const tier = Math.max(1, Math.min(14, stage))
  const hpMul = 0.85 + tier * 0.04
  const atkMul = 0.85 + tier * 0.025
  const hp = Math.round(t.hp * hpMul)
  const atk = Math.round(t.atk * atkMul)
  return {
    id: nextUnitId(),
    templateId: archetype,
    name: `${ownerName} ${archMinionTitle(archetype)}`,
    glyph: t.glyph,
    faction: 'hero',
    pos,
    hp,
    hpMax: hp,
    atk,
    move: t.move,
    range: t.range,
    spd: t.spd,
    tone: 'destructive', // red ring matches hero faction visual language
    acted: false,
    moved: false,
    dead: false,
    attackKind: t.attackKind,
    specialCd: 999,
    specialSpent: true,
  }
}

/** Themed nickname suffix for entourage minions, used on tooltips/HUD. */
function archMinionTitle(arch: MinionArchetype): string {
  switch (arch) {
    case 'brown':
      return 'CAPANGA'
    case 'red':
      return 'PIRO'
    case 'green':
      return 'STALKER'
    case 'blue':
      return 'CLÉRIGO'
    case 'grey':
      return 'GUARDA'
  }
}

/** Make a hero unit on the enemy team. */
export function makeHero(
  heroId: string,
  name: string,
  glyph: string,
  pos: Axial,
  difficulty: number,
): Unit {
  // Heroes scale with difficulty (region stage 1-14)
  const tier = Math.max(1, Math.min(14, difficulty))
  const hp = 22 + tier * 4
  const atk = 6 + Math.floor(tier * 1.4)
  const spd = 4 + Math.floor(tier / 3)
  const move = 3 + Math.floor(tier / 5)
  const range = tier >= 7 ? 2 : 1
  return {
    id: nextUnitId(),
    templateId: 'brown', // not used for heroes; visual only
    name,
    glyph,
    faction: 'hero',
    pos,
    hp,
    hpMax: hp,
    atk,
    move,
    range,
    spd,
    tone: 'foreground',
    acted: false,
    moved: false,
    dead: false,
    attackKind: 'basic',
    specialCd: 999,
    specialSpent: true,
    heroId,
  }
}

/** Starter roster — what the Underlord begins with. */
export function makeStarterRoster(): Unit[] {
  return [
    makeUnit('brown', { q: 0, r: 0 }, { name: 'GROK' }),
    makeUnit('brown', { q: 0, r: 0 }, { name: 'BLURG' }),
    makeUnit('red', { q: 0, r: 0 }, { name: 'CINDA' }),
    makeUnit('green', { q: 0, r: 0 }, { name: 'SLIK' }),
    makeUnit('blue', { q: 0, r: 0 }, { name: 'MURR' }),
    makeUnit('grey', { q: 0, r: 0 }, { name: 'KORM' }),
  ]
}

/* ------------------------------------------------------------------ */
/* Perk-driven roster rebuild.                                         */
/*                                                                     */
/* Roster units store their CURRENT (perk-buffed) stats. When the      */
/* player spends or refunds a perk, we recompute every unit from its   */
/* archetype baseline plus the new perk map, preserving HP-percent.     */
/* ------------------------------------------------------------------ */

import { statBuffsFor } from './perks'

export function rebuildRosterStats(
  roster: Unit[],
  perks: Record<string, number>,
): Unit[] {
  return roster.map((u) => {
    if (u.faction !== 'minion' || u.isBarrier || u.isOverlord) return u
    const tpl = MINION_TEMPLATES[u.templateId]
    if (!tpl) return u
    const buff = statBuffsFor(u.templateId, perks)
    const hpMax = tpl.hp + buff.hp
    const atk = tpl.atk + buff.atk
    const move = tpl.move + buff.move
    const range = tpl.range + buff.range
    const ratio = u.hpMax > 0 ? u.hp / u.hpMax : 1
    const hp = Math.max(1, Math.round(hpMax * ratio))
    return { ...u, hpMax, hp, atk, move, range }
  })
}
