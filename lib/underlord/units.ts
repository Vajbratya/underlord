/**
 * Minion archetypes and starter roster generation.
 */

import type { MinionArchetype, Unit, UnitTemplate, Axial } from './types'
import { BARRIER_HP } from './specials'

/* ----------------------------------------------------------------------- */
/*  All numbers are intentionally LARGE — Underlord vs. Overlord is a      */
/*  numbers game. HP in the hundreds, ATK in the tens, damage popups       */
/*  hit triple digits. Original five tiers stay relatively balanced; new   */
/*  archetypes unlock at later Underlord levels and bring stronger maths.  */
/* ----------------------------------------------------------------------- */

export const MINION_TEMPLATES: Record<MinionArchetype, UnitTemplate> = {
  brown: {
    archetype: 'brown',
    name: 'BROWN',
    glyph: '◤',
    role: 'Brawler de linha de frente',
    hp: 140,
    move: 3,
    atk: 35,
    range: 1,
    spd: 4,
    tone: 'foreground',
    flavor: 'Bate, apanha, ri. Repete. Cheira a couro queimado.',
    attackKind: 'cleave',
    abilityTag: 'CLIVA',
    abilityText:
      'Ataque atinge o alvo + um inimigo adjacente (50% dano colateral). Atrai a IA.',
    unlockTier: 0,
    hasActiveSpecial: true,
  },
  red: {
    archetype: 'red',
    name: 'RED',
    glyph: '◆',
    role: 'Pirômano de área',
    hp: 90,
    move: 3,
    atk: 45,
    range: 3,
    spd: 6,
    tone: 'destructive',
    flavor: 'Imune a fogo. Não imune a tropeçar no próprio fogo.',
    attackKind: 'splash',
    abilityTag: 'AOE',
    abilityText:
      'Explosão atinge o alvo + todos os inimigos a 1 hex dele (50% colateral).',
    unlockTier: 0,
    hasActiveSpecial: true,
  },
  green: {
    archetype: 'green',
    name: 'GREEN',
    glyph: '◇',
    role: 'Assassino executor',
    hp: 70,
    move: 5,
    atk: 55,
    range: 1,
    spd: 9,
    tone: 'accent',
    flavor: 'Aparece pelas costas. Se desculpa enquanto enfia a faca.',
    attackKind: 'execute',
    abilityTag: 'EXECUTA',
    abilityText:
      'Causa +50% dano contra alvos com HP abaixo de 40%. Mata feridos rápido.',
    unlockTier: 0,
    hasActiveSpecial: true,
  },
  blue: {
    archetype: 'blue',
    name: 'BLUE',
    glyph: '◈',
    role: 'Xamã curandeiro',
    hp: 100,
    move: 4,
    atk: 25,
    range: 2,
    spd: 5,
    tone: 'primary',
    flavor: 'Cura, ressuscita, dá conselho ruim. Tudo na mesma vibe.',
    attackKind: 'heal',
    abilityTag: 'CURA',
    abilityText:
      'Em vez de atacar, toque um aliado em alcance pra restaurar 30% do HP máximo.',
    unlockTier: 0,
    hasActiveSpecial: true,
  },
  grey: {
    archetype: 'grey',
    name: 'GREY',
    glyph: '▣',
    role: 'Cerco perfurante',
    hp: 110,
    move: 2,
    atk: 40,
    range: 4,
    spd: 3,
    tone: 'gold',
    flavor: 'Lê manual. Constrói catapulta. Detesta pressa.',
    attackKind: 'pierce',
    abilityTag: 'PERFURA',
    abilityText:
      'Tiro atravessa: atinge o alvo + o hex atrás dele (50% no segundo).',
    unlockTier: 0,
    hasActiveSpecial: true,
  },

  /* ------------------ Progression tier ------------------ */

  bone: {
    archetype: 'bone',
    name: 'BONE',
    glyph: '✖',
    role: 'Necromante de longa distância',
    hp: 80,
    move: 3,
    atk: 50,
    range: 5,
    spd: 6,
    tone: 'primary',
    flavor: 'Faz a maldição rimar. Os ossos dos heróis aplaudem em ritmo.',
    attackKind: 'curse',
    abilityTag: 'MALDIÇÃO',
    abilityText:
      'Tiro de osso a 5 hex. O alvo recebe +50% dano de tudo durante o próximo round.',
    unlockTier: 4,
    flying: true,
    hasActiveSpecial: false,
  },
  harpy: {
    archetype: 'harpy',
    name: 'HARPY',
    glyph: '𓅂',
    role: 'Arqueira voadora',
    hp: 95,
    move: 5,
    atk: 50,
    range: 4,
    spd: 8,
    tone: 'accent',
    flavor: 'Atravessa pedras. Não atravessa o ego dos heróis sem cortar primeiro.',
    attackKind: 'pierce',
    abilityTag: 'VOO',
    abilityText:
      'Voa por cima de obstáculos. Atira em alc 4 e o tiro perfura para o hex seguinte.',
    unlockTier: 6,
    flying: true,
    hasActiveSpecial: false,
  },
  gorger: {
    archetype: 'gorger',
    name: 'GORGER',
    glyph: '◉',
    role: 'Devorador com sede de sangue',
    hp: 200,
    move: 3,
    atk: 60,
    range: 1,
    spd: 5,
    tone: 'destructive',
    flavor: 'Come o que mata. Mata o que come. O ciclo é simples.',
    attackKind: 'siphon',
    abilityTag: 'SIFÃO',
    abilityText:
      'Mordida absorvente. Cura no próprio HP 30% do dano causado. Fica em pé pra sempre.',
    unlockTier: 8,
    hasActiveSpecial: false,
  },
  wraith: {
    archetype: 'wraith',
    name: 'WRAITH',
    glyph: '☂',
    role: 'Espectro flanqueador',
    hp: 110,
    move: 6,
    atk: 70,
    range: 1,
    spd: 11,
    tone: 'primary',
    flavor: 'Atravessa o herói. Volta. Atravessa de novo. Cobra entrada.',
    attackKind: 'execute',
    abilityTag: 'FANTASMA',
    abilityText:
      'Voa por cima de obstáculos. +50% dano em alvos abaixo de 40% HP. Move 6 hex.',
    unlockTier: 10,
    flying: true,
    hasActiveSpecial: false,
  },
  lich: {
    archetype: 'lich',
    name: 'LICH',
    glyph: '☥',
    role: 'Senhor da magia AOE',
    hp: 130,
    move: 2,
    atk: 75,
    range: 6,
    spd: 4,
    tone: 'gold',
    flavor: 'Tem doutorado em sofrimento. A tese ficou em chamas.',
    attackKind: 'volley',
    abilityTag: 'TEMPESTADE',
    abilityText:
      'Tempestade arcana a 6 hex. Atinge o alvo + todo inimigo em 2 hex dele (50% colateral).',
    unlockTier: 13,
    hasActiveSpecial: false,
  },

  /* ----------- v7 expansion archetypes ----------- */
  /* Unlock cadence is interleaved with the older progression tier so the
     player gets a new toy every 2-3 levels instead of waiting until 13. */

  behemoth: {
    archetype: 'behemoth',
    name: 'BEHEMOTH',
    glyph: '⛰',
    role: 'Tanque siphon implacável',
    hp: 260,
    move: 2,
    atk: 55,
    range: 1,
    spd: 3,
    tone: 'foreground',
    flavor:
      'Pesa toneladas. Anda devagar. Cada passo deixa pegada permanente no chão.',
    attackKind: 'siphon',
    abilityTag: 'COLOSSO',
    abilityText:
      'Cada golpe corpo-a-corpo cura 30% do dano. Mais HP que dois Gorgers somados.',
    unlockTier: 5,
    hasActiveSpecial: false,
  },

  spore: {
    archetype: 'spore',
    name: 'SPORE',
    glyph: '✺',
    role: 'Praga a distância',
    hp: 70,
    move: 3,
    atk: 35,
    range: 4,
    spd: 7,
    tone: 'accent',
    flavor:
      'Esporo flutuante. Frágil, mas o bolor acompanha quem encosta. Espirra como reza.',
    attackKind: 'volley',
    abilityTag: 'NUVEM',
    abilityText:
      'Solta nuvem de esporo a 4 hex. Atinge o alvo + todo inimigo em 2 hex (50% colateral).',
    unlockTier: 7,
    flying: true,
    hasActiveSpecial: false,
  },

  oracle: {
    archetype: 'oracle',
    name: 'ORACLE',
    glyph: '◉',
    role: 'Profeta da vulnerabilidade',
    hp: 90,
    move: 3,
    atk: 40,
    range: 5,
    spd: 6,
    tone: 'gold',
    flavor:
      'Vê o futuro. Avisa quem vai morrer apontando — e a profecia se cumpre.',
    attackKind: 'curse',
    abilityTag: 'PROFECIA',
    abilityText:
      'Maldição a 5 hex. Alvo recebe +50% de dano de tudo durante o próximo round.',
    unlockTier: 9,
    hasActiveSpecial: false,
  },

  ravager: {
    archetype: 'ravager',
    name: 'RAVAGER',
    glyph: '⚔',
    role: 'Cleave em pé de guerra',
    hp: 160,
    move: 4,
    atk: 65,
    range: 1,
    spd: 7,
    tone: 'destructive',
    flavor:
      'Gira o machado, gira o pescoço, gira o estômago. Tudo pra fora ao mesmo tempo.',
    attackKind: 'cleave',
    abilityTag: 'TURBILHÃO',
    abilityText:
      'Ataque atinge o alvo + todo inimigo adjacente (50% colateral). Brown numa segunda-feira ruim.',
    unlockTier: 11,
    hasActiveSpecial: false,
  },

  wyrmling: {
    archetype: 'wyrmling',
    name: 'WYRMLING',
    glyph: '𓆑',
    role: 'Dragãozinho cuspe-fogo',
    hp: 120,
    move: 5,
    atk: 70,
    range: 3,
    spd: 8,
    tone: 'destructive',
    flavor:
      'Filhote de wyrm. Cospe fogo do tamanho do ego. Já é mais perigoso que o pai.',
    attackKind: 'splash',
    abilityTag: 'CUSPE',
    abilityText:
      'Cuspe a 3 hex. Atinge o alvo + todos os inimigos em 1 hex dele (50% colateral). Voa.',
    unlockTier: 12,
    flying: true,
    hasActiveSpecial: false,
  },

  crowlord: {
    archetype: 'crowlord',
    name: 'CROWLORD',
    glyph: '𓅓',
    role: 'Corvo-mestre debuffador',
    hp: 85,
    move: 6,
    atk: 35,
    range: 4,
    spd: 10,
    tone: 'primary',
    flavor:
      'Bate asa no exato segundo da pancada. Os heróis chamam de "azar"; o exército chama de "TÁTICA".',
    attackKind: 'curse',
    abilityTag: 'PRESSÁGIO',
    abilityText:
      'Bicada-maldição a 4 hex. +50% dano recebido pelo alvo no próximo round. Voa, esquiva fácil.',
    unlockTier: 14,
    flying: true,
    hasActiveSpecial: false,
  },

  /* ----------- v8 expansion archetypes ----------- */
  /* These eight fill the gaps in the bestiary so the Underlord roster
     reaches 24 distinct units. Each leans on an existing AttackKind so
     no engine work is needed; differentiation is stat curve + flavor +
     voice (sfx-archetype.ts) + flash. */

  golem: {
    archetype: 'golem',
    name: 'GOLEM',
    glyph: '◰',
    role: 'Tanque siege que perfura',
    hp: 220,
    move: 2,
    atk: 50,
    range: 2,
    spd: 2,
    tone: 'foreground',
    flavor:
      'Pedra animada com runa no peito. Anda como geleira. Quando bate, atravessa.',
    attackKind: 'pierce',
    abilityTag: 'IMPACTO',
    abilityText:
      'Soco perfurante a 2 hex. Atinge alvo + tile atrás dele (50%). HP descomunal.',
    unlockTier: 6,
    hasActiveSpecial: false,
  },

  gargoyle: {
    archetype: 'gargoyle',
    name: 'GARGOYLE',
    glyph: '☷',
    role: 'Voador hostigador',
    hp: 95,
    move: 6,
    atk: 45,
    range: 1,
    spd: 9,
    tone: 'foreground',
    flavor:
      'Acordou com fome depois de seis séculos pendurado numa fachada. Tudo é brunch agora.',
    attackKind: 'basic',
    abilityTag: 'ASA',
    abilityText:
      'Voador rápido. Move 6, ignora terreno. Garra simples mas chega aonde quer e quando quer.',
    unlockTier: 8,
    flying: true,
    hasActiveSpecial: false,
  },

  leech: {
    archetype: 'leech',
    name: 'LEECH',
    glyph: '∽',
    role: 'Vampiro de bolso',
    hp: 80,
    move: 4,
    atk: 38,
    range: 1,
    spd: 8,
    tone: 'destructive',
    flavor:
      'Pequena, ágil, e cura no impacto. Mata em três turnos sem perder HP — e ainda agradece a nutrição.',
    attackKind: 'siphon',
    abilityTag: 'SUGA',
    abilityText:
      'Cada acerto cura 30% do dano. Não bate forte — só bate sempre.',
    unlockTier: 7,
    hasActiveSpecial: false,
  },

  succubus: {
    archetype: 'succubus',
    name: 'SUCCUBUS',
    glyph: '⚉',
    role: 'Maldição flertadora',
    hp: 75,
    move: 4,
    atk: 32,
    range: 4,
    spd: 9,
    tone: 'primary',
    flavor:
      'Sussurra "te juro que te amo" enquanto te transforma em alvo +50%. O herói nem percebeu.',
    attackKind: 'curse',
    abilityTag: 'BEIJO',
    abilityText:
      'Maldição a 4 hex. Alvo recebe +50% de dano por 1 round. Adora o herói romântico.',
    unlockTier: 10,
    flying: true,
    hasActiveSpecial: false,
  },

  pyrelich: {
    archetype: 'pyrelich',
    name: 'PYRELICH',
    glyph: '✸',
    role: 'Necro-piromante AOE',
    hp: 110,
    move: 3,
    atk: 60,
    range: 5,
    spd: 6,
    tone: 'destructive',
    flavor:
      'Lich que cansou de magia gélida e descobriu napalm. Anda com manto chamuscado e cheiro de fim do mundo.',
    attackKind: 'splash',
    abilityTag: 'IGNIÇÃO',
    abilityText:
      'Bola de fogo a 5 hex. Alvo + adjacentes em chamas (50% colateral). Range alto, HP frágil.',
    unlockTier: 11,
    hasActiveSpecial: false,
  },

  tidesinger: {
    archetype: 'tidesinger',
    name: 'TIDESINGER',
    glyph: '∿',
    role: 'Suporte de cura ranged',
    hp: 100,
    move: 3,
    atk: 25,
    range: 4,
    spd: 7,
    tone: 'accent',
    flavor:
      'Canta em uma língua afogada. Os aliados regeneram. Os inimigos têm pesadelo com aquele refrão.',
    attackKind: 'heal',
    abilityTag: 'BÁLSAMO',
    abilityText:
      'Cura 30% do hpMax de um aliado em até 4 hex. Atira água-doce nos vivos.',
    unlockTier: 9,
    hasActiveSpecial: false,
  },

  ratking: {
    archetype: 'ratking',
    name: 'RATKING',
    glyph: '⚒',
    role: 'Cleave de enxame, frágil',
    hp: 95,
    move: 5,
    atk: 50,
    range: 1,
    spd: 9,
    tone: 'destructive',
    flavor:
      'Treze ratos amarrados pela cauda governando como um. Rouba moedas até quando você está vivo.',
    attackKind: 'cleave',
    abilityTag: 'MARÉ',
    abilityText:
      'Cleave melee — atinge alvo + adjacente (50%). Move 5. Frágil mas rápido pra caralho.',
    unlockTier: 8,
    hasActiveSpecial: false,
  },

  thornbeast: {
    archetype: 'thornbeast',
    name: 'THORNBEAST',
    glyph: '✦',
    role: 'Predador finalizador',
    hp: 130,
    move: 4,
    atk: 70,
    range: 1,
    spd: 7,
    tone: 'foreground',
    flavor:
      'Espera o herói cair em silêncio. Quando ataca, é coup-de-grâce — sempre. Cheiro de carne ferida é apetite.',
    attackKind: 'execute',
    abilityTag: 'CAÇA',
    abilityText:
      'Execute brutal: +50% dano se alvo está abaixo de 40% HP. Faz wraith parecer brando.',
    unlockTier: 10,
    hasActiveSpecial: false,
  },

  /* ------------------------------------------------------------------ */
  /* v9 — four niche-fillers. They reuse existing AttackKinds (engine    */
  /* requires no new branches) but their stat profiles are deliberately  */
  /* extreme so they read as distinct roles on the board:                */
  /*   mortar  → only sniper that out-ranges grey/lich.                  */
  /*   bulwark → wall with HP nobody else has — eats turns.              */
  /*   swarm   → cheapest body in the army, designed to die.             */
  /*   chimera → reach-2 melee, fills the gap between range-1 brawlers   */
  /*             and range-3 ranged DPS.                                 */
  /* ------------------------------------------------------------------ */

  mortar: {
    archetype: 'mortar',
    name: 'MORTAR',
    glyph: '◉',
    role: 'Artilharia de longo alcance',
    hp: 75,
    move: 2,
    atk: 40,
    range: 4,
    spd: 4,
    tone: 'destructive',
    flavor:
      'Mira de cego, alma de algoritmo. Lança espirais de gosma incandescente que pousam onde precisava.',
    attackKind: 'splash',
    abilityTag: 'TIRO LONGO',
    abilityText:
      'Splash em alcance 4 — atinge alvo + adjacentes 50%. Move 2: posicione cedo, ele não corre.',
    unlockTier: 11,
    hasActiveSpecial: false,
  },

  bulwark: {
    archetype: 'bulwark',
    name: 'BULWARK',
    glyph: '▣',
    role: 'Muralha de carne',
    hp: 280,
    move: 2,
    atk: 18,
    range: 1,
    spd: 3,
    tone: 'foreground',
    flavor:
      'Não anda. Avança. Cada passo é um veredito da geologia local. Heróis quebram canela antes de quebrar a guarda.',
    attackKind: 'cleave',
    abilityTag: 'MURO',
    abilityText:
      'HP absurdo (280), ataque fraco mas em CLIVA. Tanca uma rodada inteira pra dar tempo aos outros.',
    unlockTier: 12,
    hasActiveSpecial: false,
  },

  swarm: {
    archetype: 'swarm',
    name: 'SWARM',
    glyph: '∴',
    role: 'Vespa-suicida',
    hp: 35,
    move: 6,
    atk: 22,
    range: 1,
    spd: 11,
    tone: 'accent',
    flavor:
      'Um vão de asas curtas, um zumbido cíclico, um ferrão único. Nasce pra morrer enquanto entrega o recado.',
    attackKind: 'basic',
    abilityTag: 'ENXAME',
    abilityText:
      'Frágil mas o mais rápido do exército. Move 6, SPD 11. Use pra fechar distância antes que o herói atire.',
    unlockTier: 9,
    hasActiveSpecial: false,
  },

  chimera: {
    archetype: 'chimera',
    name: 'CHIMERA',
    glyph: '☷',
    role: 'Predador de meia-distância',
    hp: 115,
    move: 4,
    atk: 48,
    range: 2,
    spd: 7,
    tone: 'gold',
    flavor:
      'Três cabeças, três fomes, um pescoço. Disputa a presa consigo mesma — vence quem chega primeiro.',
    attackKind: 'pierce',
    abilityTag: 'PERFURA',
    abilityText:
      'Range 2 com PIERCE — alvo + tile atrás 50%. Preenche o vão entre brutamontes corpo-a-corpo e ranged puro.',
    unlockTier: 13,
    hasActiveSpecial: false,
  },

  /* ------------------------------------------------------------------ */
  /* v10 — final three to complete the 27-minion roster                  */
  /* ------------------------------------------------------------------ */

  shade: {
    archetype: 'shade',
    name: 'SHADE',
    glyph: '◌',
    role: 'Assassino espectral',
    hp: 55,
    move: 5,
    atk: 62,
    range: 1,
    spd: 10,
    tone: 'accent',
    flavor:
      'Onde há sombra há Shade. Se o herói piscar, já era — a lâmina chega antes da retina.',
    attackKind: 'execute',
    abilityTag: 'SOMBRA',
    abilityText:
      'Execute em glass cannon: +50% em alvos <40% HP. Frágil, mas mata antes de morrer.',
    unlockTier: 14,
    hasActiveSpecial: false,
  },

  colossus: {
    archetype: 'colossus',
    name: 'COLOSSUS',
    glyph: '◼',
    role: 'Titã imóvel',
    hp: 320,
    move: 1,
    atk: 25,
    range: 1,
    spd: 2,
    tone: 'foreground',
    flavor:
      'Move um passo por rodada e pesa como uma catedral. Os heróis vão ao redor — se conseguirem.',
    attackKind: 'basic',
    abilityTag: 'TITÃ',
    abilityText:
      'HP 320, move 1, SPD 2. Imóvel: bloqueia corredores enquanto o resto do exército flanqueia.',
    unlockTier: 15,
    hasActiveSpecial: false,
  },

  banshee: {
    archetype: 'banshee',
    name: 'BANSHEE',
    glyph: '☽',
    role: 'Lamentadora de guerra',
    hp: 70,
    move: 4,
    atk: 30,
    range: 3,
    spd: 8,
    tone: 'destructive',
    flavor:
      'Seu grito não mata — mas faz o herói hesitar. E hesitação é tudo que os outros precisam.',
    attackKind: 'curse',
    abilityTag: 'LAMENTO',
    abilityText:
      'Ranged curse com range 3: reduz ATK do alvo em 25% por 2 turnos. Setup pra finalizadores.',
    unlockTier: 16,
    hasActiveSpecial: false,
  },
}

