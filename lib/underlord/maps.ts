/**
 * MAP LAYOUTS — per-biome battlefield blueprints.
 *
 * Design goals (XCOM-inspired):
 *  - Every map has a READABLE FOCAL POINT (collapsed throne, sunken
 *    obelisk, burning shipwreck, ice-pyre…) visible from the briefing
 *    screenshot. No two patterns look the same.
 *  - Asymmetry is preferred over centered patterns — diagonal walls,
 *    one-side cover, off-center centerpieces. This forces the player
 *    to pick an APPROACH SIDE every fight, the way XCOM forces flank
 *    decisions on every council mission.
 *  - Hazard lanes (fire / coral / ice cracks) channel movement instead
 *    of just decorating corners. Big patches of fire act like LOS
 *    breakers for melee while staying transparent to fliers.
 *  - Boards stay BIG (10-13 cols × 14-18 rows) so range archetypes
 *    (lich 6 / bone 5 / oracle 5) and fliers have room to breathe.
 *
 * Spawn-safe rule: rows 0-1 are hero spawn, rows-3..rows-1 are player
 * spawn. We keep obstacles inside rows 2..rows-4 so deployment never
 * has to slide units far. The build path in battle.tsx is robust to
 * collisions (`taken` set), but tight maps still feel best when the
 * front line lands on its intended hex.
 *
 * Stage-to-pattern mapping is deterministic so the same region always
 * renders the same map. SIGNATURE_MAPS overrides the pool entirely for
 * named boss regions (sunkencrown, usurper-hall, etc) — XCOM's "story
 * mission has a unique map" trick.
 */

import type { Axial, Region } from './types'

/* ------------------------------------------------------------------ */
/* Terrain catalog                                                     */
/* ------------------------------------------------------------------ */

/** All impassable hex kinds. Glyph + tooltip live in the tables below
 * so the briefing/battle renderers can paint any biome's set without
 * a switch statement. */
export type TerrainKind =
  | 'rock'
  | 'pillar'
  | 'tree'
  | 'altar'
  | 'crystal'
  // v7 expansion — six new kinds to support the bespoke biome pools and
  // the signature boss maps. Each picks a unique unicode glyph that
  // reads at hex-icon size on mobile.
  | 'bones'
  | 'idol'
  | 'wreck'
  | 'ice'
  | 'dune'
  | 'coral'

/**
 * v9 — interactive, WALKABLE tile features. Unlike obstacles (which
 * are always impassable visual decoration), features have rules:
 *
 *   - 'vent'      : every 2 rounds, ignites a fire on its own tile
 *                   with TTL 2. The renderer paints a steam glyph.
 *                   The map author places these to create rhythmic
 *                   no-go zones (ash + iron forges).
 *   - 'spike-pit' : any unit that ENDS its turn on this tile takes
 *                   4 damage. Doesn't expire. Forces the AI/player
 *                   to think about footprint, not just destination.
 *
 * Features are stored in a parallel array (`features`) on `BattleState`
 * so we never have to widen `Obstacle` and break renderers that look
 * for hard walls. Empty by default — every legacy map continues to
 * work without features.
 */
export type MapFeatureKind = 'vent' | 'spike-pit'

export type MapFeature = {
  pos: Axial
  kind: MapFeatureKind
  /** Internal counter used by the engine. For `vent`: rounds until
   * next ignition (2 → 1 → 0 → ignite + reset to 2). For `spike-pit`:
   * unused. Authors should leave this undefined; the engine seeds it
   * from `kind` at `initBattle`. */
  cooldown?: number
}

export type MapLayout = {
  cols: number
  rows: number
  /** Impassable terrain hexes. */
  obstacles: { pos: Axial; kind: TerrainKind }[]
  /** v9 — Optional walkable interactive tiles. */
  features?: MapFeature[]
  /** Hexes that ignite at battle start (ash/coastal/abyss ambient hazards). */
  prelitFires: Axial[]
  /** Tag used by the renderer for ground-color tinting. */
  ground:
    | 'moor'
    | 'iron'
    | 'ash'
    | 'verdant'
    | 'crown'
    | 'tundra'
    | 'dunes'
    | 'abyss'
  /** Display label shown on the briefing screen. */
  label: string
  /** One-liner about why the terrain is annoying. */
  hint: string
}

type Biome = Region['biome']

/** Helper — convert (col, row) with offset back to axial. */
function tile(col: number, row: number): Axial {
  const offset = -Math.floor(row / 2)
  return { q: col + offset, r: row }
}

/** Helper — build a straight horizontal wall of obstacles on a given
 * row. Used by the asymmetric "barricade" patterns where one side of
 * the board has a wall and the other is open. */
function rowOf(row: number, fromCol: number, toCol: number, kind: TerrainKind) {
  const out: { pos: Axial; kind: TerrainKind }[] = []
  for (let c = fromCol; c <= toCol; c++) out.push({ pos: tile(c, row), kind })
  return out
}

/** Helper — diagonal cut. Walks from (col0,row0) stepping +1 col, +1
 * row each step, length steps. Creates an XCOM-style alley wall that
 * forces the player to commit to one half of the board. */
function diagOf(
  col0: number,
  row0: number,
  length: number,
  kind: TerrainKind,
) {
  const out: { pos: Axial; kind: TerrainKind }[] = []
  for (let i = 0; i < length; i++) out.push({ pos: tile(col0 + i, row0 + i), kind })
  return out
}

