/* ====================================================================
 * Underlord Roguelite Boons
 *
 * Permanent buffs picked between battles. Each victory rolls 3 random
 * unowned boons (rarity-weighted) and the player commits to one. They
 * stack across the entire save, multiplicatively where it makes sense.
 *
 * Categories:
 *   - VANTAGEM (positive): pure upgrades. Common/rare/epic rarities.
 *   - PACTO (trade-off): big positive with a real downside. Always rare+.
 *
 * Effects are intentionally a flat record of optional numeric / boolean
 * fields. The aggregator `aggregateBoons()` collapses an owned-id list
 * into a single bag the engine reads at runtime.
 * ================================================================== */

export type BoonRarity = 'common' | 'rare' | 'epic' | 'mythic'
export type BoonCategory = 'vantagem' | 'pacto'

/** All numeric multipliers default to 1.0 when absent.
 *  All bonuses default to 0 when absent. Booleans default to false.   */
export type BoonEffect = {
  /* ---- stat multipliers (combat) ---- */
  minionHpMult?: number       // applied in rebuildRosterStats
  minionAtkMult?: number
  minionDmgTakenMult?: number // 0.85 = -15% incoming
  rangedAtkBonus?: number     // additive on top of minionAtkMult, ranged only
  flyingAtkBonus?: number     // additive on top of minionAtkMult, flying only
  overlordHpMult?: number
  overlordAtkMult?: number

  /* ---- economy ---- */
  goldMult?: number
  xpMult?: number

  /* ---- moment-to-moment combat ---- */
  critChanceBonus?: number    // +0.10 on top of base 0.18
  lifestealPct?: number        // 0.20 of damage dealt heals attacker
  hpRegenStartOfRound?: number // 0.10 of hpMax restored at round start
  startingAttackBonus?: number // first attack of round 1 gets x(1+bonus)
  specialCdReduce?: number     // turns shaved off all special/skill cooldowns at battle start
}

export type Boon = {
  id: string
  name: string
  /** 4-char chip displayed on the war-room collection. */
  short: string
  rarity: BoonRarity
  category: BoonCategory
  /** Single-line summary used on cards. */
  summary: string
  /** Optional flavor line. */
  flavor?: string
  effect: BoonEffect
}

/* ----- Catalog -----
 *
 * Numbers are tuned so a single boon feels meaningful (commons ~10-20%,
 * rares ~25%, epics ~35-45%) and so multiple stacking boons compound
 * into real builds without breaking mid-game pacing. Pactos always trade
 * one stat for another; the upside is intentionally larger than its
 * non-pacto counterpart in the same rarity tier.
 */
