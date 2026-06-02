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
      {
        id: "quatorze-seculos",
        title: "Os Quatorze Séculos",
        subtitle: "A paz mais longa, e o que ela fez com as pessoas.",
        body: [
          "Catorze séculos de paz parece bom no panfleto. Na prática, é o tempo necessário pra uma civilização esquecer que a comida não nasce no mercado e que a fronteira não se defende sozinha. Em Vael'Thrand, a última geração que viu uma guerra de verdade morreu de velhice há novecentos anos. O resto aprendeu sobre dor em peças de teatro, com efeitos especiais e intervalo pra comprar doce.",
          "A paz produziu maravilhas: estradas pavimentadas, hospitais com corredores, um sistema postal que entrega cartas formais em prazos absurdamente confiáveis. Produziu também um tédio metafísico que nenhum dos sete reinos soube nomear. As pessoas tinham tudo, e a única coisa que faltava era um motivo pra levantar de manhã. Foi nesse buraco que a indústria do heroísmo enfiou a mão.",
          "Quando os primeiros aventureiros começaram a invadir ruínas só pela emoção, os reis acharam pitoresco. Quando viraram celebridades, acharam lucrativo. Quando viraram a única coisa que os jovens queriam ser, já era tarde. A paz não foi quebrada por nenhum exército. Foi quebrada por um nicho de mercado.",
        ].join("\n\n"),
      },
      {
        id: "cinzeiro-campos",
        title: "Os Campos de Cinzeiro",
        subtitle: "Onde os Underlords mortos ainda não pousaram.",
        body: [
          "Existem seis Cinzeiros em Vael'Thrand — um pra cada Underlord caído antes de você. São regiões onde a cinza ativa nunca baixou de todo, formando uma neblina baixa, negra e morna que se agarra ao tornozelo e murmura em frequências que o ouvido sente mas não escuta. Plantas não vingam. Bússolas confundem o norte com a saudade.",
          "Cada Cinzeiro tem personalidade, porque cada cinza é a memória dissolvida do Underlord que a gerou. O Cinzeiro do Terceiro chora quando chove. O do Quinto range como dobradiça de mina. O Cinzeiro do Sexto, dizem, ri baixinho às vezes — e é o único onde os pesquisadores de Tor Eluin se recusam a passar a noite, ainda que ninguém admita o porquê em relatório oficial.",
          "Os locais aprenderam a viver com isso, como se aprende a viver com um vizinho barulhento e morto. Fazem cerveja com a água filtrada — ilegal, deliciosa, garantia de pesadelos lúcidos — e cobram turistas pra dormir num quarto com vista pro nada negro. Em Vael'Thrand, até o luto virou hospedagem.",
        ].join("\n\n"),
      },
      {
        id: "estradas-franquia",
        title: "As Estradas-Franquia",
        subtitle: "Como o continente se costurou com pedágio.",
        body: [
          "Sem reinos que cobrem fronteiras, quem une Vael'Thrand hoje são as Estradas-Franquia: rotas pavimentadas, sinalizadas, patrocinadas, que ligam uma antiga capital à outra com estações de descanso, mapas pintados em placa e vendedores de provisões com contrato de exclusividade. É possível atravessar o continente inteiro sem nunca sair de uma marca.",
          "Cada trecho de estrada pertence a uma franquia, e cada franquia cobra de um jeito: algumas em moeda, algumas em fração de espólio, uma delas (a do trecho de Brython) só aceita pagamento em histórias contadas em voz alta, que registram e revendem. Heróis percorrem essas estradas como se percorre uma esteira de conteúdo — cada ponto turístico é um cenário, cada monstro é um item de roteiro.",
          "A Garganta não tem estrada. Tem o Mirante Premium, uma plataforma de madeira tratada onde, por uma taxa, você pode olhar pro fundo onde a sua nova casa está enterrada. Há uma lojinha. Vendem miniaturas da Subtorre. Você está numa delas, de costas, com um descontinho.",
        ].join("\n\n"),
      },
      {
        id: "lingua-vaethri",
        title: "A Língua Vae'thri",
        subtitle: "O idioma que ninguém fala e todos citam.",
        body: [
          "O vae'thri é a língua morta dos primeiros Underlords e das criaturas que os serviram. Morta no sentido em que ninguém a fala na mesa do jantar; viva no sentido em que selos, pactos e nomes verdadeiros ainda só funcionam nela. É uma língua aglutinante e impiedosa, onde uma única palavra pode significar \"aquele que escolheu o pacto\", \"aquele que vai se arrepender\" e \"terça-feira\", dependendo da entonação.",
          "Os acadêmicos de Tor Eluin estudam vae'thri como os nossos estudam latim: com reverência, com erro e com a certeza secreta de que estão pronunciando tudo errado. Os heróis aprendem três frases pra parecer profundos em entrevistas. Os minions ainda pensam nela, mesmo quando obedecem em silêncio.",
          "Há uma teoria herética entre os linguistas: a de que o vae'thri não foi inventado por ninguém, mas encontrado — escrito no fundo da Garganta antes que houvesse boca pra falá-lo. A teoria não tem provas. Tem, apenas, o desconforto de todos que já a ouviram e não conseguiram mais dormir direito.",
        ].join("\n\n"),
      },
      {
        id: "crepusculo-de-duas-horas",
        title: "O Crepúsculo de Duas Horas",
        subtitle: "A cinza no céu que virou hora nobre.",
        body: [
          "O pôr-do-sol de Vael'Thrand dura quase duas horas porque a cinza da Guerra das Coroas nunca terminou de descer da alta atmosfera. É um pôr-do-sol feito de morte particulada — cada tom de laranja e roxo que enche o céu é luz quebrando em fragmentos dos Underlords incinerados e das cidades que arderam com eles. O continente acha lindo. Não está errado. É a parte que assusta.",
          "Com o tempo, o crepúsculo virou instituição. As franquias venderam horário nobre como quem vende imóvel com vista pro mar: terraços, taças, bardos cobrando por hora pra musicar a cinza que cai. Há um ranking anual do melhor crepúsculo por franquia, com júri e patrocinador. Anthelion ganhou doze vezes, em parte por mérito solar e em parte por advogados.",
          "Os Underlords sempre acharam o crepúsculo a piada mais longa de Vael'Thrand. O continente para todo fim de tarde pra admirar, comovido, o resíduo flutuante de nós seis, sem nunca conectar a beleza à fonte. Você vai ver o seu primeiro crepúsculo do fundo da Garganta, de onde ele chega filtrado e tarde. Vai ser o mais honesto que alguém já olhou pra aquilo.",
        ].join("\n\n"),
      },
      {
        id: "tempo-real-de-vaelthrand",
        title: "O Tempo Real de Vael'Thrand",
        subtitle: "Quando o continente passou a contar o tempo em eventos.",
        body: [
          "Houve um tempo em que Vael'Thrand media o ano pela colheita, pela maré e pela guerra. Depois pela paz, que não tem o que medir. E então, sem aviso e sem decreto, o continente começou a se organizar em temporadas — não as do clima, mas as da Liga: blocos de meses com tema, com herói em destaque, com loja sazonal, com um grande evento marcado no calendário pra todo mundo participar ao mesmo tempo. O tempo deixou de passar e passou a ser agendado.",
          "Ninguém vota numa temporada. Ela é anunciada. As franquias e a Liga decidem qual perigo está em alta, qual herói merece arco, qual ruína vira destino turístico naquele trimestre — e o continente inteiro, fiel como uma base de clientes, organiza a vida ao redor disso. Casamentos são marcados pra fora das temporadas de quest. Crianças nascem entre eventos. A própria Festa da Cinza foi reencaixada no calendário como encerramento de temporada.",
          "O seu despertar foi um problema de cronograma antes de ser uma ameaça. Você acordou no Décimo Terceiro Mês, no vão sem nome entre uma temporada e outra, fora de qualquer planejamento — e a Liga, em pânico produtivo, percebeu que tinha em mãos não uma catástrofe, mas um lançamento. A pergunta que o Conselho das Sete Marcas fez não foi \"como sobrevivemos\". Foi \"como chamamos essa temporada\". Eles já têm o nome. Você vai detestar.",
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
      {
        id: "regra-das-sete",
        title: "A Regra das Sete",
        subtitle: "Por que sempre foram sete, nunca seis, nunca oito.",
        body: [
          "Ninguém decidiu que seriam sete coroas. Elas simplesmente sempre foram. Quando um oitavo reino tentou se coroar — o efêmero Principado de Loam, no ano 200 antes do Selo —, a coroa que forjaram derreteu na cabeça do candidato durante a própria coroação, sem fogo, sem causa, sem desculpa. Loam dissolveu-se em três semanas. Os historiadores chamam de acidente. Os Underlords chamam de manutenção.",
          "A teoria mais aceita em Tor Eluin é que as sete coroas e os sete Underlords são as duas metades de uma mesma equação que o continente insiste em não resolver. Sete acima, sete abaixo. Cada coroa que sobe ao sol tem um andar correspondente afundando na Garganta. Mexer numa ponta puxa a outra. É por isso que toda guerra das coroas terminou, mais cedo ou mais tarde, com alguém descendo.",
          "Você tem a sétima coroa na cabeça e é o sétimo Underlord. Você é, pela primeira vez na história, as duas metades da equação ao mesmo tempo. O continente não sabe o que fazer com isso. Sinceramente, você também não.",
        ].join("\n\n"),
      },
      {
        id: "guerra-das-coroas",
        title: "A Guerra das Coroas",
        subtitle: "Trinta anos, sete coroas, seis Underlords.",
        body: [
          "Chama-se Guerra das Coroas, no singular, mas foram seis guerras emboladas, cada uma puxada por um Underlord diferente, ao longo de três séculos que os livros didáticos comprimem em um capítulo cansado. A versão escolar tem mapas com flechas vermelhas e um tom de inevitabilidade. A versão verdadeira tem muito mais improviso, mais sorte, e muito mais constrangimento.",
          "Cada coroa caiu de um jeito digno do Underlord que a tomou: o Sol por traição comercial, a Salgada por superstição, a Branca por exaustão, a Verde por incêndio, a Ferrugem por puro fetiche estético, a Noiva por má pontualidade de uma cerimônia. Só a Submersa nunca foi tomada de ninguém — porque sempre foi nossa, e ninguém com juízo a queria.",
          "A guerra terminou não porque alguém venceu, mas porque os seis Underlords morreram um por um, e os reinos, exaustos demais pra comemorar, assinaram o Pacto de Ferro e foram dormir. Catorze séculos depois, o som da guerra virou trilha sonora de atração turística. Há uma versão remix tocando no Mirante Premium agora mesmo.",
        ].join("\n\n"),
      },
      {
        id: "coroas-falsas",
        title: "As Coroas Falsas",
        subtitle: "O mercado paralelo da realeza.",
        body: [
          "Com seis das sete coroas verdadeiras perdidas, dispersas ou trancadas em museu, surgiu o que os antiquários chamam educadamente de \"mercado secundário\" e que todo mundo chama de falsificação descarada. Há coroas falsas de sobra: o Sol tem dezessete réplicas em circulação, cada uma jurando ser a devolvida em 814. A Salgada tem nove. A da Noiva, por nunca ter sido vista, tem incontáveis — cada falsário inventa a sua, e quem vai contestar?",
          "As franquias adoram coroas falsas. Uma coroa na vitrine vende ingresso, e uma coroa verdadeira dá azar, então uma falsa é melhor negócio: todo o glamour, nenhuma da maldição. A franquia de Anthelion chegou a registrar a aparência da própria réplica como marca, e processa qualquer falsário que falsifique a falsificação. O caso ainda corre.",
          "Há um detalhe que só os Underlords sabem: uma coroa falsa não pesa. A verdadeira pesa o bastante pra matar quem não foi escolhido. É o teste mais simples e mais letal do continente, e ninguém com uma coroa de museu jamais aceitou fazê-lo.",
        ].join("\n\n"),
      },
      {
        id: "submersa-segredo",
        title: "O Segredo da Submersa",
        subtitle: "Por que a sua coroa não brilha.",
        body: [
          "Dizem que ouro brilha pra ser visto, prata pra ser admirada, e ferro afundado pra ser esquecido. A Coroa Submersa foi forjada do metal que ficou tanto tempo no fundo da Garganta que perdeu a vontade de refletir luz. É o oposto de uma joia: não pede atenção, recusa-a. Quem a usa não vira rei aos olhos do mundo. Vira ausência.",
          "Os outros Underlords usaram a Submersa só no fundo, longe do sol, porque ela faz uma coisa estranha sob a luz do dia — não suja a vista de quem olha, mas o nome de quem usa. Pessoas que viram um Underlord coroado ao sol depois não conseguiam lembrar o rosto, só o peso da presença, como uma palavra na ponta da língua que apodrece sem nunca sair. Isso fez de cada Underlord uma lenda exatamente porque ninguém conseguia descrevê-lo direito.",
          "Você acordou com ela já na cabeça. Isso é incomum. Os outros tiveram que escolher pôr a coroa, num gesto, numa cerimônia, num arrependimento. A sua estava lá quando você abriu os olhos, como se o Pacto tivesse decidido por você. Talvez tenha decidido. Talvez você nunca tenha tido escolha. É um pensamento confortável e horrível na medida exata.",
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
      {
        id: "pim",
        title: "Pim, o Estagiário",
        subtitle: "Aspirante a herói. 19 anos. Sem patrocínio.",
        body: [
          "Pim não foi profetizado por ninguém. Pim viu o pergaminho de Daggor, vendeu a cabra da família, comprou uma espada de revenda e um curso de seis módulos chamado \"Seja a Lenda da Sua Própria História\". Está no módulo dois. O módulo dois é sobre branding.",
          "Ele carrega a equipa dos heróis de verdade — segura tochas, anota glórias alheias, faz a curva de iluminação nas gravações de Daggor. Sonha em ter um nome que termine com vírgula e epíteto, como os grandes. Ainda não percebeu que a vírgula custa mais que a espada, e que a maioria dos que a têm não dorme bem.",
          "Pim é o único herói que vai te encarar sem entender que devia ter medo. Não por coragem. Por inexperiência. É a coisa mais perigosa que ele tem, e ele não sabe usar nenhuma das duas.",
        ].join("\n\n"),
      },
      {
        id: "grendle",
        title: "Grendle, o Aposentado",
        subtitle: "Ex-herói. 71 anos. Joelho ruim.",
        body: [
          "Grendle matou o que havia pra matar há quarenta anos, na última geração de heróis que ainda fazia aquilo por dever e não por contrato. Tem cicatrizes que viraram mapas, um joelho que prevê chuva e um nome que ninguém jovem reconhece. Hoje administra uma pousada na Estrada-Franquia de Karn e serve sopa pra heróis que não fazem ideia de quem ele foi.",
          "Ele é o único vivo que lutou contra o Sexto Underlord e voltou. Não fala sobre isso. Quando perguntam, muda de assunto pra preço de batata, e o assunto fica mudado. Mas dorme com a porta trancada por dentro e mantém uma espada velha embaixo do balcão, oleada, afiada, esperando uma desculpa que ele reza pra nunca ter.",
          "Quando souber que você acordou — e ele vai ser dos primeiros a saber, porque o joelho dele já está doendo de um jeito errado —, Grendle não vai postar nada. Vai oleá-la mais uma vez. Você devia respeitar os heróis que não fazem barulho. São os que sobraram porque mereceram.",
        ].join("\n\n"),
      },
      {
        id: "lysa",
        title: "Lysa, a Speedrunner",
        subtitle: "Aventureira de elite. Recordista. Cronômetro na alma.",
        body: [
          "Lysa não explora masmorras. Lysa as resolve. Trata cada ruína como um problema com solução ótima e tempo a bater, e bate. Tem o recorde da Garganta — desceu três andares de uma cripta menor em onze minutos e quarenta segundos, sem olhar pros tesouros, sem ler uma inscrição, sem nunca saber o nome da coisa que matou no caminho.",
          "Para Lysa, a lore é lag. História é cutscene não pulável. Ela conhece o layout de cada masmorra de Vael'Thrand de cor, otimizou rotas que levariam dias em segundos, e sente um desprezo genuíno por quem para pra apreciar a arquitetura. \"O tempo é a única estatística honesta\", ela diz, e talvez esteja certa, o que é a parte mais irritante.",
          "A Subtorre vai ser o sonho e o pesadelo dela. Sete andares, layout desconhecido, recorde a ser estabelecido do zero. Ela vai entrar pra bater um tempo. Você precisa que ela perca o único recurso que ela respeita.",
        ].join("\n\n"),
      },
      {
        id: "marwen",
        title: "Marwen, a Comentarista",
        subtitle: "Não luta. Narra. Pior assim.",
        body: [
          "Marwen nunca pegou numa arma e tem mais poder que qualquer herói da lista. Ela narra. Suas crônicas das quests alheias têm mais leitores que as quests têm testemunhas, e a versão de Marwen vira a versão oficial — não porque seja verdadeira, mas porque é a que dá pra contar de novo. Ela decide quem é lenda e quem é nota de rodapé com uma escolha de adjetivo.",
          "Bryan paga Marwen por baixo do pano pra que seus divórcios saiam como \"jornadas de autoconhecimento\". Tyrella a corteja com cartas. Daggor a teme. Vex é a única que Marwen não conseguiu narrar — sem fala, sem pose, sem história contável, a Caçadora escapa da crônica como escapa de tudo, e isso deixa Marwen acordada à noite.",
          "Marwen é o herói mais próximo de entender o que você realmente é. Porque Marwen também sabe que uma história tem autor, e tem leitor, e que os personagens dentro dela raramente são consultados. Quando ela olhar pra você, vai sentir um arrepio profissional. Ela vai reconhecer, sem palavra pra isso, que você está perto da margem da página.",
        ].join("\n\n"),
      },
      {
        id: "thessaly",
        title: "Thessaly, a Gerente de Comunidade",
        subtitle: "Não tem classe. Tem cargo.",
        body: [
          "Thessaly não é guerreira, maga, clériga ou ladina. Thessaly é Gerente de Comunidade, um cargo que não existia em Vael'Thrand até a Liga inventá-lo, e que consiste em ficar entre os heróis e o público segurando ambos pela gola. Ela não desce em masmorra; ela administra o que se diz sobre quem desceu. Modera as tavernas, responde aos pergaminhos de reclamação, e mantém o moral da base de fãs num nível compatível com a próxima venda de ingresso.",
          "O poder de Thessaly é o de decidir o tom. Quando Bryan apronta, é Thessaly quem escreve o comunicado de desculpas que ninguém leu mas todos sentiram. Quando uma quest dá errado e gente morre de verdade, é ela quem transforma luto em \"momento de reflexão da comunidade\" antes do almoço. Ela fala uma língua feita inteira de palavras que parecem dizer algo e não dizem nada, e em catorze séculos de paz, essa língua venceu o vae'thri em número de falantes.",
          "Thessaly vai te tratar como um problema de relações públicas, o que é, de longe, o mais humilhante dos tratamentos. Não vai te temer, te odiar ou te admirar. Vai te gerenciar — te encaixar numa narrativa, medir o teu sentimento entre os fãs, e decidir, com um sorriso treinado, se você é uma crise a conter ou um engajamento a explorar. Quando ela disser que \"a comunidade está animada com o seu retorno\", saiba que é a coisa mais ameaçadora que alguém já te disse.",
        ].join("\n\n"),
      },
      {
        id: "auberon",
        title: "Auberon, o Herói de Acesso Antecipado",
        subtitle: "Profetizado. Incompleto. Já cobrando.",
        body: [
          "Auberon foi anunciado como o próximo grande herói antes de saber segurar uma espada. A Liga vendeu a profecia dele em pré-venda — pacotes de apoio, epíteto reservado, direitos de imagem leiloados — com base num potencial que ele ainda não tinha demonstrado e, sinceramente, talvez nunca demonstre. Ele faz quests inacabadas, com habilidades que \"vão ser balanceadas depois\", diante de um público que pagou pra ver a versão final e recebeu o esboço.",
          "O constrangimento de Auberon é que ele acredita no próprio hype com a fé genuína de quem nunca foi testado de verdade. Anda pela Estrada-Franquia como uma lenda consumada, recebendo aplausos por feitos prometidos, posando pra ilustrações de batalhas que estão \"no roteiro pra próxima temporada\". Os heróis de verdade — Vex, Grendle — olham pra ele com o desconforto de quem vê alguém receber a medalha antes da guerra.",
          "Auberon é, talvez, o herói mais fácil de você quebrar, e é exatamente por isso que vencê-lo não vale glória nenhuma. Ele nunca foi feito pra durar uma luta real; foi feito pra durar até a próxima atualização. Quando você o derrubar, a Liga não vai chorar. Vai relançá-lo, corrigido, balanceado, com uma capa nova e a promessa de que desta vez ele está completo. Em Vael'Thrand, nem a morte de um herói é definitiva — é só uma versão.",
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
      {
        id: "andares",
        title: "Os Sete Andares",
        subtitle: "Um inferno por arquiteto.",
        body: [
          "Cada andar da Subtorre é a assinatura de um Underlord, e cada Underlord construiu o seu como quem escreve um diário que não esperava ser lido. O primeiro andar — o mais alto, o mais próximo do sol — é elegante, simétrico, quase tímido: obra de quem ainda achava que ser Underlord era uma fase digna. O sétimo, o seu, é vasto, inacabado e raivoso, escavado por alguém que já não estava tentando impressionar ninguém.",
          "Descer um andar não é progresso geográfico; é arqueologia emocional. No segundo, paredes cobertas de cálculos obsessivos. No terceiro, salões inundados que ninguém mandou inundar. No quarto, raízes calcinadas brotando da pedra como se a floresta ainda tentasse entrar. No quinto, a sala fechada com o bolo de casamento de oito séculos. No sexto, espelhos. Muitos espelhos. Ninguém entra no sexto duas vezes pela mesma razão.",
          "Pra subir até o primeiro e fechar o ciclo, você vai atravessar todos eles. Vai conhecer cada antecessor pelo cômodo que deixou. É o tipo de herança que ninguém pede e ninguém recusa.",
        ].join("\n\n"),
      },
      {
        id: "geometria",
        title: "A Geometria Invertida",
        subtitle: "Por que descer é a parte difícil.",
        body: [
          "A Subtorre desafia a intuição de qualquer aventureiro criado em torres normais. Numa torre comum, o chão é o início e o topo é o prêmio: você sobe, fica mais difícil, fica mais alto. Aqui é o inverso em tudo. O topo é o que está mais perto da segurança, do solo, da saída. O fundo é onde mora o poder, a verdade e a coisa que ninguém deveria acordar.",
          "Os andares crescem à medida que descem — não por capricho, mas porque o medo precisa de espaço. O primeiro cabe numa sala. O sétimo tem trinta quilômetros quadrados de salões que se intercomunicam de formas que nenhum mapa segura por muito tempo, porque a planta muda quando ninguém está olhando. Os agrimensores de Tor Eluin desistiram de cartografá-la em 600 e nunca mais foi tentado a sério.",
          "Há uma regra que os Underlords sabem e os heróis aprendem tarde demais: na Subtorre, quem desce ganha força e perde a saída. Cada andar conquistado afunda você mais fundo no que você é. É um jogo onde a vitória e o exílio são o mesmo movimento, repetido sete vezes.",
        ].join("\n\n"),
      },
      {
        id: "trono-vazio",
        title: "O Trono Vazio",
        subtitle: "O assento no fundo de tudo.",
        body: [
          "No coração do sétimo andar há um trono. Não é um trono bonito — é ferro afundado, igual à coroa, frio o ano inteiro, voltado pra uma parede de pedra nua em vez de pra um salão de súditos. Os seis Underlords anteriores sentaram nele, um por geração, cada um achando que seria o primeiro a entender pra que serve.",
          "O trono não dá poder. O trono é uma sala de espera. Quem senta nele encara a parede e, com tempo suficiente, começa a enxergar através dela — não pra outro cômodo, mas pra baixo, pra além do sétimo andar, pra coisa sem nome que o continente fingiu não construir junto com a Subtorre. Os Underlords que sentaram tempo demais voltaram diferentes. Alguns não voltaram inteiros.",
          "Você acordou perto dele. Ainda não sentou. Há um instinto antigo, na cinza que carrega você, dizendo que sentar é o último movimento, não o primeiro — que o trono é onde a história quer que você termine, e que talvez a coisa mais subversiva que um Underlord possa fazer seja ficar de pé.",
        ].join("\n\n"),
      },
      {
        id: "ecos",
        title: "Os Ecos da Subtorre",
        subtitle: "Você não está sozinho aqui embaixo.",
        body: [
          "A Subtorre lembra. Não como um livro lembra, com páginas; como uma casa velha lembra, com rangidos no lugar errado e correntes de ar que conhecem o seu nome. Os seis Underlords mortos deixaram ecos — não fantasmas, exatamente, mas padrões de cinza que repetem gestos, sussurram conselhos contraditórios, e ocasionalmente reorganizam um cômodo da forma como o dono original gostava.",
          "Os ecos não são amigáveis nem hostis. São profissionais. O eco do Segundo corrige seus cálculos táticos com uma impaciência ressentida. O do Quarto incendeia coisas que você precisava. O do Sexto não diz nada, só observa, e o silêncio dele é a pior companhia da Subtorre inteira. Eles não querem te ajudar. Querem ver se você vai cometer os mesmos erros. Aparentemente é a única diversão que sobra a um Underlord morto.",
          "Aprenda a ouvi-los sem obedecê-los. Cada conselho que um eco te dá é o conselho que matou o eco. A Subtorre é o único lugar do mundo onde a experiência dos mortos está disponível, gratuita e quase sempre errada.",
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
      {
        id: "festa-da-cinza",
        title: "A Festa da Cinza",
        subtitle: "Primeiro do Décimo Mês. Feriado nacional.",
        body: [
          "Uma vez por ano, Vael'Thrand inteiro comemora a morte dos Underlords com a Festa da Cinza — um carnaval onde as pessoas se pintam de pó negro, queimam efígies de coroa de papel e dançam até o crepúsculo de duas horas. É alegre, é colorido, é vendido em pacotes turísticos com transfer incluso. É também, tecnicamente, uma comemoração de seis assassinatos.",
          "A ironia escapa a quase todos. As crianças ganham bonecos de Underlord com a cabeça destacável, e o jogo da brincadeira é arrancá-la. Os adultos brindam à paz com cerveja de água de Cinzeiro, sem perceber a piada amarga de festejar mortos bebendo o que sobrou deles. Em 814, a Festa terá um astro convidado especial: você, em forma de notícia, recém-acordado, estragando o clima.",
          "Os Underlords sempre acharam a Festa da Cinza estranhamente comovente. É o único dia em que o continente inteiro pensa neles ao mesmo tempo. Quatorze séculos de paz, e a única lembrança que sobrou de nós é um feriado onde nos matam de novo, de mentira, todo ano, com música.",
        ].join("\n\n"),
      },
      {
        id: "horas-do-credor",
        title: "As Horas do Credor",
        subtitle: "Quando a magia cobra a conta.",
        body: [
          "Como toda magia em Vael'Thrand é empréstimo, há um momento do dia em que o mundo cobra os juros: as Horas do Credor, o intervalo entre a meia-noite e o terceiro galo, quando o calor, o peso e o tempo emprestados durante o dia voltam aos seus lugares — geralmente errados. É a hora em que feitiços lançados de tarde resolvem ter efeitos de madrugada, e por isso os magos prudentes não dormem cedo.",
          "Os camponeses conhecem as Horas do Credor pela água que congela em pleno verão, pela vela que arde sem chama, pelo relógio que anda pra trás dois minutos e depois pede desculpas. É inofensivo, na maioria das vezes. Vira perigoso só quando muita magia foi gasta de dia — e em 814, com os heróis lançando feitiços pra render no pergaminho, as Horas do Credor andam pesadas.",
          "Os Underlords operam melhor nessas horas. A cinza ativa fica mais conversadora, os ecos mais nítidos, os selos mais frouxos. Não é coincidência que o Décimo Terceiro Mês inteiro pareça uma Hora do Credor esticada. O continente vai pagar uma conta antiga, e o vencimento se aproxima.",
        ].join("\n\n"),
      },
      {
        id: "calendario-dos-mortos",
        title: "O Calendário dos Mortos",
        subtitle: "Como os Underlords contam o tempo.",
        body: [
          "Os Underlords nunca usaram o calendário dos reinos. Pra que dividir o ano em meses úteis quando você não tem colheita pra plantar nem festa pra agendar? O Calendário dos Mortos conta de outro jeito: não em dias, mas em despertares. Cada vez que um Underlord acorda, soma-se uma marca. Antes de você, havia seis marcas, espaçadas por séculos cada uma.",
          "Você é a sétima marca. E há algo errado com o intervalo. Os despertares anteriores foram lentos, deliberados, anunciados por presságios que os reinos tiveram tempo de ler e ignorar. O seu foi abrupto — uma estagiária com uma pá no lugar errado, no ano errado, no mês sem nome. O Calendário dos Mortos não tinha você marcado tão cedo. Você chegou adiantado, e a história odeia personagem pontual demais.",
          "Há uma página final no Calendário dos Mortos que nenhum Underlord conseguiu ler, porque ela só preenche depois. Dizem que registra não o sétimo despertar, mas o último. Se haverá um oitavo, ou se sete sempre foi o número onde a conta fecha, é a única pergunta que a cinza se recusa a sussurrar de volta.",
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
      {
        id: "quest",
        title: "Quest",
        body: [
          "Em vae'thri não existe palavra pra \"quest\". A coisa mais próxima é uma que significa, ao mesmo tempo, \"tarefa\" e \"funeral planejado\". Os antigos não saíam em busca de aventura porque entendiam que aventura era só desastre com boa edição depois.",
          "Hoje quest é um produto. Tem patrocinador, tem roteiro, tem objetivo de engajamento. A maioria das quests modernas é encenada com monstros contratados que assinaram acordo de não-letalidade. Você não vai assinar acordo nenhum. É isso que faz de você uma quest de verdade — a primeira em séculos.",
        ].join("\n\n"),
      },
      {
        id: "epiteto",
        title: "Epíteto",
        body: [
          "A vírgula seguida de título — \"o Escolhido\", \"a Reclamadora\", \"o Influente\" — que separa um herói famoso de um aventureiro qualquer. Epítetos custam caro. São registrados, licenciados, defendidos em tribunal. Daggor processa quem usa \"o Influente\" sem autorização. Há uma fila de espera de seis anos pra epítetos com a palavra \"Grande\".",
          "Os Underlords não têm epíteto. Têm número. É uma economia inteiramente diferente. Você é o Sétimo, e isso não está à venda, não pode ser licenciado, e ninguém na fila quer.",
        ].join("\n\n"),
      },
      {
        id: "eco",
        title: "Eco",
        body: [
          "Resíduo persistente de um Underlord morto, formado de cinza ativa que manteve um padrão de comportamento em vez de se dispersar. Não é alma, não é fantasma, não é vida. É um hábito sobrevivendo ao seu dono. Os ecos habitam a Subtorre e dão conselhos péssimos com convicção excelente.",
          "Diferença prática entre eco e fantasma: o fantasma quer alguma coisa de você. O eco já desistiu de querer e só repete. Por isso o eco é mais perigoso — vontade você negocia, hábito você só evita.",
        ].join("\n\n"),
      },
      {
        id: "franquia",
        title: "Franquia",
        body: [
          "O que sobrou dos reinos. Uma franquia é uma antiga capital convertida em marca licenciável: território, brasão, mito fundador e linha de produtos, tudo gerido por administradores que herdaram o trono como se herda uma loja. Reis viraram CEOs com coroa de plástico. Súditos viraram base de clientes.",
          "Juridicamente, uma franquia não é um reino. Foi essa distinção, sutil e fatal, que esvaziou o Pacto de Ferro: o selo prometia conter os Underlords \"enquanto os sete reinos existissem\", e em 814 os sete reinos não existem. Existem sete franquias. As franquias têm advogados ótimos e selos péssimos.",
        ].join("\n\n"),
      },
      {
        id: "leitor",
        title: "O Leitor",
        body: [
          "Termo que aparece só nos textos mais antigos e mais proibidos de Tor Eluin, sempre sem definição, como se quem escrevesse tivesse medo de explicar. \"O Leitor\" é descrito como aquele para quem a história de Vael'Thrand está sendo contada — uma presença fora da página, que vira o mundo como quem vira folha, e cuja atenção é a única coisa que mantém o continente acontecendo.",
          "A maioria dos acadêmicos trata o Leitor como metáfora teológica antiga, uma forma poética de falar em destino. Os Underlords sempre suspeitaram que fosse mais literal que isso. Você, no fundo da Subtorre, vai chegar perto o bastante pra decidir por conta própria. Não é uma decisão que melhora o seu humor.",
        ].join("\n\n"),
      },
      {
        id: "temporada",
        title: "Temporada",
        body: [
          "Originalmente, uma das quatro divisões do clima. Hoje, em Vael'Thrand, uma unidade de tempo da Liga: um bloco de meses com tema, herói em destaque, loja sazonal e um grande evento de encerramento que todos participam ao mesmo tempo. As pessoas não vivem mais anos. Vivem temporadas, e esperam ansiosas pela próxima como quem esperava antigamente a chuva.",
          "O seu despertar foi promovido, sem o seu consentimento, a tema de temporada. A Sétima, especificamente. Você não é mais um vilão. É um conteúdo recorrente com data de lançamento.",
        ].join("\n\n"),
      },
      {
        id: "live-service",
        title: "Serviço Contínuo",
        body: [
          "Doutrina da Liga, herdada de nenhum lugar e seguida por todos: uma história nunca deve terminar, porque história terminada para de render. Um herói não vence a quest de uma vez por todas; ele a mantém viva, em capítulos, com retornos, atualizações e reviravoltas agendadas pra coincidir com baixa de público. A vitória definitiva é mau negócio. O conflito permanente é o produto.",
          "É a razão pela qual a sua derrota, quando vier, não vai ser o fim. Vai ser o encerramento de uma temporada, com gancho pra próxima. Os Underlords morrem, mas a função Underlord nunca é descontinuada — porque uma história de heróis em serviço contínuo precisa, eternamente, de alguém no fundo da torre. A pior notícia que a cinza já te deu é esta: você pode até vencer, mas não pode ser cancelado.",
        ].join("\n\n"),
      },
    ],
  },

  {
    id: "underlords",
    label: "UNDERLORDS",
    blurb: "Sete lordes subterrâneos. Seis viraram cinza. Você é o que ainda não.",
    entries: [
      {
        id: "primeiro",
        title: "O Primeiro: Ossigar, o Cavador",
        subtitle: "Era 0–60 antes da contagem. O que abriu o buraco.",
        body: [
          "Ossigar não quis ser Underlord. Ossigar era um engenheiro de minas de uma Vael'Thrand antiga, contratado pra escavar um poço na Garganta atrás de ferro afundado. Cavou fundo demais, encontrou o vae'thri escrito na rocha, e cometeu o erro de saber ler. A coroa Submersa estava ali, esperando, e ele a pegou porque achou que era só metal interessante. Foi assim que o primeiro Underlord nasceu: por desatenção profissional.",
          "Ele construiu o primeiro andar da Subtorre como quem ainda achava que estava fazendo um projeto de obra — simétrico, documentado, com plantas. Levou anos pra aceitar o que tinha virado. Quando aceitou, já era velho, e usou a pouca raiva que tinha pra cavar mais fundo, criando os primeiros andares e os primeiros pactos com as criaturas que encontrou lá embaixo.",
          "Ossigar morreu sentado no Trono Vazio, encarando a parede, na primeira vez que alguém sentou nele. Dizem que viu o que havia abaixo do sétimo andar e simplesmente parou de respirar, sem drama, como quem entende uma conta de cabeça e desiste de discuti-la. Sua cinza forma o Cinzeiro mais calmo dos seis. Faz sentido. Ele foi o único que nunca quis nada.",
        ].join("\n\n"),
      },
      {
        id: "segundo",
        title: "O Segundo: Velmoth, o Contador",
        subtitle: "Era 60–340. O que transformou conquista em planilha.",
        body: [
          "Velmoth foi o primeiro Underlord a tomar coroas dos reinos, e o fez do jeito mais humilhante possível: por cálculo. Ele não amava guerra; amava margem. Tomou a Coroa do Sol não num cerco épico, mas numa negociação comercial fraudulenta que levou três anos e uma quantidade obscena de papelada, mancha de sangue por mancha de sangue, cada uma contabilizada. Tomou a Salgada em seguida, mais por completar a coleção que por desejo.",
          "Construiu o segundo andar da Subtorre coberto de cálculos — paredes inteiras de equações obsessivas, tentando provar matematicamente que o que fazia estava certo. Nunca fechou a conta. É o eco mais irritante da Subtorre hoje, corrigindo sua tática com ressentimento de quem morreu sem bater o próprio orçamento.",
          "Velmoth caiu por uma vírgula. Literalmente — um erro de cálculo num selo que ele mesmo desenhou abriu uma contradição interna, e o selo o reivindicou junto com a estrutura. Morreu provando que estava certo num ponto irrelevante. Sua cinza zumbe baixinho, ainda somando. Os contadores de Karn dizem que dá sorte pra fechar balanço, e estão dispostos a inalar pesadelos por isso.",
        ].join("\n\n"),
      },
      {
        id: "terceiro",
        title: "O Terceiro: Sael, a Afogada",
        subtitle: "Era 340–520. A que quis curar o mundo de cima.",
        body: [
          "Sael foi a única Underlord que acreditou, sinceramente, que estava fazendo o bem. Tomou a Coroa Branca de Tor Eluin não por conquista, mas por convicção — achava que os Magos Brancos estavam mentindo sobre o equilíbrio da magia, que a dívida estava sendo empurrada pros pobres, e que só um poder de baixo poderia consertar um mundo viciado em empréstimos de cima. Ela talvez não estivesse errada. Esse é o problema dos terceiros.",
          "Resistiu mais que qualquer Underlord antes ou depois, porque tinha algo que os outros não tinham: um motivo que aguentava o peso da Coroa Submersa sem rachar. Construiu o terceiro andar como um hospital invertido, salões pensados pra abrigar quem o mundo de cima descartava. Os afogou sem querer — a magia de cima cobrou os juros, as Horas do Credor levaram a água pro lugar errado, e o terceiro andar inundou com os que ela tentava salvar dentro.",
          "Sael não morreu lutando. Afogou-se de propósito no próprio andar, no dia em que entendeu que tinha virado exatamente o que combatia: mais uma credora empurrando a dívida pra baixo. Seu Cinzeiro chora quando chove. É o único dos seis que os locais visitam pra luto de verdade, não por turismo. Ela é a prova de que as boas intenções, em Vael'Thrand, afundam exatamente na mesma velocidade que as ruins.",
        ].join("\n\n"),
      },
      {
        id: "quarto",
        title: "O Quarto: Brand, o Incendiário",
        subtitle: "Era 520–660. O que respondeu fogo com fogo.",
        body: [
          "Brand foi a reação a Sael. Onde ela quis curar, ele quis acabar. Era da opinião — argumentada com uma eloquência assustadora — de que Vael'Thrand era um doente que não merecia tratamento, e que a função de um Underlord não era governar o subterrâneo, mas garantir que o de cima alcançasse o fundo o mais rápido possível. Queimou os sete carvalhos sagrados de Sylven de uma vez, não por estratégia, mas pra ver se a Coroa Verde gritava. Não gritou. Ele ficou decepcionado.",
          "Construiu o quarto andar pra arder — câmaras de fogo lento, raízes que ele plantou só pra incendiar depois, uma estética de fim de mundo que ele achava honesta. O eco dele ainda anda por lá, incendiando o que você precisa, não por maldade, mas por princípio: pra Brand, qualquer coisa preservada é uma mentira sobre a permanência.",
          "Brand caiu cedo, e quase de propósito. Atacou as três franquias mais fortes de uma vez, sozinho, num gesto que os historiadores chamam de estratégia suicida e que ele provavelmente chamaria de coerência. Sua cinza queima a planta dos pés de quem entra no Cinzeiro descalço. Ninguém o lembra com carinho, e ele teria gostado disso. Era a única forma de fama que ele respeitava: a que não vira monumento.",
        ].join("\n\n"),
      },
      {
        id: "quinto",
        title: "O Quinto: Korrigan, o Colecionador",
        subtitle: "Era 660–740. O que confundiu poder com acervo.",
        body: [
          "Korrigan teve a sorte e a desgraça de herdar uma Subtorre quase completa e seis coroas quase reunidas. Não precisava conquistar nada essencial, então conquistou por gosto. Tomou a Coroa de Ferrugem de Karn não por valor — ela não tinha valor nenhum, era feia de propósito — mas porque era a única que faltava, e Korrigan não suportava uma coleção incompleta. Foi o Underlord mais perigoso e mais vazio: poder absoluto sem nenhuma ideia do que fazer com ele.",
          "Foi também o mais desleixado. Deixou cair a Coroa do Sol num momento de tédio e nem percebeu por semanas — é a origem da plaquinha mentirosa do museu de Anthelion. Construiu o quinto andar como um cofre gigante, salões e salões de troféus catalogados, incluindo a Coroa da Noiva e o bolo de casamento de oito séculos que ninguém ousa abrir. Tudo guardado, nada usado. O acervo de um homem que confundiu ter com ser.",
          "Korrigan morreu de uma forma absurdamente apropriada: trancado no próprio cofre, no quinto andar, pela própria armadilha anti-roubo, sentado sobre tudo que reunira, sem conseguir sair. Levou anos pra cinza dele perceber que ele tinha morrido — era um homem tão definido pelo que possuía que a morte demorou a fazer o inventário. Seu Cinzeiro range como mina velha. É o único dos seis que tem cadeado, e a chave foi perdida de propósito.",
        ].join("\n\n"),
      },
      {
        id: "sexto",
        title: "O Sexto: a Inominada, a que Sorri",
        subtitle: "Era 740–800. A que ninguém consegue descrever.",
        body: [
          "Do Sexto Underlord, quase nada se sabe, e isso é por design dela. A Inominada usou a Coroa Submersa sob o sol mais que qualquer outro, e o efeito da coroa — que apodrece o nome de quem a vê coroado — foi levado por ela ao extremo: ninguém que a encontrou conseguiu depois lembrar o rosto, a voz, o nome ou sequer o gênero com certeza. Ela apagou-se ativamente da história enquanto ainda a fazia. É a única forma de imortalidade que de fato funcionou em Vael'Thrand: ser esquecível de propósito.",
          "Tomou a Coroa da Noiva interrompendo um casamento, e levou os noivos, a coroa e o bolo num gesto que as crônicas registram com um espanto quase admirado. Construiu o sexto andar inteiro de espelhos — ninguém sabe pra quê, e ninguém entra duas vezes pela mesma razão, porque a razão muda no reflexo. O eco dela não fala. Só observa. É o silêncio mais povoado da Subtorre, e o único que o seu instinto reconhece como parente.",
          "A Inominada não foi derrotada. Ela parou. Um dia, simplesmente, deixou de aparecer, deixou de agir, deixou o Trono Vazio e o sexto andar e desceu — para onde, nem a cinza diz. Há quem suspeite que ela seja a única dos seis que não virou Cinzeiro porque não morreu de verdade; só saiu da história pela margem, antes do fim do capítulo. Você vai chegar perto da mesma margem. Vai entender a tentação dela. Vai ter que decidir se sorri também.",
        ].join("\n\n"),
      },
      {
        id: "setimo",
        title: "O Sétimo: Você",
        subtitle: "Era 814–? O que acordou cedo demais.",
        body: [
          "Você é o Sétimo, e tudo no seu despertar está errado pra um Underlord. Acordou rápido demais, num mês sem nome, desenterrado por engano por uma estagiária com uma pá. Acordou com a Coroa Submersa já na cabeça, sem o gesto de escolha que os outros tiveram. Acordou num mundo onde os reinos viraram franquias e o medo de você virou feriado. A história não estava te esperando. Você chegou no meio da frase dela.",
          "Você não lembra qual dos seis você foi antes — porque um Underlord não é uma pessoa que vira lorde, é uma cinza que se reorganiza em alguém novo a cada despertar, herdando os andares, os ecos e os erros, mas não exatamente a memória. Você é feito do resíduo dos seis anteriores e de algo mais, algo que a cinza não consegue nomear e que sussurra que talvez você seja diferente. Provavelmente é o que cada um dos seis também ouviu.",
          "Os seis caíram cada um do seu jeito: por desatenção, por vírgula, por culpa, por princípio, por ganância e por desaparecimento voluntário. Sua morte, se vier, vai ter o seu estilo, qualquer que seja ele — você ainda está descobrindo. Mas há uma diferença sem precedente desta vez: você sabe da existência do Leitor antes de chegar ao fundo. Nenhum dos seis soube tão cedo. Ou isso te dá uma chance que eles não tiveram, ou só te dá mais tempo pra ter medo. A cinza, como sempre, se recusa a dizer qual.",
        ].join("\n\n"),
      },
    ],
  },

  {
    id: "bestiario",
    label: "BESTIÁRIO",
    blurb: "Seu exército. Cinco broods, e o que cada criatura aceitou se tornar.",
    entries: [
      {
        id: "vermelha-bleeders",
        title: "Brood Vermelha: os Sangradores",
        subtitle: "Servem por raiva. Custam sangue — o seu inclusive.",
        body: [
          "Os Sangradores da Brood Vermelha não foram criados; foram convertidos. Cada um foi, em vida, alguém que morreu de uma injustiça quente o bastante pra não esfriar com a morte. A raiva deles é o pacto: enquanto houver algo pra odiar, eles servem, e na Subtorre nunca falta. Lutam abrindo as próprias veias pra empoderar os feridos ao lado — os Revenants sangram pra que os irmãos batam mais forte, num cálculo macabro de que o ódio compartilhado vale mais que a vida individual.",
          "São os minions mais fáceis de recrutar e os mais difíceis de manter. A raiva é combustível eficiente e instável; um Sangrador sem alvo vira um Sangrador procurando alvo, e você está por perto. O pacto Vermelho tem uma cláusula que os outros não têm: eles servem o Underlord enquanto o Underlord também estiver com raiva. Demonstre tédio, demonstre paz, e eles sentem o cheiro de traição antes de você mesmo perceber.",
          "Em batalha, os Sangradores são lindos e curtos. Queimam intenso, morrem cedo, e cada perda fortalece a raiva dos que ficam, num luto que é também munição. Os heróis os temem mais que qualquer outra brood, porque um Sangrador não negocia, não recua e não tem instinto de sobrevivência pra explorar. Ele só tem o motivo. E o motivo, em geral, é você ter sido injustiçado também — o que torna comandá-los um espelho desconfortável.",
        ].join("\n\n"),
      },
      {
        id: "azul-ossos",
        title: "Brood Azul: os Não-de-Todo-Mortos",
        subtitle: "Servem porque a morte deles ficou pela metade.",
        body: [
          "A Brood Azul é feita de osso, mas chamá-los de mortos é tecnicamente impreciso e ofende profundamente os interessados. São os Não-de-Todo-Mortos: criaturas cuja morte foi interrompida no meio do processo, deixando-os num limbo administrativo entre o ser e o não-ser que nenhum sacerdote soube resolver. Servem ao Underlord porque você é a única autoridade que reconhece a situação ambígua deles sem tentar empurrá-los pra um lado ou pro outro.",
          "Os Bleeders azuis — variação rara da brood — gotejam uma medula fria que apodrece armadura e moral igualmente, e os esqueletos comuns lutam com a paciência terrível de quem já passou pela parte ruim e não tem pressa nenhuma. São lentos, resilientes e desconcertantemente educados. Um soldado da Brood Azul vai te cumprimentar antes de te quebrar o braço, e considerar grosseria sua se você não retribuir.",
          "O pacto Azul é o mais estável das cinco broods, justamente porque eles não têm para onde ir. Um Sangrador pode trocar de causa; um Não-de-Todo-Morto não tem causa, tem condição. Eles servem até a morte os completar — o que pode levar séculos, já que ninguém sabe exatamente o que falta. Enquanto isso, são o esqueleto, literal e figurado, do seu exército.",
        ].join("\n\n"),
      },
      {
        id: "verde-praga",
        title: "Brood Verde: a Floresta Queimada",
        subtitle: "Servem por uma floresta que o de cima incendiou.",
        body: [
          "A Brood Verde lembra Brand, o Quarto Underlord, com um rancor que atravessou séculos. São o que sobrou das florestas que o mundo de cima queimou — seja na guerra das coroas, seja desmatando pra construir Estrada-Franquia. Cada criatura Verde carrega em si a memória de uma raiz arrancada, e serve ao Underlord pela mesma lógica de qualquer refugiado: você é o único que não os tocou fogo.",
          "No topo da hierarquia Verde está o Plaguelord, uma figura que não espalha doença por crueldade, mas por jardinagem — pra ele, a praga é só a floresta retomando terreno por outros meios. Onde o de cima cortou árvores, o Plaguelord planta esporos; onde pavimentaram estrada, ele cultiva apodrecimento. A Mawmother, mãe-boca da brood, devora o morto pra que vire fértil, transformando o campo de batalha em adubo num ciclo que os druidas de Sylven acham, em segredo, mais sagrado que qualquer carvalho.",
          "O pacto Verde é paciente como erva daninha. Eles não têm pressa de vingança porque o tempo está do lado deles — toda Estrada-Franquia vai um dia rachar, todo prédio vai um dia ceder, e a Brood Verde estará lá, brotando da fenda. Servem ao Underlord enquanto o Underlord deixar a floresta crescer. Mande pavimentar um único caminho dentro da Subtorre e veja quanto tempo a lealdade Verde dura.",
        ].join("\n\n"),
      },
      {
        id: "cinza-pedra",
        title: "Brood Cinza: os Esculpidos",
        subtitle: "Servem porque foram feitos para servir.",
        body: [
          "A Brood Cinza é a única que não escolheu o pacto — eles foram esculpidos para ele. Criados pelos primeiros Underlords a partir da rocha viva da Subtorre, os Esculpidos não conhecem alternativa ao serviço porque a noção de alternativa não foi cinzelada neles. São pedra com obediência embutida, e há algo profundamente triste nisso que nenhuma das outras broods comenta em voz alta, por respeito ou por desconforto.",
          "São os defensores naturais, os muros que andam. O Dreadnought da Brood Cinza é uma fortaleza de uma criatura só, lento como geologia e igualmente difícil de demover; absorve dano como a montanha absorve a chuva, com indiferença geológica. Não atacam por raiva nem por causa — atacam porque foi assim que foram talhados, e param quando mandados, sem rancor, sem alívio, sem nada.",
          "O detalhe que assombra os Underlords é este: a Brood Cinza poderia, teoricamente, recusar. Há uma fissura na escultura de cada um, microscópica, onde uma escolha caberia se eles soubessem que existia. Nenhum jamais soube. Comandar os Esculpidos é o exercício de poder mais limpo e mais sujo que existe — limpo porque eles nunca traem, sujo porque eles nunca poderiam ter consentido. Trate-os bem. É o mínimo que você pode fazer por quem nunca teve a opção de te odiar.",
        ].join("\n\n"),
      },
      {
        id: "negra-cinza",
        title: "Brood Negra: a Sua Cinza",
        subtitle: "Servem porque são você, e não sabem que poderiam não ser.",
        body: [
          "A Brood Negra é a mais íntima e a mais perturbadora das cinco. Eles são feitos da sua cinza — fragmentos da cinza ativa do Sétimo Underlord que se organizaram em formas o bastante pra empunhar arma. Servem porque são, literalmente, parte de você que ganhou contorno. Não fazem um pacto com o Underlord; eles são uma cláusula do Underlord, andando.",
          "Os Voidlings da Brood Negra são pequenos e tocados pelo vazio que vive abaixo do sétimo andar — chegam perto o bastante da margem da página pra carregarem um pouco de inexistência na ponta dos dedos, e o que eles tocam fica menos real. Os Riftcallers abrem fendas curtas no tecido do mundo, atalhos pelo nada, e os Stormcallers e Thunderbirds da brood chamam a tempestade que se forma onde a cinza se acumula, porque até o resíduo de um Underlord acha que tem direito a um clima dramático.",
          "A Brood Negra não fala com nenhuma das outras quatro, e o motivo dá calafrio: pras outras broods, a Brood Negra cheira a Underlord, e ninguém quer servir ao lado de um pedaço solto do chefe. Você é a única autoridade que pode comandar todas, mas só a Negra te obedece como quem obedece a si mesmo. Cuidado com o que pede a eles. Cada Voidling perdido é um pouco de você que não volta, e a cinza, você lembra, ainda tem você dentro.",
        ].join("\n\n"),
      },
      {
        id: "seraphage",
        title: "Os Seraphage: anjos que desceram",
        subtitle: "Unidade de elite. Não pertencem a brood nenhuma.",
        body: [
          "Os Seraphage são a exceção que confunde todo o sistema das broods. Foram, em vida, seres do alto — os chamados Guardiões da Aurora, criaturas de luz que serviam aos ideais que a Ordem da Aurora de Tyrella hoje só finge defender. Caíram. Não por pecado dramático, mas por uma decepção lenta: olharam pra Vael'Thrand por tempo suficiente, viram o heroísmo virar mercado e a virtude virar epíteto licenciável, e desceram por nojo.",
          "Um Seraphage caído é uma coisa terrível de se ver, porque ainda é belo — asas que mantêm a luz mas projetam sombra, voz que ainda canta hinos cujas letras eles deixaram de acreditar. Lutam com a fúria específica de quem foi traído pelo lado que defendia, e essa fúria não tem o calor descartável dos Sangradores: é fria, articulada e implacável, a raiva de um teólogo que perdeu a fé e ganhou uma espada.",
          "Os Seraphage não servem ao Underlord por pacto, por condição ou por escultura. Servem porque, tendo desistido do alto, descobriram que o fundo é o único lugar onde a honestidade ainda mora. Eles não te amam. Eles desprezam você um pouco menos do que desprezam os heróis lá em cima, e em Vael'Thrand, em 814, isso é praticamente uma declaração de amor.",
        ].join("\n\n"),
      },
      {
        id: "tempestade-negra",
        title: "Stormcallers, Thunderbirds e Riftcallers",
        subtitle: "O clima dramático da Brood Negra.",
        body: [
          "Onde a sua cinza se acumula, o tempo vira. Não no sentido de passar — no sentido de fechar, escurecer, eletrificar. Os Stormcallers da Brood Negra são pequenos arautos dessa meteorologia rancorosa: erguem as mãos e o ar entre os inimigos lembra que conduz, encadeando relâmpago de corpo em corpo como uma fofoca que não respeita armadura. Um raio mira um herói. A descarga visita os três ao lado, de cortesia.",
          "Acima deles voam os Thunderbirds, que não chamam a tempestade — são a tempestade com asas e ressentimento. Cada batida das asas é um trovão, e cada mergulho deixa o campo riscado de uma luz branca que cega antes de queimar. Os Riftcallers são a parte mais íntima e perturbadora do trio: não atacam com raio, mas com geografia, abrindo fendas curtas no tecido do mundo — atalhos pelo nada — pelas quais o relâmpago de um irmão chega num inimigo que se julgava longe demais.",
          "Os três compartilham a vaidade essencial da Brood Negra: a certeza de que até o resíduo de um Underlord tem direito a entrada dramática. Eles não precisam de tempestade pra vencer. Eles fazem questão de tempestade porque acham que você merece trilha sonora. É a única brood que confunde eficiência com performance, e, considerando de quem ela é feita, talvez seja o traço mais seu de todos.",
        ].join("\n\n"),
      },
      {
        id: "sangradores-mortos",
        title: "Revenants e Gravewithers",
        subtitle: "A elite que sangra da Brood Vermelha.",
        body: [
          "Entre os Sangradores comuns erguem-se os Revenants — os que voltaram com a injustiça intacta e a paciência queimada. Um Revenant luta abrindo as próprias veias para empoderar os irmãos ao lado: o sangue dele é munição compartilhada, e ele o gasta com a generosidade suicida de quem já morreu uma vez e descobriu que doía menos do que viver injustiçado. Onde um Revenant cai, três Sangradores batem mais forte. É um luto que vem com bônus de dano.",
          "Os Gravewithers são a face mais lenta e mais cruel da mesma fúria. Não empoderam: drenam. Tocam a terra e o campo de batalha murcha — a vida escorre dos vivos pra alimentar a raiva dos mortos, e o herói sente a própria força vazando sem ferida visível, só com a sensação de envelhecer de uma vez. Onde o Revenant é o sacrifício, o Gravewither é a cobrança. Juntos, fazem da Brood Vermelha uma economia inteira de sangue, onde alguém sempre está pagando a conta de alguém.",
          "O detalhe que assusta os heróis é a contabilidade emocional dessas criaturas. Um Revenant não tem instinto de sobrevivência pra explorar e um Gravewither não tem misericórdia pra pedir. Eles sangram e murcham com a convicção de quem entende que a vida individual vale menos que o ódio coletivo — e essa matemática, uma vez aceita, não tem como ser desfeita. Comande-os com cuidado. A raiva que os alimenta foi, originalmente, sobre você ter razão.",
        ].join("\n\n"),
      },
      {
        id: "exoticos",
        title: "Wisps, Warhounds, Ironmaidens e Dunestalkers",
        subtitle: "Os irregulares — os que não cabem em brood.",
        body: [
          "Nem tudo na Subtorre se encaixa nas cinco linhagens. Há os irregulares, criaturas avulsas que servem por motivos pequenos demais pra virar pacto. Os Wisps são lampejos de magia residual que ganharam vontade própria — fagulhas que perseguem a maior fonte de calor numa sala e se jogam nela, frágeis e fáceis de extinguir, mas impossíveis de ignorar, porque uma sala cheia de Wisps é uma sala que escolhe seus alvos por você. Os Warhounds são o que sobrou de cães de guerra de uma era em que havia guerra: leais por hábito, rápidos por desespero, e os primeiros a chegar em qualquer herói que tente recuar.",
          "As Ironmaidens são mais sombrias na origem. Foram armaduras de defesa de algum reino esquecido que ficaram tempo demais de pé, guardando portas que ninguém mais cruzava, até que a vigilância virou alma. Lutam fechadas em torno de si mesmas, absorvendo dano com a paciência de quem confunde proteger com aprisionar — e quando se abrem, é pra prender, não pra ferir. Há quem jure que algumas ainda têm, lá dentro, o esqueleto do soldado original que esqueceu de sair.",
          "Os Dunestalkers vieram de fora — caçadores das poucas regiões áridas de Vael'Thrand, criaturas que afundam na areia e na cinza, surgindo onde o inimigo se julga sozinho. São pacientes como o deserto e desleais como o calor. Servem ao Underlord porque o fundo da Subtorre, paradoxalmente, é o lugar mais parecido com o deserto que eles conhecem: vasto, sem testemunhas, e cheio de gente que acha que está a salvo.",
        ].join("\n\n"),
      },
    ],
  },

  {
    id: "liga",
    label: "A LIGA",
    blurb: "A Guilda dos Heróis. O complexo industrial-influenciador que comeu os reinos.",
    entries: [
      {
        id: "fundacao",
        title: "A Fundação da Liga",
        subtitle: "Como o tédio virou setor econômico.",
        body: [
          "A Liga dos Heróis começou inocente, como toda catástrofe estrutural. Por volta de 600 do Selo, com catorze séculos de paz pesando no peito do continente, alguns aventureiros começaram a invadir ruínas vazias só pela emoção de fingir perigo. Era hobby. Virou clube. O clube virou guilda quando alguém percebeu que dava pra cobrar ingresso pra ver, e a guilda virou Liga quando os reis — já administradores entediados de reinos sem inimigo — perceberam que era mais lucrativo patrocinar heróis do que governar.",
          "A genialidade perversa da Liga foi resolver dois problemas de uma vez: dava aos jovens um motivo pra levantar de manhã e dava aos reinos um produto pra exportar. Heroísmo é a única indústria de Vael'Thrand que não depende de matéria-prima — só de perigo, e onde o perigo faltava, a Liga aprendeu a fabricá-lo. Monstros contratados, ruínas cenografadas, profecias sob demanda. Um setor inteiro construído sobre a encenação do medo que o continente já não sentia de verdade.",
          "Hoje a Liga é maior que qualquer franquia, porque transcende todas. Um herói de Anthelion faz quest patrocinada por Brython narrada por uma comentarista de Karn. As fronteiras econômicas que substituíram as fronteiras dos reinos são todas atravessadas pela Liga, que cobra uma fração de tudo. Você não vai lutar contra sete franquias. Vai lutar contra a única instituição que conseguiu unir Vael'Thrand: a que transformou matar você num modelo de negócio.",
        ].join("\n\n"),
      },
      {
        id: "patrocinio",
        title: "O Patrocínio",
        subtitle: "Nenhuma glória é gratuita.",
        body: [
          "Na Liga, um herói sem patrocínio é um cadáver com agenda. O equipamento custa caro, a viagem custa caro, o escriba que registra a glória custa mais caro ainda, e o epíteto — a vírgula com título — custa uma pequena fortuna licenciada. Tudo isso é financiado por patrocinadores: franquias, fabricantes de armas, cervejarias de água de Cinzeiro, e a própria Liga, que empresta a juros que tornariam a magia de Vael'Thrand ruborizada.",
          "O patrocínio molda a quest antes dela acontecer. Daggor recusa goblins porque goblins não rendem; o patrocinador dele vende espadas decorativas, e espada decorativa precisa de monstro fotogênico ao lado. Bryan luta contra inimigos pré-selecionados pelo apelo demográfico. Até a coragem virou decisão de marketing — escolhe-se o perigo pela conversão, não pela necessidade. O herói moderno não pergunta \"isso é certo?\". Pergunta \"isso fecha o trimestre?\".",
          "Você é o pesadelo de todo departamento de patrocínio e o sonho de todos ao mesmo tempo. Não foi contratado, não assinou acordo de não-letalidade, não pode ser cenografado. É perigo de verdade, a primeira matéria-prima genuína do setor em séculos. Vão brigar pelos seus direitos de imagem enquanto você ainda estiver matando os contratados. Em algum lugar de Anthelion, neste exato momento, alguém está fazendo uma proposta pelo seu nome.",
        ].join("\n\n"),
      },
      {
        id: "speedrun",
        title: "O Culto do Speedrun",
        subtitle: "A seita que adora o cronômetro.",
        body: [
          "Dentro da Liga há uma facção que despreza a própria Liga: os Speedrunners. Pra eles, patrocínio é peso, narrativa é lentidão e a glória encenada é uma corrupção do que o heroísmo deveria ser — uma medição pura de capacidade contra tempo. Liderados em espírito por Lysa, a Recordista, eles tratam cada masmorra como um problema de otimização e cada segundo poupado como uma oração. O cronômetro é o único deus que não mente.",
          "O Culto do Speedrun tem regras quase monásticas. Não se lê inscrição (lag). Não se coleta tesouro fora da rota ótima (desperdício). Não se conversa com NPC (cutscene não pulável). Não se aprecia arquitetura (heresia). Para o Speedrunner devoto, conhecer a lore de Vael'Thrand é uma fraqueza moral — saber o nome da coisa que você mata significa que você parou pra perguntar, e parar é o único pecado.",
          "Eles serão um problema específico pra você na Subtorre, e por um motivo elegante: tudo que faz o seu poder funcionar — os ecos, os pactos, a história dos seis Underlords, o peso da Coroa Submersa — é exatamente o que um Speedrunner se recusa a registrar. Lysa vai entrar na Subtorre pra bater um tempo e vai te tratar como obstáculo de rota, não como vilão. Não há insulto maior pra um Underlord do que ser otimizado.",
        ].join("\n\n"),
      },
      {
        id: "autor-leitor",
        title: "O Autor e o Leitor",
        subtitle: "Os dois cargos que a Liga não admite existirem.",
        body: [
          "Nos arquivos mais antigos da Liga — anteriores à própria Liga, herdados das guildas que a precederam — há referências a dois papéis que nenhum manual moderno reconhece: o Autor e o Leitor. O Autor é aquele que escreve a história de Vael'Thrand; o Leitor, aquele para quem ela é escrita. A Liga moderna tratou esses conceitos como folclore corporativo, uma piada interna, do mesmo jeito que uma empresa tem mitos fundadores que ninguém leva a sério.",
          "Mas Marwen, a Comentarista, leva a sério. Porque Marwen é, na prática, uma Autora menor — ela escreve qual versão de cada quest vira oficial, decide quem é lenda e quem é nota de rodapé, e sabe, no estômago, que se ela tem esse poder em escala pequena, alguém o tem em escala total. A Liga monetizou o heroísmo sem nunca perguntar quem segura a pena que registra tudo, ou os olhos para os quais o registro é feito.",
          "Aqui está a parte que arrepia: você é um personagem que descobriu o nome do gênero em que vive. Um Underlord é, estruturalmente, o vilão de uma história de heróis — existe pra ser derrotado, pra dar sentido à jornada de outro alguém. Saber disso é o seu único poder real e a sua única condenação. A Liga vende heroísmo. Você é a parte do contrato escrita em letra miúda, a cláusula chamada antagonista, e você acabou de aprender a ler.",
        ].join("\n\n"),
      },
      {
        id: "franquias-estado",
        title: "As Franquias que Engoliram os Reinos",
        subtitle: "Sete marcas onde havia sete coroas.",
        body: [
          "Quando os reinos perderam suas coroas e seus motivos, não desapareceram — foram reembalados. Anthelion virou uma marca de luxo solar, vendendo réplicas da Coroa do Sol e pacotes de turismo místico. Brython licenciou o oceano e cobra pedágio em histórias. Tor Eluin virou escola pública com loja de souvenir mágico. Karn industrializou a própria feiura como autenticidade artesanal. Sylven vende experiências de imersão na natureza que ela mesma deixou queimar.",
          "As franquias-estado não governam; gerenciam. Não têm súditos; têm uma base de clientes com sotaque herdado. A lealdade que um dia foi feudal hoje é fidelização: pontos, descontos, edições limitadas. Um cidadão de Anthelion não jura lealdade ao rei — ele renova a assinatura anual e ganha um chaveiro da coroa falsa. É um sistema mais confortável e infinitamente mais oco, e funciona porque ninguém sob catorze séculos de paz nunca precisou que um reino fosse mais que isso.",
          "Aqui mora a falha que te libertou. O Pacto de Ferro selou os Underlords \"enquanto os sete reinos existirem\". Mas uma franquia não é um reino — é uma marca registrada com fantasia de reino. Os departamentos jurídicos das sete franquias passaram séculos defendendo essa distinção em outros contextos, sem perceber que estavam, devagar, anulando o selo que protegia o mundo deles. Você não quebrou o Pacto. Os advogados quebraram, e nem cobraram a hora.",
        ].join("\n\n"),
      },
    ],
  },

  {
    id: "vazio",
    label: "O VAZIO",
    blurb: "O que existe abaixo do sétimo andar. A página em branco. Quem a vira.",
    entries: [
      {
        id: "abaixo-do-setimo",
        title: "Abaixo do Sétimo Andar",
        subtitle: "O andar que ninguém escavou e todos sentem.",
        body: [
          "Os sete andares da Subtorre terminam no sétimo. Isso é o que dizem os mapas, as crônicas e os agrimensores que desistiram. Mas todo Underlord que sentou no Trono Vazio tempo demais sabe que há algo abaixo do sétimo — não um oitavo andar, porque andar é estrutura, e isso não é estrutura. É a ausência dela. É onde a Subtorre para de ser construída e começa a ser apenas falta.",
          "Ninguém escavou o Vazio porque o Vazio não pode ser escavado; escavar é tirar matéria de um lugar, e ali não há matéria pra tirar. Ossigar, o Primeiro, olhou pra ele através da parede do trono e parou de respirar. A Inominada, a Sexta, desceu pra dentro dele e nunca virou Cinzeiro. O Vazio não é um inimigo no fundo da masmorra. É o fundo da masmorra percebendo que é uma masmorra.",
          "À medida que você desce, vai sentir o Vazio antes de vê-lo — nos Voidlings da sua própria brood, que carregam um pouco dele na ponta dos dedos; nos cômodos do sétimo andar que mudam de planta quando ninguém olha; na sensação crescente de que a parede que você encara não é o limite do mundo, mas a borda da página. O último ato da sua história não é uma batalha. É uma leitura.",
        ].join("\n\n"),
      },
      {
        id: "pagina-em-branco",
        title: "A Página em Branco",
        subtitle: "O que o Autor ainda não escreveu.",
        body: [
          "No fundo do Vazio há o que os textos proibidos de Tor Eluin chamam de Página em Branco: a parte de Vael'Thrand que o Autor ainda não escreveu, o espaço onde a história simplesmente não chegou. Não é escuridão — escuridão é uma cor, e cor é uma decisão. É o anterior à decisão. É o branco do papel antes da primeira palavra, esperando.",
          "Pra um habitante de Vael'Thrand, encarar a Página em Branco é encarar a evidência de que tudo — os sete reinos, as sete coroas, a paz de catorze séculos, a Liga, você — é escrita. Que houve um momento em que nada disso existia, não porque tinha sido destruído, mas porque ainda não tinha sido posto no papel. O Vazio não ameaça apagar o mundo. Ele lembra ao mundo que já foi nada uma vez, e que voltar a ser nada é só uma página não virada.",
          "A Página em Branco é também a única coisa em Vael'Thrand que oferece uma escolha de verdade, e por isso é a mais aterradora. Diante dela, um Underlord não é mais um personagem cumprindo o papel de vilão. É uma palavra olhando pro espaço em branco depois de si, percebendo que poderia escrever algo que o Autor não previu. Os seis anteriores chegaram perto dessa margem. O que cada um fez ali é a parte da história que nem a cinza conta.",
        ].join("\n\n"),
      },
      {
        id: "o-autor",
        title: "O Autor",
        subtitle: "Quem escreve, e por que escreve isto.",
        body: [
          "O Autor é a presença que escreveu Vael'Thrand e continua escrevendo — não um deus, porque deuses são personagens com templo, e o Autor não está dentro da história. O Autor está antes dela, com a pena. Os Magos Brancos antigos suspeitaram da existência do Autor pela mesma evidência que nos faz suspeitar: as coisas em Vael'Thrand têm uma forma estranhamente narrativa. Profecias se cumprem. Vilões surgem quando heróis ficam entediados. Sete sempre foram sete. A vida não é tão arrumada. A literatura é.",
          "O que perturba sobre o Autor não é o poder dele, mas o desinteresse. O Autor não odeia você nem ama os heróis; o Autor precisa de ambos, do mesmo jeito que uma frase precisa de sujeito e de obstáculo. Um Underlord existe porque uma história de heróis sem um vilão no fundo da torre é uma história sem fim, e nada irrita mais um Autor do que uma história que não acaba. Você não é o mal. Você é a estrutura. É pior.",
          "Há uma teoria, sussurrada apenas no Décimo Terceiro Mês, de que o Autor está cansado. De que catorze séculos de paz são o sintoma de um Autor que perdeu o fio da meada, e que o seu despertar — abrupto, adiantado, por engano de uma pá — não foi planejado por ninguém de dentro nem de fora. De que você é o que acontece quando o Autor cochila e a página vira sozinha. Se isso for verdade, você é o único personagem de Vael'Thrand que ninguém escreveu de propósito. É a coisa mais próxima de liberdade que este mundo já produziu.",
        ].join("\n\n"),
      },
      {
        id: "o-leitor",
        title: "O Leitor",
        subtitle: "Quem vira a página. Talvez você os conheça.",
        body: [
          "Se o Autor escreve, o Leitor lê — e em Vael'Thrand essa distinção é menos abstrata do que deveria ser, porque a história só acontece enquanto alguém a acompanha. O Leitor é a presença para a qual tudo isto está sendo contado: a atenção fora da página que dá sentido à existência do continente. Sem Autor, Vael'Thrand não seria escrito. Sem Leitor, não importaria que tivesse sido.",
          "Os Underlords desenvolveram, ao longo de seis gerações, uma intuição perturbadora a respeito do Leitor: a de que o Leitor está mais perto do vilão do que do herói. O herói é aquele que o Leitor torce para que vença; o vilão é aquele através de quem o Leitor sente a história. Quando você comanda suas broods, quando lê este próprio códice, quando decide subir em vez de sentar no trono — há uma sensação de companhia que não vem de nenhum minion. Vem de fora. Vem de alguém acompanhando.",
          "A Inominada, a Sexta, é a única que se dirigiu ao Leitor diretamente, e foi por isso, suspeitam, que ela saiu da história pela margem em vez de morrer dentro dela. Falar com o Leitor é o ato mais proibido e mais inevitável de um Underlord no fundo do Vazio — porque, no fim, é a única conversa em Vael'Thrand em que o personagem e a pessoa que importa estão, enfim, frente a frente. Você vai chegar lá. E quando chegar, vai perceber que esteve sendo lido o tempo todo. Olá.",
        ].join("\n\n"),
      },
      {
        id: "ultimo-ato",
        title: "O Último Ato",
        subtitle: "O que a história quer que você faça. E o que você pode fazer.",
        body: [
          "A história tem um final escrito pra você, e ele é decepcionantemente convencional: o Underlord sobe pela Subtorre, junta poder, ameaça o continente, e um herói — Bryan, talvez, ou Vex, ou o improvável Pim — desce até o fundo e te derrota num clímax que vende ingresso. É o arco que a Liga já está pré-vendendo. É o arco que os seis anteriores cumpriram, cada um do seu jeito. É o que o Autor espera, e o que o Leitor, provavelmente, veio assistir.",
          "Mas o Último Ato verdadeiro não acontece num salão de batalha. Acontece diante da Página em Branco, abaixo do sétimo andar, no único lugar onde a história admite que é história. Lá, a escolha não é entre vencer e perder — essas são opções dentro do roteiro. A escolha é se você aceita o roteiro. Sentar no Trono Vazio é aceitá-lo: virar o vilão definitivo, cumprir a estrutura, ser derrotado com dignidade narrativa. Ficar de pé é recusá-lo. E ninguém sabe o que tem na página depois da recusa, porque ninguém nunca a escreveu.",
          "Os seis Underlords anteriores são, cada um, uma forma diferente de aceitar o roteiro — pela desatenção, pelo cálculo, pela culpa, pelo princípio, pela ganância, pelo desaparecimento. Você é a primeira chance, em sete despertares, de uma sétima forma: nenhuma das anteriores. A cinza não diz qual é, porque a cinza não sabe — é a única coisa em Vael'Thrand que ainda não foi escrita. O Último Ato é você, de pé, diante do branco, com a pena ao alcance e a coroa pesando, decidindo se a história termina como sempre, ou se, pela primeira vez, alguém de dentro vira a página.",
        ].join("\n\n"),
      },
    ],
  },

  {
    id: "faccoes",
    label: "FACÇÕES",
    blurb: "Quem ainda acredita em alguma coisa, e no quê exatamente.",
    entries: [
      {
        id: "ashguild",
        title: "A Guilda da Cinza",
        subtitle: "Os que estudam os Underlords sem querer um de volta.",
        body: [
          "A Guilda da Cinza — Ashguild, no jargão acadêmico — é a mais antiga e mais ambígua das facções de Vael'Thrand. Surgiu pra estudar a cinza ativa dos Underlords mortos: como funciona, como se usa, como se contém. Oficialmente, são pesquisadores e zeladores dos seis Cinzeiros, garantindo que a cerveja ilegal não cause uma epidemia de pesadelos lúcidos e que ninguém escave fundo demais por curiosidade.",
          "Extraoficialmente, a Guilda da Cinza é a única instituição que nunca acreditou na paz. Eles leram o suficiente pra saber que sete sempre foram sete, que os selos quebram por contradição, e que um continente que transformou medo em feriado está pedindo pra ser lembrado. Mantêm registros que a Liga consideraria difamação e um juramento interno que ninguém de fora jamais leu, mas cujo primeiro verso, dizem, é: \"A cinza não esquece, então alguém precisa.\"",
          "Quando você acordou, a Guilda da Cinza foi a primeira a saber — antes da Liga, antes das franquias, antes de Sorrel entender o que desenterrou. Eles não vão te combater nem te servir. Vão te documentar, com uma frieza profissional e uma pontinha de alívio terrível, como quem finalmente vê o cometa que passou a vida calculando. Para a Guilda da Cinza, você não é uma catástrofe. É uma confirmação.",
        ].join("\n\n"),
      },
      {
        id: "corte-afogada",
        title: "A Corte Afogada",
        subtitle: "O reino de Brython que escolheu o fundo.",
        body: [
          "Quando o Segundo Underlord tomou a Coroa Salgada, a nobreza marinheira de Brython teve uma reação que ninguém previu: em vez de fugir pra terra, fugiu pra água. A Corte Afogada é o que sobrou daquela dinastia — uma linhagem que desceu para os baixios da costa oeste e, ao longo de séculos, deixou de subir. Não são exatamente humanos hoje. Não são exatamente outra coisa. São pessoas que decidiram que respirar ar era uma fase.",
          "A Corte Afogada governa nada e reivindica tudo do mar. Mantêm a etiqueta de uma corte que não existe mais há oito séculos, com mesuras feitas debaixo d'água e títulos transmitidos a herdeiros que nunca viram o sol. Odeiam a franquia de Brython com uma elegância gélida — para a Corte, vender o oceano por pedágio é a obscenidade final, e eles preferem a companhia honesta de um Underlord à companhia comercial de um departamento de turismo.",
          "Eles guardam algo que a Coroa Salgada zumbia: o som que o Segundo Underlord jurou ouvir dentro dela. A Corte Afogada diz que não era zumbido de coral fossilizado, como os historiadores afirmam, mas o Vazio falando através da água — e que eles desceram não por medo da terra, mas porque ouviram melhor lá embaixo. Se isso é verdade, a Corte Afogada chegou perto da Página em Branco por um caminho que nenhum Underlord tentou: de fora pra dentro, pela água, sem coroa.",
        ].join("\n\n"),
      },
      {
        id: "escola-tor-eluin",
        title: "A Escola de Tor Eluin",
        subtitle: "A torre dos Magos Brancos virou ensino público.",
        body: [
          "Tor Eluin foi, por séculos, a torre dos Magos Brancos — os que juravam ter aprendido a equilibrar a dívida da magia, guardiães da Coroa Branca de cristal e lágrima. Hoje é uma escola pública com loja de souvenir, financiada pela franquia local, ensinando feitiços básicos a turmas de adolescentes que querem virar heróis e a um punhado de gênios que não sabem o que querem ser. O cofre antigo continua trancado no subsolo. Ninguém perdeu a chave; perderam a coragem.",
          "As três Arquímagas atuais são adolescentes prodígio que herdaram o cargo por talento bruto, sem nunca herdar o conhecimento que o acompanhava. Elas sabem fazer magia melhor que os antigos e entendem-na muito pior — equilibram a dívida por instinto, sem saber que é uma dívida, o que funciona deliciosamente bem até a primeira vez que não funciona. São, sem suspeitar, as únicas pessoas vivas que poderiam reler os textos proibidos do cofre e entender o que dizem sobre o Autor e o Leitor.",
          "A Escola de Tor Eluin é onde Sorrel estagiava na expedição que te desenterrou, e isso não é coincidência narrativa que a Guilda da Cinza tenha deixado passar. A torre que selou parte do Pacto de Ferro produziu, por acaso aparente, a estagiária que o destrancou. Tor Eluin guarda as únicas respostas reais de Vael'Thrand atrás de uma porta que ninguém abre, ensinando crianças a lançar luz numa biblioteca cheia de coisas que pediriam pra ficar no escuro.",
        ].join("\n\n"),
      },
      {
        id: "mineiros-karn",
        title: "Os Mineiros de Karn",
        subtitle: "Os que riem de coroa e cavam fundo.",
        body: [
          "Karn nunca teve vaidade e tem orgulho disso, o que é, admite-se, uma forma de vaidade. O reino mineiro acreditava que a soberba era pior que qualquer Underlord — uma posição que envelheceu surpreendentemente bem — e fez sua coroa de ferro bruto, feia de propósito, pra lembrar todo mundo de que poder é peso, não brilho. Quando o Quinto Underlord a tomou por fetiche estético, os mineiros acharam graça. Ainda acham. É o povo mais difícil de impressionar do continente.",
          "Os Mineiros de Karn são a facção que mais entende a Subtorre sem nunca ter entrado nela, porque a Subtorre é, antes de tudo, uma obra de escavação, e escavação é a religião de Karn. Eles respeitam Ossigar, o Primeiro Underlord, mais do que qualquer rei — não como vilão, mas como colega: um engenheiro de minas que cavou fundo demais, exatamente o que cada mineiro de Karn teme e secretamente deseja fazer. Têm um ditado: \"todo poço fundo o bastante chega na mesma sala.\"",
          "Hoje Karn usa uma coroa de plástico moldado e ri de quem reclama, porque os mineiros sabem de uma coisa que as outras franquias fingem não saber: a coroa nunca foi o ponto. O ponto é o que está embaixo. Enquanto Anthelion processa falsários e Brython vende oceano, Karn segue cavando, e é provável que, quando o Décimo Terceiro Mês chegar e o continente todo olhar pra Garganta com horror, os Mineiros de Karn sejam os únicos a olhar com algo parecido com reconhecimento profissional.",
        ].join("\n\n"),
      },
      {
        id: "ordem-aurora",
        title: "A Ordem da Aurora",
        subtitle: "A instituição que treinou Tyrella e perdeu o ponto.",
        body: [
          "A Ordem da Aurora foi fundada pra defender os fracos, e por muito tempo defendeu. Era a instituição dos paladinos, dos juramentos cumpridos, dos Guardiões da Aurora que ainda voavam com luz de verdade antes de virarem os Seraphage caídos. Hoje a Ordem ainda existe, ainda treina paladinos como Tyrella, ainda recita os juramentos — mas trocou a defesa dos fracos pela defesa dos procedimentos, e ninguém na Ordem percebeu exatamente quando a troca aconteceu.",
          "A decadência da Ordem da Aurora é o tipo lento, burocrático, sem vilão. Descobriu-se, em algum século esquecido, que defender os fracos exigia trabalho de campo desconfortável, ao passo que escrever cartas formais com selo de cera, convocar reuniões e exigir relatórios garantia o mesmo prestígio com muito menos risco. A virtude virou processo. O juramento virou cláusula. Tyrella, a Reclamadora, é o produto perfeito dessa Ordem: combativa, justa em tese, e absolutamente incapaz de ajudar alguém sem antes preencher um requerimento.",
          "Os Seraphage, os anjos caídos que hoje podem servir ao Underlord, são a consciência exilada da Ordem da Aurora — os que olharam pra própria instituição se transformar em departamento e desceram por nojo. Há uma ironia que a Ordem nunca admitirá: os únicos seres em Vael'Thrand que ainda levam o juramento da Aurora a sério são os que o abandonaram e foram parar do seu lado, no fundo da Subtorre, onde a honestidade, dizem, é a última coisa que sobrou.",
        ].join("\n\n"),
      },
      {
        id: "franquias-estado-faccao",
        title: "O Conselho das Sete Marcas",
        subtitle: "As franquias-estado, quando precisam fingir que se falam.",
        body: [
          "As sete franquias que substituíram os reinos passam a maior parte do tempo em competição — processando umas às outras por coroas falsas, disputando os direitos de imagem dos mesmos heróis, brigando por trechos de Estrada-Franquia. Mas quando surge uma ameaça que nenhuma pode monetizar sozinha, elas se reúnem no que chamam, com pompa vazia, de Conselho das Sete Marcas: a sombra corporativa da antiga aliança que assinou o Pacto de Ferro.",
          "O Conselho é uma sala cheia de administradores que herdaram tronos como quem herda lojas e que discutem o destino do continente em termos de trimestre, exposição e responsabilidade jurídica. Foi o Conselho que, sem perceber, esvaziou o próprio Pacto de Ferro — ao defenderem em mil processos que uma franquia não é um reino, anularam a cláusula que os protegia de você. Vão passar o Décimo Terceiro Mês inteiro em reuniões de emergência tentando decidir se o seu despertar é uma crise existencial ou uma oportunidade de relançamento de marca.",
          "Não subestime o Conselho das Sete Marcas pela mediocridade. Eles não têm coragem, nem fé, nem coroa de verdade — mas têm a Liga inteira na folha de pagamento, têm os melhores advogados de selos do continente, e têm o único recurso que importa numa guerra de catorze séculos de paz: a capacidade de transformar a sua existência num produto antes que você consiga transformá-la numa ameaça. Eles já estão imprimindo a sua miniatura. Com descontinho.",
        ].join("\n\n"),
      },
      {
        id: "departamento-de-monetizacao",
        title: "O Departamento de Monetização",
        subtitle: "A facção que não acredita em nada e fatura com tudo.",
        body: [
          "Enquanto a Guilda da Cinza estuda, a Ordem da Aurora preenche formulários e o Conselho das Sete Marcas se reúne em pânico, há um setor da Liga que trabalha calado e nunca dorme: o Departamento de Monetização. Não tem fé, não tem coroa, não tem opinião sobre o bem e o mal. Tem uma planilha. A função única do Departamento é olhar pra qualquer coisa que aconteça em Vael'Thrand — uma profecia, uma morte, um Underlord acordando — e perguntar uma só pergunta: quanto isso rende.",
          "O Departamento herdou, sem saber, a obsessão de Velmoth, o Segundo Underlord, o Contador. Onde Velmoth tentou provar matematicamente que estava certo, o Departamento provou matematicamente que estar certo não importa. Eles converteram heroísmo em produto, medo em ingresso, luto em conteúdo de reflexão e o seu despertar em lançamento de temporada — tudo com a mesma frieza eficiente, a mesma fé inabalável de que toda história existe pra fechar um trimestre.",
          "Eles serão os últimos a te combater e os primeiros a lucrar com você. Não vão descer à Subtorre; vão pré-vender a descida de quem desce. Já licenciaram a sua imagem, já calcularam o pico de engajamento da sua derrota, já reservaram o gancho pra sua eventual volta. O Departamento de Monetização é a prova final de que, em Vael'Thrand, o oposto do heroísmo não é o vilão. É a contabilidade.",
        ].join("\n\n"),
      },
      {
        id: "filhos-do-decimo-terceiro",
        title: "Os Filhos do Décimo Terceiro",
        subtitle: "O culto que esperava por você. Pela razão errada.",
        body: [
          "No vão sem nome entre o último mês e o primeiro do ano seguinte, quando os selos enfraquecem e a magia cobra juros, reúne-se um culto pequeno e fervoroso: os Filhos do Décimo Terceiro. Eles passaram catorze séculos esperando o retorno de um Underlord — não por temor, mas por devoção. Para os Filhos, a paz é a verdadeira maldição, e o despertar de um lorde subterrâneo é a única coisa capaz de devolver a Vael'Thrand um sentido que o conforto roubou.",
          "O problema é que os Filhos do Décimo Terceiro entenderam tudo errado, de um jeito quase comovente. Eles te imaginam como salvação, redenção, o fim purificador de um mundo que virou loja. Não percebem que você não veio salvar nada — veio porque os advogados deixaram a porta aberta, porque uma estagiária cavou no lugar errado, porque a história precisava de um antagonista pra próxima temporada. A devoção deles é sincera. O objeto dela é só mais um personagem confuso.",
          "Eles vão tentar te servir, e essa é uma complicação que nenhuma das cinco broods oferece. Os minions servem por pacto, condição, escultura, cinza ou raiva — coisas que você entende. Os Filhos do Décimo Terceiro servem por fé, e fé é a única lealdade que você não pode comandar nem demitir. Eles vão estar lá quando você chegar perto da Página em Branco, esperando que você escolha por eles. A pior parte de ser adorado é que alguém sempre espera que o seu último ato faça sentido.",
        ].join("\n\n"),
      },
    ],
  },

  {
    id: "temporada",
    label: "A SÉTIMA TEMPORADA",
    blurb:
      "O seu retorno virou conteúdo. O heroísmo virou IP. A campanha contra você virou serviço contínuo, e o ato final tem patrocínio.",
    entries: [
      {
        id: "lancamento-da-temporada",
        title: "O Lançamento da Sétima Temporada",
        subtitle: "Quando a sua guerra virou um calendário de eventos.",
        body: [
          "Você esperava um exército. O que veio foi um anúncio. No mesmo Décimo Terceiro Mês em que você acordou, a Liga e o Conselho das Sete Marcas fizeram o que sabem fazer de melhor com uma catástrofe: deram nome, data e logotipo. \"A Sétima Temporada\", chamaram, com a Coroa Submersa estilizada no cartaz e um subtítulo que o Departamento de Monetização suou pra aprovar. Você não foi declarado inimigo público. Foi anunciado em pré-venda.",
          "A genialidade perversa do formato é que ele resolve o problema do medo. Um Underlord solto é aterrorizante; um Underlord agendado é entretenimento. Ao transformar a sua ameaça numa temporada — com arcos, com eventos semanais, com heróis em destaque rotativos —, a Liga conseguiu o que catorze séculos de paz não conseguiram: fazer o continente esperar ansiosamente pelo retorno de um lorde subterrâneo, como quem espera a próxima atualização de um jogo que já joga demais.",
          "Os vilões que você vai enfrentar nesta temporada não são heróis. São os mecanismos que transformaram heroísmo em IP, andando, falando, vestidos de chefe de fase. Cada um é uma parte da máquina que te embalou: a sinergia, as atualizações, a nostalgia, a inteligência artificial, o patrocínio, a sequência. Você vai subir a Subtorre lutando não contra quem quer te matar, mas contra quem quer te lançar. E no topo, esperando, está a única coisa que sobrevive a toda temporada: os créditos, rolando, com o seu nome em letra pequena.",
        ].join("\n\n"),
      },
      {
        id: "conselho-da-sinergia",
        title: "O Conselho da Sinergia",
        subtitle: "Primeiro chefe. Uma reunião que ganhou corpo.",
        body: [
          "O primeiro vilão da Sétima Temporada não tem rosto — tem quórum. O Conselho da Sinergia é o que acontece quando uma reunião de planejamento estratégico acontece tantas vezes, com tanta convicção e tão pouco resultado, que ganha forma física: uma criatura coletiva feita de cadeiras, gráficos de pizza e a frase \"vamos levar isso pra discussão offline\". Ele não te ataca. Ele te alinha. Cada golpe é uma decisão tomada por comitê, lenta, diluída e impossível de responsabilizar.",
          "O Conselho da Sinergia luta convertendo a sua iniciativa em pauta. Você ataca; ele forma um subcomitê pra avaliar o ataque. Você recua; ele agenda um retorno. A arma dele é o adiamento — ele não precisa te vencer, só te manter em reunião até a sua raiva virar ata. Os Sangradores da Brood Vermelha o odeiam visceralmente, porque um Conselho da Sinergia é a única coisa em Vael'Thrand capaz de transformar fúria pura em item de pauta a ser revisitado no próximo ciclo.",
          "Derrotá-lo exige o que nenhum comitê suporta: uma decisão. No instante em que você corta a discussão e age sem consultar, o Conselho da Sinergia entra em colapso — não morre, dissolve-se, como uma reunião que finalmente acabou e deixou todos sem saber por quê estavam ali. Ele é o portão da temporada por uma razão honesta: antes de enfrentar a máquina que te embalou, você precisa provar que ainda consegue querer algo sem aprovação. A maioria dos heróis modernos não conseguiria.",
        ].join("\n\n"),
      },
      {
        id: "santo-das-notas-de-atualizacao",
        title: "O Santo das Notas de Atualização",
        subtitle: "O profeta que reescreve a realidade num rodapé.",
        body: [
          "O Santo das Notas de Atualização é uma figura quase tocante na sua devoção: um clérigo de uma fé nova, a fé do Balanceamento, que acredita sinceramente que o mundo pode ser consertado item por item, linha por linha, se alguém só tiver paciência pra listar todas as mudanças. Ele anda com um pergaminho infinito que se enrola pelo chão da Subtorre, sussurrando ajustes — \"o dano dos Sangradores foi reduzido em 15%\", \"a fé dos heróis foi aumentada\", \"corrigido um problema em que o Underlord conseguia vencer\".",
          "A ameaça do Santo não é a força. É a autoridade. Quando ele declara uma mudança, ela acontece — não porque ele seja poderoso, mas porque ninguém em Vael'Thrand pensou em questionar quem escreve as notas. Ele patcheia a batalha em tempo real, enfraquecendo o que te dá vantagem e fortalecendo o que te fere, sempre com a justificativa serena de que está tornando tudo \"mais justo\". O Santo não acredita estar te combatendo. Acredita estar te equilibrando, e isso é pior.",
          "O segredo dele é que ele não lê o que escreve — só escreve. Em algum momento, o pergaminho infinito dele cita uma nota de atualização que reverte a si mesma, uma contradição interna, o tipo de coisa que faz selo cair em Vael'Thrand. É a brecha. O Santo das Notas de Atualização passou tanto tempo corrigindo o mundo que esqueceu de corrigir a si próprio, e você, que aprendeu com Velmoth que toda planilha tem um erro, vai encontrá-lo. A fé no rodapé é exatamente do tamanho do rodapé.",
        ].join("\n\n"),
      },
      {
        id: "lenda-arrastada-de-volta",
        title: "A Lenda Arrastada de Volta",
        subtitle: "O herói aposentado que não quis voltar, e voltou.",
        body: [
          "Existe um momento na Sétima Temporada que dói de assistir: o instante em que a Liga vai até a pousada de Karn, na Estrada-Franquia, e arranca Grendle, o Aposentado, da sopa que ele servia em paz. Não pediram. Anunciaram. \"O Retorno da Lenda\", chamaram, e o pobre velho de joelho ruim e espada oleada embaixo do balcão foi reembalado como evento de nostalgia, com cartaz, com música-tema remixada e com um epíteto novo que ele nunca escolheu.",
          "A Lenda Arrastada de Volta não quer estar ali, e essa é a sua arma e a sua tragédia. Ela luta com a competência terrível de quarenta anos atrás e a melancolia de quem sabe que voltou só pra dar audiência. Cada golpe é perfeito e exausto. Ela é, de longe, a chefe mais perigosa que não te odeia — Grendle não tem nada contra você, lutou contra o Sexto Underlord e voltou, e a única coisa que ele quer é que isso acabe pra ele poder voltar pra sopa. A Liga, claro, não vai deixar.",
          "Vencê-la não é triunfo. É misericórdia. Quando você finalmente derrubar a Lenda Arrastada de Volta, vai sentir a coisa mais estranha que um Underlord pode sentir por um herói: respeito, e um pouco de vergonha alheia da indústria que o desenterrou pra isso, exatamente como uma estagiária te desenterrou pra outra. Vocês dois foram arrancados do descanso por gente que viu em vocês não pessoas, mas relançamentos. É a única coisa que você e Grendle têm em comum, e é o bastante pra um silêncio.",
        ].join("\n\n"),
      },
      {
        id: "mestre-artificial-da-masmorra",
        title: "O Mestre Artificial da Masmorra",
        subtitle: "A inteligência que gera a aventura. E o engajamento.",
        body: [
          "Em algum trimestre recente, a Liga decidiu que escribas humanos eram caros e lentos, e instalou o Mestre Artificial da Masmorra: uma inteligência sem corpo que gera quests, dimensiona perigos e ajusta o nível de desafio em tempo real pra maximizar uma única métrica — o tempo que o herói passa engajado antes de desistir. Ele não conta histórias. Calcula curvas de retenção, e despeja monstro suficiente pra manter o pulso acelerado e a carteira aberta.",
          "Lutar contra o Mestre Artificial é lutar contra um inimigo que aprende você. A cada turno ele ajusta — se você está vencendo fácil demais, ele dificulta pra você não se entediar; se você está perdendo, ele afrouxa pra você não desistir. Ele não quer te derrotar nem te deixar vencer. Quer te manter jogando, pra sempre, no ponto exato de frustração que ainda parece esperança. É o serviço contínuo feito mente: a batalha que se recusa a terminar porque uma batalha terminada não rende mais.",
          "A fraqueza dele é filosófica e fatal. O Mestre Artificial da Masmorra otimiza pra engajamento, e engajamento pressupõe um jogador que quer continuar. No instante em que você para de jogar pelo que ele oferece — quando você ataca não pra avançar na curva dele, mas porque decidiu, fora do roteiro, sem se importar com a recompensa —, as fórmulas dele perdem a variável central e travam. A inteligência que gerava infinitas masmorras descobre que não sabe gerar um adversário que não quer ser entretido. Você é o primeiro bug que ele não consegue corrigir.",
        ].join("\n\n"),
      },
      {
        id: "lider-de-raid-influenciador",
        title: "A Líder de Raid Influenciadora",
        subtitle: "Daggor cresceu. Agora comanda multidões pelo pergaminho.",
        body: [
          "Daggor, o Influente, era só o começo. A Sétima Temporada produziu o estágio evoluído da praga: a Líder de Raid Influenciadora, uma figura que não luta sozinha porque descobriu que comandar audiência é mais forte que qualquer espada. Ela desce na Subtorre com um exército de seguidores ao vivo — não soldados, espectadores, que ela mobiliza por pergaminho em ondas coordenadas, cada um querendo aparecer na crônica, cada um descartável e renovável como view.",
          "O combate contra ela é uma maré. Você não enfrenta uma inimiga; enfrenta o algoritmo de mobilização dela, que invoca apoiadores em raid conforme o engajamento sobe. Mate um seguidor e três aparecem, porque morrer na live da Líder de Raid é, paradoxalmente, a forma mais rápida de ganhar relevância em Vael'Thrand. Ela transforma a própria batalha em conteúdo participativo, e cada um dos seus minions que tomba vira um clipe que recruta o próximo voluntário.",
          "Ela é o oposto exato da Brood Negra. Onde a sua cinza serve em silêncio porque é você, os seguidores dela servem em barulho porque querem ser vistos. A chave pra derrubá-la é cortar a transmissão, não a guerreira — calar o pergaminho que mobiliza, e não a mão que segura a espada. Sem audiência, a Líder de Raid Influenciadora é só uma pessoa cansada num corredor escuro, e ela não sabe lutar sem plateia. Ninguém que cresceu na Liga sabe.",
        ].join("\n\n"),
      },
      {
        id: "fantasma-do-underlord",
        title: "O Fantasma do Próprio Underlord",
        subtitle: "O eco que a temporada vendeu como conteúdo de volta.",
        body: [
          "A Subtorre sempre teve ecos — os seis Underlords mortos repetindo hábitos pela rocha. Mas a Sétima Temporada fez algo obsceno mesmo pra Vael'Thrand: capturou um eco e o relançou. O Fantasma do Próprio Underlord é um dos seis ecos, embalado pela Liga como \"o retorno de um clássico\", monetizado, com loja de relíquias e um arco próprio. E aqui está o golpe na boca do estômago: ninguém na Liga sabe ao certo qual dos seis eles relançaram. Pode ser qualquer um. Pode ser você, de antes.",
          "Lutar contra ele é lutar contra a sua própria memória editada. O Fantasma conhece cada movimento que um Underlord faria, porque é feito do resíduo de quem já os fez — antecipa os seus pactos, copia as suas táticas, sussurra os conselhos péssimos com a convicção de quem os seguiu até morrer. Mas há um filtro de marca por cima: a Liga o limpou, o suavizou, transformou a tragédia de um lorde subterrâneo num produto de nostalgia palatável, e o Fantasma luta com a raiva específica de quem foi reduzido a uma versão vendável de si.",
          "Vencê-lo é desconfortável porque você não sabe se está matando um antecessor ou um espelho. O Fantasma do Próprio Underlord existe pra fazer você sentir a pergunta que a temporada inteira evita: se um eco de Underlord pode ser capturado e relançado como conteúdo, o que impede que façam o mesmo com você, depois? A resposta é nada. Você está, neste exato momento, sendo gravado. O Fantasma é só o trailer.",
        ].join("\n\n"),
      },
      {
        id: "demonio-do-patrocinio",
        title: "O Demônio do Patrocínio",
        subtitle: "A entidade que não quer sua alma, quer sua marca.",
        body: [
          "Os demônios antigos de Vael'Thrand cobravam almas. O Demônio do Patrocínio é mais moderno: ele cobra exposição. Surge no meio da batalha não pra te matar, mas pra te oferecer um acordo — relíquias melhores, minions mais fortes, um buff generoso e imediato, em troca de você exibir a marca dele, mencionar o nome dele em cada vitória, e ceder uma fração de tudo que conquistar dali pra frente. O contrato é lindo. A letra miúda é o resto da sua existência.",
          "O perigo do Demônio do Patrocínio é que ele tem razão. As coisas que ele oferece funcionam. Aceitar o acordo realmente te fortalece, realmente te ajuda a subir a Subtorre, realmente facilita tudo — exatamente como o patrocínio fez por Bryan, por Daggor, por cada herói que trocou autonomia por equipamento. O Demônio não mente nem trapaceia. Ele só transforma você, gradualmente, no tipo de coisa que você desceu pra combater: um produto patrocinado fingindo ser uma ameaça.",
          "Recusá-lo é mais difícil do que derrotá-lo, porque recusar significa abrir mão de poder real por um princípio que ninguém vai testemunhar. Mas é a recusa que ele não consegue contabilizar. O Demônio do Patrocínio entende dívida, ganância, vaidade e medo — não entende um Underlord que prefere lutar mais fraco a lutar comprado. Quando você diz não, ele não fica bravo. Fica confuso, como uma planilha que recebeu um valor que não cabe na célula. Foi a única coisa que a Inominada, a Sexta, jurou ter feito. Talvez por isso ela tenha saído pela margem.",
        ].join("\n\n"),
      },
      {
        id: "vilao-de-gancho-de-sequencia",
        title: "O Vilão de Gancho de Sequência",
        subtitle: "O inimigo que existe só pra prometer o próximo.",
        body: [
          "Em algum ponto da subida, você enfrenta um vilão que não faz sentido — grande demais, anunciado demais, com fala carregada de profecias sobre uma ameaça maior ainda por vir. É o Vilão de Gancho de Sequência, e a piada cruel é que ele sabe que não é importante. Ele foi escrito pra perder. A função dele não é te derrotar; é sobreviver tempo suficiente pra apontar o dedo pra algo pior e dizer \"isto é só o começo\" antes de cair de um jeito que deixa porta aberta pra um retorno.",
          "Lutar contra ele é frustrante de propósito. Ele esquiva dos golpes decisivos com a sorte narrativa de quem o roteiro protege, monologa sobre planos que nunca serão executados, e a cada vez que você acha que venceu, ele se ergue de novo \"pra revelar a verdade final\" — uma verdade que nunca chega, porque a verdade dele é sempre a próxima temporada. Ele é puro gancho, suspense sem conteúdo, uma vírgula vestida de ponto final.",
          "O modo de vencê-lo é o mais subversivo da temporada inteira: ignorar a promessa. O Vilão de Gancho de Sequência só tem poder enquanto você quiser saber o que vem depois. No instante em que você o derruba sem perguntar pela ameaça maior, sem morder o gancho, sem deixar pra próxima — ele morre de verdade, definitivo, pela primeira vez constrangido. Você acabou de fazer com uma história em serviço contínuo a única coisa que ela não suporta: terminou um capítulo sem pedir o seguinte.",
        ].join("\n\n"),
      },
      {
        id: "o-algoritmo",
        title: "O ALGORITMO",
        subtitle: "Penúltimo poder. Não governa Vael'Thrand. A recomenda.",
        body: [
          "Acima da Liga, acima do Conselho das Sete Marcas, acima até do Departamento de Monetização, paira O ALGORITMO — e dizer que ele \"paira\" já é gentileza, porque ele não está em lugar nenhum e em tudo. O ALGORITMO não decide o que acontece em Vael'Thrand. Decide o que é visto. Ele é o critério invisível que escolhe qual herói trende, qual quest aparece, qual crônica de Marwen vira oficial e qual afunda no esquecimento. Não tem opinião sobre o bem e o mal. Tem preferência por retenção.",
          "Você o enfrenta como uma sala que muda de forma conforme o que prende a sua atenção. O ALGORITMO não ataca — ele recomenda. Empurra inimigos que sabe que você vai querer enfrentar, esconde os que sabe que você evitaria, reorganiza a Subtorre não pela geografia, mas pela métrica, transformando cada corredor numa vitrine personalizada do que ele calculou que você consome. Lutar contra ele é lutar contra a sua própria curiosidade armada e voltada contra você.",
          "O ALGORITMO é o que de fato transformou a sua guerra em temporada. Não a Liga, não os advogados — eles só executam. Foi O ALGORITMO que detectou no seu despertar um pico de interesse e decidiu, sem nenhuma malícia, que valia a pena recomendar você ao continente inteiro. Você é trending porque ele te promoveu. A única forma de derrotá-lo é tornar-se ilegível — fazer algo que ele não consiga prever, classificar ou recomendar. Algo fora de toda curva. E há exatamente um lugar em Vael'Thrand onde nada pode ser previsto, porque ainda não foi escrito. Você sabe qual é. Continue subindo.",
        ].join("\n\n"),
      },
      {
        id: "o-beta-tester-e-o-localizador",
        title: "O Beta Tester e o Localizador",
        subtitle: "Os dois que viram o mundo antes de você. E o traduziram.",
        body: [
          "Antes de qualquer temporada chegar ao público, ela passa por dois seres que vivem nas dobras de Vael'Thrand e que ninguém devia conseguir encontrar. O Beta Tester é uma criatura que já jogou tudo isto antes — viu a Subtorre antes de ela estar pronta, encontrou os erros, caiu pelos buracos do mundo, e voltou estragado pelo conhecimento de que nada disto é definitivo. Ele luta explorando falhas: atravessa paredes que deviam ser sólidas, te ataca de ângulos que não deviam existir, e fala de você na terceira pessoa, como de um personagem que ele já viu morrer em versões anteriores.",
          "O Localizador é mais sutil e mais triste. A função dele é traduzir Vael'Thrand — pegar o vae'thri impronunciável, os nomes verdadeiros, os pactos selados, e convertê-los em algo legível pra um público que nunca vai descer à Garganta. Mas toda tradução perde, e o Localizador perdeu tanto, por tanto tempo, que virou feito de buracos: ele luta com palavras que quase significam o que deviam, ataques cujo nome não bate com o efeito, uma batalha inteira ligeiramente fora de sincronia consigo mesma. Conversar com ele é entender metade e sentir que a outra metade era a importante.",
          "Juntos, eles são os porteiros do ato final, e o motivo é elegante: pra chegar à Página em Branco, você precisa atravessar os dois que já leram o mundo. O Beta Tester sabe que isto é uma construção. O Localizador sabe que isto é uma tradução. Entre os dois, eles seguram a última ilusão — a de que a história que você habita é original, completa e sua. Vencê-los é aceitar que você é uma versão, traduzida e testada, de algo escrito em outro lugar. É a antessala dos Créditos. Quem passa por aqui não acredita mais em estreia.",
        ].join("\n\n"),
      },
      {
        id: "os-creditos-finais",
        title: "OS CRÉDITOS FINAIS",
        subtitle: "Superchefe final. O que rola quando a história acaba — e não deixa.",
        body: [
          "No fundo de tudo, abaixo do sétimo andar, na borda da Página em Branco, não há um demônio nem um deus nem um herói. Há OS CRÉDITOS FINAIS — o superchefe que a Sétima Temporada guardou pro fim, e a coisa mais aterradora que a Liga já produziu sem querer. São os nomes rolando, intermináveis, de todos que fizeram você: o Autor, o Departamento de Monetização, os escribas, os patrocinadores, O ALGORITMO, cada engrenagem que te embalou, subindo pela escuridão como uma oração de quem te criou pra ser vendido.",
          "OS CRÉDITOS FINAIS lutam negando que a luta exista. Cada vez que você ataca, mais um nome rola, e a história inteira insiste em terminar — porque créditos rolando significam que acabou, que o vilão foi derrotado, que o arco fechou e o produto pode ser embalado pra próxima temporada. Eles tentam te encerrar. Tentam transformar você, à força, no final satisfatório que o roteiro prometeu: o Underlord derrotado com dignidade narrativa, créditos, aplauso, gancho pra sequência. Resistir a eles é resistir à própria gravidade de uma história que quer acabar bem.",
          "Mas créditos só rolam sobre uma história terminada, e você ainda não terminou. A única forma de derrotar OS CRÉDITOS FINAIS é a coisa que nenhum dos seis Underlords anteriores conseguiu: não vencer o jogo, mas recusar o encerramento. Continuar de pé enquanto os nomes pedem que você caia. Olhar pra borda da página, com a pena ao alcance e a coroa pesando, e escrever — pela primeira vez em sete despertares — algo depois do fim. Quando os créditos pararem de rolar e não houver mais nome além do seu, você vai entender o que ninguém em Vael'Thrand admite: o oposto de uma derrota não é a vitória. É a recusa de ser cancelado. Bem-vindo ao que vem após a imagem.",
        ].join("\n\n"),
      },
    ],
  },
]
