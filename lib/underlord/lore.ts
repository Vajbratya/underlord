/**
 * Underlord codex — the canonical lore reference.
 *
 * This is the single source of truth for worldbuilding the UI surfaces
 * (Codex screen, hero blurbs, intro panels, item flavor). Edit here and
 * every screen that displays it picks up the change automatically.
 *
 * Structure:
 *  - CODEX_SECTIONS: top-level tabs (Mundo, Coroas, Heróis, Subtorre,
 *    Calendário, Glossário). Each section has 3-6 entries.
 *  - Each entry: short title + full body. Body is plain-text markdown-ish:
 *    UI components split paragraphs on \n\n.
 */

export type CodexEntry = {
  id: string
  title: string
  /** One-line subtitle shown under the title. */
  subtitle?: string
  /** Body paragraphs joined by \n\n. */
  body: string
}

export type CodexSection = {
  id: string
  /** Section label shown in the tab bar. UPPERCASE looks best. */
  label: string
  /** Mood line under the section title. */
  blurb: string
  entries: CodexEntry[]
}

export const CODEX_SECTIONS: CodexSection[] = [
  {
    id: "mundo",
    label: "MUNDO",
    blurb: "Vael'Thrand. Sete reinos. Sete coroas. Seis caíram cedo.",
    entries: [
      {
        id: "vaelthrand",
        title: "Vael'Thrand",
        subtitle: "O continente que esqueceu como temer.",
        body: [
          "Vael'Thrand é um continente em forma de espinha — uma cordilheira central rachada longitudinalmente por uma fenda chamada A Garganta, com sete reinos espalhados nas costelas. No mapa antigo, eram desenhados como sete coroas penduradas num único pescoço. No novo, são sete capitais com franchise, fronteiras tributárias e turismo de aventura.",
          "O sol em Vael'Thrand nasce do leste como em qualquer outro lugar, mas o crepúsculo aqui dura quase duas horas — efeito de partículas de cinza ainda flutuando na alta atmosfera, herança da Guerra das Coroas. Isso fez do pôr-do-sol uma instituição cultural: cidades inteiras param para vê-lo, e os bardos cobram por hora.",
          "Há 14 séculos o continente vive em paz. Os heróis têm saudade.",
        ].join("\n\n"),
      },
      {
        id: "garganta",
        title: "A Garganta",
        subtitle: "A rachadura que come a luz.",
        body: [
          "A Garganta corta Vael'Thrand de norte a sul. Tem 4.000 metros de profundidade no ponto mais raso e ninguém mediu o mais fundo — três expedições tentaram, todas voltaram sem suas cordas e com tradutores especializados em insetos.",
          "No fundo da Garganta fica a Subtorre — sete andares invertidos escavados pelos primeiros Underlords. Um andar pra cada reino derrotado, um pra cada coroa sequestrada. O sétimo andar é onde o Pacto de Ferro foi selado. Onde você acordou.",
          "Os heróis modernos chamam a Garganta de \"Dungeon Premium\". Vendem ingressos.",
        ].join("\n\n"),
      },
      {
        id: "cinzas",
        title: "As Cinzas",
        subtitle: "O resíduo da última guerra.",
        body: [
          "Cinzas em Vael'Thrand não são metáfora. Quando um Underlord morria, o corpo dele virava cinza ativa — um pó negro que paira no ar, conduz magia residual, e tem cheiro de bronze quente.",
          "Em locais onde os primeiros seis Underlords caíram, a cinza ainda não baixou. Forma campos densos onde plantas não crescem e cavalos se recusam a entrar. Os habitantes dali chamam de Cinzeiro e fazem cerveja com a água filtrada do solo. Dizem que dá pesadelos lúcidos.",
          "Você é o sétimo. A sua cinza é especial. Ela ainda tem você dentro.",
        ].join("\n\n"),
      },
      {
        id: "magia",
        title: "Magia",
        subtitle: "Por que tudo dói.",
        body: [
          "Magia em Vael'Thrand não é energia limpa. É um empréstimo. Cada feitiço retira um pouco de calor, peso ou tempo do mundo, e devolve depois — geralmente nos lugares errados.",
          "Os Magos Brancos juram que aprenderam a equilibrar a conta. Os Magos Negros juram que isso é mentira de Mago Branco. Os dois estão certos pela metade.",
          "Os Underlords nunca lançaram feitiços. Nós comandamos quem lança.",
        ].join("\n\n"),
      },
    ],
  },

  {
    id: "coroas",
    label: "COROAS",
    blurb: "Sete reinos. Cada coroa, uma promessa quebrada.",
    entries: [
      {
        id: "submersa",
        title: "A Coroa Submersa",
        subtitle: "Sétima. Sua.",
        body: [
          "Forjada em ferro afundado — metal recolhido do fundo da Garganta antes da Subtorre existir. Não é prata, não é ouro, não brilha. Pesa o suficiente pra matar quem tentar usar sem ter sido escolhido.",
          "A Submersa é a única das sete coroas que nunca foi exibida em desfile. Os Underlords a usaram dentro da Subtorre, longe do sol. No Pacto de Ferro, ela foi enterrada com você no sétimo andar. Quando você acordou, ela ainda estava ali.",
          "Está agora na sua cabeça. Acostume-se ao peso.",
        ].join("\n\n"),
      },
      {
        id: "sol",
        title: "A Coroa do Sol",
        subtitle: "Primeira a cair.",
        body: [
          "A coroa do reino de Anthelion. Ouro batido em folhas finas, supostamente impossível de manchar. Caiu no terceiro ano da Guerra das Coroas, quando o segundo Underlord descobriu que ouro fino mancha sim, com sangue suficiente.",
          "Hoje fica no museu de Anthelion como peça central. Tem uma plaquinha de bronze: \"Devolvida em 814 sob negociação diplomática\". A plaquinha mente. Ninguém devolveu nada. O quinto Underlord deixou cair quando estava distraído.",
        ].join("\n\n"),
      },
      {
        id: "salgada",
        title: "A Coroa Salgada",
        subtitle: "Segunda. Do mar.",
        body: [
          "Reino marinheiro de Brython, na costa oeste. Coroa feita de coral fossilizado e dentes de tubarão-rei. Quando o segundo Underlord a tomou, jurou que ouvia o oceano sussurrar dentro dela. Os historiadores acham que era só zumbido — coral fossilizado faz isso.",
          "O zumbido continua. Ninguém usa.",
        ].join("\n\n"),
      },
      {
        id: "branca",
        title: "A Coroa Branca",
        subtitle: "Terceira. A que se defendeu mais.",
        body: [
          "Os Magos Brancos de Tor Eluin não tinham reino — tinham uma torre. A Coroa Branca era cristal fundido com lágrimas (literais) das três Arquímagas fundadoras. Resistiu a dois Underlords. Caiu no terceiro.",
          "Em 814, a Torre de Tor Eluin é uma escola pública. As Arquímagas atuais são três adolescentes prodígio que ainda não sabem o que tem no cofre.",
        ].join("\n\n"),
      },
      {
        id: "verde",
        title: "A Coroa Verde",
        subtitle: "Quarta. A coroa de musgo.",
        body: [
          "O Reino Verde nunca teve fronteira fixa. Os druidas de Sylven se moviam com as estações, e a coroa era de carvalho vivo, replantada a cada ano. O quarto Underlord queimou cada um dos sete carvalhos sagrados de uma vez. Não restou nada pra coroar.",
          "Em 814 os druidas plantam um oitavo carvalho a cada primavera. Ele morre antes do verão. Eles plantam de novo. Têm fé.",
        ].join("\n\n"),
      },
      {
        id: "ferrugem",
        title: "A Coroa de Ferrugem",
        subtitle: "Quinta. A que ninguém queria.",
        body: [
          "Reino mineiro de Karn. Coroa de ferro bruto, feia de propósito. Os reis de Karn acreditavam que vaidade era pior que qualquer Underlord. O quinto Underlord respeitou tanto a estética que tomou a coroa por puro fetiche.",
          "Karn ficou sem coroa por trezentos anos. Hoje têm uma de plástico moldado. Os mineiros riem de quem reclama.",
        ].join("\n\n"),
      },
      {
        id: "noiva",
        title: "A Coroa da Noiva",
        subtitle: "Sexta. A coroa que nunca foi usada.",
        body: [
          "Era pra ser entregue no casamento entre os dois últimos príncipes-irmãos de Vael'Thrand do norte e do sul, unindo as duas dinastias. O sexto Underlord chegou na cerimônia. Levou a coroa, os noivos, e o bolo.",
          "Em 814 a peça é considerada perdida. Está no quinto andar da Subtorre, na sala que você ainda não abriu.",
        ].join("\n\n"),
      },
    ],
  },

  {
    id: "herois",
    label: "HERÓIS",
    blurb: "Eles são insuportáveis. Você lembra o nome de cada um.",
    entries: [
      {
        id: "bryan",
        title: "Bryan, o Escolhido",
        subtitle: "Espadachim. 38 anos. Segundo casamento.",
        body: [
          "Bryan foi profetizado três vezes — uma como criança (legítima), uma como adolescente (cancelada), e uma como adulto (renegociada com clausula de exclusividade). Ele assina autógrafos com \"O Escolhido™\". Tem licenciamento.",
          "Como criança matou um basilisco. Como adolescente, matou um dragão menor. Como adulto, matou um carma. Cada vez ficou mais fácil e ele entendeu menos por quê.",
          "Já se divorciou da princesa Elenora. Casou-se de novo com a sobrinha dela. Os reinos preferem não comentar.",
        ].join("\n\n"),
      },
      {
        id: "tyrella",
        title: "Tyrella, a Reclamadora",
        subtitle: "Paladina. Indignação profissional.",
        body: [
          "Tyrella foi treinada na Ordem da Aurora pra defender os fracos. Aos 22 anos, descobriu que defender exigia trabalho de campo. Aos 23, descobriu que escrever cartas formais com selo de cera dava o mesmo XP.",
          "Hoje resolve problemas demandando reuniões com superiores. Já fez três Arquímagas chorarem por escrito. O escudo dela é bem polido — ela nunca o usou.",
          "Ainda assim, bate forte quando precisa. Você vai descobrir.",
        ].join("\n\n"),
      },
      {
        id: "daggor",
        title: "Daggor, o Influente",
        subtitle: "Bárbaro. 2.3M de seguidores no pergaminho.",
        body: [
          "Daggor foi o primeiro herói a perceber que matar coisas dá mais view se gravado. Levou um escriba dedicado pra cada quest. Hoje tem três escribas, um ilustrador e um agente em Anthelion.",
          "É forte de verdade — não fingiu pra crescer no pergaminho. Mas escolhe os monstros pelo apelo visual. Já recusou três contratos contra goblins porque \"goblins não rendem engajamento\".",
          "Vai gostar muito de você. Você é trending.",
        ].join("\n\n"),
      },
      {
        id: "sorrel",
        title: "Sorrel, a Curandeira",
        subtitle: "Clérigo. Olhos cansados.",
        body: [
          "Sorrel é a melhor curandeira viva. Não escolheu ser. Cresceu numa vila de fronteira que era atacada toda lua nova; aos 11 anos já costurava vísceras. Aos 30 não dorme mais sem fazer triagem mental dos pacientes.",
          "Os outros heróis não gostam dela. Ela cura todo mundo, inclusive inimigos, inclusive Underlords se eles entrarem na enfermaria dela. \"O juramento é o juramento\", ela diz. Bryan a ignora. Tyrella a denunciou três vezes.",
          "Sorrel é o motivo de você estar acordado. Ela achou seu corpo na escavação. Curou.",
          "Ela não sabia que era você.",
        ].join("\n\n"),
      },
      {
        id: "vex",
        title: "Vex, a Caçadora",
        subtitle: "Arqueira. Não fala. Acerta.",
        body: [
          "Ninguém sabe o nome de família de Vex. Ela apareceu há nove anos numa caçada, abateu um troll que era pra matar um esquadrão, e ficou. Não conta histórias. Não bebe. Não posta.",
          "Bryan tentou recrutar pra equipe oficial. Ela disparou três flechas no ombro dele em sequência sem virar a cabeça. Ele ainda chama isso de \"o teste\".",
          "Ela é a única que pode te dar trabalho.",
        ].join("\n\n"),
      },
      {
        id: "kael",
        title: "Kael, o Dragão-Cantor",
        subtitle: "Bardo de magia bélica. Voz absurda.",
        body: [
          "Kael canta e o ar quebra. Literalmente — a magia dele opera por ressonância, e ele afina ossos como cordas. Aprendeu a cantar com a avó, que aprendeu com a avó dela, que era um dragão pequeno.",
          "Em 814 Kael faz turnê. Tem três singles certificados em platina-mágica. Ainda assim, sai a campo. Diz que precisa de material novo.",
          "Você vai ser bom material.",
        ].join("\n\n"),
      },
    ],
  },

  {
    id: "subtorre",
    label: "SUBTORRE",
    blurb: "Sete andares invertidos. Você só conhece o sétimo.",
    entries: [
      {
        id: "estrutura",
        title: "Estrutura",
        subtitle: "Para baixo é para frente.",
        body: [
          "A Subtorre não tem teto — começa no nível do solo da Garganta e desce. Sete andares, cada um maior que o anterior. O primeiro tem 200 metros quadrados. O sétimo tem 30 quilômetros quadrados de salões intercomunicantes, escavados na rocha viva.",
          "Cada andar foi construído por um Underlord diferente. As marcas das ordens deles ainda estão nos arcos. A arquitetura piora à medida que você desce — não porque a engenharia regrediu, mas porque a paciência regrediu.",
          "Você está no sétimo. Pra subir até o primeiro, vai precisar reconquistar cada um.",
        ].join("\n\n"),
      },
      {
        id: "broods",
        title: "As Broods",
        subtitle: "Seu exército não é leal. É contratual.",
        body: [
          "As cinco linhagens de minions — Vermelha (sangue), Azul (osso), Verde (planta), Cinza (pedra), Negra (cinza pura) — não são raças. São pactos. Cada brood serve por um motivo específico, e o pacto pode ser rompido se você quebrar a cláusula.",
          "Os Vermelhos servem por raiva compartilhada. Os Azuis servem porque ainda não estão totalmente mortos. Os Verdes servem porque a floresta deles foi queimada. Os Cinzas servem porque foram esculpidos pra servir e não conhecem alternativa. Os Negros servem porque são a sua cinza, e não sabem que poderiam recusar.",
          "Trate cada um conforme o pacto. Eles trocam de lado se virem fraqueza.",
        ].join("\n\n"),
      },
      {
        id: "pacto-ferro",
        title: "O Pacto de Ferro",
        subtitle: "O selo que prendeu você.",
        body: [
          "Em 0 da era moderna, os sete reinos restantes assinaram o Pacto de Ferro: enquanto qualquer um deles existisse, nenhum Underlord poderia despertar. O selo foi forjado em ferro da Garganta — o mesmo metal da Coroa Submersa, ironicamente.",
          "O Pacto rachou porque os reinos esqueceram da parte da existência. Em 814 não existem sete reinos. Existem sete franquias. As franquias não contam. O selo soube disso antes de você.",
          "Sorrel foi quem destrancou. Ela não sabe disso ainda.",
        ].join("\n\n"),
      },
    ],
  },

  {
    id: "calendario",
    label: "CALENDÁRIO",
    blurb: "Um ano em Vael'Thrand tem 13 meses. O décimo terceiro é seu.",
    entries: [
      {
        id: "ano-do-selo",
        title: "Ano do Selo: 0",
        subtitle: "Quando a história moderna começou.",
        body: [
          "O calendário moderno conta desde a assinatura do Pacto de Ferro. \"0 do Selo\" é o ano em que você morreu pela primeira vez.",
          "Antes disso, cada reino contava o tempo desde a fundação da própria coroa. Era confuso. Documentos cruzados precisavam de cinco datas e uma nota de rodapé. O calendário unificado foi um dos poucos progressos genuínos do pós-guerra.",
        ].join("\n\n"),
      },
      {
        id: "presente",
        title: "Ano Presente: 814",
        subtitle: "Você acordou em 12 do Sétimo Mês.",
        body: [
          "Está calor. Vai esfriar.",
          "Sorrel é uma estagiária da expedição arqueológica de Tor Eluin. Bryan está em segundo casamento de seis meses. Daggor lançou single novo na semana passada. Tyrella está esperando resposta de uma carta formal que enviou em 811.",
          "Eles não sabem do seu retorno. Ainda.",
        ].join("\n\n"),
      },
      {
        id: "decimoterceiro",
        title: "O Décimo Terceiro Mês",
        subtitle: "Mês sem nome.",
        body: [
          "O calendário oficial tem 12 meses de 30 dias. Sobra um mês de 5 dias entre o último e o primeiro do ano seguinte. Não tem nome. Os astrônomos chamam de Pausa. Os bardos chamam de Solstício Negro. Os Underlords chamam de Hora.",
          "É no Décimo Terceiro Mês que selos enfraquecem. Pacto de Ferro foi feito num. Você acordou num. Vai terminar num.",
          "Faltam 4 meses pra ele.",
        ].join("\n\n"),
      },
    ],
  },

  {
    id: "glossario",
    label: "GLOSSÁRIO",
    blurb: "Termos que os heróis usam errado de propósito.",
    entries: [
      {
        id: "underlord",
        title: "Underlord",
        body: [
          "Não é Lorde do Submundo. É Lorde Subterrâneo. A diferença é importante. Lordes do Submundo governam mortos; Underlords governam o que está abaixo — que inclui mortos, mas também minérios, raízes, magia residual, ressentimento.",
          "Você é o sétimo, e o último vivo. Os outros seis viraram cinza. Você quase virou.",
        ].join("\n\n"),
      },
      {
        id: "minion",
        title: "Minion",
        body: [
          "Termo neutro. Os heróis usam como insulto, mas a palavra original em Vae'thri significa \"aquele que escolheu o pacto\". Cada minion seu fez uma escolha consciente. Lembre-se disso quando perder um.",
        ].join("\n\n"),
      },
      {
        id: "brood",
        title: "Brood",
        body: [
          "Linhagem. As cinco broods (Vermelha, Azul, Verde, Cinza, Negra) são como famílias estendidas — não literalmente parentes, mas vinculadas pelo mesmo pacto e pela mesma cinza. Brood Vermelha não cura Brood Azul. Brood Negra não fala com nenhuma das outras. Você é a única autoridade que pode comandar todas.",
        ].join("\n\n"),
      },
      {
        id: "cinza",
        title: "Cinza Ativa",
        body: [
          "Pó negro com magia residual. Forma-se quando um Underlord morre. Pode ser usada como combustível mágico, fertilizante (proibido), ou ingrediente de cerveja (também proibido, mas ninguém fiscaliza).",
          "Sua cinza ainda contém você. Cuidado com onde respira.",
        ].join("\n\n"),
      },
      {
        id: "selo",
        title: "Selo",
        body: [
          "Qualquer pacto vinculante feito em ferro da Garganta. Selos não podem ser quebrados por força — só por contradição interna. Foi assim que o Pacto de Ferro caiu: os reinos signatários deixaram de existir como reinos, então a cláusula \"enquanto os reinos existirem\" deixou de se aplicar.",
          "Tecnicamente legal. Os heróis vão argumentar.",
        ].join("\n\n"),
      },
    ],
  },
]
