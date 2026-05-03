import type {
  Banner,
  DreadSchool,
  Phase,
  SaveState,
  SpireRoomId,
} from "./types"
import { SPIRE_ROOMS } from "./data"

const SAVE_KEY = "underlord-save-v1"
export const SAVE_VERSION = 1

/* ------------------------------------------------------------------ */
/* Defaults                                                             */
/* ------------------------------------------------------------------ */

export function defaultSpireRooms(): Record<SpireRoomId, boolean> {
  const out = {} as Record<SpireRoomId, boolean>
  for (const room of SPIRE_ROOMS) {
    out[room.id] = room.unlockCycle === 0
  }
  return out
}

export function newSave(args: {
  name: string
  school: DreadSchool
  banner: Banner
}): SaveState {
  const now = Date.now()
  return {
    version: SAVE_VERSION,
    underlord: {
      name: args.name,
      school: args.school,
      banner: args.banner,
      level: 1,
      shards: 0,
    },
    resources: {
      gold: 50,
      taint: 0,
      standing: 50,
      corrupted: 0,
    },
    regionCorruption: {},
    spireRooms: defaultSpireRooms(),
    cycle: 0,
    position: null,
    createdAt: now,
    lastPlayed: now,
  }
}

/* ------------------------------------------------------------------ */
/* Storage                                                              */
/* ------------------------------------------------------------------ */

export function loadSave(): SaveState | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SaveState
    if (parsed.version !== SAVE_VERSION) return null
    return parsed
  } catch {
    return null
  }
}

export function persistSave(save: SaveState): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({ ...save, lastPlayed: Date.now() }),
    )
  } catch {
    /* swallow quota errors silently */
  }
}

export function clearSave(): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(SAVE_KEY)
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------------------------ */
/* Reducer                                                              */
/* ------------------------------------------------------------------ */

export interface GameState {
  phase: Phase
  save: SaveState | null
  /** transient overworld selection */
  selectedRegion: string | null
  /** modal/info text for stub rooms */
  notice: string | null
}

export type Action =
  | { type: "boot" }
  | { type: "go-creator" }
  | { type: "go-title" }
  | { type: "begin-run"; save: SaveState }
  | { type: "continue-run" }
  | { type: "open-overworld" }
  | { type: "back-to-spire" }
  | { type: "select-region"; id: string | null }
  | { type: "set-notice"; text: string | null }
  | { type: "raid-region"; id: string }
  | { type: "advance-cycle" }
  | { type: "wipe-save" }

export const initialState: GameState = {
  phase: "title",
  save: null,
  selectedRegion: null,
  notice: null,
}

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "boot": {
      const existing = loadSave()
      return existing
        ? { ...state, save: existing, phase: "title" }
        : { ...state, save: null, phase: "title" }
    }
    case "go-creator":
      return { ...state, phase: "creator", notice: null }
    case "go-title":
      return { ...state, phase: "title", notice: null }
    case "begin-run":
      persistSave(action.save)
      return {
        ...state,
        save: action.save,
        phase: "spire",
        selectedRegion: null,
        notice: null,
      }
    case "continue-run":
      if (!state.save) return state
      return { ...state, phase: "spire", notice: null }
    case "open-overworld":
      return { ...state, phase: "overworld", notice: null }
    case "back-to-spire":
      return { ...state, phase: "spire", selectedRegion: null, notice: null }
    case "select-region":
      return { ...state, selectedRegion: action.id }
    case "set-notice":
      return { ...state, notice: action.text }
    case "raid-region": {
      // M1 stub: bumps cycle + corruption + small gold gain. No battle yet.
      if (!state.save) return state
      const corr = { ...state.save.regionCorruption }
      corr[action.id] = Math.min(10, (corr[action.id] ?? 0) + 2)
      const next: SaveState = {
        ...state.save,
        cycle: state.save.cycle + 1,
        resources: {
          ...state.save.resources,
          gold: state.save.resources.gold + 12,
          standing: Math.max(0, state.save.resources.standing - 2),
        },
        regionCorruption: corr,
      }
      // unlock rooms whose unlockCycle is now reached
      for (const room of SPIRE_ROOMS) {
        if (next.cycle >= room.unlockCycle) {
          next.spireRooms[room.id] = true
        }
      }
      persistSave(next)
      return {
        ...state,
        save: next,
        notice: `Reconnaissance complete. Region marked. (+12 gold, -2 standing)`,
      }
    }
    case "advance-cycle": {
      if (!state.save) return state
      const next: SaveState = {
        ...state.save,
        cycle: state.save.cycle + 1,
      }
      for (const room of SPIRE_ROOMS) {
        if (next.cycle >= room.unlockCycle) {
          next.spireRooms[room.id] = true
        }
      }
      persistSave(next)
      return { ...state, save: next }
    }
    case "wipe-save":
      clearSave()
      return { ...state, save: null, phase: "title", selectedRegion: null }
    default:
      return state
  }
}