export const BOONS: Record<string, Boon> = {
  /* ---------------- COMMON (4) ---------------- */
  pele_de_pedra: {
    id: 'pele_de_pedra',
    name: 'Pele de Pedra',
    short: 'PDR',
    rarity: 'common',
    category: 'vantagem',
    summary: '+15% HP em todos os minions',
    flavor: 'O sangue endurece nas veias.',
    effect: { minionHpMult: 1.15 },
  },
  lamina_faminta: {
    id: 'lamina_faminta',
    name: 'Lâmina Faminta',
    short: 'LMN',
    rarity: 'common',
    category: 'vantagem',
    summary: '+12% ATK em todos os minions',
    flavor: 'Cada lâmina pede sangue.',
    effect: { minionAtkMult: 1.12 },
  },
  maos_gananciosas: {
    id: 'maos_gananciosas',
    name: 'Mãos Gananciosas',
    short: 'OURO',
    rarity: 'common',
    category: 'vantagem',
    summary: '+25% ouro de batalha',
    effect: { goldMult: 1.25 },
  },
  sabedoria_profana: {
    id: 'sabedoria_profana',
    name: 'Sabedoria Profana',
    short: 'XP',
    rarity: 'common',
    category: 'vantagem',
    summary: '+25% XP de batalha',
    effect: { xpMult: 1.25 },
  },

  /* ---------------- RARE (8) ---------------- */
  coracao_de_trevas: {
    id: 'coracao_de_trevas',
    name: 'Coração de Trevas',
    short: 'HP++',
    rarity: 'rare',
    category: 'vantagem',
    summary: '+30% HP em todos os minions',
    flavor: 'Algo escuro pulsa onde havia carne.',
    effect: { minionHpMult: 1.3 },
  },
  furia_negra: {
    id: 'furia_negra',
    name: 'Fúria Negra',
    short: 'ATK+',
    rarity: 'rare',
    category: 'vantagem',
    summary: '+25% ATK em todos os minions',
    effect: { minionAtkMult: 1.25 },
  },
  sede_de_sangue: {
    id: 'sede_de_sangue',
    name: 'Sede de Sangue',
    short: 'VAMP',
    rarity: 'rare',
    category: 'vantagem',
    summary: 'Vampirismo: cura 20% do dano causado',
    flavor: 'O que mata, alimenta.',
    effect: { lifestealPct: 0.2 },
  },
  critico_sombrio: {
    id: 'critico_sombrio',
    name: 'Crítico Sombrio',
    short: 'CRIT',
    rarity: 'rare',
    category: 'vantagem',
    summary: '+12% chance de crítico',
    effect: { critChanceBonus: 0.12 },
  },
  couraca_negra: {
    id: 'couraca_negra',
    name: 'Couraça Negra',
    short: 'DEF',
    rarity: 'rare',
    category: 'vantagem',
    summary: '−15% dano recebido pelos minions',
    effect: { minionDmgTakenMult: 0.85 },
  },
  voz_do_submundo: {
    id: 'voz_do_submundo',
    name: 'Voz do Submundo',
    short: 'LORD',
    rarity: 'rare',
    category: 'vantagem',
    summary: 'Underlord: +30% HP, +15% ATK',
    flavor: 'A própria sombra responde quando ele chama.',
    effect: { overlordHpMult: 1.3, overlordAtkMult: 1.15 },
  },
  cofre_maldito: {
    id: 'cofre_maldito',
    name: 'Cofre Maldito',
    short: 'GOLD',
    rarity: 'rare',
    category: 'vantagem',
    summary: '+50% ouro, +10% XP',
    effect: { goldMult: 1.5, xpMult: 1.1 },
  },
  iniciativa_sombria: {
    id: 'iniciativa_sombria',
    name: 'Iniciativa Sombria',
    short: 'ALPHA',
    rarity: 'rare',
    category: 'vantagem',
    summary: 'Primeiro ataque de cada minion: +40% dano',
    flavor: 'Atacar primeiro é meio caminho da matança.',
    effect: { startingAttackBonus: 0.4 },
  },

  /* ---------------- EPIC (6) ---------------- */
  mao_da_ruina: {
    id: 'mao_da_ruina',
    name: 'Mão da Ruína',
    short: 'RUIN',
    rarity: 'epic',
    category: 'vantagem',
    summary: '+45% ATK em todos os minions',
    effect: { minionAtkMult: 1.45 },
  },
  egide_do_submundo: {
    id: 'egide_do_submundo',
    name: 'Égide do Submundo',
    short: 'EGD',
    rarity: 'epic',
    category: 'vantagem',
    summary: '−30% dano recebido pelos minions',
    effect: { minionDmgTakenMult: 0.7 },
  },
  recarga_profana: {
    id: 'recarga_profana',
    name: 'Recarga Profana',
    short: 'RCG',
    rarity: 'epic',
    category: 'vantagem',
    summary: 'Skills do Underlord começam −1 turno de cooldown',
    effect: { specialCdReduce: 1 },
  },
  sopro_vital: {
    id: 'sopro_vital',
    name: 'Sopro Vital',
    short: 'REGN',
    rarity: 'epic',
    category: 'vantagem',
    summary: 'Minions regeneram 10% HP no início de cada round',
    flavor: 'A carne refaz onde a vontade insiste.',
    effect: { hpRegenStartOfRound: 0.1 },
  },
  asas_negras: {
    id: 'asas_negras',
    name: 'Asas Negras',
    short: 'WING',
    rarity: 'epic',
    category: 'vantagem',
    summary: 'Voadores: +35% ATK adicional',
    effect: { flyingAtkBonus: 0.35 },
  },
  mira_diabolica: {
    id: 'mira_diabolica',
    name: 'Mira Diabólica',
    short: 'AIM',
    rarity: 'epic',
    category: 'vantagem',
    summary: 'Minions à distância: +30% ATK adicional',
    effect: { rangedAtkBonus: 0.3 },
  },

  /* ---------------- PACTOS (trade-offs, 4) ---------------- */
  pacto_glasscanon: {
    id: 'pacto_glasscanon',
    name: 'Pacto: Glass Cannon',
    short: 'GC',
    rarity: 'rare',
    category: 'pacto',
    summary: '+50% ATK, mas −25% HP em todos os minions',
    flavor: 'Quem fere primeiro não precisa de carne.',
    effect: { minionAtkMult: 1.5, minionHpMult: 0.75 },
  },
  pacto_berserker: {
    id: 'pacto_berserker',
    name: 'Pacto: Berserker',
    short: 'BSK',
    rarity: 'epic',
    category: 'pacto',
    summary: 'Vampirismo +35%, mas +25% dano recebido',
    flavor: 'Sangrar é o preço de devorar.',
    effect: { lifestealPct: 0.35, minionDmgTakenMult: 1.25 },
  },
  pacto_relicario: {
    id: 'pacto_relicario',
    name: 'Pacto: Relicário',
    short: 'REL',
    rarity: 'rare',
    category: 'pacto',
    summary: '+80% ouro, mas −15% XP',
    flavor: 'Ouro queima a alma do Underlord.',
    effect: { goldMult: 1.8, xpMult: 0.85 },
  },
  pacto_meteoro: {
    id: 'pacto_meteoro',
    name: 'Pacto: Meteoro',
    short: 'MET',
    rarity: 'epic',
    category: 'pacto',
    summary: 'Skills −2 turnos de cooldown, Underlord −20% HP',
    flavor: 'A magia consome quem a invoca.',
    effect: { specialCdReduce: 2, overlordHpMult: 0.8 },
  },

  /* v11 — ASCENSION boons */

  /* ---------------- VANTAGEM (common) ---------------- */
  ossatura_rancorosa: {
    id: 'ossatura_rancorosa',
    name: 'Ossatura Rancorosa',
    short: 'OSSO',
    rarity: 'common',
    category: 'vantagem',
    summary: '−12% dano recebido pelos minions',
    flavor: 'Ossos velhos guardam mágoas — e aguentam pancada.',
    effect: { minionDmgTakenMult: 0.88 },
  },
  flecha_viciada: {
    id: 'flecha_viciada',
    name: 'Flecha Viciada',
    short: 'FLX',
    rarity: 'common',
    category: 'vantagem',
    summary: 'Minions à distância: +15% ATK adicional',
    flavor: 'Mira torta, conta certa.',
    effect: { rangedAtkBonus: 0.15 },
  },

  /* ---------------- VANTAGEM (rare) ---------------- */
  garra_da_meia_noite: {
    id: 'garra_da_meia_noite',
    name: 'Garra da Meia-Noite',
    short: 'GRRA',
    rarity: 'rare',
    category: 'vantagem',
    summary: '+8% crítico e cura 10% do dano causado',
    flavor: 'O golpe que rasga também sacia.',
    effect: { critChanceBonus: 0.08, lifestealPct: 0.1 },
  },
  emboscada_alada: {
    id: 'emboscada_alada',
    name: 'Emboscada Alada',
    short: 'EMBO',
    rarity: 'rare',
    category: 'vantagem',
    summary: 'Voadores +20% ATK e +30% no primeiro ataque de todos',
    flavor: 'Cai do céu antes que olhem para cima.',
    effect: { flyingAtkBonus: 0.2, startingAttackBonus: 0.3 },
  },

  /* ---------------- VANTAGEM (epic) ---------------- */
  carniceiro_coroado: {
    id: 'carniceiro_coroado',
    name: 'Carniceiro Coroado',
    short: 'CARN',
    rarity: 'epic',
    category: 'vantagem',
    summary: '+30% ATK nos minions e Underlord +25% ATK',
    flavor: 'Reina quem corta mais fundo.',
    effect: { minionAtkMult: 1.3, overlordAtkMult: 1.25 },
  },
  baluarte_eterno: {
    id: 'baluarte_eterno',
    name: 'Baluarte Eterno',
    short: 'BALU',
    rarity: 'epic',
    category: 'vantagem',
    summary: '+35% HP nos minions e regeneram 8% HP por round',
    flavor: 'A muralha que respira não cai.',
    effect: { minionHpMult: 1.35, hpRegenStartOfRound: 0.08 },
  },
  dizimo_dos_mortos: {
    id: 'dizimo_dos_mortos',
    name: 'Dízimo dos Mortos',
    short: 'DZMO',
    rarity: 'epic',
    category: 'vantagem',
    summary: '+60% ouro e +40% XP de batalha',
    flavor: 'Todo defunto paga imposto ao Underlord.',
    effect: { goldMult: 1.6, xpMult: 1.4 },
  },

  /* ---------------- PACTOS (trade-offs) ---------------- */
  pacto_sanguessuga: {
    id: 'pacto_sanguessuga',
    name: 'Pacto: Sanguessuga',
    short: 'SGSG',
    rarity: 'rare',
    category: 'pacto',
    summary: 'Vampirismo +25%, mas −20% HP nos minions',
    flavor: 'Vive do alheio quem tem pouco próprio.',
    effect: { lifestealPct: 0.25, minionHpMult: 0.8 },
  },
  pacto_avareza: {
    id: 'pacto_avareza',
    name: 'Pacto: Avareza',
    short: 'AVAR',
    rarity: 'rare',
    category: 'pacto',
    summary: '+90% ouro, mas Underlord −15% HP',
    flavor: 'O cofre engorda enquanto o senhor definha.',
    effect: { goldMult: 1.9, overlordHpMult: 0.85 },
  },
  pacto_executor: {
    id: 'pacto_executor',
    name: 'Pacto: Executor',
    short: 'EXEC',
    rarity: 'epic',
    category: 'pacto',
    summary: '+20% crítico, mas +20% dano recebido nos minions',
    flavor: 'Decapitar exige expor o pescoço.',
    effect: { critChanceBonus: 0.2, minionDmgTakenMult: 1.2 },
  },
  pacto_martir: {
    id: 'pacto_martir',
    name: 'Pacto: Mártir',
    short: 'MRTR',
    rarity: 'epic',
    category: 'pacto',
    summary: '+55% ATK e +60% ouro, mas −30% HP nos minions',
    flavor: 'Glória e tesouro pesam mais que carne.',
    effect: { minionAtkMult: 1.55, goldMult: 1.6, minionHpMult: 0.7 },
  },

  /* ---------------- MÍTICOS (run-defining) ---------------- */
  legiao_eterna: {
    id: 'legiao_eterna',
    name: 'Legião Eterna',
    short: 'LEGN',
    rarity: 'mythic',
    category: 'vantagem',
    summary: '+40% HP nos minions e regeneram 20% HP por round',
    flavor: 'Mate-os hoje; amanhã marcham de novo.',
    effect: { minionHpMult: 1.4, hpRegenStartOfRound: 0.2 },
  },
  fome_do_abismo: {
    id: 'fome_do_abismo',
    name: 'Fome do Abismo',
    short: 'ABYS',
    rarity: 'mythic',
    category: 'vantagem',
    summary: 'Vampirismo +50% e +10% de crítico',
    flavor: 'O abismo nunca enche, mas sempre come.',
    effect: { lifestealPct: 0.5, critChanceBonus: 0.1 },
  },
  pacto_apocalipse: {
    id: 'pacto_apocalipse',
    name: 'Pacto: Apocalipse',
    short: 'APOC',
    rarity: 'mythic',
    category: 'pacto',
    summary: '+80% ATK nos minions, mas +30% dano recebido',
    flavor: 'O fim do mundo não pede licença para sangrar os seus.',
    effect: { minionAtkMult: 1.8, minionDmgTakenMult: 1.3 },
  },

  /* v12 — more boons */

  /* ---------------- VANTAGEM (common) ---------------- */
  caco_afiado: {
    id: 'caco_afiado',
    name: 'Caco Afiado',
    short: 'CACO',
    rarity: 'common',
    category: 'vantagem',
    summary: '+10% chance de crítico',
    flavor: 'Vidro quebrado também corta — e cobra barato.',
    effect: { critChanceBonus: 0.1 },
  },
  cuspe_de_morcego: {
    id: 'cuspe_de_morcego',
    name: 'Cuspe de Morcego',
    short: 'BAT',
    rarity: 'common',
    category: 'vantagem',
    summary: 'Voadores: +14% ATK adicional',
    flavor: 'O bicho voa, baba e ainda morde melhor.',
    effect: { flyingAtkBonus: 0.14 },
  },
  rancor_madrugador: {
    id: 'rancor_madrugador',
    name: 'Rancor Madrugador',
    short: 'CEDO',
    rarity: 'common',
    category: 'vantagem',
    summary: 'Primeiro ataque de cada minion: +25% dano',
    flavor: 'Quem acorda com ódio, almoça vingança.',
    effect: { startingAttackBonus: 0.25 },
  },

  /* ---------------- VANTAGEM (rare) ---------------- */
  bafo_curativo: {
    id: 'bafo_curativo',
    name: 'Bafo Curativo',
    short: 'BAFO',
    rarity: 'rare',
    category: 'vantagem',
    summary: '+22% HP nos minions e regeneram 6% por round',
    flavor: 'O hálito do Underlord cura — embora ninguém peça.',
    effect: { minionHpMult: 1.22, hpRegenStartOfRound: 0.06 },
  },
  pontaria_funesta: {
    id: 'pontaria_funesta',
    name: 'Pontaria Funesta',
    short: 'PONT',
    rarity: 'rare',
    category: 'vantagem',
    summary: 'Minions à distância: +25% ATK e +10% crítico geral',
    flavor: 'Flecha que parte com mau-olhado raramente erra.',
    effect: { rangedAtkBonus: 0.25, critChanceBonus: 0.1 },
  },
  decreto_tirano: {
    id: 'decreto_tirano',
    name: 'Decreto Tirano',
    short: 'TIRA',
    rarity: 'rare',
    category: 'vantagem',
    summary: 'Underlord: +25% HP e skills começam −1 turno de cooldown',
    flavor: 'O senhor manda; até o tempo obedece de má vontade.',
    effect: { overlordHpMult: 1.25, specialCdReduce: 1 },
  },

  /* ---------------- VANTAGEM (epic) ---------------- */
  esquadrao_celeste: {
    id: 'esquadrao_celeste',
    name: 'Esquadrão Celeste',
    short: 'CÉU',
    rarity: 'epic',
    category: 'vantagem',
    summary: 'Voadores +40% ATK e à distância +25% ATK',
    flavor: 'O céu inteiro vira artilharia rancorosa.',
    effect: { flyingAtkBonus: 0.4, rangedAtkBonus: 0.25 },
  },
  sentinela_imortal: {
    id: 'sentinela_imortal',
    name: 'Sentinela Imortal',
    short: 'SENT',
    rarity: 'epic',
    category: 'vantagem',
    summary: '−25% dano recebido e regeneram 12% HP por round',
    flavor: 'Difícil matar quem teima em remendar a própria carne.',
    effect: { minionDmgTakenMult: 0.75, hpRegenStartOfRound: 0.12 },
  },

  /* ---------------- PACTOS (trade-offs) ---------------- */
  pacto_kamikaze: {
    id: 'pacto_kamikaze',
    name: 'Pacto: Kamikaze',
    short: 'KMKZ',
    rarity: 'rare',
    category: 'pacto',
    summary: 'Primeiro ataque +90%, mas −20% HP nos minions',
    flavor: 'Toda a coragem gasta de uma vez, e que se dane o amanhã.',
    effect: { startingAttackBonus: 0.9, minionHpMult: 0.8 },
  },
  pacto_usurario: {
    id: 'pacto_usurario',
    name: 'Pacto: Usurário',
    short: 'USUR',
    rarity: 'rare',
    category: 'pacto',
    summary: '+70% XP, mas −20% ouro de batalha',
    flavor: 'Conhecimento engorda a mente e esvazia o cofre.',
    effect: { xpMult: 1.7, goldMult: 0.8 },
  },
  pacto_temerario: {
    id: 'pacto_temerario',
    name: 'Pacto: Temerário',
    short: 'TEMR',
    rarity: 'epic',
    category: 'pacto',
    summary: 'Skills −2 turnos e +15% crítico, mas −25% HP nos minions',
    flavor: 'Magia rápida e lâminas afiadas custam carne tremendada.',
    effect: { specialCdReduce: 2, critChanceBonus: 0.15, minionHpMult: 0.75 },
  },

  /* ---------------- MÍTICOS (run-defining) ---------------- */
  trono_de_caveiras: {
    id: 'trono_de_caveiras',
    name: 'Trono de Caveiras',
    short: 'TRON',
    rarity: 'mythic',
    category: 'vantagem',
    summary: 'Underlord +50% HP e +40% ATK, skills começam −1 turno',
    flavor: 'Sentado sobre os mortos, o senhor nunca se levanta cansado.',
    effect: { overlordHpMult: 1.5, overlordAtkMult: 1.4, specialCdReduce: 1 },
  },
  pacto_ragnarok: {
    id: 'pacto_ragnarok',
    name: 'Pacto: Ragnarök',
    short: 'RGNK',
    rarity: 'mythic',
    category: 'pacto',
    summary: '+60% ATK, +25% crítico e vampirismo +30%, mas −35% HP nos minions',
    flavor: 'O crepúsculo dos deuses não tem volta — só estrago e glória.',
    effect: { minionAtkMult: 1.6, critChanceBonus: 0.25, lifestealPct: 0.3, minionHpMult: 0.65 },
  },
}

