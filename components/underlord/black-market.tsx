"use client"

import { useMemo } from "react"
import { ChevronLeft, Coins, Gem, Lock, ShoppingBag } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  buildBlackMarket,
  canClaimDailyShards,
  DAILY_SHARD_POUCH,
  dismantleValue,
  todayKey,
} from "@/lib/underlord/economy"
import { RARITY_LABEL, RARITY_TONE } from "@/lib/underlord/loot"
import type { LootItem, SaveState } from "@/lib/underlord/types"
import { haptic } from "@/lib/underlord/haptics"

/** Tailwind class set for each visual tone returned by RARITY_TONE. */
type Tone = "foreground" | "accent" | "destructive" | "gold"
const TONE_CLASS: Record<Tone, string> = {
  foreground: "text-foreground border-border bg-card/70",
  accent: "text-accent border-accent/60 bg-accent/10",
  destructive: "text-destructive border-destructive/60 bg-destructive/10",
  gold: "text-gold border-gold/70 bg-gold/10",
}

/**
 * Black Market — daily shop selling guaranteed-rarity loot for
 * Soulshards. Five offers per UTC day, deterministic across reloads.
 *
 * Also home to:
 *   - the daily-login pouch (free 25 shards/day)
 *   - the dismantle list (turn unwanted inventory into shards)
 *
 * The shop is gated behind a single screen so the player has a clear
 * "merchant tab" mental model rather than three scattered buttons.
 */