let unitIdCounter = 0
export function nextUnitId(): string {
  unitIdCounter += 1
  return `u${unitIdCounter.toString(36)}-${Date.now().toString(36).slice(-3)}`
}

/** Build a fresh unit from template at a given position. */
export function makeUnit(
  archetype: MinionArchetype,
  pos: Axial,
  overrides: Partial<Unit> = {},
): Unit {
  const t = MINION_TEMPLATES[archetype]
  return {
    id: nextUnitId(),
    templateId: archetype,
    name: t.name,
    glyph: t.glyph,
    faction: 'minion',
    pos,
    hp: t.hp,
    hpMax: t.hp,
    atk: t.atk,
    move: t.move,
    range: t.range,
    spd: t.spd,
    tone: t.tone,
    acted: false,
    moved: false,
    dead: false,
    attackKind: t.attackKind,
    flying: t.flying,
    // Only the original five archetypes have an active special. Newer
    // archetypes start "spent" so the UI never offers a special button.
    specialCd: t.hasActiveSpecial ? 0 : 999,
    specialSpent: !t.hasActiveSpecial,
    ...overrides,
  }
}

/** Build a Muralha barrier unit (no actions, just blocks a hex). */
export function makeBarrier(pos: Axial, ownerName: string = 'MURALHA'): Unit {
  return {
    id: nextUnitId(),
    templateId: 'grey',
    name: ownerName,
    glyph: '▓',
    faction: 'minion',
    pos,
    hp: BARRIER_HP,
    hpMax: BARRIER_HP,
    atk: 0,
    move: 0,
    range: 0,
    spd: 0,
    tone: 'foreground',
    acted: true,
    moved: true,
    dead: false,
    attackKind: 'basic',
    specialCd: 999,
    specialSpent: true,
    isBarrier: true,
  }
}

