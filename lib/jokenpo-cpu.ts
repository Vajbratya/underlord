import { MOVES, MOVE_LIST, type Move } from './jokenpo-types'

export type CPULevel = 'novice' | 'smart' | 'predictive' | 'boss'

export type CPUStats = {
  stage: number
  hp: number
  critChance: number
  level: CPULevel
  name: string
  intro: string
}

export function getCPUStats(stage: number): CPUStats {
  const hp = Math.min(220, 90 + (stage - 1) * 12)
  const critChance = Math.min(0.25, (stage - 1) * 0.022)

  let level: CPULevel = 'novice'
  let name = 'BOT-01'
  let intro = 'Apenas mais um bot.'
  if (stage <= 2) {
    level = 'novice'
    name = 'BOT-' + String(stage).padStart(2, '0')
    intro = 'Iniciante. Joga aleatório.'
  } else if (stage <= 5) {
    level = 'smart'
    name = 'ALGO-V' + (stage - 2)
    intro = 'Estuda seus padrões.'
  } else if (stage <= 9) {
    level = 'predictive'
    name = 'NEURAL-X' + (stage - 5)
    intro = 'Lê suas intenções.'
  } else {
    level = 'boss'
    name = 'OVERLORD-' + (stage - 9).toString().padStart(2, '0')
    intro = 'Calcula. Pune. Domina.'
  }

  return { stage, hp, critChance, level, name, intro }
}

function randomMove(): Move {
  return MOVE_LIST[Math.floor(Math.random() * 3)]
}

function mostFrequent(history: Move[]): Move | null {
  if (history.length === 0) return null
  const counts: Record<Move, number> = { pedra: 0, papel: 0, tesoura: 0 }
  for (const h of history) counts[h]++
  let best: Move = 'pedra'
  let bestC = -1
  for (const m of MOVE_LIST) {
    if (counts[m] > bestC) {
      bestC = counts[m]
      best = m
    }
  }
  return best
}

/**
 * Picks the CPU's move for the round given the player's full move history.
 * - novice: pure random
 * - smart: 50% counters most-played, 50% random
 * - predictive: 70% counters most-played, mixes recent bias
 * - boss: 80% counters; checks last move; aggressive
 */
export function cpuPick(level: CPULevel, history: Move[]): Move {
  if (level === 'novice') return randomMove()

  const top = mostFrequent(history) ?? randomMove()
  const counterTop = MOVES[top].counter
  const last = history[history.length - 1]
  const counterLast = last ? MOVES[last].counter : null

  if (level === 'smart') {
    return Math.random() < 0.5 ? counterTop : randomMove()
  }
  if (level === 'predictive') {
    if (counterLast && Math.random() < 0.35) return counterLast
    return Math.random() < 0.7 ? counterTop : randomMove()
  }
  // boss
  if (counterLast && Math.random() < 0.45) return counterLast
  return Math.random() < 0.85 ? counterTop : randomMove()
}

export function cpuRollsCrit(stats: CPUStats): boolean {
  return Math.random() < stats.critChance
}
