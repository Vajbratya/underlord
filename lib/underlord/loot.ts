/**
 * Loot drop tables. Hand-rolled named items, not procedural affix slop.
 * Each item carries a Taint cost — power has a price.
 *
 * Stat bonuses are LARGE — they live in the same numeric universe as the
 * rest of the game (HP in hundreds, ATK in tens). A relic weapon should
 * feel like a real spike, not a +1 trinket.
 */

import type { LootItem, LootRarity } from './types'

export const LOOT_POOL: LootItem[] = [
  // ---- Common ----
  {
    id: 'rusty-pick',
    name: 'PICARETA ENFERRUJADA',
    rarity: 'common',
    slot: 'weapon',
    atkBonus: 5,
    taint: 0,
    flavor: 'Era de algum minerador. Agora é seu problema.',
  },
  {
    id: 'pot-helm',
    name: 'CAPACETE DE PANELA',
    rarity: 'common',
    slot: 'helm',
    hpBonus: 20,
    taint: 0,
    flavor: 'Cheira a sopa antiga. Funciona.',
  },
  {
    id: 'string-charm',
    name: 'AMULETO DE BARBANTE',
    rarity: 'common',
    slot: 'trinket',
    spdBonus: 1,
    taint: 0,
    flavor: 'A criança que fez isso vai ter um futuro brilhante. Talvez.',
  },

  // ---- Uncommon ----
  {
    id: 'butcher-cleaver',
    name: 'CUTELO DO AÇOUGUEIRO',
    rarity: 'uncommon',
    slot: 'weapon',
    atkBonus: 15,
    taint: 0.2,
    flavor: 'O açougueiro reclamou. Por menos de cinco segundos.',
  },
  {
    id: 'iron-circlet',
    name: 'CIRCLET DE FERRO',
    rarity: 'uncommon',
    slot: 'helm',
    hpBonus: 40,
    taint: 0.2,
    flavor: 'Aperta um pouco. Mantém a cabeça no lugar — literalmente.',
  },
  {
    id: 'crow-foot',
    name: 'PÉ-DE-CORVO ENCANTADO',
    rarity: 'uncommon',
    slot: 'trinket',
    moveBonus: 1,
    spdBonus: 1,
    taint: 0.3,
    flavor: 'Sussurra direções erradas, mas você anda mais rápido.',
  },

  // ---- Cursed ----
  {
    id: 'screaming-axe',
    name: 'MACHADO QUE GRITA',
    rarity: 'cursed',
    slot: 'weapon',
    atkBonus: 30,
    taint: 0.8,
    flavor: 'Não para de gritar. O que ele grita... é seu nome verdadeiro.',
  },
  {
    id: 'bone-crown',
    name: 'COROA DE OSSO MENOR',
    rarity: 'cursed',
    slot: 'helm',
    hpBonus: 60,
    atkBonus: 5,
    taint: 0.9,
    flavor: 'O ex-dono também era ambicioso. Veja onde acabou.',
  },
  {
    id: 'ember-eye',
    name: 'OLHO DE BRASA',
    rarity: 'cursed',
    slot: 'trinket',
    rangeBonus: 1,
    atkBonus: 10,
    taint: 1.0,
    flavor: 'Vê três segundos no futuro. Geralmente, três segundos ruins.',
  },

  // ---- Relic ----
  {
    id: 'sundering-blade',
    name: 'LÂMINA DO ROMPIMENTO',
    rarity: 'relic',
    slot: 'weapon',
    atkBonus: 50,
    taint: 1.4,
    flavor: 'Cortou uma profecia em duas. A profecia ainda não percebeu.',
  },
  {
    id: 'pact-mantle',
    name: 'MANTO DO PACTO',
    rarity: 'relic',
    slot: 'helm',
    hpBonus: 90,
    spdBonus: 1,
    taint: 1.6,
    flavor: 'Os outros seis Underlords usaram. Você é o primeiro a sair vivo dele.',
  },
  {
    id: 'sigil-of-cinders',
    name: 'SIGILO DAS CINZAS',
    rarity: 'relic',
    slot: 'trinket',
    atkBonus: 20,
    rangeBonus: 1,
    moveBonus: 1,
    taint: 2.0,
    flavor: 'Toda vez que você bate, sente um pouco do reino também.',
  },

  /* ============================================================
   * LEGENDÁRIOS (v6) — 25 items, only drop from stage ≥ 14 or
   * Black Market. Stat budgets are deliberately above relic so a
   * single legendary can carry a whole minion. Taint is steep.
   * ============================================================ */

  // ---- WEAPONS (9) ----
  {
    id: 'leg-sword-bryan',
    name: 'BRYANNICA, A LÂMINA QUE GRITA NOMES',
    rarity: 'legendary',
    slot: 'weapon',
    atkBonus: 80,
    taint: 2.4,
    flavor: 'A espada de Bryan. Continua gritando "BRYAN!". Você se acostuma.',
  },
  {
    id: 'leg-axe-tyrant',
    name: 'MACHADO DO TIRANO PROVISÓRIO',
    rarity: 'legendary',
    slot: 'weapon',
    atkBonus: 70,
    hpBonus: 40,
    taint: 2.6,
    flavor: 'Pertenceu a um rei interino que reinou por 14 minutos. Ainda dá conta.',
  },
  {
    id: 'leg-spear-dawn',
    name: 'LANÇA DA AURORA TARDIA',
    rarity: 'legendary',
    slot: 'weapon',
    atkBonus: 60,
    rangeBonus: 1,
    taint: 2.5,
    flavor: 'O sol nasce três horas atrasado quando você empunha. Os heróis ficam tontos.',
  },
  {
    id: 'leg-hammer-vael',
    name: 'MARTELO DE VAEL DEPOSTO',
    rarity: 'legendary',
    slot: 'weapon',
    atkBonus: 90,
    spdBonus: -1,
    taint: 2.8,
    flavor: 'Pesa como uma cidade caída. Bate como uma cidade caindo.',
  },
  {
    id: 'leg-dagger-seven',
    name: 'PUNHAL DAS SETE COROAS',
    rarity: 'legendary',
    slot: 'weapon',
    atkBonus: 55,
    spdBonus: 2,
    moveBonus: 1,
    taint: 2.6,
    flavor: 'Uma lâmina pra cada coroa que tombou. Sete cortes pelo preço de um.',
  },
  {
    id: 'leg-bow-tyrella',
    name: 'ARCO DA TYRELLA APAGADA',
    rarity: 'legendary',
    slot: 'weapon',
    atkBonus: 50,
    rangeBonus: 2,
    taint: 2.5,
    flavor: 'Tyrella era a melhor arqueira do reino. "Era" porque você está com o arco.',
  },
  {
    id: 'leg-mace-cardinal',
    name: 'MAÇA DO CARDEAL ENTERRADO',
    rarity: 'legendary',
    slot: 'weapon',
    atkBonus: 75,
    hpBonus: 30,
    taint: 2.7,
    flavor: 'Cada batida soa como um sino de funeral. O cardeal te benze enquanto você massacra.',
  },
  {
    id: 'leg-glaive-twin',
    name: 'GLAIVE DA LUA GÊMEA',
    rarity: 'legendary',
    slot: 'weapon',
    atkBonus: 65,
    rangeBonus: 1,
    spdBonus: 1,
    taint: 2.7,
    flavor: 'Duas luas. Uma lâmina. Quem entender ganha; quem perguntar morre.',
  },
  {
    id: 'leg-scythe-reaper',
    name: 'CEIFEIRA DO ANO 814',
    rarity: 'legendary',
    slot: 'weapon',
    atkBonus: 100,
    hpBonus: -20,
    taint: 3.0,
    flavor: 'Colhe heróis como trigo. Te corta um pouquinho cada vez que você respira.',
  },

  // ---- HELMS (8) ----
  {
    id: 'leg-helm-submerged',
    name: 'COROA SUBMERSA, A AUTÊNTICA',
    rarity: 'legendary',
    slot: 'helm',
    hpBonus: 150,
    atkBonus: 20,
    taint: 3.0,
    flavor: 'A original. As outras seis sabem disso. Por isso choram.',
  },
  {
    id: 'leg-helm-archon',
    name: 'ELMO DO ARCONTE ESQUECIDO',
    rarity: 'legendary',
    slot: 'helm',
    hpBonus: 130,
    spdBonus: 1,
    taint: 2.8,
    flavor: 'Ninguém lembra do nome dele. Mas o elmo lembra de cada ferida que aparou.',
  },
  {
    id: 'leg-helm-iron-mother',
    name: 'CAPUZ DA MÃE-FERRO',
    rarity: 'legendary',
    slot: 'helm',
    hpBonus: 180,
    moveBonus: -1,
    taint: 2.9,
    flavor: 'Pesa duas vidas. Te dá três.',
  },
  {
    id: 'leg-helm-eyes-of-vael',
    name: 'OLHOS DE VAEL\'THRAND',
    rarity: 'legendary',
    slot: 'helm',
    hpBonus: 100,
    rangeBonus: 1,
    atkBonus: 15,
    taint: 2.8,
    flavor: 'Vê o reino do jeito que era. E do jeito que vai ficar quando você terminar.',
  },
  {
    id: 'leg-helm-cardinal-mitra',
    name: 'MITRA DO CARDEAL VIVO',
    rarity: 'legendary',
    slot: 'helm',
    hpBonus: 120,
    atkBonus: 25,
    taint: 3.0,
    flavor: 'O cardeal não morreu. Ele só não está mais usando.',
  },
  {
    id: 'leg-helm-bone-mask',
    name: 'MÁSCARA DE OSSO DE DRAGÃO',
    rarity: 'legendary',
    slot: 'helm',
    hpBonus: 140,
    atkBonus: 10,
    taint: 2.7,
    flavor: 'O dragão também não morreu. Mas isso é problema pra outro dia.',
  },
  {
    id: 'leg-helm-pact-circlet',
    name: 'TIARA DO PACTO DE FERRO',
    rarity: 'legendary',
    slot: 'helm',
    hpBonus: 110,
    spdBonus: 2,
    taint: 2.9,
    flavor: 'Sete Underlords assinaram. Cinco se arrependeram. Você nem leu.',
  },
  {
    id: 'leg-helm-crown-of-fire',
    name: 'COROA DE FOGO PERMANENTE',
    rarity: 'legendary',
    slot: 'helm',
    hpBonus: 90,
    atkBonus: 35,
    taint: 3.1,
    flavor: 'Queima desde 814. Não derrete o ferro. Derrete tudo o resto.',
  },

  // ---- TRINKETS (8) ----
  {
    id: 'leg-trinket-thrand-eye',
    name: 'OLHO DE VAEL DESTERRADO',
    rarity: 'legendary',
    slot: 'trinket',
    atkBonus: 30,
    rangeBonus: 2,
    moveBonus: 1,
    taint: 3.0,
    flavor: 'Vê o ataque inimigo antes do inimigo ver. Pisca em código.',
  },
  {
    id: 'leg-trinket-saint-finger',
    name: 'DEDO DO SANTO FALSIFICADO',
    rarity: 'legendary',
    slot: 'trinket',
    hpBonus: 80,
    atkBonus: 25,
    taint: 2.9,
    flavor: 'Não é dedo de santo. Mas o santo não vai reclamar — ele também é falso.',
  },
  {
    id: 'leg-trinket-sevenfold',
    name: 'AMULETO SETE-VEZES-FORJADO',
    rarity: 'legendary',
    slot: 'trinket',
    atkBonus: 25,
    spdBonus: 2,
    moveBonus: 1,
    taint: 2.8,
    flavor: 'Cada forja matou um ferreiro. O sétimo não morreu — virou amuleto.',
  },
  {
    id: 'leg-trinket-cinder-heart',
    name: 'CORAÇÃO DAS CINZAS',
    rarity: 'legendary',
    slot: 'trinket',
    hpBonus: 100,
    atkBonus: 20,
    taint: 3.0,
    flavor: 'Bate uma vez por século. Cada batida é uma cidade que cai.',
  },
  {
    id: 'leg-trinket-rune-of-six',
    name: 'RUNA DOS SEIS QUE FALHARAM',
    rarity: 'legendary',
    slot: 'trinket',
    hpBonus: 70,
    atkBonus: 30,
    rangeBonus: 1,
    taint: 3.1,
    flavor: 'Seis Underlords antes. Seis sumiram. A runa lembra de cada um.',
  },
  {
    id: 'leg-trinket-blackgate-key',
    name: 'CHAVE DO PORTÃO NEGRO',
    rarity: 'legendary',
    slot: 'trinket',
    spdBonus: 3,
    moveBonus: 2,
    atkBonus: 15,
    taint: 2.7,
    flavor: 'Abre qualquer porta. Inclusive as que ninguém deveria abrir. Inclusive a sua.',
  },
  {
    id: 'leg-trinket-tongue-of-iron',
    name: 'LÍNGUA DE FERRO DO PROFETA',
    rarity: 'legendary',
    slot: 'trinket',
    atkBonus: 40,
    rangeBonus: 1,
    taint: 2.9,
    flavor: 'O profeta não fala mais — você fala por ele. E ele tinha umas palavras escolhidas.',
  },
  {
    id: 'leg-trinket-final-coin',
    name: 'A ÚLTIMA MOEDA DO REINO',
    rarity: 'legendary',
    slot: 'trinket',
    hpBonus: 60,
    atkBonus: 25,
    spdBonus: 1,
    taint: 3.0,
    flavor: 'A última moeda cunhada antes da Queda. Vale mais que o tesouro inteiro de Vael.',
  },

  /* ============ v11 — MÍTICOS & expansão ============ */

  // ---- MÍTICOS (14) — o ápice, acima de lendário. Orçamento de stats
  //      claramente acima dos lendários. Taint brutal (3.2-4.5). ----

  // MÍTICOS — armas (5)
  {
    id: 'myth-weapon-author-quill',
    name: 'A PENA DO AUTOR, MOLHADA EM TINTA SUA',
    rarity: 'mythic',
    slot: 'weapon',
    atkBonus: 130,
    rangeBonus: 1,
    taint: 4.0,
    flavor: 'Quem escreveu o reino também te escreveu. Agora você reescreve — com sangue.',
  },
  {
    id: 'myth-weapon-void-edge',
    name: 'GUME DO VAZIO QUE LÊ DE VOLTA',
    rarity: 'mythic',
    slot: 'weapon',
    atkBonus: 150,
    spdBonus: -2,
    taint: 4.5,
    flavor: 'O Vazio não corta carne. Corta a parte da história onde você existia.',
  },
  {
    id: 'myth-weapon-iron-pact-oath',
    name: 'JURAMENTO DO PACTO DE FERRO',
    rarity: 'mythic',
    slot: 'weapon',
    atkBonus: 120,
    hpBonus: 60,
    taint: 3.6,
    flavor: 'Os sete assinaram com a lâmina. Você é o oitavo — e o último nome cabe.',
  },
  {
    id: 'myth-weapon-drowned-scepter',
    name: 'CETRO DA COROA AFOGADA',
    rarity: 'mythic',
    slot: 'weapon',
    atkBonus: 115,
    rangeBonus: 2,
    moveBonus: 1,
    taint: 3.8,
    flavor: 'O rei afogado ainda segura a outra ponta. Puxe forte; ele não solta de graça.',
  },
  {
    id: 'myth-weapon-active-ash',
    name: 'LÂMINA DE CINZA ATIVA',
    rarity: 'mythic',
    slot: 'weapon',
    atkBonus: 140,
    hpBonus: -30,
    taint: 4.2,
    flavor: 'A cinza não esfriou desde 814. Cada golpe queima um pouco de quem segura.',
  },

  // MÍTICOS — elmos (5)
  {
    id: 'myth-helm-seven-crowns',
    name: 'DIADEMA DAS SETE COROAS FUNDIDAS',
    rarity: 'mythic',
    slot: 'helm',
    hpBonus: 240,
    atkBonus: 30,
    taint: 4.0,
    flavor: 'Sete Underlords, uma cabeça. As outras seis discordam, mas estão dentro do metal.',
  },
  {
    id: 'myth-helm-void-mask',
    name: 'MÁSCARA DO VAZIO QUE OLHA DE VOLTA',
    rarity: 'mythic',
    slot: 'helm',
    hpBonus: 200,
    rangeBonus: 1,
    atkBonus: 20,
    taint: 4.3,
    flavor: 'Você olha pro abismo. O Leitor olha pra você. Empate técnico.',
  },
  {
    id: 'myth-helm-drowned-crown',
    name: 'A COROA AFOGADA, ESCORRENDO AINDA',
    rarity: 'mythic',
    slot: 'helm',
    hpBonus: 260,
    moveBonus: -1,
    taint: 4.1,
    flavor: 'A original das originais. Pesa como o mar inteiro. Você respira água agora — detalhe menor.',
  },
  {
    id: 'myth-helm-author-eye',
    name: 'OLHO DO AUTOR ADORMECIDO',
    rarity: 'mythic',
    slot: 'helm',
    hpBonus: 180,
    atkBonus: 40,
    spdBonus: 1,
    taint: 3.9,
    flavor: 'Vê cada página antes de ser escrita. Inclusive a sua última. Spoiler: dói.',
  },
  {
    id: 'myth-helm-ash-mitra',
    name: 'MITRA DE CINZA ATIVA',
    rarity: 'mythic',
    slot: 'helm',
    hpBonus: 220,
    atkBonus: 25,
    taint: 4.2,
    flavor: 'Coroa um cadáver e ele se levanta achando que ainda manda. Funciona com você também.',
  },

  // MÍTICOS — berloques (4)
  {
    id: 'myth-trinket-void-heart',
    name: 'CORAÇÃO DO VAZIO ENGOLIDO',
    rarity: 'mythic',
    slot: 'trinket',
    hpBonus: 140,
    atkBonus: 45,
    rangeBonus: 1,
    taint: 4.4,
    flavor: 'Bate uma vez. Apaga um reino. Bate de novo. Apaga você um pouquinho.',
  },
  {
    id: 'myth-trinket-readers-bookmark',
    name: 'O MARCADOR DO LEITOR',
    rarity: 'mythic',
    slot: 'trinket',
    atkBonus: 50,
    spdBonus: 3,
    moveBonus: 2,
    taint: 3.7,
    flavor: 'Marca a página onde você morre. Enquanto o Leitor não voltar, você não morre. Reze pra distração dele.',
  },
  {
    id: 'myth-trinket-iron-pact-seal',
    name: 'SELO INTEIRO DO PACTO DE FERRO',
    rarity: 'mythic',
    slot: 'trinket',
    hpBonus: 120,
    atkBonus: 55,
    spdBonus: 1,
    taint: 4.0,
    flavor: 'Os sete selos juntos. Quem reúne os sete vira o oitavo. Ninguém viveu pra contar o nono.',
  },
  {
    id: 'myth-trinket-final-ember',
    name: 'A ÚLTIMA BRASA DE 814',
    rarity: 'mythic',
    slot: 'trinket',
    hpBonus: 160,
    atkBonus: 40,
    moveBonus: -1,
    taint: 3.5,
    flavor: 'A faísca que queimou o mundo velho. Guarde no bolso. Não é como se piorasse.',
  },

  // ---- EXPANSÃO MID-GAME (10) — common → legendary ----
  {
    id: 'v11-common-tin-spoon',
    name: 'COLHER DE LATA AFIADA',
    rarity: 'common',
    slot: 'weapon',
    atkBonus: 7,
    taint: 0,
    flavor: 'Amolada na pedra errada. Ainda assim, mais letal que a maioria dos refeitórios.',
  },
  {
    id: 'v11-common-rag-hood',
    name: 'CAPUZ DE TRAPO MOFADO',
    rarity: 'common',
    slot: 'helm',
    hpBonus: 18,
    spdBonus: 1,
    taint: 0,
    flavor: 'Cheira a porão. Disfarça que você também.',
  },
  {
    id: 'v11-uncommon-quarry-maul',
    name: 'MARRETA DA PEDREIRA',
    rarity: 'uncommon',
    slot: 'weapon',
    atkBonus: 18,
    spdBonus: -1,
    taint: 0.3,
    flavor: 'Quebrou mil pedras e dois capatazes. Não conta os capatazes.',
  },
  {
    id: 'v11-uncommon-tax-ledger',
    name: 'LIVRO-CAIXA DO COLETOR',
    rarity: 'uncommon',
    slot: 'trinket',
    hpBonus: 25,
    moveBonus: 1,
    taint: 0.4,
    flavor: 'Cada nome riscado era alguém que não pagou. Agora ninguém paga, ninguém respira.',
  },
  {
    id: 'v11-cursed-leech-blade',
    name: 'LÂMINA SANGUESSUGA',
    rarity: 'cursed',
    slot: 'weapon',
    atkBonus: 28,
    hpBonus: 20,
    taint: 0.9,
    flavor: 'Bebe do inimigo. Quando não tem inimigo, ela tem sede. Você sabe quem está por perto.',
  },
  {
    id: 'v11-cursed-whisper-veil',
    name: 'VÉU DOS SUSSURROS',
    rarity: 'cursed',
    slot: 'helm',
    hpBonus: 55,
    spdBonus: 1,
    taint: 1.0,
    flavor: 'Os mortos te contam segredos. Em troca, só querem que você não pare de matar.',
  },
  {
    id: 'v11-cursed-jealous-eye',
    name: 'OLHO INVEJOSO',
    rarity: 'cursed',
    slot: 'trinket',
    atkBonus: 12,
    rangeBonus: 1,
    spdBonus: 1,
    taint: 1.1,
    flavor: 'Cobiça tudo o que vê. Felizmente, o que ele vê tende a morrer.',
  },
  {
    id: 'v11-relic-gallows-rope',
    name: 'CORDA DA FORCA REAL',
    rarity: 'relic',
    slot: 'trinket',
    hpBonus: 60,
    atkBonus: 18,
    taint: 1.7,
    flavor: 'Enforcou três reis e um inocente. O inocente foi engano. Os reis, não.',
  },
  {
    id: 'v11-relic-warden-helm',
    name: 'ELMO DO CARCEREIRO',
    rarity: 'relic',
    slot: 'helm',
    hpBonus: 95,
    atkBonus: 10,
    taint: 1.5,
    flavor: 'Guardou a masmorra por quarenta anos. Agora guarda você — de dentro pra fora.',
  },
  {
    id: 'v11-legendary-debt-blade',
    name: 'LÂMINA DA DÍVIDA IMPAGÁVEL',
    rarity: 'legendary',
    slot: 'weapon',
    atkBonus: 85,
    spdBonus: 1,
    taint: 2.6,
    flavor: 'Cobra o que o reino deve a você. O reino discorda. A lâmina não aceita "não".',
  },
]

