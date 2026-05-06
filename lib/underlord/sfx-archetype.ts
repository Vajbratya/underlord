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

function brownVoice() {
  // Heavy thud, square wave, low frequency.
  sfx.damage()
  sfx.shake()
}

function redVoice() {
  // Whoosh + low boom — a small explosion.
  sfx.bomb()
}

function greenVoice() {
  // Quick stab: high tap, sharp falloff.
  sfx.tap()
  sfx.click()
}

function blueVoice() {
  // Chime trio — same as `sfx.heal`, intentional reuse.
  sfx.heal()
}

function greyVoice() {
  // Bowstring twang then dull thunk.
  sfx.tick()
  sfx.shake()
}

function boneVoice() {
  // Eerie hiss + low whistle (curse drift).
  sfx.rageGain()
  sfx.tick()
}

function harpyVoice() {
  // Two quick high taps + a sweep down (stoop).
  sfx.tap()
  sfx.tap()
  sfx.shake()
}

function gorgerVoice() {
  // Wet chomp: bomb compressed, plus a heal chime (lifesteal).
  sfx.damage()
  sfx.heal()
}

function wraithVoice() {
  // Phase whoosh — reveal sweep.
  sfx.reveal()
}

function lichVoice() {
  // Crystalline ascending arpeggio = ultimate magic.
  sfx.powerup()
}

function behemothVoice() {
  // Earth-shaker — bomb + double shake.
  sfx.bomb()
  sfx.shake()
}

function sporeVoice() {
  // Whisper-puff. Pure noise sweep, very short.
  sfx.reveal()
  sfx.tick()
}

function oracleVoice() {
  // Bell-like prophecy — combo arpeggio.
  sfx.combo(3)
}

function ravagerVoice() {
  // Whirlwind — 3 quick damage thumps in a row.
  sfx.damage()
  sfx.damage()
  sfx.shake()
}

function wyrmlingVoice() {
  // Dragon breath — bomb + ascending heat tone.
  sfx.bomb()
  sfx.powerup()
}

function crowlordVoice() {
  // Crow caw + curse hiss.
  sfx.tap()
  sfx.rageGain()
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
