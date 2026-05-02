import { Bomb, Eye, Heart, Shield, Sparkles, Zap, Droplet, Flame } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type Move = 'pedra' | 'papel' | 'tesoura'
export type Result = 'win' | 'lose' | 'draw'
export type Phase = 'menu' | 'choosing' | 'shaking' | 'reveal' | 'shop' | 'gameover'

export type PowerUpId =
  | 'shield'
  | 'crit'
  | 'spy'
  | 'bomb'
  | 'lucky'
  | 'heal'
  | 'siphon'
  | 'rage'

export type PowerUp = {
  id: PowerUpId
  name: string
  desc: string
  Icon: LucideIcon
  color: 'primary' | 'accent' | 'destructive'
  instant?: boolean
}

export const POWER_UPS: Record<PowerUpId, PowerUp> = {
  shield: {
    id: 'shield',
    name: 'BARREIRA',
    desc: 'Repele o próximo dano arcano recebido.',
    Icon: Shield,
    color: 'primary',
  },
  crit: {
    id: 'crit',
    name: 'SURTO',
    desc: 'Próxima vitória causa dano DOBRADO.',
    Icon: Zap,
    color: 'accent',
  },
  spy: {
    id: 'spy',
    name: 'VIDÊNCIA',
    desc: 'Revela o feitiço do oponente antes de você lançar.',
    Icon: Eye,
    color: 'primary',
  },
  bomb: {
    id: 'bomb',
    name: 'METEORO',
    desc: 'Invoca um meteoro: 25 de dano instantâneo.',
    Icon: Bomb,
    color: 'destructive',
    instant: true,
  },
  lucky: {
    id: 'lucky',
    name: 'BÊNÇÃO',
    desc: 'Próximo empate vira vitória.',
    Icon: Sparkles,
    color: 'accent',
  },
  heal: {
    id: 'heal',
    name: 'ELIXIR',
    desc: 'Recupera 30 de HP imediatamente.',
    Icon: Heart,
    color: 'primary',
    instant: true,
  },
  siphon: {
    id: 'siphon',
    name: 'DRENO',
    desc: 'Próxima vitória te cura 50% do dano causado.',
    Icon: Droplet,
    color: 'primary',
  },
  rage: {
    id: 'rage',
    name: 'CÓLERA',
    desc: '+50 de FÚRIA imediatamente.',
    Icon: Flame,
    color: 'destructive',
    instant: true,
  },
}

export const POWER_UP_POOL: PowerUpId[] = [
  'shield',
  'crit',
  'spy',
  'bomb',
  'lucky',
  'heal',
  'siphon',
  'rage',
]

/**
 * ELEMENTUM mapping (preserves the original counter triangle):
 * - HYDRO  (key: pedra)   beats PYRO,  loses to TERRA
 * - TERRA  (key: papel)   beats HYDRO, loses to PYRO
 * - PYRO   (key: tesoura) beats TERRA, loses to HYDRO
 */
export const MOVES: Record<Move, { label: string; emoji: string; beats: Move; counter: Move }> = {
  pedra: { label: 'HYDRO', emoji: '💧', beats: 'tesoura', counter: 'papel' },
  papel: { label: 'TERRA', emoji: '🌿', beats: 'pedra', counter: 'tesoura' },
  tesoura: { label: 'PYRO', emoji: '🔥', beats: 'papel', counter: 'pedra' },
}

export const MOVE_LIST: Move[] = ['pedra', 'papel', 'tesoura']

export const MAX_HP = 100
export const BASE_DAMAGE = 20
export const INVENTORY_LIMIT = 4
export const RAGE_MAX = 100
export const RAGE_GAIN_DAMAGE = 32
export const RAGE_GAIN_DRAW = 8
export const RAGE_GAIN_WIN = 4
export const ULTIMATE_DAMAGE = 60
export const SHOP_HEAL_SKIP = 25
export const STAGE_HEAL_BONUS = 20

/** Combo tier for streak-based damage multiplier. */
export type ComboTier = {
  min: number
  mult: number
  label: string
  level: number
  word: string
}

export const COMBO_TIERS: ComboTier[] = [
  { min: 0, mult: 1.0, label: 'x1.0', level: 0, word: '' },
  { min: 2, mult: 1.25, label: 'x1.25', level: 1, word: 'NICE' },
  { min: 3, mult: 1.5, label: 'x1.5', level: 2, word: 'GREAT' },
  { min: 4, mult: 2.0, label: 'x2.0', level: 3, word: 'RAMPAGE' },
  { min: 6, mult: 2.5, label: 'x2.5', level: 4, word: 'UNSTOPPABLE' },
  { min: 8, mult: 3.0, label: 'x3.0', level: 5, word: 'GODLIKE' },
]

export function getCombo(streak: number): ComboTier {
  let pick = COMBO_TIERS[0]
  for (const t of COMBO_TIERS) {
    if (streak >= t.min) pick = t
  }
  return pick
}
