// Lightweight Web Audio sound generator. No external assets.
// Hardened: every parameter is validated to be finite & in-range.
// Any failure inside a sound is swallowed so audio never crashes the app.
//
// v8 — soundcn layer: high-impact moments (damage, bomb, victory, defeat,
// boss intro, ultimate, shop buy, stage clear, combo, click) now also fire
// a real CC0 sample on top of the synthesized tone. The tone stays as a
// fallback for SSR / no-AudioContext environments — and to keep the older
// arcade flavor blended into the new richer feedback. All soundcn calls
// fail silently and never block the engine.
//
// All assets are tree-shakeable inline base64 modules — no network fetch.

import { playSound } from './sound-engine'
import { clickSoftSound } from './click-soft'
import { coinCollectSound } from './coin-collect'
import { comboSound } from './combo'
import { comboBreakerSound } from './combo-breaker'
import { deathmatchSound } from './deathmatch'
import { explosionCrunch002Sound } from './explosion-crunch-002'
import { flawlessVictorySound } from './flawless-victory'
import { iQuestCompleteSound } from './i-quest-complete'
import { impactMetalHeavy001Sound } from './impact-metal-heavy-001'
import { impactMetalLight002Sound } from './impact-metal-light-002'
import { jinglesHit04Sound } from './jingles-hit-04'
import { jinglesHit12Sound } from './jingles-hit-12'
import { mDeathImpactLargeStoneASound } from './m-death-impact-large-stone-a'
import type { SoundAsset } from './sound-types'
// v12 — soundcn variation packs. Sibling samples of the originals so each
// hit/crit/boom picks a different take → kills the "every swing sounds
// identical" repetition. (Same CC0 soundcn registry the originals came from.)
import { impactMetalHeavy000Sound } from './sounds/impact-metal-heavy-000'
import { impactMetalHeavy002Sound } from './sounds/impact-metal-heavy-002'
import { impactMetalHeavy003Sound } from './sounds/impact-metal-heavy-003'
import { impactMetalLight000Sound } from './sounds/impact-metal-light-000'
import { impactMetalLight001Sound } from './sounds/impact-metal-light-001'
import { impactMetalLight003Sound } from './sounds/impact-metal-light-003'
import { impactMetalMedium001Sound } from './sounds/impact-metal-medium-001'
import { impactMetalMedium003Sound } from './sounds/impact-metal-medium-003'
import { impactGenericLight000Sound } from './sounds/impact-generic-light-000'
import { impactGenericLight001Sound } from './sounds/impact-generic-light-001'
import { impactGenericLight002Sound } from './sounds/impact-generic-light-002'
import { impactGlassLight001Sound } from './sounds/impact-glass-light-001'
import { impactGlassLight003Sound } from './sounds/impact-glass-light-003'
import { explosionCrunch000Sound } from './sounds/explosion-crunch-000'
import { explosionCrunch001Sound } from './sounds/explosion-crunch-001'
import { explosionCrunch003Sound } from './sounds/explosion-crunch-003'

/** Fire-and-forget soundcn sample. Returns immediately; the play call is
 * async but we don't await it — audio errors must never propagate. */
function sample(asset: SoundAsset, volume = 0.6, playbackRate = 1) {
  try {
    void playSound(asset.dataUri, { volume, playbackRate }).catch(() => {})
  } catch {
    // swallow — no AudioContext, locked autoplay, etc.
  }
}

/**
 * v12 — play a RANDOM sample from a pool with a touch of pitch jitter.
 * Two layers of variation (which take + slight rate) mean the same combat
 * event almost never sounds twice the same. Falls back to plain `sample`.
 */
function pickSample(pool: SoundAsset[], volume = 0.6, jitter = 0.06) {
  if (pool.length === 0) return
  const asset = pool[Math.floor(Math.random() * pool.length)] ?? pool[0]
  const rate = 1 + (Math.random() * 2 - 1) * jitter
  sample(asset, volume, rate)
}

