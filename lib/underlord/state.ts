/**
 * Top-level game state machine. Phase-driven (title → intro → warroom → battle
 * → loot → warroom). Persisted to localStorage.
 */

import type { LootItem, Phase, Region, RegionStatus, SaveState, Unit } from './types'
import {
  makeStarterRoster,
  newlyUnlockedAt,
  rebuildRosterStats,
  recruitMinion,
} from './units'
import { REGIONS } from './regions'
import {
  ACHIEVEMENTS,
  type AchievementId,
  levelFromXP,
  todayKey,
  xpForBattle,
} from './meta'
import { goldMult, PERKS, type PerkId, perksSpent, squadCap, xpMult } from './perks'
import {
  DEFAULT_LOADOUT,
  newlyUnlockedSkills,
  OVERLORD_SKILLS,
  SKILL_SLOTS,
  unlockedSkillIds,
} from './overlord-skills'
import { aggregateBoons, BOONS, rollBoonChoices } from './boons'
import {
  canClaimDailyShards,
  DAILY_SHARD_POUCH,
  dismantleValue,
  lossConsolationShards,
  todayKey as economyTodayKey,
  winRewardShards,
} from './economy'
import { ascensionMods, CURSES, MAX_ASCENSION } from './ascension'

const STORAGE_KEY = 'underlord-save-v5'
const LEGACY_KEY_V4 = 'underlord-save-v4'
const LEGACY_KEY_V3 = 'underlord-save-v3'
const LEGACY_KEY_V2 = 'underlord-save-v2'

export type GameState = {
  phase: Phase
  save: SaveState
  pendingRegionId: string | null
  lastResult: {
    victory: boolean
    goldEarned: number
    /** Soulshards awarded by this battle (win or loss). Surfaced on the
     * loot screen so the player learns the alt currency exists. */
    shardsEarned: number
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
    /** Minion archetypes recruited automatically from level-up unlocks. */
    unlockedArchetypes: string[]
    /** Skill ids the Underlord just unlocked (auto-added to pool, NOT auto-
     * equipped — player decides via the Skill Map). */
    unlockedSkills: string[]
    /** 3 randomly-rolled boon ids the player must choose from before
     * leaving the loot screen. Only present after a victory. */
    boonChoices: string[]
  } | null
}

