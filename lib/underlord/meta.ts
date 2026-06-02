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
  const bonus = 125 + Math.min(newStreak * 50, 1000)
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
  /* v11 — ASCENSION achievements */
  | 'hero_slayer_20'
  | 'hero_slayer_30'
  | 'hero_slayer_50'
  | 'veteran_10'
  | 'veteran_50'
  | 'veteran_100'
  | 'combo_7'
  | 'combo_10'
  | 'streak_14'
  | 'streak_30'
  | 'tainted_20'
  | 'mythic_bearer'
  | 'ascendant_1'
  | 'void_conqueror'

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
    reward: 125,
  },
  first_kill: {
    id: 'first_kill',
    title: 'PRIMEIRO CADÁVER',
    desc: 'Matou um herói. Não vai ser o último.',
    reward: 250,
  },
  combo_3: {
    id: 'combo_3',
    title: 'TRIPLO',
    desc: 'Combo x3 num único turno.',
    reward: 200,
  },
  combo_5: {
    id: 'combo_5',
    title: 'QUÍNTUPLO',
    desc: 'Combo x5. Os heróis estão em fila.',
    reward: 500,
  },
  hero_slayer_1: {
    id: 'hero_slayer_1',
    title: 'ABATEDOR',
    desc: 'Caçou seu primeiro herói. Adicionado à galeria.',
    reward: 250,
  },
  hero_slayer_5: {
    id: 'hero_slayer_5',
    title: 'CAÇADOR DE INFLUENCERS',
    desc: '5 heróis abatidos.',
    reward: 750,
  },
  hero_slayer_all: {
    id: 'hero_slayer_all',
    title: 'O REINO É SEU',
    desc: 'Todos os 14 heróis caíram.',
    reward: 5000,
  },
  flawless: {
    id: 'flawless',
    title: 'IMPECÁVEL',
    desc: 'Vitória sem perder um único minion.',
    reward: 400,
  },
  streak_3: {
    id: 'streak_3',
    title: 'TRÊS DIAS',
    desc: '3 dias seguidos de violência. Saudável.',
    reward: 375,
  },
  streak_7: {
    id: 'streak_7',
    title: 'UMA SEMANA',
    desc: '7 dias. Você esqueceu o que é um fim de semana.',
    reward: 1250,
  },
  first_relic: {
    id: 'first_relic',
    title: 'RELÍQUIA',
    desc: 'Equipou seu primeiro item de raridade Relíquia.',
    reward: 500,
  },
  tainted: {
    id: 'tainted',
    title: 'CORROMPIDO',
    desc: 'Acumulou Taint 5+. Os minions começaram a falar dormindo.',
    reward: 300,
  },
  /* v11 — ASCENSION achievements */
  hero_slayer_20: {
    id: 'hero_slayer_20',
    title: 'COVEIRO DE PLANTÃO',
    desc: '20 heróis enterrados. A guilda já parou de mandar flores.',
    reward: 900,
  },
  hero_slayer_30: {
    id: 'hero_slayer_30',
    title: 'EPIDEMIA DE HERÓIS',
    desc: '30 abatidos. As tavernas trocaram as canções por obituários.',
    reward: 1400,
  },
  hero_slayer_50: {
    id: 'hero_slayer_50',
    title: 'EXTERMINADOR DE LENDAS',
    desc: '50 heróis. O reino agora contrata estagiários sem garantia de retorno.',
    reward: 2500,
  },
  veteran_10: {
    id: 'veteran_10',
    title: 'RECRUTA SANGRENTO',
    desc: '10 batalhas vencidas. Já sabe limpar a masmorra antes das visitas.',
    reward: 500,
  },
  veteran_50: {
    id: 'veteran_50',
    title: 'GENERAL DAS TREVAS',
    desc: '50 vitórias. Seus minions juram lealdade e umas faltas justificadas.',
    reward: 1800,
  },
  veteran_100: {
    id: 'veteran_100',
    title: 'TIRANO IMORTAL',
    desc: '100 batalhas vencidas. A própria morte pede autógrafo.',
    reward: 4000,
  },
  combo_7: {
    id: 'combo_7',
    title: 'SÉTIMO CÉU',
    desc: 'Combo x7. Os heróis caem em ritmo de coreografia.',
    reward: 900,
  },
  combo_10: {
    id: 'combo_10',
    title: 'PERFEIÇÃO ESCROTA',
    desc: 'Combo x10 num só turno. Isso já não é jogo, é assédio.',
    reward: 1600,
  },
  streak_14: {
    id: 'streak_14',
    title: 'DUAS SEMANAS DE PECADO',
    desc: '14 dias seguidos. Seu terapeuta abandonou o caso.',
    reward: 2200,
  },
  streak_30: {
    id: 'streak_30',
    title: 'UM MÊS DE RUÍNA',
    desc: '30 dias consecutivos. Você é o vilão E o vício.',
    reward: 4000,
  },
  tainted_20: {
    id: 'tainted_20',
    title: 'PURAMENTE PODRE',
    desc: 'Taint 20+. Os minions agora sussurram seu nome com carinho doentio.',
    reward: 1200,
  },
  mythic_bearer: {
    id: 'mythic_bearer',
    title: 'PORTADOR DO MITO',
    desc: 'Equipou um item Mítico. Até o item finge não saber de onde veio.',
    reward: 1500,
  },
  ascendant_1: {
    id: 'ascendant_1',
    title: 'O PRIMEIRO DEGRAU',
    desc: 'Limpou um nível de Ascensão. A realidade range, mas obedece.',
    reward: 3000,
  },
  void_conqueror: {
    id: 'void_conqueror',
    title: 'CARRASCO DO LEITOR',
    desc: 'Derrotou O LEITOR, o chefe final do vazio. Quem narrava, agora cala.',
    reward: 6000,
  },
}

/* ---------- Pity timer for loot ---------- */

/** Returns true if next loot roll should force at least 'cursed' rarity. */
export function shouldForceRare(save: SaveState): boolean {
  return (save.battlesSinceRare ?? 0) >= 4
}
