"use client"

import Image from "next/image"
import { ArrowLeft, Swords } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Region, SaveState } from "@/lib/underlord/types"
import { MINION_TEMPLATES } from "@/lib/underlord/units"
import { getHeroById } from "@/lib/elementum-flavor"
import { haptic } from "@/lib/underlord/haptics"
import { Atmosphere } from "./atmosphere"

const TONE_TO_VAR: Record<string, string> = {
  primary: "var(--primary)",
  destructive: "var(--destructive)",
  accent: "var(--accent)",
  gold: "var(--gold)",
  foreground: "var(--foreground)",
}

export function Briefing({
  region,
  save,
  onBack,
  onCommit,
}: {
  region: Region
  save: SaveState
  onBack: () => void
  onCommit: () => void
}) {
  const squad = save.squad
    .map((id) => save.roster.find((u) => u.id === id))
    .filter((u): u is NonNullable<typeof u> => Boolean(u))

  const heroes = region.heroIds
    .map((id) => getHeroById(id))
    .filter((h): h is NonNullable<typeof h> => h !== null)

  return (
    <div className="relative flex min-h-dvh w-full flex-col bg-background pb-safe pt-safe">
      <Atmosphere src="/images/bg/briefing.jpg" intensity="heavy" embers={12} />
      <header className="relative z-10 flex items-center justify-between gap-3 border-b border-border/60 bg-background/85 px-2 py-2 backdrop-blur sm:px-4 sm:py-3">
        <button
          type="button"
          onClick={() => {
            haptic.tap()
            onBack()
          }}
          className="flex h-10 items-center gap-1.5 rounded px-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground transition active:bg-secondary/40 hover:text-foreground sm:tracking-[0.25em]"
        >
          <ArrowLeft className="size-4" />
          MAPA
        </button>
        <p className="font-mono text-[9px] tracking-[0.25em] text-accent sm:text-[10px] sm:tracking-[0.3em]">
          BRIEFING · {String(region.stage).padStart(2, "0")}
        </p>
      </header>

      <main className="relative z-10 flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-3 sm:px-6 sm:py-6">
        {/* Region heading — compact on mobile */}
        <div>
          <h1 className="font-display text-2xl font-black uppercase leading-none tracking-tight text-foreground sm:text-4xl">
            {region.name}
          </h1>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {region.subtitle}
          </p>
          <p className="mt-2 line-clamp-3 max-w-prose text-pretty text-xs leading-relaxed text-foreground/85 sm:line-clamp-none sm:mt-3 sm:text-sm">
            {region.lore}
          </p>
        </div>

        {/* Defenders */}
        <section>
          <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.3em] text-destructive">
            Defensores ({heroes.length})
          </p>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {heroes.map((h) => (
              <li
                key={h.id}
                className="flex gap-3 rounded border border-destructive/40 bg-destructive/5 p-2.5"
              >
                <span className="relative size-14 shrink-0 overflow-hidden rounded border-2 border-destructive/60 sm:size-20">
                  <Image
                    src={`/images/heroes/${h.id}.jpg`}
                    alt={h.name}
                    fill
                    sizes="(max-width: 640px) 56px, 80px"
                    className="object-cover"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-xs font-black uppercase leading-tight text-destructive sm:text-sm">
                    {h.name}
                  </p>
                  <p className="truncate font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground sm:text-[10px]">
                    {h.title}
                  </p>
                  <p className="mt-1 line-clamp-2 font-mono text-[10px] leading-snug tracking-wide text-foreground/80 sm:line-clamp-3 sm:text-[11px]">
                    &ldquo;{h.entry}&rdquo;
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Your squad */}
        <section>
          <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.3em] text-accent">
            Sua Brood ({squad.length}/3)
          </p>
          {squad.length === 0 ? (
            <div className="rounded border border-border bg-secondary/40 p-3">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Nenhum minion. Volte e monte o esquadrão.
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {squad.map((u) => {
                const tpl = MINION_TEMPLATES[u.templateId]
                const tone = TONE_TO_VAR[tpl.tone]
                return (
                  <li
                    key={u.id}
                    className="flex items-center gap-3 rounded border border-border bg-card/60 p-2.5"
                  >
                    <span
                      className="relative size-12 shrink-0 overflow-hidden rounded border-2 sm:size-14"
                      style={{ borderColor: tone }}
                    >
                      <Image
                        src={`/images/minions/${u.templateId}.jpg`}
                        alt={tpl.name}
                        fill
                        sizes="(max-width: 640px) 48px, 56px"
                        className="object-cover"
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-xs font-black uppercase leading-tight text-foreground sm:text-sm">
                        {u.name}{" "}
                        <span
                          className="ml-0.5 font-mono text-[9px] tracking-wider"
                          style={{ color: tone }}
                        >
                          {tpl.name}
                        </span>
                      </p>
                      <div className="flex flex-wrap gap-x-2 gap-y-0 font-mono text-[10px] tabular-nums text-muted-foreground">
                        <span className="text-foreground">{u.hpMax} HP</span>
                        <span>{u.atk} ATK</span>
                        <span>{u.move} MOV</span>
                        <span>{u.range} ALC</span>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </main>

      <div className="relative z-10 shrink-0 border-t border-border/60 bg-background/90 px-3 py-3 backdrop-blur sm:px-4 sm:py-4">
        <button
          type="button"
          onClick={() => {
            if (squad.length === 0) return
            haptic.select()
            onCommit()
          }}
          disabled={squad.length === 0}
          className={cn(
            "mx-auto flex h-16 w-full max-w-md items-center justify-center gap-2 rounded-md border-2 px-5 font-display text-base font-black uppercase tracking-[0.22em] transition active:scale-[0.97] sm:h-[4.5rem] sm:px-6 sm:text-lg sm:tracking-[0.25em]",
            squad.length === 0
              ? "cursor-not-allowed border-border bg-secondary/60 text-muted-foreground"
              : "border-primary bg-primary text-primary-foreground pulse-glow",
          )}
        >
          <Swords className="size-5 sm:size-6" />
          {squad.length === 0 ? "MONTE O ESQUADRÃO" : "DESCER NA TORRE"}
        </button>
      </div>
    </div>
  )
}
