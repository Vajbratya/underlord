/**
 * Per-archetype attack voice + visual flash signature.
 *
 * Each minion (and the Underlord) gets its own distinguishable sound +
 * color so a player can tell what just attacked WITHOUT looking at the
 * board. Voices stack on top of the existing `haptic.hit()` thump and
 * the generic damage popup — they don't replace either.
 *
 * Audio: composes existing `sfx` primitives (no new asset deps). Volumes
 * are deliberately low — these fire on every hit, including splash
 * collateral, so anything louder than 0.18 becomes obnoxious fast.
 *
 * Visual: returns a flash spec (color + radius scale + duration). The
 * battle.tsx layer reads the spec, animates a circle on the target hex,
 * and removes it after the duration.
 */

import { sfx } from '@/lib/elementum-sounds'
import type { MinionArchetype } from './types'

export type FlashSpec = {
  /** OKLCH color used for the SVG flash circle's stroke + fill. */
  color: string
  /** Multiplier on the hex inradius. 1.0 = same size as the hex. */
  scale: number
  /** Animation duration in ms. */
  ms: number
  /** "ring" = expanding hollow circle. "burst" = filled fade. */
  shape: 'ring' | 'burst'
}

/* ----------------------------------------------------------------------- */
/*  AUDIO VOICES                                                           */
/*                                                                         */
/*  Each helper composes 1-3 oscillator notes via the existing `sfx`        */
/*  module (which itself wraps Web Audio with finite-input guards). All     */
/*  failures are swallowed inside `sfx`, so calling these is safe even      */
/*  before user-gesture audio unlock.                                       */
/* ----------------------------------------------------------------------- */

// v8 — voices now classify their hit kind so the right soundcn sample
// plays underneath: heavy metal slam (brown/golem/behemoth/thornbeast/gorger/
// ravager), light metal/range tick (green/grey/harpy/oracle/leech), magical
// jingle (bone/blue/lich/succubus/pyrelich/crowlord/spore/tidesinger/
// gargoyle/wyrmling/wraith). The fall-through tones still play.

function brownVoice() {
  // Heavy thud — full brute slam.
  sfx.heavyHit()
  sfx.shake()
}

function redVoice() {
  // Whoosh + low boom — a small explosion.
  sfx.bomb()
}

function greenVoice() {
  // Quick stab: high tap, sharp falloff. Light metal hit.
  sfx.rangedHit()
  sfx.click()
}

function blueVoice() {
  // Chime trio — same as `sfx.heal`, intentional reuse.
  sfx.magicHit()
  sfx.heal()
}

function greyVoice() {
  // Bowstring twang then dull thunk — ranged.
  sfx.rangedHit()
  sfx.tick()
}

function boneVoice() {
  // Eerie hiss + low whistle (curse drift).
  sfx.magicHit()
  sfx.rageGain()
}

function harpyVoice() {
  // Two quick high taps + a sweep down (stoop).
  sfx.rangedHit()
  sfx.tap()
}

function gorgerVoice() {
  // Wet chomp: bomb compressed, plus a heal chime (lifesteal).
  sfx.heavyHit()
  sfx.heal()
}

function wraithVoice() {
  // Phase whoosh — reveal sweep with a magic shimmer.
  sfx.magicHit()
  sfx.reveal()
}

function lichVoice() {
  // Crystalline ascending arpeggio = ultimate magic.
  sfx.magicHit()
  sfx.powerup()
}

function behemothVoice() {
  // Earth-shaker — heavy slam + double shake.
  sfx.heavyHit()
  sfx.shake()
}

function sporeVoice() {
  // Whisper-puff. Pure noise sweep, very short.
  sfx.magicHit()
  sfx.tick()
}

function oracleVoice() {
  // Bell-like prophecy — combo arpeggio.
  sfx.rangedHit()
  sfx.combo(3)
}

function ravagerVoice() {
  // Whirlwind — 3 quick heavy thumps in a row.
  sfx.heavyHit()
  sfx.damage()
  sfx.shake()
}

function wyrmlingVoice() {
  // Dragon breath — bomb + ascending heat tone.
  sfx.bomb()
  sfx.magicHit()
}

function crowlordVoice() {
  // Crow caw + curse hiss.
  sfx.magicHit()
  sfx.tap()
}

/* v8 archetypes — eight more distinct voices. Each composes the existing
 * `sfx` primitives so we don't ship new audio assets. */

