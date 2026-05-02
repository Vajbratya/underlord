import type { PowerUpId } from './elementum-types'

const KEY = 'elementum-records-v1'

export type CardLevels = Record<PowerUpId, number>
export type CardShards = Record<PowerUpId, number>

export type Records = {
  bestStage: number
  bestStreak: number
  totalWins: number
  totalRuns: number
  totalDamage: number
  totalPowerUps: number
  // Clash-style metaprogression
  trophies: number
  bestTrophies: number
  cardLevels: CardLevels
  cardShards: CardShards
  loadout: PowerUpId[]
}

const DEFAULT_LEVELS: CardLevels = {
  shield: 1,
  crit: 1,
  spy: 1,
  bomb: 1,
  lucky: 1,
  heal: 1,
  siphon: 1,
  rage: 1,
}

const DEFAULT_SHARDS: CardShards = {
  shield: 0,
  crit: 0,
  spy: 0,
  bomb: 0,
  lucky: 0,
  heal: 0,
  siphon: 0,
  rage: 0,
}

const DEFAULT_LOADOUT: PowerUpId[] = ['bomb', 'heal', 'shield']

const EMPTY: Records = {
  bestStage: 0,
  bestStreak: 0,
  totalWins: 0,
  totalRuns: 0,
  totalDamage: 0,
  totalPowerUps: 0,
  trophies: 0,
  bestTrophies: 0,
  cardLevels: { ...DEFAULT_LEVELS },
  cardShards: { ...DEFAULT_SHARDS },
  loadout: [...DEFAULT_LOADOUT],
}

export function loadRecords(): Records {
  if (typeof window === 'undefined') return cloneDefaults()
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return cloneDefaults()
    const parsed = JSON.parse(raw) as Partial<Records>
    return {
      ...cloneDefaults(),
      ...parsed,
      cardLevels: { ...DEFAULT_LEVELS, ...(parsed.cardLevels ?? {}) },
      cardShards: { ...DEFAULT_SHARDS, ...(parsed.cardShards ?? {}) },
      loadout:
        Array.isArray(parsed.loadout) && parsed.loadout.length > 0
          ? parsed.loadout.slice(0, 3)
          : [...DEFAULT_LOADOUT],
    }
  } catch {
    return cloneDefaults()
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

function cloneDefaults(): Records {
  return {
    ...EMPTY,
    cardLevels: { ...DEFAULT_LEVELS },
    cardShards: { ...DEFAULT_SHARDS },
    loadout: [...DEFAULT_LOADOUT],
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
    ...prev,
    bestStage: Math.max(prev.bestStage, run.stageReached),
    bestStreak: Math.max(prev.bestStreak, run.bestStreak),
    totalWins: prev.totalWins + run.wins,
    totalRuns: prev.totalRuns + 1,
    totalDamage: prev.totalDamage + run.damageDealt,
    totalPowerUps: prev.totalPowerUps + run.powerUpsUsed,
  }
}
