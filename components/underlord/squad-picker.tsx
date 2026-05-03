"use client"

import Image from "next/image"
import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SaveState, Unit } from "@/lib/underlord/types"
import { MINION_TEMPLATES } from "@/lib/underlord/units"
import { LOOT_POOL } from "@/lib/underlord/loot"

const TONE_TO_VAR: Record<string, string> = {
  primary: "var(--primary)",
  destructive: "var(--destructive)",
  accent: "var(--accent)",
  gold: "var(--gold)",
  foreground: "var(--foreground)",
}

export function SquadPicker({
  save,
  onSetSquad,
  onClose,
}: {
  save: SaveState
  onSetSquad: (ids: string[]) => void
  onClose: () => void
}) {
  function toggle(unit: Unit) {
    const has = save.squad.includes(unit.id)
    if (has) {
      onSetSquad(save.squad.filter((id) => id !== unit.id))
    } else if (save.squad.length < 3) {
      onSetSquad([...save.squad, unit.id])
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-background/80 backdrop-blur sm:items-center sm:px-4">
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0"
      />
      <div className="vellum drop-in relative flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-lg border-2 border-border sm:rounded-lg">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-border bg-card/80 px-4 py-3">
          <div className="min-w-0">
            <p className="font-mono text-[9px] tracking-[0.3em] text-accent">
              ESCOLHA SEU TRIO
            </p>
            <h3 className="font-display text-lg font-black uppercase leading-tight text-foreground sm:text-xl">
              Esquadrão{" "}
              <span className="text-accent">({save.squad.length}/3)</span>
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-muted-foreground transition hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Scroll area */}
        <div className="flex-1 overflow-y-auto">
          {save.roster.map((u) => {
            const tpl = MINION_TEMPLATES[u.templateId]
            const equipped = u.equipped
              ? LOOT_POOL.find((x) => x.id === u.equipped)
              : null
            const selected = save.squad.includes(u.id)
            const tone = TONE_TO_VAR[tpl.tone]
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => toggle(u)}
                className={cn(
                  "flex w-full items-center gap-3 border-b border-border/50 px-3 py-2.5 text-left transition active:bg-secondary/40 sm:px-4 sm:py-3",
                  selected && "bg-primary/10",
                )}
              >
                {/* Portrait */}
                <span
                  className="relative size-14 shrink-0 overflow-hidden rounded-md border-2"
                  style={{ borderColor: tone }}
                >
                  <Image
                    src={`/images/minions/${u.templateId}.jpg`}
                    alt={tpl.name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                  <span
                    className="absolute bottom-0 left-0 right-0 bg-background/80 px-1 py-0.5 text-center font-mono text-[8px] font-black uppercase tracking-wider"
                    style={{ color: tone }}
                  >
                    {tpl.name}
                  </span>
                </span>
                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-black uppercase leading-tight text-foreground">
                    {u.name}
                  </p>
                  <p className="truncate font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {tpl.role}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0 font-mono text-[10px] tabular-nums text-foreground/80">
                    <span>HP {u.hpMax}</span>
                    <span>ATK {u.atk}</span>
                    <span>MOV {u.move}</span>
                    <span>ALC {u.range}</span>
                    <span>SPD {u.spd}</span>
                  </div>
                  {equipped ? (
                    <p className="mt-1 truncate font-mono text-[9px] uppercase tracking-[0.2em] text-accent">
                      ◆ {equipped.name}
                    </p>
                  ) : null}
                </div>
                {/* Toggle */}
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full border-2 transition",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card",
                  )}
                >
                  {selected ? <Check className="size-4" /> : null}
                </span>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-card/60 p-3 sm:p-4">
          <button
            type="button"
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-primary bg-primary px-4 py-3 font-display text-sm font-black uppercase tracking-[0.22em] text-primary-foreground transition active:scale-[0.98] sm:tracking-[0.25em]"
          >
            CONFIRMAR
          </button>
        </div>
      </div>
    </div>
  )
}