/**
 * Build the Underlord avatar — the player's commander on the field.
 *
 * Faction is `'minion'` so it counts as part of your army; the `isOverlord`
 * flag makes its death an instant battle loss (see `computeDone` in battle.ts).
 * Stats scale with the Underlord's meta level so a leveled-up player feels
 * stronger and a fresh save still has a tangible board threat.
 */
export function makeOverlord(
  level: number,
  pos: Axial,
  name: string = 'UNDERLORD',
): Unit {
  const lv = Math.max(1, level)
  const hp = 200 + lv * 30
  const atk = 50 + lv * 5
  return {
    id: nextUnitId(),
    templateId: 'brown', // visual fallback — render path checks isOverlord first
    name: name.toUpperCase(),
    glyph: '✦',
    faction: 'minion',
    pos,
    hp,
    hpMax: hp,
    atk,
    move: 3,
    range: 2,
    spd: 7,
    tone: 'gold',
    acted: false,
    moved: false,
    dead: false,
    attackKind: 'basic',
    specialCd: 999,
    specialSpent: true,
    isOverlord: true,
  }
}

/**
 * Build an enemy minion that marches in with a hero. Same archetype template
 * as the player's roster (so they share rules) but `faction: 'hero'` puts
 * them on the enemy team. Slightly weaker than the hero so the hero remains
 * the priority target — you still want to kill the named villain first.
 */
