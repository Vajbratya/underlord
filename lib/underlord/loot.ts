import type { LootDef, LootTier } from "./types"

/* ==========================================================================
 * Loot catalog — every item roasts the previous owner.
 * ======================================================================= */

export const LOOT_CATALOG: Record<string, LootDef> = {
  /* --------------- HELMS --------------- */
  "loot-bucket": {
    id: "loot-bucket",
    slot: "helm",
    name: "Bucket of Ambition",
    rarity: "common",
    taint: 0,
    flavor:
      "It is a bucket. The previous owner called it a 'morion.' He died inside it.",
    mods: { def: 1 },
  },
  "loot-circlet": {
    id: "loot-circlet",
    slot: "helm",
    name: "Circlet of Public Speaking",
    rarity: "uncommon",
    taint: 0.2,
    flavor:
      "Worn by a paladin who said 'allow me to first thank' before every duel.",
    mods: { hp: 4, def: 1 },
  },
  "loot-told-you-so": {
    id: "loot-told-you-so",
    slot: "helm",
    name: "Helm of I Told You So",
    rarity: "cursed",
    taint: 0.6,
    flavor:
      "Wearer can hear, faintly, what other people regret. Useful! Maddening!",
    mods: { atk: 2, crit: 0.1 },
  },

  /* --------------- WEAPONS --------------- */
  "loot-rusty-claim": {
    id: "loot-rusty-claim",
    slot: "weapon",
    name: "Rusty Claim",
    rarity: "common",
    taint: 0,
    flavor:
      "Found beside a tax form filed in blood. Mostly the auditor's.",
    mods: { atk: 2 },
  },
  "loot-receipt": {
    id: "loot-receipt",
    slot: "weapon",
    name: "Receipt of Pain",
    rarity: "uncommon",
    taint: 0.3,
    flavor:
      "A shiv made of folded parchment. Cuts going IN and through legal review going OUT.",
    mods: { atk: 3, crit: 0.05 },
  },
  "loot-monologue": {
    id: "loot-monologue",
    slot: "weapon",
    name: "The Monologue Blade",
    rarity: "cursed",
    taint: 0.8,
    flavor:
      "Hums when held. Wants to explain itself. At length. While you fight.",
    mods: { atk: 4, crit: 0.1, speed: -1 },
  },
  "loot-hammer": {
    id: "loot-hammer",
    slot: "weapon",
    name: "Calden's Discount Hammer",
    rarity: "relic",
    taint: 1.2,
    flavor:
      "Mass-produced merch. The signature is a stamp. Still very heavy.",
    mods: { atk: 6, hp: 6 },
  },

  /* --------------- TRINKETS --------------- */
  "loot-loyalty": {
    id: "loot-loyalty",
    slot: "trinket",
    name: "Loyalty Card",
    rarity: "common",
    taint: 0,
    flavor:
      "Buy ten heroes, the eleventh corpse is free. Three stamps used.",
    mods: { speed: 1 },
  },
  "loot-virtue": {
    id: "loot-virtue",
    slot: "trinket",
    name: "Virtue Signal",
    rarity: "uncommon",
    taint: 0.3,
    flavor:
      "Glows brighter the more people are watching. Useless in the dark. Beloved at parties.",
    mods: { def: 2, hp: 4 },
  },
  "loot-podcast": {
    id: "loot-podcast",
    slot: "trinket",
    name: "Podcast Amulet",
    rarity: "cursed",
    taint: 0.7,
    flavor:
      "Whispers ad reads at irregular intervals. The wearer feels strangely informed.",
    mods: { atk: 2, speed: 1 },
  },
}

export const LOOT_LIST = Object.values(LOOT_CATALOG)

/* --------------------------------------------------------------------- */
/* Drop tables                                                            */
/* --------------------------------------------------------------------- */

const COMMONS = ["loot-bucket", "loot-rusty-claim", "loot-loyalty"]
const UNCOMMONS = ["loot-circlet", "loot-receipt", "loot-virtue"]
const CURSED = ["loot-told-you-so", "loot-monologue", "loot-podcast"]
const RELICS = ["loot-hammer"]

const TIER_TABLE: Record<LootTier, string[][]> = {
  common: [COMMONS, COMMONS, UNCOMMONS],
  uncommon: [COMMONS, UNCOMMONS, UNCOMMONS],
  cursed: [UNCOMMONS, CURSED, CURSED],
  relic: [CURSED, CURSED, RELICS],
  mythic: [CURSED, RELICS, RELICS],
}

/** Roll a loot id from a region's tier ceiling. */
export function rollLoot(tier: LootTier, rand = Math.random): string {
  const buckets = TIER_TABLE[tier]
  const bucket = buckets[Math.floor(rand() * buckets.length)]
  return bucket[Math.floor(rand() * bucket.length)]
}
