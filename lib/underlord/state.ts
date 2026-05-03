/**
 * Top-level game state machine. Phase-driven (title → intro → warroom → battle
 * → loot → warroom). Persisted to localStorage.
 */

import type { LootItem, Phase, Region, RegionStatus, SaveState, Unit } from './types'
import { makeStarterRoster } from './units'
import { REGIONS } from './regions'

const STORAGE_KEY = 'underlord-save-v1'

export type GameState = {
  phase: Phase
  save: SaveState
  /** Currently selected region for briefing/battle. */
  pendingRegionId: string | null
  /** Last battle result for loot/result screens. */
  lastResult: {
    victory: boolean
    goldEarned: number
    loot: LootItem[]
    fallenIds: string[]
    killedHeroIds: string[]
    regionId: string
  } | null
}

export function freshSave(name: string): SaveState {
  const roster = makeStarterRoster()
  return {
    version: 1,
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
  }
}

function makeFreshRegionMap(): Record<string, RegionStatus> {
  const out: Record<string, RegionStatus> = {}
  for (const r of REGIONS) {
    // Tier 1 region available, rest locked behind links
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
    if (!parsed.save || parsed.save.version !== 1) return null
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
  | { type: 'apply-result'; result: NonNullable<GameState['lastResult']>; region: Region }
  | { type: 'equip'; unitId: string; lootId: string | null }
  | { type: 'reset' }

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
    case 'apply-result': {
      const { result, region } = action
      const save = { ...state.save }
      // Remove fallen units from roster
      save.roster = save.roster.filter((u) => !result.fallenIds.includes(u.id))
      save.squad = save.squad.filter((id) => !result.fallenIds.includes(id))

      if (result.victory) {
        save.gold += result.goldEarned
        save.inventory = [...save.inventory, ...result.loot]
        save.heroesKilled = Array.from(
          new Set([...save.heroesKilled, ...result.killedHeroIds]),
        )
        save.battlesWon += 1

        // Mark region cleared, unlock linked regions
        const regions = { ...save.regions, [region.id]: 'cleared' as RegionStatus }
        for (const linkId of region.links) {
          if (regions[linkId] === 'locked') regions[linkId] = 'available'
        }
        save.regions = regions
      } else {
        save.battlesLost += 1
      }

      return { ...state, save, lastResult: result }
    }
    case 'equip': {
      const save = { ...state.save }
      const unit = save.roster.find((u) => u.id === action.unitId)
      if (!unit) return state
      // Return previously equipped item to inventory
      const prevId = unit.equipped
      let inventory = save.inventory.slice()
      if (prevId) {
        const prevItem = state.save.inventory.find((i) => i.id === prevId)
        // Note: we don't store equipped items in inventory; restore by lookup happens in component
        if (prevItem) inventory = [...inventory, prevItem]
      }
      // Equip new
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
