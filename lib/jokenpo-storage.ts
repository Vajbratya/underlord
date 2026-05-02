const KEY = 'jokenpo-arena-records-v1'

export type Records = {
  bestStage: number
  bestStreak: number
  totalWins: number
  totalRuns: number
  totalDamage: number
  totalPowerUps: number
}

const EMPTY: Records = {
  bestStage: 0,
  bestStreak: 0,
  totalWins: 0,
  totalRuns: 0,
  totalDamage: 0,
  totalPowerUps: 0,
}

export function loadRecords(): Records {
  if (typeof window === 'undefined') return { ...EMPTY }
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return { ...EMPTY }
    const parsed = JSON.parse(raw) as Partial<Records>
    return { ...EMPTY, ...parsed }
  } catch {
    return { ...EMPTY }
  }
}

export function saveRecords(r: Records) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(r))
  } catch {
    // ignore
  }
}

export function mergeRunIntoRecords(
  prev: Records,
  run: {
    stageReached: number
    bestStreak: number
    wins: number
    damageDealt: number
    powerUpsUsed: number
  },
): Records {
  return {
    bestStage: Math.max(prev.bestStage, run.stageReached),
    bestStreak: Math.max(prev.bestStreak, run.bestStreak),
    totalWins: prev.totalWins + run.wins,
    totalRuns: prev.totalRuns + 1,
    totalDamage: prev.totalDamage + run.damageDealt,
    totalPowerUps: prev.totalPowerUps + run.powerUpsUsed,
  }
}
