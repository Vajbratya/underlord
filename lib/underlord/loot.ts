import type { LootDef } from "./types"

/* ===========================================================================
 * Loot catalog — hand-designed, named, comedic.
 * All flavor text roasts the previous owner.
 * ======================================================================== */

export const LOOT_CATALOG: Record<string, LootDef> = {
  /* --------------- MINION HELMS --------------- */
  "loot-bucket-of-ambition": {
    id: "loot-bucket-of-ambition",
    slot: "helm",
    name: "Bucket of Ambition",
    rarity: "common",
    taint: 0,
    flavor: "It is a bucket. The previous owner called it a 'morion.' He died inside it.",
    mods: { def: 1 },
  },
  "loot-circlet-of-public-speaking": {
    id: "loot-circlet-of-public-speaking",
    slot: "helm",
    name: "Circlet of Public Speaking",
    rarity: "uncommon",
    taint: 0.2,
    flavor: "Worn by a paladin who said 'allow me to first thank' before every duel.",
    mods: { hp: 4, def: 1 },
  },
  "loot-i-told-you-so": {
    id: "loot-i-told-you-so",
    slot: "helm",
    name: "Helm of I Told You So",
    rarity: "cursed",
    taint: 0.6,
    flavor: "Wearer can hear, faintly, what other people regret. Useful! Maddening!",
    mods: { atk: 2, crit: 0.1 },
  },

  /* --------------- MINION WEAPONS --------------- */
  "loot-rusty-claim": {
    id: "loot-rusty-claim",
    slot: "weapon",
    name: "Rusty Claim",
    rarity: "common",
    taint: 0,
    flavor: "Found beside a tax form filed in blood. Mostly the auditor's.",
    mods: { atk: 2 },
  },
  "loot-receipt-of-pain": {
    id: "loot-receipt-of-pain",
    slot: "weapon",
    name: "Receipt of Pain",
    rarity: "uncommon",
    taint: 0.3,
    flavor: "A shiv made of folded parchment. It cuts going IN and going through legal review on the way out.",
    mods: { atk: 3, crit: 0.05 },
  },
  "loot-monologue-blade": {
    id: "loot-monologue-blade",
    slot: "weapon",
    name: "The Monologue Blade",
    rarity: "cursed",
    taint: 0.8,
    flavor: "Hums when held. Wants to explain itself. At length. While you fight.",
    mods: { atk: 4, crit: 0.1, speed: -1 },
  },
  "loot-hammer-of-dawn": {
    id: "loot-hammer-of-dawn",
    slot: "weapon",
    name: "Calden's Discount Hammer",
    rarity: "relic",
    taint: 1.2,
    flavor: "Mass-produced merch. The signature is a stamp. It is, somehow, still very heavy.",
    mods: { atk: 6, hp: 6 },
  },

  /* --------------- MINION TRINKETS --------------- */
  "loot-loyalty-card": {
    id: "loot-loyalty-card",
    slot: "trinket",
    name: "Loyalty Card",
    rarity: "common",
    taint: 0,
    flavor: "Buy ten heroes, the eleventh corpse is free. Three stamps used.",
    mods: { speed: 1 },
  },
  "loot-virtue-signal": {
    id: "loot-virtue-signal",
    slot: "trinket",
    name: "Virtue Signal",
    rarity: "uncommon",
    taint: 0.3,
    flavor: "Glows brighter the more people are watching. Useless in the dark. Beloved at parties.",
    mods: { def: 2, hp: 4 },
  },
  "loot-podcast-amulet": {
    id: "loot-podcast-amulet",
    slot: "trinket",
    name: "Podcast Amulet",
    rarity: "cursed",
    taint: 0.7,
    flavor: "Whispers ad reads at irregular intervals. The wearer feels strangely informed.",
    mods: { atk: 2, speed: 1 },
  },

  /* --------------- UNDERLORD ARTIFACTS --------------- */
  "art-hollow-cradle": {
    id: "art-hollow-cradle",
    slot: "mantle",
    name: "The Hollow Cradle",
    rarity: "mythic",
    taint: 1.5,
    forUnderlord: true,
    flavor: "First minion to fall in your service is reborn — Brown, eternal, faintly damp. They will remember you for it. They will not forgive you for it.",
    mods: { hp: 10, def: 2 },
  },
  "art-crown-spite": {
    id: "art-crown-spite",
    slot: "crown",
    name: "Crown of Petty Spite",
    rarity: "relic",
    taint: 1.0,
    forUnderlord: true,
    flavor: "Smaller than expected. That is, in fact, the point.",
    mods: { atk: 4, crit: 0.15 },
  },
}

export const LOOT_LIST = Object.values(LOOT_CATALOG)

/* --------------------------------------------------------------------- */
/* Drop tables                                                            */
/* --------------------------------------------------------------------- */

const COMMON_DROPS = [
  "loot-bucket-of-ambition",
  "loot-rusty-claim",
  "loot-loyalty-card",
]
const UNCOMMON_DROPS = [
  "loot-circlet-of-public-speaking",
  "loot-receipt-of-pain",
  "loot-virtue-signal",
]
const CURSED_DROPS = [
  "loot-i-told-you-so",
  "loot-monologue-blade",
  "loot-podcast-amulet",
]

/** Pick a random loot id by region difficulty. Higher diff → better odds. */
export function rollLoot(difficulty: number, rand = Math.random): string {
  const r = rand()
  // Difficulty 1-2: mostly commons
  // Difficulty 3:   commons + uncommons
  // Difficulty 4-5: chance of cursed
  if (difficulty <= 2) {
    if (r < 0.85) return pickFrom(COMMON_DROPS, rand)
    return pickFrom(UNCOMMON_DROPS, rand)
  }
  if (difficulty === 3) {
    if (r < 0.55) return pickFrom(COMMON_DROPS, rand)
    if (r < 0.92) return pickFrom(UNCOMMON_DROPS, rand)
    return pickFrom(CURSED_DROPS, rand)
  }
  // 4-5
  if (r < 0.25) return pickFrom(COMMON_DROPS, rand)
  if (r < 0.65) return pickFrom(UNCOMMON_DROPS, rand)
  return pickFrom(CURSED_DROPS, rand)
}

function pickFrom<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)]
}
