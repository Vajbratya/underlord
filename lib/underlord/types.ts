/**
 * UNDERLORD — core types.
 *
 * Universe: você é o Underlord ressuscitado, recuperando o reino de Vael'Thrand
 * dos heróis insuportáveis que invadiram a sua torre por séculos. Você comanda
 * minions em táticas turn-based em hex grid.
 */

/* ---------- Hex coords (axial) ---------- */

export type Axial = { q: number; r: number }

/* ---------- Units ---------- */

export type Faction = 'minion' | 'hero'

export type MinionArchetype = 'brown' | 'red' | 'green' | 'blue' | 'grey'

export type UnitTemplate = {
  archetype: MinionArchetype
  name: string
  glyph: string
  role: string
  hp: number
  move: number
  atk: number
  range: number
  spd: number
  tone: 'primary' | 'destructive' | 'accent' | 'gold' | 'foreground'
  flavor: string
}

export type Unit = {
  id: string
  templateId: MinionArchetype
  name: string
  glyph: string
  faction: Faction
  pos: Axial
  hp: number
  hpMax: number
  atk: number
  move: number
  range: number
  spd: number
  tone: 'primary' | 'destructive' | 'accent' | 'gold' | 'foreground'
  acted: boolean
  dead: boolean
  equipped?: string
  heroId?: string
}

/* ---------- Loot ---------- */

export type LootRarity = 'common' | 'uncommon' | 'cursed' | 'relic'

export type LootItem = {
  id: string
  name: string
  rarity: LootRarity
  slot: 'helm' | 'weapon' | 'trinket'
  atkBonus?: number
  hpBonus?: number
  moveBonus?: number
  rangeBonus?: number
  spdBonus?: number
  taint: number
  flavor: string
}

/* ---------- Regions ---------- */

export type RegionStatus = 'available' | 'cleared' | 'locked'

export type Region = {
  id: string
  name: string
  subtitle: string
  stage: number
  biome: 'ash' | 'moor' | 'iron' | 'verdant' | 'crown'
  x: number
  y: number
  links: string[]
  lore: string
  goldReward: number
  heroIds: string[]
}

/* ---------- Battle ---------- */

export type Phase =
  | 'title'
  | 'intro'
  | 'warroom'
  | 'briefing'
  | 'battle'
  | 'victory'
  | 'defeat'
  | 'loot'
  | 'spire'

export type BattleResult = {
  victory: boolean
  goldEarned: number
  loot: LootItem[]
  fallen: string[]
  killedHeroIds: string[]
  regionId: string
  comboHigh: number
  flawless: boolean
}

/* ---------- Save state ---------- */

export type SaveState = {
  version: number
  underlordName: string
  roster: Unit[]
  squad: string[]
  regions: Record<string, RegionStatus>
  inventory: LootItem[]
  gold: number
  taint: number
  heroesKilled: string[]
  battlesWon: number
  battlesLost: number

  /* ---- Meta progression (addiction hooks) ---- */
  /** Total Underlord XP. Level derived. */
  xp: number
  /** Daily streak counter. */
  dailyStreak: number
  /** Last day the player took an action (YYYY-MM-DD). */
  lastPlayedDay: string
  /** Highest combo achieved across all battles. */
  comboHigh: number
  /** Total heroes critted (for stat tracking). */
  critsLanded: number
  /** Battles since last rare-or-better drop (pity timer). */
  battlesSinceRare: number
  /** Unlocked achievement ids. */
  achievements: string[]
}
