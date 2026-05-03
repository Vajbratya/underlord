"use client"

import Image from "next/image"
import { Crown, Skull, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { haptic } from "@/lib/underlord/haptics"

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
      {/* Cover art */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <Image
          src="/images/cover.jpg"
          alt=""
          aria-hidden="true"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-55"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 25%, transparent 0%, oklch(0.10 0.012 22 / 0.5) 55%, oklch(0.10 0.012 22 / 0.97) 92%)",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background via-background/90 to-transparent" />
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            className="ember-rise absolute size-1 rounded-full bg-accent"
            style={{
              left: `${(i * 7.3) % 100}%`,
              animationDelay: `${(i * 0.5) % 9}s`,
              ["--drift" as string]: `${(i % 2 === 0 ? -1 : 1) * (10 + (i % 5) * 8)}px`,
              opacity: 0.7,
            }}
          />
        ))}
      </div>

      {/* Top brand strip */}
      <header className="relative z-10 flex w-full items-center justify-between gap-2 px-4 pt-4 sm:px-6">
        <span className="font-mono text-[9px] tracking-[0.25em] text-muted-foreground sm:text-[10px] sm:tracking-[0.3em]">
          VAEL&apos;THRAND · 814
        </span>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 font-mono text-[8px] tracking-[0.25em] sm:text-[9px]",
            hasSave
              ? "border-accent/60 bg-accent/10 text-accent"
              : "border-border bg-card/60 text-muted-foreground",
          )}
        >
          {hasSave ? "SAVE" : "NOVO"}
        </span>
      </header>

      {/* Title block — pushed to upper-middle so the lower 45% stays clear for thumbs */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-end px-4 pb-2 text-center sm:px-6">
        <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-accent sm:text-xs">
          As Cinzas da Coroa Submersa
        </p>
        <h1 className="mt-1 font-display text-[18vw] font-black uppercase leading-[0.82] tracking-tight text-foreground glow-text sm:text-[8rem]">
          Underlord
        </h1>
        <p className="mt-3 max-w-xs text-balance text-base font-bold leading-tight text-foreground/95 sm:max-w-sm sm:text-lg">
          Você foi enterrado por{" "}
          <span className="text-primary">14 séculos</span>.
          <br />
          Agora a torre é sua.
        </p>
      </main>

      {/* PRIMARY ACTION ZONE — bottom 40% reserved for thumbs */}
      <footer className="relative z-10 mx-auto flex w-full max-w-md flex-col gap-2.5 px-4 pb-5 sm:px-6 sm:pb-6">
        {hasSave ? (
          <>
            <button
              type="button"
              onClick={tap(onContinue)}
              className="pulse-glow flex h-16 items-center justify-center gap-3 rounded-md border-2 border-primary bg-primary px-5 font-display text-base font-black uppercase tracking-[0.22em] text-primary-foreground transition active:scale-[0.97] sm:h-[4.5rem] sm:text-lg sm:tracking-[0.25em]"
            >
              <Skull className="size-5 sm:size-6" />
              CONTINUAR
            </button>
            <button
              type="button"
              onClick={tap(onStart)}
              className="flex h-12 items-center justify-center gap-2 rounded-md border-2 border-border bg-card/80 px-4 font-display text-xs font-black uppercase tracking-[0.22em] text-foreground transition active:scale-[0.97] hover:border-accent/60 sm:text-sm"
            >
              <Crown className="size-4" />
              NOVA CRUZADA
            </button>
            <button
              type="button"
              onClick={tap(onWipe)}
              className="flex h-9 items-center justify-center gap-2 rounded-md border border-border/50 bg-background/40 font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground backdrop-blur transition hover:border-destructive/40 hover:text-destructive"
            >
              <Trash2 className="size-3" />
              apagar tudo
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={tap(onStart)}
            className="pulse-glow flex h-[4.5rem] items-center justify-center gap-3 rounded-md border-2 border-primary bg-primary px-5 font-display text-lg font-black uppercase tracking-[0.22em] text-primary-foreground transition active:scale-[0.97] sm:h-20 sm:text-xl sm:tracking-[0.25em]"
          >
            <Crown className="size-6 sm:size-7" />
            BAIXAR A LENHA
          </button>
        )}
        <p className="pt-1 text-center font-mono text-[8px] tracking-[0.3em] text-muted-foreground/60 sm:text-[9px]">
          v0.3 · vertical slice
        </p>
      </footer>
    </div>
  )
}
