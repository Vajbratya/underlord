"use client"

import { Crown, Skull, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { haptic } from "@/lib/underlord/haptics"
import { Atmosphere } from "./atmosphere"

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
  function tap(fn: () => void) {
    return () => {
      haptic.select()
      fn()
    }
  }

  return (
    <div className="relative flex min-h-dvh w-full flex-col bg-background pb-safe pt-safe">
      <Atmosphere src="/images/bg/title.jpg" intensity="default" embers={22} />

      {/* Top brand strip */}
      <header className="relative z-10 flex w-full items-center justify-between gap-2 px-5 pt-4 sm:px-8">
        <span className="font-mono text-[9px] tracking-[0.32em] text-muted-foreground sm:text-[10px] sm:tracking-[0.36em]">
          VAEL&apos;THRAND · 814
        </span>
        <span
          className={cn(
            "rounded-sm border px-2 py-1 font-mono text-[8px] tracking-[0.28em] sm:text-[9px]",
            hasSave
              ? "border-accent/70 bg-accent/15 text-accent"
              : "border-border bg-card/60 text-muted-foreground",
          )}
        >
          {hasSave ? "SAVE PRESENTE" : "NOVO REINADO"}
        </span>
      </header>

      {/* Title block — vertically centered with hard caps so desktop stays compact */}
      <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-end px-5 pb-3 text-center sm:justify-center sm:px-8 sm:pb-12">
        {/* Decorative chapter mark */}
        <div className="mb-3 flex items-center gap-3 opacity-90">
          <span className="h-px w-10 bg-gradient-to-r from-transparent to-accent/60" />
          <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-accent sm:text-[10px]">
            Capítulo Zero
          </span>
          <span className="h-px w-10 bg-gradient-to-l from-transparent to-accent/60" />
        </div>

        <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-foreground/85 sm:text-xs">
          As Cinzas da Coroa Submersa
        </p>

        {/* Hero title — clamp() guarantees a sane size from 360px phones to 4K monitors */}
        <h1
          className="mt-2 font-display font-black uppercase leading-[0.82] tracking-tight text-foreground"
          style={{
            fontSize: "clamp(3.5rem, 18vw, 9rem)",
            textShadow:
              "0 0 30px oklch(0.55 0.21 22 / 0.55), 0 0 60px oklch(0.72 0.17 60 / 0.30), 0 4px 0 oklch(0.10 0.012 22)",
          }}
        >
          Underlord
        </h1>

        {/* Underline ornament */}
        <div className="mt-2 flex items-center gap-2 opacity-90">
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-primary" />
          <span className="size-1.5 rotate-45 bg-primary" />
          <span className="h-px w-12 bg-gradient-to-l from-transparent to-primary" />
        </div>

        <p className="mt-4 max-w-xs text-balance text-base font-bold leading-tight text-foreground sm:max-w-md sm:text-lg">
          Você foi enterrado por{" "}
          <span className="text-primary">14 séculos</span>.
          <br />
          Agora a torre é sua.
        </p>
      </main>

      {/* PRIMARY ACTION ZONE — bottom 40% reserved for thumbs */}
      <footer className="relative z-10 mx-auto flex w-full max-w-md flex-col gap-2.5 px-5 pb-6 sm:px-8 sm:pb-7">
        {hasSave ? (
          <>
            <button
              type="button"
              onClick={tap(onContinue)}
              className="pulse-glow group relative flex h-16 items-center justify-center gap-3 overflow-hidden rounded-md border-2 border-primary bg-primary px-5 font-display text-base font-black uppercase tracking-[0.24em] text-primary-foreground transition active:scale-[0.97] sm:h-[4.5rem] sm:text-lg sm:tracking-[0.28em]"
              style={{
                boxShadow:
                  "inset 0 1px 0 oklch(1 0 0 / 0.18), inset 0 -2px 0 oklch(0 0 0 / 0.35), 0 6px 24px oklch(0.55 0.21 22 / 0.45)",
              }}
            >
              <Skull className="size-5 sm:size-6" />
              CONTINUAR
              <span
                className="absolute inset-y-0 left-[-30%] w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-[400%]"
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              onClick={tap(onStart)}
              className="flex h-12 items-center justify-center gap-2 rounded-md border-2 border-border bg-card/85 px-4 font-display text-xs font-black uppercase tracking-[0.24em] text-foreground backdrop-blur transition active:scale-[0.97] hover:border-accent/60 sm:text-sm"
            >
              <Crown className="size-4" />
              NOVA CRUZADA
            </button>
            <button
              type="button"
              onClick={tap(onWipe)}
              className="flex h-9 items-center justify-center gap-2 rounded-md border border-border/40 bg-background/30 font-mono text-[9px] uppercase tracking-[0.32em] text-muted-foreground backdrop-blur transition hover:border-destructive/40 hover:text-destructive"
            >
              <Trash2 className="size-3" />
              apagar tudo
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={tap(onStart)}
            className="pulse-glow group relative flex h-[4.5rem] items-center justify-center gap-3 overflow-hidden rounded-md border-2 border-primary bg-primary px-5 font-display text-lg font-black uppercase tracking-[0.24em] text-primary-foreground transition active:scale-[0.97] sm:h-20 sm:text-xl sm:tracking-[0.28em]"
            style={{
              boxShadow:
                "inset 0 1px 0 oklch(1 0 0 / 0.18), inset 0 -2px 0 oklch(0 0 0 / 0.35), 0 8px 32px oklch(0.55 0.21 22 / 0.55)",
            }}
          >
            <Crown className="size-6 sm:size-7" />
            BAIXAR A LENHA
            <span
              className="absolute inset-y-0 left-[-30%] w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-[400%]"
              aria-hidden="true"
            />
          </button>
        )}
        <p className="pt-1 text-center font-mono text-[8px] tracking-[0.34em] text-muted-foreground/70 sm:text-[9px]">
          v0.4 · vertical slice
        </p>
      </footer>
    </div>
  )
}