/* ---- Variation pools (soundcn sibling takes) ---- */
const HEAVY_HITS: SoundAsset[] = [
  impactMetalHeavy000Sound,
  impactMetalHeavy001Sound,
  impactMetalHeavy002Sound,
  impactMetalHeavy003Sound,
]
const LIGHT_HITS: SoundAsset[] = [
  impactMetalLight000Sound,
  impactMetalLight001Sound,
  impactMetalLight002Sound,
  impactMetalLight003Sound,
  impactMetalMedium001Sound,
  impactMetalMedium003Sound,
]
const RANGED_HITS: SoundAsset[] = [
  impactGenericLight000Sound,
  impactGenericLight001Sound,
  impactGenericLight002Sound,
]
const GLASS_HITS: SoundAsset[] = [
  impactGlassLight001Sound,
  impactGlassLight003Sound,
]
const BOOMS: SoundAsset[] = [
  explosionCrunch000Sound,
  explosionCrunch001Sound,
  explosionCrunch002Sound,
  explosionCrunch003Sound,
]

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    try {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AC) return null
      ctx = new AC()
    } catch {
      return null
    }
  }
  return ctx
}

const isFinitePositive = (n: unknown): n is number =>
  typeof n === 'number' && Number.isFinite(n) && n > 0

const safeFinite = (n: unknown, fallback: number): number =>
  typeof n === 'number' && Number.isFinite(n) ? n : fallback

type ToneOptions = {
  freq: number
  duration: number
  type?: OscillatorType
  volume?: number
  sweepTo?: number
  delay?: number
}

function tone(opts: ToneOptions) {
  try {
    const c = getCtx()
    if (!c) return

    const now = safeFinite(c.currentTime, 0)
    const freq = isFinitePositive(opts.freq) ? opts.freq : 440
    const duration = isFinitePositive(opts.duration) ? Math.min(opts.duration, 4) : 0.1
    const volume = (() => {
      const v = safeFinite(opts.volume, 0.15)
      // v13 — drop the synth layer well under the real recorded samples so
      // it warms/bodies them instead of beeping over them like a 2-bit toy.
      return Math.min(0.16, Math.max(0.001, v * 0.55))
    })()
    const delay = Math.max(0, safeFinite(opts.delay, 0))
    const sweepToRaw = opts.sweepTo
    const sweepTo =
      typeof sweepToRaw === 'number' && Number.isFinite(sweepToRaw)
        ? Math.max(1, sweepToRaw)
        : undefined
    // v13 — kill the chiptune timbre: the buzzy square/sawtooth waveforms
    // are what read as "2-bit". Fold them down to a soft triangle; sine
    // stays sine. A lowpass below rounds off the remaining harsh harmonics.
    const reqType = opts.type ?? 'sine'
    const type: OscillatorType =
      reqType === 'square' || reqType === 'sawtooth' ? 'triangle' : reqType

    const start = now + delay
    const attack = Math.min(0.01, duration * 0.5)
    const peakAt = start + attack
    const endAt = start + duration

    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, start)
    if (sweepTo !== undefined && duration > 0.02) {
      osc.frequency.exponentialRampToValueAtTime(sweepTo, endAt)
    }
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(volume, peakAt)
    gain.gain.exponentialRampToValueAtTime(0.0001, endAt)
    // Lowpass to warm the tone — strips the brittle high harmonics that
    // make synth blips sound cheap.
    const lp = c.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(Math.max(600, Math.min(3200, freq * 3 + 400)), start)
    lp.Q.setValueAtTime(0.4, start)
    osc.connect(lp)
    lp.connect(gain)
    gain.connect(c.destination)
    osc.start(start)
    osc.stop(endAt + 0.05)
  } catch {
    // swallow audio errors
  }
}

function noise(durationIn: number, volumeIn = 0.12, delayIn = 0, highpassIn = 800) {
  try {
    const c = getCtx()
    if (!c) return
    const duration = isFinitePositive(durationIn) ? Math.min(durationIn, 4) : 0.1
    const volume = Math.min(0.5, Math.max(0.001, safeFinite(volumeIn, 0.12)))
    const delay = Math.max(0, safeFinite(delayIn, 0))
    const highpass = isFinitePositive(highpassIn) ? Math.min(20000, highpassIn) : 800

    const bufferSize = Math.max(1, Math.floor(c.sampleRate * duration))
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
    }
    const src = c.createBufferSource()
    src.buffer = buffer
    const gain = c.createGain()
    gain.gain.value = volume
    const filter = c.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = highpass
    src.connect(filter)
    filter.connect(gain)
    gain.connect(c.destination)
    src.start(safeFinite(c.currentTime, 0) + delay)
  } catch {
    // swallow audio errors
  }
}

const wrap = <T extends (...args: never[]) => void>(fn: T): T =>
  ((...args: Parameters<T>) => {
    try {
      fn(...args)
    } catch {
      // swallow audio errors
    }
  }) as T

