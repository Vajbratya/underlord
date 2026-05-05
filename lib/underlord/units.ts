/**
 * Minion archetypes and starter roster generation.
 */

import type { MinionArchetype, Unit, UnitTemplate, Axial } from './types'
import { BARRIER_HP } from './specials'

/* ----------------------------------------------------------------------- */
/*  All numbers are intentionally LARGE — Underlord vs. Overlord is a      */
/*  numbers game. HP in the hundreds, ATK in the tens, damage popups       */
/*  hit triple digits. Original five tiers stay relatively balanced; new   */
/*  archetypes unlock at later Underlord levels and bring stronger maths.  */
/* ----------------------------------------------------------------------- */

export const MINION_TEMPLATES: Record<MinionArchetype, UnitTemplate> = {
  brown: {
    archetype: 'brown',
    name: 'BROWN',
    glyph: '◤',
    role: 'Brawler de linha de frente',
    hp: 140,
    move: 3,
    atk: 35,
    range: 1,
    spd: 4,
    tone: 'foreground',
    flavor: 'Bate, apanha, ri. Repete. Cheira a couro queimado.',
    attackKind: 'cleave',
    abilityTag: 'CLIVA',
    abilityText:
      'Ataque atinge o alvo + um inimigo adjacente (50% dano colateral). Atrai a IA.',
    unlockTier: 0,
    hasActiveSpecial: true,
  },
  red: {
    archetype: 'red',
    name: 'RED',
    glyph: '◆',
    role: 'Pirômano de área',
    hp: 90,
    move: 3,
    atk: 45,
    range: 3,
    spd: 6,
    tone: 'destructive',
    flavor: 'Imune a fogo. Não imune a tropeçar no próprio fogo.',
    attackKind: 'splash',
    abilityTag: 'AOE',
    abilityText:
      'Explosão atinge o alvo + todos os inimigos a 1 hex dele (50% colateral).',
    unlockTier: 0,
    hasActiveSpecial: true,
  },
  green: {
    archetype: 'green',
    name: 'GREEN',
    glyph: '◇',
    role: 'Assassino executor',
    hp: 70,
    move: 5,
    atk: 55,
    range: 1,
    spd: 9,
    tone: 'accent',
    flavor: 'Aparece pelas costas. Se desculpa enquanto enfia a faca.',
    attackKind: 'execute',
    abilityTag: 'EXECUTA',
    abilityText:
      'Causa +50% dano contra alvos com HP abaixo de 40%. Mata feridos rápido.',
    unlockTier: 0,
    hasActiveSpecial: true,
  },
  blue: {
    archetype: 'blue',
    name: 'BLUE',
    glyph: '◈',
    role: 'Xamã curandeiro',
    hp: 100,
    move: 4,
    atk: 25,
    range: 2,
    spd: 5,
    tone: 'primary',
    flavor: 'Cura, ressuscita, dá conselho ruim. Tudo na mesma vibe.',
    attackKind: 'heal',
    abilityTag: 'CURA',
    abilityText:
      'Em vez de atacar, toque um aliado em alcance pra restaurar 30% do HP máximo.',
    unlockTier: 0,
    hasActiveSpecial: true,
  },
  grey: {
    archetype: 'grey',
    name: 'GREY',
    glyph: '▣',
    role: 'Cerco perfurante',
    hp: 110,
    move: 2,
    atk: 40,
    range: 4,
    spd: 3,
    tone: 'gold',
    flavor: 'Lê manual. Constrói catapulta. Detesta pressa.',
    attackKind: 'pierce',
    abilityTag: 'PERFURA',
    abilityText:
      'Tiro atravessa: atinge o alvo + o hex atrás dele (50% no segundo).',
    unlockTier: 0,
    hasActiveSpecial: true,
  },

  /* ------------------ Progression tier ------------------ */

  bone: {
    archetype: 'bone',
    name: 'BONE',
    glyph: '✖',
    role: 'Necromante de longa distância',
    hp: 80,
    move: 3,
    atk: 50,
    range: 5,
    spd: 6,
    tone: 'primary',
    flavor: 'Faz a maldição rimar. Os ossos dos heróis aplaudem em ritmo.',
    attackKind: 'curse',
    abilityTag: 'MALDIÇÃO',
    abilityText:
      'Tiro de osso a 5 hex. O alvo recebe +50% dano de tudo durante o próximo round.',
    unlockTier: 4,
    flying: true,
    hasActiveSpecial: false,
  },
  harpy: {
    archetype: 'harpy',
    name: 'HARPY',
    glyph: '𓅂',
    role: 'Arqueira voadora',
    hp: 95,
    move: 5,
    atk: 50,
    range: 4,
    spd: 8,
    tone: 'accent',
    flavor: 'Atravessa pedras. Não atravessa o ego dos heróis sem cortar primeiro.',
    attackKind: 'pierce',
    abilityTag: 'VOO',
    abilityText:
      'Voa por cima de obstáculos. Atira em alc 4 e o tiro perfura para o hex seguinte.',
    unlockTier: 6,
    flying: true,
    hasActiveSpecial: false,
  },
  gorger: {
    archetype: 'gorger',
    name: 'GORGER',
    glyph: '◉',
    role: 'Devorador com sede de sangue',
    hp: 200,
    move: 3,
    atk: 60,
    range: 1,
    spd: 5,
    tone: 'destructive',
    flavor: 'Come o que mata. Mata o que come. O ciclo é simples.',
    attackKind: 'siphon',
    abilityTag: 'SIFÃO',
    abilityText:
      'Mordida absorvente. Cura no próprio HP 30% do dano causado. Fica em pé pra sempre.',
    unlockTier: 8,
    hasActiveSpecial: false,
  },
  wraith: {
    archetype: 'wraith',
    name: 'WRAITH',
    glyph: '☂',
    role: 'Espectro flanqueador',
    hp: 110,
    move: 6,
    atk: 70,
    range: 1,
    spd: 11,
    tone: 'primary',
    flavor: 'Atravessa o herói. Volta. Atravessa de novo. Cobra entrada.',
    attackKind: 'execute',
    abilityTag: 'FANTASMA',
    abilityText:
      'Voa por cima de obstáculos. +50% dano em alvos abaixo de 40% HP. Move 6 hex.',
    unlockTier: 10,
    flying: true,
    hasActiveSpecial: false,
  },
  lich: {
    archetype: 'lich',
    name: 'LICH',
    glyph: '☥',
    role: 'Senhor da magia AOE',
    hp: 130,
    move: 2,
    atk: 75,
    range: 6,
    spd: 4,
    tone: 'gold',
    flavor: 'Tem doutorado em sofrimento. A tese ficou em chamas.',
    attackKind: 'volley',
    abilityTag: 'TEMPESTADE',
    abilityText:
      'Tempestade arcana a 6 hex. Atinge o alvo + todo inimigo em 2 hex dele (50% colateral).',
    unlockTier: 13,
    hasActiveSpecial: false,
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
    flying: t.flying,
    // Only the original five archetypes have an active special. Newer
    // archetypes start "spent" so the UI never offers a special button.
    specialCd: t.hasActiveSpecial ? 0 : 999,
    specialSpent: !t.hasActiveSpecial,
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
  const hp = 200 + lv * 30
  const atk = 50 + lv * 5
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
    flying: t.flying,
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
    case 'bone':
      return 'AGOUREIRO'
    case 'harpy':
      return 'CAÇADORA'
    case 'gorger':
      return 'DEVORADOR'
    case 'wraith':
      return 'ESPECTRO'
    case 'lich':
      return 'ARCANISTA'
  }
}

