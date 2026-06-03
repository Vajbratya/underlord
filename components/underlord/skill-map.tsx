"use client"

/**
 * SKILL MAP — Underlord active-skill loadout configurator.
 *
 * Bottom-sheet style drawer launched from the war room. Top half: the 3
 * battle slots (the active loadout). Bottom half: the scrollable pool of
 * every skill, grouped by ROLE (dano / cura / suporte / controle /
 * utilidade) so the player can tell at a glance what each ability does.
 *
 * Interaction model — TAP TO TOGGLE (no more silent slot-1 stomp):
 *   • Tap an UNLOCKED pool skill that's not equipped → equips it into the
 *     next free slot.
 *   • Tap an EQUIPPED pool skill (or its slot) → unequips it.
 *   • When all {@link SKILL_SLOTS} slots are full, un-equipped pool items
 *     render disabled ("loadout cheio") with a hint to free a slot — they
 *     no longer overwrite slot 1 behind the player's back.
 *   • LOCKED skills render greyed with their unlock level ("Nv X").
 *
 * The component is a controlled view: it dispatches the FULL equipped-id
 * list up the tree via `onSetLoadout` on every change. It never mutates
 * state directly, so the save (localStorage) stays the single source of
 * truth.
 */

import {
  HeartPulse,
  Lock,
  Move,
  ShieldPlus,
  Skull,
  Sparkles,
  Sword,
  Wand2,
  X,
  Zap,
} from "lucide-react"
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

/* ------------------------------------------------------------------ */
/* Role taxonomy — what a skill DOES, derived from its `kind`.          */
/* ------------------------------------------------------------------ */

type Role = "dano" | "cura" | "suporte" | "controle" | "utilidade"

const KIND_ROLE: Record<SkillDef["kind"], Role> = {
  "smite-enemy": "dano",
  "aoe-damage": "dano",
  "hex-bleed": "dano",
  "heal-ally": "cura",
  "revive-ally": "cura",
  "rally-allies": "suporte",
  "shield-self": "suporte",
  "ward-ally": "suporte",
  "doom-enemy": "controle",
  "teleport-self": "utilidade",
}

/** Per-role presentation. Order here = display order of the groups. */
const ROLE_META: Record<
  Role,
  {
    label: string
    blurb: string
    /** Tailwind classes for the role's accent text/border/bg. */
    accent: string
    /** Solid dot/chip background for the role tag. */
    chip: string
  }
> = {
  dano: {
    label: "Dano",
    blurb: "Tira HP do inimigo",
    accent: "text-destructive border-destructive/45 bg-destructive/10",
    chip: "border-destructive/50 bg-destructive/15 text-destructive",
  },
  controle: {
    label: "Controle",
    blurb: "Amplia o dano recebido",
    accent: "text-gold border-gold/45 bg-gold/10",
    chip: "border-gold/50 bg-gold/15 text-gold",
  },
  cura: {
    label: "Cura",
    blurb: "Restaura ou ressuscita",
    accent: "text-accent border-accent/45 bg-accent/10",
    chip: "border-accent/50 bg-accent/15 text-accent",
  },
  suporte: {
    label: "Suporte",
    blurb: "Escuda e fortalece",
    accent: "text-primary border-primary/45 bg-primary/10",
    chip: "border-primary/50 bg-primary/15 text-primary",
  },
  utilidade: {
    label: "Utilidade",
    blurb: "Reposiciona o Underlord",
    accent: "text-muted-foreground border-border bg-secondary/40",
    chip: "border-border bg-secondary/60 text-muted-foreground",
  },
}

const ROLE_ORDER: Role[] = ["dano", "controle", "cura", "suporte", "utilidade"]

const KIND_ICON: Record<SkillDef["kind"], typeof Sparkles> = {
  "smite-enemy": Sword,
  "aoe-damage": Zap,
  "hex-bleed": Skull,
  "rally-allies": Sparkles,
  "shield-self": ShieldPlus,
  "ward-ally": ShieldPlus,
  "doom-enemy": Wand2,
  "heal-ally": HeartPulse,
  "revive-ally": HeartPulse,
  "teleport-self": Move,
}

/** Role accent for any skill (the single source the rest of the UI reads). */
function toneFor(skill: SkillDef): string {
  return ROLE_META[KIND_ROLE[skill.kind]].accent
}

