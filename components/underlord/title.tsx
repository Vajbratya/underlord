"use client"

import { Crown, Skull, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function TitleScreen({
  hasSave,
  onStart,
  onContinue,
  onWipe,
}: {
  hasSave: boolean
  onStart: () => void
  onContinue: () => void
  onWipe: () => void
}) {
  return (
    <div className="relative flex min-h-dvh w-full flex-col items-center justify-between overflow-hidden bg-background pb-safe pt-safe">
      {/* Embers */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            className="ember-rise absolute size-1 rounded-full bg-accent"
            style={{
              left: `${(i * 4.3) % 100}%`,
              animationDelay: `${(i * 0.4) % 9}s`,
              ["--drift" as string]: `${(i % 2 === 0 ? -1 : 1) * (10 + (i % 5) * 8)}px`,
              opacity: 0.8,
            }}
          />
        ))}
      </div>

      {/* Top brand strip */}
      <header className="relative z-10 flex w-full items-center justify-between px-6 pt-6">
        <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">
          VAEL'THRAND · ANO 814 DA PROFANAÇÃO
        </span>
        <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">
          SAVE {hasSave ? "ENCONTRADO" : "AUSENTE"}
        </span>
      </header>

      {/* Center mark */}
      <main className="relative z-10 flex w-full max-w-md flex-col items-center px-6 text-center">
        <div className="relative mb-6 flex size-32 items-center justify-center sm:size-40">
          {/* Rotating sigil */}
          <div className="seal-rotate absolute inset-0 rounded-full border-2 border-primary/30" />
          <div
            className="seal-rotate absolute inset-2 rounded-full border border-accent/20"
            style={{ animationDirection: "reverse", animationDuration: "60s" }}
          />
          <Crown
            className="size-16 text-primary drop-shadow-[0_0_24px_oklch(0.55_0.21_22/0.6)] sm:size-20"
            strokeWidth={1.4}
          />
          {/* Blood drips */}
          <span
            className="blood-drip absolute left-[42%] top-[55%] h-3 w-0.5 rounded-full bg-primary"
            style={{ animationDelay: "0s" }}
          />
          <span
            className="blood-drip absolute left-[58%] top-[55%] h-3 w-0.5 rounded-full bg-primary"
            style={{ animationDelay: "1.1s" }}
          />
        </div>

        <h1 className="font-display text-5xl font-black uppercase leading-none tracking-tight text-foreground glow-text sm:text-7xl">
          Underlord
        </h1>
        <p className="mt-3 max-w-sm text-balance font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground sm:text-xs">
          As Cinzas da Coroa Submersa
        </p>

        <div className="mt-8 max-w-sm border-t border-border/60 pt-6">
          <p className="text-pretty text-sm leading-relaxed text-foreground/90 sm:text-base">
            <span className="font-display text-lg text-primary">14 séculos</span>{" "}
            preso na torre.
          </p>
          <p className="mt-2 text-pretty text-xs leading-relaxed text-muted-foreground sm:text-sm">
            14 séculos aturando paladino influencer, profecia em primeira pessoa,
            sacerdotisa que pediu pra falar com o gerente.{" "}
            <span className="font-bold text-foreground">Acabou.</span>
          </p>
        </div>
      </main>

      {/* Actions */}
      <footer className="relative z-10 flex w-full max-w-md flex-col gap-3 px-6 pb-6">
        {hasSave ? (
          <button
            type="button"
            onClick={onContinue}
            className="pulse-glow group flex items-center justify-center gap-3 rounded-md border-2 border-primary bg-primary px-6 py-4 font-display text-base font-black uppercase tracking-[0.25em] text-primary-foreground transition active:scale-[0.98] sm:text-lg"
            style={{ ["--tw-shadow-color" as string]: "oklch(0.55 0.21 22 / 0.5)" }}
          >
            <Skull className="size-5" />
            CONTINUAR
          </button>
        ) : null}
        <button
          type="button"
          onClick={onStart}
          className={cn(
            "flex items-center justify-center gap-3 rounded-md border-2 px-6 py-4 font-display font-black uppercase tracking-[0.25em] transition active:scale-[0.98]",
            hasSave
              ? "border-border bg-card text-foreground hover:border-accent/60"
              : "pulse-glow border-primary bg-primary text-primary-foreground",
          )}
          style={
            !hasSave
              ? { ["--tw-shadow-color" as string]: "oklch(0.55 0.21 22 / 0.5)" }
              : undefined
          }
        >
          <Crown className="size-5" />
          {hasSave ? "NOVA CRUZADA" : "BAIXAR A LENHA"}
        </button>
        {hasSave ? (
          <button
            type="button"
            onClick={onWipe}
            className="flex items-center justify-center gap-2 rounded-md border border-border/60 bg-transparent px-4 py-2 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground transition hover:border-destructive/40 hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
            apagar tudo (sem volta)
          </button>
        ) : null}
        <p className="text-center font-mono text-[9px] tracking-[0.25em] text-muted-foreground/70">
          v0.1 · m1 vertical slice
        </p>
      </footer>
    </div>
  )
}
