/**
 * Haptic feedback helpers — small, safe, no-op on unsupported devices.
 * Used to add tactile "juice" to key actions (tap, hit, kill, victory).
 */

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

export const haptic = {
  tap: () => vibrate(8),
  select: () => vibrate(12),
  hit: () => vibrate(22),
  crit: () => vibrate([18, 30, 40]),
  kill: () => vibrate([10, 40, 60]),
  victory: () => vibrate([30, 60, 30, 60, 90]),
  defeat: () => vibrate([80, 40, 80, 40, 200]),
}
