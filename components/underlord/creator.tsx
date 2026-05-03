"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Check } from "lucide-react"
import { BANNERS, DREAD_SCHOOLS } from "@/lib/underlord/data"
import { newSave } from "@/lib/underlord/state"
import type { Banner, DreadSchool, SaveState } from "@/lib/underlord/types"
import { cn } from "@/lib/utils"

interface Props {
  onBack: () => void
  onConfirm: (save: SaveState) => void
}

export function Creator({ onBack, onConfirm }: Props) {
  const [name, setName] = useState("")
  const [school, setSchool] = useState<DreadSchool | null>(null)
  const [banner, setBanner] = useState<Banner>("ember")

  const trimmed = name.trim()
  const ready = trimmed.length >= 2 && trimmed.length <= 24 && school

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-3xl flex-col px-5 pb-safe pt-safe">
      <header className="flex items-center justify-between pt-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 font-mono text-[10px] tracking-[0.3em] text-muted-foreground transition hover:text-foreground"
        >
          <ChevronLeft className="size-3.5" />
          TITLE
        </button>
        <p className="font-mono text-[10px] tracking-[0.4em] text-muted-foreground">
          CORONATION
        </p>
        <span className="w-12" />
      </header>

      <section className="mt-8 sm:mt-12">
        <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">
          STEP I — NAME THE SOVEREIGN
        </p>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name…"
          maxLength={24}
          className={cn(
            "font-display mt-2 w-full border-b-2 bg-transparent pb-2 text-2xl font-black tracking-[0.1em] text-foreground placeholder:text-muted-foreground/40 focus:outline-none sm:text-4xl",
            trimmed.length >= 2
              ? "border-primary"
              : "border-border focus:border-foreground/40",
          )}
          aria-label="Underlord name"
        />
        <p className="mt-1.5 font-mono text-[10px] tracking-wider text-muted-foreground">
          The name worn into nursery rhymes. {trimmed.length}/24
        </p>
      </section>

      <section className="mt-8 sm:mt-10">
        <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">
          STEP II — DREAD SCHOOL
        </p>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
          {(["dominion", "famine", "sundering"] as DreadSchool[]).map((id) => {
            const s = DREAD_SCHOOLS[id]
            const active = school === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSchool(id)}
                className={cn(
                  "group flex flex-col gap-2 rounded-md border-2 p-3 text-left transition active:scale-[0.98]",
                  active
                    ? "border-primary bg-primary/10 shadow-[0_0_24px_oklch(0.68_0.18_45/0.25)]"
                    : "border-border bg-card hover:border-foreground/40",
                )}
                aria-pressed={active}
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-sm font-black tracking-[0.2em] text-foreground sm:text-base">
                    {s.name}
                  </span>
                  {active ? <Check className="size-4 text-primary" /> : null}
                </div>
                <span className="font-mono text-[10px] tracking-wider text-primary">
                  {s.epithet.toUpperCase()}
                </span>
                <p className="text-[12px] leading-relaxed text-muted-foreground">{s.blurb}</p>
                <p className="mt-1 rounded border border-border bg-background/60 px-2 py-1.5 font-mono text-[10px] leading-relaxed text-foreground/80">
                  {s.passive}
                </p>
              </button>
            )
          })}
        </div>
      </section>

      <section className="mt-8 sm:mt-10">
        <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">
          STEP III — BANNER
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(Object.keys(BANNERS) as Banner[]).map((b) => {
            const meta = BANNERS[b]
            const active = banner === b
            return (
              <button
                key={b}
                type="button"
                onClick={() => setBanner(b)}
                className={cn(
                  "flex items-center gap-2 rounded-md border-2 px-3 py-2 transition active:scale-[0.98]",
                  active
                    ? "border-foreground bg-card"
                    : "border-border bg-card/60 hover:border-foreground/40",
                )}
                aria-pressed={active}
              >
                <span
                  className="size-4 rounded-sm border border-border"
                  style={{ background: meta.swatch }}
                  aria-hidden="true"
                />
                <span className="font-mono text-[11px] tracking-[0.2em] text-foreground">
                  {meta.name}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <div className="flex-1" />

      <footer className="sticky bottom-3 mt-10 sm:mt-12">
        <button
          type="button"
          disabled={!ready}
          onClick={() => {
            if (!ready || !school) return
            onConfirm(newSave({ name: trimmed, school, banner }))
          }}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-md py-3.5 font-display text-sm font-black tracking-[0.3em] transition active:scale-[0.98] sm:text-base",
            ready
              ? "bg-primary text-primary-foreground shadow-[0_0_24px_oklch(0.68_0.18_45/0.4)] pulse-glow"
              : "cursor-not-allowed bg-secondary text-muted-foreground",
          )}
        >
          {ready ? "TAKE THE CROWN" : "FILL THE NAME AND PICK A SCHOOL"}
          {ready ? <ChevronRight className="size-5" /> : null}
        </button>
      </footer>
    </main>
  )
}