export function BlackMarket({
  save,
  onClaimDaily,
  onBuy,
  onDismantle,
  onClose,
}: {
  save: SaveState
  onClaimDaily: () => void
  onBuy: (itemId: string, price: number, item: LootItem) => void
  onDismantle: (lootId: string) => void
  onClose: () => void
}) {
  const day = todayKey()
  const offer = useMemo(() => buildBlackMarket(day), [day])
  const bought = new Set(save.blackMarketBought ?? [])
  const canClaim = canClaimDailyShards(save)

  // Inventory items eligible for dismantle: anything not currently
  // equipped. We compute "equipped" by walking the roster once.
  const equippedIds = new Set(
    save.roster.map((u) => u.equipped).filter(Boolean) as string[],
  )
  const dismantlables = save.inventory.filter((i) => !equippedIds.has(i.id))

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background pb-safe pt-safe">
      <header className="flex items-center justify-between gap-3 border-b border-border/60 bg-card/40 px-4 py-3 backdrop-blur sm:px-6">
        <button
          type="button"
          onClick={() => {
            haptic.tap()
            onClose()
          }}
          className="inline-flex items-center gap-1 rounded-md border-2 border-border bg-card/70 px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground transition active:scale-95 hover:border-accent/60 hover:text-foreground"
        >
          <ChevronLeft className="size-3.5" />
          Voltar
        </button>

        <div className="flex flex-col items-center text-center">
          <span className="font-mono text-[9px] tracking-[0.36em] text-muted-foreground sm:text-[10px]">
            MERCADO NEGRO
          </span>
          <span className="font-display text-base font-black uppercase tracking-tight text-foreground sm:text-lg">
            Catedral Sob a Catedral
          </span>
        </div>

        <div className="flex items-center gap-1.5 rounded-md border border-gold/60 bg-gold/10 px-2.5 py-1.5 font-mono text-[11px] font-black tabular-nums text-gold">
          <Gem className="size-3.5" />
          {save.soulshards ?? 0}
        </div>
      </header>

      <main className="relative flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Daily login pouch */}
          <section>
            <h2 className="mb-2 font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
              Saco da Madrugada
            </h2>
            <button
              type="button"
              disabled={!canClaim}
              onClick={() => {
                if (!canClaim) return
                // Daily-claim is functionally a purchase confirm.
                haptic.purchase()
                onClaimDaily()
              }}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-md border-2 px-4 py-3 text-left transition active:scale-[0.98]",
                canClaim
                  ? "border-gold/70 bg-gold/15 hover:bg-gold/20"
                  : "border-border bg-card/40 opacity-60 cursor-not-allowed",
              )}
            >
              <div className="min-w-0">
                <p
                  className={cn(
                    "font-display text-base font-black uppercase tracking-tight",
                    canClaim ? "text-gold" : "text-muted-foreground",
                  )}
                >
                  Recompensa diária
                </p>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                  {canClaim
                    ? "O coveiro deixou um saco. Pegue antes do amanhecer."
                    : "Você já recolheu hoje. Volte amanhã pela próxima madrugada."}
                </p>
              </div>
              <div
                className={cn(
                  "flex shrink-0 items-center gap-1 rounded-sm border px-2.5 py-1.5 font-mono text-xs font-black tabular-nums",
                  canClaim
                    ? "border-gold/70 bg-background text-gold"
                    : "border-border bg-card/60 text-muted-foreground",
                )}
              >
                <Gem className="size-3" />+{DAILY_SHARD_POUCH}
              </div>
            </button>
          </section>

          {/* Black market offers */}
          <section>
            <h2 className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
              <ShoppingBag className="size-3" />
              Estoque · {day}
            </h2>
            <div className="space-y-2">
              {offer.items.map((item) => {
                const price = offer.prices[item.id] ?? 0
                const owned = bought.has(item.id)
                const broke = (save.soulshards ?? 0) < price
                const tone = RARITY_TONE[item.rarity]
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "relative flex items-center justify-between gap-3 rounded-md border-2 px-3 py-2.5",
                      TONE_CLASS[tone],
                      item.rarity === "mythic" && "holo-mythic",
                      owned && "opacity-50",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[8px] font-black uppercase tracking-[0.24em] opacity-80">
                          {RARITY_LABEL[item.rarity]}
                        </span>
                        {item.taint > 0 ? (
                          <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-destructive/80">
                            +{item.taint.toFixed(1)} mácula
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 truncate font-display text-sm font-black uppercase tracking-tight">
                        {item.name}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-[11px] italic leading-snug text-muted-foreground">
                        {item.flavor}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={owned || broke}
                      onClick={() => {
                        if (owned || broke) return
                        // Plays the coin-collect sample via haptic.purchase().
                        haptic.purchase()
                        onBuy(item.id, price, item)
                      }}
                      className={cn(
                        "flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-md border-2 px-3 py-2 font-mono transition active:scale-95",
                        owned
                          ? "border-border bg-card/60 text-muted-foreground cursor-not-allowed"
                          : broke
                            ? "border-border bg-card/60 text-muted-foreground/60 cursor-not-allowed"
                            : "border-gold bg-gold text-background hover:opacity-90",
                      )}
                    >
                      {owned ? (
                        <>
                          <Lock className="size-3" />
                          <span className="text-[8px] font-black tracking-[0.18em]">
                            VENDIDO
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="flex items-center gap-0.5 text-xs font-black tabular-nums">
                            <Gem className="size-3" />
                            {price}
                          </span>
                          <span className="text-[8px] font-black tracking-[0.18em]">
                            COMPRAR
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Dismantle list */}
          <section>
            <h2 className="mb-2 font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
              Desmontar do Inventário
            </h2>
            {dismantlables.length === 0 ? (
              <p className="rounded-md border-2 border-dashed border-border bg-card/40 px-3 py-4 text-center text-xs italic text-muted-foreground">
                Nada pra esfacelar. Itens equipados não podem ser desmontados.
              </p>
            ) : (
              <div className="space-y-1.5">
                {dismantlables.map((item) => {
                  const tone = RARITY_TONE[item.rarity]
                  const value = dismantleValue(item.rarity)
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        haptic.tap()
                        onDismantle(item.id)
                      }}
                      className={cn(
                        "relative flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left transition active:scale-[0.98]",
                        TONE_CLASS[tone],
                        item.rarity === "mythic" && "holo-mythic",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-xs font-black uppercase tracking-tight">
                          {item.name}
                        </p>
                        <span className="font-mono text-[8px] uppercase tracking-[0.22em] opacity-70">
                          {RARITY_LABEL[item.rarity]}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-1 rounded-sm border border-border bg-background/60 px-2 py-1 font-mono text-[10px] font-black tabular-nums">
                        <Gem className="size-3" />+{value}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </section>

          {/* Footer info */}
          <p className="border-t border-border/40 pt-3 text-center font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground/70">
            Estoque rotaciona toda madrugada UTC · Bryan não sabe que existimos
          </p>
        </div>
      </main>
    </div>
  )
}
