"use client"

/**
 * CONTRATOS — daily + weekly bounty board. Progress bars, claimable
 * rewards. The daily-return hook.
 */

import { Check, Coins, Gem, ScrollText, Sparkles, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { haptic } from "@/lib/underlord/haptics"
import { BOUNTIES } from "@/lib/underlord/bounties"
import type { SaveState } from "@/lib/underlord/types"

export function BountiesPanel({
  save,
  onClaim,
  onClose,
}: {
  save: SaveState
  onClaim: (bountyId: string) => void
  onClose: () => void
}) {
  const b = save.bounties
  const daily = b?.daily ?? []
  const weekly = b?.weekly ?? []
  const progress = b?.progress ?? {}
  const claimed = new Set(b?.claimed ?? [])

  function row(id: string) {
    const def = BOUNTIES[id]
    if (!def) return null
    const prog = Math.min(def.target, progress[id] ?? 0)
    const done = prog >= def.target
    const isClaimed = claimed.has(id)
    const pct = Math.round((prog / def.target) * 100)
    return (
      <div
        key={id}
        className={cn(
          "rounded-xl border bg-card/50 p-3",
          isClaimed ? "border-border/40 opacity-50" : done ? "border-gold/60" : "border-border/60",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-bold uppercase tracking-wide text-foreground">
              {def.name}
            </p>
            <p className="font-mono text-[10px] leading-snug text-muted-foreground">
              {def.desc}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-0.5 font-mono text-[10px] font-black">
            {def.reward.gold ? (
              <span className="flex items-center gap-0.5 text-gold">
                <Coins className="size-3" />{def.reward.gold}
              </span>
            ) : null}
            {def.reward.shards ? (
              <span className="flex items-center gap-0.5 text-accent">
                <Gem className="size-3" />{def.reward.shards}
              </span>
            ) : null}
            {def.reward.xp ? (
              <span className="flex items-center gap-0.5 text-primary">
                <Sparkles className="size-3" />{def.reward.xp}
              </span>
            ) : null}
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="relative h-2 flex-1 overflow-hidden rounded-full border border-border/60 bg-secondary/50">
            <div
              className={cn("absolute inset-y-0 left-0", done ? "bg-gold" : "bg-primary")}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="shrink-0 font-mono text-[9px] tabular-nums text-muted-foreground">
            {prog}/{def.target}
          </span>
          <button
            type="button"
            disabled={!done || isClaimed}
            onClick={() => {
              haptic.tap()
              onClaim(id)
            }}
            className={cn(
              "shrink-0 rounded-md border px-2 py-1 font-mono text-[9px] font-black uppercase tracking-wider transition active:scale-95",
              isClaimed
                ? "border-border bg-secondary/40 text-muted-foreground"
                : done
                  ? "border-gold bg-gold/20 text-gold ready-pulse"
                  : "border-border/50 bg-secondary/20 text-muted-foreground",
            )}
          >
            {isClaimed ? <Check className="size-3" /> : "RECLAMAR"}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
      <div className="flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border-2 border-accent/40 bg-background shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border/60 bg-accent/10 px-5 py-4">
          <div className="flex items-center gap-2">
            <ScrollText className="size-5 text-accent" />
            <div>
              <h2 className="font-display text-2xl font-black uppercase tracking-[0.2em] text-accent">
                Contratos
              </h2>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                Missões que pagam. Renovam sozinhas.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full border border-border/60 text-muted-foreground hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Diários
          </p>
          <div className="grid gap-2">{daily.map(row)}</div>
          <p className="mb-2 mt-5 font-mono text-[10px] uppercase tracking-[0.3em] text-gold">
            Semanais
          </p>
          <div className="grid gap-2">{weekly.map(row)}</div>
        </div>
      </div>
    </div>
  )
}
