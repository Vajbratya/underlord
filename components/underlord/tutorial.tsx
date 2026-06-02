"use client"

/**
 * TUTORIAL — full-screen onboarding carousel, narrated by the Underlord.
 *
 * Dark-fantasy satire in PT-BR. The Underlord (seventh of his name, freshly
 * exhumed) walks you through the rules with the enthusiasm of someone who
 * has done this six times before and buried six predecessors.
 *
 * Self-contained: only deps are lucide-react icons + `cn`. Single prop
 * `onClose` — fired by both "Pular" and the final "Começar". Step state lives
 * locally; nothing is persisted here (the caller decides whether to show it).
 *
 * Matches the rest of the Underlord UI: bg-background, border-border,
 * text-gold/primary/accent, font-display headings, font-mono labels,
 * mobile-first with safe-area padding.
 */

import { useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  Hexagon,
  Swords,
  Users,
  Sparkles,
  Target,
  Gem,
  TrendingUp,
  Skull,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Step = {
  icon: LucideIcon
  /** Tiny eyebrow label above the title (font-mono). */
  kicker: string
  title: string
  /** 1-3 short paragraphs. */
  body: string[]
}

const STEPS: Step[] = [
  {
    icon: Crown,
    kicker: "PACTO · I",
    title: "Você de novo, enfim",
    body: [
      "Bem-vindo de volta ao mundo dos mortos-que-mandam. Você é o sétimo Underlord — os outros seis viraram poeira ambiciosa, e agora a vez é sua.",
      "Vael'Thrand passou catorze séculos em paz e os heróis estão entediados, gordos e insuportáveis. Sua tarefa é simples: retomar o continente, andar por andar, e lembrá-los do que é o medo.",
      "Eu narro. Você comanda. Os heróis morrem. Trabalho em equipe.",
    ],
  },
  {
    icon: Hexagon,
    kicker: "REGRAS · II",
    title: "Combate no hexágono",
    body: [
      "Cada batalha acontece num grid de hexágonos. Cada uma das suas unidades tem, por turno, exatamente 1 MOVIMENTO e 1 AÇÃO — moveu e bateu, acabou. Estilo XCOM, sem trapaça.",
      "Posicione antes de bater: flanco vale mais que coragem. Quando não houver mais nada de útil a fazer, aperte PASSAR e devolva o turno aos insuportáveis.",
    ],
  },
  {
    icon: Swords,
    kicker: "REGRAS · III",
    title: "O triângulo do massacre",
    body: [
      "Tipos de ataque se contra-atacam — pedra, papel, tesoura, mas com mais sangue. Composição certa decide a luta antes do primeiro golpe.",
      "AOE pune aglomerados. EXECUTA finaliza os feridos. CURA sustenta os teimosos. PERFURA acerta tudo em linha. MALDIÇÃO amplia o dano recebido. SANGRA fere por vários turnos. RAIO salta pro próximo alvo.",
      "Traga a faca certa pro pescoço certo. Levar só martelo é como os seis anteriores pensavam.",
    ],
  },
  {
    icon: Users,
    kicker: "EXÉRCITO · IV",
    title: "Sua horda",
    body: [
      "Subindo de nível você recruta arquétipos pra sua coleção de criaturas mal-pagas. Cada um cumpre um papel: tanque que apanha, cura que remenda, dano que mata, alcance que humilha de longe.",
      "Monte o esquadrão na Sala de Guerra antes de cada batalha. Um time só de glass cannons é lindo — até o primeiro contra-ataque transformar todos em estilhaço.",
    ],
  },
  {
    icon: Sparkles,
    kicker: "PODER · V",
    title: "Habilidades",
    body: [
      "Você, o Underlord, tem habilidades equipáveis — escolha as que combinam com seu plano sórdido do dia.",
      "Alguns minions também trazem especiais próprios. Leia o que cada um faz; surpresa no campo de batalha geralmente é a sua, não a do inimigo.",
    ],
  },
  {
    icon: Target,
    kicker: "MISSÃO · VI",
    title: "Nem todo dia é chacina",
    body: [
      "O objetivo varia. Às vezes é exterminar todo mundo (clássico, reconfortante). Às vezes é só sobreviver X turnos, assassinar um alvo específico, ou fazer uma blitz e dominar antes que reajam.",
      "E há os PRESSÁGIOS: modificadores aleatórios que mudam o campo a cada luta. Leia o presságio antes de mover — ou descubra do jeito difícil, como é tradição.",
    ],
  },
  {
    icon: Gem,
    kicker: "ESPÓLIO · VII",
    title: "Espólio e Corrupção",
    body: [
      "Você saqueia itens. Itens dão poder. Poder vicia. Coincidência? Não.",
      "Cada item carrega Taint — Corrupção que se acumula a cada equipamento ganancioso. Mais força, mais risco. Saber até onde apertar é metade do jogo; a outra metade é não escutar a si mesmo.",
    ],
  },
  {
    icon: TrendingUp,
    kicker: "ETERNO · VIII",
    title: "Progressão sem fim",
    body: [
      "Entre as batalhas, você cresce: a Forja troca poeira por perks permanentes, as Bençãos te dão buffs de run, e a Ascensão sobe a dificuldade em troca de mais espólio — coragem rende.",
      "Quer mais? O Poço Sem Fundo é uma run infinita pra ver até onde aguenta, e os Contratos são missões diárias com recompensa.",
      "Sim, tem grind. É de propósito. A eternidade é longa e você não tinha nada melhor pra fazer mesmo.",
    ],
  },
  {
    icon: Skull,
    kicker: "ENFIM · IX",
    title: "Vá",
    body: [
      "Você já sabe o suficiente pra ser perigoso e pouco o bastante pra ser divertido.",
      "Os heróis não vão se matar sozinhos. Eu já tentei convencê-los. Decepcionante.",
    ],
  },
]

export function Tutorial({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0)

  const total = STEPS.length
  const current = STEPS[step]
  const Icon = current.icon
  const isFirst = step === 0
  const isLast = step === total - 1

  function go(delta: number) {
    setStep((s) => Math.max(0, Math.min(total - 1, s + delta)))
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-background pb-safe pt-safe"
      role="dialog"
      aria-modal="true"
      aria-label="Tutorial"
    >
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex flex-col">
          <span className="font-mono text-[9px] uppercase tracking-[0.32em] text-accent sm:text-[10px]">
            VAEL&apos;THRAND · O PACTO
          </span>
          <h1 className="font-display text-lg font-black uppercase leading-none tracking-tight text-foreground sm:text-xl">
            Manual do Underlord
          </h1>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-border bg-card/70 px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground transition active:scale-95 hover:text-foreground"
        >
          Pular
        </button>
      </header>

      {/* Body — single step, scrollable on tiny screens */}
      <main className="flex flex-1 min-h-0 items-center justify-center overflow-y-auto px-5 py-6 sm:px-8 sm:py-10">
        <article className="mx-auto flex w-full max-w-xl flex-col items-center text-center">
          <span className="grid size-16 place-items-center rounded-2xl border-2 border-primary/40 bg-primary/10 text-primary sm:size-20">
            <Icon className="size-7 sm:size-9" />
          </span>

          <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.32em] text-accent">
            {current.kicker}
          </p>
          <h2 className="mt-1.5 text-balance font-display text-2xl font-black uppercase leading-tight text-foreground sm:text-3xl">
            {current.title}
          </h2>

          <div className="mt-5 flex flex-col gap-3.5 text-pretty text-[15px] leading-relaxed text-foreground/90 sm:gap-4 sm:text-base">
            {current.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-2 opacity-60">
            <span className="h-px w-10 bg-border" />
            <span className="size-1 rotate-45 bg-accent" />
            <span className="h-px w-10 bg-border" />
          </div>
        </article>
      </main>

      {/* Step dots */}
      <div className="flex shrink-0 items-center justify-center gap-1.5 px-4 pb-1 pt-2">
        {STEPS.map((s, i) => (
          <button
            key={s.kicker}
            type="button"
            onClick={() => setStep(i)}
            aria-label={`Passo ${i + 1}: ${s.title}`}
            aria-current={i === step}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === step
                ? "w-6 bg-gold"
                : "w-1.5 bg-border hover:bg-muted-foreground",
            )}
          />
        ))}
      </div>

      {/* Footer controls */}
      <footer className="flex items-center gap-3 border-t border-border/60 bg-background/95 px-4 py-4 backdrop-blur sm:px-6">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={isFirst}
          className="inline-flex items-center gap-1 rounded-lg border-2 border-border bg-card/60 px-4 py-3 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground transition active:scale-95 hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft className="size-4" />
          Anterior
        </button>

        <span className="flex-1 text-center font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground tabular-nums">
          {step + 1} / {total}
        </span>

        {isLast ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-primary bg-primary px-5 py-3 font-display text-sm font-black uppercase tracking-[0.22em] text-primary-foreground transition active:scale-95"
          >
            Começar
            <Skull className="size-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => go(1)}
            className="inline-flex items-center gap-1 rounded-lg border-2 border-primary bg-primary px-5 py-3 font-display text-sm font-black uppercase tracking-[0.22em] text-primary-foreground transition active:scale-95"
          >
            Próximo
            <ChevronRight className="size-4" />
          </button>
        )}
      </footer>
    </div>
  )
}
