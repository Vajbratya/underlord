/**
 * MAP LAYOUTS — per-biome battlefield blueprints.
 *
 * Boards are intentionally LARGE to give the new long-range archetypes
 * (lich range 6, bone range 5) and flying units room to maneuver. Most
 * biomes ship 4 patterns each so re-fights look distinct. Layouts are
 * deterministic per (biome, stage) so the same region always renders the
 * same map. Stage indices wrap around the biome's pattern pool.
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
/* Pattern catalog. Big boards (10-13 cols × 14-18 rows). Each biome  */
/* has 3-4 patterns so the same region is re-playable but distinct.   */
/* ------------------------------------------------------------------ */

const MOOR_PATTERNS: MapLayout[] = [
  {
    cols: 10,
    rows: 15,
    obstacles: [],
    prelitFires: [],
    ground: 'moor',
    label: 'Charneca Aberta',
    hint: 'Terreno aberto, vasto e sem cobertura. Quem tem alcance vence.',
  },
  {
    cols: 10,
    rows: 15,
    obstacles: [
      { pos: tile(4, 7), kind: 'rock' },
      { pos: tile(5, 7), kind: 'rock' },
      { pos: tile(4, 8), kind: 'rock' },
      { pos: tile(5, 8), kind: 'rock' },
    ],
    prelitFires: [],
    ground: 'moor',
    label: 'Pântano com Pedras',
    hint: 'Bloco granítico no centro força flanqueio amplo.',
  },
  {
    cols: 11,
    rows: 16,
    obstacles: [
      { pos: tile(2, 5), kind: 'rock' },
      { pos: tile(8, 5), kind: 'rock' },
      { pos: tile(2, 10), kind: 'rock' },
      { pos: tile(8, 10), kind: 'rock' },
      { pos: tile(5, 7), kind: 'rock' },
      { pos: tile(5, 8), kind: 'rock' },
    ],
    prelitFires: [],
    ground: 'moor',
    label: 'Cemitério dos Profetas',
    hint: 'Menires em quincôncio. Atiradores escolhem a sala — tu escolhe a entrada.',
  },
  {
    cols: 10,
    rows: 17,
    obstacles: [
      { pos: tile(3, 8), kind: 'rock' },
      { pos: tile(4, 8), kind: 'rock' },
      { pos: tile(5, 8), kind: 'rock' },
      { pos: tile(6, 8), kind: 'rock' },
      { pos: tile(3, 9), kind: 'rock' },
      { pos: tile(6, 9), kind: 'rock' },
    ],
    prelitFires: [],
    ground: 'moor',
    label: 'Vala Funda',
    hint: 'Linha de pedras corta o tabuleiro. Voadores passam por cima.',
  },
]

const IRON_PATTERNS: MapLayout[] = [
  {
    cols: 11,
    rows: 15,
    obstacles: [
      { pos: tile(5, 5), kind: 'pillar' },
      { pos: tile(5, 9), kind: 'pillar' },
      { pos: tile(3, 7), kind: 'pillar' },
      { pos: tile(7, 7), kind: 'pillar' },
    ],
    prelitFires: [],
    ground: 'iron',
    label: 'Salão de Pilares',
    hint: 'Quatro pilares de ferro ancoram o salão — usa-os de cobertura.',
  },
  {
    cols: 11,
    rows: 15,
    obstacles: [
      { pos: tile(3, 5), kind: 'pillar' },
      { pos: tile(7, 5), kind: 'pillar' },
      { pos: tile(3, 9), kind: 'pillar' },
      { pos: tile(7, 9), kind: 'pillar' },
      { pos: tile(5, 4), kind: 'pillar' },
      { pos: tile(5, 10), kind: 'pillar' },
      { pos: tile(2, 7), kind: 'pillar' },
      { pos: tile(8, 7), kind: 'pillar' },
    ],
    prelitFires: [],
    ground: 'iron',
    label: 'Câmara Octogonal',
    hint: 'Oito colunas, corredores estreitos. Cada hex conta.',
  },
  {
    cols: 12,
    rows: 15,
    obstacles: [
      { pos: tile(3, 5), kind: 'pillar' },
      { pos: tile(8, 5), kind: 'pillar' },
      { pos: tile(3, 9), kind: 'pillar' },
      { pos: tile(8, 9), kind: 'pillar' },
      { pos: tile(5, 7), kind: 'crystal' },
      { pos: tile(6, 7), kind: 'crystal' },
      { pos: tile(5, 8), kind: 'crystal' },
      { pos: tile(6, 8), kind: 'crystal' },
    ],
    prelitFires: [],
    ground: 'iron',
    label: 'Casa da Moeda',
    hint: 'Cofre central de cristais. O centro mata — flanqueia rapidíssimo.',
  },
  {
    cols: 11,
    rows: 16,
    obstacles: [
      { pos: tile(0, 7), kind: 'pillar' },
      { pos: tile(10, 7), kind: 'pillar' },
      { pos: tile(0, 8), kind: 'pillar' },
      { pos: tile(10, 8), kind: 'pillar' },
      { pos: tile(5, 6), kind: 'pillar' },
      { pos: tile(5, 7), kind: 'pillar' },
      { pos: tile(5, 8), kind: 'pillar' },
      { pos: tile(5, 9), kind: 'pillar' },
    ],
    prelitFires: [],
    ground: 'iron',
    label: 'Corredor da Foundry',
    hint: 'Pilares fecham os flancos e dividem o miolo. Muralha de ferro pura.',
  },
]

