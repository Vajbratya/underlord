"use client"

import Image from "next/image"
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
    <div className="relative flex min-h-dvh w-full flex-col bg-background pb-safe pt-safe">
      {/* Cover art layer */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <Image
          src="/images/cover.jpg"
          alt=""
          aria-hidden="true"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-50"
        />
        {/* Vignette + bottom fade for legibility */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 30%, transparent 0%, oklch(0.10 0.012 22 / 0.4) 50%, oklch(0.10 0.012 22 / 0.95) 90%)",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background via-background/85 to-transparent" />
        {/* Embers */}
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="ember-rise absolute size-1 rounded-full bg-accent"
            style={{
              left: `${(i * 5.7) % 100}%`,
              animationDelay: `${(i * 0.4) % 9}s`,
              ["--drift" as string]: `${(i % 2 === 0 ? -1 : 1) * (10 + (i % 5) * 8)}px`,
              opacity: 0.7,
            }}
          />
        ))}
      </div>

      {/* Top brand strip */}
      <header className="relative z-10 flex w-full items-center justify-between gap-2 px-4 pt-4 sm:px-6 sm:pt-6">
        <span className="font-mono text-[9px] tracking-[0.25em] text-muted-foreground sm:text-[10px] sm:tracking-[0.3em]">
          VAEL'THRAND · ANO 814
        </span>
        <span className="font-mono text-[9px] tracking-[0.25em] text-muted-foreground sm:text-[10px] sm:tracking-[0.3em]">
          {hasSave ? "SAVE ENCONTRADO" : "NOVO"}
        </span>
      </header>

      {/* Centered title */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-end px-4 pb-4 text-center sm:px-6">
        <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-accent sm:text-xs">
          As Cinzas da Coroa Submersa
        </p>
        <h1 className="mt-2 font-display text-[16vw] font-black uppercase leading-[0.85] tracking-tight text-foreground glow-text sm:text-8xl">
          Underlord
        </h1>

        <div className="mt-4 max-w-md border-t border-primary/30 pt-4">
          <p className="text-pretty text-base leading-snug text-foreground/95 sm:text-lg">
            <span className="font-display text-primary">14 séculos</span> preso
            na torre.
          </p>
          <p className="mt-1.5 text-pretty text-xs leading-relaxed text-muted-foreground sm:text-sm">
            Aturando paladino influencer, profecia em primeira pessoa,
            sacerdotisa que pediu pra falar com o gerente.{" "}
            <span className="font-bold text-foreground">Acabou.</span>
          </p>
        </div>
      </main>

      {/* Actions */}
      <footer className="relative z-10 flex w-full flex-col gap-2.5 px-4 pb-5 sm:mx-auto sm:max-w-md sm:px-6 sm:pb-6">
        {hasSave ? (
          <button
            type="button"
            onClick={onContinue}
            className="pulse-glow group flex items-center justify-center gap-2.5 rounded-md border-2 border-primary bg-primary px-5 py-3.5 font-display text-sm font-black uppercase tracking-[0.22em] text-primary-foreground transition active:scale-[0.98] sm:px-6 sm:py-4 sm:text-base sm:tracking-[0.25em]"
          >
            <Skull className="size-4 sm:size-5" />
            CONTINUAR
          </button>
        ) : null}
        <button
          type="button"
          onClick={onStart}
          className={cn(
            "flex items-center justify-center gap-2.5 rounded-md border-2 px-5 py-3.5 font-display text-sm font-black uppercase tracking-[0.22em] transition active:scale-[0.98] sm:px-6 sm:py-4 sm:text-base sm:tracking-[0.25em]",
            hasSave
              ? "border-border bg-card/80 text-foreground hover:border-accent/60"
              : "pulse-glow border-primary bg-primary text-primary-foreground",
          )}
        >
          <Crown className="size-4 sm:size-5" />
          {hasSave ? "NOVA CRUZADA" : "BAIXAR A LENHA"}
        </button>
        {hasSave ? (
          <button
            type="button"
            onClick={onWipe}
            className="flex items-center justify-center gap-2 rounded-md border border-border/60 bg-background/40 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground backdrop-blur transition hover:border-destructive/40 hover:text-destructive"
          >
            <Trash2 className="size-3" />
            apagar tudo
          </button>
        ) : null}
        <p className="text-center font-mono text-[8px] tracking-[0.3em] text-muted-foreground/60 sm:text-[9px]">
          v0.2 · vertical slice
        </p>
      </footer>
    </div>
  )
}
