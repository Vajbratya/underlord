"use client"

/**
 * LootIcon — generated artifact image for relic/legendary/mythic items
 * (/images/loot/<id>.jpg), with a tone-tinted slot-glyph fallback.
 *
 * v13 — every icon is now TAPPABLE: a magnifier badge opens a full-screen
 * detail overlay (big art + name + rarity + every stat + taint + flavor) so
 * each piece of loot can be appreciated. Self-contained, so it works
 * everywhere LootIcon is used (loot screen, Mercante, Mercado Negro).
 */

import { useState } from "react"
import Image from "next/image"
import { Search, X } from "lucide-react"
import { lootHasImage, RARITY_LABEL, RARITY_TONE } from "@/lib/underlord/loot"
import { cn } from "@/lib/utils"
import type { LootItem } from "@/lib/underlord/types"

const SLOT_GLYPH: Record<LootItem["slot"], string> = {
  weapon: "⚔",
  helm: "⛨",
  trinket: "◈",
}
const SLOT_LABEL: Record<LootItem["slot"], string> = {
  weapon: "ARMA",
  helm: "ELMO",
  trinket: "BERLOQUE",
}
const TONE_CLASS: Record<string, string> = {
  foreground: "text-foreground border-border",
  accent: "text-accent border-accent/50",
  destructive: "text-destructive border-destructive/50",
  gold: "text-gold border-gold/60",
}
const TONE_TEXT: Record<string, string> = {
  foreground: "text-foreground",
  accent: "text-accent",
  destructive: "text-destructive",
  gold: "text-gold",
}

function statLines(it: LootItem): string[] {
  const out: string[] = []
  if (it.atkBonus) out.push(`${it.atkBonus > 0 ? "+" : ""}${it.atkBonus} ATK`)
  if (it.hpBonus) out.push(`${it.hpBonus > 0 ? "+" : ""}${it.hpBonus} HP`)
  if (it.rangeBonus) out.push(`${it.rangeBonus > 0 ? "+" : ""}${it.rangeBonus} ALC`)
  if (it.moveBonus) out.push(`${it.moveBonus > 0 ? "+" : ""}${it.moveBonus} MOV`)
  if (it.spdBonus) out.push(`${it.spdBonus > 0 ? "+" : ""}${it.spdBonus} VEL`)
  return out
}

function Thumb({ item, big }: { item: LootItem; big?: boolean }) {
  const [failed, setFailed] = useState(false)
  const useImg = lootHasImage(item.rarity) && !failed
  return useImg ? (
    <Image
      src={`/images/loot/${item.id}.jpg`}
      alt={item.name}
      fill
      sizes={big ? "320px" : "96px"}
      className="object-cover"
      onError={() => setFailed(true)}
    />
  ) : (
    <span className={cn("font-display leading-none opacity-80", big ? "text-7xl" : "text-2xl")}>
      {SLOT_GLYPH[item.slot]}
    </span>
  )
}

export function LootIcon({ item, className }: { item: LootItem; className?: string }) {
  const [zoom, setZoom] = useState(false)
  const tone = RARITY_TONE[item.rarity]
  const isMythic = item.rarity === "mythic"
  return (
    <>
      <span
        role="button"
        tabIndex={0}
        aria-label={`Ampliar ${item.name}`}
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          setZoom(true)
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation()
            e.preventDefault()
            setZoom(true)
          }
        }}
        className={cn(
          "group relative grid aspect-square w-full cursor-zoom-in place-items-center overflow-hidden rounded-md border bg-secondary/40",
          TONE_CLASS[tone] ?? TONE_CLASS.foreground,
          isMythic && "holo-mythic",
          className,
        )}
      >
        <Thumb item={item} />
        {/* magnifier hint */}
        <span className="absolute bottom-0 right-0 grid size-4 place-items-center rounded-tl bg-background/80 text-foreground/70 opacity-80">
          <Search className="size-2.5" />
        </span>
      </span>

      {zoom ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-5 backdrop-blur-sm"
          onClick={(e) => {
            e.stopPropagation()
            setZoom(false)
          }}
          role="dialog"
        >
          <div
            className={cn(
              "relative w-full max-w-sm overflow-hidden rounded-2xl border-2 bg-background p-5 shadow-2xl",
              TONE_CLASS[tone] ?? TONE_CLASS.foreground,
              isMythic && "holo-mythic",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setZoom(false)}
              aria-label="Fechar"
              className="absolute right-2 top-2 z-10 grid size-8 place-items-center rounded-full border border-border/60 bg-background/70 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
            <div className="relative mx-auto grid aspect-square w-full max-w-[18rem] place-items-center overflow-hidden rounded-xl border border-border/50 bg-secondary/30">
              <Thumb item={item} big />
            </div>
            <div className="mt-4 text-center">
              <span
                className={cn(
                  "inline-block rounded border px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-[0.2em]",
                  TONE_CLASS[tone] ?? TONE_CLASS.foreground,
                )}
              >
                {RARITY_LABEL[item.rarity]} · {SLOT_LABEL[item.slot]}
              </span>
              <h3 className={cn("mt-2 font-display text-lg font-black uppercase leading-tight", TONE_TEXT[tone])}>
                {item.name}
              </h3>
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {statLines(item).map((s) => (
                  <span
                    key={s}
                    className="rounded border border-border/60 bg-secondary/40 px-2 py-0.5 font-mono text-[10px] font-black tabular-nums text-foreground"
                  >
                    {s}
                  </span>
                ))}
                {item.taint > 0 ? (
                  <span className="rounded border border-destructive/50 bg-destructive/10 px-2 py-0.5 font-mono text-[10px] font-black tabular-nums text-destructive">
                    ☣ {item.taint.toFixed(1)} MÁCULA
                  </span>
                ) : null}
              </div>
              {item.flavor ? (
                <p className="mt-3 text-[12px] italic leading-relaxed text-foreground/80">
                  "{item.flavor}"
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