export function freshSave(name: string): SaveState {
  const roster = makeStarterRoster()
  return {
    version: 5,
    underlordName: name,
    roster,
    squad: roster.slice(0, 3).map((u) => u.id),
    regions: makeFreshRegionMap(),
    inventory: [],
    gold: 250,
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
    // The original five archetypes are always available; bone/harpy/etc.
    // unlock through Underlord level milestones.
    unlockedArchetypes: [],
    // Skill Map starts with the level-1 trio unlocked AND equipped.
    unlockedSkills: unlockedSkillIds(1),
    equippedSkills: DEFAULT_LOADOUT.slice(0, SKILL_SLOTS),
    // No boons accumulated yet — every victory is a chance to grab one.
    boons: [],
    // Economy v2 — Soulshards start at 0; player earns them by winning,
    // dismantling, or claiming the daily pouch.
    soulshards: 0,
    lastShardClaimDay: '',
    blackMarketBought: [],
    // Ascension (v11) — base game until the player opts into difficulty.
    ascension: 0,
    ascensionUnlocked: 0,
    curses: [],
    lastTrialDay: '',
    trialBest: 0,
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

/** Migrate any older save into v5 shape. v5 introduces the Underlord Skill
 * Map: an alterable loadout of active abilities. Pre-v5 saves never had
 * skills; we retroactively grant every skill whose unlockLevel ≤ current
 * level so a returning player isn't punished for already being level 7. */
function migrateLegacy(parsed: { save?: Partial<SaveState> }): SaveState | null {
  const s = parsed.save
  if (!s) return null
  const level = levelFromXP(s.xp ?? 0)
  // Rebuild any saved roster against the new (5x bigger) baseline templates.
  const incomingRoster = s.roster ?? makeStarterRoster()
      const rebuilt = rebuildRosterStats(
        incomingRoster,
        s.perks ?? {},
        ((s as Partial<SaveState>).boons ?? []).filter((id) => !!BOONS[id]),
      )
  // Carry skill state forward if it's already there (v4→v5 partial saves);
  // otherwise grant every level-appropriate skill and the default loadout.
  const unlockedSkills =
    (s as Partial<SaveState>).unlockedSkills && (s as SaveState).unlockedSkills.length > 0
      ? (s as SaveState).unlockedSkills
      : unlockedSkillIds(level)
  const equippedSkills =
    (s as Partial<SaveState>).equippedSkills && (s as SaveState).equippedSkills.length > 0
      ? (s as SaveState).equippedSkills
      : DEFAULT_LOADOUT.slice(0, SKILL_SLOTS)
  return {
    version: 5,
    underlordName: s.underlordName ?? 'Underlord',
    roster: rebuilt,
    squad: s.squad ?? rebuilt.slice(0, 3).map((u) => u.id),
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
    perkPoints: s.perkPoints ?? Math.max(0, level - 1),
    highestLevel: s.highestLevel ?? level,
    perks: s.perks ?? {},
    unlockedArchetypes: s.unlockedArchetypes ?? [],
    unlockedSkills,
    equippedSkills,
    // Older saves carry no boons — that's fine, they'll start picking
    // them on their next victory.
    boons: ((s as Partial<SaveState>).boons ?? []).filter((id) => !!BOONS[id]),
    // Economy v2 fields — preserve when present, otherwise seed at 0 so
    // a returning player gets the daily pouch on their next login.
    soulshards: (s as Partial<SaveState>).soulshards ?? 0,
    lastShardClaimDay: (s as Partial<SaveState>).lastShardClaimDay ?? '',
    blackMarketBought: (s as Partial<SaveState>).blackMarketBought ?? [],
  }
}

export function loadGame(): GameState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<GameState>
      if (parsed.save && parsed.save.version === 5) {
        return {
          phase: 'warroom',
          save: parsed.save as SaveState,
          pendingRegionId: null,
          lastResult: null,
        }
      }
    }
    // Migrate from older versions if present.
    for (const key of [LEGACY_KEY_V4, LEGACY_KEY_V3, LEGACY_KEY_V2]) {
      const legacy = window.localStorage.getItem(key)
      if (!legacy) continue
      const parsed = JSON.parse(legacy) as { save?: Partial<SaveState> }
      const migrated = migrateLegacy(parsed)
      if (migrated) {
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
    window.localStorage.removeItem(LEGACY_KEY_V4)
    window.localStorage.removeItem(LEGACY_KEY_V3)
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
  | { type: 'set-skill-loadout'; skillIds: string[] }
  | { type: 'pick-boon'; boonId: string }
  /** Claim today's daily Soulshard pouch. No-op if already claimed. */
  | { type: 'claim-shards' }
  /** Dismantle an inventory item into Soulshards. Removes the item and
   * adds shards based on its rarity (see `dismantleValue`). */
  | { type: 'dismantle-loot'; lootId: string }
  /** Buy an item from the daily Black Market. Charges shards, adds the
   * item to inventory, and marks the offer as spent so it can't be
   * re-bought today. */
  | { type: 'bm-buy'; itemId: string; price: number; item: LootItem }
  /** v11 — set the Ascension tier + active Maldições (curses). The tier is
   * clamped to what the player has unlocked; curse ids are validated. */
  | { type: 'set-ascension'; tier: number; curses: string[] }
  | { type: 'reset' }
  /** v8 — Replace the entire game state with a fresh hydration from
   * persistence. Used by the Title screen's "CONTINUAR" button so we can
   * resume a save WITHOUT a `window.location.reload()` (which caused a
   * one-frame flicker followed by a reset to Title because the page
   * remount initialized `useReducer` with `freshGame()` again). The
   * payload comes straight from `loadGame()`. */
  | { type: 'load-save'; state: GameState }

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
    case 'load-save':
      // Trust the loader — it already migrated and validated. Replacing
      // the whole tree (rather than spreading) means no stale fragments
      // from the title-screen `freshGame()` leak into the resumed run.
      return action.state
    case 'set-name':
      return { ...state, save: { ...state.save, underlordName: action.name } }
    case 'select-region':
      return { ...state, pendingRegionId: action.regionId, phase: 'briefing' }
    case 'set-squad': {
      // Cap squad size at the level + perk-derived max. Silently drop overflow.
      const lvl = levelFromXP(state.save.xp)
      const cap = squadCap(state.save.perks, lvl)
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
      const nextRoster = rebuildRosterStats(state.save.roster, nextPerks, state.save.boons ?? [])
      // If squad cap shrank somehow (it can't — perks only grow), trim. If it
      // grew, leave the squad alone; player picks new slots themselves.
      const cap = squadCap(nextPerks, lvl)
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
      const nextRoster = rebuildRosterStats(state.save.roster, {}, state.save.boons ?? [])
      // Respec only refunds perks — level is unchanged, so cap still scales
      // with level; only the perk component is wiped.
      const cap = squadCap({}, levelFromXP(state.save.xp))
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

      // Boon-derived multipliers stack with perk-derived ones.
      const boonBag = aggregateBoons(save.boons ?? [])

      // Ascension reward multiplier — folds into gold, xp, and shards so
      // ramping difficulty pays off. Base game (tier 0, no curses) = 1.0.
      const ascReward = ascensionMods(
        save.ascension ?? 0,
        save.curses ?? [],
      ).reward

      // XP: scaled by perk × boon
      const baseXp = xpForBattle({
        victory: result.victory,
        stage: region.stage,
        heroesKilled: result.killedHeroIds.length,
        comboHigh: result.comboHigh,
      })
      const xpEarned = Math.max(
        0,
        Math.floor(baseXp * xpMult(save.perks) * boonBag.xpMult * ascReward),
      )

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

      // Auto-recruit any new minion archetypes whose unlock tier the player
      // just crossed. Each unlock grants ONE unit of that archetype.
      const fresh = newlyUnlockedAt(newLevel, save.unlockedArchetypes)
      if (fresh.length > 0) {
        const newRecruits = fresh.map((arch) => recruitMinion(arch))
        save.roster = [
          ...rebuildRosterStats(save.roster, save.perks, save.boons ?? []),
          ...newRecruits,
        ]
        save.unlockedArchetypes = [...save.unlockedArchetypes, ...fresh]
      }

      // Auto-unlock any new Underlord skills whose unlockLevel the player
      // just crossed. Skills land in the POOL — not the loadout — so the
      // player has to visit the Skill Map to actually equip them.
      const freshSkills: string[] = []
      for (let lv = oldLevel + 1; lv <= newLevel; lv++) {
        for (const sid of newlyUnlockedSkills(lv)) {
          if (!save.unlockedSkills.includes(sid)) freshSkills.push(sid)
        }
      }
      if (freshSkills.length > 0) {
        save.unlockedSkills = [...save.unlockedSkills, ...freshSkills]
      }

      // Gold: scaled by perk × boon
      const goldFinal = Math.max(
        0,
        Math.floor(
          goldEarned * goldMult(save.perks) * boonBag.goldMult * ascReward,
        ),
      )

      // Soulshard rewards. Wins pay full freight, losses get a small
      // consolation drip so wipes still feel like progress. Counted
      // BEFORE the rest of the win/loss bookkeeping so both branches
      // can read the same value cleanly.
      const shardsEarned = Math.round(
        (result.victory
          ? winRewardShards(region.stage)
          : lossConsolationShards(region.stage)) * ascReward,
      )
      save.soulshards = (save.soulshards ?? 0) + shardsEarned

      if (result.victory) {
        save.gold += goldFinal
        save.inventory = [...save.inventory, ...loot]
        save.heroesKilled = Array.from(
          new Set([...save.heroesKilled, ...result.killedHeroIds]),
        )
        save.battlesWon += 1

        // Pity counter resets on cursed-or-better. Legendaries also count.
        const gotRare = loot.some(
          (l) =>
            l.rarity === 'cursed' ||
            l.rarity === 'relic' ||
            l.rarity === 'legendary',
        )
        save.battlesSinceRare = gotRare ? 0 : save.battlesSinceRare + 1

        const regions = { ...save.regions, [region.id]: 'cleared' as RegionStatus }
        for (const linkId of region.links) {
          if (regions[linkId] === 'locked') regions[linkId] = 'available'
        }
        save.regions = regions

        // Ascension: winning at your frontier tier unlocks the next one.
        if ((save.ascension ?? 0) >= (save.ascensionUnlocked ?? 0)) {
          save.ascensionUnlocked = Math.min(
            MAX_ASCENSION,
            (save.ascension ?? 0) + 1,
          )
        }
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
      if (save.heroesKilled.length >= 20) candidateAchievements.push('hero_slayer_20')
      if (save.heroesKilled.length >= 30) candidateAchievements.push('hero_slayer_30')
      if (save.heroesKilled.length >= 50) candidateAchievements.push('hero_slayer_50')
      if (save.dailyStreak >= 3) candidateAchievements.push('streak_3')
      if (save.dailyStreak >= 7) candidateAchievements.push('streak_7')
      if (save.dailyStreak >= 14) candidateAchievements.push('streak_14')
      if (save.dailyStreak >= 30) candidateAchievements.push('streak_30')
      if (save.battlesWon >= 10) candidateAchievements.push('veteran_10')
      if (save.battlesWon >= 50) candidateAchievements.push('veteran_50')
      if (save.battlesWon >= 100) candidateAchievements.push('veteran_100')
      if (result.comboHigh >= 7) candidateAchievements.push('combo_7')
      if (result.comboHigh >= 10) candidateAchievements.push('combo_10')
      if (loot.some((l) => l.rarity === 'relic')) candidateAchievements.push('first_relic')
      if (loot.some((l) => l.rarity === 'mythic')) candidateAchievements.push('mythic_bearer')
      const taintTotal = save.taint + loot.reduce((acc, l) => acc + l.taint, 0)
      if (taintTotal >= 5) candidateAchievements.push('tainted')
      if (taintTotal >= 20) candidateAchievements.push('tainted_20')
      // Ascension achievements.
      if (result.victory && (save.ascension ?? 0) >= 1) {
        candidateAchievements.push('ascendant_1')
      }
      if (result.killedHeroIds.includes('boss-the-reader')) {
        candidateAchievements.push('void_conqueror')
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
          shardsEarned,
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
          unlockedArchetypes: fresh,
          unlockedSkills: freshSkills,
          // Roll three random unowned boons on victory. On defeat, no
          // pick — the player goes back empty-handed.
          boonChoices: result.victory ? rollBoonChoices(save.boons ?? [], 3) : [],
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
    case 'set-skill-loadout': {
      // Sanitize: keep only ids that are unlocked + actually exist + dedupe,
      // then cap at SKILL_SLOTS. Order is preserved (slot 1 → slot 3).
      const have = new Set(state.save.unlockedSkills)
      const seen = new Set<string>()
      const trimmed: string[] = []
      for (const id of action.skillIds) {
        if (!have.has(id) || !OVERLORD_SKILLS[id] || seen.has(id)) continue
        seen.add(id)
        trimmed.push(id)
        if (trimmed.length >= SKILL_SLOTS) break
      }
      return {
        ...state,
        save: { ...state.save, equippedSkills: trimmed },
      }
    }
    case 'pick-boon': {
      // Validate: id must exist and must have been one of the offered
      // choices. Then commit it to the save and clear choices so the UI
      // can advance.
      const result = state.lastResult
      if (!result || !result.boonChoices.includes(action.boonId)) return state
      if (!BOONS[action.boonId]) return state
      const save: SaveState = {
        ...state.save,
        boons: [...(state.save.boons ?? []), action.boonId],
      }
      // Re-apply HP/ATK to the roster so the new boon's mults are visible
      // in the war room immediately (parity with how perk-spend works).
      save.roster = rebuildRosterStats(save.roster, save.perks, save.boons)
      return {
        ...state,
        save,
        lastResult: { ...result, boonChoices: [] },
      }
    }
    case 'claim-shards': {
      // Daily login pouch. Idempotent: claiming twice in the same UTC
      // day is a no-op so a player can't farm it by remounting the modal.
      if (!canClaimDailyShards(state.save)) return state
      return {
        ...state,
        save: {
          ...state.save,
          soulshards: (state.save.soulshards ?? 0) + DAILY_SHARD_POUCH,
          lastShardClaimDay: economyTodayKey(),
        },
      }
    }
    case 'dismantle-loot': {
      // Find the inventory entry. Equipped items aren't dismantle-eligible
      // here (the UI hides them); the check is just a safety net.
      const item = state.save.inventory.find((i) => i.id === action.lootId)
      if (!item) return state
      const reward = dismantleValue(item.rarity)
      return {
        ...state,
        save: {
          ...state.save,
          inventory: state.save.inventory.filter((i) => i !== item),
          soulshards: (state.save.soulshards ?? 0) + reward,
        },
      }
    }
    case 'bm-buy': {
      // Validate: enough shards, not already bought today. The price
      // arrives in the action so the reducer doesn't have to know the
      // shop seed — it's whatever the UI showed at click time.
      if ((state.save.soulshards ?? 0) < action.price) return state
      if ((state.save.blackMarketBought ?? []).includes(action.itemId)) {
        return state
      }
      // Each BM purchase clones the catalog entry into a fresh inventory
      // row with a unique id so two purchases of the same item don't
      // collide on the equip-by-id lookup.
      const cloned: LootItem = {
        ...action.item,
        id: `${action.item.id}-bm-${Date.now().toString(36)}`,
      }
      return {
        ...state,
        save: {
          ...state.save,
          soulshards: state.save.soulshards - action.price,
          inventory: [...state.save.inventory, cloned],
          blackMarketBought: [
            ...(state.save.blackMarketBought ?? []),
            action.itemId,
          ],
        },
      }
    }
    case 'set-ascension': {
      const unlocked = state.save.ascensionUnlocked ?? 0
      const tier = Math.max(0, Math.min(unlocked, Math.floor(action.tier || 0)))
      const curses = (action.curses ?? []).filter((id) => !!CURSES[id])
      return {
        ...state,
        save: { ...state.save, ascension: tier, curses },
      }
    }
    case 'reset':
      return freshGame()
  }
}
