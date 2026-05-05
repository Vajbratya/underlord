"use client"

/**
 * SKILL MAP — Underlord active-skill loadout configurator.
 *
 * Bottom-sheet style drawer launched from the war room. Top half: 3 slots
 * (the active loadout). Bottom half: scrollable pool of every unlocked
 * skill. Tapping a slot un-equips. Tapping a pool skill equips it into
 * the next free slot (or replaces slot 1 if all full). Locked skills
 * render greyed out with the level-gate.
 *
 * The component is a controlled view: it dispatches `set-skill-loadout`
 * up the tree on every change. It does NOT mutate state directly, so the
 * server stays the single source of truth (localStorage in this app).
 */

import { Lock, Sparkles, Sword, Wand2, X, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  OVERLORD_SKILLS,
  SKILL_LIST,
  SKILL_SLOTS,
  type SkillDef,
} from "@/lib/underlord/overlord-skills"
import { haptic } from "@/lib/underlord/haptics"
import type { SaveState } from "@/lib/underlord/types"
import { xpProgress } from "@/lib/underlord/meta"

const KIND_ICON: Record<SkillDef["kind"], typeof Sparkles> = {
  "smite-enemy": Sword,
  "aoe-damage": Zap,
  "rally-allies": Sparkles,
  "shield-self": Sparkles,
  "doom-enemy": Wand2,
  "heal-ally": Sparkles,
  "teleport-self": Wand2,
  "revive-ally": Sparkles,
}

const KIND_TONE: Record<SkillDef["kind"], string> = {
  "smite-enemy": "text-destructive border-destructive/40 bg-destructive/10",
  "aoe-damage": "text-destructive border-destructive/40 bg-destructive/10",
  "rally-allies": "text-gold border-gold/40 bg-gold/10",
  "shield-self": "text-primary border-primary/40 bg-primary/10",
  "doom-enemy": "text-destructive border-destructive/40 bg-destructive/10",
  "heal-ally": "text-accent border-accent/40 bg-accent/10",
  "teleport-self": "text-accent border-accent/40 bg-accent/10",
  "revive-ally": "text-gold border-gold/40 bg-gold/10",
}

