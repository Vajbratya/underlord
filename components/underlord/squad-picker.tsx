"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { Check, X, Sparkles, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AttackKind, SaveState, Unit, UnitTemplate } from "@/lib/underlord/types"
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

/* ------------------------------------------------------------------ */
/* Attack-kind metadata — the RPS triangle the picker teaches.         */
/* Each kind maps to a compact PT-BR tag, what it COUNTERS, and a tone */
/* used in the legend. Pulled from the docblock in types.ts.           */
/* ------------------------------------------------------------------ */

type KindMeta = {
  tag: string
  /** One-liner explaining what the kind is good against. */
  counter: string
}

const ATTACK_KIND_META: Record<AttackKind, KindMeta> = {
  basic: { tag: "BÁSICO", counter: "Golpe simples, sem truque — corpo de enchimento." },
  cleave: { tag: "CLIVA", counter: "Atinge o alvo + adjacente. Pune heróis colados." },
  splash: { tag: "AOE", counter: "Explode em área. Castiga aglomerados de inimigos." },
  execute: { tag: "EXECUTA", counter: "+50% em alvos abaixo de 40% HP. Finaliza feridos." },
  heal: { tag: "CURA", counter: "Restaura 30% do HP de um aliado. Sustenta a horda." },
  pierce: { tag: "PERFURA", counter: "Atravessa a linha. Pega quem se esconde atrás." },
  curse: { tag: "MALDIÇÃO", counter: "Marca o alvo: +50% dano recebido. Prepara o abate." },
  siphon: { tag: "SIFÃO", counter: "Cura no próprio dano. Tanque que não morre." },
  volley: { tag: "TEMPESTADE", counter: "AOE de longuíssimo alcance. Castiga grupos longe." },
  rend: { tag: "SANGRA", counter: "Sangramento por 3 turnos. Dano que ignora armadura." },
  chain: { tag: "RAIO", counter: "Salta pro inimigo mais próximo. Pula em multidão." },
}

/* Roles the composition read-out cares about — derived from template,
 * NOT a stored field, so it stays correct for every archetype. */
type Lane = "frente" | "fundo" | "voador"

function laneOf(tpl: UnitTemplate): Lane {
  if (tpl.flying) return "voador"
  return tpl.range >= 2 ? "fundo" : "frente"
}

/** HP threshold above which a unit is treated as a TANK for composition. */
const TANK_HP = 200

/* ------------------------------------------------------------------ */
/* Composition analysis — the live read-out + warnings.                */
/* ------------------------------------------------------------------ */

type Analysis = {
  total: number
  melee: number
  ranged: number
  flyer: number
  healers: number
  tanks: number
  /** Average raw HP across the squad — drives "Frágil demais". */
  avgHp: number
  warnings: string[]
  balanced: boolean
}

function analyzeSquad(units: Unit[]): Analysis {
  let melee = 0
  let ranged = 0
  let flyer = 0
  let healers = 0
  let tanks = 0
  let hpSum = 0

  for (const u of units) {
    const tpl = MINION_TEMPLATES[u.templateId]
    if (!tpl) continue
    const lane = laneOf(tpl)
    if (lane === "voador") flyer += 1
    else if (lane === "fundo") ranged += 1
    else melee += 1
    if (tpl.attackKind === "heal") healers += 1
    if (u.hpMax >= TANK_HP) tanks += 1
    hpSum += u.hpMax
  }

  const total = units.length
  const avgHp = total > 0 ? Math.round(hpSum / total) : 0
  const warnings: string[] = []

  if (total >= 2) {
    if (healers === 0) warnings.push("Sem curandeiro — sem sustento na linha")
    if (tanks === 0 && melee === 0) warnings.push("Sem linha de frente — núcleo exposto")
    if (ranged === 0 && flyer === 0) warnings.push("Só corpo-a-corpo — sem dano à distância")
    if (melee === 0 && tanks === 0 && total >= 3)
      warnings.push("Tudo no fundo — alvos fáceis ao avançar")
    if (avgHp < 90 && tanks === 0) warnings.push("Frágil demais — HP médio baixo")
  }

  // "Equilibrado": tem cura, tem frente (tank ou melee) E tem alcance.
  const hasFront = tanks > 0 || melee > 0
  const hasReach = ranged > 0 || flyer > 0
  const balanced =
    total >= 3 && healers >= 1 && hasFront && hasReach && warnings.length === 0

  return { total, melee, ranged, flyer, healers, tanks, avgHp, warnings, balanced }
}

