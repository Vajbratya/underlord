/* ==========================================================================
 * UNDERLORD — unified domain types
 * Old (M1 vertical slice: title/creator/spire/overworld) + New (battle, loot,
 * minions, heroes, comedy) live here together.
 * ======================================================================= */

/* ---------------- Player class / identity (M1) -------------------- */

export type DreadSchool = "dominion" | "famine" | "sundering"
export type Banner = "ember" | "crimson" | "ash"

export type Phase =
  | "title"
  | "creator"
  | "spire"
  | "overworld"
  | "battle"
  | "post-battle"

export type Faction = "concord" | "verdant" | "coin" | "court" | "wild"

export type Biome = "ashfen" | "moor" | "iron" | "spine" | "vault"

export type LootTier = "common" | "uncommon" | "cursed" | "relic" | "mythic"

/** String id for one of the five base broods. */
export type Archetype = "brown" | "red" | "green" | "blue" | "grey"

export type LootSlot = "helm" | "weapon" | "trinket"

export type StatusId =
  | "burn"
  | "bleed"
  | "poison"
  | "marked"
  | "shielded"
  | "rooted"
  | "smug"
  | "monologuing"

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

/* ---------------- Region (overworld hex node) --------------------- */

export interface Region {
  id: string
  name: string
  biome: Biome
  faction: Faction
  q: number
  r: number
  garrison: number
  lootTier: LootTier
  landmark?: string
  blurb: string
  bossId?: string
  /** Heroes that defend this hex when raided. */
  enemies?: HeroId[]
  rewardGold?: number
  rewardShards?: number
  guaranteedLoot?: string
}

export interface Boss {
  id: string
  name: string
  epithet: string
  region: string
  gimmick: string
}

/* ---------------- Underlord & resources --------------------------- */

export interface Underlord {
  name: string
  school: DreadSchool
  banner: Banner
  level: number
  shards: number
}

export interface Resources {
  gold: number
  taint: number
  standing: number
  corrupted: number
}

/* ---------------- Spire rooms ------------------------------------- */

export type SpireRoomId =
  | "war-room"
  | "throne"
  | "pit"
  | "forge"
  | "reliquary"
  | "font"
  | "market"
  | "echoes"

export interface SpireRoom {
  id: SpireRoomId
  name: string
  blurb: string
  unlockCycle: number
  action?: "open-overworld" | "open-talents" | "stub"
}

/* ---------------- Combat numerics --------------------------------- */

export interface BaseStats {
  hp: number
  atk: number
  def: number
  speed: number
  range: number
  crit: number
}

export interface ArchetypeDef extends BaseStats {
  id: Archetype
  name: string
  title: string
  glyph: string
  description: string
  signature: string
  bark: { idle: string[]; attack: string[]; death: string[]; victory: string[] }
}

export interface Hero extends BaseStats {
  id: HeroId
  name: string
  title: string
  glyph: string
  isBoss: boolean
  signature: string
  quotes: { entrance: string[]; attack: string[]; death: string[]; kill: string[] }
}

/* ---------------- Loot -------------------------------------------- */

export interface LootDef {
  id: string
  slot: LootSlot
  name: string
  rarity: LootTier
  taint: number
  flavor: string
  mods: Partial<Pick<BaseStats, "hp" | "atk" | "def" | "speed" | "range" | "crit">>
}

/* ---------------- Squad ------------------------------------------- */

export interface MinionInstance {
  id: string
  archetype: Archetype
  name: string
  alive: boolean
  level: number
  xp: number
  taint: number
  loot: Partial<Record<LootSlot, string>>
  mutations: string[]
}

/* ---------------- Battle ------------------------------------------ */

export interface HexCoord {
  q: number
  r: number
}

export type Side = "player" | "enemy"

export interface StatusEffect {
  id: StatusId
  stacks: number
  ttl: number
}

export interface BattleUnit extends BaseStats {
  uid: string
  side: Side
  kind: "minion" | "underlord" | "hero"
  archetype?: Archetype
  heroId?: HeroId
  name: string
  title: string
  glyph: string
  hp: number
  maxHp: number
  pos: HexCoord
  hasActed: boolean
  status: StatusEffect[]
  /** Reference back to MinionInstance.id so we can apply death/xp post-battle. */
  sourceId?: string
}

export type BattlePhase =
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
  phase: BattlePhase
  /** Initiative order — array of unit uids. */
  order: string[]
  /** Index into `order` for whose turn it is. */
  orderIdx: number
  selectedUid: string | null
  log: BattleLogEntry[]
  rewards: { gold: number; shards: number; loot: string[]; xp: number } | null
}

/* ---------------- Save state -------------------------------------- */

export interface SaveState {
  version: number
  underlord: Underlord
  resources: Resources
  regionCorruption: Record<string, number>
  spireRooms: Record<SpireRoomId, boolean>
  cycle: number
  position: string | null
  createdAt: number
  lastPlayed: number
  /** Squad — at most 4 fight at a time; here we store all owned minions. */
  squad: MinionInstance[]
  /** Unequipped loot (ids referencing LOOT_CATALOG). */
  stash: string[]
  /** Region ids fully cleared. */
  cleared: string[]
  battles: number
  totalKills: number
  totalDeaths: number
}

/* ---------------- Helpers ----------------------------------------- */

export const LOOT_SLOTS: LootSlot[] = ["helm", "weapon", "trinket"]

export const RARITY_TONE: Record<LootTier, string> = {
  common: "text-muted-foreground border-muted",
  uncommon: "text-foreground border-foreground/40",
  cursed: "text-primary border-primary/60",
  relic: "text-accent border-accent",
  mythic: "text-[var(--gold)] border-[var(--gold)]",
}

export const RARITY_LABEL: Record<LootTier, string> = {
  common: "COMMON",
  uncommon: "UNCOMMON",
  cursed: "CURSED",
  relic: "RELIC",
  mythic: "MYTHIC",
}
