/**
 * Top-level game state machine. Phase-driven (title → intro → warroom → battle
 * → loot → warroom). Persisted to localStorage.
 */

import type { LootItem, Phase, Region, RegionStatus, SaveState, Unit } from './types'
import { makeStarterRoster } from './units'
import { REGIONS } from './regions'
import {
  ACHIEVEMENTS,
  type AchievementId,
  levelFromXP,
  todayKey,
  xpForBattle,
} from './meta'

const STORAGE_KEY = 'underlord-save-v2'

export type GameState = {
  phase: Phase
  save: SaveState
  pendingRegionId: string | null
  lastResult: {
    victory: boolean
    goldEarned: number
    xpEarned: number
    loot: LootItem[]
    fallenIds: string[]
    killedHeroIds: string[]
    regionId: string
    comboHigh: number
    flawless: boolean
    /** Achievements unlocked by this battle. */
    unlockedAchievements: AchievementId[]
    /** Levels gained from this battle's XP (typically 0 or 1+). */
    levelsGained: number
  } | null
}

export function freshSave(name: string): SaveState {
  const roster = makeStarterRoster()
  return {
    version: 2,
    underlordName: name,
    roster,
    squad: roster.slice(0, 3).map((u) => u.id),
    regions: makeFreshRegionMap(),
    inventory: [],
    gold: 50,
    taint: 0,
    heroesKilled: [],
    battlesWon: 0,
    battlesLost: 0,
    xp: 0,
    dailyStreak: 0,
    lastPlayedDay: '',
    comboHigh: 0,
    critsLanded: 0,
    battlesSinceRare: 0,
    achievements: [],
  }
}

function makeFreshRegionMap(): Record<string, RegionStatus> {
  const out: Record<string, RegionStatus> = {}
  for (const r of REGIONS) {
    out[r.id] = r.stage === 1 ? 'available' : 'locked'
  }
  return out
}

export function freshGame(): GameState {
  return {
    phase: 'title',
    save: freshSave('Underlord'),
    pendingRegionId: null,
    lastResult: null,
  }
}

export function loadGame(): GameState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<GameState>
    if (!parsed.save || parsed.save.version !== 2) return null
    return {
      phase: 'warroom',
      save: parsed.save as SaveState,
      pendingRegionId: null,
      lastResult: null,
    }
  } catch {
    return null
  }
}

export function persistGame(state: GameState): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ save: state.save }))
  } catch {
    // ignore
  }
}

export function wipeSave(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
    // Also wipe v1 if present
    window.localStorage.removeItem('underlord-save-v1')
  } catch {
    // ignore
  }
}

/* ---------- Reducer actions ---------- */

export type Action =
  | { type: 'phase'; phase: Phase }
  | { type: 'set-name'; name: string }
  | { type: 'select-region'; regionId: string }
  | { type: 'set-squad'; squadIds: string[] }
  | {
      type: 'apply-result'
      result: {
        victory: boolean
        fallenIds: string[]
        killedHeroIds: string[]
        comboHigh: number
        flawless: boolean
        critsLanded: number
        firstBlood: boolean
      }
      region: Region
      loot: LootItem[]
      goldEarned: number
    }
  | { type: 'equip'; unitId: string; lootId: string | null }
  | { type: 'daily-checkin'; bonus: number; streak: number; today: string }
  | { type: 'reset' }

function unlockNew(save: SaveState, ids: AchievementId[]): {
  achievements: string[]
  unlocked: AchievementId[]
  bonusGold: number
} {
  const have = new Set(save.achievements)
  const unlocked: AchievementId[] = []
  let bonusGold = 0
  for (const id of ids) {
    if (!have.has(id)) {
      unlocked.push(id)
      have.add(id)
      bonusGold += ACHIEVEMENTS[id].reward
    }
  }
  return { achievements: Array.from(have), unlocked, bonusGold }
}