/* ------------------------------------------------------------------ */
/* RECOMENDAR — auto-fill a balanced squad up to the cap.              */
/* Strategy:                                                            */
/*   1. guarantee ≥1 healer (best HP healer available),                */
/*   2. guarantee ≥1 tank (highest HP),                                */
/*   3. guarantee a melee bruiser + a ranged DPS,                      */
/*   4. fill the rest by a "power" score (atk weighted by reach).      */
/* All picks come from the player's OWN roster — never invents units.  */
/* ------------------------------------------------------------------ */

function powerScore(u: Unit, tpl: UnitTemplate): number {
  // Reward raw output and durability; ranged/flyers get a small reach bonus
  // because positioning value isn't captured by atk alone.
  const reach = tpl.range >= 2 ? 1.1 : 1
  return (u.atk * 2 + u.hpMax * 0.35) * reach
}

function recommendSquad(roster: Unit[], cap: number): string[] {
  if (roster.length === 0 || cap <= 0) return []
  const withTpl = roster
    .map((u) => ({ u, tpl: MINION_TEMPLATES[u.templateId] }))
    .filter((x): x is { u: Unit; tpl: UnitTemplate } => !!x.tpl)

  const chosen: string[] = []
  const take = (id: string | undefined) => {
    if (id && !chosen.includes(id) && chosen.length < cap) chosen.push(id)
  }
  const best = (
    pool: { u: Unit; tpl: UnitTemplate }[],
    by: (x: { u: Unit; tpl: UnitTemplate }) => number,
  ) =>
    pool
      .filter((x) => !chosen.includes(x.u.id))
      .sort((a, b) => by(b) - by(a))[0]?.u.id

  // 1. Healer (best raw HP among healers so it survives to keep healing).
  take(best(withTpl.filter((x) => x.tpl.attackKind === "heal"), (x) => x.u.hpMax))
  // 2. Tank (highest HP overall).
  take(best(withTpl, (x) => x.u.hpMax))
  // 3. Melee bruiser (front-line, range 1, by power).
  take(
    best(
      withTpl.filter((x) => laneOf(x.tpl) === "frente"),
      (x) => powerScore(x.u, x.tpl),
    ),
  )
  // 4. Ranged / flyer DPS (back-line reach, by power).
  take(
    best(
      withTpl.filter((x) => laneOf(x.tpl) !== "frente"),
      (x) => powerScore(x.u, x.tpl),
    ),
  )
  // 5. Fill remaining slots by overall power.
  for (const x of withTpl
    .filter((y) => !chosen.includes(y.u.id))
    .sort((a, b) => powerScore(b.u, b.tpl) - powerScore(a.u, a.tpl))) {
    if (chosen.length >= cap) break
    take(x.u.id)
  }
  return chosen
}

/* Distinct attack kinds present in the current roster — keeps the legend
 * focused on what the player can actually field. */