/* ------------------------------------------------------------------ */
/* MOOR — drowned graveyards, peat barricades, sunken cathedrals       */
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
      // Cemitério de profetas — menires em quincôncio assimétrico.
      // Lado esquerdo tem mais pedras, lado direito é mais aberto.
      { pos: tile(2, 5), kind: 'rock' },
      { pos: tile(8, 5), kind: 'rock' },
      { pos: tile(2, 10), kind: 'rock' },
      { pos: tile(2, 7), kind: 'rock' },
      { pos: tile(2, 8), kind: 'bones' },
      { pos: tile(8, 10), kind: 'rock' },
      { pos: tile(5, 7), kind: 'rock' },
      { pos: tile(5, 8), kind: 'bones' },
    ],
    prelitFires: [],
    ground: 'moor',
    label: 'Cemitério dos Profetas',
    hint: 'Lado oeste fortificado em ossadas. Vai pelo leste descoberto.',
  },
  {
    cols: 10,
    rows: 17,
    obstacles: [
      // Vala funda — linha contínua de pedras com 2 brechas estreitas.
      ...rowOf(8, 0, 2, 'rock'),
      ...rowOf(8, 4, 5, 'rock'),
      ...rowOf(8, 7, 9, 'rock'),
    ],
    prelitFires: [],
    ground: 'moor',
    label: 'Vala Funda',
    hint: 'Muralha rasgada por duas brechas. Voadores passam por cima.',
  },
  {
    cols: 11,
    rows: 16,
    obstacles: [
      // Catedral submersa — corte diagonal de altares afundados.
      ...diagOf(2, 5, 6, 'altar'),
      // Pequena ilha de pedras no canto sudoeste para LOS quebrada.
      { pos: tile(2, 11), kind: 'rock' },
      { pos: tile(3, 11), kind: 'rock' },
      { pos: tile(2, 12), kind: 'rock' },
    ],
    prelitFires: [],
    ground: 'moor',
    label: 'Catedral Submersa',
    hint: 'Diagonal de altares racha o tabuleiro. Escolhe um lado e compromete.',
  },
  {
    cols: 12,
    rows: 16,
    obstacles: [
      // Ponte do afogamento — ponte estreita ladeada por água.
      // Centro é o único corredor seguro; flancos têm bones/altares
      // estranhos onde os afogados subiram.
      { pos: tile(0, 7), kind: 'bones' },
      { pos: tile(1, 7), kind: 'rock' },
      { pos: tile(2, 7), kind: 'rock' },
      { pos: tile(9, 7), kind: 'rock' },
      { pos: tile(10, 7), kind: 'rock' },
      { pos: tile(11, 7), kind: 'bones' },
      { pos: tile(0, 8), kind: 'rock' },
      { pos: tile(1, 8), kind: 'rock' },
      { pos: tile(10, 8), kind: 'rock' },
      { pos: tile(11, 8), kind: 'rock' },
      // Ídolo solitário no meio da ponte.
      { pos: tile(5, 7), kind: 'idol' },
    ],
    prelitFires: [],
    ground: 'moor',
    label: 'Ponte do Afogamento',
    hint: 'Funil estreito no centro. O ídolo no meio bloqueia tiro reto.',
  },
]

/* ------------------------------------------------------------------ */
/* IRON — vault corridors, foundry conveyors, gallows squares          */
/* ------------------------------------------------------------------ */

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
      // Linha de produção — duas faixas de pilares em corredor estreito,
      // com fogo cerimonial nas extremidades (forja sempre acesa).
      { pos: tile(3, 6), kind: 'pillar' },
      { pos: tile(3, 7), kind: 'pillar' },
      { pos: tile(3, 8), kind: 'pillar' },
      { pos: tile(3, 9), kind: 'pillar' },
      { pos: tile(7, 6), kind: 'pillar' },
      { pos: tile(7, 7), kind: 'pillar' },
      { pos: tile(7, 8), kind: 'pillar' },
      { pos: tile(7, 9), kind: 'pillar' },
    ],
    prelitFires: [tile(0, 7), tile(0, 8), tile(10, 7), tile(10, 8)],
    ground: 'iron',
    label: 'Linha de Forja',
    hint: 'Dois corredores paralelos de ferro. Os flancos queimam.',
  },
  {
    cols: 12,
    rows: 16,
    obstacles: [
      // Praça da Forca — patíbulo central com ossos ao redor; flancos
      // assimétricos: oeste tem dois pilares, leste tem três.
      { pos: tile(2, 6), kind: 'pillar' },
      { pos: tile(2, 9), kind: 'pillar' },
      { pos: tile(9, 5), kind: 'pillar' },
      { pos: tile(9, 8), kind: 'pillar' },
      { pos: tile(9, 11), kind: 'pillar' },
      // Patíbulo (ídolo) com ossadas em volta.
      { pos: tile(5, 7), kind: 'idol' },
      { pos: tile(6, 7), kind: 'bones' },
      { pos: tile(5, 8), kind: 'bones' },
      { pos: tile(6, 8), kind: 'bones' },
    ],
    prelitFires: [],
    ground: 'iron',
    label: 'Praça da Forca',
    hint: 'Patíbulo central com ossadas; flancos assimétricos.',
  },
  {
    cols: 11,
    rows: 17,
    obstacles: [
      // Cripta de cofres — três câmaras conectadas por brechas de 1 hex.
      // Câmara A (oeste): 3-4 hexes; câmara B (centro): 4-5; câmara C (leste): 3-4.
      // Paredes formam dois corredores verticais finos.
      ...rowOf(7, 0, 2, 'pillar'),
      ...rowOf(7, 4, 5, 'pillar'),
      ...rowOf(7, 7, 9, 'pillar'),
      ...rowOf(8, 0, 2, 'pillar'),
      ...rowOf(8, 4, 5, 'pillar'),
      ...rowOf(8, 7, 9, 'pillar'),
      // Cristais centrais (loot visível).
      { pos: tile(5, 9), kind: 'crystal' },
    ],
    prelitFires: [],
    ground: 'iron',
    label: 'Cripta de Cofres',
    hint: 'Três câmaras, dois corredores. Brechas de 1 hex viram emboscadas.',
  },
]

