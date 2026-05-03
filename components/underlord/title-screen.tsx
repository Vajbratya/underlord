"use client"

import { Crown, Skull, Trash2, ChevronRight } from "lucide-react"
import { COLD_OPEN, GAME_SUBTITLE, GAME_TITLE } from "@/lib/underlord/data"
import type { SaveState } from "@/lib/underlord/types"
import { cn } from "@/lib/utils"

interface Props {
  save: SaveState | null
  onNew: () => void
  onContinue: () => void
  onWipe: () => void
}

export function TitleScreen({ save, onNew, onContinue, onWipe }: Props) {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-between overflow-hidden px-5 pb-safe pt-safe">
      <Embers />
      <SealBackdrop />

      <header className="relative z-10 flex w-full max-w-2xl flex-col items-center pt-12 sm:pt-20">
        <p className="font-mono text-[10px] tracking-[0.5em] text-muted-foreground sm:text-xs">
          A SOVEREIGN RETURNS
        </p>
        <h1
          className={cn(
            "font-display mt-3 text-center text-4xl font-black leading-none text-foreground sm:text-6xl",
            "glow-text",
          )}
        >
          {GAME_TITLE}
        </h1>
        <p className="font-display mt-2 text-center text-[11px] font-medium tracking-[0.4em] text-primary sm:text-sm">
          {GAME_SUBTITLE}
        </p>

        <div className="mt-10 max-w-md text-center sm:mt-14">
          {COLD_OPEN.map((line, i) => (
            <p
              key={i}
              className="parchment mt-1.5 px-3 py-1 text-pretty text-[13px] leading-relaxed text-muted-foreground sm:text-sm"
              style={{ animationDelay: `${i * 0.4}s` }}
            >
              {line}
            </p>
          ))}
        </div>
      </header>

      <section className="relative z-10 mb-4 flex w-full max-w-md flex-col gap-2.5 sm:mb-12">
        {save ? (
          <button
            type="button"
            onClick={onContinue}
            className="group relative flex items-center justify-between gap-3 overflow-hidden rounded-md border-2 border-primary/60 bg-primary/10 px-4 py-3.5 text-left transition hover:border-primary hover:bg-primary/15 active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <Crown className="size-5 text-primary" aria-hidden="true" />
              <div className="flex flex-col">
                <span className="font-display text-sm font-black tracking-[0.2em] text-foreground">
                  CONTINUE
                </span>
                <span className="font-mono text-[10px] tracking-wider text-muted-foreground">
                  {save.underlord.name.toUpperCase()} · {save.underlord.school.toUpperCase()} · CYCLE{" "}
                  {String(save.cycle).padStart(2, "0")}
                </span>
              </div>
            </div>
            <ChevronRight className="size-5 text-primary/70 transition group-hover:translate-x-1 group-hover:text-primary" />
          </button>
        ) : null}

        <button
          type="button"
          onClick={onNew}
          className={cn(
            "group flex items-center justify-between gap-3 rounded-md border-2 px-4 py-3.5 text-left transition active:scale-[0.98]",
            save
              ? "border-border bg-card hover:border-foreground/40"
              : "border-primary/60 bg-primary/10 hover:border-primary hover:bg-primary/15 pulse-glow",
          )}
        >
          <div className="flex items-center gap-3">
            <Skull
              className={cn(
                "size-5",
                save ? "text-muted-foreground" : "text-primary",
              )}
              aria-hidden="true"
            />
            <div className="flex flex-col">
              <span className="font-display text-sm font-black tracking-[0.2em] text-foreground">
                {save ? "NEW REIGN" : "BEGIN"}
              </span>
              <span className="font-mono text-[10px] tracking-wider text-muted-foreground">
                {save
                  ? "Discard the old throne. Crown another."
                  : "Wake. Take the Crown."}
              </span>
            </div>
          </div>
          <ChevronRight className="size-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-foreground" />
        </button>

        {save ? (
          <button
            type="button"
            onClick={() => {
              if (confirm("Wipe the save? The Vault forgets nothing — but it may pretend.")) {
                onWipe()
              }
            }}
            className="flex items-center justify-center gap-2 self-center rounded px-3 py-2 font-mono text-[10px] tracking-[0.25em] text-muted-foreground transition hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
            WIPE SAVE
          </button>
        ) : null}

        <p className="mt-4 text-center font-mono text-[9px] tracking-[0.4em] text-muted-foreground/60 sm:text-[10px]">
          M1 · VERTICAL SLICE · {save ? "SAVE FOUND" : "NO SAVE"}
        </p>
      </section>
    </main>
  )
}

/* ------------------------------------------------------------------ */
/* Atmosphere                                                            */
/* ------------------------------------------------------------------ */

function SealBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      <div
        className="seal-rotate relative size-[140vmin] opacity-[0.06]"
        style={{
          backgroundImage:
            "conic-gradient(from 0deg, transparent 0%, oklch(0.68 0.18 45 / 0.5) 25%, transparent 50%, oklch(0.55 0.22 25 / 0.5) 75%, transparent 100%)",
          maskImage:
            "radial-gradient(circle, black 40%, transparent 70%)",
          WebkitMaskImage:
            "radial-gradient(circle, black 40%, transparent 70%)",
        }}
      />
    </div>
  )
}

function Embers() {
  // 14 deterministic embers
  const embers = Array.from({ length: 14 }, (_, i) => {
    const left = (i * 37) % 100
    const drift = ((i % 5) - 2) * 30
    const delay = (i * 0.7) % 6
    const dur = 6 + (i % 4)
    const size = 2 + (i % 3)
    return { left, drift, delay, dur, size, key: i }
  })
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {embers.map((e) => (
        <span
          key={e.key}
          className="ember-rise absolute bottom-0 rounded-full bg-primary/60"
          style={{
            left: `${e.left}%`,
            width: `${e.size}px`,
            height: `${e.size}px`,
            animationDelay: `${e.delay}s`,
            animationDuration: `${e.dur}s`,
            ["--drift" as string]: `${e.drift}px`,
          }}
        />
      ))}
    </div>
  )
}
