/**
 * ASCENSÃO (v11) — the endgame replayability dial.
 *
 * Two stacking layers of optional difficulty:
 *   1. Ascension TIER (0..MAX) — a single integer the player ramps. Each
 *      tier makes every enemy tougher and every reward richer. You unlock
 *      the next tier by WINNING a battle at your current frontier tier.
 *   2. MALDIÇÕES (curses) — toggleable run modifiers. Each adds a specific
 *      twist (tankier heroes, faster heroes, etc.) in exchange for a fatter
 *      reward multiplier. Mix freely with the tier.
 *
 * The whole system resolves to one small struct (`AscensionMods`) that the
 * battle builder applies to enemy units and the loot/economy path applies
 * to rewards. Pure + save-safe: tier 0 with no curses == the base game.
 */

export const MAX_ASCENSION = 12

export type Curse = {
  id: string
  /** Display name (PT-BR). */
  name: string
  /** ≤4-char chip. */
  short: string
  /** One-line description. */
  desc: string
  /** Additive contribution to the enemy HP multiplier (0.2 = +20%). */
  enemyHp?: number
  /** Additive contribution to the enemy ATK multiplier. */
  enemyAtk?: number
  /** Flat extra movement granted to every enemy. */
  enemyMove?: number
  /** Additive contribution to the reward multiplier. */
  rewardMult?: number
}

/** The toggleable run modifiers. Kept small + punchy. */
export const CURSES: Record<string, Curse> = {
  ferro: {
    id: 'ferro',
    name: 'MALDIÇÃO DO FERRO',
    short: 'FER',
    desc: 'Heróis e chefes têm +30% de HP.',
    enemyHp: 0.3,
    rewardMult: 0.2,
  },
  furia: {
    id: 'furia',
    name: 'MALDIÇÃO DA FÚRIA',
    short: 'FÚR',
    desc: 'Heróis e chefes batem +30% mais forte.',
    enemyAtk: 0.3,
    rewardMult: 0.2,
  },
  pressa: {
    id: 'pressa',
    name: 'MALDIÇÃO DA PRESSA',
    short: 'PRE',
    desc: 'Todo inimigo anda +1 hex por turno.',
    enemyMove: 1,
    rewardMult: 0.25,
  },
  ganancia: {
    id: 'ganancia',
    name: 'PACTO DA GANÂNCIA',
    short: 'GAN',
    desc: '+70% de recompensa — mas heróis ganham +15% HP e ATK.',
    enemyHp: 0.15,
    enemyAtk: 0.15,
    rewardMult: 0.7,
  },
  enxame: {
    id: 'enxame',
    name: 'MALDIÇÃO DO ENXAME',
    short: 'ENX',
    desc: 'Heróis mais ágeis e duros: +20% HP, +1 movimento.',
    enemyHp: 0.2,
    enemyMove: 1,
    rewardMult: 0.3,
  },
  carniceiro: {
    id: 'carniceiro',
    name: 'MALDIÇÃO DO CARNICEIRO',
    short: 'CAR',
    desc: 'Sangue por sangue: heróis +40% ATK, mas paga em dobro.',
    enemyAtk: 0.4,
    rewardMult: 0.45,
  },
}

export const ALL_CURSE_IDS: string[] = Object.keys(CURSES)

export type AscensionMods = {
  /** Multiplier on enemy HP (and hpMax). */
  hp: number
  /** Multiplier on enemy ATK. */
  atk: number
  /** Flat extra movement granted to every enemy. */
  move: number
  /** Multiplier on gold / shard / loot-quality rewards. */
  reward: number
}

/** Fold a tier + a set of curse ids into a single AscensionMods struct. */
export function ascensionMods(tier: number, curses: string[] = []): AscensionMods {
  const t = Math.max(0, Math.min(MAX_ASCENSION, Math.floor(tier || 0)))
  // Per-tier curve: +12% enemy HP/ATK and +22% reward each step.
  let hp = 1 + t * 0.12
  let atk = 1 + t * 0.12
  let move = 0
  let reward = 1 + t * 0.22
  for (const id of curses ?? []) {
    const c = CURSES[id]
    if (!c) continue
    hp += c.enemyHp ?? 0
    atk += c.enemyAtk ?? 0
    move += c.enemyMove ?? 0
    reward += c.rewardMult ?? 0
  }
  return { hp, atk, move, reward }
}

/** Roman-ish label for a tier. Tier 0 reads as "BASE". */
export function ascensionLabel(tier: number): string {
  const t = Math.max(0, Math.min(MAX_ASCENSION, Math.floor(tier || 0)))
  if (t === 0) return 'BASE'
  return `ASCENSÃO ${toRoman(t)}`
}

function toRoman(n: number): string {
  const map: [number, string][] = [
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ]
  let out = ''
  let rem = n
  for (const [v, s] of map) {
    while (rem >= v) {
      out += s
      rem -= v
    }
  }
  return out
}

/** True when the mods do anything at all (used to show the HUD chip). */
export function ascensionActive(tier: number, curses: string[] = []): boolean {
  return (tier ?? 0) > 0 || (curses?.length ?? 0) > 0
}