/* ------------------------------------------------------------------ */
/* ASH — lava rivers, pyre temples, smoldering wreckage                */
/* ------------------------------------------------------------------ */

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
  {
    cols: 12,
    rows: 16,
    obstacles: [
      // Naufrágio em chamas — destroços (wreck) no centro com fogo
      // espalhado em volta. XCOM crash-site puro.
      { pos: tile(4, 6), kind: 'wreck' },
      { pos: tile(5, 6), kind: 'wreck' },
      { pos: tile(6, 6), kind: 'wreck' },
      { pos: tile(7, 6), kind: 'wreck' },
      { pos: tile(4, 9), kind: 'wreck' },
      { pos: tile(5, 9), kind: 'wreck' },
      { pos: tile(6, 9), kind: 'wreck' },
      { pos: tile(7, 9), kind: 'wreck' },
    ],
    prelitFires: [
      tile(3, 7), tile(8, 7), tile(3, 8), tile(8, 8),
      tile(2, 6), tile(9, 9),
    ],
    ground: 'ash',
    label: 'Naufrágio em Brasa',
    hint: 'Carcaça de navio queimando no meio. Fogo cercando os destroços.',
  },
  {
    cols: 11,
    rows: 17,
    obstacles: [
      // Templo do pyre — ídolo central rodeado por cristais (relíquias)
      // e pilares assimétricos. Fogo só do lado leste (entrada do templo).
      { pos: tile(5, 7), kind: 'idol' },
      { pos: tile(4, 7), kind: 'crystal' },
      { pos: tile(6, 7), kind: 'crystal' },
      { pos: tile(5, 6), kind: 'crystal' },
      { pos: tile(5, 8), kind: 'crystal' },
      { pos: tile(2, 5), kind: 'pillar' },
      { pos: tile(2, 9), kind: 'pillar' },
      { pos: tile(8, 5), kind: 'pillar' },
      { pos: tile(8, 9), kind: 'pillar' },
    ],
    prelitFires: [
      tile(8, 7), tile(8, 8), tile(9, 7), tile(9, 8),
    ],
    ground: 'ash',
    label: 'Templo do Pyre',
    hint: 'Ídolo cercado por cristais. Entrada leste em chamas eternas.',
  },
]

/* ------------------------------------------------------------------ */
/* VERDANT — gallows groves, druid amphitheaters, thorn mazes          */
/* ------------------------------------------------------------------ */

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
  {
    cols: 11,
    rows: 16,
    obstacles: [
      // Vereda das forcas — fileira de árvores com ossadas penduradas.
      // Diagonal de bones cortando o sudoeste pro nordeste.
      { pos: tile(2, 5), kind: 'tree' },
      { pos: tile(4, 5), kind: 'tree' },
      { pos: tile(8, 5), kind: 'tree' },
      ...diagOf(1, 6, 5, 'bones'),
      { pos: tile(7, 10), kind: 'tree' },
      { pos: tile(9, 10), kind: 'tree' },
    ],
    prelitFires: [],
    ground: 'verdant',
    label: 'Vereda das Forcas',
    hint: 'Diagonal de ossos divide o tabuleiro. Aproximação obrigatória pelo flanco.',
  },
  {
    cols: 12,
    rows: 17,
    obstacles: [
      // Labirinto de espinhos — duas linhas paralelas de árvores
      // com brechas alternadas (entrada NW, saída SE).
      ...rowOf(6, 1, 4, 'tree'),
      ...rowOf(6, 7, 10, 'tree'),
      ...rowOf(10, 1, 4, 'tree'),
      ...rowOf(10, 7, 10, 'tree'),
      // Ídolo druida no centro do labirinto.
      { pos: tile(5, 8), kind: 'idol' },
      { pos: tile(6, 8), kind: 'tree' },
    ],
    prelitFires: [],
    ground: 'verdant',
    label: 'Labirinto de Espinhos',
    hint: 'Duas barreiras com brechas alternadas. Comprometa-se com uma rota.',
  },
]

/* ------------------------------------------------------------------ */
/* CROWN — throne halls, broken spires, false-king cathedrals          */
/* ------------------------------------------------------------------ */

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
  {
    cols: 11,
    rows: 16,
    obstacles: [
      // Galeria das coroas — sete altares (uma por coroa caída) em
      // arco assimétrico no fundo do tabuleiro. Lado oeste é livre.
      { pos: tile(4, 4), kind: 'altar' },
      { pos: tile(5, 4), kind: 'altar' },
      { pos: tile(6, 4), kind: 'altar' },
      { pos: tile(3, 5), kind: 'altar' },
      { pos: tile(7, 5), kind: 'altar' },
      { pos: tile(2, 6), kind: 'altar' },
      { pos: tile(8, 6), kind: 'altar' },
      // Coroa partida (bones+crystal) ao pé do arco.
      { pos: tile(5, 7), kind: 'crystal' },
      { pos: tile(5, 8), kind: 'bones' },
    ],
    prelitFires: [],
    ground: 'crown',
    label: 'Galeria das Coroas',
    hint: 'Sete altares em arco. Coroa partida no centro — ataca de baixo pra cima.',
  },
  {
    cols: 12,
    rows: 17,
    obstacles: [
      // Trono dos Sete — escadaria assimétrica com pilares laterais
      // e o ídolo do trono lá em cima. Versão "menor" do sunkencrown.
      { pos: tile(2, 4), kind: 'pillar' },
      { pos: tile(9, 4), kind: 'pillar' },
      { pos: tile(2, 6), kind: 'pillar' },
      { pos: tile(9, 6), kind: 'pillar' },
      // Escadaria central (3 hexes em linha).
      { pos: tile(4, 5), kind: 'altar' },
      { pos: tile(5, 5), kind: 'altar' },
      { pos: tile(6, 5), kind: 'altar' },
      { pos: tile(7, 5), kind: 'altar' },
      // Trono em si.
      { pos: tile(5, 4), kind: 'idol' },
      { pos: tile(6, 4), kind: 'idol' },
    ],
    prelitFires: [tile(0, 8), tile(11, 8)],
    ground: 'crown',
    label: 'Trono dos Sete',
    hint: 'Escadaria de altares culmina no trono dos ídolos. Sobe ou morre.',
  },
]

