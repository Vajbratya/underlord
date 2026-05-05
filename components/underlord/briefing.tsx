"use client"

import Image from "next/image"
import { ArrowLeft, Map as MapIcon, Swords } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Region, SaveState } from "@/lib/underlord/types"
import { MINION_TEMPLATES } from "@/lib/underlord/units"
import { getHeroById } from "@/lib/elementum-flavor"
import { haptic } from "@/lib/underlord/haptics"
import { TERRAIN_GLYPH, pickMapLayout } from "@/lib/underlord/maps"
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

  const layout = pickMapLayout(region)
  const obstacleCounts = layout.obstacles.reduce<Record<string, number>>(
    (acc, o) => {
      acc[o.kind] = (acc[o.kind] ?? 0) + 1
      return acc
    },
    {},
  )

  return (
    <div className="relative flex min-h-dvh w-full flex-col bg-background pb-safe pt-safe">
      <Atmosphere src="/images/bg/briefing.jpg" intensity="heavy" embers={12} />
      <header className="relative z-10 border-b border-border/60 bg-background/85 backdrop-blur"><div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-2 py-2 sm:px-4 sm:py-3">
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
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 overflow-y-auto px-3 py-3 sm:px-6 sm:py-6">
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

        {/* Map / battlefield card */}
        <section className="rounded border border-accent/40 bg-accent/5 px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded border border-accent/60 bg-accent/10 text-accent">
              <MapIcon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent">
                  Campo de Batalha
                </p>
                <p className="font-mono text-[9px] tabular-nums text-muted-foreground">
                  {layout.cols}×{layout.rows}
                </p>
              </div>
              <p className="font-display text-sm font-black uppercase leading-tight text-foreground sm:text-base">
                {layout.label}
              </p>
              <p className="mt-0.5 font-mono text-[10px] leading-snug tracking-wide text-foreground/80 sm:text-[11px]">
                {layout.hint}
              </p>
              {Object.keys(obstacleCounts).length > 0 ||
              layout.prelitFires.length > 0 ? (
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {Object.entries(obstacleCounts).map(([kind, n]) => (
                    <span
                      key={kind}
                      className="inline-flex items-center gap-1 rounded-sm border border-border bg-card/70 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground"
                      title={kind}
                    >
                      <span
                        aria-hidden
                        className="text-foreground/85"
                        style={{ fontSize: "11px", lineHeight: 1 }}
                      >
                        {TERRAIN_GLYPH[kind as keyof typeof TERRAIN_GLYPH]}
                      </span>
                      ×{n}
                    </span>
                  ))}
                  {layout.prelitFires.length > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-sm border border-destructive/60 bg-destructive/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-destructive">
                      <span aria-hidden style={{ fontSize: "11px" }}>
                        ✸
                      </span>
                      ×{layout.prelitFires.length} fogo
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </section>

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
                  {/* Entourage: tiny portraits of the minions this hero brings. */}
                  {h.entourage.length > 0 ? (
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-destructive/80">
                        +
                      </span>
                      <div className="flex -space-x-1.5">
                        {h.entourage.map((arch, idx) => (
                          <span
                            key={`${h.id}-ent-${idx}`}
                            className="relative size-5 overflow-hidden rounded-full border border-destructive/70 ring-1 ring-background sm:size-6"
                            style={{ borderColor: TONE_TO_VAR[MINION_TEMPLATES[arch].tone] }}
                            title={`${MINION_TEMPLATES[arch].name} (escolta)`}
                          >
                            <Image
                              src={`/images/minions/${arch}.jpg`}
                              alt={MINION_TEMPLATES[arch].name}
                              fill
                              sizes="24px"
                              className="object-cover opacity-90"
                            />
                          </span>
                        ))}
                      </div>
                      <span className="line-clamp-1 font-mono text-[9px] tracking-wide text-muted-foreground/90">
                        {h.entourageLabel}
                      </span>
                    </div>
                  ) : null}
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

      <div className="relative z-10 shrink-0 border-t border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto w-full max-w-3xl px-3 py-3 sm:px-4 sm:py-4">
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
    </div>
  )
}