export function makeHeroMinion(
  archetype: MinionArchetype,
  pos: Axial,
  stage: number,
  ownerName: string,
): Unit {
  const t = MINION_TEMPLATES[archetype]
  // Scale with stage but capped beneath a stage-tier hero.
  const tier = Math.max(1, Math.min(14, stage))
  const hpMul = 0.85 + tier * 0.04
  const atkMul = 0.85 + tier * 0.025
  const hp = Math.round(t.hp * hpMul)
  const atk = Math.round(t.atk * atkMul)
  return {
    id: nextUnitId(),
    templateId: archetype,
    name: `${ownerName} ${archMinionTitle(archetype)}`,
    glyph: t.glyph,
    faction: 'hero',
    pos,
    hp,
    hpMax: hp,
    atk,
    move: t.move,
    range: t.range,
    spd: t.spd,
    tone: 'destructive', // red ring matches hero faction visual language
    acted: false,
    moved: false,
    dead: false,
    attackKind: t.attackKind,
    flying: t.flying,
    specialCd: 999,
    specialSpent: true,
  }
}

/** Themed nickname suffix for entourage minions, used on tooltips/HUD. */
function archMinionTitle(arch: MinionArchetype): string {
  switch (arch) {
    case 'brown':
      return 'CAPANGA'
    case 'red':
      return 'PIRO'
    case 'green':
      return 'STALKER'
    case 'blue':
      return 'CLÉRIGO'
    case 'grey':
      return 'GUARDA'
    case 'bone':
      return 'AGOUREIRO'
    case 'harpy':
      return 'CAÇADORA'
    case 'gorger':
      return 'DEVORADOR'
    case 'wraith':
      return 'ESPECTRO'
    case 'lich':
      return 'ARCANISTA'
    case 'behemoth':
      return 'COLOSSO'
    case 'spore':
      return 'PRAGA'
    case 'oracle':
      return 'PROFETA'
    case 'ravager':
      return 'CARRASCO'
    case 'wyrmling':
      return 'WYRM'
    case 'crowlord':
      return 'CORVO'
    case 'golem':
      return 'GOLEM'
    case 'gargoyle':
      return 'CAÇADOR'
    case 'leech':
      return 'VAMPIRO'
    case 'succubus':
      return 'SEDUTORA'
    case 'pyrelich':
      return 'PIRO'
    case 'tidesinger':
      return 'MARÉ'
    case 'ratking':
      return 'PRAGA'
    case 'thornbeast':
      return 'CAÇA'
    case 'mortar':
      return 'CANHÃO'
    case 'bulwark':
      return 'MURO'
    case 'swarm':
      return 'VESPA'
    case 'chimera':
      return 'TRÍADE'
    case 'shade':
      return 'SOMBRA'
    case 'colossus':
      return 'TITÃ'
    case 'banshee':
      return 'LAMENTO'
  }
}

