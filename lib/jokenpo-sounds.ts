// Lightweight Web Audio sound generator. No external assets.
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

type ToneOptions = {
  freq: number
  duration: number
  type?: OscillatorType
  volume?: number
  sweepTo?: number
  delay?: number
}

function tone({ freq, duration, type = 'sine', volume = 0.18, sweepTo, delay = 0 }: ToneOptions) {
  const c = getCtx()
  if (!c) return
  const start = c.currentTime + delay
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  if (sweepTo !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, sweepTo), start + duration)
  }
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(start)
  osc.stop(start + duration + 0.05)
}

function noise(duration: number, volume = 0.12, delay = 0, highpass = 800) {
  const c = getCtx()
  if (!c) return
  const bufferSize = Math.floor(c.sampleRate * duration)
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
  src.start(c.currentTime + delay)
}

export const sfx = {
  resume() {
    const c = getCtx()
    if (c && c.state === 'suspended') void c.resume()
  },
  click() {
    tone({ freq: 520, duration: 0.06, type: 'square', volume: 0.1 })
  },
  tap() {
    tone({ freq: 720, duration: 0.04, type: 'square', volume: 0.08 })
  },
  shake() {
    tone({ freq: 220, duration: 0.08, type: 'square', volume: 0.08 })
  },
  reveal() {
    noise(0.18, 0.08)
    tone({ freq: 800, duration: 0.18, type: 'sawtooth', sweepTo: 200, volume: 0.1 })
  },
  win() {
    tone({ freq: 660, duration: 0.12, type: 'square', volume: 0.16 })
    tone({ freq: 880, duration: 0.12, type: 'square', volume: 0.16, delay: 0.1 })
    tone({ freq: 1320, duration: 0.2, type: 'square', volume: 0.16, delay: 0.2 })
  },
  lose() {
    tone({ freq: 220, duration: 0.18, type: 'sawtooth', volume: 0.16 })
    tone({ freq: 110, duration: 0.3, type: 'sawtooth', volume: 0.16, delay: 0.15 })
  },
  draw() {
    tone({ freq: 440, duration: 0.1, type: 'triangle', volume: 0.12 })
    tone({ freq: 440, duration: 0.1, type: 'triangle', volume: 0.12, delay: 0.12 })
  },
  damage() {
    noise(0.12, 0.18)
    tone({ freq: 180, duration: 0.12, type: 'square', volume: 0.14, sweepTo: 60 })
  },
  powerup() {
    tone({ freq: 880, duration: 0.08, type: 'triangle', volume: 0.14 })
    tone({ freq: 1320, duration: 0.08, type: 'triangle', volume: 0.14, delay: 0.07 })
    tone({ freq: 1760, duration: 0.12, type: 'triangle', volume: 0.14, delay: 0.14 })
  },
  drop() {
    tone({ freq: 1320, duration: 0.14, type: 'sine', volume: 0.16 })
    tone({ freq: 1760, duration: 0.18, type: 'sine', volume: 0.16, delay: 0.1 })
  },
  bomb() {
    noise(0.4, 0.22)
    tone({ freq: 120, duration: 0.4, type: 'sawtooth', volume: 0.2, sweepTo: 30 })
  },
  heal() {
    tone({ freq: 523, duration: 0.1, type: 'sine', volume: 0.14 })
    tone({ freq: 659, duration: 0.1, type: 'sine', volume: 0.14, delay: 0.08 })
    tone({ freq: 784, duration: 0.18, type: 'sine', volume: 0.14, delay: 0.16 })
  },
  victory() {
    ;[523, 659, 784, 1047].forEach((f, i) =>
      tone({ freq: f, duration: 0.18, type: 'square', volume: 0.16, delay: i * 0.12 }),
    )
  },
  defeat() {
    ;[392, 330, 277, 220].forEach((f, i) =>
      tone({ freq: f, duration: 0.22, type: 'sawtooth', volume: 0.18, delay: i * 0.16 }),
    )
  },
  combo(tier: number) {
    // ascending arpeggio scaling with tier
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
  },
  rageGain() {
    tone({ freq: 160, duration: 0.12, type: 'sawtooth', volume: 0.1, sweepTo: 280 })
  },
  rageReady() {
    // alarm-like
    ;[440, 660, 440, 660].forEach((f, i) =>
      tone({ freq: f, duration: 0.08, type: 'square', volume: 0.16, delay: i * 0.09 }),
    )
  },
  ultimate() {
    noise(0.5, 0.2, 0, 200)
    tone({ freq: 90, duration: 0.5, type: 'sawtooth', volume: 0.22, sweepTo: 1200 })
    tone({ freq: 220, duration: 0.5, type: 'square', volume: 0.18, delay: 0.05, sweepTo: 1800 })
  },
  stageClear() {
    ;[523, 659, 784, 1047, 1319].forEach((f, i) =>
      tone({ freq: f, duration: 0.14, type: 'square', volume: 0.16, delay: i * 0.08 }),
    )
  },
  shopOpen() {
    tone({ freq: 700, duration: 0.1, type: 'triangle', volume: 0.12 })
    tone({ freq: 1100, duration: 0.14, type: 'triangle', volume: 0.12, delay: 0.08 })
  },
  shopBuy() {
    tone({ freq: 880, duration: 0.08, type: 'square', volume: 0.14 })
    tone({ freq: 1320, duration: 0.12, type: 'square', volume: 0.14, delay: 0.06 })
  },
  bossIntro() {
    tone({ freq: 60, duration: 0.6, type: 'sawtooth', volume: 0.22 })
    tone({ freq: 110, duration: 0.6, type: 'sawtooth', volume: 0.18, delay: 0.05 })
    noise(0.6, 0.16, 0.1, 100)
  },
  tick() {
    tone({ freq: 1200, duration: 0.03, type: 'square', volume: 0.06 })
  },
}
