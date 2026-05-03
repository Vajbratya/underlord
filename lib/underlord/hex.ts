import type { HexCoord } from "./types"

/* ===========================================================================
 * Hex grid math — axial coordinates (q, r), pointy-top.
 * https://www.redblobgames.com/grids/hexagons/
 * ======================================================================== */

/** Battlefield dimensions (kept small for mobile). */
export const GRID_W = 9
export const GRID_H = 7

/** Hex render size (in SVG units). */
export const HEX_SIZE = 30
export const HEX_W = Math.sqrt(3) * HEX_SIZE
export const HEX_H = 2 * HEX_SIZE

/** All 6 axial directions. */
export const HEX_DIRS: HexCoord[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
]

export function hexKey(c: HexCoord): string {
  return `${c.q},${c.r}`
}

export function hexEq(a: HexCoord, b: HexCoord): boolean {
  return a.q === b.q && a.r === b.r
}

export function hexAdd(a: HexCoord, b: HexCoord): HexCoord {
  return { q: a.q + b.q, r: a.r + b.r }
}

export function hexDistance(a: HexCoord, b: HexCoord): number {
  const dq = a.q - b.q
  const dr = a.r - b.r
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2
}

export function hexNeighbors(c: HexCoord): HexCoord[] {
  return HEX_DIRS.map((d) => hexAdd(c, d))
}

/** Convert axial coord to pixel center for rendering (pointy-top). */
export function hexToPixel(c: HexCoord): { x: number; y: number } {
  const x = HEX_SIZE * (Math.sqrt(3) * c.q + (Math.sqrt(3) / 2) * c.r)
  const y = HEX_SIZE * (1.5 * c.r)
  return { x, y }
}

/** Generate the playable hex board as axial coords (rectangular shape). */
export function generateBoard(): HexCoord[] {
  const out: HexCoord[] = []
  for (let r = 0; r < GRID_H; r++) {
    const rOffset = Math.floor(r / 2)
    for (let q = -rOffset; q < GRID_W - rOffset; q++) {
      out.push({ q, r })
    }
  }
  return out
}

/** Pixel bounding box for the generated board (for SVG viewBox). */
export function boardBounds(board: HexCoord[]): {
  minX: number
  minY: number
  maxX: number
  maxY: number
} {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const c of board) {
    const { x, y } = hexToPixel(c)
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
  }
  return {
    minX: minX - HEX_W,
    minY: minY - HEX_H,
    maxX: maxX + HEX_W,
    maxY: maxY + HEX_H,
  }
}

/** SVG path "d" for a pointy-top hex centered at origin. */
export function hexPathPoints(): string {
  const pts: string[] = []
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30)
    const x = HEX_SIZE * Math.cos(angle)
    const y = HEX_SIZE * Math.sin(angle)
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`)
  }
  return pts.join(" ")
}

/* --------------------------------------------------------------------- */
/* BFS for movement range / pathing                                       */
/* --------------------------------------------------------------------- */

/**
 * Returns all hexes reachable within `range` steps from `start`,
 * stopping at hexes occupied by `blockedSet`.
 * Result EXCLUDES start.
 */
export function reachable(
  start: HexCoord,
  range: number,
  validHexes: Set<string>,
  blockedSet: Set<string>,
): HexCoord[] {
  const visited = new Map<string, number>()
  visited.set(hexKey(start), 0)
  const out: HexCoord[] = []
  const queue: HexCoord[] = [start]
  while (queue.length) {
    const cur = queue.shift()!
    const d = visited.get(hexKey(cur))!
    if (d >= range) continue
    for (const n of hexNeighbors(cur)) {
      const k = hexKey(n)
      if (visited.has(k)) continue
      if (!validHexes.has(k)) continue
      if (blockedSet.has(k)) continue
      visited.set(k, d + 1)
      out.push(n)
      queue.push(n)
    }
  }
  return out
}

/** Shortest path BFS — returns path EXCLUDING start, or null if unreachable. */
export function pathTo(
  start: HexCoord,
  goal: HexCoord,
  validHexes: Set<string>,
  blockedSet: Set<string>,
): HexCoord[] | null {
  if (hexEq(start, goal)) return []
  const cameFrom = new Map<string, HexCoord | null>()
  cameFrom.set(hexKey(start), null)
  const queue: HexCoord[] = [start]
  while (queue.length) {
    const cur = queue.shift()!
    if (hexEq(cur, goal)) {
      // Rebuild path
      const path: HexCoord[] = []
      let c: HexCoord | null = cur
      while (c && !hexEq(c, start)) {
        path.unshift(c)
        c = cameFrom.get(hexKey(c)) ?? null
      }
      return path
    }
    for (const n of hexNeighbors(cur)) {
      const k = hexKey(n)
      if (cameFrom.has(k)) continue
      if (!validHexes.has(k)) continue
      // Allow stepping ON the goal even if blocked (e.g. attacker target)
      if (blockedSet.has(k) && !hexEq(n, goal)) continue
      cameFrom.set(k, cur)
      queue.push(n)
    }
  }
  return null
}