/* ------------------------------------------------------------------ */
/* TUNDRA — frozen pyres, glacier crevasses, ice-spire forests         */
/* ------------------------------------------------------------------ */

const TUNDRA_PATTERNS: MapLayout[] = [
  {
    cols: 11,
    rows: 16,
    obstacles: [
      // Floresta de espinhos de gelo — mata de ice spires com clareira
      // central. Voadores ainda passam por cima.
      { pos: tile(2, 5), kind: 'ice' },
      { pos: tile(4, 5), kind: 'ice' },
      { pos: tile(6, 5), kind: 'ice' },
      { pos: tile(8, 5), kind: 'ice' },
      { pos: tile(3, 7), kind: 'ice' },
      { pos: tile(7, 7), kind: 'ice' },
      { pos: tile(2, 10), kind: 'ice' },
      { pos: tile(4, 10), kind: 'ice' },
      { pos: tile(6, 10), kind: 'ice' },
      { pos: tile(8, 10), kind: 'ice' },
    ],
    prelitFires: [],
    ground: 'tundra',
    label: 'Floresta de Espinhos',
    hint: 'Espinhos de gelo formam corredores. Voadores ignoram tudo.',
  },
  {
    cols: 11,
    rows: 16,
    obstacles: [
      // Crevassa glaciar — racha diagonal grande no centro, intransponível
      // no chão; voadores cruzam.
      ...diagOf(3, 6, 6, 'ice'),
      // Pequenos refúgios.
      { pos: tile(1, 9), kind: 'rock' },
      { pos: tile(9, 6), kind: 'rock' },
    ],
    prelitFires: [],
    ground: 'tundra',
    label: 'Crevassa Glaciar',
    hint: 'Diagonal de gelo intransponível. Compromete-se com um lado.',
  },
  {
    cols: 12,
    rows: 17,
    obstacles: [
      // Cemitério gelado — torres de gelo escalonadas com ossadas
      // congeladas no chão entre elas. Lado leste tem mais cobertura.
      { pos: tile(2, 6), kind: 'ice' },
      { pos: tile(8, 5), kind: 'ice' },
      { pos: tile(9, 7), kind: 'ice' },
      { pos: tile(8, 9), kind: 'ice' },
      { pos: tile(2, 10), kind: 'ice' },
      { pos: tile(5, 7), kind: 'bones' },
      { pos: tile(6, 7), kind: 'bones' },
      { pos: tile(5, 8), kind: 'bones' },
      { pos: tile(6, 8), kind: 'bones' },
    ],
    prelitFires: [],
    ground: 'tundra',
    label: 'Cemitério Gelado',
    hint: 'Pilha de ossadas congelada no centro. Lado leste é mais defendido.',
  },
  {
    cols: 11,
    rows: 17,
    obstacles: [
      // Pyre congelado — fogo azul em arena circular. As "chamas"
      // são geladas: ainda queimam quem fica em cima.
      { pos: tile(3, 6), kind: 'ice' },
      { pos: tile(7, 6), kind: 'ice' },
      { pos: tile(3, 10), kind: 'ice' },
      { pos: tile(7, 10), kind: 'ice' },
      { pos: tile(5, 8), kind: 'idol' },
    ],
    prelitFires: [
      tile(4, 7), tile(6, 7), tile(4, 9), tile(6, 9),
      tile(5, 7), tile(5, 9),
    ],
    ground: 'tundra',
    label: 'Pyre Congelado',
    hint: 'Anel de gelo eterno em volta de um ídolo. Os hexes do anel queimam.',
  },
  {
    cols: 12,
    rows: 16,
    obstacles: [
      // Costela do dragão branco — esqueleto colossal atravessa o
      // tabuleiro como ponte de bones; ice spires nos cantos.
      ...rowOf(7, 2, 9, 'bones'),
      ...rowOf(8, 2, 9, 'bones'),
      // Brechas (a costela está partida em dois pontos).
      // Patch — limpa duas brechas:
      // (col 4-5, row 7) e (col 7, row 8) servem de passagem.
    ],
    prelitFires: [],
    ground: 'tundra',
    label: 'Costela do Dragão Branco',
    hint: 'Carcaça de dragão como muralha. As brechas custam caro.',
  },
]

// Patch the dragon-rib map — drill the gaps. Simpler to mutate after
// the fact than to write the whole row by hand.
{
  const m = TUNDRA_PATTERNS[4]
  m.obstacles = m.obstacles.filter(
    (o) =>
      !(o.pos.q === tile(4, 7).q && o.pos.r === 7) &&
      !(o.pos.q === tile(7, 8).q && o.pos.r === 8),
  )
}

