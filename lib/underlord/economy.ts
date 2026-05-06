/**
 * Economy v2 — Soulshards & Black Market.
 *
 * The original game shipped with a single currency (Gold) earned per
 * battle. Long-running players ran out of meaningful spend after Forja
 * was maxed. v2 introduces a parallel currency — Soulshards — and a
 * predictable, daily-rotating shop (Black Market) that gives the player
 * a real reason to log in every day even when they don't feel like
 * grinding a region.
 *
 * Sources of Soulshards:
 *   1. Daily login pouch          — 25 shards (claimDailyShards)
 *   2. Battle consolation         — 5-15 shards/win (winRewardShards)
 *   3. Item dismantle             — by rarity (dismantleValue)
 *
 * Sinks:
 *   1. Black Market               — guaranteed-rarity items at fair prices
 *   2. (future) Re-roll boons     — already gated by victory pacing
 *
 * Numbers were tuned so that ~3 days of casual play (1-2 wins/day) buys
 * a single legendary, while a focused grinder can buy one in ~1 day.
 */

import { LOOT_POOL } from './loot'
import type { LootItem, LootRarity, SaveState } from './types'

/** Soulshards earned per win, scaled by the region's stage. Roughly 1
 * shard per stage with a 5-shard floor so even Stage-1 grinds reward
 * something. Capped at 15 so late-game farming doesn't trivialize the
 * shop economy. */
export function winRewardShards(stage: number): number {
  return Math.max(5, Math.min(15, Math.floor(stage * 0.9) + 4))
}

/** Defeat consolation — small shard drip so a wipe isn't 100% wasted.
 * Scales with stage so dying in late content is less punishing. */
export function lossConsolationShards(stage: number): number {
  return Math.max(1, Math.floor(stage / 3))
}

/** Soulshards yielded by dismantling a single piece of loot. The values
 * are deliberately less than what the Black Market charges for the same
 * rarity — dismantling is a salvage option, not a trading sim. */
export function dismantleValue(rarity: LootRarity): number {
  switch (rarity) {
    case 'common':
      return 2
    case 'uncommon':
      return 5
    case 'cursed':
      return 12
    case 'relic':
      return 30
    case 'legendary':
      return 80
  }
}

/** Daily login pouch. Same value every day so streaks feel honest.
 * Streaks are tracked separately by the existing `dailyStreak` counter. */
export const DAILY_SHARD_POUCH = 25

/** Returns "YYYY-MM-DD" for the current UTC day. Used as the rotation
 * key for the Black Market and as the daily-claim lockout key. UTC is
 * deliberate: a player on a flight crossing timezones shouldn't be able
 * to game the daily by setting their phone clock back. */
export function todayKey(now = new Date()): string {
  const y = now.getUTCFullYear()
  const m = String(now.getUTCMonth() + 1).padStart(2, '0')
  const d = String(now.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** True if the player is allowed to claim today's login pouch. */
export function canClaimDailyShards(save: SaveState, now = new Date()): boolean {
  return save.lastShardClaimDay !== todayKey(now)
}

/* ------------------------------------------------------------------ */
/* Black Market                                                        */
/* ------------------------------------------------------------------ */

/** Black Market price per rarity. Common items are intentionally NOT
 * sold — those are noise. The shop only stocks uncommon and up. */
export const BM_PRICES: Partial<Record<LootRarity, number>> = {
  uncommon: 15,
  cursed: 40,
  relic: 110,
  legendary: 300,
}

/** Daily shop offer — five slots curated from the loot pool. The seed
 * is the day key, so every player worldwide sees the same rotation on a
 * given day (makes it easier to talk about online). */
export interface BlackMarketOffer {
  /** ISO date this rotation belongs to. */
  day: string
  items: LootItem[]
  prices: Record<string, number>
}

/**
 * Deterministic PRNG (mulberry32). Same seed → same sequence, no matter
 * the platform. Used to keep the Black Market consistent across reloads
 * within the same UTC day.
 */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Hash a string to a 32-bit seed (FNV-1a). Stable across runs. */
function hashSeed(str: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/**
 * Build the Black Market offer for a given day. Always returns 5 items:
 *   - 1 uncommon (entry tier, cheap)
 *   - 2 cursed   (mid-game staples)
 *   - 1 relic    (the real prize for daily logins)
 *   - 1 legendary (the carrot — saves up for ~3 days, sometimes longer)
 *
 * Mix is deterministic per `day`, so a player who reloads gets the same
 * shop. New day → new shop.
 */
export function buildBlackMarket(day: string): BlackMarketOffer {
  const rand = mulberry32(hashSeed(day))
  const pickFrom = (rarity: LootRarity): LootItem => {
    const candidates = LOOT_POOL.filter((p) => p.rarity === rarity)
    return candidates[Math.floor(rand() * candidates.length)]!
  }
  const items = [
    pickFrom('uncommon'),
    pickFrom('cursed'),
    pickFrom('cursed'),
    pickFrom('relic'),
    pickFrom('legendary'),
  ]
  const prices: Record<string, number> = {}
  for (const it of items) {
    prices[it.id] = BM_PRICES[it.rarity] ?? 0
  }
  return { day, items, prices }
}
