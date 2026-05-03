/**
 * Top-level game state machine. Phase-driven (title → intro → warroom → battle
 * → loot → warroom). Persisted to localStorage.
 */

import type { LootItem, Phase, Region, RegionStatus, SaveState, Unit } from './types'
import { makeStarterRoster, rebuildRosterStats } from './units'
import { REGIONS } from './regions'
import {
  ACHIEVEMENTS,
  type AchievementId,
  levelFromXP,
  todayKey,
  xpForBattle,
} from './meta'
import { goldMult, PERKS, type PerkId, perksSpent, squadCap, xpMult } from './perks'

const STORAGE_KEY = 'underlord-save-v3'
const LEGACY_KEY_V2 = 'underlord-save-v2'

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
    /** Perk points granted by those level-ups. */
    perkPointsGained: number
  } | null
}

export function freshSave(name: string): SaveState {
  const roster = makeStarterRoster()
  return {
    version: 3,
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
    perkPoints: 0,
    highestLevel: 1,
    perks: {},
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

/** Migrate a v2 save into v3 shape. */
function migrateV2(parsed: { save?: Partial<SaveState> }): SaveState | null {
  const s = parsed.save
  if (!s) return null
  const level = levelFromXP(s.xp ?? 0)
  return {
    version: 3,
    underlordName: s.underlordName ?? 'Underlord',
    roster: s.roster ?? makeStarterRoster(),
    squad: s.squad ?? [],
    regions: s.regions ?? makeFreshRegionMap(),
    inventory: s.inventory ?? [],
    gold: s.gold ?? 50,
    taint: s.taint ?? 0,
    heroesKilled: s.heroesKilled ?? [],
    battlesWon: s.battlesWon ?? 0,
    battlesLost: s.battlesLost ?? 0,
    xp: s.xp ?? 0,
    dailyStreak: s.dailyStreak ?? 0,
    lastPlayedDay: s.lastPlayedDay ?? '',
    comboHigh: s.comboHigh ?? 0,
    critsLanded: s.critsLanded ?? 0,
    battlesSinceRare: s.battlesSinceRare ?? 0,
    achievements: s.achievements ?? [],
    // Grant retroactive perk points so existing players don't lose progress.
    perkPoints: Math.max(0, level - 1),
    highestLevel: level,
    perks: {},
  }
}

export function loadGame(): GameState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<GameState>
      if (!parsed.save || parsed.save.version !== 3) {
        // Same key but bad version — try the migration path below.
      } else {
        return {
          phase: 'warroom',
          save: parsed.save as SaveState,
          pendingRegionId: null,
          lastResult: null,
        }
      }
    }
    // Try v2 migration
    const legacy = window.localStorage.getItem(LEGACY_KEY_V2)
    if (legacy) {
      const parsed = JSON.parse(legacy) as { save?: Partial<SaveState> }
      const migrated = migrateV2(parsed)
      if (migrated) {
        // Persist migrated under v3 key
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ save: migrated }),
        )
        return {
          phase: 'warroom',
          save: migrated,
          pendingRegionId: null,
          lastResult: null,
        }
      }
    }
    return null
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
    window.localStorage.removeItem(LEGACY_KEY_V2)
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
  | { type: 'spend-perk'; perkId: PerkId }
  | { type: 'respec' }
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
    case 'set-squad': {
      // Cap squad size at the perk-derived max. Silently drop overflow.
      const cap = squadCap(state.save.perks)
      const trimmed = action.squadIds.slice(0, cap)
      return { ...state, save: { ...state.save, squad: trimmed } }
    }
    case 'spend-perk': {
      const def = PERKS[action.perkId]
      if (!def) return state
      const cur = state.save.perks[action.perkId] ?? 0
      if (cur >= def.maxRank) return state
      const lvl = levelFromXP(state.save.xp)
      if (lvl < def.tierLevel) return state
      if (state.save.perkPoints <= 0) return state
      const nextPerks = { ...state.save.perks, [action.perkId]: cur + 1 }
      // Recompute roster stats so the rank takes effect on existing minions.
      const nextRoster = rebuildRosterStats(state.save.roster, nextPerks)
      // If squad cap shrank somehow (it can't — perks only grow), trim. If it
      // grew, leave the squad alone; player picks new slots themselves.
      const cap = squadCap(nextPerks)
      const trimmedSquad = state.save.squad.slice(0, cap)
      return {
        ...state,
        save: {
          ...state.save,
          perkPoints: state.save.perkPoints - 1,
          perks: nextPerks,
          roster: nextRoster,
          squad: trimmedSquad,
        },
      }
    }
    case 'respec': {
      // Refund every spent point. Roster reverts to baseline stats.
      const refund = perksSpent(state.save.perks)
      const nextRoster = rebuildRosterStats(state.save.roster, {})
      const cap = squadCap({})
      return {
        ...state,
        save: {
          ...state.save,
          perkPoints: state.save.perkPoints + refund,
          perks: {},
          roster: nextRoster,
          squad: state.save.squad.slice(0, cap),
        },
      }
    }
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

      // XP: scaled by perk
      const baseXp = xpForBattle({
        victory: result.victory,
        stage: region.stage,
        heroesKilled: result.killedHeroIds.length,
        comboHigh: result.comboHigh,
      })
      const xpEarned = Math.floor(baseXp * xpMult(save.perks))

      const oldLevel = levelFromXP(save.xp)
      save.xp = save.xp + xpEarned
      const newLevel = levelFromXP(save.xp)
      const levelsGained = newLevel - oldLevel

      // Award one perk point per NEW level reached (capped vs. highestLevel
      // so respecs/reloads can't farm extra points).
      let perkPointsGained = 0
      if (newLevel > save.highestLevel) {
        perkPointsGained = newLevel - save.highestLevel
        save.perkPoints = save.perkPoints + perkPointsGained
        save.highestLevel = newLevel
      }

      // Gold: scaled by perk
      const goldFinal = Math.floor(goldEarned * goldMult(save.perks))

      if (result.victory) {
        save.gold += goldFinal
        save.inventory = [...save.inventory, ...loot]
        save.heroesKilled = Array.from(
          new Set([...save.heroesKilled, ...result.killedHeroIds]),
        )
        save.battlesWon += 1

        const gotRare = loot.some((l) => l.rarity === 'cursed' || l.rarity === 'relic')
        save.battlesSinceRare = gotRare ? 0 : save.battlesSinceRare + 1

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

      save.lastPlayedDay = todayKey()

      return {
        ...state,
        save,
        lastResult: {
          victory: result.victory,
          goldEarned: goldFinal + bonusGold,
          xpEarned,
          loot,
          fallenIds: result.fallenIds,
          killedHeroIds: result.killedHeroIds,
          regionId: region.id,
          comboHigh: result.comboHigh,
          flawless: result.flawless,
          unlockedAchievements: unlocked,
          levelsGained,
          perkPointsGained,
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