/* ------------------------------------------------------------------ */
/* DUNES — singing sands, buried obelisks, oasis ambushes              */
/* ------------------------------------------------------------------ */

const DUNES_PATTERNS: MapLayout[] = [
  {
    cols: 11,
    rows: 15,
    obstacles: [
      // Areal aberto com algumas dunas isoladas — pesadelo pra melee,
      // paraíso pra arqueiro.
      { pos: tile(3, 6), kind: 'dune' },
      { pos: tile(7, 5), kind: 'dune' },
      { pos: tile(5, 8), kind: 'dune' },
      { pos: tile(2, 9), kind: 'dune' },
      { pos: tile(8, 9), kind: 'dune' },
    ],
    prelitFires: [],
    ground: 'dunes',
    label: 'Mar de Areia',
    hint: 'Dunas esparsas, terreno aberto. Range domina.',
  },
  {
    cols: 12,
    rows: 16,
    obstacles: [
      // Obelisco enterrado — três pedaços partidos (idol+rock) no
      // centro, dunas em volta canalizando o fogo.
      { pos: tile(5, 7), kind: 'idol' },
      { pos: tile(6, 8), kind: 'idol' },
      { pos: tile(5, 9), kind: 'rock' },
      { pos: tile(3, 6), kind: 'dune' },
      { pos: tile(8, 6), kind: 'dune' },
      { pos: tile(3, 10), kind: 'dune' },
      { pos: tile(8, 10), kind: 'dune' },
    ],
    prelitFires: [],
    ground: 'dunes',
    label: 'Obelisco Partido',
    hint: 'Três fragmentos de obelisco. As dunas canalizam o avanço.',
  },
  {
    cols: 11,
    rows: 16,
    obstacles: [
      // Caravana naufragada — destroços de carroças no meio, com
      // dunas se acumulando em torno.
      { pos: tile(4, 7), kind: 'wreck' },
      { pos: tile(5, 7), kind: 'wreck' },
      { pos: tile(6, 7), kind: 'wreck' },
      { pos: tile(4, 8), kind: 'dune' },
      { pos: tile(7, 8), kind: 'dune' },
      { pos: tile(2, 5), kind: 'dune' },
      { pos: tile(9, 5), kind: 'dune' },
    ],
    prelitFires: [],
    ground: 'dunes',
    label: 'Caravana Sepultada',
    hint: 'Carroças quebradas no centro, dunas crescendo em volta.',
  },
  {
    cols: 12,
    rows: 17,
    obstacles: [
      // Oásis emboscada — pequeno bosque (3 árvores) cercado por
      // dunas. Centro é a única cobertura real.
      { pos: tile(5, 7), kind: 'tree' },
      { pos: tile(6, 7), kind: 'tree' },
      { pos: tile(5, 8), kind: 'tree' },
      { pos: tile(3, 5), kind: 'dune' },
      { pos: tile(9, 5), kind: 'dune' },
      { pos: tile(3, 11), kind: 'dune' },
      { pos: tile(9, 11), kind: 'dune' },
      { pos: tile(2, 8), kind: 'dune' },
      { pos: tile(10, 8), kind: 'dune' },
    ],
    prelitFires: [],
    ground: 'dunes',
    label: 'Oásis Cantor',
    hint: 'Único bosque cercado de dunas. Quem segura o oásis ganha.',
  },
  {
    cols: 11,
    rows: 16,
    obstacles: [
      // Tempestade de areia — corredor estreito flanqueado por dunas
      // densas; campo central tem 2 idols enterrados.
      ...rowOf(5, 0, 3, 'dune'),
      ...rowOf(5, 7, 10, 'dune'),
      ...rowOf(10, 0, 3, 'dune'),
      ...rowOf(10, 7, 10, 'dune'),
      { pos: tile(4, 7), kind: 'idol' },
      { pos: tile(6, 8), kind: 'idol' },
    ],
    prelitFires: [],
    ground: 'dunes',
    label: 'Tempestade de Areia',
    hint: 'Dunas fecham os flancos. Corredor estreito, ídolos no caminho.',
  },
]

/* ------------------------------------------------------------------ */
/* ABYSS — flooded caverns, coral spires, drowned shrines              */
/* ------------------------------------------------------------------ */

