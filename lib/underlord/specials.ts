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

/** Only the original five archetypes have active specials. New archetypes
 * (bone, harpy, gorger, wraith, lich) express their identity through their
 * attack kind alone — no separate ability button. */
export const SPECIALS: Partial<Record<MinionArchetype, SpecialDef>> = {
  brown: {
    id: 'brown',
    name: 'PROVOCAR',
    short: 'TAUNT',
    cost: 'action',
    cooldown: 2,
    uses: 0,
    range: 0,
    target: 'self',
    text:
      'Ruge. Reduz em 65% o dano recebido até o próximo turno. TODO inimigo a 3 hexes é forçado a atacá-lo.',
  },
  red: {
    id: 'red',
    name: 'INFERNO',
    short: 'INFERNO',
    cost: 'action',
    cooldown: 3,
    uses: 0,
    range: 4,
    target: 'free-hex',
    text:
      'Acende um hex livre em alc 4. Quem pisar lá sofre 110% do ATK por turno. Dura 3 rodadas.',
  },
  green: {
    id: 'green',
    name: 'SOMBRA',
    short: 'SOMBRA',
    cost: 'move',
    cooldown: 2,
    uses: 0,
    range: 5,
    target: 'free-hex',
    text:
      'Mergulha nas sombras até 5 hexes. O próximo ataque deste turno causa +130% de dano. Reposicionamento brutal.',
  },
  blue: {
    id: 'blue',
    name: 'RENASCER',
    short: 'RENASC',
    cost: 'action',
    cooldown: 5,
    uses: 1,
    range: 3,
    target: 'fallen-ally',
    text:
      'Chama um aliado caído em alc 3 de volta com 80% do HP máximo. Uma vez por batalha.',
  },
  grey: {
    id: 'grey',
    name: 'MURALHA',
    short: 'MURALHA',
    cost: 'action',
    cooldown: 3,
    uses: 0,
    range: 4,
    target: 'free-hex',
    text:
      'Levanta uma muralha de pedra (110 HP) em um hex livre em alc 4. Bloqueia movimento e tiros.',
  },
}

export const BARRIER_HP = 110