/** Compact stat chips shared by slots, pool rows, and group headers. */
function StatLine({ skill }: { skill: SkillDef }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground/80">
      <span>ALC {skill.range || "0"}</span>
      <span>CD {skill.cooldown}r</span>
      {skill.aoeRadius > 0 ? <span>AOE {skill.aoeRadius}</span> : null}
      {skill.atkMult > 0 ? <span>×{skill.atkMult.toFixed(1)} ATK</span> : null}
      {skill.uses === 1 ? (
        <span className="text-gold">1× / batalha</span>
      ) : skill.cooldown === 0 ? (
        <span className="text-accent">sem CD</span>
      ) : null}
    </p>
  )
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
  const isFull = equipped.length >= SKILL_SLOTS

  /** Toggle a pool skill on/off. Equip into the next free slot, or — if
   * already equipped — remove it. NEVER silently stomps an existing slot. */
  function toggle(id: string) {
    if (equipped.includes(id)) {
      haptic.cancel()
      onSetLoadout(equipped.filter((sid) => sid !== id))
      return
    }
    if (!unlocked.has(id)) {
      haptic.invalid()
      return
    }
    if (isFull) {
      // Loadout is full — reject loudly instead of dropping slot 1.
      haptic.invalid()
      return
    }
    haptic.select()
    onSetLoadout([...equipped, id])
  }

  /** Tap a filled slot to free it. */
  function clearSlot(slotIndex: number) {
    const sid = equipped[slotIndex]
    if (!sid) return
    haptic.cancel()
    onSetLoadout(equipped.filter((_, i) => i !== slotIndex))
  }

  /** Pool grouped by role, preserving the unlock-level sort within groups
   * and hiding empty groups. */
  const groups = ROLE_ORDER.map((role) => ({
    role,
    skills: SKILL_LIST.filter((s) => KIND_ROLE[s.kind] === role),
  })).filter((g) => g.skills.length > 0)

  const unlockedCount = SKILL_LIST.filter((s) => unlocked.has(s.id)).length

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
                Monta tuas {SKILL_SLOTS} habilidades · Nv {level}
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

        {/* Slots — the active loadout */}
        <section className="border-b border-border/60 bg-secondary/30 px-3 py-3 sm:px-6 sm:py-4">
          <div className="mb-2 flex items-center justify-between gap-2 px-1">
            <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-muted-foreground">
              Loadout de batalha
            </p>
            <span
              className={cn(
                "rounded-sm border px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-[0.2em] tabular-nums",
                isFull
                  ? "border-gold/50 bg-gold/15 text-gold"
                  : "border-border bg-background/50 text-muted-foreground",
              )}
            >
              {equipped.length}/{SKILL_SLOTS}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: SKILL_SLOTS }).map((_, i) => {
              const sid = equipped[i]
              const skill = sid ? OVERLORD_SKILLS[sid] : null
              if (!skill) {
                return (
                  <div
                    key={`empty-${i}`}
                    className="flex h-24 flex-col items-center justify-center gap-1.5 rounded-md border-2 border-dashed border-border/60 bg-background/40 px-2 text-center"
                  >
                    <span className="grid size-6 place-items-center rounded-full border border-border/60 font-mono text-[10px] font-black text-muted-foreground/70">
                      {i + 1}
                    </span>
                    <span className="font-mono text-[8px] uppercase tracking-[0.28em] text-muted-foreground/70">
                      Vazio
                    </span>
                  </div>
                )
              }
              const Icon = KIND_ICON[skill.kind]
              const tone = toneFor(skill)
              return (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => clearSlot(i)}
                  aria-label={`Slot ${i + 1}: ${skill.name}. Toque para remover.`}
                  className={cn(
                    "group relative flex h-24 flex-col items-center justify-center gap-1 rounded-md border-2 px-2 transition active:scale-95",
                    tone,
                  )}
                >
                  <span className="absolute left-1 top-1 grid size-4 place-items-center rounded-full bg-background/70 font-mono text-[8px] font-black tabular-nums">
                    {i + 1}
                  </span>
                  <span className="absolute right-1 top-1 opacity-0 transition group-hover:opacity-80 group-active:opacity-100">
                    <X className="size-3" />
                  </span>
                  <Icon className="size-4" />
                  <span className="font-display text-[10px] font-black uppercase tracking-[0.16em] leading-tight">
                    {skill.short}
                  </span>
                  <span className="font-mono text-[8px] uppercase tracking-[0.2em] opacity-70">
                    {skill.uses === 1 ? "1× batalha" : `CD ${skill.cooldown}r`}
                  </span>
                </button>
              )
            })}
          </div>
          <p className="mt-2 px-1 font-mono text-[8px] uppercase tracking-[0.26em] text-muted-foreground/70">
            {isFull
              ? "Loadout cheio · toque um slot para abrir espaço"
              : "Toque uma habilidade abaixo para equipar"}
          </p>
        </section>

        {/* Pool — grouped by role */}
        <section className="flex-1 overflow-y-auto px-3 py-3 sm:px-6 sm:py-4">
          <div className="mb-3 flex items-center gap-2 px-1">
            <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-muted-foreground">
              Repertório · {unlockedCount}/{SKILL_LIST.length} desbloqueados
            </p>
            <span className="h-px flex-1 bg-border/60" />
          </div>

          <div className="flex flex-col gap-5">
            {groups.map(({ role, skills }) => {
              const meta = ROLE_META[role]
              return (
                <div key={role}>
                  {/* Group header */}
                  <div className="mb-2 flex items-baseline gap-2 px-1">
                    <span
                      className={cn(
                        "rounded-sm border px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-[0.22em]",
                        meta.chip,
                      )}
                    >
                      {meta.label}
                    </span>
                    <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-muted-foreground/70">
                      {meta.blurb}
                    </span>
                  </div>

                  <ul className="flex flex-col gap-2">
                    {skills.map((skill) => {
                      const isUnlocked = unlocked.has(skill.id)
                      const isEquipped = equipped.includes(skill.id)
                      const Icon = KIND_ICON[skill.kind]
                      const tone = toneFor(skill)
                      // Locked OR (full loadout AND not already equipped) →
                      // not actionable. Locked is hard-disabled; "full" stays
                      // tappable only to keep equipped-removal working.
                      const blockedByFull = isUnlocked && !isEquipped && isFull
                      const interactive = isUnlocked && (!isFull || isEquipped)

                      return (
                        <li key={skill.id}>
                          <button
                            type="button"
                            disabled={!isUnlocked}
                            aria-pressed={isEquipped}
                            onClick={() => toggle(skill.id)}
                            className={cn(
                              "flex w-full items-start gap-3 rounded-md border-2 px-3 py-2.5 text-left transition active:scale-[0.99]",
                              !isUnlocked &&
                                "cursor-not-allowed border-border/60 bg-background/40 opacity-55",
                              isEquipped &&
                                "border-gold bg-gold/10 ring-1 ring-gold/40",
                              interactive &&
                                !isEquipped &&
                                "border-border bg-background/70 hover:border-accent/60",
                              blockedByFull &&
                                "cursor-not-allowed border-border/60 bg-background/40 opacity-55",
                            )}
                          >
                            <span
                              className={cn(
                                "grid size-9 shrink-0 place-items-center rounded-sm border-2",
                                isUnlocked
                                  ? tone
                                  : "border-border/50 text-muted-foreground",
                              )}
                            >
                              {isUnlocked ? (
                                <Icon className="size-4" />
                              ) : (
                                <Lock className="size-3.5" />
                              )}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span
                                  className={cn(
                                    "font-display text-[12px] font-black uppercase tracking-[0.16em]",
                                    isUnlocked
                                      ? "text-foreground"
                                      : "text-muted-foreground",
                                  )}
                                >
                                  {skill.name}
                                </span>
                                {isEquipped ? (
                                  <span className="rounded-sm border border-gold/60 bg-gold/20 px-1.5 py-0.5 font-mono text-[8px] font-black uppercase tracking-[0.22em] text-gold">
                                    ✓ Equipado · slot{" "}
                                    {equipped.indexOf(skill.id) + 1}
                                  </span>
                                ) : null}
                                {!isUnlocked ? (
                                  <span className="rounded-sm border border-border bg-background/50 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.22em] text-muted-foreground">
                                    Nv {skill.unlockLevel}
                                  </span>
                                ) : null}
                                {blockedByFull ? (
                                  <span className="rounded-sm border border-border bg-background/50 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.22em] text-muted-foreground">
                                    Loadout cheio
                                  </span>
                                ) : null}
                              </div>
                              <p
                                className={cn(
                                  "mt-1 font-mono text-[10px] leading-relaxed",
                                  isUnlocked
                                    ? "text-muted-foreground"
                                    : "text-muted-foreground/70",
                                )}
                              >
                                {skill.text}
                              </p>
                              <div className="mt-1">
                                <StatLine skill={skill} />
                              </div>
                              {blockedByFull ? (
                                <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.24em] text-gold/80">
                                  Remova um slot acima para equipar
                                </p>
                              ) : null}
                            </div>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          </div>
        </section>

        {/* Footer hint */}
        <footer className="border-t border-border/60 bg-secondary/40 px-4 py-2 text-center sm:px-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-muted-foreground">
            Toque para equipar · toque de novo (ou no slot) para remover
          </p>
        </footer>
      </div>
    </div>
  )
}
