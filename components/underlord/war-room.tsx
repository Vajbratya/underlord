"use client"

import Image from "next/image"
import { useMemo, useState } from "react"
import {
  ChevronRight,
  Coins,
  Crown,
  Flame,
  Gem,
  Hammer,
  Lock,
  Map,
  Shield,
  ShoppingBag,
  Skull,
  Sparkles,
  Swords,
  Users,
  Wand2,
  X,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Region, SaveState } from "@/lib/underlord/types"
import { REGIONS } from "@/lib/underlord/regions"
import { MINION_TEMPLATES } from "@/lib/underlord/units"
import { getHero } from "@/lib/elementum-flavor"
import { haptic } from "@/lib/underlord/haptics"
import { xpProgress } from "@/lib/underlord/meta"
import { squadCap } from "@/lib/underlord/perks"
import {
  canClaimDailyShards,
  DAILY_SHARD_POUCH,
} from "@/lib/underlord/economy"
import { Atmosphere } from "./atmosphere"

const TONE_TO_VAR: Record<string, string> = {
  primary: "var(--primary)",
  destructive: "var(--destructive)",
  accent: "var(--accent)",
  gold: "var(--gold)",
  foreground: "var(--foreground)",
}

const BIOME_COLOR: Record<Region["biome"], string> = {
  ash: "oklch(0.55 0.21 22)",
  moor: "oklch(0.50 0.07 220)",
  iron: "oklch(0.62 0.025 240)",
  verdant: "oklch(0.55 0.13 140)",
  crown: "oklch(0.78 0.14 78)",
  // New biomes from v6 — colored to read distinct on the world map dot.
  // Tundra: pale cyan-white. Dunes: sun-bleached gold. Abyss: deep black-cyan.
  tundra: "oklch(0.85 0.04 220)",
  dunes: "oklch(0.78 0.14 90)",
  abyss: "oklch(0.30 0.08 220)",
}

const BIOME_LABEL: Record<Region["biome"], string> = {
  ash: "CINZA",
  moor: "PÂNTANO",
  iron: "FERRO",
  verdant: "VIÇO",
  crown: "COROA",
  tundra: "TUNDRA",
  dunes: "DUNAS",
  abyss: "ABISMO",
}

