import type { Hero, HeroId } from "./types"

/* ===========================================================================
 * The Heroes — every single one is an asshole.
 * They are the canonical antagonists of Vael'Thrand. They believe they are
 * the protagonists. They are wrong.
 * ======================================================================== */

export const HEROES: Record<HeroId, Hero> = {
  reginald: {
    id: "reginald",
    name: "Sir Reginald",
    title: "the Punctual",
    glyph: "R",
    isBoss: false,
    hp: 26,
    atk: 8,
    def: 5,
    speed: 5,
    range: 1,
    crit: 0.1,
    signature: "Arrives exactly on time. Every. Single. Round.",
    quotes: {
      entrance: [
        "I have BOOKED this fight for 4PM. It is now 4PM. Begin.",
        "Tardiness is a moral failing. Engage.",
        "I have a calendar invite from your future corpse.",
      ],
      attack: [
        "ON SCHEDULE!",
        "EFFICIENT!",
        "PER MY LAST EMAIL!",
        "Your KPI is dying!",
      ],
      death: [
        "This was not on the agenda.",
        "I will be five minutes late to my own funeral —",
        "I was supposed to retire in March.",
      ],
      kill: [
        "Cause of death: tardiness.",
        "Filed. Closed. Archived.",
        "Strike that from the record. Then unstrike it. I want it on record.",
      ],
    },
  },

  smug: {
    id: "smug",
    name: "Brother Smug",
    title: "von Holierthan",
    glyph: "S",
    isBoss: false,
    hp: 22,
    atk: 7,
    def: 4,
    speed: 4,
    range: 2,
    crit: 0.08,
    signature: "Heals adjacent allies +4/turn. Will mention this constantly.",
    quotes: {
      entrance: [
        "I have read MANY books. Have you read books.",
        "Bless you. Mostly conditionally.",
        "I'd love to chat but my faith is doing the heavy lifting.",
      ],
      attack: [
        "ENLIGHTENMENT!",
        "Ackshually—",
        "BOOK-THUMP!",
        "WELL, in MY translation —",
      ],
      death: [
        "I — I curated this moment poorly.",
        "Sigh. Anyway. Disappointing.",
        "Tell my podcast I loved them.",
      ],
      kill: [
        "I shall pray for you. Lightly. Insincerely.",
        "Logged. Monetized.",
        "That's a content piece, baby.",
      ],
    },
  },

  karen: {
    id: "karen",
    name: "Saint Karen",
    title: "of the Manager-Speak",
    glyph: "K",
    isBoss: false,
    hp: 30,
    atk: 9,
    def: 4,
    speed: 4,
    range: 1,
    crit: 0.12,
    signature: "Adjacent enemies suffer SMUG: -1 ATK while in her aura.",
    quotes: {
      entrance: [
        "I'd like to speak to your manager. Who is, regrettably, a void.",
        "Excuse ME. Excuse. ME.",
        "I have BEEN coming here since the second age and I have NEVER —",
      ],
      attack: [
        "I PAID FOR THIS!",
        "REVIEW!",
        "ONE STAR!",
        "CORPORATE WILL HEAR!",
      ],
      death: [
        "I would like — to speak — to your manager —",
        "This will be reflected in the survey.",
        "Comically reasonable last words coming",
      ],
      kill: [
        "And THAT'S why I always ask for the manager.",
        "Survey link forthcoming.",
        "Cancelled. Genuinely cancelled.",
      ],
    },
  },

  intern: {
    id: "intern",
    name: "The Unpaid",
    title: "Intern Paladin",
    glyph: "I",
    isBoss: false,
    hp: 18,
    atk: 6,
    def: 3,
    speed: 6,
    range: 1,
    crit: 0.06,
    signature: "Cheap. Eager. Plentiful. Concord deploys these by the dozen.",
    quotes: {
      entrance: [
        "Hi! Sorry! Hi! I'm — yes, hi —",
        "I haven't been paid in eleven months and YET",
        "Is this a culture interview or am I being stabbed",
      ],
      attack: [
        "Sorry! SWORD!",
        "AHHHH (bravely)",
        "I'm trying my BEST —",
        "TASK FORCE!",
      ],
      death: [
        "I never even got the merch.",
        "I had a stretch goal —",
        "I won't be putting this on my LinkedIn.",
      ],
      kill: [
        "Was that good? Like, professionally? Did I do good?",
        "Mention me in the recap. Just my first name. Just — Intern.",
      ],
    },
  },

  auditor: {
    id: "auditor",
    name: "The Auditor",
    title: "of Lawful Tax Evasion",
    glyph: "A",
    isBoss: false,
    hp: 24,
    atk: 8,
    def: 5,
    speed: 4,
    range: 2,
    crit: 0.1,
    signature:
      "MARK: each hit puts a MARKED stack on you. Marked targets take +1 dmg per stack.",
    quotes: {
      entrance: [
        "I am here on behalf of a numbered ledger.",
        "Receipts. Receipts. RECEIPTS.",
        "We will be revisiting fiscal year 802.",
      ],
      attack: [
        "DEDUCTION!",
        "AUDIT!",
        "CITED!",
        "YOU OWE BACK-INTEREST!",
      ],
      death: [
        "My filing cabinet — was — alphabetized —",
        "Schedule C: deceased.",
      ],
      kill: [
        "Item: 1 (one) corpse. Filed.",
        "Cross-reference: previous corpse.",
      ],
    },
  },

  goodguy: {
    id: "goodguy",
    name: "Goodman Goodfellow",
    title: "Goodguy III",
    glyph: "G",
    isBoss: false,
    hp: 28,
    atk: 9,
    def: 5,
    speed: 5,
    range: 1,
    crit: 0.1,
    signature: "Bonus damage vs. anything Concord has officially classified evil. Spoiler: that's you.",
    quotes: {
      entrance: [
        "Don't worry, ma'am, I'm a Good Guy. The G in Goodguy is silent. Like dignity.",
        "The Concord vetted me thoroughly. Ish.",
        "Aw shucks I just love virtue and merch.",
      ],
      attack: [
        "FOR JUSTICE™!",
        "GOOD-PUNCH!",
        "WHOLESOME STRIKE!",
        "RIGHTEOUS!",
      ],
      death: [
        "B-but I had so much more virtue to do —",
        "I'm a GOOD —",
        "Tell my brand —",
      ],
      kill: [
        "Aw shucks, that was a LIVE one!",
        "Wholesome moment! Clip it!",
        "Justice always wins! (Survivorship bias!)",
      ],
    },
  },

  hindsight: {
    id: "hindsight",
    name: "Captain Hindsight",
    title: "of the Order of Telling You So",
    glyph: "H",
    isBoss: false,
    hp: 20,
    atk: 9,
    def: 3,
    speed: 6,
    range: 3,
    crit: 0.18,
    signature:
      "Reaction shot: shoots a free arrow whenever an ally near him takes damage.",
    quotes: {
      entrance: [
        "You should NOT have done that. (referring to: existing)",
        "Listen, in MY opinion, retroactively —",
        "I called it. I literally called it.",
      ],
      attack: [
        "TOLD YOU!",
        "AS PREDICTED!",
        "OBVIOUS IN HINDSIGHT!",
        "SEE?!",
      ],
      death: [
        "I should have — predicted — this —",
        "Statistically I — was — owed —",
      ],
      kill: [
        "Saw it coming. Wrote a blog post. (Drafts.)",
        "I'm not an 'I told you so' guy but. I told you so.",
      ],
    },
  },

  saintly: {
    id: "saintly",
    name: "High Inquisitor",
    title: "Annoying",
    glyph: "Q",
    isBoss: false,
    hp: 28,
    atk: 10,
    def: 6,
    speed: 4,
    range: 1,
    crit: 0.15,
    signature: "Adjacent allies are immune to status. Will lecture about this.",
    quotes: {
      entrance: [
        "I have questions. Many. The questions are not the issue. The issue is YOU.",
        "Per Concord doctrine subsection sub-subsection sub —",
        "I'd love to chat but I'm busy being correct.",
      ],
      attack: [
        "QUESTIONED!",
        "INTERROGATED!",
        "FOOTNOTE STRIKE!",
        "DOCTRINE!",
      ],
      death: [
        "I had — three more — clauses —",
        "There was a procedure for this and I IGNORED IT —",
      ],
      kill: [
        "Standard outcome. Standard procedure.",
        "Doctrine: validated.",
      ],
    },
  },

  /* ----------------- BOSS: SAINT CALDEN, HAMMER OF DAWN ------------- */
  calden: {
    id: "calden",
    name: "Saint Calden",
    title: "the Hammer of Dawn",
    glyph: "C",
    isBoss: true,
    hp: 90,
    atk: 14,
    def: 7,
    speed: 5,
    range: 1,
    crit: 0.2,
    signature:
      "RELIQUARY: while it stands, Calden revives at 50% HP every 3 rounds. Kill the Reliquary first, idiot.",
    quotes: {
      entrance: [
        "I rise with the sun! Which I assume rises FOR me!",
        "I have killed forty-two of your kind. Forty-three is just a Tuesday.",
        "My Reliquary, my Reliquary! It does the resurrecting! Try keeping up!",
        "I am the Hammer of Dawn. The Dawn is, frankly, optional.",
      ],
      attack: [
        "DAWN-HAMMER!",
        "FOR SUNRISE™!",
        "RIGHTEOUS BONK!",
        "ASCEND!",
        "HOLY OVERTIME!",
      ],
      death: [
        "I shall — I shall return at — daybreak —",
        "Where is — my reliquary — my — my marketing team —",
        "This was supposed to be a TRILOGY —",
      ],
      kill: [
        "Another peasant ascends. Some assembly required.",
        "Tell their next of kin: my fee schedule.",
        "Bless this kill. Tax-deductibly.",
      ],
    },
  },
}

export const HERO_LIST: Hero[] = Object.values(HEROES)
