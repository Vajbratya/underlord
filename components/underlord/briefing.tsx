"use client"

import { ArrowLeft, Swords } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Region, SaveState } from "@/lib/underlord/types"
import { MINION_TEMPLATES } from "@/lib/underlord/units"
import { getHeroById } from "@/lib/elementum-flavor"

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
    <div className="flex min-h-dvh w-full flex-col bg-background pb-safe pt-safe">
      <header className="flex items-center justify-between gap-3 border-b border-border bg-card/40 px-4 py-3 backdrop-blur">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          MAPA
        </button>
        <p className="font-mono text-[10px] tracking-[0.3em] text-accent">
          BRIEFING · ESTÁGIO {String(region.stage).padStart(2, "0")}
        </p>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 py-5 sm:px-6">
        <div>
          <h1 className="font-display text-3xl font-black uppercase leading-none tracking-tight text-foreground sm:text-4xl">
            {region.name}
          </h1>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {region.subtitle}
          </p>
          <p className="mt-3 max-w-prose text-pretty text-sm leading-relaxed text-foreground/85">
            {region.lore}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Defenders */}
          <section>
            <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.3em] text-destructive">
              Defensores ({heroes.length})
            </p>
            <ul className="space-y-2">
              {heroes.map((h) => (
                <li
                  key={h.id}
                  className="rounded border border-destructive/40 bg-destructive/5 p-3"
                >
                  <p className="font-display text-sm font-black uppercase leading-tight text-destructive">
                    {h.name}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {h.title}
                  </p>
                  <p className="mt-1 font-mono text-[11px] tracking-wider text-foreground/80">
                    &ldquo;{h.entry}&rdquo;
                  </p>
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
                  Nenhum minion selecionado. Volte e monte o esquadrão.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {squad.map((u) => {
                  const tpl = MINION_TEMPLATES[u.templateId]
                  return (
                    <li
                      key={u.id}
                      className="flex items-center gap-3 rounded border border-border bg-card/60 p-3"
                    >
                      <span
                        className="hex-tile grid size-10 shrink-0 place-items-center text-lg font-black"
                        style={{
                          background: TONE_TO_VAR[tpl.tone],
                          color: "var(--background)",
                        }}
                      >
                        {tpl.glyph}
                      </span>
                      <div className="flex-1">
                        <p className="font-display text-sm font-black uppercase leading-tight text-foreground">
                          {u.name}
                        </p>
                        <div className="flex flex-wrap gap-x-2 font-mono text-[10px] tabular-nums text-muted-foreground">
                          <span className="text-foreground">{u.hpMax} HP</span>
                          <span>{u.atk} ATK</span>
                          <span>{u.move} MOV</span>
                          <span>{u.range} ALC</span>
                          <span>{u.spd} SPD</span>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>
      </main>

      <div className="border-t border-border bg-card/60 p-4 backdrop-blur">
        <button
          type="button"
          onClick={onCommit}
          disabled={squad.length === 0}
          className={cn(
            "mx-auto flex w-full max-w-md items-center justify-center gap-2 rounded-md border-2 px-6 py-4 font-display text-base font-black uppercase tracking-[0.25em] transition active:scale-[0.98]",
            squad.length === 0
              ? "cursor-not-allowed border-border bg-secondary/60 text-muted-foreground"
              : "border-primary bg-primary text-primary-foreground",
          )}
        >
          <Swords className="size-5" />
          {squad.length === 0 ? "MONTE O ESQUADRÃO" : "DESCER NA TORRE"}
        </button>
      </div>
    </div>
  )
}
