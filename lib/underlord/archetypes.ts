import type { Archetype, ArchetypeDef } from "./types"

/* ==========================================================================
 * Tier-1 minion archetypes — the five broods you can raise from the Pit.
 * ======================================================================= */

export const ARCHETYPES: Record<Archetype, ArchetypeDef> = {
  brown: {
    id: "brown",
    name: "BROWN",
    title: "Brawler Brood",
    glyph: "B",
    hp: 32,
    atk: 8,
    def: 4,
    speed: 4,
    range: 1,
    crit: 0.05,
    description:
      "Tanky. Greasy. Will cheerfully die for you. Forms shield walls when grouped.",
    signature:
      "PILE-ON: when 2+ Browns are adjacent to a target, +30% damage each.",
    bark: {
      idle: [
        "Boss boss boss boss",
        "I have eaten the table again, sorry.",
        "GRUNT (affectionate)",
        "Where do I stand. STAND ME.",
      ],
      attack: ["BONK", "AT-WILL EMPLOYMENT", "OW MY KNUCKLES", "TAXES"],
      death: ["My back!", "Tactical floor.", "Refund me."],
      victory: ["WE GOOD WE GOOD", "Brown-team strong!", "I have feelings now."],
    },
  },
  red: {
    id: "red",
    name: "RED",
    title: "Pyro Skirmisher",
    glyph: "R",
    hp: 18,
    atk: 11,
    def: 1,
    speed: 6,
    range: 2,
    crit: 0.15,
    description:
      "Squishy. Fiery. Lights things — and itself — on fire with equal enthusiasm.",
    signature:
      "IMMOLATE: ranged hits apply BURN (2 dmg/turn for 2 turns). Fire-immune.",
    bark: {
      idle: [
        "FIRE GOOD",
        "I am, statistically, on fire.",
        "ow. ow. ow.",
        "Combustible. Loyal.",
      ],
      attack: ["FWOOM!", "Have a flame!", "EAT IT!", "WARM REGARDS"],
      death: ["I am ash now.", "It went sideways.", "Cooled off."],
      victory: ["BURNT! BURNT! BURNT!", "I survived ME!"],
    },
  },
  green: {
    id: "green",
    name: "GREEN",
    title: "Stealth Assassin",
    glyph: "G",
    hp: 20,
    atk: 12,
    def: 2,
    speed: 8,
    range: 1,
    crit: 0.3,
    description:
      "Sneaky. Petty. Will absolutely backstab you at the office party.",
    signature: "BACKSTAB: 1.5× damage when attacking from a non-front facing.",
    bark: {
      idle: [
        "I am, in fact, behind you.",
        "Shh. Shh. Shh.",
        "I left the gas on. Theirs.",
        "I have receipts.",
      ],
      attack: ["BACKSTAB!", "A note from HR!", "SURPRISE BILL!", "Hi."],
      death: ["This was avoidable.", "Filing a complaint.", "Ow specifically."],
      victory: ["Plot twist: me!", "Untraceable.", "I'm not even tired."],
    },
  },
  blue: {
    id: "blue",
    name: "BLUE",
    title: "Sapper-Shaman",
    glyph: "U",
    hp: 22,
    atk: 6,
    def: 3,
    speed: 5,
    range: 2,
    crit: 0.05,
    description:
      "Damp. Diligent. The only one with a college degree. Heals adjacent allies.",
    signature:
      "RIVERMARK: ranged spell heals friendly target 6 HP. Once per battle, revives a fallen ally at 1 HP.",
    bark: {
      idle: [
        "I read the paperwork.",
        "Hydration is morale.",
        "I have a plan. It's wet.",
        "I miss my pond.",
      ],
      attack: ["TIDE!", "RECONSIDER!", "MIST AT YOU!"],
      death: ["I evaporate, mostly.", "This is fine.", "Shall not return."],
      victory: ["Hydration wins.", "I told you. I told you."],
    },
  },
  grey: {
    id: "grey",
    name: "GREY",
    title: "Siege Engineer",
    glyph: "S",
    hp: 24,
    atk: 9,
    def: 3,
    speed: 4,
    range: 3,
    crit: 0.1,
    description:
      "Practical. Soot-stained. Carries a wrench and grievances about the budget.",
    signature: "OVERCHARGE: ranged shots ignore 2 DEF. Crits splash adjacent hexes.",
    bark: {
      idle: [
        "Budget? What budget.",
        "I built this. I will unbuild this.",
        "Loud sigh.",
        "Who took the screws.",
      ],
      attack: ["TORQUE!", "Calibrating!", "BOLT!", "OSHA VIOLATION!"],
      death: ["Filed under: typical.", "I had warranty.", "Goodbye, void."],
      victory: ["Quote of the day: I knew it.", "Send invoice."],
    },
  },
}

export const ARCHETYPE_LIST: ArchetypeDef[] = [
  ARCHETYPES.brown,
  ARCHETYPES.red,
  ARCHETYPES.green,
  ARCHETYPES.blue,
  ARCHETYPES.grey,
]

/** CSS variable per archetype for sprite tint. */
export const ARCHETYPE_TINT: Record<Archetype, string> = {
  brown: "oklch(0.55 0.10 60)",
  red: "oklch(0.62 0.22 25)",
  green: "oklch(0.62 0.16 145)",
  blue: "oklch(0.6 0.14 230)",
  grey: "oklch(0.62 0.02 60)",
}

/** Recruiting cost from the Pit. */
export const ARCHETYPE_COST: Record<Archetype, number> = {
  brown: 30,
  red: 50,
  green: 60,
  blue: 70,
  grey: 65,
}
