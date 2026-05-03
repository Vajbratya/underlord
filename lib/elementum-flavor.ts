/**
 * ELEMENTUM — flavor / lore layer.
 *
 * Universe premise: você é o ÚLTIMO UNDERLORD. Uma existência arruinada por
 * gerações de "heróis" — adolescentes com complexo de protagonista, nobres
 * mimados, paladinos influencers e profetas que falam em terceira pessoa.
 *
 * Cada andar da Torre é um desses cuzões. Eles invadem sua casa, quebram seus
 * móveis, levam suas relíquias e ainda tiram selfie em cima do seu trono.
 * Você está cansado. Você está com raiva. E desta vez, você vai responder.
 */

export type Hero = {
  /** Internal id used by stage routing. */
  id: string
  /** Display name shown in HUD and intro banner. */
  name: string
  /** Honorific / class — placed under the name on the intro banner. */
  title: string
  /** One-line bio that the Underlord (you) snarks about them. Shown on intro. */
  bio: string
  /** What the hero shouts when entering battle. */
  entry: string
  /** What the hero says if they kill you (game over). */
  gloat: string
  /** What the Underlord says when finishing this hero off (victory toast). */
  underlordKill: string
  /** Mid-combat taunts — pool, picked at random when triggered. */
  taunts: string[]
}

/**
 * 14 heróis-cuzões em ordem crescente de insuportabilidade.
 * Stages 1-2: aprendizes / mascotes da prefeitura.
 * Stages 3-5: cavaleiros e clérigos com complexo de superioridade.
 * Stages 6-9: feiticeiros mimados, druidas militantes, padres da família.
 * Stages 10-14: bosses — reis, oligarcas, profecias encarnadas.
 */
