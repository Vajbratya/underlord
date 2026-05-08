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
  // v7 expansion — six new archetypes that diversify the late-game
  // roster. Each maps to an existing AttackKind so the battle engine
  // doesn't need new branches; they trade stats for distinct flavor +
  // sound + flash signatures.
  | 'behemoth'
  | 'spore'
  | 'oracle'
  | 'ravager'
  | 'wyrmling'
  | 'crowlord'
  // v8 expansion — eight more minion archetypes. Each maps to an existing
  // AttackKind so the engine doesn't need new branches; differentiation
  // comes from stats + voice/flash + flavor.
  | 'golem'      // pierce tank — slow but with line damage
  | 'gargoyle'   // flying basic — agile harasser
  | 'leech'      // melee siphon — small but heals on hit
  | 'succubus'   // ranged curse — debuffer
  | 'pyrelich'   // ranged splash — fire AOE caster
  | 'tidesinger' // ranged heal — water priestess
  | 'ratking'    // melee cleave — swarm leader, low HP, fast
  | 'thornbeast' // melee execute — bleeds out wounded prey

/**
 * Each archetype has a single distinguishing attack rule:
 *  - basic    : single target, full damage (heroes default).
 *  - cleave   : target full + adjacent enemies 50% (brown bruiser, ravager).
 *  - splash   : target full + all enemies within 1 hex of target 50% (red AOE, wyrmling).
 *  - execute  : single target, +50% damage if target HP < 40% (green assassin, wraith).
 *  - heal     : alternate action — restore 30% hpMax to ally (blue support).
 *  - pierce   : target full + tile beyond in attacker→target line 50% (grey siege, harpy).
 *  - curse    : ranged hex — full damage AND target's incoming damage +50% next round (bone, oracle, crowlord).
 *  - siphon   : melee — full damage AND attacker heals 30% of damage dealt (gorger, behemoth).
 *  - volley   : long-range AOE — target + every enemy within 2 hexes 50% (lich, spore).
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

  /* ---------- Elite (miniboss/boss) state ---------- */
  /** Set on hero units that are minibosses or bosses. Drives HUD badge,
   * stat boosts, and which passive the engine triggers. */
  eliteKind?: EliteKind
  /** ID into the elite passive registry. Only relevant when `eliteKind`
   * is set; ignored on regular heroes/minions. */
  passiveId?: ElitePassiveId
  /** True after a one-shot passive has fired (revive used, summon used,
   * enrage triggered, etc). Lets the engine guard against double-fire. */
  passiveFired?: boolean
  /** Set when `enrage` triggers — the engine multiplies outgoing ATK by
   * this value on every subsequent attack until end of battle. */
  enrageMult?: number
}

/* ---------- Elite enemies (mini-bosses & bosses) ---------- */

/**
 * Tier of a hero encounter. Affects stat scaling, entourage size, the HUD
 * badge, and which passive ID the engine looks up.
 *  - undefined: regular hero (current behavior).
 *  - 'miniboss': +35% HP/ATK, larger entourage, one passive, glowing accent badge.
 *  - 'boss':     +75% HP/ATK, two extra entourage slots, one passive, gold badge.
 */
export type EliteKind = 'miniboss' | 'boss'

/**
 * Discriminated union of unique elite passives. Each id is implemented in
 * `lib/underlord/elite-passives.ts` and triggered at well-known engine
 * hooks. New ids should always come with a no-op fallback so the engine
 * stays robust to old saves / typos in the hero catalog.
 */
export type ElitePassiveId =
  | 'thorns'         // reflects 30% of damage taken back to attacker
  | 'aura-rage'      // adjacent enemy heroes/minions deal +25% damage
  | 'enrage'         // when hero HP < 50%, gains +50% ATK permanently
  | 'phase'          // first hit per round is reduced to 1 damage
  | 'revive'         // first time the hero would die, revives at 50% HP
  | 'summon'         // when HP first crosses 50%, spawns 2 archetype minions
  | 'lifesteal'      // hero heals 25% of damage dealt back to itself
  | 'time-stop'      // when killing a minion, hero acts again immediately

/* ---------- Loot ---------- */