const ABYSS_PATTERNS: MapLayout[] = [
  {
    cols: 11,
    rows: 16,
    obstacles: [
      // Salão coral — pilares de coral assimétricos, fogo submarino
      // (chama esverdeada) nos cantos.
      { pos: tile(3, 6), kind: 'coral' },
      { pos: tile(7, 5), kind: 'coral' },
      { pos: tile(2, 9), kind: 'coral' },
      { pos: tile(9, 8), kind: 'coral' },
      { pos: tile(5, 7), kind: 'coral' },
    ],
    prelitFires: [tile(0, 7), tile(10, 8)],
    ground: 'abyss',
    label: 'Salão de Coral',
    hint: 'Coral irregular cobre o centro. Chamas frias nos flancos.',
  },
  {
    cols: 12,
    rows: 16,
    obstacles: [
      // Catedral afogada — duas fileiras de altares submersos com
      // coral crescendo em volta.
      ...rowOf(6, 2, 9, 'altar'),
      { pos: tile(3, 7), kind: 'coral' },
      { pos: tile(8, 7), kind: 'coral' },
      { pos: tile(3, 9), kind: 'coral' },
      { pos: tile(8, 9), kind: 'coral' },
    ],
    prelitFires: [],
    ground: 'abyss',
    label: 'Catedral Afogada',
    hint: 'Linha contínua de altares. Coral fecha os flancos atrás.',
  },
  {
    cols: 11,
    rows: 17,
    obstacles: [
      // Pedras de passagem — caminho de pedras serpenteia entre coral
      // e fogo abissal. Errar é cair na chama.
      { pos: tile(3, 5), kind: 'rock' },
      { pos: tile(5, 6), kind: 'rock' },
      { pos: tile(7, 7), kind: 'rock' },
      { pos: tile(5, 8), kind: 'rock' },
      { pos: tile(3, 9), kind: 'rock' },
      { pos: tile(5, 10), kind: 'rock' },
      { pos: tile(7, 11), kind: 'rock' },
      // Coral nos cantos.
      { pos: tile(2, 7), kind: 'coral' },
      { pos: tile(9, 6), kind: 'coral' },
      { pos: tile(9, 10), kind: 'coral' },
    ],
    prelitFires: [
      tile(4, 7), tile(6, 7), tile(4, 9), tile(6, 9), tile(4, 8), tile(6, 8),
    ],
    ground: 'abyss',
    label: 'Pedras de Passagem',
    hint: 'Caminho de pedras zigueza entre fogo abissal. Voadores reinam.',
  },
  {
    cols: 12,
    rows: 17,
    obstacles: [
      // Naufrágio do leviatã — destroços enormes (linha de wrecks)
      // dominando o centro, com coral crescendo nas pontas.
      ...rowOf(7, 3, 8, 'wreck'),
      ...rowOf(8, 3, 8, 'wreck'),
      { pos: tile(2, 7), kind: 'coral' },
      { pos: tile(9, 7), kind: 'coral' },
      { pos: tile(2, 8), kind: 'coral' },
      { pos: tile(9, 8), kind: 'coral' },
    ],
    prelitFires: [],
    ground: 'abyss',
    label: 'Naufrágio do Leviatã',
    hint: 'Carcaça monumental no meio. Tem que rodear ou voar por cima.',
  },
  {
    cols: 11,
    rows: 17,
    obstacles: [
      // Trono submerso menor — ídolo central rodeado por coral em
      // anel completo. Versão "guardião do final boss".
      { pos: tile(5, 8), kind: 'idol' },
      { pos: tile(4, 7), kind: 'coral' },
      { pos: tile(6, 7), kind: 'coral' },
      { pos: tile(4, 9), kind: 'coral' },
      { pos: tile(6, 9), kind: 'coral' },
      { pos: tile(3, 8), kind: 'coral' },
      { pos: tile(7, 8), kind: 'coral' },
    ],
    prelitFires: [tile(5, 7), tile(5, 9)],
    ground: 'abyss',
    label: 'Trono Submerso',
    hint: 'Ídolo cercado de coral em anel. Fogo no eixo vertical.',
  },
]

/* ------------------------------------------------------------------ */
/* SIGNATURE MAPS — bespoke boss layouts, keyed by region.id           */
/* These OVERRIDE the biome pool entirely. XCOM "story mission has its */
/* own map" trick. Hand-tuned — every one is a memorable encounter.    */
/* ------------------------------------------------------------------ */

