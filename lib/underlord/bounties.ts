/**
 * CONTRATOS — rotating daily + weekly bounties.
 *
 * The engagement treadmill: a fresh set of objectives every UTC day (and a
 * fatter set every week) that pay gold / Soulshards / XP. They're tracked
 * off data the battle reducer already produces (wins, kills, combos, crits,
 * flawless clears, boss kills, deepest gauntlet floor), so no new battle
 * plumbing — just accumulate + claim.
 */

import type { SaveState } from './types'

export type BountyMetric =
  | 'wins'
  | 'kills'
  | 'combo'
  | 'crits'
  | 'flawless'
  | 'bossKills'
  | 'gauntletFloor'

/** Metrics that track a PEAK (take the max) vs. a running total (add). */
const MAX_METRICS = new Set<BountyMetric>(['combo', 'gauntletFloor'])

export type Bounty = {
  id: string
  name: string
  desc: string
  scope: 'daily' | 'weekly'
  metric: BountyMetric
  target: number
  reward: { gold?: number; shards?: number; xp?: number }
}

export const BOUNTIES: Record<string, Bounty> = {
  // ---- daily ----
  d_win3: { id: 'd_win3', name: 'EXPEDIENTE', desc: 'Vença 3 batalhas.', scope: 'daily', metric: 'wins', target: 3, reward: { gold: 600, shards: 12 } },
  d_kill8: { id: 'd_kill8', name: 'LIMPEZA', desc: 'Abata 8 heróis.', scope: 'daily', metric: 'kills', target: 8, reward: { gold: 700, shards: 14 } },
  d_combo5: { id: 'd_combo5', name: 'RITMO', desc: 'Alcance um combo de 5.', scope: 'daily', metric: 'combo', target: 5, reward: { gold: 500, shards: 16 } },
  d_crit10: { id: 'd_crit10', name: 'SANGUE FRIO', desc: 'Acerte 10 críticos.', scope: 'daily', metric: 'crits', target: 10, reward: { gold: 550, shards: 12 } },
  d_flawless1: { id: 'd_flawless1', name: 'IMPECÁVEL', desc: 'Vença 1 batalha sem perder ninguém.', scope: 'daily', metric: 'flawless', target: 1, reward: { gold: 800, shards: 18 } },
  d_poco5: { id: 'd_poco5', name: 'MERGULHO', desc: 'Chegue ao andar 5 do Poço.', scope: 'daily', metric: 'gauntletFloor', target: 5, reward: { gold: 700, shards: 20 } },
  d_boss1: { id: 'd_boss1', name: 'CAÇA GRANDE', desc: 'Abata 1 chefe.', scope: 'daily', metric: 'bossKills', target: 1, reward: { gold: 900, shards: 22 } },
  // ---- weekly ----
  w_win15: { id: 'w_win15', name: 'CAMPANHA DA SEMANA', desc: 'Vença 15 batalhas.', scope: 'weekly', metric: 'wins', target: 15, reward: { gold: 3000, shards: 80, xp: 400 } },
  w_kill50: { id: 'w_kill50', name: 'GENOCÍDIO DE HERÓIS', desc: 'Abata 50 heróis.', scope: 'weekly', metric: 'kills', target: 50, reward: { gold: 3500, shards: 90, xp: 500 } },
  w_combo8: { id: 'w_combo8', name: 'COREOGRAFIA', desc: 'Alcance um combo de 8.', scope: 'weekly', metric: 'combo', target: 8, reward: { gold: 2500, shards: 70, xp: 300 } },
  w_poco12: { id: 'w_poco12', name: 'ABISSAL', desc: 'Chegue ao andar 12 do Poço.', scope: 'weekly', metric: 'gauntletFloor', target: 12, reward: { gold: 4000, shards: 120, xp: 600 } },
  w_boss5: { id: 'w_boss5', name: 'MATA-CHEFES', desc: 'Abata 5 chefes.', scope: 'weekly', metric: 'bossKills', target: 5, reward: { gold: 4500, shards: 130, xp: 700 } },
  w_flawless3: { id: 'w_flawless3', name: 'SEM ARRANHÕES', desc: 'Vença 3 batalhas impecáveis.', scope: 'weekly', metric: 'flawless', target: 3, reward: { gold: 3200, shards: 85, xp: 450 } },
}

const DAILY_IDS = Object.values(BOUNTIES).filter((b) => b.scope === 'daily').map((b) => b.id)
const WEEKLY_IDS = Object.values(BOUNTIES).filter((b) => b.scope === 'weekly').map((b) => b.id)

/** YYYY-Www UTC week key. Cheap ISO-ish week number (good enough to rotate). */
export function weekKey(now = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const dayNum = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - dayNum + 3)
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4))
  const week = 1 + Math.round(((d.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7)
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

function hashSeed(str: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pickSet(pool: string[], n: number, seedKey: string): string[] {
  const rand = mulberry32(hashSeed(seedKey))
  const p = pool.slice()
  const out: string[] = []
  for (let i = 0; i < n && p.length; i++) {
    out.push(p.splice(Math.floor(rand() * p.length), 1)[0])
  }
  return out
}

type Bounties = NonNullable<SaveState['bounties']>

/** Rotate the daily/weekly sets when the day/week changes; preserve progress
 * for sets that didn't roll over. Always returns a valid bounties object. */
export function ensureBounties(prev: SaveState['bounties'], day: string, week: string): Bounties {
  let daily = prev?.daily ?? []
  let weekly = prev?.weekly ?? []
  let progress = { ...(prev?.progress ?? {}) }
  let claimed = [...(prev?.claimed ?? [])]
  const dayChanged = !prev || prev.day !== day
  const weekChanged = !prev || prev.week !== week
  if (dayChanged) {
    // clear old daily progress/claims, roll a fresh daily set
    const oldDaily = new Set(daily)
    for (const id of oldDaily) delete progress[id]
    claimed = claimed.filter((id) => !oldDaily.has(id))
    daily = pickSet(DAILY_IDS, 3, 'd-' + day)
  }
  if (weekChanged) {
    const oldWeekly = new Set(weekly)
    for (const id of oldWeekly) delete progress[id]
    claimed = claimed.filter((id) => !oldWeekly.has(id))
    weekly = pickSet(WEEKLY_IDS, 3, 'w-' + week)
  }
  return { day, week, daily, weekly, progress, claimed }
}

/** Increment progress for active bounties matching the given metric deltas. */
export function bumpBounties(
  prev: SaveState['bounties'],
  deltas: Partial<Record<BountyMetric, number>>,
): SaveState['bounties'] {
  if (!prev) return prev
  const progress = { ...prev.progress }
  for (const id of [...prev.daily, ...prev.weekly]) {
    const def = BOUNTIES[id]
    if (!def) continue
    const delta = deltas[def.metric]
    if (delta == null) continue
    const cur = progress[id] ?? 0
    progress[id] = MAX_METRICS.has(def.metric) ? Math.max(cur, delta) : cur + delta
  }
  return { ...prev, progress }
}
