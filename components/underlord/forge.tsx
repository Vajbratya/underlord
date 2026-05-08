"use client"

/**
 * Forja — Underlord perk tree.
 *
 * Drawer presented from the War Room. Lists every perk grouped by branch
 * (Minion / Underlord / Economia). Each perk row shows current rank,
 * max rank, the level required to spend, and a SPEND button consuming one
 * perk point.
 */

import { useMemo, useState } from "react"
import {
  ChevronRight,
  Coins,
  Crown,
  Flame,
  Hammer,
  Heart,
  Lock,
  RotateCcw,
  Shield,
  Skull,
  Sword,
  Target,
  Users,
  X,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { SaveState } from "@/lib/underlord/types"
import {
  PERK_LIST,
  PERKS,
  type PerkDef,
  type PerkId,
  perksSpent,
  rankOf,
} from "@/lib/underlord/perks"
import { levelFromXP } from "@/lib/underlord/meta"
import { haptic } from "@/lib/underlord/haptics"

const BRANCH_LABEL: Record<PerkDef["branch"], string> = {
  minion: "MINIONS",
  underlord: "UNDERLORD",
  economy: "ECONOMIA",
}

const BRANCH_ACCENT: Record<PerkDef["branch"], string> = {
  minion: "var(--primary)",
  underlord: "var(--accent)",
  economy: "var(--gold)",
}

const PERK_ICON: Record<PerkId, React.ReactNode> = {
  vigor_brown: <Shield className="size-4" />,
  furia_red: <Flame className="size-4" />,
  agilidade_green: <Zap className="size-4" />,
  milagre_blue: <Heart className="size-4" />,
  alcance_grey: <Target className="size-4" />,
  exercito: <Users className="size-4" />,
  sangue_frio: <Sword className="size-4" />,
  gancho: <Skull className="size-4" />,
  cartel: <Coins className="size-4" />,
  passe_livre: <Crown className="size-4" />,
}

export function Forge({
  save,
  onSpend,
  onRespec,
  onClose,
}: {
  save: SaveState
  onSpend: (perkId: PerkId) => void
  onRespec: () => void
  onClose: () => void
}) {
  const level = levelFromXP(save.xp)
  const [confirmRespec, setConfirmRespec] = useState(false)
  const totalSpent = perksSpent(save.perks)

  const grouped = useMemo(() => {
    return {
      minion: PERK_LIST.filter((p) => p.branch === "minion"),
      underlord: PERK_LIST.filter((p) => p.branch === "underlord"),
      economy: PERK_LIST.filter((p) => p.branch === "economy"),
    }
  }, [])

  function handleSpend(id: PerkId) {
    const def = PERKS[id]
    if (!def) return
    if (level < def.tierLevel) return
    if (rankOf(save.perks, id) >= def.maxRank) return
    if (save.perkPoints <= 0) return
    // Spending a perk point is a level-up event — fires the powerup
    // sample under the haptic thump.
    haptic.levelUp()
    onSpend(id)
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-background/80 backdrop-blur sm:items-center">
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <div className="relative flex h-[86dvh] w-full max-w-md flex-col overflow-hidden rounded-t-lg border-2 border-border bg-card/95 backdrop-blur sm:h-[80dvh] sm:rounded-lg">
        {/* Header */}
        <div className="border-b border-border bg-gradient-to-b from-accent/12 to-transparent px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-sm border border-accent/60 bg-accent/15 text-accent">
              <Hammer className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-accent">
                FORJA · NÍVEL {level}
              </p>
              <h2 className="truncate font-display text-lg font-black uppercase leading-tight tracking-tight text-foreground">
                Pacto Eterno
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="grid size-9 shrink-0 place-items-center rounded text-muted-foreground transition hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          </div>
          {/* Points strip */}
          <div className="mt-2.5 flex items-center gap-2">
            <span
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-sm border-2 px-2.5 font-mono text-[10px] font-black uppercase tracking-[0.18em]",
                save.perkPoints > 0
                  ? "border-gold bg-gold/15 text-gold ready-pulse"
                  : "border-border bg-secondary/40 text-muted-foreground",
              )}
            >
              <Hammer className="size-3.5" />
              <span className="font-display text-base leading-none tabular-nums">
                {save.perkPoints}
              </span>
              <span>{save.perkPoints === 1 ? "PONTO" : "PONTOS"}</span>
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
              · {totalSpent} gravado{totalSpent === 1 ? "" : "s"}
            </span>
            <button
              type="button"
              onClick={() => setConfirmRespec(true)}
              disabled={totalSpent === 0}
              className={cn(
                "ml-auto flex h-9 shrink-0 items-center gap-1 rounded-md border px-2 font-mono text-[9px] font-black uppercase tracking-[0.2em] transition active:scale-95",
                totalSpent === 0
                  ? "cursor-not-allowed border-border/40 bg-secondary/30 text-muted-foreground/50"
                  : "border-destructive/60 bg-destructive/10 text-destructive hover:bg-destructive/20",
              )}
            >
              <RotateCcw className="size-3" />
              Refundir
            </button>
          </div>
        </div>

        {/* Hint banner if no points */}
        {save.perkPoints === 0 && totalSpent === 0 ? (
          <div className="border-b border-border/60 bg-secondary/30 px-4 py-2.5">
            <p className="text-pretty font-mono text-[10px] leading-relaxed tracking-wider text-muted-foreground">
              Cada nível do Underlord acima do primeiro garante um ponto.
              Suba de nível matando heróis e armando combos.
            </p>
          </div>
        ) : null}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {(["minion", "underlord", "economy"] as const).map((branch) => (
            <section key={branch} className="mb-4 last:mb-2">
              <div className="mb-2 flex items-center gap-2 px-1">
                <span
                  className="h-2 w-2 rotate-45"
                  style={{ backgroundColor: BRANCH_ACCENT[branch] }}
                />
                <p
                  className="font-mono text-[9px] font-black uppercase tracking-[0.32em]"
                  style={{ color: BRANCH_ACCENT[branch] }}
                >
                  {BRANCH_LABEL[branch]}
                </p>
                <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
              </div>
              <div className="flex flex-col gap-1.5">
                {grouped[branch].map((def) => (
                  <PerkRow
                    key={def.id}
                    def={def}
                    rank={rankOf(save.perks, def.id)}
                    canAfford={save.perkPoints > 0}
                    level={level}
                    onSpend={() => handleSpend(def.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Respec confirm */}
        {confirmRespec ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/85 backdrop-blur-sm p-4">
            <div className="slam-in w-full max-w-sm rounded-lg border-2 border-destructive bg-card p-4">
              <p className="font-display text-sm font-black uppercase tracking-[0.18em] text-destructive">
                Refundir tudo?
              </p>
              <p className="mt-1.5 text-pretty font-mono text-[10px] leading-relaxed tracking-wider text-muted-foreground">
                Devolve {totalSpent} ponto{totalSpent === 1 ? "" : "s"} e zera
                os perks. Seus minions voltam ao stat base. Sem custo de ouro
                desta vez. O Underlord ainda está de bom humor.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmRespec(false)}
                  className="flex h-10 flex-1 items-center justify-center rounded-md border border-border bg-secondary/60 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-foreground active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    haptic.select()
                    onRespec()
                    setConfirmRespec(false)
                  }}
                  className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-md border-2 border-destructive bg-destructive font-mono text-[10px] font-black uppercase tracking-[0.2em] text-destructive-foreground active:scale-95"
                >
                  <RotateCcw className="size-3.5" />
                  Refundir
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function PerkRow({
  def,
  rank,
  level,
  canAfford,
  onSpend,
}: {
  def: PerkDef
  rank: number
  level: number
  canAfford: boolean
  onSpend: () => void
}) {
  const maxed = rank >= def.maxRank
  const tierLocked = level < def.tierLevel
  const buyable = !maxed && !tierLocked && canAfford

  return (
    <div
      className={cn(
        "relative flex items-stretch gap-0 overflow-hidden rounded-md border-2 transition",
        tierLocked
          ? "border-border/40 bg-card/40 opacity-70"
          : maxed
            ? "border-gold/60 bg-gold/8"
            : buyable
              ? "border-accent/60 bg-card/85 shadow-[0_2px_12px_oklch(0.72_0.17_60/0.18)]"
              : "border-border bg-card/70",
      )}
    >
      {/* Branch stripe */}
      <span
        className="w-1 shrink-0"
        style={{ backgroundColor: BRANCH_ACCENT[def.branch] }}
      />
      {/* Icon column */}
      <div className="flex w-12 shrink-0 flex-col items-center justify-center gap-1 border-r border-border/50 bg-background/40 px-1 py-2.5">
        <span
          className={cn(
            "grid size-7 place-items-center rounded-sm",
            tierLocked
              ? "text-muted-foreground/60"
              : maxed
                ? "text-gold"
                : "text-foreground",
          )}
          style={{
            backgroundColor: tierLocked
              ? "transparent"
              : `${BRANCH_ACCENT[def.branch]}1f`,
            border: `1px solid ${
              tierLocked ? "var(--border)" : BRANCH_ACCENT[def.branch]
            }80`,
          }}
        >
          {tierLocked ? <Lock className="size-3.5" /> : PERK_ICON[def.id]}
        </span>
        <span className="flex gap-0.5">
          {Array.from({ length: def.maxRank }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1 w-1.5 rounded-sm",
                i < rank
                  ? "bg-gold shadow-[0_0_4px_var(--gold)]"
                  : tierLocked
                    ? "bg-border/40"
                    : "bg-secondary",
              )}
            />
          ))}
        </span>
      </div>
      {/* Info column */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-2.5 py-2">
        <div className="flex items-center gap-1.5">
          <p className="truncate font-display text-[12px] font-black uppercase leading-tight tracking-wider text-foreground sm:text-[13px]">
            {def.name}
          </p>
          {maxed ? (
            <span className="shrink-0 rounded border border-gold/60 bg-gold/15 px-1 py-px font-mono text-[7px] font-black uppercase tracking-[0.18em] text-gold">
              MAX
            </span>
          ) : null}
        </div>
        <p className="truncate font-mono text-[9px] uppercase tracking-[0.18em] text-accent">
          {def.effect}
        </p>
        <p className="line-clamp-2 font-mono text-[9px] leading-snug tracking-wider text-muted-foreground/90">
          {def.text}
        </p>
      </div>
      {/* Action column */}
      <button
        type="button"
        onClick={onSpend}
        disabled={!buyable}
        className={cn(
          "flex w-14 shrink-0 flex-col items-center justify-center gap-0.5 border-l text-center transition active:scale-[0.95]",
          buyable
            ? "border-accent/60 bg-accent/15 text-accent hover:bg-accent/25"
            : maxed
              ? "border-gold/40 bg-gold/8 text-gold"
              : tierLocked
                ? "border-border/40 bg-secondary/30 text-muted-foreground"
                : "cursor-not-allowed border-border/40 bg-secondary/30 text-muted-foreground/60",
        )}
      >
        {tierLocked ? (
          <>
            <Lock className="size-3.5" />
            <p className="font-mono text-[7.5px] font-black uppercase tracking-wider">
              LV {def.tierLevel}
            </p>
          </>
        ) : maxed ? (
          <>
            <Crown className="size-3.5" />
            <p className="font-mono text-[7.5px] font-black uppercase tracking-wider">
              MAX
            </p>
          </>
        ) : (
          <>
            <ChevronRight className={cn("size-4", buyable && "ready-pulse")} />
            <p className="font-mono text-[7.5px] font-black uppercase tracking-wider">
              R{rank + 1}/{def.maxRank}
            </p>
          </>
        )}
      </button>
    </div>
  )
}