const SIGNATURE_MAPS: Record<string, MapLayout> = {
  /* SUNKENCROWN — final boss. Stage 14. Throne hall flooded by ash.
     Three concentric rings: outer altars (4 corners), inner crystals
     (cardinal directions), ídolo do trono no topo central. Fogo nos
     dois eixos. Tem que escolher um eixo de aproximação. */
  sunkencrown: {
    cols: 13,
    rows: 18,
    obstacles: [
      // Altares nos 4 cantos do salão.
      { pos: tile(2, 5), kind: 'altar' },
      { pos: tile(10, 5), kind: 'altar' },
      { pos: tile(2, 12), kind: 'altar' },
      { pos: tile(10, 12), kind: 'altar' },
      // Anel de cristais (cardeais).
      { pos: tile(6, 4), kind: 'crystal' },
      { pos: tile(2, 8), kind: 'crystal' },
      { pos: tile(10, 8), kind: 'crystal' },
      { pos: tile(6, 13), kind: 'crystal' },
      // Pilares laterais.
      { pos: tile(4, 7), kind: 'pillar' },
      { pos: tile(8, 7), kind: 'pillar' },
      { pos: tile(4, 10), kind: 'pillar' },
      { pos: tile(8, 10), kind: 'pillar' },
      // Trono do falso rei — três ídolos formando o trono.
      { pos: tile(5, 5), kind: 'idol' },
      { pos: tile(6, 5), kind: 'idol' },
      { pos: tile(7, 5), kind: 'idol' },
      // Coroa partida (bones+crystal) ao pé do trono.
      { pos: tile(6, 6), kind: 'crystal' },
      { pos: tile(6, 7), kind: 'bones' },
    ],
    prelitFires: [
      // Eixo vertical — corredor central queima.
      tile(6, 9), tile(6, 10), tile(6, 11), tile(6, 12),
      // Eixo horizontal — fila central também.
      tile(3, 8), tile(4, 8), tile(8, 8), tile(9, 8),
    ],
    ground: 'crown',
    label: 'CORÔA SUBMERSA — TRONO ETERNO',
    hint: 'Boss final. Trono em chamas, anel de cristais, eixos em fogo.',
  },

  /* USURPER-HALL — stage 10 boss. Catedral quebrada com escadaria
     central de altares e dois braços laterais de pilares. Fogo só
     no caminho do meio (escadaria), forçando flanqueio. */
  'usurper-hall': {
    cols: 12,
    rows: 17,
    obstacles: [
      // Pilares laterais formando "alas".
      { pos: tile(2, 6), kind: 'pillar' },
      { pos: tile(2, 8), kind: 'pillar' },
      { pos: tile(2, 10), kind: 'pillar' },
      { pos: tile(9, 6), kind: 'pillar' },
      { pos: tile(9, 8), kind: 'pillar' },
      { pos: tile(9, 10), kind: 'pillar' },
      // Escadaria central — 4 altares enfileirados subindo.
      { pos: tile(5, 6), kind: 'altar' },
      { pos: tile(5, 7), kind: 'altar' },
      { pos: tile(5, 8), kind: 'altar' },
      { pos: tile(5, 9), kind: 'altar' },
      { pos: tile(6, 6), kind: 'altar' },
      { pos: tile(6, 7), kind: 'altar' },
      { pos: tile(6, 8), kind: 'altar' },
      { pos: tile(6, 9), kind: 'altar' },
      // Trono do usurpador no topo.
      { pos: tile(5, 4), kind: 'idol' },
      { pos: tile(6, 4), kind: 'idol' },
    ],
    prelitFires: [
      tile(5, 5), tile(6, 5), tile(5, 10), tile(6, 10),
    ],
    ground: 'crown',
    label: 'SALÃO DO USURPADOR',
    hint: 'Escadaria central inacessível por fogo. Sobe pelas alas laterais.',
  },

  /* EYELESS-BRIDGE — stage 9 boss. Ponte longa e estreita com fosso
     de fogo dos dois lados. Ídolos cegos (sem olhos) bloqueiam tiro. */
  'eyeless-bridge': {
    cols: 13,
    rows: 17,
    obstacles: [
      // Ponte = corredor central limpo. Fora da ponte = fogo.
      // Ídolos cegos no eixo da ponte bloqueando LOS reta.
      { pos: tile(4, 8), kind: 'idol' },
      { pos: tile(8, 8), kind: 'idol' },
      // Pilares laterais (encostas da ponte).
      { pos: tile(0, 7), kind: 'pillar' },
      { pos: tile(12, 7), kind: 'pillar' },
      { pos: tile(0, 9), kind: 'pillar' },
      { pos: tile(12, 9), kind: 'pillar' },
    ],
    prelitFires: [
      // Fosso superior.
      tile(2, 5), tile(4, 5), tile(6, 5), tile(8, 5), tile(10, 5),
      tile(3, 6), tile(5, 6), tile(7, 6), tile(9, 6),
      // Fosso inferior.
      tile(2, 11), tile(4, 11), tile(6, 11), tile(8, 11), tile(10, 11),
      tile(3, 10), tile(5, 10), tile(7, 10), tile(9, 10),
    ],
    ground: 'crown',
    label: 'PONTE DOS CEGOS',
    hint: 'Ponte estreita sobre fosso de chamas. Ídolos cegos quebram o tiro.',
  },

  /* CRACKED-PROPHECY — stage 9. Câmara da profecia rachada. Diagonal
     enorme de cristais partidos cortando o tabuleiro do canto NW pro SE.
     Lado da rachadura tem cobertura, o outro lado é exposto. */
  'cracked-prophecy': {
    cols: 12,
    rows: 17,
    obstacles: [
      // Diagonal grande de cristais (a profecia rachada).
      ...diagOf(2, 4, 9, 'crystal'),
      // Pequenos altares orbitando a rachadura.
      { pos: tile(1, 7), kind: 'altar' },
      { pos: tile(10, 11), kind: 'altar' },
      // Idolo profético no centro da rachadura.
      { pos: tile(6, 8), kind: 'idol' },
    ],
    prelitFires: [tile(0, 8), tile(11, 8)],
    ground: 'crown',
    label: 'PROFECIA RACHADA',
    hint: 'Diagonal de cristais corta o tabuleiro. Comprometa-se com um lado.',
  },

  /* TIDE-THRONE — stage 7 coastal boss. Trono litorâneo: corais nos
     flancos, naufrágio à direita, escadaria à esquerda. Map asymmetric
     property: NW = corredor, SE = arena aberta. */
  'tide-throne': {
    cols: 12,
    rows: 17,
    obstacles: [
      // Naufrágio à direita.
      { pos: tile(8, 6), kind: 'wreck' },
      { pos: tile(9, 6), kind: 'wreck' },
      { pos: tile(8, 7), kind: 'wreck' },
      { pos: tile(9, 7), kind: 'wreck' },
      { pos: tile(8, 8), kind: 'wreck' },
      // Coral nos flancos.
      { pos: tile(2, 5), kind: 'coral' },
      { pos: tile(2, 7), kind: 'coral' },
      { pos: tile(2, 9), kind: 'coral' },
      { pos: tile(10, 10), kind: 'coral' },
      { pos: tile(10, 11), kind: 'coral' },
      // Escadaria à esquerda.
      { pos: tile(3, 6), kind: 'altar' },
      { pos: tile(4, 7), kind: 'altar' },
      { pos: tile(5, 8), kind: 'altar' },
      // Trono — ídolo dourado no fundo do salão.
      { pos: tile(6, 4), kind: 'idol' },
    ],
    prelitFires: [tile(7, 8), tile(7, 9)],
    ground: 'abyss',
    label: 'TRONO DAS MARÉS',
    hint: 'Naufrágio à direita, escadaria à esquerda. Trono no fundo.',
  },

  /* PYRE-OF-ICE — stage 5 tundra boss. Pira azul circular com ícones
     druida congelados em volta. Fogo gelado no anel exterior. */
  'pyre-of-ice': {
    cols: 11,
    rows: 17,
    obstacles: [
      // Anel de espinhos de gelo (defesa exterior).
      { pos: tile(3, 5), kind: 'ice' },
      { pos: tile(7, 5), kind: 'ice' },
      { pos: tile(2, 8), kind: 'ice' },
      { pos: tile(8, 8), kind: 'ice' },
      { pos: tile(3, 11), kind: 'ice' },
      { pos: tile(7, 11), kind: 'ice' },
      // Bones congelados no chão (oferendas druidas).
      { pos: tile(4, 7), kind: 'bones' },
      { pos: tile(6, 7), kind: 'bones' },
      { pos: tile(4, 9), kind: 'bones' },
      { pos: tile(6, 9), kind: 'bones' },
      // Ídolo da pyre no centro.
      { pos: tile(5, 8), kind: 'idol' },
    ],
    prelitFires: [
      tile(5, 6), tile(5, 7), tile(5, 9), tile(5, 10),
    ],
    ground: 'tundra',
    label: 'PIRA CONGELADA',
    hint: 'Anel de gelo + ossadas druidas + chama azul vertical.',
  },

  /* VOLCAN-TEMPLE — stage 6 ash boss. Templo solar em cratera. Anel
     de fogo + ídolo + cristais. */
  'volcan-temple': {
    cols: 11,
    rows: 17,
    obstacles: [
      // Pilares do templo (octógono incompleto — 6 pilares, lado norte aberto).
      { pos: tile(3, 7), kind: 'pillar' },
      { pos: tile(7, 7), kind: 'pillar' },
      { pos: tile(2, 9), kind: 'pillar' },
      { pos: tile(8, 9), kind: 'pillar' },
      { pos: tile(3, 11), kind: 'pillar' },
      { pos: tile(7, 11), kind: 'pillar' },
      // Cristais solares aos pés do altar.
      { pos: tile(4, 8), kind: 'crystal' },
      { pos: tile(6, 8), kind: 'crystal' },
      { pos: tile(4, 10), kind: 'crystal' },
      { pos: tile(6, 10), kind: 'crystal' },
      // Sol-ídolo no centro.
      { pos: tile(5, 9), kind: 'idol' },
    ],
    prelitFires: [
      tile(0, 8), tile(0, 9), tile(0, 10),
      tile(10, 8), tile(10, 9), tile(10, 10),
      tile(5, 7), tile(5, 11),
    ],
    ground: 'ash',
    label: 'TEMPLO VULCÂNICO',
    hint: 'Octógono incompleto. Sol-ídolo central rodeado de cristais.',
  },
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

const PATTERNS_BY_BIOME: Record<Biome, MapLayout[]> = {
  moor: MOOR_PATTERNS,
  iron: IRON_PATTERNS,
  ash: ASH_PATTERNS,
  verdant: VERDANT_PATTERNS,
  crown: CROWN_PATTERNS,
  // v7: bespoke pools for the three new biomes.
  tundra: TUNDRA_PATTERNS,
  dunes: DUNES_PATTERNS,
  abyss: ABYSS_PATTERNS,
}

/** Pick a layout for a region. Deterministic — same region → same map.
 *  - Signature regions get their bespoke map first (boss missions).
 *  - Otherwise the biome pool cycles by stage so reruns vary. */
export function pickMapLayout(region: Region): MapLayout {
  const sig = SIGNATURE_MAPS[region.id]
  if (sig) return sig
  const pool = PATTERNS_BY_BIOME[region.biome] ?? MOOR_PATTERNS
  const idx = region.stage % pool.length
  return pool[idx]
}

/** Convenience: ground-tone CSS color for a biome (used by the hex renderer). */
export const GROUND_TONES: Record<
  MapLayout['ground'],
  { fillStart: string; fillEnd: string; stroke: string }
> = {
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
  // v7 biomes — pale cyan tundra, sun-bleached gold dunes, deep teal abyss.
  tundra: {
    fillStart: 'oklch(0.32 0.020 220 / 0.50)',
    fillEnd: 'oklch(0.18 0.014 220 / 0.60)',
    stroke: 'oklch(0.55 0.030 220 / 0.55)',
  },
  dunes: {
    fillStart: 'oklch(0.30 0.040 90 / 0.55)',
    fillEnd: 'oklch(0.18 0.030 90 / 0.62)',
    stroke: 'oklch(0.50 0.060 90 / 0.55)',
  },
  abyss: {
    fillStart: 'oklch(0.18 0.030 220 / 0.60)',
    fillEnd: 'oklch(0.08 0.020 220 / 0.70)',
    stroke: 'oklch(0.30 0.040 220 / 0.55)',
  },
}

/** Glyph rendered on impassable obstacle tiles. */
export const TERRAIN_GLYPH: Record<TerrainKind, string> = {
  rock: '▲',
  pillar: '▮',
  tree: '♣',
  altar: '✚',
  crystal: '◆',
  bones: '☠',
  idol: '⊕',
  wreck: '✖',
  ice: '❄',
  dune: '⌬',
  coral: '※',
}

/** Tooltip text per terrain kind. */
export const TERRAIN_LABEL: Record<TerrainKind, string> = {
  rock: 'Rocha — bloqueia movimento.',
  pillar: 'Pilar de ferro — bloqueia movimento.',
  tree: 'Árvore antiga — bloqueia movimento.',
  altar: 'Altar — bloqueia movimento.',
  crystal: 'Cristal de poder — bloqueia movimento.',
  bones: 'Pilha de ossadas — bloqueia movimento.',
  idol: 'Ídolo — bloqueia movimento. Voadores passam por cima.',
  wreck: 'Destroços — bloqueia movimento.',
  ice: 'Espinho de gelo — bloqueia movimento.',
  dune: 'Crista de duna — bloqueia movimento.',
  coral: 'Coral abissal — bloqueia movimento.',
}
