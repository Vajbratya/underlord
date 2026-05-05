"use client"

import Image from "next/image"
import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SaveState, Unit } from "@/lib/underlord/types"
import { MINION_TEMPLATES } from "@/lib/underlord/units"
import { LOOT_POOL } from "@/lib/underlord/loot"
import { squadCap } from "@/lib/underlord/perks"
import { xpProgress } from "@/lib/underlord/meta"
import { haptic } from "@/lib/underlord/haptics"

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
  // Cap = 3 + (level-1)*2 + EXÉRCITO ranks. So roster size grows with the
  // Underlord's level — +2 slots every time he levels up.
  const cap = squadCap(save.perks, xpProgress(save.xp).level)

  function toggle(unit: Unit) {
    const has = save.squad.includes(unit.id)
    if (has) {
      haptic.tap()
      onSetSquad(save.squad.filter((id) => id !== unit.id))
    } else if (save.squad.length < cap) {
      haptic.select()
      onSetSquad([...save.squad, unit.id])
    } else {
      haptic.tap()
    }
  }

  const slotsLeft = cap - save.squad.length

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-background/85 backdrop-blur sm:items-center sm:px-4">
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
              {cap === 3 ? "ESCOLHA SEU TRIO" : `ESCOLHA SEUS ${cap}`}
            </p>
            <h3 className="font-display text-lg font-black uppercase leading-tight text-foreground sm:text-xl">
              Esquadrão{" "}
              <span className="text-accent">
                ({save.squad.length}/{cap})
              </span>
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded text-muted-foreground transition hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Slots progress bar — grows with EXÉRCITO perk */}
        <div className="flex shrink-0 gap-1.5 border-b border-border bg-card/60 px-4 py-2">
          {Array.from({ length: cap }).map((_, i) => {
            const filled = i < save.squad.length
            return (
              <span
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  filled ? "bg-accent" : "bg-border",
                )}
              />
            )
          })}
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
            const disabled = !selected && save.squad.length >= cap
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => toggle(u)}
                aria-pressed={selected}
                className={cn(
                  "flex min-h-[5rem] w-full items-center gap-3 border-b border-border/50 px-3 py-2.5 text-left transition active:bg-secondary/40 sm:px-4 sm:py-3",
                  selected && "bg-primary/12",
                  disabled && "opacity-50",
                )}
              >
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
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-black uppercase leading-tight text-foreground">
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
                    <p className="mt-0.5 truncate font-mono text-[9px] uppercase tracking-[0.2em] text-accent">
                      ◆ {equipped.name}
                    </p>
                  ) : null}
                </div>
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-full border-2 transition",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card",
                  )}
                >
                  {selected ? <Check className="size-5" strokeWidth={3} /> : null}
                </span>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-card/60 p-3 sm:p-4">
          <button
            type="button"
            onClick={() => {
              haptic.select()
              onClose()
            }}
            disabled={save.squad.length === 0}
            className={cn(
              "flex h-14 w-full items-center justify-center gap-2 rounded-md border-2 px-4 font-display text-sm font-black uppercase tracking-[0.22em] transition active:scale-[0.97] sm:h-16 sm:tracking-[0.25em]",
              save.squad.length === 0
                ? "cursor-not-allowed border-border bg-secondary/60 text-muted-foreground"
                : "border-primary bg-primary text-primary-foreground",
            )}
          >
            {save.squad.length === 0
              ? "ESCOLHA AO MENOS UM"
              : slotsLeft === 0
                ? cap === 3
                  ? "TRIO COMPLETO · FECHAR"
                  : "ESQUADRÃO COMPLETO · FECHAR"
                : `CONFIRMAR (${save.squad.length}/${cap})`}
          </button>
        </div>
      </div>
    </div>
  )
}