export const HEROES: Hero[] = [
  {
    id: 'bryan',
    name: 'BRYAN, O ESCOLHIDO',
    title: 'Filho da Profecia (do segundo casamento)',
    bio: 'Diz que é descendente de um rei. Não é. Tem 19 anos. Bate em galinha pra ganhar XP.',
    entry: 'Você sabe quem é meu pai? Ele é o REI.',
    gloat: 'Curtiu? Salva esse momento que daqui a pouco eu posto.',
    underlordKill: 'O Escolhido escolheu errado o oponente.',
    taunts: [
      'Meu mentor disse que sou especial.',
      'Tô gravando isso pra um documentário.',
      'Espera, deixa eu ajustar minha pose heroica.',
    ],
  },
  {
    id: 'kevin',
    name: 'KEVIN DA LUZ',
    title: 'Paladino com posto de gasolina do pai',
    bio: 'Convertido recentemente. Cita o sermão da semana em qualquer conversa. Tem um podcast.',
    entry: 'Vou contar pro padre o que você está fazendo.',
    gloat: 'A Luz prevaleceu. (E meu engajamento também.)',
    underlordKill: 'A Luz se apagou. O posto também.',
    taunts: [
      'Já ouviu falar da Boa Nova? Tenho um folheto.',
      'Meu pai paga minha armadura. Mas é mérito.',
      'Você precisa de oração e de terapia. Eu ofereço uma.',
    ],
  },
  {
    id: 'tyrella',
    name: 'TYRELLA, A VIRTUOSA',
    title: 'Sacerdotisa que pediu pra falar com o gerente',
    bio: 'Vai te denunciar pro Conselho dos Deuses. Tem um post-it com o nome de cada inimigo.',
    entry: 'Isso é INACEITÁVEL. Quem é seu supervisor?',
    gloat: 'Vou deixar uma avaliação. UMA estrela.',
    underlordKill: 'Reclamação registrada. Resolução: óbito.',
    taunts: [
      'Gerente! GERENTE!',
      'Tem comentários POSITIVOS sobre sua gestão da masmorra?',
      'Eu sou cliente fidelidade do panteão.',
    ],
  },
  {
    id: 'daggor',
    name: 'SIR DAGGOR DE PUNHOREJO',
    title: 'Cavaleiro que posta selfie em cada quest',
    bio: 'Tem 2 milhões de seguidores em pergaminhos. 80% bots. Vende curso de heroísmo.',
    entry: 'Like, share e siga, plebe — antes de morrer.',
    gloat: 'A galera vai AMAR esse close.',
    underlordKill: 'Bloqueado. Reportado. Excomungado do feed.',
    taunts: [
      'Espera, deixa eu pegar o melhor ângulo.',
      'Esse combate vai render no mínimo 3 conteúdos.',
      'Quer aparecer no meu pergaminho? 50 moedas.',
    ],
  },
  {
    id: 'gandolfini',
    name: 'GANDOLFINI, O CINZA-CLARO',
    title: 'Mago com curso EAD de Necromancia',
    bio: 'Pegou diploma online. Reprovou em Conjuração. Acha que cajado é lifestyle, não arma.',
    entry: 'Tirei 7.5 em Bola-de-Fogo. Suficiente.',
    gloat: 'Aprovado com louvor. (Você, reprovado em vida.)',
    underlordKill: 'Diploma cancelado. Universidade fechada.',
    taunts: [
      'Espera, deixa eu lembrar o cantra...',
      'Meu professor falou que isso ia funcionar.',
      'Hmm, preciso reler a apostila.',
    ],
  },
  {
    id: 'vexanna',
    name: 'LADY VEXANNA',
    title: 'Caçadora de vilões por influência',
    bio: 'Caça vilões pra ranking de moralidade do reino. Faz parceria com guildas. Tem assessoria.',
    entry: 'Carma. É só carma, tio.',
    gloat: 'Manifestei tua derrota. Lei da atração.',
    underlordKill: 'O carma chegou pra ela primeiro.',
    taunts: [
      'O universo está conspirando A MEU FAVOR.',
      'Você atrai o que emana, vilão.',
      'Tenho uma cota mensal de monstros derrotados a bater.',
    ],
  },
  {
    id: 'blazborn',
    name: 'PRIMOGÊNITO BLAZBORN',
    title: 'Bárbaro vegano crossfit lvl 40',
    bio: 'Te explica como ele come desde o primeiro turno. Bebe um shake de proteína em vez de poção.',
    entry: 'Macros, mano. MAC-ROS.',
    gloat: 'Era o leg day perfeito. E você era a perna.',
    underlordKill: 'Falhou no agachamento final.',
    taunts: [
      'Já provou meu shake? Tem 40g de proteína.',
      'Isso é peito ou volume? OBVIAMENTE peito.',
      'Sem dor, sem ganho, sem você.',
    ],
  },
  {
    id: 'gregorius',
    name: 'PADRE GREGÓRIUS, O CHATO',
    title: 'Inquisidor de plantão no grupo da família',
    bio: 'Manda áudio de 8 minutos. Sempre fala de política em cerimônia de batismo. Persegue você há 14 anos.',
    entry: 'Já te contei sobre o nosso senhor?',
    gloat: 'Te aviso na missa de sétimo dia. (Não falte.)',
    underlordKill: 'Confissão final aceita. A título póstumo.',
    taunts: [
      'No meu tempo, vilão respeitava clero.',
      'Te mandei áudio. Ainda não escutou.',
      'Compartilha esse sermão em pelo menos 5 grimórios.',
    ],
  },
  {
    id: 'bianca',
    name: 'BIANCA DOS BOSQUES',
    title: 'Druida que te cancela no Twitter Élfico',
    bio: 'Faz print de tudo. Rebata um feitiço dela e você é exposed no fórum dos elfos. Usa neutro pra árvores.',
    entry: 'Imagina ainda usar magia assim em 2026.',
    gloat: 'Print salvo. Thread em formação.',
    underlordKill: 'Bloqueada. Silenciada. Adubada.',
    taunts: [
      'Anota aí: VILÃO PROBLEMÁTICO.',
      'Cês viram o que ele fez? CÊS VIRAM?',
      'Vou expor isso no fórum dos elfos.',
    ],
  },
  {
    id: 'baldrik',
    name: 'REI BALDRIK, O JUSTO™',
    title: 'Monarca com marca registrada',
    bio: 'Patenteou a palavra "justiça". Cobra royalty toda vez que alguém faz o certo. Coroa alugada.',
    entry: 'Ordem! Por favor, com respeito à monarquia.',
    gloat: 'Decreto real: você está morto. Por gentileza.',
    underlordKill: 'Trono vacante. Coroa devolvida pro brechó.',
    taunts: [
      'Isso é traição de lesa-justiça (TM).',
      'Meus impostos pagaram essa armadura.',
      'O súdito médio aceita isto, por que você não?',
    ],
  },
  {
    id: 'irmandade',
    name: 'A IRMANDADE DOS GLITCH',
    title: 'Esquadrão speedrunner de heróis',
    bio: 'Pula sua história. Skipa diálogo. Já mataram 14 vilões essa hora. Cronometram seu sofrimento.',
    entry: 'Skip cutscene, plebe.',
    gloat: 'Boss morto em 47 segundos. Novo PB.',
    underlordKill: 'Run resetada. Sofrimento estendido.',
    taunts: [
      'Andiamo, andiamo, vamos.',
      'Tô atrasado pro split, faz logo.',
      'Esse boss tem padrão fixo né? Tedioso.',
    ],
  },
  {
    id: 'midas',
    name: 'CHANCELER MIDAS XII',
    title: 'Cobra imposto sobre sua fúria',
    bio: 'Tributou seu ódio. Tributou sua poção. Tributa o ar do calabouço. Hoje veio "auditar".',
    entry: 'Isso é tributável. Aliás, tudo é.',
    gloat: 'Sua falência é parcelada. Em 12x sem juros.',
    underlordKill: 'Imposto sonegado. Sentença cumprida.',
    taunts: [
      'Sua barreira está dentro da declaração?',
      'Vou multar você por ESTAR em pé.',
      'Tem nota fiscal desse feitiço?',
    ],
  },
  {
    id: 'profecia',
    name: 'A PROFECIA EM PESSOA',
    title: 'Encarnação do determinismo narrativo',
    bio: 'Sabe como tudo termina. Já viu seu obituário. Carrega pergaminho com SEU nome em letras douradas.',
    entry: 'Isto sempre ia acabar assim, querido.',
    gloat: 'Eu te avisei. Está no capítulo 4, parágrafo 2.',
    underlordKill: 'Plot twist não previsto. Reescrevendo.',
    taunts: [
      'Próxima fala sua: "como assim?"',
      'O autor não te deu motivação suficiente.',
      'Spoiler: isso aqui era pra acabar pior pra você.',
    ],
  },
  {
    id: 'heliarch',
    name: 'HELIARCH, O SOL VIVO',
    title: 'Avatar do dia eterno (sem horário comercial)',
    bio: 'A própria luz do mundo, agora pessoa jurídica. Não dorme. Não negocia. Cobra hora extra do amanhecer.',
    entry: 'Eu sou o motivo de você usar protetor solar.',
    gloat: 'Apague-se. (Literal.)',
    underlordKill: 'Eclipse permanente decretado.',
    taunts: [
      'Você é um problema de sombra.',
      'Há 4 bilhões de anos eu queimo idiotas como você.',
      'O dia continua. Você, não.',
    ],
  },
]

