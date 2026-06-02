import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Política de Privacidade — UNDERLORD",
  description: "Política de privacidade do jogo UNDERLORD.",
}

export default function PrivacidadePage() {
  return (
    <main className="mx-auto min-h-dvh max-w-2xl bg-background px-5 py-12 text-foreground">
      <h1 className="font-display text-3xl font-black uppercase tracking-wide text-foreground">
        Política de Privacidade
      </h1>
      <p className="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        UNDERLORD · atualizado em 02/06/2026
      </p>

      <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-foreground/85">
        <p>
          UNDERLORD ("o jogo") é um jogo de estratégia single-player que roda no
          seu navegador / dispositivo. Levamos sua privacidade a sério — e, na
          prática, mal coletamos qualquer coisa.
        </p>

        <h2 className="pt-2 font-display text-xl font-bold uppercase tracking-wide text-foreground">
          Dados que o jogo guarda
        </h2>
        <p>
          Todo o seu progresso (campanha, esquadrão, espólio, moedas, conquistas,
          configurações) é salvo <strong>localmente no seu próprio dispositivo</strong>,
          usando o armazenamento local do navegador (localStorage). Esses dados
          ficam só com você, nunca são enviados para nós, e somem se você limpar
          os dados do app/navegador.
        </p>

        <h2 className="pt-2 font-display text-xl font-bold uppercase tracking-wide text-foreground">
          Contas e dados pessoais
        </h2>
        <p>
          O jogo <strong>não pede login</strong>, não cria conta, e não coleta
          nome, e-mail, telefone, localização precisa, contatos ou qualquer dado
          que te identifique pessoalmente.
        </p>

        <h2 className="pt-2 font-display text-xl font-bold uppercase tracking-wide text-foreground">
          Métricas anônimas
        </h2>
        <p>
          Podemos usar métricas agregadas e anônimas de uso (por exemplo, Vercel
          Analytics) apenas para entender desempenho e quantas pessoas jogam.
          Essas métricas não identificam usuários individualmente.
        </p>

        <h2 className="pt-2 font-display text-xl font-bold uppercase tracking-wide text-foreground">
          Crianças
        </h2>
        <p>
          O jogo não direciona conteúdo a crianças nem coleta dados delas
          intencionalmente.
        </p>

        <h2 className="pt-2 font-display text-xl font-bold uppercase tracking-wide text-foreground">
          Contato
        </h2>
        <p>
          Dúvidas sobre esta política? Fale com o desenvolvedor pelo canal de
          contato listado na página do app na Google Play.
        </p>
        <p className="pt-4 text-sm text-muted-foreground">
          Alterações nesta política serão publicadas nesta mesma página.
        </p>
      </div>
    </main>
  )
}
