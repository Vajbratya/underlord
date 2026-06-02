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

import type {
  EliteKind,
  ElitePassiveId,
  MinionArchetype,
} from './underlord/types'

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
  /** Minion archetypes that march in with this hero — their personal entourage.
   * Each hero brings 1-3 themed flunkies onto the battlefield. */
  entourage: MinionArchetype[]
  /** Display flavor for the entourage (one-liner shown in war room briefing). */
  entourageLabel: string

  /* ----- Elite (mini-boss / boss) fields, optional ----- */
  /** When set, scales stats and badges this hero as a special encounter. */
  eliteKind?: EliteKind
  /** Which unique passive this elite carries; ignored if `eliteKind` empty. */
  passiveId?: ElitePassiveId
  /** Short PT-BR name for the unique gimmick, used in the briefing UI.
   * Free-form so the catalog can flavor each boss differently from the
   * mechanical passive label (e.g. "FÚRIA DO TRONO" instead of "ENRAGE"). */
  passiveName?: string
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
    entourage: ['green'],
    entourageLabel: 'Um stalker que ele chama de "amigo de jornada".',
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
    entourage: ['brown', 'blue'],
    entourageLabel: 'Coroinha brawler e um diácono que cura no nome do Santo CNPJ.',
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
    entourage: ['blue', 'grey'],
    entourageLabel: 'Assistente que reza e um auditor que mira de longe.',
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
    entourage: ['green', 'green'],
    entourageLabel: 'Dois fanboys jurando que vão "ajudar com a edição".',
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
    entourage: ['red', 'red'],
    entourageLabel: 'Dois aprendizes de bola-de-fogo que ainda não passaram na prova prática.',
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
    entourage: ['green', 'blue'],
    entourageLabel: 'Mentee de manifestação e uma life-coach que cura traumas.',
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
    entourage: ['brown', 'brown'],
    entourageLabel: 'Dois gym bros do bonding ritual de segunda-feira.',
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
    entourage: ['blue', 'grey'],
    entourageLabel: 'Tia do grupo da família e o sobrinho que toca o sininho.',
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
    entourage: ['red', 'green'],
    entourageLabel: 'Um pirômano "ativista" e uma assassina que printa antes de matar.',
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
    entourage: ['grey', 'grey', 'brown'],
    entourageLabel: 'Dois besteiros da guarda real e um capitão que cobra hora extra.',
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
    entourage: ['green', 'green', 'red'],
    entourageLabel: 'O time inteiro do speedrun: dois flankers e um damage check.',
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
    entourage: ['blue', 'grey'],
    entourageLabel: 'Um perito do fisco e um cobrador armado.',
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
    entourage: ['red', 'green', 'blue'],
    entourageLabel: 'O elenco de apoio: um vilão de capítulo, uma rival e um deus ex machina.',
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
    entourage: ['red', 'red', 'grey'],
    entourageLabel: 'Dois serafins-pirômanos e um arqueiro de raios solares.',
    eliteKind: 'boss',
    passiveId: 'aura-rage',
    passiveName: 'CORONA SOLAR',
  },

  /* ============================================================
   * MINI-BOSSES (8) — appear at intermediate stages.
   * Each one has a unique passive and elevated entourage so they
   * feel meaningfully different from a regular hero.
   * ============================================================ */

  {
    id: 'mb-husk-king',
    name: 'O REI-CASCA',
    title: 'Mini-boss · estágio 3',
    bio: 'Um morto que insiste em ser rei. Carrega a própria coroa enferrujada. Cada espinho da armadura tem uma história triste e duas mortes.',
    entry: 'Eu reino aqui. Mesmo que o reino tenha apodrecido em volta.',
    gloat: 'Adicionado à minha corte. Pode levantar agora — está morto também.',
    underlordKill: 'O Rei-Casca cai. A casca permanece. A coroa rola.',
    taunts: [
      'Toda batida sua doi MENOS que a minha primeira morte.',
      'Já tive coroa de verdade. Hoje uso de espinho.',
      'Quem te apunhalar HOJE, vai sentir o que eu senti.',
    ],
    entourage: ['bone', 'bone', 'wraith'],
    entourageLabel: 'Dois ossos da guarda real e um wraith que já foi conselheiro.',
    eliteKind: 'miniboss',
    passiveId: 'thorns',
    passiveName: 'COROA DE ESPINHOS',
  },
  {
    id: 'mb-twin-saints',
    name: 'OS SANTOS GÊMEOS',
    title: 'Mini-boss · estágio 6',
    bio: 'Dois irmãos canonizados pelo mesmo bispo no mesmo dia. Quando um cai, o outro reza forte demais.',
    entry: 'Em nome do nosso, e do nosso outro nome.',
    gloat: 'Hoje o calendário ganha um santo a mais. Cuidado pra não ser você.',
    underlordKill: 'Despromovidos. Ambos. Postumamente.',
    taunts: [
      'Reze conosco. Junte-se ao panteão. (Vagas limitadas.)',
      'Você não consegue matar AMBOS, vilão.',
      'Um sermão para cada lado da espada.',
    ],
    entourage: ['blue', 'blue', 'tidesinger'],
    entourageLabel: 'Dois acólitos azulados e uma cantora-da-maré em transe.',
    eliteKind: 'miniboss',
    passiveId: 'revive',
    passiveName: 'O OUTRO IRMÃO',
  },
  {
    id: 'mb-mirror-knight',
    name: 'A CAVALEIRA-ESPELHO',
    title: 'Mini-boss · estágio 9',
    bio: 'Capacete espelhado. Armadura espelhada. Devolve cada golpe — e cada insulto — refletido. Não tem rosto. Tem o seu rosto.',
    entry: 'Olha pra mim. (Você se olha.)',
    gloat: 'Você me bateu. Você se bateu. Bem feito.',
    underlordKill: 'O espelho racha. Por dentro, ela tem o rosto de outra pessoa morrendo.',
    taunts: [
      'Cada gota sua, eu devolvo dobrada.',
      'Se machuca? Eu também. (Você também.)',
      'Não vou cansar antes de você.',
    ],
    entourage: ['grey', 'gargoyle', 'grey'],
    entourageLabel: 'Dois flecheiros e uma gárgula que vê tudo de cima.',
    eliteKind: 'miniboss',
    passiveId: 'thorns',
    passiveName: 'ARMADURA-ESPELHO',
  },
  {
    id: 'mb-warden',
    name: 'O CARCEREIRO INSAUSTO',
    title: 'Mini-boss · estágio 11',
    bio: 'Carcereiro do calabouço de baixo da torre. Quanto mais ele apanha, mais ele lembra do trabalho — e do quanto não foi pago.',
    entry: 'Hora extra é sagrada. Você vai pagar a minha.',
    gloat: 'Folha de ponto carimbada com o seu sangue.',
    underlordKill: 'Demitido sem aviso. Pelas suas próprias chaves.',
    taunts: [
      'Cada arranhão me lembra do contrato.',
      'O sindicato não vai gostar.',
      'Vou levar isso pro RH. Spoiler: o RH é minha esposa.',
    ],
    entourage: ['behemoth', 'ravager', 'gorger'],
    entourageLabel: 'Um colosso, um carrasco e um devorador — escolta de cela.',
    eliteKind: 'miniboss',
    passiveId: 'enrage',
    passiveName: 'HORA EXTRA',
  },
  {
    id: 'mb-temple-twins',
    name: 'OS GÊMEOS-TEMPLO',
    title: 'Mini-boss · estágio 13',
    bio: 'Sacerdote e cavaleiro nascidos do mesmo ovo. Um cura, o outro mata. Trocam de função no meio do round.',
    entry: 'Sermão e espada. Pode escolher pelo que morrer primeiro.',
    gloat: 'Bençao seca. Pode descer.',
    underlordKill: 'Os dois ovos quebraram juntos. Era hora.',
    taunts: [
      'Eu curo. Ele mata. Reciprocamente.',
      'Ainda dá pra você se converter… até a próxima rodada.',
      'Faz fila pra absolvição.',
    ],
    entourage: ['blue', 'oracle', 'crowlord'],
    entourageLabel: 'Coral celeste: assistente, profeta e corvo-mestre.',
    eliteKind: 'miniboss',
    passiveId: 'lifesteal',
    passiveName: 'COMUNHÃO',
  },
  {
    id: 'mb-spore-priest',
    name: 'O SACERDOTE-COGUMELO',
    title: 'Mini-boss · estágio 15',
    bio: 'Pegou um esporo da floresta proibida. Hoje ele é o esporo. Deixou de falar — fala em mofo. O mofo escuta.',
    entry: 'Eu não sou um. Eu sou muitos. Cada um te quer ferido.',
    gloat: 'Vou crescer no seu túmulo. Já marquei a data.',
    underlordKill: 'Colhido com fogo. Adubo pra próxima geração de inimigos.',
    taunts: [
      'Cada gota sua… vira mais um de mim.',
      'Sopra. SOPRA. Estou em você.',
      'Você vai espirrar a minha vingança.',
    ],
    entourage: ['spore', 'spore', 'pyrelich'],
    entourageLabel: 'Dois esporos voadores e um pyrelich que queima a infestação dos outros.',
    eliteKind: 'miniboss',
    passiveId: 'summon',
    passiveName: 'BROTAÇÃO',
  },
  {
    id: 'mb-debt-collector',
    name: 'O COBRADOR DE DÍVIDAS',
    title: 'Mini-boss · estágio 16',
    bio: 'Subprefeito do reino, contratado de fora. Anda com livro-razão. Vai cobrar de você cada favor que seus ancestrais pediram.',
    entry: 'Boa tarde. Tem 14 séculos de juros pra acertar.',
    gloat: 'Quitação total. Agora me devolve a alma — está nos contratos.',
    underlordKill: 'Calote registrado. Cobrador caiu. Imposto se foi com ele.',
    taunts: [
      'Tem boleto. Pode parcelar — em sangue.',
      'Você assinou em vida. Em morte vale igual.',
      'Multa por atraso: aplicada na cabeça.',
    ],
    entourage: ['succubus', 'grey', 'grey'],
    entourageLabel: 'Uma sedutora-pacto e dois auditores armados.',
    eliteKind: 'miniboss',
    passiveId: 'time-stop',
    passiveName: 'JUROS COMPOSTOS',
  },
  {
    id: 'mb-dawn-herald',
    name: 'A ARAUTO DA AURORA',
    title: 'Mini-boss · estágio 17',
    bio: 'Anuncia o amanhecer puxando o sol pelo cabelo. Quando ela aparece, é manhã — você gosta ou não.',
    entry: 'Hoje é o dia que termina com você.',
    gloat: 'Saudações ao novo dia. (Você não vê.)',
    underlordKill: 'A aurora não veio. A noite é minha de novo.',
    taunts: [
      'Acorda, vilão. (Pra última vez.)',
      'O sol pediu desculpas pelo que vou fazer.',
      'Café da manhã: você.',
    ],
    entourage: ['red', 'wyrmling', 'pyrelich'],
    entourageLabel: 'Um wyrm-filhote, um pyrelich e um pirômano da escolta solar.',
    eliteKind: 'miniboss',
    passiveId: 'phase',
    passiveName: 'EM FASE COM O SOL',
  },

  /* ============================================================
   * BOSSES (6) — endgame encounters. Heliarch (above) is also a
   * boss. Together they cover stages 18-23 and the Eternity Loop.
   * ============================================================ */

  {
    id: 'boss-iron-pope',
    name: 'O PAPA-FERRO',
    title: 'BOSS · estágio 18',
    bio: 'Papa eleito por aclamação dos canhões. Não fala — só decreta. Cada decreto vira uma cunha de ferro no seu peito.',
    entry: 'Eu sou a Igreja. Eu sou o Estado. Eu sou o ferro.',
    gloat: 'Bula póstuma assinada. Bem-vindo ao Inferno administrado por mim.',
    underlordKill: 'O Papa-Ferro derrete. O molde fica. O próximo papa já está no forno.',
    taunts: [
      'Excomungar é arte. Esculpo em você.',
      'Pulpito de aço. Sermão de bigorna.',
      'Vou te bater com o catecismo. (Edição encadernada em chumbo.)',
    ],
    entourage: ['behemoth', 'oracle', 'thornbeast', 'crowlord'],
    entourageLabel: 'Comitiva pesada: colosso, profeta, caçador e corvo-conselheiro.',
    eliteKind: 'boss',
    passiveId: 'aura-rage',
    passiveName: 'AURA DOGMÁTICA',
  },
  {
    id: 'boss-tide-empress',
    name: 'A IMPERATRIZ DAS MARÉS',
    title: 'BOSS · estágio 19',
    bio: 'Saiu do mar com tridente próprio e contrato de exclusividade. O oceano é dela; o continente, em negociação.',
    entry: 'A maré vai e volta. Você só vai.',
    gloat: 'Afogamento controlado. Selo de qualidade real.',
    underlordKill: 'A maré recua. A coroa fica. (Eu fico com a coroa.)',
    taunts: [
      'Cada onda lembra de você. Eu, também.',
      'Submersa, Submersa, Submersa — não eu, VOCÊ.',
      'Aprenda a nadar em sangue.',
    ],
    entourage: ['tidesinger', 'tidesinger', 'leech', 'wyrmling'],
    entourageLabel: 'Coral aquático: duas cantoras-da-maré, uma sanguessuga e um wyrm.',
    eliteKind: 'boss',
    passiveId: 'lifesteal',
    passiveName: 'MARÉ DE SANGUE',
  },
  {
    id: 'boss-time-warden',
    name: 'O GUARDIÃO DO TEMPO',
    title: 'BOSS · estágio 20',
    bio: 'Vive em outro fluxo de tempo. Está sempre meio segundo à frente. Já viu sua morte; quer marcar de novo.',
    entry: 'Já te vi cair. Vou te ver cair de novo. E de novo.',
    gloat: 'Próximo ciclo, mesmo final. Eu saboreio.',
    underlordKill: 'Quebrei o relógio. Agora o tempo é meu também.',
    taunts: [
      'Você já está morto. Só não percebeu.',
      'Atraso seu, vilão.',
      'Eu já joguei essa partida. Spoiler: você perde.',
    ],
    entourage: ['oracle', 'oracle', 'wyrmling', 'crowlord'],
    entourageLabel: 'Dois oráculos sincronizados, um wyrm voador e um corvo-mestre.',
    eliteKind: 'boss',
    passiveId: 'time-stop',
    passiveName: 'BIFURCAÇÃO TEMPORAL',
  },
  {
    id: 'boss-final-hero',
    name: 'O HERÓI FINAL',
    title: 'BOSS · estágio 21',
    bio: 'É TODOS os heróis que você matou, agora num só corpo. Tem o ego de Daggor, a fúria de Blazborn, o blá-blá do Padre Gregórius.',
    entry: 'Sou todos eles. Aliás — sou TODOS eles juntos. (Eu lembro de cada um.)',
    gloat: 'Vinte e tantos heróis dentro de um. Vinte e tantos motivos pra você ter morrido.',
    underlordKill: 'Vinte e tantas almas sopradas pra fora num só sopro. Foi terapêutico.',
    taunts: [
      'Bryan diz oi. Tyrella manda a fatura. Daggor pede pra postar.',
      'Você matou todos nós. Nós somos um. Adivinha o resto.',
      'O reino confiou em mim. Erro deles. Erro fatal pra você.',
    ],
    entourage: ['ravager', 'crowlord', 'pyrelich', 'thornbeast'],
    entourageLabel: 'Coro dos caídos: carrasco, corvo, pyrelich e caçador-de-feridos.',
    eliteKind: 'boss',
    passiveId: 'enrage',
    passiveName: 'EGO COLETIVO',
  },
  {
    id: 'boss-author',
    name: 'O AUTOR',
    title: 'BOSS · estágio 22',
    bio: 'Escreveu este mundo. Vai escrever sua morte. Carrega a pena que assinou seu obituário ainda em rascunho.',
    entry: 'Já estava no roteiro. Você é só o terceiro ato.',
    gloat: 'Capítulo final entregue. Editorial muito satisfeito.',
    underlordKill: 'Continuação cancelada. Universo refundado. Sem você.',
    taunts: [
      'Próxima fala sua: "isso não pode estar acontecendo".',
      'Estou escrevendo enquanto você fala.',
      'Boa-fé editorial: eu te avisei.',
    ],
    entourage: ['oracle', 'spore', 'gargoyle', 'succubus'],
    entourageLabel: 'Personagens-arquétipo: profeta, praga, predador e tentadora.',
    eliteKind: 'boss',
    passiveId: 'phase',
    passiveName: 'PRIMEIRA RASURA',
  },
  {
    id: 'boss-eternity',
    name: 'A ETERNIDADE',
    title: 'BOSS FINAL · estágio 23',
    bio: 'O fim. Em pessoa. Não tem rosto, tem padrão. Não fala, tem ressonância. Mata você no presente, no passado e no futuro — simultâneos.',
    entry: 'Eu sou o que sempre foi. E o que finalmente vai parar.',
    gloat: 'O ciclo termina aqui. (Você termina aqui.)',
    underlordKill: 'A Eternidade caiu. O tempo continua. Eu venci o impossível.',
    taunts: [
      'Eu já te vi morrer. Em três tempos.',
      'Você vai esquecer essa luta. Eu, não.',
      'O que sempre foi, sempre será. (Você não.)',
    ],
    entourage: ['lich', 'pyrelich', 'crowlord', 'wyrmling', 'oracle'],
    entourageLabel: 'A corte do fim: arcanista, pyrelich, corvo-mestre, wyrm e oráculo.',
    eliteKind: 'boss',
    passiveId: 'revive',
    passiveName: 'CICLO ETERNO',
  },

  /* ============================================================
   * ASCENSION MINI-BOSSES (8) — passivos v11. Cada um regenera,
   * blinda, racha ou sangra de um jeito diferente. Insuportáveis
   * em escala industrial.
   * ============================================================ */

  {
    id: 'mb-rust-baron',
    name: 'O BARÃO ENFERRUJADO',
    title: 'Mini-boss · estágio 24',
    bio: 'Nobre de armadura tão velha que virou um problema de tétano com título de nobreza. Você arranca um pedaço dele e a ferrugem volta a crescer, marrom, viçosa, orgulhosa.',
    entry: 'Pode bater. Eu sempre volto — com mais óxido.',
    gloat: 'Ferro velho nunca morre. Você, sim. Que ironia metálica.',
    underlordKill: 'O Barão desmancha em flocos cor de sangue seco. Não dá nem pra reciclar.',
    taunts: [
      'Você arranha a tinta. A ferrugem é o que importa.',
      'Já fui aço polido. Hoje sou tétano com pedigree.',
      'Cada round eu fico mais oxidado e mais teimoso.',
    ],
    entourage: ['ironmaiden', 'golem', 'revenant'],
    entourageLabel: 'Uma dama-de-ferro espetada, um golem de sucata e um revenant que range as juntas.',
    eliteKind: 'miniboss',
    passiveId: 'regenerate',
    passiveName: 'OXIDAÇÃO ETERNA',
  },
  {
    id: 'mb-choir-mistress',
    name: 'A REGENTE DO CORO',
    title: 'Mini-boss · estágio 25',
    bio: 'Maestrina de um coral celeste que afina cantando e cura cantando ainda mais alto. Usa uma coroa de tubos de órgão e regência com as duas mãos enquanto seus fiéis se recompõem no compasso.',
    entry: 'Em dó maior, meus filhos. E que a graça os reconstrua.',
    gloat: 'Aplausos. De pé, de joelhos, ou de caixão — escolha sua claque.',
    underlordKill: 'O coro desafina pela primeira vez. Depois cala. Depois apodrece junto com a regente.',
    taunts: [
      'Você fere um, eu curo dois. É só matemática litúrgica.',
      'Meu coro não cansa. Treinei eles na base do terror sacro.',
      'Mais alto! MAIS ALTO! O Santo CNPJ está ouvindo.',
    ],
    entourage: ['seraphage', 'wisp', 'tidesinger'],
    entourageLabel: 'Um anjo-decaído soprano, um wisp que remenda e uma cantora-da-maré no contralto.',
    eliteKind: 'miniboss',
    passiveId: 'siphon-aura',
    passiveName: 'CORO CELESTE',
  },
  {
    id: 'mb-glass-tyrant',
    name: 'O TIRANO DE VIDRO',
    title: 'Mini-boss · estágio 26',
    bio: 'Déspota que mandou esculpir o próprio corpo em vidro temperado pra parecer eterno. Parece que vai estilhaçar a qualquer golpe, mas o desgraçado é grosso, opaco e absorve pancada como vitral de catedral cara.',
    entry: 'Frágil? Você que se quebra primeiro, plebeu.',
    gloat: 'Transparência total: eu vi você morrer e nem suei.',
    underlordKill: 'O Tirano racha do alto até a base, depois desaba numa avalanche de cacos que ninguém vai varrer.',
    taunts: [
      'Bate de novo. Eu mal senti o cosquinha.',
      'Vidro? Sim. Vidro à prova de você.',
      'Vejo direto através de você. Tédio puro.',
    ],
    entourage: ['colossus', 'bulwark', 'gargoyle'],
    entourageLabel: 'Um colosso impassível, um baluarte-muralha e uma gárgula que admira o reflexo.',
    eliteKind: 'miniboss',
    passiveId: 'colossal',
    passiveName: 'PELE DE VIDRO',
  },
  {
    id: 'mb-bog-saint',
    name: 'O SANTO DO BREJO',
    title: 'Mini-boss · estágio 27',
    bio: 'Eremita que se afogou em fé e em água parada, e voltou coberto de fungo abençoado. Quando você acha que matou, ele desova em dois santinhos menores, igualmente úmidos e igualmente convencidos.',
    entry: 'Da lama eu vim. Em lama eu te deixo. Amém.',
    gloat: 'Bendito o ventre do pântano que me multiplica.',
    underlordKill: 'O Santo estoura num gosma sacra — e dessa vez nada brota. Só fede.',
    taunts: [
      'Me mata e eu viro dois. É a parábola dos pães, versão mofo.',
      'O brejo é meu altar. Você é a oferenda.',
      'Cada esporo meu é um discípulo. Discípulo carnívoro.',
    ],
    entourage: ['spore', 'plaguelord', 'gravewither'],
    entourageLabel: 'Um esporo voador, um lorde-da-praga e um gravewither que sangra de longe.',
    eliteKind: 'miniboss',
    passiveId: 'split',
    passiveName: 'DESOVA SANTA',
  },
  {
    id: 'mb-dune-vizier',
    name: 'O VIZIR DAS DUNAS',
    title: 'Mini-boss · estágio 28',
    bio: 'Conselheiro de um sultão que ninguém nunca viu — porque o Vizir é quem manda há séculos. A cada round ele puxa um véu de areia que engole seus golpes antes que cheguem na pele perfumada.',
    entry: 'A areia me cobre, a areia me serve, a areia te enterra.',
    gloat: 'Sussurrei a sua sentença ao ouvido do trono. Já estava decidida.',
    underlordKill: 'O véu de areia desaba sem vento que o sustente. O Vizir vira só mais uma duna.',
    taunts: [
      'Cada round, um novo véu. Você nunca alcança a minha cara.',
      'Eu não governo. Eu apenas aconselho. Letalmente.',
      'A tempestade obedece a mim. Você obedece à tempestade.',
    ],
    entourage: ['dunestalker', 'dunestalker', 'mortar'],
    entourageLabel: 'Dois caçadores-de-dunas espreitando na poeira e um morteiro escondido na crista.',
    eliteKind: 'miniboss',
    passiveId: 'warding',
    passiveName: 'VÉU DE AREIA',
  },
  {
    id: 'mb-frost-abbot',
    name: 'O ABADE DO GELO',
    title: 'Mini-boss · estágio 29',
    bio: 'Monge de um mosteiro na tundra que fez voto de silêncio, de pobreza e de hipotermia. Cada toque dele te corta com lâmina de gelo, e o corte não fecha — fica sangrando que nem promessa de monge quebrada.',
    entry: 'Silêncio. O frio fala melhor do que eu.',
    gloat: 'Que a paz gélida esteja com você. Permanentemente.',
    underlordKill: 'O Abade descongela num poço d\'água benta e sangue. O voto, finalmente, foi rompido.',
    taunts: [
      'Cada toque meu sangra. É o meu voto de penitência — pra você.',
      'No mosteiro a gente jejua. Aqui, você esvazia.',
      'O gelo não perdoa. Eu fiz voto de imitá-lo.',
    ],
    entourage: ['revenant', 'gravewither', 'wisp'],
    entourageLabel: 'Um revenant que sangra a presa, um gravewither distante e um wisp que remenda os monges.',
    eliteKind: 'miniboss',
    passiveId: 'frostbite',
    passiveName: 'VOTO DE GELO',
  },
  {
    id: 'mb-gravewright',
    name: 'O COVEIRO-MOR',
    title: 'Mini-boss · estágio 30',
    bio: 'Cavou túmulo pra metade dos heróis que você matou e pra a outra metade que se matou sozinha. Anda cheio de gás de defunto e ressentimento — quando cai, explode levando junto quem estiver perto demais do buraco.',
    entry: 'Já cavei a sua cova. Vim só conferir as medidas.',
    gloat: 'Caixão sob medida. Cortesia da casa. A casa sou eu.',
    underlordKill: 'O Coveiro detona num cogumelo de gás verde. Cavou tantas covas que esqueceu de cavar a própria.',
    taunts: [
      'Me derruba e eu levo a vizinhança comigo. Tradição funerária.',
      'Toda essa gente que você matou? Eu organizei a logística.',
      'Cuidado onde pisa. Tem buraco fresco com seu nome.',
    ],
    entourage: ['voidling', 'gravewither', 'bone'],
    entourageLabel: 'Um voidling instável, um gravewither sepultureiro e um osso reaproveitado da última cova.',
    eliteKind: 'miniboss',
    passiveId: 'volatile',
    passiveName: 'ÚLTIMO SUSPIRO',
  },
  {
    id: 'mb-tax-seraph',
    name: 'O SERAFIM TRIBUTÁRIO',
    title: 'Mini-boss · estágio 31',
    bio: 'Anjo de seis asas e doze formulários que desceu do céu pra te cobrar imposto sobre cada inimigo abatido. A cada alma que ele recolhe, fica mais forte — porque pra ele matança é só receita acumulando juros.',
    entry: 'Abençoado seja o seu débito. Vamos somar com os meus juros.',
    gloat: 'Quitado em sangue, com correção monetária. Recibo no além.',
    underlordKill: 'O Serafim despenca contando moedas que não existem mais. Sonegou a própria morte e perdeu.',
    taunts: [
      'Cada um que eu colho aumenta minha alíquota de fúria.',
      'Juros sobre juros, vilão. A planilha celeste não perdoa.',
      'Você lucra uma morte, eu tributo três.',
    ],
    entourage: ['seraphage', 'succubus', 'crowlord'],
    entourageLabel: 'Um anjo-decaído fiscal, uma sedutora-de-contratos e um corvo-mestre que carimba os autos.',
    eliteKind: 'miniboss',
    passiveId: 'frenzy',
    passiveName: 'JUROS SOBRE JUROS',
  },

  /* ============================================================
   * VOID BOSSES (6) — o ato final. Meta, quebra de quarta parede,
   * e a verdade desconfortável: o último inimigo é quem está lendo.
   * ============================================================ */

  {
    id: 'boss-hollow-king',
    name: 'O REI OCO',
    title: 'BOSS · estágio 32',
    bio: 'Um rei sem reino, sem rosto e sem nada por dentro — só um trono que ecoa quando você grita. Tão vazio que os golpes entram, ressoam e voltam abafados, como reclamação em ouvidoria.',
    entry: 'Eu não tenho coração. Por isso nada que você faz me toca.',
    gloat: 'Bem-vindo ao meu vazio. Tem espaço de sobra agora.',
    underlordKill: 'O Rei Oco desaba e o trono engole o próprio eco. Por dentro, nunca houve ninguém.',
    taunts: [
      'Bate à vontade. O som se perde lá dentro.',
      'Reinar sobre o nada me deixou… resistente a tudo.',
      'Você procura meu cerne. Spoiler: não existe.',
    ],
    entourage: ['colossus', 'voidling', 'voidling', 'dreadnought'],
    entourageLabel: 'Um colosso oco, dois voidlings ecoando e um couraçado que dispara no vazio.',
    eliteKind: 'boss',
    passiveId: 'colossal',
    passiveName: 'TRONO OCO',
  },
  {
    id: 'boss-plague-mother',
    name: 'A MÃE DA PRAGA',
    title: 'BOSS · estágio 33',
    bio: 'Matriarca de tudo que apodrece, espalha e contagia. Pare-la não acaba a infecção — só a divide, porque maternidade pra ela é multiplicação descontrolada de horrores menores e mais ávidos.',
    entry: 'Venha conhecer minha ninhada. Ela tem fome de você.',
    gloat: 'Mais um filho meu nasce do seu cadáver. Que fofo.',
    underlordKill: 'A Mãe estoura numa última ninhada que não chega a respirar. A praga, enfim, fica órfã.',
    taunts: [
      'Me corta e eu pario dois. Sou fértil como pesadelo.',
      'Cada cria minha herda meu carinho. E meus dentes.',
      'Você não luta contra mim. Luta contra a minha família.',
    ],
    entourage: ['plaguelord', 'mawmother', 'spore', 'gravewither'],
    entourageLabel: 'A prole infecta: lorde-da-praga, mawmother devoradora, esporo e gravewither.',
    eliteKind: 'boss',
    passiveId: 'split',
    passiveName: 'NINHADA INFINITA',
  },
  {
    id: 'boss-mirror-self',
    name: 'O EU NO ESPELHO',
    title: 'BOSS · estágio 34',
    bio: 'É você. O Underlord. Refletido, idêntico, com a mesma raiva acumulada de 14 anos. Cada golpe que você desfere nele, ele devolve no exato instante — porque odiar a si mesmo sempre foi recíproco.',
    entry: 'Demorou pra chegar aqui. Eu estou esperando desde sempre — porque eu sou você.',
    gloat: 'Você se matou. Eu só fiquei assistindo de dentro do espelho.',
    underlordKill: 'O reflexo estilhaça. Por um segundo você não sabe quem ficou de pé. Decide não pensar nisso.',
    taunts: [
      'Cada ferida que me abre, eu abro em você. Justo, não?',
      'Eu conheço cada um dos seus rancores. São os meus.',
      'Não dá pra me vencer sem se vencer. Boa sorte com isso.',
    ],
    entourage: ['shade', 'wraith', 'revenant', 'voidling'],
    entourageLabel: 'Os seus próprios fantasmas: um assassino-sombra, um wraith, um revenant e um voidling — todos com o seu rosto.',
    eliteKind: 'boss',
    passiveId: 'thorns',
    passiveName: 'O REFLEXO',
  },
  {
    id: 'boss-unwritten',
    name: 'O NÃO-ESCRITO',
    title: 'BOSS · estágio 35',
    bio: 'Um personagem que o autor nunca terminou de escrever — meio nome, meia história, meia existência. Seus contornos piscam entre o rascunho e o nada, e o primeiro golpe de cada round atravessa o que ainda não foi definido.',
    entry: 'Eu sou [INSERIR FALA AMEAÇADORA AQUI]. Ainda estão decidindo meu arco.',
    gloat: 'Pelo menos eu existo o suficiente pra te apagar. Você não vira nem nota de rodapé.',
    underlordKill: 'O Não-Escrito se dissolve em tinta que nunca secou. Capítulo deletado. Sem rascunho de backup.',
    taunts: [
      'Metade de mim ainda é placeholder. Pena que a outra metade mata.',
      'O autor me abandonou no rascunho. Vou descontar em você.',
      'Você não pode ferir o que ainda não foi descrito direito.',
    ],
    entourage: ['wisp', 'banshee', 'oracle', 'gargoyle'],
    entourageLabel: 'Personagens de fundo sem nome: um wisp, uma banshee, um oráculo e uma gárgula — todos ainda em revisão.',
    eliteKind: 'boss',
    passiveId: 'phase',
    passiveName: 'AINDA EM RASCUNHO',
  },
  {
    id: 'boss-first-underlord',
    name: 'O PRIMEIRO UNDERLORD',
    title: 'BOSS · estágio 36',
    bio: 'Seu antecessor. O primeiro a fazer o pacto, o primeiro a apanhar de herói, o primeiro a jurar vingança — e o primeiro a se perder nela. Cada morte que ele causa o deixa mais forte e mais parecido com aquilo que ele jurou destruir.',
    entry: 'Eu segurei essa torre antes de você nascer. Vim ver se você merece o trono. Não merece.',
    gloat: 'O pacto sempre cobra. Hoje cobrou de você. Como sempre cobrou de mim.',
    underlordKill: 'O Primeiro tomba e te olha com algo entre alívio e inveja. O pacto, enfim, troca de dono de novo.',
    taunts: [
      'Cada um que eu derrubo me deixa mais faminto. Foi assim que eu virei isso.',
      'Você acha que é o vilão? Eu inventei o cargo.',
      'O pacto não te fortalece. Ele te consome devagar. Olha pra mim.',
    ],
    entourage: ['lich', 'wraith', 'pyrelich', 'crowlord', 'mawmother'],
    entourageLabel: 'A primeira corte sombria: arcanista, wraith, pyrelich, corvo-mestre e mawmother — os flagelos originais.',
    eliteKind: 'boss',
    passiveId: 'frenzy',
    passiveName: 'O PRIMEIRO PACTO',
  },
  {
    id: 'boss-the-reader',
    name: 'O LEITOR',
    title: 'BOSS FINAL · estágio 37',
    bio: 'Você. Não o Underlord — VOCÊ, do outro lado da tela, segurando o controle, lendo isto agora. O verdadeiro vilão desta história, que move o Underlord como peça e folheia o sofrimento dele por entretenimento. Quando quiser, vira a página e tudo congela.',
    entry: 'Você me lê. Eu te leio. Adivinha qual dos dois pode fechar o jogo a hora que quiser.',
    gloat: 'Você reinicia. Você tenta de novo. Eu só assisto de novo. Quem é o monstro aqui?',
    underlordKill: 'Por um instante a tela treme — e você, o Underlord, encara de volta quem te controla. Pela primeira vez, é o Leitor quem sente medo.',
    taunts: [
      'Vou virar a página e o seu turno simplesmente para de existir.',
      'Você sofre 14 anos. Eu fecho a aba e janto.',
      'Toda essa raiva sua… é só conteúdo pra mim. Pausa quando eu quiser.',
    ],
    entourage: ['oracle', 'banshee', 'shade', 'riftcaller', 'lich'],
    entourageLabel: 'As mãos invisíveis do Leitor: oráculo, banshee, assassino-sombra, riftcaller e arcanista — tudo que ele move por você.',
    eliteKind: 'boss',
    passiveId: 'time-stop',
    passiveName: 'VIRA A PÁGINA',
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

/** Get hero by id (search across the canon roster). */
export function getHeroById(id: string): Hero | null {
  return HEROES.find((h) => h.id === id) ?? null
}
