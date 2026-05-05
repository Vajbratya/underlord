/**
 * MAP LAYOUTS — per-biome battlefield blueprints.
 *
 * Every region has a `biome`. The biome defines the SHAPE of the board:
 *  - cols / rows (some maps are wider, others taller)
 *  - obstacles (impassable terrain hexes — rocks, pillars, trees)
 *  - prelitFires (hexes that start the battle on fire — the ash biome)
 *  - terrainKind ('rock' | 'pillar' | 'tree' | 'altar') drives the glyph
 *
 * Obstacles are NOT units — they don't take turns and can't be attacked.
 * They join the `blockedSet` so movement BFS routes around them, and they
 * render as gray hexes with a glyph. Hex distance is unaffected, so ranged
 * attacks still pass over them (line-of-sight stays simple by design).
 *
 * Layouts are deterministic per (biome, stage) so the same region looks
 * the same every time — but not every fight is identical, because each
 * biome has 2-3 patterns selected by `stage % patterns.length`.
 */

import type { Axial, Region } from './types'

export type TerrainKind = 'rock' | 'pillar' | 'tree' | 'altar' | 'crystal'

export type MapLayout = {
  cols: number
  rows: number
  /** Impassable terrain hexes. */
  obstacles: { pos: Axial; kind: TerrainKind }[]
  /** Hexes that ignite at battle start (ash biome ambient hazards). */
  prelitFires: Axial[]
  /** Tag used by the renderer for ground-color tinting. */
  ground: 'moor' | 'iron' | 'ash' | 'verdant' | 'crown'
  /** Display label shown on the briefing screen. */
  label: string
  /** One-liner about why the terrain is annoying. */
  hint: string
}

type Biome = Region['biome']

/* Helpers — convert (col, row) with offset back to axial. */
function tile(col: number, row: number): Axial {
  const offset = -Math.floor(row / 2)
  return { q: col + offset, r: row }
}

/* ------------------------------------------------------------------ */
/* Pattern catalog. Each biome has multiple patterns so re-fights vary. */
/* ------------------------------------------------------------------ */

const MOOR_PATTERNS: MapLayout[] = [
  {
    cols: 6,
    rows: 9,
    obstacles: [],
    prelitFires: [],
    ground: 'moor',
    label: 'Charneca Aberta',
    hint: 'Terreno aberto. Sem cobertura, sem desculpa.',
  },
  {
    cols: 6,
    rows: 9,
    obstacles: [
      { pos: tile(2, 4), kind: 'rock' },
      { pos: tile(3, 4), kind: 'rock' },
    ],
    prelitFires: [],
    ground: 'moor',
    label: 'Pântano com Pedras',
    hint: 'Duas pedras no centro forçam o flanqueio.',
  },
  {
    cols: 7,
    rows: 9,
    obstacles: [
      { pos: tile(1, 3), kind: 'rock' },
      { pos: tile(5, 3), kind: 'rock' },
      { pos: tile(1, 5), kind: 'rock' },
      { pos: tile(5, 5), kind: 'rock' },
      { pos: tile(3, 4), kind: 'rock' },
    ],
    prelitFires: [],
    ground: 'moor',
    label: 'Cemitério dos Profetas',
    hint: 'Cinco menires em quincôncio. Range tem vantagem clara.',
  },
  {
    cols: 6,
    rows: 11,
    obstacles: [
      { pos: tile(2, 5), kind: 'rock' },
      { pos: tile(3, 5), kind: 'rock' },
      { pos: tile(2, 6), kind: 'rock' },
      { pos: tile(3, 6), kind: 'rock' },
    ],
    prelitFires: [],
    ground: 'moor',
    label: 'Vala Funda',
    hint: 'Bloco compacto no meio. Os flancos são corredores estreitos.',
  },
]

const IRON_PATTERNS: MapLayout[] = [
  {
    cols: 7,
    rows: 9,
    obstacles: [
      { pos: tile(3, 3), kind: 'pillar' },
      { pos: tile(3, 5), kind: 'pillar' },
    ],
    prelitFires: [],
    ground: 'iron',
    label: 'Salão de Pilares',
    hint: 'Dois pilares de ferro dividem a sala — use-os de cobertura.',
  },
  {
    cols: 7,
    rows: 9,
    obstacles: [
      { pos: tile(2, 4), kind: 'pillar' },
      { pos: tile(4, 4), kind: 'pillar' },
      { pos: tile(3, 2), kind: 'pillar' },
      { pos: tile(3, 6), kind: 'pillar' },
    ],
    prelitFires: [],
    ground: 'iron',
    label: 'Câmara Octogonal',
    hint: 'Quatro colunas. Corredores estreitos. Quem mover primeiro, perde.',
  },
  {
    cols: 8,
    rows: 9,
    obstacles: [
      { pos: tile(2, 3), kind: 'pillar' },
      { pos: tile(5, 3), kind: 'pillar' },
      { pos: tile(2, 5), kind: 'pillar' },
      { pos: tile(5, 5), kind: 'pillar' },
      { pos: tile(3, 4), kind: 'crystal' },
      { pos: tile(4, 4), kind: 'crystal' },
    ],
    prelitFires: [],
    ground: 'iron',
    label: 'Casa da Moeda',
    hint: 'Duas barras de cristal no centro. O centro é morte; flanqueia.',
  },
  {
    cols: 7,
    rows: 10,
    obstacles: [
      { pos: tile(0, 4), kind: 'pillar' },
      { pos: tile(6, 4), kind: 'pillar' },
      { pos: tile(0, 5), kind: 'pillar' },
      { pos: tile(6, 5), kind: 'pillar' },
      { pos: tile(3, 4), kind: 'pillar' },
      { pos: tile(3, 5), kind: 'pillar' },
    ],
    prelitFires: [],
    ground: 'iron',
    label: 'Corredor da Foundry',
    hint: 'Pilares fecham os flancos. Empurra pelo centro de cabeça baixa.',
  },
]