/** All archetypes the player has unlocked through level milestones, in
 * order from earliest to latest. Used by the Recrutamento drawer. */
export function unlockedArchetypeList(unlocked: string[]): MinionArchetype[] {
  const all = Object.values(MINION_TEMPLATES) as UnitTemplate[]
  return all
    .filter((t) => t.unlockTier === 0 || unlocked.includes(t.archetype))
    .sort((a, b) => a.unlockTier - b.unlockTier)
    .map((t) => t.archetype)
}

/** Archetypes that the given Underlord level WOULD unlock (used at level-up
 * to figure out what to grant). Returns archetype ids whose `unlockTier` is
 * at most `level` and that aren't in `alreadyUnlocked`. */
export function newlyUnlockedAt(
  level: number,
  alreadyUnlocked: string[],
): MinionArchetype[] {
  const have = new Set(alreadyUnlocked)
  return (Object.values(MINION_TEMPLATES) as UnitTemplate[])
    .filter(
      (t) =>
        t.unlockTier > 0 &&
        t.unlockTier <= level &&
        !have.has(t.archetype),
    )
    .sort((a, b) => a.unlockTier - b.unlockTier)
    .map((t) => t.archetype)
}

/** Themed first names per archetype, used when auto-recruiting from a
 * level-up unlock. Doesn't have to be unique — just better than "BONE 1". */
const RECRUIT_NAMES: Record<MinionArchetype, string[]> = {
  brown: ['GROK', 'BLURG', 'KARN', 'ROFF'],
  red: ['CINDA', 'EMBER', 'PYRA', 'KILN'],
  green: ['SLIK', 'VEX', 'ZIRR', 'NYX'],
  blue: ['MURR', 'TIDE', 'WELL', 'BREN'],
  grey: ['KORM', 'STAVE', 'BAUL', 'PIKE'],
  bone: ['MORTH', 'OSSEK', 'KARG', 'VEHM'],
  harpy: ['AERA', 'SCRYE', 'TALON', 'NESS'],
  gorger: ['MAW', 'GLUTT', 'GORE', 'CHOMP'],
  wraith: ['SHAD', 'VEIL', 'WISP', 'NEPH'],
  lich: ['VOSS', 'MORDA', 'KESS', 'GHAR'],
}

let recruitCounter = 0
/** Build a roster-eligible Unit for an archetype the player just unlocked. */
export function recruitMinion(archetype: MinionArchetype): Unit {
  const pool = RECRUIT_NAMES[archetype]
  recruitCounter += 1
  const name = pool[recruitCounter % pool.length]
  return makeUnit(archetype, { q: 0, r: 0 }, { name })
}

/** Make a hero unit on the enemy team. */
export function makeHero(
  heroId: string,
  name: string,
  glyph: string,
  pos: Axial,
  difficulty: number,
): Unit {
  // Heroes scale with difficulty (region stage 1-14) — XL numbers to match
  // the new minion economy. Boss heroes hit hard, take a beating.
  const tier = Math.max(1, Math.min(14, difficulty))
  const hp = 110 + tier * 20
  const atk = 30 + Math.floor(tier * 7)
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
