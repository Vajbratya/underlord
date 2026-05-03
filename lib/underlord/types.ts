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
  /** Single emoji or symbol for rendering. Acts as the unit "sprite" stand-in. */
  glyph: string
  /** Role description used in tooltips. */
  role: string
  /** Maximum HP. */
  hp: number
  /** Movement range in hexes per turn. */
  move: number
  /** Attack damage at base. */
  atk: number
  /** Attack range in hexes (1 = melee). */
  range: number
  /** Initiative (higher acts first). */
  spd: number
  /** Color token used for the chip and HP bar. */
  tone: 'primary' | 'destructive' | 'accent' | 'gold' | 'foreground'
  /** Short bio shown in roster panel. */
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
  /** True if already acted this turn. */
  acted: boolean
  /** True when dead — kept for animations until cleanup. */
  dead: boolean
  /** Optional equipped loot id. */
  equipped?: string
  /** Hero-specific: which heroId from flavor lib (taunt source). */
  heroId?: string
}

/* ---------- Loot ---------- */

export type LootRarity = 'common' | 'uncommon' | 'cursed' | 'relic'

export type LootItem = {
  id: string
  name: string
  rarity: LootRarity
  slot: 'helm' | 'weapon' | 'trinket'
  /** Stat deltas applied when equipped. */
  atkBonus?: number
  hpBonus?: number
  moveBonus?: number
  rangeBonus?: number
  spdBonus?: number
  /** Taint cost — mutates a unit if too high. */
  taint: number
  /** Flavor blurb. */
  flavor: string
}

/* ---------- Regions ---------- */

export type RegionStatus = 'available' | 'cleared' | 'locked'

export type Region = {
  id: string
  name: string
  /** Display title — short evocative phrase. */
  subtitle: string
  /** Stage difficulty (1-14, mapped to flavor heroes). */
  stage: number
  /** Dominant biome — drives the battle map background. */
  biome: 'ash' | 'moor' | 'iron' | 'verdant' | 'crown'
  /** Position on the world map (0-100 percent for SVG). */
  x: number
  y: number
  /** Connected regions — for adjacency lines. */
  links: string[]
  /** Lore blurb shown in the side panel. */
  lore: string
  /** Reward gold base. */
  goldReward: number
  /** Hero ids that defend this region (1-3). */
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
  fallen: string[] // unit ids that died
  killedHeroIds: string[]
  regionId: string
}

/* ---------- Save state ---------- */

export type SaveState = {
  version: number
  underlordName: string
  /** Permanent roster — all minions you've ever recruited that haven't died this run. */
  roster: Unit[]
  /** Selected squad for next battle (max 3). */
  squad: string[] // unit ids
  /** Region statuses. */
  regions: Record<string, RegionStatus>
  /** Inventory of loot not yet equipped. */
  inventory: LootItem[]
  /** Resources. */
  gold: number
  /** Total taint across active equipment. */
  taint: number
  /** Heroes (cuzões) defeated. */
  heroesKilled: string[]
  /** Run stats. */
  battlesWon: number
  battlesLost: number
}