/** All boon ids in catalog order — useful for seeding. */
export const ALL_BOON_IDS: string[] = Object.keys(BOONS)

/** Roll-weight by rarity (higher = appears more often).
 *  Tuned so commons dominate early but epics show up roughly 1 in 6. */
const RARITY_WEIGHT: Record<BoonRarity, number> = {
  common: 5,
  rare: 3,
  epic: 1.4,
  mythic: 0.4,
}

/** Color tokens — kept here so UI doesn't have to know rarity logic. */
export const RARITY_LABEL: Record<BoonRarity, string> = {
  common: 'COMUM',
  rare: 'RARO',
  epic: 'ÉPICO',
  mythic: 'MÍTICO',
}
export const RARITY_TONE: Record<BoonRarity, string> = {
  common: 'border-muted-foreground/60 bg-muted/30 text-foreground',
  rare: 'border-info/70 bg-info/15 text-info',
  epic: 'border-accent/70 bg-accent/15 text-accent',
  mythic: 'border-gold bg-gold/15 text-gold',
}

/** Roll N distinct boons the player doesn't own yet. Falls back to dupes
 *  only when the entire owned set spans the catalog. */
export function rollBoonChoices(
  owned: string[],
  count: number = 3,
  rng: () => number = Math.random,
): string[] {
  const ownedSet = new Set(owned)
  const pool = ALL_BOON_IDS.filter((id) => !ownedSet.has(id))
  const source = pool.length >= count ? pool : ALL_BOON_IDS
  const picks: string[] = []
  const seen = new Set<string>()
  // Weighted reservoir-style sampling.
  const weights = source.map((id) => RARITY_WEIGHT[BOONS[id]!.rarity])
  for (let i = 0; i < count && picks.length < source.length; i++) {
    let total = 0
    for (let k = 0; k < source.length; k++) {
      if (seen.has(source[k]!)) continue
      total += weights[k]!
    }
    if (total <= 0) break
    let roll = rng() * total
    for (let k = 0; k < source.length; k++) {
      const id = source[k]!
      if (seen.has(id)) continue
      roll -= weights[k]!
      if (roll <= 0) {
        picks.push(id)
        seen.add(id)
        break
      }
    }
  }
  return picks
}

