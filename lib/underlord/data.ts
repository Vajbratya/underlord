import type {
  Boss,
  DreadSchool,
  Region,
  SpireRoom,
  SpireRoomId,
} from "./types"

/* ------------------------------------------------------------------ */
/* Lore strings                                                          */
/* ------------------------------------------------------------------ */

export const GAME_TITLE = "UNDERLORD"
export const GAME_SUBTITLE = "ASHES OF THE SUNKEN CROWN"

export const COLD_OPEN = [
  "Eight hundred and fourteen years.",
  "The Pact of Iron held the Vault shut while the world grew fat on its own peace.",
  "It cracked at dawn.",
  "You wake. The Crown remembers your name.",
]

/* ------------------------------------------------------------------ */
/* Dread schools (Underlord class)                                       */
/* ------------------------------------------------------------------ */

export const DREAD_SCHOOLS: Record<
  DreadSchool,
  {
    id: DreadSchool
    name: string
    epithet: string
    blurb: string
    pillar: string
    /** starting passive shown to player */
    passive: string
  }
> = {
  dominion: {
    id: "dominion",
    name: "DOMINION",
    epithet: "Voice of the Throne",
    blurb:
      "You command. Where you stand, fear becomes obedience. Recall the dead, extend your turn, dictate terms.",
    pillar: "Command",
    passive: "+1 order per turn. Fallen minions can be recalled once per battle.",
  },
  famine: {
    id: "famine",
    name: "FAMINE",
    epithet: "Hollow of the Ash",
    blurb:
      "You take. Life drains toward you. Curses spread along the dirt your enemies tread.",
    pillar: "Attrition",
    passive: "Adjacent enemies bleed 4 each turn. Curses on the ground last twice as long.",
  },
  sundering: {
    id: "sundering",
    name: "SUNDERING",
    epithet: "Throne of Cinders",
    blurb:
      "You break. Walls, oaths, armor. Cathedrals do not survive your arrival twice.",
    pillar: "Annihilation",
    passive: "Ignore 50% of armor. Critical hits chain to 1 adjacent target.",
  },
}

/* ------------------------------------------------------------------ */
/* Spire rooms                                                          */
/* ------------------------------------------------------------------ */

export const SPIRE_ROOMS: SpireRoom[] = [
  {
    id: "war-room",
    name: "WAR ROOM",
    blurb: "Strike, raze, parley. The map waits.",
    unlockCycle: 0,
    action: "open-overworld",
  },
  {
    id: "throne",
    name: "THRONE HALL",
    blurb: "Spend Crown Shards. Walk the talent web.",
    unlockCycle: 0,
    action: "open-talents",
  },
  {
    id: "pit",
    name: "THE PIT",
    blurb: "Birth minions. Splice broods. Mind the smell.",
    unlockCycle: 0,
    action: "stub",
  },
  {
    id: "forge",
    name: "FORGE",
    blurb: "Reroll, transmute, sharpen. Coin and ash.",
    unlockCycle: 1,
    action: "stub",
  },
  {
    id: "reliquary",
    name: "RELIQUARY",
    blurb: "Vault of artifacts. Loadouts and trophies.",
    unlockCycle: 1,
    action: "stub",
  },
  {
    id: "font",
    name: "FONT OF CINDERS",
    blurb: "Scour mutations. The water is not water.",
    unlockCycle: 2,
    action: "stub",
  },
  {
    id: "market",
    name: "BLACK MARKET",
    blurb: "Coin Houses sell to anyone. Especially you.",
    unlockCycle: 3,
    action: "stub",
  },
  {
    id: "echoes",
    name: "VAULT OF ECHOES",
    blurb: "Replay the slain. Score the cruelty.",
    unlockCycle: 5,
    action: "stub",
  },
]

export const SPIRE_ROOM_ORDER: SpireRoomId[] = SPIRE_ROOMS.map((r) => r.id)

/* ------------------------------------------------------------------ */
/* Ashfen Coast — first biome (M1 slice)                                 */
/* ------------------------------------------------------------------ */
/* axial layout (q,r). Hand-placed for a coast-and-keep silhouette.     */