/** Pick `count` items biased by region tier. Higher tier = better drops.
 * If `forceRare` is true, the first item is guaranteed cursed-or-better
 * (pity timer to prevent dry streaks). */
export function rollLoot(
  stage: number,
  count: number,
  forceRare: boolean = false,
): LootItem[] {
  const pool = LOOT_POOL.slice()
  // 5-tier ladder. Stage 14+ unlocks legendaries (boss-tier regions).
  // Earlier stages cap at relic so legendaries feel like a real milestone.
  const tier =
    stage >= 18
      ? ['relic', 'legendary', 'legendary', 'mythic']
      : stage >= 14
        ? ['cursed', 'relic', 'relic', 'legendary']
        : stage >= 12
          ? ['cursed', 'cursed', 'relic']
          : stage >= 8
            ? ['uncommon', 'cursed', 'cursed']
            : stage >= 4
              ? ['common', 'uncommon', 'cursed']
              : ['common', 'common', 'uncommon']
  const out: LootItem[] = []
  for (let i = 0; i < count; i++) {
    let want: LootRarity
    if (forceRare && i === 0) {
      // Pity timer: scale guaranteed rarity with stage tier.
      want =
        stage >= 18
          ? 'mythic'
          : stage >= 14
            ? 'legendary'
            : stage >= 8
              ? 'relic'
              : 'cursed'
    } else {
      want = tier[Math.floor(Math.random() * tier.length)] as LootRarity
    }
    const candidates = pool.filter((p) => p.rarity === want)
    const pick = candidates[Math.floor(Math.random() * candidates.length)]
    if (pick) out.push(pick)
  }
  return out
}

export const RARITY_LABEL: Record<LootRarity, string> = {
  common: 'COMUM',
  uncommon: 'INCOMUM',
  cursed: 'AMALDIÇOADO',
  relic: 'RELÍQUIA',
  legendary: 'LENDÁRIO',
  mythic: 'MÍTICO',
}

export const RARITY_TONE: Record<
  LootRarity,
  'foreground' | 'accent' | 'destructive' | 'gold'
> = {
  common: 'foreground',
  uncommon: 'accent',
  cursed: 'destructive',
  relic: 'gold',
  // Legendaries reuse the gold tone for now — they stand out via the
  // "LENDÁRIO" label + a holo border in the loot/inventory UI.
  legendary: 'gold',
  // Mythics also use gold for the chip color but get a prismatic
  // animated holo border (see `.rarity-mythic` in globals.css) so they
  // read as a whole tier above legendary at a glance.
  mythic: 'gold',
}