/** Aggregate the owned-id list into a flat effect bag. Multipliers
 *  multiply, additive bonuses sum. Unknown ids are ignored gracefully. */
export function aggregateBoons(owned: string[]): Required<BoonEffect> {
  const bag: Required<BoonEffect> = {
    minionHpMult: 1,
    minionAtkMult: 1,
    minionDmgTakenMult: 1,
    rangedAtkBonus: 0,
    flyingAtkBonus: 0,
    overlordHpMult: 1,
    overlordAtkMult: 1,
    goldMult: 1,
    xpMult: 1,
    critChanceBonus: 0,
    lifestealPct: 0,
    hpRegenStartOfRound: 0,
    startingAttackBonus: 0,
    specialCdReduce: 0,
  }
  for (const id of owned) {
    const b = BOONS[id]
    if (!b) continue
    const e = b.effect
    if (e.minionHpMult !== undefined) bag.minionHpMult *= e.minionHpMult
    if (e.minionAtkMult !== undefined) bag.minionAtkMult *= e.minionAtkMult
    if (e.minionDmgTakenMult !== undefined) bag.minionDmgTakenMult *= e.minionDmgTakenMult
    if (e.rangedAtkBonus !== undefined) bag.rangedAtkBonus += e.rangedAtkBonus
    if (e.flyingAtkBonus !== undefined) bag.flyingAtkBonus += e.flyingAtkBonus
    if (e.overlordHpMult !== undefined) bag.overlordHpMult *= e.overlordHpMult
    if (e.overlordAtkMult !== undefined) bag.overlordAtkMult *= e.overlordAtkMult
    if (e.goldMult !== undefined) bag.goldMult *= e.goldMult
    if (e.xpMult !== undefined) bag.xpMult *= e.xpMult
    if (e.critChanceBonus !== undefined) bag.critChanceBonus += e.critChanceBonus
    if (e.lifestealPct !== undefined) bag.lifestealPct += e.lifestealPct
    if (e.hpRegenStartOfRound !== undefined) bag.hpRegenStartOfRound += e.hpRegenStartOfRound
    if (e.startingAttackBonus !== undefined) bag.startingAttackBonus += e.startingAttackBonus
    if (e.specialCdReduce !== undefined) bag.specialCdReduce += e.specialCdReduce
  }
  return bag
}