function golemVoice() {
  // Stone grind + heavy thud.
  sfx.heavyHit()
  sfx.shake()
  sfx.tick()
}

function gargoyleVoice() {
  // Wing snap + dive screech.
  sfx.magicHit()
  sfx.reveal()
}

function leechVoice() {
  // Wet bite + tiny chime (siphon heal).
  sfx.rangedHit()
  sfx.heal()
}

function succubusVoice() {
  // Honeyed whisper sweep — same as bone curse but lighter.
  sfx.magicHit()
  sfx.heal()
}

function pyrelichVoice() {
  // Ignition + arcane peal.
  sfx.bomb()
  sfx.magicHit()
}

function tidesingerVoice() {
  // Liquid harp — heal trio twice (priestess chant).
  sfx.magicHit()
  sfx.heal()
}

function ratkingVoice() {
  // Skittering swarm + a bite.
  sfx.rangedHit()
  sfx.tap()
  sfx.damage()
}

function thornbeastVoice() {
  // Bone-snap execute.
  sfx.heavyHit()
  sfx.bomb()
}

// v9 voices.

function mortarVoice() {
  // Long-arc whistle into a low boom — sniper artillery.
  sfx.tick()
  sfx.bomb()
}

function bulwarkVoice() {
  // Slow, heavy slam — a wall hitting back. Doubled-up shake reads as
  // weight even though the actual ATK is low.
  sfx.heavyHit()
  sfx.shake()
  sfx.shake()
}

function swarmVoice() {
  // Insectile triple-tap. Light, dry, fast — kamikaze chitter.
  sfx.click()
  sfx.tap()
  sfx.tap()
}

function chimeraVoice() {
  // Three-headed pierce — ranged hit + a heavy follow-through.
  sfx.rangedHit()
  sfx.heavyHit()
}

const VOICE: Record<MinionArchetype, () => void> = {
  brown: brownVoice,
  red: redVoice,
  green: greenVoice,
  blue: blueVoice,
  grey: greyVoice,
  bone: boneVoice,
  harpy: harpyVoice,
  gorger: gorgerVoice,
  wraith: wraithVoice,
  lich: lichVoice,
  behemoth: behemothVoice,
  spore: sporeVoice,
  oracle: oracleVoice,
  ravager: ravagerVoice,
  wyrmling: wyrmlingVoice,
  crowlord: crowlordVoice,
  // v8 batch
  golem: golemVoice,
  gargoyle: gargoyleVoice,
  leech: leechVoice,
  succubus: succubusVoice,
  pyrelich: pyrelichVoice,
  tidesinger: tidesingerVoice,
  ratking: ratkingVoice,
  thornbeast: thornbeastVoice,
  // v9 batch
  mortar: mortarVoice,
  bulwark: bulwarkVoice,
  swarm: swarmVoice,
  chimera: chimeraVoice,
}

/** Special voice for the Underlord — louder, deeper, throne-room. */
function overlordVoice() {
  sfx.ultimate()
}

/** Voice on the very first hit of a fight, used to "announce" the unit. */
function heroVoice() {
  sfx.shake()
  sfx.damage()
}

/**
 * Play the per-archetype attack voice. Pass `undefined` for non-minion
 * (hero) attackers — they get a generic damage thump.
 *
 * Also handles the Underlord case via the `isOverlord` boolean since the
 * Underlord renders as a `brown` template internally.
 */
export function playAttackVoice(
  archetype: MinionArchetype | undefined,
  opts: { isOverlord?: boolean; faction?: 'minion' | 'hero' } = {},
): void {
  if (opts.isOverlord) {
    overlordVoice()
    return
  }
  if (opts.faction === 'hero' || !archetype) {
    heroVoice()
    return
  }
  const fn = VOICE[archetype]
  if (fn) fn()
}

/* ----------------------------------------------------------------------- */
/*  VISUAL FLASHES                                                         */
/*                                                                         */
/*  Color picks reuse the existing OKLCH design tokens (so flashes harmonize */
/*  with the rarity / faction palette). Anything outside the existing       */
/*  semantic tokens (gold/destructive/accent/primary/foreground) gets a     */
/*  bespoke OKLCH so each archetype is distinguishable side-by-side.        */
/* ----------------------------------------------------------------------- */