function rosterKinds(roster: Unit[]): AttackKind[] {
  const seen = new Set<AttackKind>()
  for (const u of roster) {
    const tpl = MINION_TEMPLATES[u.templateId]
    if (tpl) seen.add(tpl.attackKind)
  }
  // Stable, didactic order.
  const order: AttackKind[] = [
    "cleave",
    "splash",
    "execute",
    "pierce",
    "curse",
    "siphon",
    "volley",
    "rend",
    "chain",
    "heal",
    "basic",
  ]
  return order.filter((k) => seen.has(k))
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

  const [showLegend, setShowLegend] = useState(false)

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

  // Live composition of the CURRENTLY selected units.
  const selectedUnits = useMemo(
    () => save.roster.filter((u) => save.squad.includes(u.id)),
    [save.roster, save.squad],
  )
  const analysis = useMemo(() => analyzeSquad(selectedUnits), [selectedUnits])
  const kinds = useMemo(() => rosterKinds(save.roster), [save.roster])

  function handleRecommend() {
    haptic.select()
    onSetSquad(recommendSquad(save.roster, cap))
  }

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
        <div className="flex shrink-0 items-center gap-1.5 border-b border-border bg-card/60 px-4 py-2">
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
          <span className="ml-1 shrink-0 font-mono text-[9px] tabular-nums text-muted-foreground">
            {slotsLeft > 0 ? `${slotsLeft} livre${slotsLeft > 1 ? "s" : ""}` : "cheio"}
          </span>
        </div>

        {/* Composition read-out + RECOMENDAR */}
        <div className="shrink-0 border-b border-border bg-card/40 px-4 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground">
              Composição
            </p>
            <button
              type="button"
              onClick={handleRecommend}
              disabled={save.roster.length === 0}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1 font-display text-[10px] font-black uppercase tracking-[0.18em] transition active:scale-95",
                save.roster.length === 0
                  ? "cursor-not-allowed border-border text-muted-foreground"
                  : "border-accent/60 bg-accent/15 text-accent hover:bg-accent/25",
              )}
            >
              <Sparkles className="size-3" />
              Recomendar
            </button>
          </div>

          {analysis.total === 0 ? (
            <p className="mt-1.5 font-mono text-[10px] text-muted-foreground">
              Nenhum minion escolhido — toque para montar seu esquadrão.
            </p>
          ) : (
            <>
              {/* Lane / role counts */}
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <CompChip label="FRENTE" value={analysis.melee} ok={analysis.melee > 0} />
                <CompChip label="FUNDO" value={analysis.ranged} ok={analysis.ranged > 0} />
                <CompChip label="VOADOR" value={analysis.flyer} />
                <CompChip
                  label="CURA"
                  value={analysis.healers}
                  ok={analysis.healers > 0}
                  warn={analysis.healers === 0}
                />
                <CompChip
                  label="TANQUE"
                  value={analysis.tanks}
                  ok={analysis.tanks > 0}
                />
              </div>

              {/* Verdict */}
              {analysis.balanced ? (
                <p className="mt-2 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--primary)]">
                  <span className="inline-block size-1.5 rounded-full bg-[var(--primary)]" />
                  Equilibrado — frente, fundo e cura cobertos
                </p>
              ) : analysis.warnings.length > 0 ? (
                <ul className="mt-2 space-y-0.5">
                  {analysis.warnings.map((w) => (
                    <li
                      key={w}
                      className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--destructive)]"
                    >
                      <span className="inline-block size-1.5 rounded-full bg-[var(--destructive)]" />
                      {w}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  Esquadrão funcional — adicione mais para equilibrar.
                </p>
              )}
            </>
          )}
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
            const kind = ATTACK_KIND_META[tpl.attackKind]
            const lane = laneOf(tpl)
            const isTank = u.hpMax >= TANK_HP
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
                  <div className="flex items-center gap-1.5">
                    <p className="truncate font-display text-sm font-black uppercase leading-tight text-foreground">
                      {u.name}
                    </p>
                    {/* Attack-kind tag — colored by tone */}
                    <span
                      className="shrink-0 rounded-sm border px-1 py-px font-mono text-[8px] font-black uppercase leading-none tracking-[0.12em]"
                      style={{ color: tone, borderColor: tone }}
                    >
                      {kind.tag}
                    </span>
                  </div>
                  <p className="truncate font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    {tpl.role}
                    {" · "}
                    <span className="text-foreground/60">
                      {lane === "frente"
                        ? "frente"
                        : lane === "fundo"
                          ? "fundo"
                          : "voa"}
                    </span>
                    {isTank ? <span className="text-[var(--gold)]"> · tanque</span> : null}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0 font-mono text-[10px] tabular-nums text-foreground/80">
                    <span>HP {u.hpMax}</span>
                    <span>ATK {u.atk}</span>
                    <span>ALC {u.range}</span>
                    <span>MOV {u.move}</span>
                    <span className="text-foreground/50">SPD {u.spd}</span>
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

          {/* LEGEND — collapsible RPS triangle primer */}
          <div className="border-b border-border/50 bg-card/30">
            <button
              type="button"
              onClick={() => setShowLegend((v) => !v)}
              aria-expanded={showLegend}
              className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left transition active:bg-secondary/40"
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Legenda — o que trazer
              </span>
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-muted-foreground transition-transform",
                  showLegend && "rotate-180",
                )}
              />
            </button>
            {showLegend ? (
              <div className="space-y-1.5 px-4 pb-3 pt-1">
                <p className="font-mono text-[9px] leading-relaxed text-muted-foreground">
                  Cada tipo de ataque resolve um problema. Misture-os: maldição
                  amplifica, executa finaliza, AOE pune ajuntamento, cura
                  segura a linha.
                </p>
                {kinds.map((k) => {
                  const meta = ATTACK_KIND_META[k]
                  return (
                    <div key={k} className="flex items-start gap-2">
                      <span className="mt-px w-[68px] shrink-0 font-mono text-[9px] font-black uppercase tracking-[0.1em] text-foreground">
                        {meta.tag}
                      </span>
                      <span className="font-mono text-[9px] leading-snug text-muted-foreground">
                        {meta.counter}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : null}
          </div>
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

/* ------------------------------------------------------------------ */
/* Small composition chip — count + role label, tinted by state.       */
/* ------------------------------------------------------------------ */

function CompChip({
  label,
  value,
  ok,
  warn,
}: {
  label: string
  value: number
  ok?: boolean
  warn?: boolean
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.1em]",
        warn
          ? "border-[var(--destructive)]/50 text-[var(--destructive)]"
          : ok
            ? "border-[var(--primary)]/50 text-[var(--primary)]"
            : value > 0
              ? "border-border text-foreground/80"
              : "border-border/50 text-muted-foreground",
      )}
    >
      <span className="tabular-nums">{value}</span>
      {label}
    </span>
  )
}