export function WarRoom({
  save,
  onPickRegion,
  onOpenSquad,
  onOpenForge,
  onOpenSkillMap,
  onOpenBoons,
  onOpenMarket,
  streakBonus,
}: {
  save: SaveState
  onPickRegion: (regionId: string) => void
  onOpenSquad: () => void
  onOpenForge: () => void
  onOpenSkillMap: () => void
  onOpenBoons: () => void
  onOpenMarket: () => void
  streakBonus?: number | null
}) {
  const xp = xpProgress(save.xp)
  // Cap scales with Underlord level (+2 minions per level past 1) on top
  // of the EXÉRCITO perk ranks.
  const cap = squadCap(save.perks, xp.level)
  // Daily Soulshard pouch readiness — drives the MERCADO button glow so
  // the player has a clear "free reward waiting" affordance.
  const pouchReady = canClaimDailyShards(save)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = REGIONS.find((r) => r.id === selectedId) ?? null
  // Glow the SKILLS button when the player has unlocked skills they
  // haven't equipped yet — it's the "new toy" signal.
  const equippedSet = new Set(save.equippedSkills ?? [])
  const hasUnequippedNew = (save.unlockedSkills ?? []).some(
    (id) => !equippedSet.has(id),
  )

  const cleared = useMemo(
    () => REGIONS.filter((r) => save.regions[r.id] === "cleared").length,
    [save.regions],
  )
  const total = REGIONS.length

  function pickRegion(id: string) {
    haptic.tap()
    setSelectedId(id)
  }

  return (
    <div className="relative flex min-h-dvh w-full flex-col bg-background pb-safe">
      <Atmosphere src="/images/bg/war-room.jpg" intensity="heavy" embers={14} />

      {/* Header — meta progression */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto w-full max-w-3xl px-4 pt-3 pb-2.5 sm:px-6">
          {/* Top row: title + chips */}
          <div className="flex items-center gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="grid size-7 place-items-center rounded-sm border border-accent/60 bg-accent/15 text-accent">
                <Map className="size-3.5" />
              </span>
              <h1 className="truncate font-display text-base font-black uppercase tracking-[0.22em] text-foreground sm:text-lg">
                Sala de Guerra
              </h1>
            </div>
            <div className="ml-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {save.dailyStreak > 0 ? (
                <span className="flex shrink-0 items-center gap-1 rounded-sm border border-gold/60 bg-gold/15 px-2 py-1 font-mono text-[9px] font-black uppercase tracking-wider text-gold">
                  <Flame className="size-3" />
                  {save.dailyStreak}D
                </span>
              ) : null}
              <Stat icon={<Coins className="size-3.5" />} label="OURO" value={save.gold} />
              <Stat
                icon={<Skull className="size-3.5" />}
                label="HERÓIS"
                value={`${save.heroesKilled.length}/14`}
              />
              <Stat
                icon={<Crown className="size-3.5" />}
                label="REG"
                value={`${cleared}/${total}`}
              />
            </div>
          </div>
          {/* XP bar + level + Forja button */}
          <div className="mt-2.5 flex items-center gap-2">
            <span className="flex shrink-0 items-center gap-1 rounded-sm border border-accent/70 bg-accent/15 px-2 py-1 font-mono text-[9px] font-black uppercase tracking-[0.18em] text-accent">
              <Zap className="size-3" />
              LV {xp.level}
            </span>
            <div className="relative h-2.5 flex-1 overflow-hidden rounded-full border border-border bg-secondary/50">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-primary to-accent transition-[width] duration-700"
                style={{ width: `${xp.pct * 100}%` }}
              />
              <div
                className="absolute inset-y-0 left-0 opacity-50 mix-blend-overlay"
                style={{
                  width: `${xp.pct * 100}%`,
                  background:
                    "repeating-linear-gradient(135deg, transparent 0px, transparent 4px, oklch(1 0 0 / 0.15) 4px, oklch(1 0 0 / 0.15) 5px)",
                }}
              />
            </div>
            <span className="shrink-0 font-mono text-[9px] tabular-nums text-muted-foreground">
              {xp.intoLevel}/{xp.needed}
            </span>
            <button
              type="button"
              onClick={() => {
                haptic.select()
                onOpenBoons()
              }}
              aria-label="Bençãos"
              title={
                (save.boons?.length ?? 0) > 0
                  ? `Bençãos · ${save.boons.length} acumulada${save.boons.length === 1 ? "" : "s"}`
                  : "Bençãos — vença batalhas para coletar"
              }
              className={cn(
                "relative flex h-7 shrink-0 items-center gap-1 rounded-sm border px-2 font-mono text-[9px] font-black uppercase tracking-[0.18em] transition active:scale-95",
                (save.boons?.length ?? 0) > 0
                  ? "border-gold/70 bg-gold/10 text-gold"
                  : "border-border bg-card/70 text-muted-foreground hover:text-foreground",
              )}
            >
              <Sparkles className="size-3" />
              <span className="hidden sm:inline">BENÇÃOS</span>
              {(save.boons?.length ?? 0) > 0 ? (
                <span className="rounded bg-gold text-background px-1 font-display text-[10px] leading-none tabular-nums">
                  {save.boons.length}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => {
                haptic.select()
                onOpenSkillMap()
              }}
              aria-label="Skill Map"
              title="Skill Map — habilidades ativas do Underlord"
              className={cn(
                "relative flex h-7 shrink-0 items-center gap-1 rounded-sm border px-2 font-mono text-[9px] font-black uppercase tracking-[0.18em] transition active:scale-95",
                hasUnequippedNew
                  ? "border-accent bg-accent/15 text-accent ready-pulse"
                  : "border-border bg-card/70 text-muted-foreground hover:text-foreground",
              )}
            >
              <Wand2 className="size-3" />
              <span className="hidden sm:inline">SKILLS</span>
              {hasUnequippedNew ? (
                <span className="rounded bg-accent text-background px-1 font-display text-[10px] leading-none tabular-nums">
                  !
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => {
                haptic.select()
                onOpenForge()
              }}
              aria-label="Forja"
              title={
                save.perkPoints > 0
                  ? `Forja · ${save.perkPoints} ponto${save.perkPoints === 1 ? "" : "s"} para gastar`
                  : "Forja"
              }
              className={cn(
                "relative flex h-7 shrink-0 items-center gap-1 rounded-sm border px-2 font-mono text-[9px] font-black uppercase tracking-[0.18em] transition active:scale-95",
                save.perkPoints > 0
                  ? "border-gold bg-gold/15 text-gold ready-pulse"
                  : "border-border bg-card/70 text-muted-foreground hover:text-foreground",
              )}
            >
              <Hammer className="size-3" />
              <span className="hidden sm:inline">FORJA</span>
              {save.perkPoints > 0 ? (
                <span className="rounded bg-gold text-background px-1 font-display text-[10px] leading-none tabular-nums">
                  {save.perkPoints}
                </span>
              ) : null}
            </button>
            {/* Mercado Negro — daily-rotating loot shop. Glows when the
                daily Soulshard pouch is unclaimed (see canClaimDailyShards). */}
            <button
              type="button"
              onClick={() => {
                haptic.select()
                onOpenMarket()
              }}
              aria-label="Mercado Negro"
              title={
                pouchReady
                  ? `Mercado Negro · saco diário disponível (+${DAILY_SHARD_POUCH} Soulshards)`
                  : "Mercado Negro"
              }
              className={cn(
                "relative flex h-7 shrink-0 items-center gap-1 rounded-sm border px-2 font-mono text-[9px] font-black uppercase tracking-[0.18em] transition active:scale-95",
                pouchReady
                  ? "border-gold bg-gold/15 text-gold ready-pulse"
                  : "border-border bg-card/70 text-muted-foreground hover:text-foreground",
              )}
            >
              <ShoppingBag className="size-3" />
              <span className="hidden sm:inline">MERCADO</span>
              <span className="flex items-center gap-0.5 rounded bg-card/80 px-1 font-display text-[10px] leading-none tabular-nums text-foreground">
                <Gem className="size-2.5" />
                {save.soulshards ?? 0}
              </span>
            </button>
          </div>
        </div>
        {/* Streak bonus banner */}
        {streakBonus && streakBonus > 0 ? (
          <div className="slam-in border-t border-gold/50 bg-gradient-to-r from-gold/10 via-gold/25 to-gold/10 px-3 py-2 sm:px-6">
            <p className="text-center font-mono text-[10px] uppercase tracking-[0.28em] text-gold">
              <Flame className="mr-1.5 inline size-3.5" />
              Streak {save.dailyStreak}D · +{streakBonus} ouro
            </p>
          </div>
        ) : null}
      </header>

      {/* Region cards — luxe vertical list */}
      <main className="relative z-10 flex-1">
        <div className="mx-auto w-full max-w-3xl px-3 py-4 sm:px-6">
          {/* Section header */}
          <div className="mb-3 flex items-center gap-3 px-1">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
            <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
              Mapa da Cruzada
            </p>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
          </div>

          <div className="flex flex-col gap-2.5">
            {REGIONS.map((r, idx) => (
              <RegionCard
                key={r.id}
                region={r}
                index={idx}
                status={save.regions[r.id]}
                onTap={() => pickRegion(r.id)}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Bottom squad bar */}
      <div className="sticky bottom-0 z-10 border-t border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-2 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => {
              haptic.select()
              onOpenSquad()
            }}
            className="flex h-12 shrink-0 items-center gap-2 rounded-md border-2 border-border bg-card px-3 font-mono text-[10px] uppercase tracking-[0.24em] text-foreground transition active:scale-[0.97] hover:border-accent/60"
          >
            <Users className="size-4" />
            <span className="font-black tabular-nums">
              {save.squad.length}/{cap}
            </span>
          </button>
          <div className="flex flex-1 items-center gap-1.5 overflow-x-auto no-scrollbar">
            {save.squad.length === 0 ? (
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                monte o esquadrão →
              </span>
            ) : (
              save.squad.map((id) => {
                const u = save.roster.find((x) => x.id === id)
                if (!u) return null
                const tpl = MINION_TEMPLATES[u.templateId]
                const tone = TONE_TO_VAR[tpl.tone]
                return (
                  <span
                    key={id}
                    className="relative size-10 shrink-0 overflow-hidden rounded-full border-2"
                    style={{ borderColor: tone }}
                    title={u.name}
                  >
                    <Image
                      src={`/images/minions/${u.templateId}.jpg`}
                      alt={tpl.name}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </span>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Region detail drawer */}
      {selected ? (
        <RegionDrawer
          region={selected}
          status={save.regions[selected.id]}
          squadCount={save.squad.length}
          onClose={() => setSelectedId(null)}
          onInvade={() => {
            haptic.select()
            onPickRegion(selected.id)
          }}
        />
      ) : null}
    </div>
  )
}

function RegionCard({
  region,
  index,
  status,
  onTap,
}: {
  region: Region
  index: number
  status: "available" | "cleared" | "locked"
  onTap: () => void
}) {
  const biomeColor = BIOME_COLOR[region.biome]
  const isLocked = status === "locked"
  const isCleared = status === "cleared"
  const isAvailable = status === "available"
  const heroes = region.heroIds
    .map((heroId) => {
      for (let s = 1; s <= 14; s++) {
        const h = getHero(s)
        if (h.id === heroId) return h
      }
      return null
    })
    .filter((h): h is NonNullable<typeof h> => h !== null)

  return (
    <button
      type="button"
      onClick={onTap}
      disabled={isLocked}
      className={cn(
        "group relative flex w-full items-stretch gap-0 overflow-hidden rounded-md border-2 text-left transition active:scale-[0.99]",
        isLocked
          ? "border-border/40 bg-card/40 opacity-60"
          : isCleared
            ? "border-border bg-card/70 backdrop-blur"
            : "border-primary/60 bg-card/85 backdrop-blur shadow-[0_4px_24px_oklch(0.55_0.21_22/0.20)]",
      )}
      style={{ animation: `drop-in 0.4s ${index * 0.05}s ease-out both` }}
    >
      {/* Left biome stripe */}
      <span
        className="w-1.5 shrink-0"
        style={{ backgroundColor: biomeColor }}
      />

      {/* Stage badge column */}
      <div className="flex w-14 shrink-0 flex-col items-center justify-center gap-0.5 border-r border-border/50 bg-background/50 px-2 py-3">
        <p className="font-mono text-[8px] uppercase tracking-[0.24em] text-muted-foreground">
          ESTÁGIO
        </p>
        <p className="font-display text-2xl font-black leading-none tabular-nums text-foreground">
          {String(region.stage).padStart(2, "0")}
        </p>
        <span
          className="mt-0.5 rounded-sm border px-1 py-0.5 font-mono text-[7px] font-black uppercase tracking-wider"
          style={{ color: biomeColor, borderColor: biomeColor }}
        >
          {BIOME_LABEL[region.biome]}
        </span>
      </div>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 p-3">
        <div className="min-w-0">
          <h3 className="truncate font-display text-base font-black uppercase leading-tight tracking-tight text-foreground sm:text-lg">
            {region.name}
          </h3>
          <p className="truncate font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            {region.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Hero portrait stack */}
          <div className="flex -space-x-2">
            {heroes.slice(0, 3).map((h) => (
              <span
                key={h.id}
                className="relative size-7 overflow-hidden rounded-full border-2 border-background"
              >
                <Image
                  src={`/images/heroes/${h.id}.jpg`}
                  alt={h.name}
                  fill
                  sizes="28px"
                  className={cn(
                    "object-cover",
                    isCleared && "grayscale",
                  )}
                />
              </span>
            ))}
          </div>
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
            {heroes.length} {heroes.length === 1 ? "herói" : "heróis"}
          </span>
          {region.dropsLoot ? (
            <span
              className="ml-auto flex items-center gap-1 rounded-sm border border-gold/50 bg-gold/15 px-1.5 py-0.5 font-mono text-[8px] font-black uppercase tracking-[0.18em] text-gold"
              title="Esta região cai equipamento"
            >
              <Gem className="size-3" />
              SAQUE
            </span>
          ) : null}
          <span
            className={cn(
              "flex items-center gap-1 font-mono text-[10px] font-black uppercase tracking-wider text-gold",
              !region.dropsLoot && "ml-auto",
            )}
          >
            <Coins className="size-3" />
            {region.goldReward}
          </span>
        </div>
      </div>

      {/* Right action column */}
      <div
        className={cn(
          "flex w-12 shrink-0 flex-col items-center justify-center gap-1 border-l text-center",
          isAvailable
            ? "border-primary/40 bg-primary/15 text-primary"
            : isCleared
              ? "border-border/40 bg-secondary/30 text-muted-foreground"
              : "border-border/40 bg-secondary/30 text-muted-foreground",
        )}
      >
        {isLocked ? (
          <Lock className="size-4" />
        ) : isCleared ? (
          <Shield className="size-4" />
        ) : (
          <ChevronRight className={cn("size-5", isAvailable && "ready-pulse")} />
        )}
        <p className="font-mono text-[7px] font-black uppercase tracking-wider">
          {isLocked ? "BLOC." : isCleared ? "LIMPO" : "INVADIR"}
        </p>
      </div>

      {/* Sheen on hover for available cards */}
      {isAvailable ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-[-30%] w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/8 to-transparent transition-transform duration-1000 group-hover:translate-x-[400%]"
        />
      ) : null}
    </button>
  )
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
}) {
  return (
    <div className="flex shrink-0 items-center gap-1.5 rounded-sm border border-border/70 bg-card/70 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground sm:text-[10px]">
      <span className="text-accent">{icon}</span>
      <span className="font-black tabular-nums text-foreground">{value}</span>
      <span className="hidden sm:inline">{label}</span>
    </div>
  )
}

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
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-background/75 backdrop-blur sm:items-center">
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-t-lg border-2 border-border bg-card/95 backdrop-blur sm:rounded-lg">
        {/* Top bar */}
        <div
          className="flex items-center justify-between gap-2 border-b border-border bg-card/80 px-4 py-3"
          style={{
            backgroundImage: `linear-gradient(180deg, ${BIOME_COLOR[region.biome]}33, transparent 100%)`,
          }}
        >
          <div className="min-w-0">
            <p className="font-mono text-[9px] tracking-[0.32em] text-accent">
              ESTÁGIO {String(region.stage).padStart(2, "0")} ·{" "}
              {BIOME_LABEL[region.biome]}
            </p>
            <h3 className="truncate font-display text-xl font-black uppercase leading-tight tracking-tight text-foreground sm:text-2xl">
              {region.name}
            </h3>
            <p className="truncate font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {region.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 shrink-0 place-items-center rounded text-muted-foreground transition hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-3 p-4">
          <p className="text-pretty text-sm leading-relaxed text-foreground/90">
            {region.lore}
          </p>

          <div>
            <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.32em] text-muted-foreground">
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
                    <p className="truncate font-display text-xs font-black uppercase leading-tight text-destructive sm:text-sm">
                      {h.name}
                    </p>
                    <p className="truncate font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground sm:text-[10px]">
                      {h.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded border border-border bg-secondary/40 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.22em]">
            <span className="text-muted-foreground">Recompensa</span>
            <span className="flex items-center gap-1.5 text-gold">
              <Coins className="size-3.5" />
              {region.goldReward} ouro
              {region.dropsLoot ? (
                <>
                  <span className="opacity-60">·</span>
                  <Gem className="size-3.5" />
                  saque
                </>
              ) : (
                <span className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground">
                  · sem saque
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Footer — primary action in the thumb zone */}
        <div className="border-t border-border bg-card/60 p-3">
          <button
            type="button"
            onClick={onInvade}
            disabled={!canInvade}
            className={cn(
              "flex h-14 w-full items-center justify-center gap-2 rounded-md border-2 px-4 font-display text-sm font-black uppercase tracking-[0.24em] transition active:scale-[0.97] sm:h-16 sm:tracking-[0.28em]",
              canInvade
                ? "border-primary bg-primary text-primary-foreground pulse-glow"
                : "cursor-not-allowed border-border bg-secondary/60 text-muted-foreground",
            )}
            style={
              canInvade
                ? {
                    boxShadow:
                      "inset 0 1px 0 oklch(1 0 0 / 0.18), inset 0 -2px 0 oklch(0 0 0 / 0.35), 0 6px 24px oklch(0.55 0.21 22 / 0.45)",
                  }
                : undefined
            }
          >
            <Swords className="size-5" />
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
