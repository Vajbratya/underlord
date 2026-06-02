/**
 * O POÇO SEM FUNDO — the endless roguelike run.
 *
 * The campaign is a finite map; the Poço is the "one more run" loop. You
 * descend an infinite ladder of escalating fights, and between floors you
 * pick ONE of three run-only rewards that compound for the rest of the
 * descent. A single loss ends the run. Your score is the deepest floor.
 *
 * It reuses the whole battle engine: each floor is a synthesized `Region`
 * (random biome, escalating stage, catalog heroes, occasional elite) that
 * `BattleScreen`/`pickMapLayout` already know how to render. Run-power is
 * applied by buffing the squad's Unit copies before the fight, and enemy
 * escalation rides the synthesized stage + a per-floor Ascension bonus —
 * so the engine needs zero new branches.
 */

import type { ElitePassiveId, Region } from './types'
import { HEROES } from '../elementum-flavor'

const BIOMES: Region['biome'][] = [
  'ash', 'moor', 'iron', 'verdant', 'crown', 'tundra', 'dunes', 'abyss', 'void',
]
const PASSIVES: ElitePassiveId[] = [
  'thorns', 'aura-rage', 'enrage', 'phase', 'revive', 'summon', 'lifesteal',
  'time-stop', 'regenerate', 'warding', 'colossal', 'volatile', 'split',
  'frenzy', 'siphon-aura', 'frostbite',
]

const HERO_IDS: string[] = HEROES.map((h) => h.id)
const BOSS_IDS: string[] = HEROES.filter((h) => h.eliteKind === 'boss').map((h) => h.id)

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
function pickN<T>(arr: T[], n: number): T[] {
  const pool = arr.slice()
  const out: T[] = []
  for (let i = 0; i < n && pool.length; i++) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0])
  }
  return out
}

/** Per-floor Ascension-equivalent bonus that scales enemy HP/ATK on top of
 * the synthesized stage. Ramps so deep floors get genuinely brutal. */
export function gauntletAscension(floor: number): number {
  return Math.min(12, Math.floor(floor / 2))
}

/** Synthesize the Region for a given floor. */
export function synthFloor(floor: number): Region {
  const stage = Math.min(40, 4 + Math.floor(floor * 1.7))
  const biome = BIOMES[floor % BIOMES.length] ?? pick(BIOMES)
  const isBossFloor = floor % 5 === 0
  const isMiniFloor = !isBossFloor && floor % 3 === 0
  const count = Math.min(4, 1 + Math.floor(floor / 3))
  let heroIds = pickN(HERO_IDS, count)
  if (isBossFloor) {
    // Headline a real boss on boss floors.
    const boss = pick(BOSS_IDS.length ? BOSS_IDS : HERO_IDS)
    heroIds = [boss, ...heroIds.filter((h) => h !== boss)].slice(0, count)
  }
  const eliteHeroes = isBossFloor
    ? [{ id: heroIds[0], kind: 'boss' as const, passiveId: pick(PASSIVES) }]
    : isMiniFloor
      ? [{ id: heroIds[0], kind: 'miniboss' as const, passiveId: pick(PASSIVES) }]
      : undefined
  // Rotate objectives for texture; deep floors stay rout so they're winnable.
  const objective =
    floor > 1 && floor % 4 === 0
      ? ({ kind: 'overwhelm', rounds: 7 + Math.floor(floor / 3) } as const)
      : floor % 7 === 0
        ? ({ kind: 'survive', rounds: 5 } as const)
        : undefined
  return {
    id: `gauntlet-${floor}`,
    name: `O POÇO · ANDAR ${floor}`,
    subtitle: isBossFloor ? 'Guardião do Andar' : 'Descida sem fim',
    stage,
    biome,
    x: 50,
    y: 50,
    links: [],
    lore:
      'Cada andar é mais fundo, mais frio, mais faminto. O Poço não tem chão — só o próximo degrau e a próxima dor.',
    goldReward: 120 + floor * 70,
    heroIds: heroIds.length ? heroIds : [pick(HERO_IDS)],
    dropsLoot: floor % 3 === 0,
    ...(eliteHeroes ? { eliteHeroes } : {}),
    ...(objective ? { objective } : {}),
  }
}

/* ---------------- Run rewards ---------------- */

export type GauntletReward = {
  id: string
  name: string
  desc: string
  tone: 'destructive' | 'accent' | 'gold' | 'primary' | 'foreground'
  /** Multiply the squad's ATK for the rest of the run. */
  atkMult?: number
  /** Multiply the squad's HP for the rest of the run. */
  hpMult?: number
  /** Bank Soulshards (paid out when the run ends). */
  shards?: number
}

const REWARD_POOL: GauntletReward[] = [
  { id: 'edge', name: 'LÂMINA AFIADA', desc: '+22% de ATK no esquadrão (resto da descida).', tone: 'destructive', atkMult: 1.22 },
  { id: 'hide', name: 'CASCA GROSSA', desc: '+28% de HP no esquadrão.', tone: 'foreground', hpMult: 1.28 },
  { id: 'wind', name: 'SEGUNDO FÔLEGO', desc: '+14% ATK e +14% HP.', tone: 'gold', atkMult: 1.14, hpMult: 1.14 },
  { id: 'rage', name: 'PACTO DA FÚRIA', desc: '+40% ATK, mas -12% HP.', tone: 'destructive', atkMult: 1.4, hpMult: 0.88 },
  { id: 'wall', name: 'PACTO DA MURALHA', desc: '+45% HP, mas -10% ATK.', tone: 'primary', hpMult: 1.45, atkMult: 0.9 },
  { id: 'souls', name: 'BOLSA DE ALMAS', desc: '+60 Soulshards ao fim da run.', tone: 'accent', shards: 60 },
  { id: 'hoard', name: 'TRIBUTO DO POÇO', desc: '+120 Soulshards ao fim da run.', tone: 'gold', shards: 120 },
  { id: 'frenzy', name: 'SEDE INSACIÁVEL', desc: '+30% ATK e +60 Soulshards.', tone: 'destructive', atkMult: 1.3, shards: 60 },
  { id: 'bulwark', name: 'FÉ DE FERRO', desc: '+20% ATK e +20% HP.', tone: 'gold', atkMult: 1.2, hpMult: 1.2 },
]

/** Three distinct reward choices for the floor just cleared. */
export function rollRewards(): GauntletReward[] {
  return pickN(REWARD_POOL, 3)
}

/** Run-end payout. Deeper = far richer (the carrot to push one more floor). */
export function gauntletPayout(floorReached: number, bankedShards: number): {
  shards: number
  xp: number
} {
  return {
    shards: bankedShards + floorReached * 10,
    xp: floorReached * 35,
  }
}
