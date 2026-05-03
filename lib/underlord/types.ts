/* ===========================================================================
 * UNDERLORD — domain types
 * Single source of truth for archetypes, units, battles, save state.
 * ======================================================================== */

export type ArchetypeId = "brown" | "red" | "green" | "blue" | "grey"

export type Rarity = "common" | "uncommon" | "cursed" | "relic" | "mythic"

export type LootSlot = "helm" | "weapon" | "trinket"

export type UnderlordSlot =
  | "crown"
  | "mantle"
  | "gauntlet"
  | "sigil"
  | "tome"
  | "throneward"

export type StatusId =
  | "burn"
  | "bleed"
  | "poison"
  | "marked"
  | "shielded"
  | "rooted"
  | "smug"
  | "monologuing"

export interface StatusEffect {
  id: StatusId
  stacks: number
  ttl: number // turns remaining
}

export interface BaseStats {
  hp: number
  atk: number
  def: number
  speed: number
  range: number
  crit: number // 0..1
}

export interface Archetype extends BaseStats {
  id: ArchetypeId
  name: string
  title: string
  glyph: string
  description: string
  signature: string
  bark: { idle: string[]; attack: string[]; death: string[]; victory: string[] }
}

/* --------------------------------------------------------------------- */
/* Heroes (the assholes)                                                  */
/* --------------------------------------------------------------------- */

export type HeroId =
  | "reginald"
  | "smug"
  | "karen"
  | "intern"
  | "auditor"
  | "goodguy"
  | "hindsight"
  | "saintly"
  | "calden"

export interface Hero extends BaseStats {
  id: HeroId
  name: string
  title: string
  glyph: string
  isBoss: boolean
  signature: string
  quotes: { entrance: string[]; attack: string[]; death: string[]; kill: string[] }
}

/* --------------------------------------------------------------------- */
/* Loot                                                                   */
/* --------------------------------------------------------------------- */

export interface LootDef {
  id: string
  slot: LootSlot | UnderlordSlot
  name: string
  rarity: Rarity
  taint: number
  flavor: string
  forUnderlord?: boolean
  mods: Partial<Pick<BaseStats, "hp" | "atk" | "def" | "speed" | "range" | "crit">>
}

/* --------------------------------------------------------------------- */
/* Minion + Underlord persistence                                         */
/* --------------------------------------------------------------------- */

export interface MinionInstance {
  id: string
  archetype: ArchetypeId
  name: string
  alive: boolean
  level: number
  xp: number
  taint: number
  loot: Partial<Record<LootSlot, string>>
  mutations: string[]
}

export interface UnderlordState {
  name: string
  level: number
  shards: number
  taint: number
  standing: number
  gold: number
  artifacts: Partial<Record<UnderlordSlot, string>>
}

/* --------------------------------------------------------------------- */
/* Battle state                                                           */
/* --------------------------------------------------------------------- */

export type Side = "player" | "enemy"

export interface HexCoord {
  q: number
  r: number
}

export interface BattleUnit extends BaseStats {
  id: string
  side: Side
  kind: "minion" | "underlord" | "hero"
  archetype?: ArchetypeId
  heroId?: HeroId
  name: string
  title: string
  glyph: string
  hp: number
  maxHp: number
  pos: HexCoord
  hasActed: boolean
  status: StatusEffect[]
  sourceId?: string
}

export type Phase =
  | "deploy"
  | "player_turn"
  | "enemy_turn"
  | "resolving"
  | "victory"
  | "defeat"

export interface BattleLogEntry {
  id: string
  turn: number
  side: Side | "system"
  text: string
  tone: "info" | "good" | "bad" | "epic" | "snark"
}

export interface BattleState {
  regionId: string
  units: BattleUnit[]
  turn: number
  phase: Phase
  activeUnitId: string | null
  selectedUnitId: string | null
  log: BattleLogEntry[]
  rewards: { gold: number; shards: number; loot: string[] } | null
}

/* --------------------------------------------------------------------- */
/* Region (overworld)                                                     */
/* --------------------------------------------------------------------- */

export type Biome = "ashfen" | "moor" | "iron" | "verdant" | "vault"
export type RegionDifficulty = 1 | 2 | 3 | 4 | 5

export interface RegionDef {
  id: string
  name: string
  subtitle: string
  biome: Biome
  difficulty: RegionDifficulty
  x: number
  y: number
  prereqs: string[]
  enemies: HeroId[]
  isBoss?: boolean
  bossId?: HeroId
  loreSnippet: string
  rewardGold: number
  rewardShards: number
  guaranteedLoot?: string
}

/* --------------------------------------------------------------------- */
/* Save state                                                             */
/* --------------------------------------------------------------------- */

export interface SaveState {
  version: 1
  underlord: UnderlordState
  squad: string[]
  reserve: MinionInstance[]
  stash: string[]
  cleared: string[]
  currentRegion: string | null
  battles: number
  totalKills: number
  totalDeaths: number
  ending: "reclaimed" | "ascendant" | "hollow" | "pyrrhic" | null
}

/* --------------------------------------------------------------------- */
/* Helpers                                                                */
/* --------------------------------------------------------------------- */

export const LOOT_SLOTS: LootSlot[] = ["helm", "weapon", "trinket"]
export const UNDERLORD_SLOTS: UnderlordSlot[] = [
  "crown",
  "mantle",
  "gauntlet",
  "sigil",
  "tome",
  "throneward",
]

export const RARITY_ORDER: Rarity[] = [
  "common",
  "uncommon",
  "cursed",
  "relic",
  "mythic",
]

export const RARITY_TONE: Record<Rarity, string> = {
  common: "text-muted-foreground border-muted",
  uncommon: "text-foreground border-foreground/40",
  cursed: "text-primary border-primary/60",
  relic: "text-accent border-accent",
  mythic: "text-gold border-gold",
}

export const RARITY_LABEL: Record<Rarity, string> = {
  common: "COMMON",
  uncommon: "UNCOMMON",
  cursed: "CURSED",
  relic: "RELIC",
  mythic: "MYTHIC",
}