export const sfx = {
  resume() {
    try {
      const c = getCtx()
      if (c && c.state === 'suspended') void c.resume()
    } catch {
      // ignore
    }
  },
  click: wrap(() => {
    sample(clickSoftSound, 0.5)
    tone({ freq: 520, duration: 0.06, type: 'square', volume: 0.1 })
  }),
  tap: wrap(() => {
    tone({ freq: 720, duration: 0.04, type: 'square', volume: 0.08 })
  }),
  shake: wrap(() => {
    tone({ freq: 220, duration: 0.08, type: 'square', volume: 0.08 })
  }),
  reveal: wrap(() => {
    noise(0.18, 0.08)
    tone({ freq: 800, duration: 0.18, type: 'sawtooth', sweepTo: 200, volume: 0.1 })
  }),
  win: wrap(() => {
    tone({ freq: 660, duration: 0.12, type: 'square', volume: 0.16 })
    tone({ freq: 880, duration: 0.12, type: 'square', volume: 0.16, delay: 0.1 })
    tone({ freq: 1320, duration: 0.2, type: 'square', volume: 0.16, delay: 0.2 })
  }),
  lose: wrap(() => {
    tone({ freq: 220, duration: 0.18, type: 'sawtooth', volume: 0.16 })
    tone({ freq: 110, duration: 0.3, type: 'sawtooth', volume: 0.16, delay: 0.15 })
  }),
  draw: wrap(() => {
    tone({ freq: 440, duration: 0.1, type: 'triangle', volume: 0.12 })
    tone({ freq: 440, duration: 0.1, type: 'triangle', volume: 0.12, delay: 0.12 })
  }),
  damage: wrap(() => {
    // Light metal hit on top of the tone — gives every minor strike weight.
    // v12: random sibling take + pitch jitter so chip damage never repeats.
    pickSample(LIGHT_HITS, 0.55)
    noise(0.12, 0.18)
    tone({ freq: 180, duration: 0.12, type: 'square', volume: 0.14, sweepTo: 60 })
  }),
  /** Heavy melee — used by the engine for crits & boss strikes. */
  heavyHit: wrap(() => {
    pickSample(HEAVY_HITS, 0.7, 0.05)
    tone({ freq: 140, duration: 0.16, type: 'square', volume: 0.16, sweepTo: 50 })
  }),
  /** Lighter ranged hit — used by the engine for arrow/bolt impacts. */
  rangedHit: wrap(() => {
    // Alternate the jingle with generic-light impacts for variety.
    if (Math.random() < 0.5) pickSample(RANGED_HITS, 0.5)
    else sample(jinglesHit04Sound, 0.5)
    tone({ freq: 1200, duration: 0.05, type: 'triangle', volume: 0.1 })
  }),
  /** Magic / curse impact — used for splash and curse archetypes. */
  magicHit: wrap(() => {
    if (Math.random() < 0.45) pickSample(GLASS_HITS, 0.5)
    else sample(jinglesHit12Sound, 0.55)
    tone({ freq: 880, duration: 0.1, type: 'sine', volume: 0.12, sweepTo: 660 })
  }),
  powerup: wrap(() => {
    tone({ freq: 880, duration: 0.08, type: 'triangle', volume: 0.14 })
    tone({ freq: 1320, duration: 0.08, type: 'triangle', volume: 0.14, delay: 0.07 })
    tone({ freq: 1760, duration: 0.12, type: 'triangle', volume: 0.14, delay: 0.14 })
  }),
  drop: wrap(() => {
    tone({ freq: 1320, duration: 0.14, type: 'sine', volume: 0.16 })
    tone({ freq: 1760, duration: 0.18, type: 'sine', volume: 0.16, delay: 0.1 })
  }),
  bomb: wrap(() => {
    // Real explosion sample (random take) + the original lo-fi rumble.
    pickSample(BOOMS, 0.75, 0.05)
    noise(0.4, 0.22)
    tone({ freq: 120, duration: 0.4, type: 'sawtooth', volume: 0.2, sweepTo: 30 })
  }),
  heal: wrap(() => {
    tone({ freq: 523, duration: 0.1, type: 'sine', volume: 0.14 })
    tone({ freq: 659, duration: 0.1, type: 'sine', volume: 0.14, delay: 0.08 })
    tone({ freq: 784, duration: 0.18, type: 'sine', volume: 0.14, delay: 0.16 })
  }),
  victory: wrap(() => {
    // Mortal-Kombat-style "FLAWLESS VICTORY" + the chiptune fanfare.
    sample(flawlessVictorySound, 0.7)
    ;[523, 659, 784, 1047].forEach((f, i) =>
      tone({ freq: f, duration: 0.18, type: 'square', volume: 0.16, delay: i * 0.12 }),
    )
  }),
  defeat: wrap(() => {
    // "DEATHMATCH" / round-loss sample + descending tone tail.
    sample(deathmatchSound, 0.65)
    ;[392, 330, 277, 220].forEach((f, i) =>
      tone({ freq: f, duration: 0.22, type: 'sawtooth', volume: 0.18, delay: i * 0.16 }),
    )
  }),
  combo: wrap((tierIn?: number) => {
    const tier = Math.max(0, Math.min(10, safeFinite(tierIn, 0)))
    // Tier 3+ is "combo breaker" territory — sample shifts.
    sample(tier >= 3 ? comboBreakerSound : comboSound, 0.6, 1 + tier * 0.04)
    const base = 600 + tier * 80
    ;[0, 1, 2, 3].forEach((i) => {
      tone({
        freq: base + i * 120,
        duration: 0.08,
        type: 'square',
        volume: 0.12,
        delay: i * 0.05,
      })
    })
  }),
  rageGain: wrap(() => {
    tone({ freq: 160, duration: 0.12, type: 'sawtooth', volume: 0.1, sweepTo: 280 })
  }),
  rageReady: wrap(() => {
    ;[440, 660, 440, 660].forEach((f, i) =>
      tone({ freq: f, duration: 0.08, type: 'square', volume: 0.16, delay: i * 0.09 }),
    )
  }),
  ultimate: wrap(() => {
    // Ultimate fires the explosion sample (crunchy boom) + combo-breaker
    // for the "broken" feeling, layered with the existing rising sweep.
    sample(explosionCrunch002Sound, 0.85)
    sample(comboBreakerSound, 0.55, 0.9)
    noise(0.5, 0.2, 0, 200)
    tone({ freq: 90, duration: 0.5, type: 'sawtooth', volume: 0.22, sweepTo: 1200 })
    tone({ freq: 220, duration: 0.5, type: 'square', volume: 0.18, delay: 0.05, sweepTo: 1800 })
  }),
  stageClear: wrap(() => {
    // Quest-complete jingle — stronger than victory tone alone.
    sample(iQuestCompleteSound, 0.7)
    ;[523, 659, 784, 1047, 1319].forEach((f, i) =>
      tone({ freq: f, duration: 0.14, type: 'square', volume: 0.16, delay: i * 0.08 }),
    )
  }),
  shopOpen: wrap(() => {
    sample(clickSoftSound, 0.6)
    tone({ freq: 700, duration: 0.1, type: 'triangle', volume: 0.12 })
    tone({ freq: 1100, duration: 0.14, type: 'triangle', volume: 0.12, delay: 0.08 })
  }),
  shopBuy: wrap(() => {
    // Real coin pickup sample — far better than the synthesized chime.
    sample(coinCollectSound, 0.7)
    tone({ freq: 880, duration: 0.08, type: 'square', volume: 0.14 })
    tone({ freq: 1320, duration: 0.12, type: 'square', volume: 0.14, delay: 0.06 })
  }),
  bossIntro: wrap(() => {
    // Colossal stone-impact sample under the deep sub rumble = arena
    // earthquake. Played slower to drag out the dread.
    sample(mDeathImpactLargeStoneASound, 0.85, 0.85)
    tone({ freq: 60, duration: 0.6, type: 'sawtooth', volume: 0.22 })
    tone({ freq: 110, duration: 0.6, type: 'sawtooth', volume: 0.18, delay: 0.05 })
    noise(0.6, 0.16, 0.1, 100)
  }),
  /** Triggered when a boss uses its last-stand passive (1 HP save). */
  bossLastStand: wrap(() => {
    sample(comboBreakerSound, 0.7)
    tone({ freq: 880, duration: 0.2, type: 'sawtooth', volume: 0.2, sweepTo: 220 })
    tone({ freq: 60, duration: 0.4, type: 'sawtooth', volume: 0.16, delay: 0.1 })
  }),
  tick: wrap(() => {
    tone({ freq: 1200, duration: 0.03, type: 'square', volume: 0.06 })
  }),
  /** v13 — soft muffled FOOTSTEP for unit movement. Replaces the old
   * piercing square-wave "tick" that played on every hex move. A low body
   * thud + a quiet filtered noise tap = a footfall, not a beep. */
  step: wrap(() => {
    tone({ freq: 92, duration: 0.07, type: 'sine', volume: 0.1, sweepTo: 54 })
    noise(0.045, 0.05, 0, 380)
  }),
}