const ASH_PATTERNS: MapLayout[] = [
  {
    cols: 6,
    rows: 9,
    obstacles: [{ pos: tile(2, 4), kind: 'rock' }, { pos: tile(3, 4), kind: 'rock' }],
    prelitFires: [tile(0, 4), tile(5, 4)],
    ground: 'ash',
    label: 'Rio de Cinzas',
    hint: 'Os flancos já estão pegando fogo. Vai pelo meio ou se queima.',
  },
  {
    cols: 6,
    rows: 10,
    obstacles: [{ pos: tile(2, 5), kind: 'rock' }, { pos: tile(3, 5), kind: 'rock' }],
    prelitFires: [tile(1, 3), tile(4, 6)],
    ground: 'ash',
    label: 'Cratera Vulcânica',
    hint: 'Duas chamas vivas no campo. Fica longe de quem tem range.',
  },
  {
    cols: 7,
    rows: 10,
    obstacles: [
      { pos: tile(1, 4), kind: 'rock' },
      { pos: tile(5, 4), kind: 'rock' },
      { pos: tile(3, 3), kind: 'rock' },
      { pos: tile(3, 6), kind: 'rock' },
    ],
    prelitFires: [tile(2, 4), tile(4, 4), tile(2, 5), tile(4, 5)],
    ground: 'ash',
    label: 'Anel de Lava',
    hint: 'Quatro chamas no centro formam um anel. Voadores são reis aqui.',
  },
  {
    cols: 6,
    rows: 11,
    obstacles: [
      { pos: tile(2, 4), kind: 'rock' },
      { pos: tile(3, 4), kind: 'rock' },
      { pos: tile(2, 6), kind: 'rock' },
      { pos: tile(3, 6), kind: 'rock' },
    ],
    prelitFires: [tile(0, 5), tile(5, 5), tile(2, 5), tile(3, 5)],
    ground: 'ash',
    label: 'Língua de Fogo',
    hint: 'Linha de fogo atravessa o campo. Range vence; corpo a corpo morre.',
  },
]

const VERDANT_PATTERNS: MapLayout[] = [
  {
    cols: 7,
    rows: 9,
    obstacles: [
      { pos: tile(1, 2), kind: 'tree' },
      { pos: tile(5, 2), kind: 'tree' },
      { pos: tile(2, 6), kind: 'tree' },
      { pos: tile(4, 6), kind: 'tree' },
      { pos: tile(3, 4), kind: 'tree' },
    ],
    prelitFires: [],
    ground: 'verdant',
    label: 'Bosque Sagrado',
    hint: 'Cinco árvores espalhadas — combates curtos e flanqueios largos.',
  },
  {
    cols: 7,
    rows: 9,
    obstacles: [
      { pos: tile(2, 3), kind: 'tree' },
      { pos: tile(4, 3), kind: 'tree' },
      { pos: tile(2, 5), kind: 'tree' },
      { pos: tile(4, 5), kind: 'tree' },
    ],
    prelitFires: [],
    ground: 'verdant',
    label: 'Clareira Selada',
    hint: 'Quatro árvores em diamante. Um corredor central perigoso.',
  },
  {
    cols: 8,
    rows: 9,
    obstacles: [
      { pos: tile(0, 3), kind: 'tree' },
      { pos: tile(7, 3), kind: 'tree' },
      { pos: tile(0, 5), kind: 'tree' },
      { pos: tile(7, 5), kind: 'tree' },
      { pos: tile(3, 4), kind: 'tree' },
      { pos: tile(4, 4), kind: 'tree' },
      { pos: tile(2, 2), kind: 'tree' },
      { pos: tile(5, 6), kind: 'tree' },
    ],
    prelitFires: [],
    ground: 'verdant',
    label: 'Floresta Cerrada',
    hint: 'Oito árvores. Vão estreitos forçam combate em corredor.',
  },
  {
    cols: 7,
    rows: 10,
    obstacles: [
      { pos: tile(3, 2), kind: 'tree' },
      { pos: tile(3, 7), kind: 'tree' },
      { pos: tile(1, 4), kind: 'tree' },
      { pos: tile(5, 4), kind: 'tree' },
      { pos: tile(1, 5), kind: 'tree' },
      { pos: tile(5, 5), kind: 'tree' },
    ],
    prelitFires: [],
    ground: 'verdant',
    label: 'Anfiteatro Druida',
    hint: 'Anel de árvores. Lutas curtas, alvos sempre atrás de cobertura.',
  },
]

