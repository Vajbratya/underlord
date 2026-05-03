/* ===========================================================================
 * UNDERLORD — lore + flavor text bank
 * Tone: grimdark with a wink. Heroes are insufferable. Pick from these.
 * ======================================================================== */

/** Random helpers ---------------------------------------------------- */
export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function pickN<T>(arr: readonly T[], n: number): T[] {
  const copy = [...arr]
  const out: T[] = []
  while (out.length < n && copy.length) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0])
  }
  return out
}

/* --------------------------------------------------------------------- */
/* Underlord narrator                                                     */
/* --------------------------------------------------------------------- */

export const NARRATOR_IDLE = [
  "Another dawn. The sun is, as always, an irritant.",
  "Reports indicate the heroes are still alive. This is a problem.",
  "I had a dream I was a kind man. I woke up and immediately atoned.",
  "The kingdom prospers, allegedly. Allegedly.",
  "Six lieutenants want my throne. Two of them haven't even waited for me to leave the room.",
  "Coffee. Or its dread equivalent. Now.",
  "The sky is a muted bruise. Acceptable.",
  "Somewhere, a paladin is composing a speech. He will not survive it.",
  "I have made peace with the fact that I am, in fact, the villain. The peace is going well.",
  "A traveling bard rhymed 'Underlord' with 'thunder-bored'. He has been thunder-bored.",
  "The Concord has issued another decree. The decree decrees decreeing.",
  "Morale is fine. Morale is always fine. We have a Morale Officer. Morale Officer reports morale fine.",
]

export const NARRATOR_VICTORY = [
  "He died as he lived: surprised.",
  "The hero monologued. We waited politely. Then we did this.",
  "His last words were a copyright claim.",
  "Bury him with his prejudices. They were his only friends.",
  "Another paladin meets the inevitable. The inevitable is us.",
  "He had a family. They sent a thank-you note.",
]

export const NARRATOR_DEFEAT = [
  "Tactical reassessment. A common phrase for: we ran.",
  "We will return. Probably with more ranged units. Definitely with less optimism.",
  "The heroes are insufferable in victory. Even more than usual.",
  "They are already writing a song about it. I will hunt the songwriter first.",
]

export const NARRATOR_REGION_HOVER: Record<string, string[]> = {}

/* --------------------------------------------------------------------- */
/* Hero asshole quotes (shared archetypes)                                */
/* --------------------------------------------------------------------- */

/** Generic "I am the hero, look at me" lines used by several heroes. */
export const HERO_GENERIC_ENTRANCE = [
  "Stand aside, peasant! Or — wait, are you the peasant who lives here? Even worse.",
  "I have been called The Greatest. By myself. Mostly.",
  "Don't worry, I'm a hero. I have insurance for the property damage. (I do not.)",
  "Do you know who I am? I have a portrait. It's enormous. I commissioned it.",
  "I am here on official Concord business. The business is Being Better Than You.",
]

export const HERO_GENERIC_KILL = [
  "Tell my chronicler I did this in one hit. He'll know.",
  "Note this for the bards. Specifically the verse about my forearms.",
  "That's a kill. That's MY kill. I want it credited.",
  "If you respawn, I'll be charging a fee.",
]

export const HERO_GENERIC_DEATH = [
  "This is, quite frankly, a public-relations disaster.",
  "Tell my mother I died doing what I loved: complaining.",
  "Did anyone see how cool I just was. Anyone.",
  "I demand a manager. Send me a manager. A bigger manager.",
  "This is a temporary setback. I — I cannot stress how temporary —",
]

/* --------------------------------------------------------------------- */
/* Minion barks                                                           */
/* --------------------------------------------------------------------- */

export const MINION_IDLE = [
  "We die for you, sire. Reluctantly!",
  "Pay is fine, dental is shit.",
  "Hi boss hi boss hi boss",
  "I have a wife. Several, actually. They share me.",
  "Does anyone else hear that? No? Never mind.",
  "The hero looks expensive. We crack open the hero.",
  "I licked it. It was bad.",
  "I'm not screaming, you're screaming.",
  "Boss boss boss can I bite him",
  "Why do they always wear capes. CAPES.",
  "Tactically: I am scared.",
]

export const MINION_ATTACK = [
  "FOR THE THING WE WERE TOLD!",
  "Suffer my below-average swing!",
  "I'm authorized!",
  "Apologies in advance!",
  "AAAAH! (battle cry)",
  "This is happening!",
  "Smelly hero! Get him!",
  "TAX REFUND!",
  "AT-WILL EMPLOYMENT!",
  "I'M ON LUNCH!",
]

export const MINION_DEATH = [
  "Tell my children I — ah forget it.",
  "The light. Is. Disappointing.",
  "I had a sandwich saved for later.",
  "Tactical… nap…",
  "Refund me. Refund me.",
  "I was about to evolve!",
  "It's getting dim. So am I.",
]

export const MINION_VICTORY = [
  "We win again, boss! Statistically improbable!",
  "The hero is dead and we are merely crying!",
  "Loot the loot! Loot all of it!",
  "Are we supposed to feel this much?",
  "BOSS LIKES US BOSS LIKES US",
]

/* --------------------------------------------------------------------- */
/* Loot flavor banks (used by loot generator if needed)                   */
/* --------------------------------------------------------------------- */

export const LOOT_FLAVOR_HEROIC = [
  "Found on a man who would not stop talking about kale.",
  "Owner asked for a manager. Got one.",
  "The previous wearer wrote ‘DESTINY' on the inside. Spelled it wrong.",
  "Comes with a complimentary lecture about virtue.",
  "Still smells like cologne and a denied refund.",
  "Inscription: ‘I think therefore I am ™'.",
]

/* --------------------------------------------------------------------- */
/* Loading / boot quips                                                   */
/* --------------------------------------------------------------------- */

export const BOOT_QUIPS = [
  "Awakening from the Ash Vault. Stretching. Cracking the cosmic neck.",
  "Loading 814 years of grievances.",
  "Inventorying minions. Most accounted for.",
  "Polishing the Sunken Crown. It is not actually shiny. It is a metaphor.",
  "Filing a noise complaint against the heroes.",
]

/* --------------------------------------------------------------------- */
/* Procedural minion names                                                */
/* --------------------------------------------------------------------- */

const NAME_PARTS_A = [
  "Grub",
  "Snik",
  "Vex",
  "Mort",
  "Wretch",
  "Gob",
  "Snarl",
  "Murk",
  "Krug",
  "Pip",
  "Nox",
  "Rasp",
  "Brak",
  "Squiv",
  "Tib",
]
const NAME_PARTS_B = [
  "the Hungry",
  "the Damp",
  "the Indignant",
  "the Refundable",
  "the Specific",
  "the Optional",
  "the Bald",
  "the Confused",
  "the Mostly",
  "the Tactical",
  "the Unscheduled",
  "the Adequate",
]

export function generateMinionName(): string {
  return `${pick(NAME_PARTS_A)} ${pick(NAME_PARTS_B)}`
}

/* --------------------------------------------------------------------- */
/* Mutation pool (cosmetic / behavioral)                                  */
/* --------------------------------------------------------------------- */

export const MUTATION_POOL = [
  "Glowing eyes. Aesthetic only. Useless. Beloved.",
  "Extra mouth. Won't stop pitching ideas.",
  "Smells like tea. Aggressive tea.",
  "Speaks in iambic pentameter when frightened.",
  "Has acquired a small, judgmental hat.",
  "Sweats glitter. Cannot be stealthy. Knows this.",
  "Cries oil. Won't elaborate.",
  "Permanently soggy.",
]
