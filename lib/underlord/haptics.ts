/**
 * Haptic + audio feedback helpers — small, safe, no-op on unsupported
 * devices.
 *
 * Historical note: this module used to be vibration-only. Every UI
 * component in the game already calls `haptic.X()` for touch feedback,
 * so attaching the matching `sfx.X()` to each call is the highest-
 * leverage way to give the entire app audio coverage in one place.
 *
 * Carve-out: combat-frame events (`hit`, `crit`, `kill`) deliberately
 * DO NOT play UI sfx here, because the per-archetype voice system in
 * `lib/underlord/sfx-archetype.ts` already drives combat audio. Adding
 * sfx here too would double-trigger every swing.
 *
 * UI events (`tap`, `select`, `victory`, `defeat`) DO play sfx, since
 * the rest of the app has no other audio path for them.
 */

import { sfx } from "@/lib/elementum-sounds"

function vibrate(pattern: number | number[]): void {
  if (typeof window === "undefined") return
  const nav = window.navigator
  if (!nav || typeof nav.vibrate !== "function") return
  try {
    nav.vibrate(pattern)
  } catch {
    /* ignore */
  }
}

// Coalesce same-named UI sfx that fire within a tiny window (e.g. 40ms
// double-taps). Without this, hold-down repeats spam the audio context
// and create a buzzy mush. Combat sfx are not coalesced because the
// voice system handles them and rapid swings *should* sound rapid.
const lastFiredAt: Record<string, number> = {}
function uiSfx(key: string, fn: () => void, minGapMs = 35): void {
  const now =
    typeof performance !== "undefined" ? performance.now() : Date.now()
  if ((lastFiredAt[key] ?? 0) + minGapMs > now) return
  lastFiredAt[key] = now
  try {
    fn()
  } catch {
    /* sfx never throws, but the elementumSounds wrap already swallows */
  }
}

export const haptic = {
  // ---- UI feedback (haptic + audio) -------------------------------
  tap: () => {
    vibrate(8)
    uiSfx("tap", () => sfx.click())
  },
  select: () => {
    vibrate(12)
    uiSfx("select", () => sfx.click())
  },
  // ---- Combat feedback (haptic only — sfx handled by voice system) -
  hit: () => vibrate(22),
  crit: () => vibrate([18, 30, 40]),
  kill: () => vibrate([10, 40, 60]),
  // ---- Match outcome (haptic + audio) ------------------------------
  victory: () => {
    vibrate([30, 60, 30, 60, 90])
    uiSfx("victory", () => sfx.victory(), 800)
  },
  defeat: () => {
    vibrate([80, 40, 80, 40, 200])
    uiSfx("defeat", () => sfx.defeat(), 800)
  },
  // ---- Semantic UI events (haptic + audio) ------------------------
  /** Purchase confirm — black-market, shop, daily-claim. */
  purchase: () => {
    vibrate([18, 30, 40])
    uiSfx("purchase", () => sfx.shopBuy(), 120)
  },
  /** Drawer / panel open — black-market, forge, codex. */
  panelOpen: () => {
    vibrate(10)
    uiSfx("panel", () => sfx.shopOpen(), 200)
  },
  /** Skill / boon unlock, level-up, talent pick. */
  levelUp: () => {
    vibrate([14, 24, 14, 24, 40])
    uiSfx("levelUp", () => sfx.powerup(), 250)
  },
  /** Forge craft / item upgrade. */
  craft: () => {
    vibrate([22, 14, 22])
    uiSfx("craft", () => sfx.shopBuy(), 250)
  },
}