/** All archetypes the player has unlocked through level milestones, in
 * order from earliest to latest. Used by the Recrutamento drawer. */
export function unlockedArchetypeList(unlocked: string[]): MinionArchetype[] {
  const all = Object.values(MINION_TEMPLATES) as UnitTemplate[]
  return all
    .filter((t) => t.unlockTier === 0 || unlocked.includes(t.archetype))
    .sort((a, b) => a.unlockTier - b.unlockTier)
    .map((t) => t.archetype)
}

/** Archetypes that the given Underlord level WOULD unlock (used at level-up
 * to figure out what to grant). Returns archetype ids whose `unlockTier` is
 * at most `level` and that aren't in `alreadyUnlocked`. */
export function newlyUnlockedAt(
  level: number,
  alreadyUnlocked: string[],
): MinionArchetype[] {
  const have = new Set(alreadyUnlocked)
  return (Object.values(MINION_TEMPLATES) as UnitTemplate[])
    .filter(
      (t) =>
        t.unlockTier > 0 &&
        t.unlockTier <= level &&
        !have.has(t.archetype),
    )
    .sort((a, b) => a.unlockTier - b.unlockTier)
    .map((t) => t.archetype)
}

/** Themed first names per archetype, used when auto-recruiting from a
 * level-up unlock. Doesn't have to be unique — just better than "BONE 1". */
