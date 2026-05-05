"use client"

/**
 * BoonsPanel — read-only modal listing every boon the Underlord has
 * picked over the course of the run. The point isn't to manage them
 * (boons are permanent and can't be unequipped); it's to give the
 * player a clear "this is the build I'm playing" summary.
 *
 * Layout: rarity-grouped sections, each showing card chips with name,
 * summary, and (for pactos) a destructive ring so the trade-off is
 * obvious at a glance.
 */

import { Sparkles, X as XIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  BOONS,
  RARITY_LABEL,
  RARITY_TONE,
  type BoonRarity,
  aggregateBoons,
} from "@/lib/underlord/boons"

const RARITY_ORDER: BoonRarity[] = ["mythic", "epic", "rare", "common"]

export function BoonsPanel({
  ownedBoons,
  onClose,
}: {
  ownedBoons: string[]
  onClose: () => void
}) {
  // Resolve ids → boon objects, dropping unknowns gracefully.
  const owned = ownedBoons
    .map((id) => BOONS[id])
    .filter((b): b is NonNullable<typeof b> => !!b)

  const grouped: Record<BoonRarity, typeof owned> = {
    mythic: [],
    epic: [],
    rare: [],
    common: [],
  }
  for (const b of owned) grouped[b.rarity].push(b)

  // Aggregate stats — power-fantasy summary at the top.
  const bag = aggregateBoons(ownedBoons)
  const summaryRows: Array<[string, string]> = []
  if (bag.minionHpMult !== 1)
    summaryRows.push(["HP Minions", `${formatMult(bag.minionHpMult)}`])
  if (bag.minionAtkMult !== 1)
    summaryRows.push(["ATK Minions", `${formatMult(bag.minionAtkMult)}`])
  if (bag.minionDmgTakenMult !== 1)
    summaryRows.push([
      "Dano Recebido",
      `${formatMult(bag.minionDmgTakenMult)}`,
    ])
  if (bag.overlordHpMult !== 1)
    summaryRows.push(["HP Underlord", `${formatMult(bag.overlordHpMult)}`])
  if (bag.overlordAtkMult !== 1)
    summaryRows.push(["ATK Underlord", `${formatMult(bag.overlordAtkMult)}`])
  if (bag.critChanceBonus > 0)
    summaryRows.push([
      "Crit",
      `+${Math.round(bag.critChanceBonus * 100)}%`,
    ])
  if (bag.lifestealPct > 0)
    summaryRows.push([
      "Roubo de Vida",
      `${Math.round(bag.lifestealPct * 100)}%`,
    ])
  if (bag.hpRegenStartOfRound > 0)
    summaryRows.push([
      "Regen / Round",
      `${Math.round(bag.hpRegenStartOfRound * 100)}%`,
    ])
  if (bag.goldMult !== 1)
    summaryRows.push(["Ouro", `${formatMult(bag.goldMult)}`])
  if (bag.xpMult !== 1) summaryRows.push(["XP", `${formatMult(bag.xpMult)}`])
  if (bag.specialCdReduce > 0)
    summaryRows.push(["CD Inicial", `-${bag.specialCdReduce}r`])
  if (bag.startingAttackBonus > 0)
    summaryRows.push([
      "1º Ataque",
      `+${Math.round(bag.startingAttackBonus * 100)}%`,
    ])
  if (bag.rangedAtkBonus > 0)
    summaryRows.push([
      "ATK Distância",
      `+${Math.round(bag.rangedAtkBonus * 100)}%`,
    ])
  if (bag.flyingAtkBonus > 0)
    summaryRows.push([
      "ATK Voadores",
      `+${Math.round(bag.flyingAtkBonus * 100)}%`,
    ])

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-background/80 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Bençãos do Underlord"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-lg border-2 border-gold/60 bg-card text-left shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 border-b border-border/60 bg-background/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-gold" />
            <h2 className="font-display text-base font-black uppercase tracking-[0.18em] text-foreground sm:text-lg">
              Bençãos
            </h2>
            <span className="rounded border border-gold/60 bg-gold/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-gold">
              {owned.length} acumulada{owned.length === 1 ? "" : "s"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex size-8 items-center justify-center rounded border border-border/80 bg-secondary/60 text-foreground transition active:scale-95"
          >
            <XIcon className="size-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {owned.length === 0 ? (
            <p className="py-6 text-center font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-muted-foreground">
              Nenhuma bênção ainda.
              <br />
              Vença batalhas pra escolher uma.
            </p>
          ) : (
            <>
              {summaryRows.length > 0 ? (
                <section className="mb-3 rounded-md border border-gold/40 bg-gold/5 p-3">
                  <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.28em] text-gold">
                    Acumulado
                  </p>
                  <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 sm:grid-cols-3">
                    {summaryRows.map(([k, v]) => (
                      <li
                        key={k}
                        className="flex items-baseline justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.12em]"
                      >
                        <span className="truncate text-muted-foreground">
                          {k}
                        </span>
                        <span className="font-display text-[12px] font-black tracking-tight text-foreground">
                          {v}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {RARITY_ORDER.map((r) => {
                const rows = grouped[r]
                if (rows.length === 0) return null
                return (
                  <section key={r} className="mb-3 last:mb-0">
                    <p
                      className={cn(
                        "mb-1.5 font-mono text-[9px] uppercase tracking-[0.28em]",
                        r === "mythic"
                          ? "text-gold"
                          : r === "epic"
                            ? "text-accent"
                            : r === "rare"
                              ? "text-info"
                              : "text-muted-foreground",
                      )}
                    >
                      {RARITY_LABEL[r]} · {rows.length}
                    </p>
                    <ul className="space-y-1.5">
                      {rows.map((b) => {
                        const isPacto = b.category === "pacto"
                        return (
                          <li
                            key={b.id}
                            className={cn(
                              "flex items-start gap-2.5 rounded border-2 px-2.5 py-2",
                              isPacto
                                ? "border-destructive/55 bg-destructive/10"
                                : "border-border bg-card/70",
                            )}
                          >
                            <span
                              className={cn(
                                "grid size-10 shrink-0 place-items-center rounded border font-display text-[11px] font-black uppercase tracking-tight",
                                RARITY_TONE[b.rarity],
                              )}
                            >
                              {b.short}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="font-display text-[13px] font-black uppercase leading-tight tracking-tight text-foreground">
                                {b.name}
                              </p>
                              <p
                                className={cn(
                                  "font-mono text-[10px] uppercase leading-snug tracking-[0.06em]",
                                  isPacto
                                    ? "text-destructive"
                                    : "text-foreground/85",
                                )}
                              >
                                {b.summary}
                              </p>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </section>
                )
              })}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/** Format a multiplier like 1.30 → "+30%", 0.85 → "-15%". */
function formatMult(m: number): string {
  const pct = Math.round((m - 1) * 100)
  if (pct === 0) return "0%"
  return pct > 0 ? `+${pct}%` : `${pct}%`
}
