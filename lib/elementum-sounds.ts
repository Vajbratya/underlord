// Lightweight Web Audio sound generator. No external assets.
// Hardened: every parameter is validated to be finite & in-range.
// Any failure inside a sound is swallowed so audio never crashes the app.

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
      return Math.min(0.5, Math.max(0.001, v))
    })()
    const delay = Math.max(0, safeFinite(opts.delay, 0))
    const sweepToRaw = opts.sweepTo
    const sweepTo =
      typeof sweepToRaw === 'number' && Number.isFinite(sweepToRaw)
        ? Math.max(1, sweepToRaw)
        : undefined
    const type: OscillatorType = opts.type ?? 'sine'

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
    osc.connect(gain)
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
    noise(0.12, 0.18)
    tone({ freq: 180, duration: 0.12, type: 'square', volume: 0.14, sweepTo: 60 })
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
    noise(0.4, 0.22)
    tone({ freq: 120, duration: 0.4, type: 'sawtooth', volume: 0.2, sweepTo: 30 })
  }),
  heal: wrap(() => {
    tone({ freq: 523, duration: 0.1, type: 'sine', volume: 0.14 })
    tone({ freq: 659, duration: 0.1, type: 'sine', volume: 0.14, delay: 0.08 })
    tone({ freq: 784, duration: 0.18, type: 'sine', volume: 0.14, delay: 0.16 })
  }),
  victory: wrap(() => {
    ;[523, 659, 784, 1047].forEach((f, i) =>
      tone({ freq: f, duration: 0.18, type: 'square', volume: 0.16, delay: i * 0.12 }),
    )
  }),
  defeat: wrap(() => {
    ;[392, 330, 277, 220].forEach((f, i) =>
      tone({ freq: f, duration: 0.22, type: 'sawtooth', volume: 0.18, delay: i * 0.16 }),
    )
  }),
  combo: wrap((tierIn?: number) => {
    const tier = Math.max(0, Math.min(10, safeFinite(tierIn, 0)))
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
    noise(0.5, 0.2, 0, 200)
    tone({ freq: 90, duration: 0.5, type: 'sawtooth', volume: 0.22, sweepTo: 1200 })
    tone({ freq: 220, duration: 0.5, type: 'square', volume: 0.18, delay: 0.05, sweepTo: 1800 })
  }),
  stageClear: wrap(() => {
    ;[523, 659, 784, 1047, 1319].forEach((f, i) =>
      tone({ freq: f, duration: 0.14, type: 'square', volume: 0.16, delay: i * 0.08 }),
    )
  }),
  shopOpen: wrap(() => {
    tone({ freq: 700, duration: 0.1, type: 'triangle', volume: 0.12 })
    tone({ freq: 1100, duration: 0.14, type: 'triangle', volume: 0.12, delay: 0.08 })
  }),
  shopBuy: wrap(() => {
    tone({ freq: 880, duration: 0.08, type: 'square', volume: 0.14 })
    tone({ freq: 1320, duration: 0.12, type: 'square', volume: 0.14, delay: 0.06 })
  }),
  bossIntro: wrap(() => {
    tone({ freq: 60, duration: 0.6, type: 'sawtooth', volume: 0.22 })
    tone({ freq: 110, duration: 0.6, type: 'sawtooth', volume: 0.18, delay: 0.05 })
    noise(0.6, 0.16, 0.1, 100)
  }),
  tick: wrap(() => {
    tone({ freq: 1200, duration: 0.03, type: 'square', volume: 0.06 })
  }),
}
