/**
 * Loot drop tables. Hand-rolled named items, not procedural affix slop.
 * Each item carries a Taint cost — power has a price.
 */

import type { LootItem, LootRarity } from './types'

export const LOOT_POOL: LootItem[] = [
  // ---- Common ----
  {
    id: 'rusty-pick',
    name: 'PICARETA ENFERRUJADA',
    rarity: 'common',
    slot: 'weapon',
    atkBonus: 1,
    taint: 0,
    flavor: 'Era de algum minerador. Agora é seu problema.',
  },
  {
    id: 'pot-helm',
    name: 'CAPACETE DE PANELA',
    rarity: 'common',
    slot: 'helm',
    hpBonus: 4,
    taint: 0,
    flavor: 'Cheira a sopa antiga. Funciona.',
  },
  {
    id: 'string-charm',
    name: 'AMULETO DE BARBANTE',
    rarity: 'common',
    slot: 'trinket',
    spdBonus: 1,
    taint: 0,
    flavor: 'A criança que fez isso vai ter um futuro brilhante. Talvez.',
  },

  // ---- Uncommon ----
  {
    id: 'butcher-cleaver',
    name: 'CUTELO DO AÇOUGUEIRO',
    rarity: 'uncommon',
    slot: 'weapon',
    atkBonus: 3,
    taint: 0.2,
    flavor: 'O açougueiro reclamou. Por menos de cinco segundos.',
  },
  {
    id: 'iron-circlet',
    name: 'CIRCLET DE FERRO',
    rarity: 'uncommon',
    slot: 'helm',
    hpBonus: 8,
    taint: 0.2,
    flavor: 'Aperta um pouco. Mantém a cabeça no lugar — literalmente.',
  },
  {
    id: 'crow-foot',
    name: 'PÉ-DE-CORVO ENCANTADO',
    rarity: 'uncommon',
    slot: 'trinket',
    moveBonus: 1,
    spdBonus: 1,
    taint: 0.3,
    flavor: 'Sussurra direções erradas, mas você anda mais rápido.',
  },

  // ---- Cursed ----
  {
    id: 'screaming-axe',
    name: 'MACHADO QUE GRITA',
    rarity: 'cursed',
    slot: 'weapon',
    atkBonus: 6,
    taint: 0.8,
    flavor: 'Não para de gritar. O que ele grita... é seu nome verdadeiro.',
  },
  {
    id: 'bone-crown',
    name: 'COROA DE OSSO MENOR',
    rarity: 'cursed',
    slot: 'helm',
    hpBonus: 12,
    atkBonus: 1,
    taint: 0.9,
    flavor: 'O ex-dono também era ambicioso. Veja onde acabou.',
  },
  {
    id: 'ember-eye',
    name: 'OLHO DE BRASA',
    rarity: 'cursed',
    slot: 'trinket',
    rangeBonus: 1,
    atkBonus: 2,
    taint: 1.0,
    flavor: 'Vê três segundos no futuro. Geralmente, três segundos ruins.',
  },

  // ---- Relic ----
  {
    id: 'sundering-blade',
    name: 'LÂMINA DO ROMPIMENTO',
    rarity: 'relic',
    slot: 'weapon',
    atkBonus: 10,
    taint: 1.4,
    flavor: 'Cortou uma profecia em duas. A profecia ainda não percebeu.',
  },
  {
    id: 'pact-mantle',
    name: 'MANTO DO PACTO',
    rarity: 'relic',
    slot: 'helm',
    hpBonus: 18,
    spdBonus: 1,
    taint: 1.6,
    flavor: 'Os outros seis Underlords usaram. Você é o primeiro a sair vivo dele.',
  },
  {
    id: 'sigil-of-cinders',
    name: 'SIGILO DAS CINZAS',
    rarity: 'relic',
    slot: 'trinket',
    atkBonus: 4,
    rangeBonus: 1,
    moveBonus: 1,
    taint: 2.0,
    flavor: 'Toda vez que você bate, sente um pouco do reino também.',
  },
]

/** Pick `count` items biased by region tier. Higher tier = better drops. */
export function rollLoot(stage: number, count: number): LootItem[] {
  const pool = LOOT_POOL.slice()
  const tier =
    stage >= 12
      ? ['cursed', 'cursed', 'relic']
      : stage >= 8
        ? ['uncommon', 'cursed', 'cursed']
        : stage >= 4
          ? ['common', 'uncommon', 'cursed']
          : ['common', 'common', 'uncommon']
  const out: LootItem[] = []
  for (let i = 0; i < count; i++) {
    const want = tier[Math.floor(Math.random() * tier.length)] as LootRarity
    const candidates = pool.filter((p) => p.rarity === want)
    const pick = candidates[Math.floor(Math.random() * candidates.length)]
    if (pick) out.push(pick)
  }
  return out
}

export const RARITY_LABEL: Record<LootRarity, string> = {
  common: 'COMUM',
  uncommon: 'INCOMUM',
  cursed: 'AMALDIÇOADO',
  relic: 'RELÍQUIA',
}

export const RARITY_TONE: Record<
  LootRarity,
  'foreground' | 'accent' | 'destructive' | 'gold'
> = {
  common: 'foreground',
  uncommon: 'accent',
  cursed: 'destructive',
  relic: 'gold',
}