const RECRUIT_NAMES: Record<MinionArchetype, string[]> = {
  brown: ['GROK', 'BLURG', 'KARN', 'ROFF'],
  red: ['CINDA', 'EMBER', 'PYRA', 'KILN'],
  green: ['SLIK', 'VEX', 'ZIRR', 'NYX'],
  blue: ['MURR', 'TIDE', 'WELL', 'BREN'],
  grey: ['KORM', 'STAVE', 'BAUL', 'PIKE'],
  bone: ['MORTH', 'OSSEK', 'KARG', 'VEHM'],
  harpy: ['AERA', 'SCRYE', 'TALON', 'NESS'],
  gorger: ['MAW', 'GLUTT', 'GORE', 'CHOMP'],
  wraith: ['SHAD', 'VEIL', 'WISP', 'NEPH'],
  lich: ['VOSS', 'MORDA', 'KESS', 'GHAR'],
  behemoth: ['DRAU', 'KORG', 'ULM', 'BHAAL'],
  spore: ['MYC', 'PUFF', 'ROT', 'SIRN'],
  oracle: ['VYRA', 'NOEM', 'ESYL', 'MORN'],
  ravager: ['GHAR', 'KRELL', 'ZORN', 'BRUM'],
  wyrmling: ['SCYTH', 'EMRYS', 'NID', 'VYR'],
  crowlord: ['MORRIK', 'BRAN', 'NEVRA', 'VEX'],
  golem: ['ROCH', 'KARN', 'GROL', 'STEN'],
  gargoyle: ['STIR', 'PEREL', 'NOX', 'OSSA'],
  leech: ['SLURM', 'BIB', 'GUL', 'SIRP'],
  succubus: ['LYRA', 'NAEL', 'VESH', 'IRMA'],
  pyrelich: ['PYRA', 'EMBR', 'HEX', 'FORG'],
  tidesinger: ['MIRA', 'NEREN', 'KIRA', 'AELL'],
  ratking: ['SCURG', 'FLEK', 'GROIT', 'PRAG'],
  thornbeast: ['BARB', 'JAGAR', 'KORN', 'BRYL'],
  // v9 fillers — names lean into the role: artillery codenames, fortress
  // labels, insectile syllables, three-headed mythos.
  mortar: ['HOWZ', 'BORE', 'ARC', 'SALV'],
  bulwark: ['REDO', 'KEEL', 'STELE', 'DROM'],
  swarm: ['SKIT', 'BUZ', 'NIT', 'ZIRR'],
  chimera: ['TRYAD', 'KEROS', 'OPHID', 'GRYM'],
  // v10 final three
  shade: ['UMBR', 'VEIL', 'NYX', 'DUSK'],
  colossus: ['ATLAS', 'TITAN', 'MONOL', 'GRAV'],
  banshee: ['WAIL', 'KEEN', 'MOURNE', 'LIRA'],
}

