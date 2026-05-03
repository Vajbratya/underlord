"use client"

import {
  Crown,
  Flame,
  Hammer,
  Lock,
  Map as MapIcon,
  Scroll,
  ShoppingBag,
  Skull,
  Sparkles,
  Swords,
  X,
} from "lucide-react"
import { SPIRE_ROOMS, DREAD_SCHOOLS } from "@/lib/underlord/data"
import type { SaveState, SpireRoom, SpireRoomId } from "@/lib/underlord/types"
import { cn } from "@/lib/utils"

interface Props {
  save: SaveState
  notice: string | null
  onClearNotice: () => void
  onOpenOverworld: () => void
  onOpenStub: (room: SpireRoom) => void
}

const ROOM_ICON: Record<SpireRoomId, typeof MapIcon> = {
  "war-room": MapIcon,
  throne: Crown,
  pit: Skull,
  forge: Hammer,
  reliquary: Scroll,
  font: Sparkles,
  market: ShoppingBag,
  echoes: Flame,
}

export function SpireHub({
  save,
  notice,
  onClearNotice,
  onOpenOverworld,
  onOpenStub,
}: Props) {
  const school = DREAD_SCHOOLS[save.underlord.school]
  return (
    <main className="relative mx-auto flex min-h-dvh max-w-5xl flex-col px-4 pb-safe pt-safe sm:px-6">
      <SpireHeader save={save} schoolName={school.name} />

      <section className="mt-4 grid gap-2 sm:mt-6 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
        {SPIRE_ROOMS.map((room) => {
          const unlocked = save.spireRooms[room.id]
          const Icon = ROOM_ICON[room.id]
          return (
            <RoomCard
              key={room.id}
              room={room}
              unlocked={unlocked}
              icon={Icon}
              onClick={() => {
                if (!unlocked) return
                if (room.action === "open-overworld") onOpenOverworld()
                else onOpenStub(room)
              }}
            />
          )
        })}
      </section>

      <SpireFooter save={save} school={school.passive} />

      {notice ? <Notice text={notice} onClose={onClearNotice} /> : null}
    </main>
  )
}

/* ------------------------------------------------------------------ */
/* Header                                                               */
/* ------------------------------------------------------------------ */

function SpireHeader({ save, schoolName }: { save: SaveState; schoolName: string }) {
  const { underlord, resources, cycle } = save
  return (
    <header className="mt-4 flex flex-col gap-3 border-b border-border pb-4 sm:mt-6">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] tracking-[0.4em] text-muted-foreground">
          THE BLACK SPIRE
        </p>
        <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">
          CYCLE {String(cycle).padStart(2, "0")}
        </p>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl font-black leading-none text-foreground sm:text-3xl">
            {underlord.name.toUpperCase()}
          </h1>
          <p className="mt-1 font-mono text-[10px] tracking-[0.25em] text-primary sm:text-xs">
            {schoolName} · LEVEL {underlord.level}
          </p>
        </div>

        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          <Pip label="GOLD" value={resources.gold} tone="gold" />
          <Pip label="SHARDS" value={underlord.shards} tone="gold" />
          <Pip label="STANDING" value={resources.standing} tone="muted" />
          <Pip label="TAINT" value={resources.taint} tone="taint" />
        </div>
      </div>
    </header>
  )
}

function Pip({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: "gold" | "muted" | "taint"
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded border bg-card/80 px-2 py-1 backdrop-blur sm:px-2.5 sm:py-1.5",
        tone === "gold" && "border-[var(--gold)]/40",
        tone === "taint" && "border-[var(--taint)]/40",
        tone === "muted" && "border-border",
      )}
    >
      <span className="font-mono text-[8px] tracking-[0.25em] text-muted-foreground sm:text-[9px]">
        {label}
      </span>
      <span
        className={cn(
          "font-mono text-sm font-black tabular-nums sm:text-base",
          tone === "gold" && "text-[var(--gold)]",
          tone === "taint" && "text-[var(--taint)]",
          tone === "muted" && "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Rooms                                                                */
/* ------------------------------------------------------------------ */

function RoomCard({
  room,
  unlocked,
  icon: Icon,
  onClick,
}: {
  room: SpireRoom
  unlocked: boolean
  icon: typeof MapIcon
  onClick: () => void
}) {
  const isWar = room.id === "war-room"
  const isThrone = room.id === "throne"
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!unlocked}
      className={cn(
        "group relative flex flex-col gap-2 overflow-hidden rounded-md border-2 p-3 text-left transition sm:p-4",
        unlocked
          ? cn(
              "border-border bg-card hover:border-primary/60 hover:bg-primary/5 active:scale-[0.98]",
              isWar && "border-primary/50 bg-primary/10 hover:border-primary",
            )
          : "cursor-not-allowed border-border/40 bg-card/40 opacity-60",
        isThrone && unlocked && "border-[var(--gold)]/40",
      )}
      aria-label={room.name}
    >
      <div className="flex items-center justify-between">
        <Icon
          className={cn(
            "size-4 sm:size-5",
            unlocked
              ? isWar
                ? "text-primary"
                : isThrone
                  ? "text-[var(--gold)]"
                  : "text-foreground"
              : "text-muted-foreground/60",
          )}
          aria-hidden="true"
        />
        {!unlocked ? (
          <Lock className="size-3 text-muted-foreground" aria-hidden="true" />
        ) : null}
      </div>
      <div>
        <p
          className={cn(
            "font-display text-xs font-black tracking-[0.2em] sm:text-sm",
            unlocked ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {room.name}
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{room.blurb}</p>
      </div>
      {!unlocked ? (
        <p className="mt-auto font-mono text-[9px] tracking-[0.25em] text-muted-foreground">
          UNLOCKS · CYCLE {String(room.unlockCycle).padStart(2, "0")}
        </p>
      ) : isWar ? (
        <p className="mt-auto inline-flex items-center gap-1 font-mono text-[9px] tracking-[0.25em] text-primary">
          <Swords className="size-3" /> ENTER
        </p>
      ) : null}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Footer                                                                */
/* ------------------------------------------------------------------ */

function SpireFooter({ save, school }: { save: SaveState; school: string }) {
  return (
    <footer className="mt-auto pt-6">
      <div className="rounded-md border border-border bg-card/60 p-3 sm:p-4">
        <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">
          SCHOOL PASSIVE
        </p>
        <p className="mt-1.5 text-[12px] leading-relaxed text-foreground">{school}</p>
      </div>
      <p className="mt-3 text-center font-mono text-[9px] tracking-[0.4em] text-muted-foreground/60">
        REGIONS HELD · {save.resources.corrupted}  ·  COURT WHISPERS · {save.cycle * 7}
      </p>
    </footer>
  )
}

/* ------------------------------------------------------------------ */
/* Notice toast                                                          */
/* ------------------------------------------------------------------ */

function Notice({ text, onClose }: { text: string; onClose: () => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div className="pop-in pointer-events-auto flex max-w-md items-start gap-3 rounded-md border-2 border-primary/60 bg-card/95 px-3 py-2.5 shadow-[0_0_32px_oklch(0.68_0.18_45/0.25)] backdrop-blur sm:px-4 sm:py-3">
        <Crown className="mt-0.5 size-4 text-primary" aria-hidden="true" />
        <p className="text-[12px] leading-relaxed text-foreground">{text}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
