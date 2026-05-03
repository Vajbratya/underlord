"use client"

import { useState } from "react"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const PANELS: Array<{ chapter: string; title: string; body: string }> = [
  {
    chapter: "I",
    title: "Era pra ter acabado",
    body:
      "Há 14 séculos, sete coroas dividiam Vael'Thrand. Seis caíram cedo. A sétima, a Coroa Submersa, foi enterrada no Cofre das Cinzas com o último Underlord. Você. Pacto de Ferro selou o túmulo. Final feliz.",
  },
  {
    chapter: "II",
    title: "Não acabou",
    body:
      "Os heróis ficaram entediados. Sem vilão, sem propósito. Inventaram quests pra galinha. Abriram dungeon de marmota. Pegaram o seu nome e viraram fantasia de carnaval. Cada criança aprende uma versão pior do que a anterior.",
  },
  {
    chapter: "III",
    title: "O Pacto rachou",
    body:
      "Ninguém manteve o selo. O reino virou uma franquia. Bryan, o Escolhido, está em segundo casamento. Tyrella quer falar com o gerente. Daggor posta no pergaminho. Você acordou faminto, irritado, e com 14 séculos de raiva acumulada.",
  },
  {
    chapter: "IV",
    title: "Hoje você devolve",
    body:
      "Você não tem exército. Tem minions. Cinco brood-types, sangue ruim, lealdade discutível. Mas tem você. E você lembra de cada herói. Cada nome. Cada hashtag. Vai ser um por um.",
  },
]

export function IntroSequence({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0)
  const panel = PANELS[i]
  const last = i === PANELS.length - 1

  return (
    <div className="relative flex min-h-dvh w-full flex-col bg-background pb-safe pt-safe">
      {/* Top progress */}
      <div className="flex items-center justify-between px-6 pt-6">
        <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">
          PRÓLOGO {String(i + 1).padStart(2, "0")} / 04
        </span>
        <button
          type="button"
          onClick={onDone}
          className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground transition hover:text-foreground"
        >
          PULAR &rsaquo;
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-8">
        <article
          key={panel.chapter}
          className="vellum drop-in grain relative w-full max-w-md overflow-hidden rounded-lg border-2 border-border p-6 sm:p-8"
        >
          <div className="absolute right-3 top-3 font-display text-5xl font-black leading-none text-primary/15 sm:text-7xl">
            {panel.chapter}
          </div>
          <p className="font-mono text-[10px] tracking-[0.32em] text-accent">
            CAPÍTULO {panel.chapter}
          </p>
          <h2 className="mt-1 font-display text-2xl font-black uppercase leading-tight text-foreground sm:text-3xl">
            {panel.title}
          </h2>
          <p className="mt-4 text-pretty text-sm leading-relaxed text-foreground/85 sm:text-base">
            {panel.body}
          </p>
        </article>

        {/* Dots */}
        <div className="mt-6 flex gap-2">
          {PANELS.map((_, idx) => (
            <span
              key={idx}
              className={cn(
                "h-1 w-8 rounded-full transition",
                idx === i
                  ? "bg-primary"
                  : idx < i
                    ? "bg-accent/40"
                    : "bg-border",
              )}
            />
          ))}
        </div>
      </div>

      <div className="px-6 pb-6">
        <button
          type="button"
          onClick={() => (last ? onDone() : setI(i + 1))}
          className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-primary bg-primary px-6 py-4 font-display text-base font-black uppercase tracking-[0.25em] text-primary-foreground transition active:scale-[0.98]"
        >
          {last ? "ENTRAR NA SALA DE GUERRA" : "SEGUE"}
          <ChevronRight className="size-5" />
        </button>
      </div>
    </div>
  )
}
