import { CHAIN_LENGTH, MOVES, MOVE_LIST, type Move } from './elementum-types'

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
  let name = 'APRENDIZ-01'
  let intro = 'Aprendiz. Lança feitiços ao acaso.'
  if (stage <= 2) {
    level = 'novice'
    name = 'APRENDIZ-' + String(stage).padStart(2, '0')
    intro = 'Aprendiz. Lança feitiços ao acaso.'
  } else if (stage <= 5) {
    level = 'smart'
    name = 'ADEPTO-V' + (stage - 2)
    intro = 'Estuda seus padrões mágicos.'
  } else if (stage <= 9) {
    level = 'predictive'
    name = 'FEITICEIRO-X' + (stage - 5)
    intro = 'Lê suas intenções arcanas.'
  } else {
    level = 'boss'
    name = 'ARCANUM-' + (stage - 9).toString().padStart(2, '0')
    intro = 'Calcula. Pune. Aniquila.'
  }

  return { stage, hp, critChance, level, name, intro }
}

function randomMove(): Move {
  return MOVE_LIST[Math.floor(Math.random() * 3)]
}

function mostFrequent(history: Move[]): Move | null {
  if (history.length === 0) return null
  const counts: Record<Move, number> = { hydro: 0, terra: 0, pyro: 0 }
  for (const h of history) counts[h]++
  let best: Move = 'hydro'
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

/**
 * Position-aware history bucket — counts how often each move appeared
 * at each chain position in the player's previous casts.
 */
function positionFrequency(chainHistory: Move[][]): Record<number, Record<Move, number>> {
  const buckets: Record<number, Record<Move, number>> = {}
  for (let i = 0; i < CHAIN_LENGTH; i++) {
    buckets[i] = { hydro: 0, terra: 0, pyro: 0 }
  }
  for (const chain of chainHistory) {
    chain.forEach((m, i) => {
      if (i < CHAIN_LENGTH && buckets[i]) buckets[i][m]++
    })
  }
  return buckets
}

function topAtPosition(buckets: Record<Move, number>): Move {
  let best: Move = 'hydro'
  let bestC = -1
  for (const m of MOVE_LIST) {
    if (buckets[m] > bestC) {
      bestC = buckets[m]
      best = m
    }
  }
  return best
}

/**
 * CPU builds a 3-move chain.
 * - novice: 3 random
 * - smart: 50% counters most-frequent OVERALL move at each slot, 50% random
 * - predictive: counters position-by-position based on history at that exact slot
 * - boss: counters slot-by-slot with 80% accuracy + occasionally counters the
 *         player's last chain at that slot
 */
export function cpuPickChain(
  level: CPULevel,
  flatHistory: Move[],
  chainHistory: Move[][],
): Move[] {
  const out: Move[] = []

  if (level === 'novice') {
    for (let i = 0; i < CHAIN_LENGTH; i++) out.push(randomMove())
    return out
  }

  const buckets = positionFrequency(chainHistory)
  const lastChain = chainHistory[chainHistory.length - 1] ?? null
  const overallTop = mostFrequent(flatHistory) ?? randomMove()
  const counterOverall = MOVES[overallTop].counter

  for (let i = 0; i < CHAIN_LENGTH; i++) {
    const slotTop = topAtPosition(buckets[i])
    const counterSlot = MOVES[slotTop].counter
    const lastAtSlot = lastChain ? lastChain[i] : null
    const counterLast = lastAtSlot ? MOVES[lastAtSlot].counter : null

    let pick: Move
    if (level === 'smart') {
      pick = Math.random() < 0.5 ? counterOverall : randomMove()
    } else if (level === 'predictive') {
      const r = Math.random()
      if (r < 0.55) pick = counterSlot
      else if (counterLast && r < 0.8) pick = counterLast
      else pick = randomMove()
    } else {
      // boss
      const r = Math.random()
      if (r < 0.7) pick = counterSlot
      else if (counterLast && r < 0.9) pick = counterLast
      else pick = randomMove()
    }
    out.push(pick)
  }

  return out
}