export function SkillMap({
  save,
  onSetLoadout,
  onClose,
}: {
  save: SaveState
  onSetLoadout: (skillIds: string[]) => void
  onClose: () => void
}) {
  const level = xpProgress(save.xp).level
  const equipped = save.equippedSkills ?? []
  const unlocked = new Set(save.unlockedSkills ?? [])

  function equip(id: string) {
    if (equipped.includes(id)) return
    haptic.tap()
    // Push into next free slot; if full, drop the first slot to make room.
    const next =
      equipped.length < SKILL_SLOTS
        ? [...equipped, id]
        : [...equipped.slice(1), id]
    onSetLoadout(next)
  }

  function unequip(slotIndex: number) {
    haptic.tap()
    const next = equipped.filter((_, i) => i !== slotIndex)
    onSetLoadout(next)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/85 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Skill Map do Underlord"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="slam-in relative flex max-h-[92vh] w-full max-w-3xl flex-col rounded-t-xl border-2 border-border/80 bg-card shadow-2xl"
      >
        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border/60 bg-card/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2.5">
            <Wand2 className="size-4 text-gold" />
            <div>
              <h2 className="font-display text-sm font-black uppercase tracking-[0.24em] text-foreground">
                Skill Map
              </h2>
              <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-muted-foreground">
                Equipa {SKILL_SLOTS} habilidades · Nv {level}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="grid size-9 place-items-center rounded-md border border-border bg-secondary/60 text-muted-foreground transition active:scale-95 hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </header>

        {/* Slots */}
        <section className="border-b border-border/60 bg-secondary/30 px-3 py-3 sm:px-6 sm:py-4">
          <p className="mb-2 px-1 font-mono text-[9px] uppercase tracking-[0.32em] text-muted-foreground">
            Loadout — {equipped.length}/{SKILL_SLOTS}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: SKILL_SLOTS }).map((_, i) => {
              const sid = equipped[i]
              const skill = sid ? OVERLORD_SKILLS[sid] : null
              if (!skill) {
                return (
                  <div
                    key={`empty-${i}`}
                    className="grid h-24 place-items-center rounded-md border-2 border-dashed border-border/60 bg-background/50 px-2 text-center"
                  >
                    <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground">
                      Vazio
                    </span>
                  </div>
                )
              }
              const Icon = KIND_ICON[skill.kind]
              const tone = KIND_TONE[skill.kind]
              return (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => unequip(i)}
                  aria-label={`Desequipar ${skill.name}`}
                  className={cn(
                    "group flex h-24 flex-col items-center justify-center gap-1 rounded-md border-2 px-2 transition active:scale-95",
                    tone,
                  )}
                >
                  <Icon className="size-4" />
                  <span className="font-display text-[10px] font-black uppercase tracking-[0.18em] leading-tight">
                    {skill.short}
                  </span>
                  <span className="font-mono text-[8px] uppercase tracking-[0.24em] opacity-70">
                    CD {skill.cooldown}r
                    {skill.uses === 1 ? " · 1×" : ""}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {/* Pool */}
        <section className="flex-1 overflow-y-auto px-3 py-3 sm:px-6 sm:py-4">
          <div className="mb-2 flex items-center gap-2 px-1">
            <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-muted-foreground">
              Repertório · {SKILL_LIST.filter((s) => unlocked.has(s.id)).length}/{SKILL_LIST.length} desbloqueados
            </p>
            <span className="h-px flex-1 bg-border/60" />
          </div>

          <ul className="flex flex-col gap-2">
            {SKILL_LIST.map((skill) => {
              const isUnlocked = unlocked.has(skill.id)
              const isEquipped = equipped.includes(skill.id)
              const Icon = KIND_ICON[skill.kind]
              const tone = KIND_TONE[skill.kind]
              return (
                <li key={skill.id}>
                  <button
                    type="button"
                    disabled={!isUnlocked}
                    onClick={() => isUnlocked && equip(skill.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-md border-2 px-3 py-2.5 text-left transition active:scale-[0.99]",
                      !isUnlocked &&
                        "cursor-not-allowed border-border/60 bg-background/40 opacity-60",
                      isUnlocked &&
                        !isEquipped &&
                        "border-border bg-background/70 hover:border-accent/60",
                      isEquipped && "border-gold bg-gold/10",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-sm border-2",
                        isUnlocked ? tone : "border-border/50 text-muted-foreground",
                      )}
                    >
                      {isUnlocked ? <Icon className="size-4" /> : <Lock className="size-3.5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "font-display text-[12px] font-black uppercase tracking-[0.18em]",
                            isUnlocked ? "text-foreground" : "text-muted-foreground",
                          )}
                        >
                          {skill.name}
                        </span>
                        {isEquipped ? (
                          <span className="rounded-sm border border-gold/60 bg-gold/15 px-1.5 py-0.5 font-mono text-[8px] font-black uppercase tracking-[0.24em] text-gold">
                            Equipado
                          </span>
                        ) : null}
                        {!isUnlocked ? (
                          <span className="rounded-sm border border-border bg-background/50 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.24em] text-muted-foreground">
                            Nv {skill.unlockLevel}
                          </span>
                        ) : null}
                      </div>
                      <p
                        className={cn(
                          "mt-1 font-mono text-[10px] leading-relaxed",
                          isUnlocked ? "text-muted-foreground" : "text-muted-foreground/70",
                        )}
                      >
                        {skill.text}
                      </p>
                      <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[9px] uppercase tracking-[0.24em] text-muted-foreground/80">
                        <span>ALC {skill.range || "—"}</span>
                        <span>CD {skill.cooldown}r</span>
                        {skill.aoeRadius > 0 ? <span>AOE {skill.aoeRadius}</span> : null}
                        {skill.atkMult > 0 ? <span>×{skill.atkMult.toFixed(1)} ATK</span> : null}
                        {skill.uses === 1 ? <span className="text-gold">1× por batalha</span> : null}
                      </p>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        {/* Footer hint */}
        <footer className="border-t border-border/60 bg-secondary/40 px-4 py-2 text-center sm:px-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground">
            Toque um slot para desequipar · Toque uma habilidade para equipar
          </p>
        </footer>
      </div>
    </div>
  )
}