const CROWN_PATTERNS: MapLayout[] = [
  {
    cols: 7,
    rows: 11,
    obstacles: [
      { pos: tile(2, 4), kind: 'altar' },
      { pos: tile(4, 4), kind: 'altar' },
      { pos: tile(2, 6), kind: 'altar' },
      { pos: tile(4, 6), kind: 'altar' },
      { pos: tile(3, 5), kind: 'crystal' },
    ],
    prelitFires: [],
    ground: 'crown',
    label: 'Santuário do Trono',
    hint: 'Quatro altares e um cristal central. Altíssima cobertura.',
  },
  {
    cols: 8,
    rows: 11,
    obstacles: [
      { pos: tile(1, 3), kind: 'crystal' },
      { pos: tile(6, 3), kind: 'crystal' },
      { pos: tile(1, 7), kind: 'crystal' },
      { pos: tile(6, 7), kind: 'crystal' },
      { pos: tile(3, 5), kind: 'altar' },
      { pos: tile(4, 5), kind: 'altar' },
    ],
    prelitFires: [tile(0, 5), tile(7, 5)],
    ground: 'crown',
    label: 'Coroa Submersa',
    hint: 'Cristais nos cantos canalizam fogo. Dois altares centrais defendem o trono.',
  },
  {
    cols: 7,
    rows: 12,
    obstacles: [
      { pos: tile(0, 5), kind: 'altar' },
      { pos: tile(6, 5), kind: 'altar' },
      { pos: tile(0, 6), kind: 'altar' },
      { pos: tile(6, 6), kind: 'altar' },
      { pos: tile(3, 3), kind: 'crystal' },
      { pos: tile(3, 8), kind: 'crystal' },
      { pos: tile(2, 5), kind: 'crystal' },
      { pos: tile(4, 6), kind: 'crystal' },
    ],
    prelitFires: [tile(3, 5), tile(3, 6)],
    ground: 'crown',
    label: 'Câmara da Profecia',
    hint: 'Trono de fogo no meio. Voadores ditam o ritmo. Não fica parado.',
  },
]

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

const PATTERNS_BY_BIOME: Record<Biome, MapLayout[]> = {
  moor: MOOR_PATTERNS,
  iron: IRON_PATTERNS,
  ash: ASH_PATTERNS,
  verdant: VERDANT_PATTERNS,
  crown: CROWN_PATTERNS,
}

/** Pick a layout for a region. Deterministic — same region → same map. */
export function pickMapLayout(region: Region): MapLayout {
  const pool = PATTERNS_BY_BIOME[region.biome] ?? MOOR_PATTERNS
  const idx = region.stage % pool.length
  return pool[idx]
}

/** Convenience: ground-tone CSS color for a biome (used by the hex renderer). */
export const GROUND_TONES: Record<MapLayout['ground'], { fillStart: string; fillEnd: string; stroke: string }> = {
  moor: {
    fillStart: 'oklch(0.20 0.014 22 / 0.5)',
    fillEnd: 'oklch(0.10 0.012 22 / 0.55)',
    stroke: 'oklch(0.30 0.012 30 / 0.55)',
  },
  iron: {
    fillStart: 'oklch(0.22 0.010 250 / 0.55)',
    fillEnd: 'oklch(0.12 0.010 250 / 0.60)',
    stroke: 'oklch(0.34 0.012 250 / 0.55)',
  },
  ash: {
    fillStart: 'oklch(0.22 0.024 40 / 0.55)',
    fillEnd: 'oklch(0.13 0.020 40 / 0.62)',
    stroke: 'oklch(0.36 0.030 40 / 0.55)',
  },
  verdant: {
    fillStart: 'oklch(0.22 0.040 150 / 0.50)',
    fillEnd: 'oklch(0.13 0.030 150 / 0.58)',
    stroke: 'oklch(0.34 0.040 150 / 0.55)',
  },
  crown: {
    fillStart: 'oklch(0.24 0.030 78 / 0.50)',
    fillEnd: 'oklch(0.14 0.018 78 / 0.60)',
    stroke: 'oklch(0.40 0.060 78 / 0.55)',
  },
}

/** Glyph rendered on impassable obstacle tiles. */
export const TERRAIN_GLYPH: Record<TerrainKind, string> = {
  rock: '▲',
  pillar: '▮',
  tree: '♣',
  altar: '✚',
  crystal: '◆',
}

/** Tooltip text per terrain kind. */
export const TERRAIN_LABEL: Record<TerrainKind, string> = {
  rock: 'Rocha — bloqueia movimento.',
  pillar: 'Pilar de ferro — bloqueia movimento.',
  tree: 'Árvore antiga — bloqueia movimento.',
  altar: 'Altar — bloqueia movimento.',
  crystal: 'Cristal de poder — bloqueia movimento.',
}