export const ASHFEN_REGIONS: Region[] = [
  {
    id: "ashfen-1",
    name: "BLACKSAND LANDING",
    biome: "ashfen",
    faction: "wild",
    q: 0,
    r: 0,
    garrison: 1,
    lootTier: "common",
    blurb: "The first hex of dirt that remembers you. Tide retreats when you walk.",
  },
  {
    id: "ashfen-2",
    name: "GULL ROOST CHAPEL",
    biome: "ashfen",
    faction: "concord",
    q: 1,
    r: 0,
    garrison: 2,
    lootTier: "common",
    landmark: "Concord chapel",
    blurb: "Six priests. They sing because they cannot fight.",
  },
  {
    id: "ashfen-3",
    name: "DROWNED WAREHOUSE",
    biome: "ashfen",
    faction: "coin",
    q: 2,
    r: 0,
    garrison: 2,
    lootTier: "uncommon",
    blurb: "Coin House crates, half-submerged. Inventory lists drift on the foam.",
  },
  {
    id: "ashfen-4",
    name: "SALT-MIRE CROSSING",
    biome: "ashfen",
    faction: "wild",
    q: 0,
    r: 1,
    garrison: 3,
    lootTier: "common",
    blurb: "A causeway only useful at low tide. The mire eats the slow.",
  },
  {
    id: "ashfen-5",
    name: "REEK CANTON",
    biome: "ashfen",
    faction: "coin",
    q: 1,
    r: 1,
    garrison: 4,
    lootTier: "uncommon",
    blurb: "Black market off the docks. They will sell to the Underlord. They will name a price.",
  },
  {
    id: "ashfen-6",
    name: "BROKEN LIGHTHOUSE",
    biome: "ashfen",
    faction: "concord",
    q: 2,
    r: 1,
    garrison: 5,
    lootTier: "uncommon",
    landmark: "Lumen beacon",
    blurb: "Cracked lens still throws fire at sundown. Concord watches the coast from here.",
  },
  {
    id: "ashfen-7",
    name: "EMBER FLATS",
    biome: "ashfen",
    faction: "wild",
    q: -1,
    r: 1,
    garrison: 3,
    lootTier: "common",
    blurb: "Black glass underfoot. The flats hum at night.",
  },
  {
    id: "ashfen-8",
    name: "TIDESHACKLE PRISON",
    biome: "ashfen",
    faction: "concord",
    q: 0,
    r: 2,
    garrison: 6,
    lootTier: "cursed",
    landmark: "Concord oubliette",
    blurb: "Heretics chained at low tide. Drowned twice daily. Useful corpses.",
  },
  {
    id: "ashfen-9",
    name: "HOLLOW REEF",
    biome: "ashfen",
    faction: "wild",
    q: 1,
    r: 2,
    garrison: 5,
    lootTier: "cursed",
    blurb: "A dead leviathan calcified into geography. Its ribs make the only shelter.",
  },
  {
    id: "ashfen-10",
    name: "SUNKEN KEEP",
    biome: "ashfen",
    faction: "court",
    q: 2,
    r: 2,
    garrison: 7,
    lootTier: "relic",
    landmark: "Vault — Pre-Pact",
    blurb: "A keep that drowned with its banner up. The flag still waves underwater.",
  },
  {
    id: "ashfen-11",
    name: "CHAPEL OF NINE MOUTHS",
    biome: "ashfen",
    faction: "concord",
    q: 1,
    r: 3,
    garrison: 8,
    lootTier: "relic",
    landmark: "Boss site",
    bossId: "choir",
    blurb: "Where the Choir sings. The sound is louder than the building.",
  },
  {
    id: "ashfen-12",
    name: "PACT-IRON ANCHORAGE",
    biome: "ashfen",
    faction: "court",
    q: 2,
    r: 3,
    garrison: 9,
    lootTier: "mythic",
    landmark: "Boss site",
    bossId: "khor",
    blurb: "An anchor as tall as a watchtower. Khor sleeps with one hand on it.",
  },
]

/* ------------------------------------------------------------------ */
/* Bosses (M1 reachable)                                                 */
/* ------------------------------------------------------------------ */

export const BOSSES: Boss[] = [
  {
    id: "calden",
    name: "SAINT CALDEN",
    epithet: "Hammer of Dawn",
    region: "ashfen-6",
    gimmick:
      "Resurrects every 3 rounds unless his Reliquary is shattered first.",
  },
  {
    id: "choir",
    name: "THE CHOIR OF NINE MOUTHS",
    epithet: "One Voice, Nine Throats",
    region: "ashfen-11",
    gimmick: "Nine linked priests. Killing one buffs the rest.",
  },
  {
    id: "khor",
    name: "KHOR THE UNBROKEN",
    epithet: "Anchor of the Pact",
    region: "ashfen-12",
    gimmick:
      "Charges in straight lines. He can only be wounded mid-charge.",
  },
]

/* ------------------------------------------------------------------ */
/* Banners                                                              */
/* ------------------------------------------------------------------ */

export const BANNERS = {
  ember: { name: "EMBER", swatch: "var(--primary)" },
  crimson: { name: "CRIMSON", swatch: "var(--accent)" },
  ash: { name: "ASH", swatch: "var(--muted-foreground)" },
} as const

/* ------------------------------------------------------------------ */
/* Faction labels                                                       */
/* ------------------------------------------------------------------ */

export const FACTION_LABEL: Record<string, string> = {
  concord: "Lumen Concord",
  verdant: "Verdant Kin",
  coin: "Coin Houses",
  court: "Ash Court",
  wild: "Untended",
}

export const LOOT_TIER_LABEL: Record<string, string> = {
  common: "COMMON",
  uncommon: "UNCOMMON",
  cursed: "CURSED",
  relic: "RELIC",
  mythic: "MYTHIC",
}
