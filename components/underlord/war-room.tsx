"use client"

import Image from "next/image"
import { useMemo, useState } from "react"
import { Coins, Crown, Lock, Skull, Swords, Users, X, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Region, SaveState } from "@/lib/underlord/types"
import { REGIONS } from "@/lib/underlord/regions"
import { MINION_TEMPLATES } from "@/lib/underlord/units"
import { getHero } from "@/lib/elementum-flavor"

const TONE_TO_VAR: Record<string, string> = {
  primary: "var(--primary)",
  destructive: "var(--destructive)",
  accent: "var(--accent)",
  gold: "var(--gold)",
  foreground: "var(--foreground)",
}

const BIOME_COLOR: Record<Region["biome"], string> = {
  ash: "oklch(0.55 0.21 22)",
  moor: "oklch(0.45 0.04 220)",
  iron: "oklch(0.55 0.02 240)",
  verdant: "oklch(0.55 0.12 140)",
  crown: "oklch(0.78 0.14 78)",
}

const BIOME_LABEL: Record<Region["biome"], string> = {
  ash: "CINZA",
  moor: "PÂNTANO",
  iron: "FERRO",
  verdant: "BOSQUE",
  crown: "COROA",
}

export function WarRoom({
  save,
  onPickRegion,
  onOpenSquad,
}: {
  save: SaveState
  onPickRegion: (regionId: string) => void
  onOpenSquad: () => void
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = REGIONS.find((r) => r.id === selectedId) ?? null

  const cleared = useMemo(
    () => REGIONS.filter((r) => save.regions[r.id] === "cleared").length,
    [save.regions],
  )
  const total = REGIONS.length

  return (
    <div className="flex min-h-dvh w-full flex-col bg-background pb-safe pt-safe">
      {/* Header — compact, two rows on mobile */}
      <header className="sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-5 sm:py-3">
          <div className="flex items-center gap-2">
            <Crown className="size-4 text-accent" />
            <h1 className="font-display text-base font-black uppercase tracking-[0.18em] text-foreground sm:text-lg">
              Sala de Guerra
            </h1>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Stat icon={<Coins className="size-3" />} label="Ouro" value={save.gold} tone="gold" />
            <Stat
              icon={<Skull className="size-3" />}
              label="Heróis abatidos"
              value={save.heroesKilled.length}
              tone="destructive"
            />
            <Stat
              icon={<Crown className="size-3" />}
              label="Regiões limpas"
              value={`${cleared}/${total}`}
              tone="accent"
            />
          </div>
        </div>
      </header>

      {/* Region list */}
      <main className="flex-1">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-2.5 px-3 py-3 sm:gap-3 sm:px-5 sm:py-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Reino de Vael&apos;Thrand · 6 regiões
          </p>
          <ul className="flex flex-col gap-2.5 sm:gap-3">
            {REGIONS.map((r) => (
              <RegionCard
                key={r.id}
                region={r}
                status={save.regions[r.id]}
                onClick={() => {
                  if (save.regions[r.id] !== "locked") setSelectedId(r.id)
                }}
              />
            ))}
          </ul>
        </div>
      </main>

      {/* Squad bar — sticky bottom on mobile */}
      <div className="sticky bottom-0 z-10 border-t border-border bg-card/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-2 px-3 py-2 sm:gap-3 sm:px-5 sm:py-3">
          <button
            type="button"
            onClick={onOpenSquad}
            className="flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-foreground transition active:scale-[0.97] sm:px-3 sm:tracking-[0.25em]"
            aria-label="Abrir esquadrão"
          >
            <Users className="size-3.5" />
            <span className="text-accent">{save.squad.length}/3</span>
          </button>
          <div className="flex flex-1 items-center gap-1.5 overflow-x-auto no-scrollbar">
            {save.squad.length === 0 ? (
              <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
                Monte o esquadrão antes de invadir
              </p>
            ) : (
              save.squad.map((id) => {
                const u = save.roster.find((x) => x.id === id)
                if (!u) return null
                const tpl = MINION_TEMPLATES[u.templateId]
                const tone = TONE_TO_VAR[tpl.tone]
                return (
                  <span
                    key={id}
                    className="relative size-9 shrink-0 overflow-hidden rounded border-2"
                    style={{ borderColor: tone }}
                    title={u.name}
                  >
                    <Image
                      src={`/images/minions/${u.templateId}.jpg`}
                      alt={u.name}
                      fill
                      sizes="36px"
                      className="object-cover"
                    />
                  </span>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Region drawer */}
      {selected ? (
        <RegionDrawer
          region={selected}
          status={save.regions[selected.id]}
          squadCount={save.squad.length}
          onClose={() => setSelectedId(null)}
          onInvade={() => onPickRegion(selected.id)}
        />
      ) : null}
    </div>
  )
}

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  tone: "gold" | "destructive" | "accent"
}) {
  const color =
    tone === "gold" ? "var(--gold)" : tone === "destructive" ? "var(--destructive)" : "var(--accent)"
  return (
    <div
      className="flex items-center gap-1 rounded border bg-card/60 px-1.5 py-1 font-mono text-[10px] tabular-nums sm:px-2"
      style={{ borderColor: `${color.replace(")", " / 0.4)")}` }}
      aria-label={`${label}: ${value}`}
    >
      <span style={{ color }}>{icon}</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}

/* -------------------- Region card -------------------- */

function RegionCard({
  region,
  status,
  onClick,
}: {
  region: Region
  status: "available" | "cleared" | "locked"
  onClick: () => void
}) {
  const heroes = region.heroIds
    .map((heroId) => {
      for (let s = 1; s <= 14; s++) {
        const h = getHero(s)
        if (h.id === heroId) return h
      }
      return null
    })
    .filter((h): h is NonNullable<typeof h> => h !== null)

  const biomeColor = BIOME_COLOR[region.biome]
  const isLocked = status === "locked"
  const isCleared = status === "cleared"

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        disabled={isLocked}
        className={cn(
          "group relative flex w-full items-stretch gap-0 overflow-hidden rounded-lg border-2 bg-card/60 text-left transition active:scale-[0.99]",
          isLocked
            ? "cursor-not-allowed border-border/40 opacity-50"
            : isCleared
              ? "border-border/60 hover:border-accent/50"
              : "border-border hover:border-accent/60",
        )}
      >
        {/* Biome stripe */}
        <span
          aria-hidden="true"
          className="w-1.5 shrink-0 sm:w-2"
          style={{ backgroundColor: biomeColor }}
        />

        {/* Body */}
        <div className="flex flex-1 flex-col gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
          {/* Top row: badges */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span
                className="rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.22em]"
                style={{
                  color: biomeColor,
                  borderColor: `${biomeColor.replace(")", " / 0.5)")}`,
                  backgroundColor: `${biomeColor.replace(")", " / 0.08)")}`,
                }}
              >
                E{String(region.stage).padStart(2, "0")}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
                {BIOME_LABEL[region.biome]}
              </span>
            </div>
            <span className="flex items-center gap-1 font-mono text-[10px] tabular-nums text-gold">
              <Coins className="size-3" />
              {region.goldReward}
            </span>
          </div>

          {/* Title */}
          <div>
            <h3 className="font-display text-base font-black uppercase leading-tight tracking-tight text-foreground sm:text-lg">
              {region.name}
            </h3>
            <p className="line-clamp-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {region.subtitle}
            </p>
          </div>

          {/* Bottom row: heroes + status */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-2">
                {heroes.slice(0, 3).map((h) => (
                  <span
                    key={h.id}
                    className="relative size-7 overflow-hidden rounded-full border-2 border-card sm:size-8"
                  >
                    <Image
                      src={`/images/heroes/${h.id}.jpg`}
                      alt={h.name}
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  </span>
                ))}
              </div>
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                {heroes.length === 1 ? "1 herói" : `${heroes.length} heróis`}
              </span>
            </div>
            {isCleared ? (
              <span className="flex items-center gap-1 rounded border border-accent/40 bg-accent/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-accent">
                <Check className="size-3" />
                Limpo
              </span>
            ) : isLocked ? (
              <span className="flex items-center gap-1 rounded border border-border/60 bg-secondary/40 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                <Lock className="size-3" />
                Bloqueado
              </span>
            ) : (
              <span className="rounded border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-primary">
                Invadir
              </span>
            )}
          </div>
        </div>
      </button>
    </li>
  )
}

/* -------------------- Drawer -------------------- */

function RegionDrawer({
  region,
  status,
  squadCount,
  onClose,
  onInvade,
}: {
  region: Region
  status: "available" | "cleared" | "locked"
  squadCount: number
  onClose: () => void
  onInvade: () => void
}) {
  const heroDetails = region.heroIds
    .map((heroId) => {
      for (let s = 1; s <= 14; s++) {
        const h = getHero(s)
        if (h.id === heroId) return h
      }
      return null
    })
    .filter((h): h is NonNullable<typeof h> => h !== null)

  const canInvade = status === "available" && squadCount > 0
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-background/80 backdrop-blur sm:items-center sm:px-4">
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0"
      />
      <div className="vellum drop-in relative flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-lg border-2 border-border sm:rounded-lg">
        {/* Top bar */}
        <div className="flex items-start justify-between gap-2 border-b border-border bg-card/80 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[9px] tracking-[0.28em] text-accent">
              ESTÁGIO {String(region.stage).padStart(2, "0")} · {BIOME_LABEL[region.biome]}
            </p>
            <h3 className="font-display text-xl font-black uppercase leading-tight text-foreground sm:text-2xl">
              {region.name}
            </h3>
            <p className="line-clamp-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {region.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 rounded p-1.5 text-muted-foreground transition hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <p className="text-pretty text-sm leading-relaxed text-foreground/85">
            {region.lore}
          </p>

          <div>
            <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
              Defensores
            </p>
            <div className="flex flex-col gap-2">
              {heroDetails.map((h) => (
                <div
                  key={h.id}
                  className="flex items-start gap-2.5 rounded border border-destructive/40 bg-destructive/5 p-2"
                >
                  <span className="relative size-12 shrink-0 overflow-hidden rounded border border-destructive/60">
                    <Image
                      src={`/images/heroes/${h.id}.jpg`}
                      alt={h.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-xs font-black uppercase leading-tight text-destructive sm:text-sm">
                      {h.name}
                    </p>
                    <p className="truncate font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground sm:text-[10px]">
                      {h.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded border border-border bg-secondary/40 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em]">
            <span className="text-muted-foreground">Recompensa</span>
            <span className="flex items-center gap-1.5 text-gold">
              <Coins className="size-3.5" />
              {region.goldReward} ouro + saque
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-card/60 p-3 sm:p-4">
          <button
            type="button"
            onClick={onInvade}
            disabled={!canInvade}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-md border-2 px-4 py-3 font-display text-sm font-black uppercase tracking-[0.22em] transition active:scale-[0.98] sm:tracking-[0.25em]",
              canInvade
                ? "border-primary bg-primary text-primary-foreground"
                : "cursor-not-allowed border-border bg-secondary/60 text-muted-foreground",
            )}
          >
            <Swords className="size-4" />
            {status === "cleared"
              ? "JÁ LIMPO"
              : status === "locked"
                ? "BLOQUEADO"
                : squadCount === 0
                  ? "MONTE O ESQUADRÃO"
                  : "INVADIR"}
          </button>
        </div>
      </div>
    </div>
  )
}
