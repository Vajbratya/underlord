/**
 * PRESSÁGIOS (v12) — per-battle battlefield omens.
 *
 * Every battle rolls 1-2 random omens that reshape the field — sometimes
 * in your favor, sometimes not. They're the main weapon against
 * "every fight feels the same": the same region plays differently when
 * the ground is on fire, or everyone hits like a truck, or the fog eats
 * your snipers' range.
 *
 * All effects are applied at BUILD time (to every unit on the board +
 * ambient fires), so the system needs zero round-tick plumbing and can't
 * desync the engine. Aggregation is pure.
 */

export type BattleModifier = {
  id: string
  /** Display name (PT-BR, UPPERCASE-ish). */
  name: string
  /** ≤4-char chip. */
  short: string
  /** One-line description of the effect. */
  desc: string
  /** UI tone for the chip. */
  tone: 'destructive' | 'accent' | 'gold' | 'primary' | 'foreground'
  /** Multiplier on EVERY unit's ATK (both factions). */
  allAtkMult?: number
  /** Multiplier on EVERY unit's max HP (both factions). */
  allHpMult?: number
  /** Flat change to EVERY unit's movement (min clamped to 1). */
  allMove?: number
  /** Flat change to ranged units' (range ≥ 3) range (min clamped to 1). */
  rangedRangeDelta?: number
  /** Number of extra ambient fire tiles scattered on the field. */
  extraFires?: number
}

export const MODIFIERS: Record<string, BattleModifier> = {
  mare_de_sangue: {
    id: 'mare_de_sangue',
    name: 'MARÉ DE SANGUE',
    short: 'SANG',
    desc: 'O campo cheira a ferro. TODOS causam +25% de dano.',
    tone: 'destructive',
    allAtkMult: 1.25,
  },
  nevoa_baca: {
    id: 'nevoa_baca',
    name: 'NÉVOA BAÇA',
    short: 'NÉV',
    desc: 'Uma bruma engole a visão. Unidades de alcance perdem 1 de alcance.',
    tone: 'accent',
    rangedRangeDelta: -1,
  },
  frenesi: {
    id: 'frenesi',
    name: 'FRENESI',
    short: 'FREN',
    desc: 'Algo no ar acelera os corpos. TODOS andam +1 hex.',
    tone: 'gold',
    allMove: 1,
  },
  pacto_de_ferro: {
    id: 'pacto_de_ferro',
    name: 'PACTO DE FERRO',
    short: 'FERR',
    desc: 'A carne endurece. TODOS ganham +30% de HP. Vai ser longa.',
    tone: 'foreground',
    allHpMult: 1.3,
  },
  chuva_de_brasas: {
    id: 'chuva_de_brasas',
    name: 'CHUVA DE BRASAS',
    short: 'BRAS',
    desc: 'O céu cospe fogo. Brasas espalhadas queimam quem pisar.',
    tone: 'destructive',
    extraFires: 5,
  },
  veu_quebradico: {
    id: 'veu_quebradico',
    name: 'VÉU QUEBRADIÇO',
    short: 'VÉU',
    desc: 'Tudo é vidro. TODOS perdem 25% de HP — golpes matam rápido.',
    tone: 'accent',
    allHpMult: 0.75,
  },
  gigantismo: {
    id: 'gigantismo',
    name: 'GIGANTISMO',
    short: 'GIGA',
    desc: 'Cresce tudo. TODOS ganham +20% HP e +15% de dano.',
    tone: 'gold',
    allHpMult: 1.2,
    allAtkMult: 1.15,
  },
  passos_pesados: {
    id: 'passos_pesados',
    name: 'PASSOS PESADOS',
    short: 'LENT',
    desc: 'O chão agarra os pés. TODOS andam -1 hex. Posição é tudo.',
    tone: 'primary',
    allMove: -1,
  },
  ira_arcana: {
    id: 'ira_arcana',
    name: 'IRA ARCANA',
    short: 'ARC',
    desc: 'A magia transborda. Unidades de alcance ganham +1 de alcance.',
    tone: 'primary',
    rangedRangeDelta: 1,
  },
}

export const ALL_MODIFIER_IDS: string[] = Object.keys(MODIFIERS)

export type AggregatedModifiers = {
  allAtkMult: number
  allHpMult: number
  allMove: number
  rangedRangeDelta: number
  extraFires: number
}

/** Fold a set of modifier ids into a single multiplier struct. */
export function aggregateModifiers(ids: string[]): AggregatedModifiers {
  const out: AggregatedModifiers = {
    allAtkMult: 1,
    allHpMult: 1,
    allMove: 0,
    rangedRangeDelta: 0,
    extraFires: 0,
  }
  for (const id of ids) {
    const m = MODIFIERS[id]
    if (!m) continue
    out.allAtkMult *= m.allAtkMult ?? 1
    out.allHpMult *= m.allHpMult ?? 1
    out.allMove += m.allMove ?? 0
    out.rangedRangeDelta += m.rangedRangeDelta ?? 0
    out.extraFires += m.extraFires ?? 0
  }
  return out
}

/**
 * Roll 1-2 distinct omens. `count` defaults to a weighted 1-or-2 (≈45%
 * chance of a second omen). At higher Ascension we want MORE omens for
 * spice, so callers can bump `count`. Pure-ish (uses Math.random) — the
 * caller should roll ONCE per battle and memoize.
 */
export function rollModifiers(count?: number): string[] {
  const pool = ALL_MODIFIER_IDS.slice()
  const n = count ?? (Math.random() < 0.45 ? 2 : 1)
  const picked: string[] = []
  for (let i = 0; i < n && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length)
    picked.push(pool.splice(idx, 1)[0])
  }
  return picked
}

export function modifierLabel(id: string): string {
  return MODIFIERS[id]?.name ?? id
}
