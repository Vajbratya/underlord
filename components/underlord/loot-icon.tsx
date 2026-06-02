"use client"

/**
 * LootIcon — shows a generated artifact image for relic/legendary/mythic
 * items (at /images/loot/<id>.jpg), with a tone-tinted slot-glyph fallback
 * (à la HeroPortrait) for items without art or while the farm catches up.
 */

import { useState } from "react"
import Image from "next/image"
import { lootHasImage } from "@/lib/underlord/loot"
import { RARITY_TONE } from "@/lib/underlord/loot"
import { cn } from "@/lib/utils"
import type { LootItem } from "@/lib/underlord/types"

const SLOT_GLYPH: Record<LootItem["slot"], string> = {
  weapon: "⚔",
  helm: "⛨",
  trinket: "◈",
}

const TONE_CLASS: Record<string, string> = {
  foreground: "text-foreground border-border",
  accent: "text-accent border-accent/50",
  destructive: "text-destructive border-destructive/50",
  gold: "text-gold border-gold/60",
}

export function LootIcon({
  item,
  className,
}: {
  item: LootItem
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const tone = RARITY_TONE[item.rarity]
  const useImg = lootHasImage(item.rarity) && !failed
  const isMythic = item.rarity === "mythic"
  return (
    <div
      className={cn(
        "relative grid aspect-square w-full place-items-center overflow-hidden rounded-md border bg-secondary/40",
        TONE_CLASS[tone] ?? TONE_CLASS.foreground,
        isMythic && "holo-mythic",
        className,
      )}
    >
      {useImg ? (
        <Image
          src={`/images/loot/${item.id}.jpg`}
          alt={item.name}
          fill
          sizes="96px"
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="font-display text-2xl leading-none opacity-80">
          {SLOT_GLYPH[item.slot]}
        </span>
      )}
    </div>
  )
}
