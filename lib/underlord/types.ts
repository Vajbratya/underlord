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

/**
 * Each archetype has a single distinguishing attack rule:
 *  - basic    : single target, full damage (heroes default).
 *  - cleave   : target full + adjacent enemies 50% (brown bruiser).
 *  - splash   : target full + all enemies within 1 hex of target 50% (red AOE).
 *  - execute  : single target, +50% damage if target HP < 40% (green assassin).
 *  - heal     : alternate action — restore 30% hpMax to ally (blue support).
 *  - pierce   : target full + tile beyond in attacker→target line 50% (grey siege).
 */
export type AttackKind = 'basic' | 'cleave' | 'splash' | 'execute' | 'heal' | 'pierce'

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
  /** What its attack does. */
  attackKind: AttackKind
  /** Short ability tag shown in UI (e.g. "CLIVA", "AOE"). */
  abilityTag: string
  /** Long-form description of the special. */
  abilityText: string
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
  /** True after the unit has acted (attacked / healed / waited). */
  acted: boolean
  /** True after the unit has moved (separate from acted — XCOM style). */
  moved: boolean
  dead: boolean
  /** Combat kind for outgoing attacks. */
  attackKind: AttackKind
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
