"use client"

/**
 * O MERCANTE — gold vendor. Stocks a broad spread across all rarities for
 * GOLD (steep prices = grind), rotates daily, re-rollable for a fee.
 */

import { Coins, RefreshCw, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { haptic } from "@/lib/underlord/haptics"
import {
  buildMerchant,
  MERCHANT_REROLL_COST,
} from "@/lib/underlord/economy"
import { RARITY_LABEL } from "@/lib/underlord/loot"
import { LootIcon } from "./loot-icon"
import type { LootItem, SaveState } from "@/lib/underlord/types"

const RARITY_TEXT: Record<string, string> = {
  common: "text-foreground",
  uncommon: "text-accent",
  cursed: "text-destructive",
  relic: "text-gold",
  legendary: "text-gold",
  mythic: "text-gold",
}

export function MerchantPanel({
  save,
  onBuy,
  onReroll,
  onClose,
}: {
  save: SaveState
  onBuy: (itemId: string, price: number, item: LootItem) => void
  onReroll: (cost: number) => void
  onClose: () => void
}) {
  const day = save.merchant?.day ?? ""
  const rerolls = save.merchant?.rerolls ?? 0
  const bought = save.merchant?.bought ?? []
  const offer = buildMerchant(day, rerolls)

  function statLine(it: LootItem): string {
    const parts: string[] = []
    if (it.atkBonus) parts.push(`ATK ${it.atkBonus > 0 ? "+" : ""}${it.atkBonus}`)
    if (it.hpBonus) parts.push(`HP ${it.hpBonus > 0 ? "+" : ""}${it.hpBonus}`)
    if (it.rangeBonus) parts.push(`ALC ${it.rangeBonus > 0 ? "+" : ""}${it.rangeBonus}`)
    if (it.moveBonus) parts.push(`MOV ${it.moveBonus > 0 ? "+" : ""}${it.moveBonus}`)
    if (it.spdBonus) parts.push(`VEL ${it.spdBonus > 0 ? "+" : ""}${it.spdBonus}`)
    return parts.join(" · ")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
      <div className="flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border-2 border-gold/40 bg-background shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border/60 bg-gold/10 px-5 py-4">
          <div>
            <h2 className="font-display text-2xl font-black uppercase tracking-[0.2em] text-gold">
              O Mercante
            </h2>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              Tudo tem preço. Geralmente o seu ouro.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-md border border-gold/50 bg-gold/10 px-2 py-1 font-mono text-[11px] font-black text-gold">
              <Coins className="size-3.5" />
              {save.gold}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="grid size-9 place-items-center rounded-full border border-border/60 text-muted-foreground hover:text-foreground"
              aria-label="Fechar"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4">
          <div className="grid grid-cols-1 gap-2.5">
            {offer.items.map((it) => {
              const price = offer.prices[it.id] ?? 0
              const isBought = bought.includes(it.id)
              const tooPoor = save.gold < price
              return (
                <div
                  key={it.id}
                  className={cn(
                    "flex min-w-0 items-center gap-3 rounded-xl border bg-card/60 p-2.5",
                    it.rarity === "mythic"
                      ? "border-gold/60"
                      : it.rarity === "legendary" || it.rarity === "relic"
                        ? "border-gold/30"
                        : "border-border/60",
                    isBought && "opacity-40",
                  )}
                >
                  <div className="size-14 shrink-0">
                    <LootIcon item={it} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate font-display text-sm font-bold uppercase tracking-wide", RARITY_TEXT[it.rarity])}>
                      {it.name}
                    </p>
                    <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                      {RARITY_LABEL[it.rarity]} · {it.slot}
                      {it.taint ? ` · ☣ ${it.taint}` : ""}
                    </p>
                    <p className="truncate font-mono text-[10px] text-foreground/70">
                      {statLine(it)}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isBought || tooPoor}
                    onClick={() => {
                      haptic.tap()
                      onBuy(it.id, price, it)
                    }}
                    className={cn(
                      "flex shrink-0 flex-col items-center gap-0.5 rounded-lg border-2 px-3 py-2 font-mono text-[10px] font-black uppercase transition active:scale-95",
                      isBought
                        ? "border-border bg-secondary/40 text-muted-foreground"
                        : tooPoor
                          ? "border-destructive/40 bg-destructive/5 text-destructive/60"
                          : "border-gold bg-gold/15 text-gold",
                    )}
                  >
                    {isBought ? (
                      "VENDIDO"
                    ) : (
                      <>
                        <span className="flex items-center gap-0.5">
                          <Coins className="size-3" />
                          {price}
                        </span>
                        <span>COMPRAR</span>
                      </>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="border-t border-border/60 px-4 py-3">
          <button
            type="button"
            disabled={save.gold < MERCHANT_REROLL_COST}
            onClick={() => {
              haptic.tap()
              onReroll(MERCHANT_REROLL_COST)
            }}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-lg border-2 py-3 font-display text-xs font-black uppercase tracking-[0.2em] transition active:scale-95",
              save.gold < MERCHANT_REROLL_COST
                ? "border-border bg-secondary/30 text-muted-foreground"
                : "border-accent bg-accent/15 text-accent",
            )}
          >
            <RefreshCw className="size-4" />
            Renovar estoque · {MERCHANT_REROLL_COST}
            <Coins className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
