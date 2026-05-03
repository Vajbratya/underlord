/**
 * Pointy-top axial hex grid math.
 * Coords use (q, r) where q is column-ish and r is row-ish.
 */

import type { Axial } from './types'

export const HEX_SIZE = 30 // base radius in px for pixel conversion

/** Convert axial → pixel center for pointy-top hex. */
export function axialToPixel(a: Axial, size = HEX_SIZE): { x: number; y: number } {
  const x = size * (Math.sqrt(3) * a.q + (Math.sqrt(3) / 2) * a.r)
  const y = size * (1.5 * a.r)
  return { x, y }
}

const DIRS: Axial[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
]

export function neighbors(a: Axial): Axial[] {
  return DIRS.map((d) => ({ q: a.q + d.q, r: a.r + d.r }))
}

export function axialEqual(a: Axial, b: Axial): boolean {
  return a.q === b.q && a.r === b.r
}

export function axialKey(a: Axial): string {
  return `${a.q},${a.r}`
}

/** Cube distance between two axial hexes. */
export function hexDistance(a: Axial, b: Axial): number {
  const aq = a.q
  const ar = a.r
  const as = -aq - ar
  const bq = b.q
  const br = b.r
  const bs = -bq - br
  return Math.max(Math.abs(aq - bq), Math.abs(ar - br), Math.abs(as - bs))
}

/**
 * BFS reachable hexes from origin within `range`, treating `blocked` keys
 * as impassable (other units). Stops at blocked tiles but doesn't include
 * them.
 */
export function reachable(
  origin: Axial,
  range: number,
  inBounds: (a: Axial) => boolean,
  blocked: Set<string>,
): Axial[] {
  const visited = new Map<string, number>()
  visited.set(axialKey(origin), 0)
  const frontier: Axial[] = [origin]
  const out: Axial[] = []
  while (frontier.length) {
    const cur = frontier.shift() as Axial
    const d = visited.get(axialKey(cur)) ?? 0
    if (d >= range) continue
    for (const n of neighbors(cur)) {
      const k = axialKey(n)
      if (visited.has(k)) continue
      if (!inBounds(n)) continue
      if (blocked.has(k)) continue
      visited.set(k, d + 1)
      out.push(n)
      frontier.push(n)
    }
  }
  return out
}

/** Generate a rectangular hex map of given dimensions, using offset rows. */
export function makeRectMap(cols: number, rows: number): Axial[] {
  const tiles: Axial[] = []
  for (let r = 0; r < rows; r++) {
    const offset = -Math.floor(r / 2)
    for (let q = 0; q < cols; q++) {
      tiles.push({ q: q + offset, r })
    }
  }
  return tiles
}

/** Map bounds checker for a rectangular map. */
export function makeBoundsChecker(cols: number, rows: number) {
  return (a: Axial) => {
    if (a.r < 0 || a.r >= rows) return false
    const offset = -Math.floor(a.r / 2)
    if (a.q < offset || a.q >= cols + offset) return false
    return true
  }
}
