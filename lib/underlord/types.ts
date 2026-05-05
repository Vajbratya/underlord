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

export type MinionArchetype =
  | 'brown'
  | 'red'
  | 'green'
  | 'blue'
  | 'grey'
  | 'bone'
  | 'harpy'
  | 'gorger'
  | 'wraith'
  | 'lich'

/**
 * Each archetype has a single distinguishing attack rule:
 *  - basic    : single target, full damage (heroes default).
 *  - cleave   : target full + adjacent enemies 50% (brown bruiser).
 *  - splash   : target full + all enemies within 1 hex of target 50% (red AOE).
 *  - execute  : single target, +50% damage if target HP < 40% (green assassin).
 *  - heal     : alternate action — restore 30% hpMax to ally (blue support).
 *  - pierce   : target full + tile beyond in attacker→target line 50% (grey siege).
 *  - curse    : ranged hex — full damage AND target's incoming damage +50% next round (bone).
 *  - siphon   : melee — full damage AND attacker heals 30% of damage dealt (gorger).
 *  - volley   : long-range AOE — target + every enemy within 2 hexes 50% (lich).
 */
export type AttackKind =
  | 'basic'
  | 'cleave'
  | 'splash'
  | 'execute'
  | 'heal'
  | 'pierce'
  | 'curse'
  | 'siphon'
  | 'volley'

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
  /** Underlord level required to unlock recruiting this archetype.
   * Tier 0 = available from start (the original five). Tier ≥ 4 = progression. */
  unlockTier: number
  /** True for units that ignore impassable terrain when moving (harpy, wraith,
   * bone — everything that floats or phases through walls). */
  flying?: boolean
  /** True for archetypes that have an active special targetable from the
   * battle UI (the original five). New archetypes are defined by their
   * attack kind alone — no special button needed. */
  hasActiveSpecial: boolean
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

  /* ---------- Active ability state ---------- */
  /** Cooldown counter (in rounds) until the special can be used again. */
  specialCd: number
  /** True once the unit has used a once-per-battle special. */
  specialSpent: boolean
  /** Multiplier applied to the next outgoing attack ONLY (e.g. 1.6 from Sombra). */
  nextAttackBonus?: number
  /** Multiplier applied to incoming damage (0..1; 0.5 = -50%). Lasts 1 round. */
  damageTakenMod?: number
  /** Forced target by Provocar; the AI will prefer this ID for one turn. */
  tauntedBy?: string
  /** True when this unit is a Muralha barrier (no actions, just walls a hex). */
  isBarrier?: boolean
  /** True for the player's Underlord avatar — if it dies, battle is lost. */
  isOverlord?: boolean
  /** True for flying units — they ignore terrain obstacles when pathing. */
  flying?: boolean

  /* ---------- Overlord skill state ---------- */
  /** Per-skill cooldown countdown (rounds) — only the Overlord uses this. */
  skillCooldowns?: Record<string, number>
  /** Per-skill once-per-battle spent flag — only the Overlord uses this. */
  skillSpent?: Record<string, boolean>
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
  /** Only loot-bearing regions drop equipment on victory. The others give
   * gold + XP only, so a true item haul becomes a campaign milestone. */
  dropsLoot: boolean
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

  /* ---- Forja (perk tree) ---- */
  /** Unspent perk points (gained 1 per Underlord level above 1). */
  perkPoints: number
  /** Highest level reached so far — used to know how many points to grant
   * across loads even if the player respecs. */
  highestLevel: number
  /** Map of perk id → invested rank. */
  perks: Record<string, number>

  /* ---- Recruitment (progressive minion roster) ---- */
  /** Archetype ids the Underlord has unlocked through level milestones.
   * The original five (brown, red, green, blue, grey) are always present. */
  unlockedArchetypes: string[]

  /* ---- Underlord skill loadout (alterable in the war room) ---- */
  /** Skill ids the Underlord has unlocked through level milestones. The
   * starter trio (bolt, command, aegis) is granted at level 1 and is
   * always present. */
  unlockedSkills: string[]
  /** Currently equipped skills (length capped at SKILL_SLOTS). Order
   * matters — slot 1, slot 2, slot 3 — so the in-battle button bar is
   * stable even after re-arranging the loadout. */
  equippedSkills: string[]
}
