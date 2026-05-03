import type { RegionDef } from "./types"

/* ===========================================================================
 * Vael'Thrand world map — vertical slice (10 regions across 3 biomes).
 * Coordinates (x, y) are 0-100 percentages on the parchment map.
 * ======================================================================== */

export const REGIONS: RegionDef[] = [
  /* ---------------- VAULT CROWN (start) ----------------------------- */
  {
    id: "vault-gate",
    name: "The Cracked Vault",
    subtitle: "Your tomb. Now drafty.",
    biome: "vault",
    difficulty: 1,
    x: 12,
    y: 78,
    prereqs: [],
    enemies: ["intern", "intern"],
    loreSnippet:
      "The Pact of Iron has fissured. Two Concord interns were sent to investigate. Neither was paid for the trip.",
    rewardGold: 30,
    rewardShards: 0,
  },

  /* ---------------- HOLLOW MOOR ------------------------------------- */
  {
    id: "moor-shrine",
    name: "Smugford-on-Wold",
    subtitle: "Population: 412. Insufferable: 412.",
    biome: "moor",
    difficulty: 2,
    x: 28,
    y: 60,
    prereqs: ["vault-gate"],
    enemies: ["smug", "intern", "intern"],
    loreSnippet:
      "A village whose mayor sells signed copies of his autobiography to anyone who hasn't had a chance to refuse.",
    rewardGold: 55,
    rewardShards: 1,
  },
  {
    id: "moor-courthouse",
    name: "The Lawful District",
    subtitle: "All paperwork is, technically, weaponized.",
    biome: "moor",
    difficulty: 2,
    x: 42,
    y: 70,
    prereqs: ["moor-shrine"],
    enemies: ["auditor", "reginald", "intern"],
    loreSnippet:
      "Concord legal outpost. Every door requires a stamp. Every stamp requires another stamp.",
    rewardGold: 70,
    rewardShards: 1,
    guaranteedLoot: "loot-receipt-of-pain",
  },

  /* ---------------- IRON REACH ------------------------------------- */
  {
    id: "iron-foundry",
    name: "The Refund Foundry",
    subtitle: "Where complaints are forged into weapons.",
    biome: "iron",
    difficulty: 3,
    x: 58,
    y: 78,
    prereqs: ["moor-courthouse"],
    enemies: ["karen", "auditor", "intern", "intern"],
    loreSnippet:
      "The Coin Houses smelt grievances for export. The smelting is, in fact, the grievance.",
    rewardGold: 100,
    rewardShards: 1,
  },
  {
    id: "iron-toll",
    name: "Tollhouse of Hindsight",
    subtitle: "They knew you were coming. They told everyone.",
    biome: "iron",
    difficulty: 3,
    x: 70,
    y: 62,
    prereqs: ["iron-foundry"],
    enemies: ["hindsight", "hindsight", "reginald"],
    loreSnippet:
      "Three Captains Hindsight live here. They have been writing memoirs about you since before you were resurrected.",
    rewardGold: 110,
    rewardShards: 2,
    guaranteedLoot: "loot-i-told-you-so",
  },

  /* ---------------- VERDANT SPINE ----------------------------------- */
  {
    id: "verdant-grove",
    name: "The Goodguy Grove",
    subtitle: "Suspiciously well-lit. Sponsored.",
    biome: "verdant",
    difficulty: 3,
    x: 30,
    y: 38,
    prereqs: ["moor-shrine"],
    enemies: ["goodguy", "smug", "intern"],
    loreSnippet:
      "A clearing that has been featured in seventeen ballads, each more wholesome than the last. The trees here are unionized.",
    rewardGold: 90,
    rewardShards: 1,
  },

  /* ---------------- ASHFEN COAST ----------------------------------- */
  {
    id: "ashfen-port",
    name: "Port Suffrage",
    subtitle: "All vote. Few survive the second round.",
    biome: "ashfen",
    difficulty: 4,
    x: 78,
    y: 42,
    prereqs: ["iron-toll"],
    enemies: ["saintly", "auditor", "karen", "reginald"],
    loreSnippet:
      "The Coin Houses' deep-water port. Seagulls here can read.",
    rewardGold: 140,
    rewardShards: 2,
  },

  /* ---------------- BOSS: HOLLOW MOOR FINALE ------------------------ */
  {
    id: "moor-cathedral",
    name: "The Cathedral of Self-Promotion",
    subtitle: "Saint Calden is preaching. Again.",
    biome: "moor",
    difficulty: 5,
    x: 50,
    y: 24,
    prereqs: ["verdant-grove", "iron-toll"],
    enemies: ["calden", "saintly", "intern"],
    isBoss: true,
    bossId: "calden",
    loreSnippet:
      "Saint Calden's main pulpit. He has commissioned 38 portraits of himself in this room alone. The 39th is mid-stroke.",
    rewardGold: 250,
    rewardShards: 3,
    guaranteedLoot: "loot-hammer-of-dawn",
  },

  /* ---------------- ENDGAME PROMISE -------------------------------- */
  {
    id: "vault-crown",
    name: "The Sunken Crown",
    subtitle: "It hums when you approach. Worrying.",
    biome: "vault",
    difficulty: 5,
    x: 88,
    y: 12,
    prereqs: ["moor-cathedral", "ashfen-port"],
    enemies: ["calden", "saintly", "hindsight", "auditor"],
    isBoss: true,
    bossId: "calden",
    loreSnippet:
      "[Endgame placeholder — the actual Pact-Iron encounter requires the full Act IV implementation.]",
    rewardGold: 500,
    rewardShards: 5,
  },
]

export const REGION_BY_ID: Record<string, RegionDef> = Object.fromEntries(
  REGIONS.map((r) => [r.id, r]),
)

export const BIOME_TONE: Record<RegionDef["biome"], { hex: string; label: string; vibe: string }> = {
  ashfen: {
    hex: "var(--color-accent)",
    label: "ASHFEN COAST",
    vibe: "Black-sand shores. Volcanic. Damp.",
  },
  moor: {
    hex: "var(--color-muted-foreground)",
    label: "HOLLOW MOOR",
    vibe: "Mist, ruined chapels, smug villages.",
  },
  iron: {
    hex: "var(--color-primary)",
    label: "IRON REACH",
    vibe: "Foundries, suppression fields, taxes.",
  },
  verdant: {
    hex: "var(--color-shard)", // gold-ish — visible on dark bg
    label: "VERDANT SPINE",
    vibe: "Old-growth canopy. Druids. Wolves.",
  },
  vault: {
    hex: "var(--color-destructive)",
    label: "VAULT CROWN",
    vibe: "Your seat. Your throne. Your problem.",
  },
}
