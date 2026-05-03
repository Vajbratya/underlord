/**
 * Active special abilities — one per minion archetype, plus a barrier "unit"
 * type used by Grey's Muralha. Each special has a cost (action vs movement),
 * a cooldown in rounds, and a target shape. The targeting mode is interpreted
 * by the battle UI; the actual mutation lives in battle.ts.
 */

import type { MinionArchetype } from './types'

/** What clicking a hex during special-targeting mode means. */
export type SpecialTarget =
  | 'self' // No target — runs immediately on activation.
  | 'free-hex' // An empty in-bounds hex within range.
  | 'fallen-ally' // A dead ally (for revive).

export type SpecialCost = 'action' | 'move'

export type SpecialDef = {
  id: MinionArchetype // 1:1 with archetype for now
  name: string // PROVOCAR, INFERNO, SOMBRA, RENASCER, MURALHA
  short: string // 1-2 word UI label
  cost: SpecialCost // consumes which resource
  cooldown: number // rounds
  /** 0 means unlimited; 1 means once per battle. */
  uses: number
  /** Range in hexes from caster (0 = self). */
  range: number
  target: SpecialTarget
  /** Long-form tooltip. */
  text: string
}

export const SPECIALS: Record<MinionArchetype, SpecialDef> = {
  brown: {
    id: 'brown',
    name: 'PROVOCAR',
    short: 'TAUNT',
    cost: 'action',
    cooldown: 3,
    uses: 0,
    range: 0,
    target: 'self',
    text:
      'Ruge. Reduz em 50% o dano recebido até o próximo turno. Inimigos a 2 hexes são forçados a atacá-lo.',
  },
  red: {
    id: 'red',
    name: 'INFERNO',
    short: 'INFERNO',
    cost: 'action',
    cooldown: 4,
    uses: 0,
    range: 3,
    target: 'free-hex',
    text:
      'Acende um hex livre. Quem estiver lá no início do turno sofre 60% do ATK. Dura 2 rodadas.',
  },
  green: {
    id: 'green',
    name: 'SOMBRA',
    short: 'SOMBRA',
    cost: 'move',
    cooldown: 3,
    uses: 0,
    range: 4,
    target: 'free-hex',
    text:
      'Teletransporta até 4 hexes para um hex livre. O próximo ataque deste turno causa +60%.',
  },
  blue: {
    id: 'blue',
    name: 'RENASCER',
    short: 'RENASC',
    cost: 'action',
    cooldown: 6,
    uses: 1,
    range: 2,
    target: 'fallen-ally',
    text:
      'Toca um aliado caído em alc 2 e o ressuscita com 50% do HP máximo. Uma vez por batalha.',
  },
  grey: {
    id: 'grey',
    name: 'MURALHA',
    short: 'MURALHA',
    cost: 'action',
    cooldown: 4,
    uses: 0,
    range: 3,
    target: 'free-hex',
    text:
      'Levanta uma barreira de pedra (8 HP) em um hex livre em alc 3. Bloqueia movimento.',
  },
}

export const BARRIER_HP = 8
