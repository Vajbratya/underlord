"use client"

import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SaveState, Unit } from "@/lib/underlord/types"
import { MINION_TEMPLATES } from "@/lib/underlord/units"
import { LOOT_POOL } from "@/lib/underlord/loot"

const TONE_TO_VAR = {
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
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-background/70 backdrop-blur sm:items-center">
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0"
      />
      <div className="vellum drop-in relative w-full max-w-md overflow-hidden rounded-t-lg border-2 border-border sm:rounded-lg">
        <div className="flex items-center justify-between gap-2 border-b border-border bg-card/80 px-4 py-3">
          <div>
            <p className="font-mono text-[9px] tracking-[0.3em] text-accent">
              ESCOLHA SEU TRIO
            </p>
            <h3 className="font-display text-lg font-black uppercase leading-tight text-foreground sm:text-xl">
              Esquadrão ({save.squad.length}/3)
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

        <div className="max-h-[60vh] overflow-y-auto">
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
                  "flex w-full items-center gap-3 border-b border-border/50 px-4 py-3 text-left transition active:bg-secondary/40",
                  selected && "bg-primary/10",
                )}
              >
                <span
                  className="hex-tile grid size-12 shrink-0 place-items-center text-2xl font-black"
                  style={{ background: tone, color: "var(--background)" }}
                >
                  {tpl.glyph}
                </span>
                <div className="flex-1">
                  <p className="font-display text-sm font-black uppercase leading-tight text-foreground">
                    {u.name}{" "}
                    <span className="ml-1 font-mono text-[10px] tracking-wider text-muted-foreground">
                      {tpl.name}
                    </span>
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {tpl.role}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[10px] tabular-nums text-foreground/80">
                    <span>HP {u.hpMax}</span>
                    <span>ATK {u.atk}</span>
                    <span>MOV {u.move}</span>
                    <span>ALC {u.range}</span>
                    <span>SPD {u.spd}</span>
                  </div>
                  {equipped ? (
                    <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-accent">
                      ◆ {equipped.name}
                    </p>
                  ) : null}
                </div>
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

        <div className="border-t border-border bg-card/60 p-4">
          <button
            type="button"
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-primary bg-primary px-4 py-3 font-display text-sm font-black uppercase tracking-[0.25em] text-primary-foreground transition active:scale-[0.98]"
          >
            CONFIRMAR
          </button>
        </div>
      </div>
    </div>
  )
}
