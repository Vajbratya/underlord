"use client"

import { useEffect, useReducer, useState } from "react"
import { TitleScreen } from "@/components/underlord/title"
import { IntroSequence } from "@/components/underlord/intro"
import { WarRoom } from "@/components/underlord/war-room"
import { Briefing } from "@/components/underlord/briefing"
import { BattleScreen } from "@/components/underlord/battle"
import { LootScreen } from "@/components/underlord/loot-screen"
import { SquadPicker } from "@/components/underlord/squad-picker"
import {
  freshGame,
  loadGame,
  persistGame,
  reduce,
  wipeSave,
  type GameState,
} from "@/lib/underlord/state"
import { rollLoot } from "@/lib/underlord/loot"
import { REGIONS } from "@/lib/underlord/regions"
import type { Unit } from "@/lib/underlord/types"

// Module-level cache: names of fallen minions captured at battle end (before
// the reducer removes them from roster). Read once on the loot screen.
let fallenNameCache: string[] = []

export function UnderlordGame() {
  const [state, dispatch] = useReducer(reduce, undefined as unknown as GameState, () => freshGame())
  const [hydrated, setHydrated] = useState(false)
  const [hasSave, setHasSave] = useState(false)
  const [showSquadPicker, setShowSquadPicker] = useState(false)

  /* Hydrate from localStorage on mount */
  useEffect(() => {
    const saved = loadGame()
    setHasSave(saved !== null)
    setHydrated(true)
  }, [])

  /* Persist on save change */
  useEffect(() => {
    if (!hydrated) return
    if (state.phase === "title") return
    persistGame(state)
  }, [state, hydrated])

  if (!hydrated) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background">
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          DESPERTANDO…
        </span>
      </div>
    )
  }

  /* ---------- Phase routing ---------- */

  if (state.phase === "title") {
    return (
      <TitleScreen
        hasSave={hasSave}
        onStart={() => {
          // Fresh run
          const fresh = freshGame()
          dispatch({ type: "phase", phase: "intro" })
          // Replace state with fresh save by setting name (and resetting via reset action)
          dispatch({ type: "reset" })
          dispatch({ type: "phase", phase: "intro" })
          setHasSave(false)
        }}
        onContinue={() => {
          const saved = loadGame()
          if (saved) {
            // Apply saved state
            dispatch({ type: "phase", phase: "warroom" })
            // Force-load via custom path: dispatch a reset then mutate via set-name & equip is too hacky;
            // simpler: use window reload after writing via existing save (we already loaded above)
            // We'll handle by reloading state through a small trick — fire phase change + manual sync.
            // The cleaner pattern: use external loader on mount. We'll set save via repeated dispatches.
            // Since reducer doesn't expose set-save, we just reload:
            window.location.reload()
          } else {
            dispatch({ type: "phase", phase: "intro" })
          }
        }}
        onWipe={() => {
          if (confirm("Apagar save permanentemente? Os 14 séculos voltam.")) {
            wipeSave()
            setHasSave(false)
            dispatch({ type: "reset" })
          }
        }}
      />
    )
  }

  if (state.phase === "intro") {
    return <IntroSequence onDone={() => dispatch({ type: "phase", phase: "warroom" })} />
  }

  if (state.phase === "warroom") {
    return (
      <>
        <WarRoom
          save={state.save}
          onPickRegion={(rid) => dispatch({ type: "select-region", regionId: rid })}
          onOpenSquad={() => setShowSquadPicker(true)}
        />
        {showSquadPicker ? (
          <SquadPicker
            save={state.save}
            onSetSquad={(ids) => dispatch({ type: "set-squad", squadIds: ids })}
            onClose={() => setShowSquadPicker(false)}
          />
        ) : null}
      </>
    )
  }

  if (state.phase === "briefing" && state.pendingRegionId) {
    const region = REGIONS.find((r) => r.id === state.pendingRegionId)
    if (!region) {
      dispatch({ type: "phase", phase: "warroom" })
      return null
    }
    return (
      <Briefing
        region={region}
        save={state.save}
        onBack={() => dispatch({ type: "phase", phase: "warroom" })}
        onCommit={() => dispatch({ type: "phase", phase: "battle" })}
      />
    )
  }

  if (state.phase === "battle" && state.pendingRegionId) {
    const region = REGIONS.find((r) => r.id === state.pendingRegionId)
    if (!region) {
      dispatch({ type: "phase", phase: "warroom" })
      return null
    }
    const squad: Unit[] = state.save.squad
      .map((id) => state.save.roster.find((u) => u.id === id))
      .filter((u): u is NonNullable<typeof u> => Boolean(u))
    return (
      <BattleScreen
        squad={squad}
        region={region}
        onComplete={(result) => {
          const goldEarned = result.victory ? region.goldReward : 0
          const loot = result.victory ? rollLoot(region.stage, 2) : []
          const fallenIds = result.fallenIds
          // Capture names BEFORE reducer prunes roster
          fallenNameCache = fallenIds
            .map((id) => state.save.roster.find((u) => u.id === id)?.name)
            .filter((n): n is string => Boolean(n))
          // Apply
          dispatch({
            type: "apply-result",
            result: {
              victory: result.victory,
              goldEarned,
              loot,
              fallenIds,
              killedHeroIds: result.killedHeroIds,
              regionId: region.id,
            },
            region,
          })
          dispatch({ type: "phase", phase: "loot" })
        }}
      />
    )
  }

  if (state.phase === "loot" && state.lastResult) {
    const fallenNames = fallenNameCache
    return (
      <LootScreen
        victory={state.lastResult.victory}
        goldEarned={state.lastResult.goldEarned}
        loot={state.lastResult.loot}
        fallenNames={fallenNames}
        killedHeroIds={state.lastResult.killedHeroIds}
        onContinue={() => dispatch({ type: "phase", phase: "warroom" })}
      />
    )
  }

  // Fallback
  return (
    <div className="grid min-h-dvh place-items-center bg-background">
      <button
        type="button"
        onClick={() => dispatch({ type: "phase", phase: "warroom" })}
        className="rounded-md border-2 border-primary bg-primary px-6 py-3 font-display font-black uppercase tracking-[0.25em] text-primary-foreground"
      >
        Voltar à Sala de Guerra
      </button>
    </div>
  )
}