const ASH_PATTERNS: MapLayout[] = [
  {
    cols: 10,
    rows: 15,
    obstacles: [
      { pos: tile(4, 7), kind: 'rock' },
      { pos: tile(5, 7), kind: 'rock' },
      { pos: tile(4, 8), kind: 'rock' },
      { pos: tile(5, 8), kind: 'rock' },
    ],
    prelitFires: [tile(0, 7), tile(9, 7), tile(0, 8), tile(9, 8)],
    ground: 'ash',
    label: 'Rio de Cinzas',
    hint: 'Os flancos já queimam. Vai pelo meio ou vira tocha.',
  },
  {
    cols: 11,
    rows: 16,
    obstacles: [
      { pos: tile(3, 7), kind: 'rock' },
      { pos: tile(7, 7), kind: 'rock' },
      { pos: tile(3, 9), kind: 'rock' },
      { pos: tile(7, 9), kind: 'rock' },
    ],
    prelitFires: [tile(2, 5), tile(8, 5), tile(2, 11), tile(8, 11)],
    ground: 'ash',
    label: 'Cratera Vulcânica',
    hint: 'Quatro chamas vivas nos cantos. Não fica parado em hex aceso.',
  },
  {
    cols: 11,
    rows: 16,
    obstacles: [
      { pos: tile(2, 7), kind: 'rock' },
      { pos: tile(8, 7), kind: 'rock' },
      { pos: tile(5, 5), kind: 'rock' },
      { pos: tile(5, 10), kind: 'rock' },
    ],
    prelitFires: [
      tile(4, 7), tile(6, 7), tile(4, 8), tile(6, 8),
      tile(5, 7), tile(5, 8),
    ],
    ground: 'ash',
    label: 'Anel de Lava',
    hint: 'Anel de fogo no centro. Voadores são reis aqui.',
  },
  {
    cols: 10,
    rows: 17,
    obstacles: [
      { pos: tile(3, 6), kind: 'rock' },
      { pos: tile(6, 6), kind: 'rock' },
      { pos: tile(3, 10), kind: 'rock' },
      { pos: tile(6, 10), kind: 'rock' },
    ],
    prelitFires: [
      tile(0, 8), tile(9, 8),
      tile(2, 8), tile(7, 8),
      tile(4, 8), tile(5, 8),
    ],
    ground: 'ash',
    label: 'Língua de Fogo',
    hint: 'Linha de fogo atravessa o tabuleiro. Range domina; melee morre.',
  },
]