export function reduce(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'phase':
      return { ...state, phase: action.phase }
    case 'set-name':
      return { ...state, save: { ...state.save, underlordName: action.name } }
    case 'select-region':
      return { ...state, pendingRegionId: action.regionId, phase: 'briefing' }
    case 'set-squad':
      return { ...state, save: { ...state.save, squad: action.squadIds } }
    case 'daily-checkin': {
      return {
        ...state,
        save: {
          ...state.save,
          dailyStreak: action.streak,
          lastPlayedDay: action.today,
          gold: state.save.gold + action.bonus,
        },
      }
    }
    case 'apply-result': {
      const { result, region, loot, goldEarned } = action
      let save: SaveState = { ...state.save }
      // Remove fallen units from roster
      save.roster = save.roster.filter((u) => !result.fallenIds.includes(u.id))
      save.squad = save.squad.filter((id) => !result.fallenIds.includes(id))
      save.critsLanded = save.critsLanded + result.critsLanded
      save.comboHigh = Math.max(save.comboHigh, result.comboHigh)

      // Calculate XP
      const xpEarned = xpForBattle({
        victory: result.victory,
        stage: region.stage,
        heroesKilled: result.killedHeroIds.length,
        comboHigh: result.comboHigh,
      })

      // Capture old level for comparison
      const oldLevel = levelFromXP(save.xp)
      save.xp = save.xp + xpEarned
      const newLevel = levelFromXP(save.xp)
      const levelsGained = newLevel - oldLevel

      if (result.victory) {
        save.gold += goldEarned
        save.inventory = [...save.inventory, ...loot]
        save.heroesKilled = Array.from(
          new Set([...save.heroesKilled, ...result.killedHeroIds]),
        )
        save.battlesWon += 1

        // Pity timer reset/increment
        const gotRare = loot.some((l) => l.rarity === 'cursed' || l.rarity === 'relic')
        save.battlesSinceRare = gotRare ? 0 : save.battlesSinceRare + 1

        // Mark region cleared, unlock linked regions
        const regions = { ...save.regions, [region.id]: 'cleared' as RegionStatus }
        for (const linkId of region.links) {
          if (regions[linkId] === 'locked') regions[linkId] = 'available'
        }
        save.regions = regions
      } else {
        save.battlesLost += 1
        save.battlesSinceRare = save.battlesSinceRare + 1
      }

      // Achievement checks
      const candidateAchievements: AchievementId[] = []
      if (result.firstBlood) candidateAchievements.push('first_blood')
      if (result.killedHeroIds.length > 0) {
        candidateAchievements.push('first_kill')
        candidateAchievements.push('hero_slayer_1')
      }
      if (result.comboHigh >= 3) candidateAchievements.push('combo_3')
      if (result.comboHigh >= 5) candidateAchievements.push('combo_5')
      if (result.victory && result.flawless) candidateAchievements.push('flawless')
      if (save.heroesKilled.length >= 5) candidateAchievements.push('hero_slayer_5')
      if (save.heroesKilled.length >= 14) candidateAchievements.push('hero_slayer_all')
      if (save.dailyStreak >= 3) candidateAchievements.push('streak_3')
      if (save.dailyStreak >= 7) candidateAchievements.push('streak_7')
      if (loot.some((l) => l.rarity === 'relic')) candidateAchievements.push('first_relic')
      if (save.taint + loot.reduce((acc, l) => acc + l.taint, 0) >= 5) {
        candidateAchievements.push('tainted')
      }

      const { achievements, unlocked, bonusGold } = unlockNew(save, candidateAchievements)
      save.achievements = achievements
      save.gold = save.gold + bonusGold

      // Stamp last played day for streak
      save.lastPlayedDay = todayKey()

      return {
        ...state,
        save,
        lastResult: {
          victory: result.victory,
          goldEarned: goldEarned + bonusGold,
          xpEarned,
          loot,
          fallenIds: result.fallenIds,
          killedHeroIds: result.killedHeroIds,
          regionId: region.id,
          comboHigh: result.comboHigh,
          flawless: result.flawless,
          unlockedAchievements: unlocked,
          levelsGained,
        },
      }
    }
    case 'equip': {
      const save = { ...state.save }
      const unit = save.roster.find((u) => u.id === action.unitId)
      if (!unit) return state
      const prevId = unit.equipped
      let inventory = save.inventory.slice()
      if (prevId) {
        const prevItem = state.save.inventory.find((i) => i.id === prevId)
        if (prevItem) inventory = [...inventory, prevItem]
      }
      let newItem: LootItem | undefined
      if (action.lootId) {
        newItem = inventory.find((i) => i.id === action.lootId)
        if (newItem) inventory = inventory.filter((i) => i !== newItem)
      }
      save.roster = save.roster.map((u) =>
        u.id === action.unitId ? { ...u, equipped: action.lootId ?? undefined } : u,
      )
      save.inventory = inventory
      return { ...state, save }
    }
    case 'reset':
      return freshGame()
  }
}