/** Loot rarity ladder. `legendary` was added in v6 — drops only from
 * boss-tier regions and the Black Market. Cursed/relic remain the bulk
 * of mid/late drops. */
export type LootRarity = 'common' | 'uncommon' | 'cursed' | 'relic' | 'legendary'

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
  /** Tag drives map layout pool, ground tinting, and HUD biome chip.
   * Three new biomes were added in v6: `tundra` (north of the tower,
   * frozen crusader-ground), `dunes` (Vael'Thrand's southern singing
   * desert), and `abyss` (the flooded base of the Subtower). */
  biome:
    | 'ash'
    | 'moor'
    | 'iron'
    | 'verdant'
    | 'crown'
    | 'tundra'
    | 'dunes'
    | 'abyss'
  x: number
  y: number
  links: string[]
  lore: string
  goldReward: number
  heroIds: string[]
  /** v8 — optional elite tier overlay. Heroes listed here spawn as
   * miniboss/boss with stat multipliers, HUD badge, and a `passiveId`
   * the engine reads from `lib/underlord/elite-passives.ts`. Heroes not
   * listed spawn as regular heroes. Save-safe: missing field = no elite. */
  eliteHeroes?: { id: string; kind: EliteKind; passiveId: ElitePassiveId }[]
  /** v8 — optional id into `SIGNATURE_MAPS` (lib/underlord/maps.ts). When
   * set, the region uses the bespoke XCOM-style hand-crafted map instead
   * of cycling through the biome pool. Falls back gracefully if unknown. */
  mapId?: string
  /** v9 — optional battle objective override. Default (`{kind:'rout'}`)
   * is the classic "kill every hero" win condition. Set to break the
   * monotony with defenses, holdouts, executions. Engine + HUD pick it
   * up automatically. Save-safe: missing field = rout. */
  objective?: BattleObjective
  /** Only loot-bearing regions drop equipment on victory. The others give
   * gold + XP only, so a true item haul becomes a campaign milestone. */
  dropsLoot: boolean
}

/* ---------- Battle objectives ---------- */

/**
 * v9 — Battle objective system. Default `rout` matches every existing
 * region (kill all heroes). Other kinds let the campaign break monotony
 * with defenses, holdouts, and executions. The engine reads these in
 * `computeDone()`; the HUD shows a banner with the goal text.
 *
 *   - rout         : kill every hero (current behavior).
 *   - survive      : last `rounds` rounds without losing the Overlord
 *                    or having all minions die.
 *   - assassinate  : kill ONLY `targetHeroId`. Other heroes can stay
 *                    alive — battle ends the moment the target dies.
 *   - protect      : same as `rout`, BUT if `protectId` (a minion or
 *                    the Overlord) dies, instant defeat regardless of
 *                    remaining heroes. Used for "escort" missions.
 *
 * The `targetHeroId` and `protectId` fields are interpreted differently
 * per kind so they can coexist in the same union without nesting.
 */
export type BattleObjective =
  | { kind: 'rout' }
  | { kind: 'survive'; rounds: number }
  | { kind: 'assassinate'; targetHeroId: string }
  | { kind: 'protect'; protectId: string }

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

  /* ---- Roguelite boons (Bençãos) ---- */
  /** Permanent buffs the Underlord has accumulated. Each victory rolls
   * 3 random unowned ids and the player commits to one. Stack
   * multiplicatively (HP/ATK) and additively (crit, lifesteal). */
  boons: string[]

  /* ---- Economy v2 — Soulshards & Black Market ---- */
  /** Soulshards: secondary currency. Earned by dismantling unwanted
   * loot, awarded as a consolation on every battle, and as a daily-login
   * bonus. Spent at the Black Market for guaranteed-rarity items. */
  soulshards: number
  /** ISO date (YYYY-MM-DD) of the last day the player claimed the
   * daily-login Soulshard pouch. Reset every UTC midnight. */
  lastShardClaimDay: string
  /** Item ids the player has already bought from today's Black Market
   * stock. Stops them from re-buying the same offer. Cleared each day
   * automatically when the BM rotates. */
  blackMarketBought: string[]
}