const VERDANT_PATTERNS: MapLayout[] = [
  {
    cols: 11,
    rows: 15,
    obstacles: [
      { pos: tile(2, 4), kind: 'tree' },
      { pos: tile(8, 4), kind: 'tree' },
      { pos: tile(2, 10), kind: 'tree' },
      { pos: tile(8, 10), kind: 'tree' },
      { pos: tile(5, 5), kind: 'tree' },
      { pos: tile(5, 9), kind: 'tree' },
      { pos: tile(5, 7), kind: 'tree' },
    ],
    prelitFires: [],
    ground: 'verdant',
    label: 'Bosque Sagrado',
    hint: 'Sete árvores espalhadas. Cobertura por todo lado, flanqueio largo.',
  },
  {
    cols: 11,
    rows: 15,
    obstacles: [
      { pos: tile(3, 5), kind: 'tree' },
      { pos: tile(7, 5), kind: 'tree' },
      { pos: tile(3, 9), kind: 'tree' },
      { pos: tile(7, 9), kind: 'tree' },
      { pos: tile(5, 7), kind: 'tree' },
    ],
    prelitFires: [],
    ground: 'verdant',
    label: 'Clareira Selada',
    hint: 'Cinco árvores em diamante. Corredor central perigoso.',
  },
  {
    cols: 12,
    rows: 15,
    obstacles: [
      { pos: tile(0, 5), kind: 'tree' },
      { pos: tile(11, 5), kind: 'tree' },
      { pos: tile(0, 9), kind: 'tree' },
      { pos: tile(11, 9), kind: 'tree' },
      { pos: tile(3, 4), kind: 'tree' },
      { pos: tile(8, 4), kind: 'tree' },
      { pos: tile(3, 10), kind: 'tree' },
      { pos: tile(8, 10), kind: 'tree' },
      { pos: tile(5, 7), kind: 'tree' },
      { pos: tile(6, 7), kind: 'tree' },
    ],
    prelitFires: [],
    ground: 'verdant',
    label: 'Floresta Cerrada',
    hint: 'Dez árvores. Corredores estreitos, tudo é emboscada.',
  },
  {
    cols: 11,
    rows: 17,
    obstacles: [
      { pos: tile(5, 3), kind: 'tree' },
      { pos: tile(5, 13), kind: 'tree' },
      { pos: tile(2, 7), kind: 'tree' },
      { pos: tile(8, 7), kind: 'tree' },
      { pos: tile(2, 9), kind: 'tree' },
      { pos: tile(8, 9), kind: 'tree' },
      { pos: tile(4, 8), kind: 'tree' },
      { pos: tile(6, 8), kind: 'tree' },
    ],
    prelitFires: [],
    ground: 'verdant',
    label: 'Anfiteatro Druida',
    hint: 'Anel de árvores. Alvos sempre atrás de cobertura. Engano puro.',
  },
]

const CROWN_PATTERNS: MapLayout[] = [
  {
    cols: 11,
    rows: 17,
    obstacles: [
      { pos: tile(3, 6), kind: 'altar' },
      { pos: tile(7, 6), kind: 'altar' },
      { pos: tile(3, 10), kind: 'altar' },
      { pos: tile(7, 10), kind: 'altar' },
      { pos: tile(5, 8), kind: 'crystal' },
      { pos: tile(5, 9), kind: 'crystal' },
    ],
    prelitFires: [],
    ground: 'crown',
    label: 'Santuário do Trono',
    hint: 'Quatro altares e cristais centrais. Cobertura altíssima — força lateral.',
  },
  {
    cols: 12,
    rows: 17,
    obstacles: [
      { pos: tile(2, 5), kind: 'crystal' },
      { pos: tile(9, 5), kind: 'crystal' },
      { pos: tile(2, 11), kind: 'crystal' },
      { pos: tile(9, 11), kind: 'crystal' },
      { pos: tile(5, 8), kind: 'altar' },
      { pos: tile(6, 8), kind: 'altar' },
      { pos: tile(5, 9), kind: 'altar' },
      { pos: tile(6, 9), kind: 'altar' },
    ],
    prelitFires: [tile(0, 8), tile(11, 8), tile(0, 9), tile(11, 9)],
    ground: 'crown',
    label: 'Coroa Submersa',
    hint: 'Cristais nos cantos canalizam fogo. Os altares centrais defendem o trono.',
  },
  {
    cols: 11,
    rows: 18,
    obstacles: [
      { pos: tile(0, 8), kind: 'altar' },
      { pos: tile(10, 8), kind: 'altar' },
      { pos: tile(0, 9), kind: 'altar' },
      { pos: tile(10, 9), kind: 'altar' },
      { pos: tile(5, 4), kind: 'crystal' },
      { pos: tile(5, 13), kind: 'crystal' },
      { pos: tile(3, 8), kind: 'crystal' },
      { pos: tile(7, 9), kind: 'crystal' },
    ],
    prelitFires: [tile(5, 8), tile(5, 9), tile(4, 8), tile(6, 9)],
    ground: 'crown',
    label: 'Câmara da Profecia',
    hint: 'Trono em chamas. Voadores ditam o ritmo. Não fica parado.',
  },
  {
    cols: 13,
    rows: 17,
    obstacles: [
      { pos: tile(3, 5), kind: 'altar' },
      { pos: tile(9, 5), kind: 'altar' },
      { pos: tile(3, 11), kind: 'altar' },
      { pos: tile(9, 11), kind: 'altar' },
      { pos: tile(6, 4), kind: 'crystal' },
      { pos: tile(6, 12), kind: 'crystal' },
      { pos: tile(2, 8), kind: 'crystal' },
      { pos: tile(10, 8), kind: 'crystal' },
      { pos: tile(6, 8), kind: 'altar' },
    ],
    prelitFires: [tile(5, 8), tile(7, 8), tile(6, 7), tile(6, 9)],
    ground: 'crown',
    label: 'Catedral do Falso Rei',
    hint: 'Salão monumental. Trono central cercado por fogo cerimonial.',
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