let recruitCounter = 0
/** Build a roster-eligible Unit for an archetype the player just unlocked. */
export function recruitMinion(archetype: MinionArchetype): Unit {
  const pool = RECRUIT_NAMES[archetype]
  recruitCounter += 1
  const name = pool[recruitCounter % pool.length]
  return makeUnit(archetype, { q: 0, r: 0 }, { name })
}

/**
 * Make a hero unit on the enemy team.
 *
 * `elite` is optional — when provided, the hero spawns as a miniboss /
 * boss with stat multipliers, gold/red badge tone, and a `passiveId` the
 * engine reads from `lib/underlord/elite-passives.ts`. Regions tag heroes
 * with `eliteHeroes: [{ id, kind, passiveId }]` to drive this.
 */
export function makeHero(
  heroId: string,
  name: string,
  glyph: string,
  pos: Axial,
  difficulty: number,
  elite?: { kind: 'miniboss' | 'boss'; passiveId: import('./types').ElitePassiveId },
): Unit {
  // Heroes scale with difficulty (region stage 1-14) — XL numbers to match
  // the new minion economy. Boss heroes hit hard, take a beating.
  const tier = Math.max(1, Math.min(14, difficulty))
  let hp = 110 + tier * 20
  let atk = 30 + Math.floor(tier * 7)
  const spd = 4 + Math.floor(tier / 3)
  const move = 3 + Math.floor(tier / 5)
  const range = tier >= 7 ? 2 : 1

  // Elite stat overlay. Miniboss = +35% HP / +20% ATK; Boss = +75% / +40%.
  // Engine handles the unique passive separately (see elite-passives.ts).
  if (elite) {
    const mult =
      elite.kind === 'boss'
        ? { hp: 1.75, atk: 1.4 }
        : { hp: 1.35, atk: 1.2 }
    hp = Math.round(hp * mult.hp)
    atk = Math.round(atk * mult.atk)
  }

  return {
    id: nextUnitId(),
    templateId: 'brown', // not used for heroes; visual only
    name,
    glyph,
    faction: 'hero',
    pos,
    hp,
    hpMax: hp,
    atk,
    move,
    range,
    spd,
    // Bosses get the gold ring; minibosses keep the hero red but flagged.
    tone: elite?.kind === 'boss' ? 'gold' : 'foreground',
    acted: false,
    moved: false,
    dead: false,
    attackKind: 'basic',
    specialCd: 999,
    specialSpent: true,
    heroId,
    // Elite tagging — engine reads `eliteKind` + `passiveId` to dispatch.
    ...(elite
      ? {
          eliteKind: elite.kind,
          passiveId: elite.passiveId,
          passiveFired: false,
        }
      : {}),
  }
}

