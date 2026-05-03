/**
 * Meta progression: XP, daily streak, achievements, pity timer.
 *
 * These are the core "addiction" hooks. Cheap dopamine drops on top of the
 * tactical battle layer.
 */

import type { SaveState } from './types'

/* ---------- Underlord level curve ---------- */

/** XP required to reach level N (cumulative). */
export function xpForLevel(level: number): number {
  // Quadratic-ish curve. L1 = 0, L2 = 100, L3 = 240, L4 = 420...
  if (level <= 1) return 0
  return Math.floor(60 * level * level - 60 * level)
}

export function levelFromXP(xp: number): number {
  let lvl = 1
  while (xpForLevel(lvl + 1) <= xp) lvl += 1
  return lvl
}

export function xpProgress(xp: number): {
  level: number
  intoLevel: number
  needed: number
  pct: number
} {
  const level = levelFromXP(xp)
  const base = xpForLevel(level)
  const next = xpForLevel(level + 1)
  const intoLevel = xp - base
  const needed = next - base
  return { level, intoLevel, needed, pct: needed > 0 ? intoLevel / needed : 1 }
}

/** Calculate XP awarded for a battle outcome. */
export function xpForBattle(opts: {
  victory: boolean
  stage: number
  heroesKilled: number
  comboHigh: number
}): number {
  const { victory, stage, heroesKilled, comboHigh } = opts
  let base = victory ? 40 + stage * 20 : 12 + stage * 4
  base += heroesKilled * 25
  base += comboHigh * 5
  return Math.floor(base)
}

/* ---------- Daily streak ---------- */

/** Returns YYYY-MM-DD for the player's local date. */
export function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Returns yesterday's YYYY-MM-DD. */
export function yesterdayKey(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Returns updated streak data given today's check-in. */
export function tickStreak(save: SaveState): {
  streak: number
  lastDay: string
  /** Bonus gold awarded for first check-in of day (0 if same-day). */
  bonus: number
  /** True if streak was reset (broken). */
  reset: boolean
} {
  const today = todayKey()
  if (save.lastPlayedDay === today) {
    return { streak: save.dailyStreak, lastDay: today, bonus: 0, reset: false }
  }
  const yesterday = yesterdayKey()
  const continued = save.lastPlayedDay === yesterday
  const newStreak = continued ? save.dailyStreak + 1 : 1
  const bonus = 25 + Math.min(newStreak * 10, 200)
  return {
    streak: newStreak,
    lastDay: today,
    bonus,
    reset: !continued && save.dailyStreak > 1,
  }
}

/* ---------- Achievements ---------- */

export type AchievementId =
  | 'first_blood'
  | 'first_kill'
  | 'combo_3'
  | 'combo_5'
  | 'hero_slayer_1'
  | 'hero_slayer_5'
  | 'hero_slayer_all'
  | 'flawless'
  | 'streak_3'
  | 'streak_7'
  | 'first_relic'
  | 'tainted'

export type AchievementDef = {
  id: AchievementId
  title: string
  desc: string
  reward: number // gold
}

export const ACHIEVEMENTS: Record<AchievementId, AchievementDef> = {
  first_blood: {
    id: 'first_blood',
    title: 'PRIMEIRO SANGUE',
    desc: 'Acertou seu primeiro ataque. Bem-vindo de volta.',
    reward: 25,
  },
  first_kill: {
    id: 'first_kill',
    title: 'PRIMEIRO CADÁVER',
    desc: 'Matou um herói. Não vai ser o último.',
    reward: 50,
  },
  combo_3: {
    id: 'combo_3',
    title: 'TRIPLO',
    desc: 'Combo x3 num único turno.',
    reward: 40,
  },
  combo_5: {
    id: 'combo_5',
    title: 'QUÍNTUPLO',
    desc: 'Combo x5. Os heróis estão em fila.',
    reward: 100,
  },
  hero_slayer_1: {
    id: 'hero_slayer_1',
    title: 'ABATEDOR',
    desc: 'Caçou seu primeiro herói. Adicionado à galeria.',
    reward: 50,
  },
  hero_slayer_5: {
    id: 'hero_slayer_5',
    title: 'CAÇADOR DE INFLUENCERS',
    desc: '5 heróis abatidos.',
    reward: 150,
  },
  hero_slayer_all: {
    id: 'hero_slayer_all',
    title: 'O REINO É SEU',
    desc: 'Todos os 14 heróis caíram.',
    reward: 1000,
  },
  flawless: {
    id: 'flawless',
    title: 'IMPECÁVEL',
    desc: 'Vitória sem perder um único minion.',
    reward: 80,
  },
  streak_3: {
    id: 'streak_3',
    title: 'TRÊS DIAS',
    desc: '3 dias seguidos de violência. Saudável.',
    reward: 75,
  },
  streak_7: {
    id: 'streak_7',
    title: 'UMA SEMANA',
    desc: '7 dias. Você esqueceu o que é um fim de semana.',
    reward: 250,
  },
  first_relic: {
    id: 'first_relic',
    title: 'RELÍQUIA',
    desc: 'Equipou seu primeiro item de raridade Relíquia.',
    reward: 100,
  },
  tainted: {
    id: 'tainted',
    title: 'CORROMPIDO',
    desc: 'Acumulou Taint 5+. Os minions começaram a falar dormindo.',
    reward: 60,
  },
}

/* ---------- Pity timer for loot ---------- */

/** Returns true if next loot roll should force at least 'cursed' rarity. */
export function shouldForceRare(save: SaveState): boolean {
  return (save.battlesSinceRare ?? 0) >= 4
}