const FLASH: Record<MinionArchetype, FlashSpec> = {
  brown: { color: 'oklch(0.65 0.06 60)', scale: 1.2, ms: 240, shape: 'burst' },
  red: { color: 'oklch(0.62 0.21 22)', scale: 1.6, ms: 320, shape: 'burst' },
  green: { color: 'oklch(0.70 0.18 145)', scale: 1.0, ms: 200, shape: 'ring' },
  blue: { color: 'oklch(0.72 0.15 220)', scale: 1.1, ms: 280, shape: 'ring' },
  grey: { color: 'oklch(0.78 0.14 78)', scale: 1.0, ms: 220, shape: 'ring' },
  bone: { color: 'oklch(0.85 0.05 80)', scale: 1.2, ms: 360, shape: 'burst' },
  harpy: { color: 'oklch(0.68 0.13 200)', scale: 1.1, ms: 220, shape: 'ring' },
  gorger: { color: 'oklch(0.55 0.20 18)', scale: 1.3, ms: 320, shape: 'burst' },
  wraith: { color: 'oklch(0.65 0.10 280)', scale: 1.4, ms: 300, shape: 'burst' },
  lich: { color: 'oklch(0.72 0.18 290)', scale: 1.5, ms: 380, shape: 'burst' },
  behemoth: { color: 'oklch(0.55 0.10 60)', scale: 1.5, ms: 360, shape: 'burst' },
  spore: { color: 'oklch(0.74 0.15 130)', scale: 1.4, ms: 320, shape: 'burst' },
  oracle: { color: 'oklch(0.85 0.16 80)', scale: 1.2, ms: 320, shape: 'ring' },
  ravager: { color: 'oklch(0.58 0.21 20)', scale: 1.4, ms: 280, shape: 'ring' },
  wyrmling: { color: 'oklch(0.66 0.18 50)', scale: 1.5, ms: 320, shape: 'burst' },
  crowlord: { color: 'oklch(0.55 0.08 280)', scale: 1.2, ms: 280, shape: 'ring' },
  // v8 batch — distinguishable hues that don't collide with the older set.
  golem: { color: 'oklch(0.60 0.04 240)', scale: 1.5, ms: 340, shape: 'burst' },
  gargoyle: { color: 'oklch(0.50 0.04 220)', scale: 1.0, ms: 220, shape: 'ring' },
  leech: { color: 'oklch(0.55 0.18 25)', scale: 1.0, ms: 220, shape: 'burst' },
  succubus: { color: 'oklch(0.70 0.18 350)', scale: 1.2, ms: 280, shape: 'ring' },
  pyrelich: { color: 'oklch(0.68 0.20 35)', scale: 1.6, ms: 380, shape: 'burst' },
  tidesinger: { color: 'oklch(0.78 0.13 200)', scale: 1.3, ms: 320, shape: 'ring' },
  ratking: { color: 'oklch(0.55 0.08 50)', scale: 1.2, ms: 240, shape: 'burst' },
  thornbeast: { color: 'oklch(0.60 0.14 145)', scale: 1.3, ms: 280, shape: 'burst' },
  // v9 batch — high-saturation hues that read at a glance.
  // Mortar: artillery orange. Bulwark: stone slate. Swarm: wasp yellow.
  // Chimera: heraldic gold-green (three-headed mythos).
  mortar:  { color: 'oklch(0.66 0.22 35)',  scale: 1.6, ms: 360, shape: 'burst' },
  bulwark: { color: 'oklch(0.50 0.04 250)', scale: 1.7, ms: 420, shape: 'burst' },
  swarm:   { color: 'oklch(0.85 0.18 95)',  scale: 0.9, ms: 180, shape: 'ring'  },
  chimera: { color: 'oklch(0.68 0.16 110)', scale: 1.2, ms: 260, shape: 'ring'  },
}

const OVERLORD_FLASH: FlashSpec = {
  color: 'oklch(0.78 0.14 78)', // gold
  scale: 1.8,
  ms: 480,
  shape: 'burst',
}
const HERO_FLASH: FlashSpec = {
  color: 'oklch(0.62 0.21 22)', // destructive red
  scale: 1.0,
  ms: 200,
  shape: 'ring',
}

/** Resolve the flash spec for a given attacker. Mirrors `playAttackVoice`. */
export function flashFor(
  archetype: MinionArchetype | undefined,
  opts: { isOverlord?: boolean; faction?: 'minion' | 'hero' } = {},
): FlashSpec {
  if (opts.isOverlord) return OVERLORD_FLASH
  if (opts.faction === 'hero' || !archetype) return HERO_FLASH
  return FLASH[archetype] ?? HERO_FLASH
}