/** Starter roster — what the Underlord begins with. */
export function makeStarterRoster(): Unit[] {
  return [
    makeUnit('brown', { q: 0, r: 0 }, { name: 'GROK' }),
    makeUnit('brown', { q: 0, r: 0 }, { name: 'BLURG' }),
    makeUnit('red', { q: 0, r: 0 }, { name: 'CINDA' }),
    makeUnit('green', { q: 0, r: 0 }, { name: 'SLIK' }),
    makeUnit('blue', { q: 0, r: 0 }, { name: 'MURR' }),
    makeUnit('grey', { q: 0, r: 0 }, { name: 'KORM' }),
  ]
}

/* ------------------------------------------------------------------ */
/* Perk-driven roster rebuild.                                         */
/*                                                                     */
/* Roster units store their CURRENT (perk-buffed) stats. When the      */
/* player spends or refunds a perk, we recompute every unit from its   */
/* archetype baseline plus the new perk map, preserving HP-percent.     */
/* ------------------------------------------------------------------ */

import { statBuffsFor } from './perks'
import { aggregateBoons } from './boons'

/**
 * Recompute per-unit stats from archetype baseline + perks + boons.
 * The third arg is optional so older callers (perk-spend, migration)
 * still compile; if you pass a boon list the multipliers stack on top
 * of the perk additive buff.
 */
export function rebuildRosterStats(
  roster: Unit[],
  perks: Record<string, number>,
  boons: string[] = [],
): Unit[] {
  const bag = aggregateBoons(boons)
  return roster.map((u) => {
    if (u.faction !== 'minion' || u.isBarrier || u.isOverlord) return u
    const tpl = MINION_TEMPLATES[u.templateId]
    if (!tpl) return u
    const buff = statBuffsFor(u.templateId, perks)
    // Boon multipliers apply AFTER perk additive buffs so a perk that
    // grants +20 HP and a boon that grants +30% HP correctly compound
    // to (base + 20) × 1.30, not base × 1.30 + 20.
    const baseHp = tpl.hp + buff.hp
    const baseAtk = tpl.atk + buff.atk
    const isRanged = tpl.range >= 2
    const isFlying = !!tpl.flying
    const atkMult =
      bag.minionAtkMult *
      (isRanged ? 1 + bag.rangedAtkBonus : 1) *
      (isFlying ? 1 + bag.flyingAtkBonus : 1)
    const hpMax = Math.max(1, Math.round(baseHp * bag.minionHpMult))
    const atk = Math.max(1, Math.round(baseAtk * atkMult))
    const move = tpl.move + buff.move
    const range = tpl.range + buff.range
    const ratio = u.hpMax > 0 ? u.hp / u.hpMax : 1
    const hp = Math.max(1, Math.round(hpMax * ratio))
    return { ...u, hpMax, hp, atk, move, range }
  })
}