/**
 * Underlord one-liners — narração do protagonista (você) em momentos chave.
 */
export const UNDERLORD_LINES = {
  /** Quando você ativa ULTIMATE. */
  ultimate: [
    'CHEGA DESSA PALHAÇADA.',
    'VOCÊS PEDIRAM. VOCÊS RECEBEM.',
    '14 ANOS NESSA TORRE. 14 ANOS DE PACIÊNCIA.',
    'NEM A MINHA AVÓ ME ENCHEU TANTO.',
  ],
  /** Quando você completa um PERFECT CAST. */
  perfect: [
    'Foi cirúrgico. Quase educado.',
    'Eu poderia fazer pior. Mas hoje fui generoso.',
    'Foi simétrico demais. Almoço meu prêmio.',
  ],
  /** Quando você vence a run inteira. */
  victory: [
    'A torre é minha. O reino é meu. O silêncio, finalmente, também.',
    'Avisem o próximo herói: traga capacete e advogado.',
    'Foi a última profecia que eu ouvi. Cancelei a assinatura.',
  ],
  /** Quando você morre. */
  defeat: [
    'Ainda volto. Vocês sempre voltam pra me encher.',
    'Anotem meu nome. Eu vou lembrar do de vocês.',
    'Tudo bem. Esses heróis envelhecem mal. Eu espero.',
  ],
  /** Reação quando o herói critta em você. */
  enemyCrit: [
    'SÉRIO?',
    'Isso é tabela errada de dano.',
    'Trapaça. Documentado.',
  ],
  /** Resposta seca quando você vence um round. */
  roundWin: [
    'Próximo.',
    'Pretinho básico.',
    'Manda o seguinte.',
    'Já vai tarde.',
  ],
}

/**
 * Get the hero for a given stage. Stages beyond the list cycle back with a
 * "ECHO" suffix and a different title — endless mode flavor.
 */
export function getHero(stage: number): Hero {
  if (stage <= HEROES.length) {
    return HEROES[stage - 1]
  }
  // Endless cycle — echo of a previous hero
  const base = HEROES[(stage - 1) % HEROES.length]
  return {
    ...base,
    name: `ECO DE ${base.name}`,
    title: `${base.title} (versão piorada)`,
    bio: 'Voltou. Pior. Como praga, como influencer, como herói genérico.',
  }
}

/** Random pick helper. */
export function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
