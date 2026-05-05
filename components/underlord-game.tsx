"use client"

import { useEffect, useReducer, useRef, useState } from "react"
import { TitleScreen } from "@/components/underlord/title"
import { IntroSequence } from "@/components/underlord/intro"
import { WarRoom } from "@/components/underlord/war-room"
import { Briefing } from "@/components/underlord/briefing"
import { BattleScreen } from "@/components/underlord/battle"
import { LootScreen } from "@/components/underlord/loot-screen"
import { SquadPicker } from "@/components/underlord/squad-picker"
import { Forge } from "@/components/underlord/forge"
import {
  AchievementToaster,
  fireAchievement,
} from "@/components/underlord/achievement-toast"
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
import { tickStreak, todayKey, shouldForceRare, xpProgress } from "@/lib/underlord/meta"
import type { Unit } from "@/lib/underlord/types"

let fallenNameCache: string[] = []

export function UnderlordGame() {
  const [state, dispatch] = useReducer(reduce, undefined as unknown as GameState, () =>
    freshGame(),
  )
  const [hydrated, setHydrated] = useState(false)
  const [hasSave, setHasSave] = useState(false)
  const [showSquadPicker, setShowSquadPicker] = useState(false)
  const [showForge, setShowForge] = useState(false)
  const [streakBonusToShow, setStreakBonusToShow] = useState<number | null>(null)
  const dailyCheckedToday = useRef<string>("")

  useEffect(() => {
    const saved = loadGame()
    setHasSave(saved !== null)
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    if (state.phase === "title") return
    persistGame(state)
  }, [state, hydrated])

  /* Daily check-in: fires once per day on entering warroom. */
  useEffect(() => {
    if (!hydrated) return
    if (state.phase !== "warroom") return
    const today = todayKey()
    if (state.save.lastPlayedDay === today) return
    if (dailyCheckedToday.current === today) return
    dailyCheckedToday.current = today
    const tick = tickStreak(state.save)
    dispatch({
      type: "daily-checkin",
      bonus: tick.bonus,
      streak: tick.streak,
      today: tick.lastDay,
    })
    if (tick.bonus > 0) setStreakBonusToShow(tick.bonus)
    // Achievement: streak unlocks
    if (tick.streak >= 7) fireAchievement("streak_7")
    else if (tick.streak >= 3) fireAchievement("streak_3")
  }, [hydrated, state.phase, state.save])

  /* Auto-dismiss streak banner. */
  useEffect(() => {
    if (streakBonusToShow == null) return
    const t = window.setTimeout(() => setStreakBonusToShow(null), 3500)
    return () => window.clearTimeout(t)
  }, [streakBonusToShow])

  if (!hydrated) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background">
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          DESPERTANDO…
        </span>
      </div>
    )
  }

  if (state.phase === "title") {
    return (
      <>
        <TitleScreen
          hasSave={hasSave}
          onStart={() => {
            dispatch({ type: "phase", phase: "intro" })
            dispatch({ type: "reset" })
            dispatch({ type: "phase", phase: "intro" })
            setHasSave(false)
          }}
          onContinue={() => {
            const saved = loadGame()
            if (saved) {
              dispatch({ type: "phase", phase: "warroom" })
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
        <AchievementToaster />
      </>
    )
  }

  if (state.phase === "intro") {
    return (
      <>
        <IntroSequence onDone={() => dispatch({ type: "phase", phase: "warroom" })} />
        <AchievementToaster />
      </>
    )
  }

  if (state.phase === "warroom") {
    return (
      <>
        <WarRoom
          save={state.save}
          onPickRegion={(rid) => dispatch({ type: "select-region", regionId: rid })}
          onOpenSquad={() => setShowSquadPicker(true)}
          onOpenForge={() => setShowForge(true)}
          streakBonus={streakBonusToShow}
        />
        {showSquadPicker ? (
          <SquadPicker
            save={state.save}
            onSetSquad={(ids) => dispatch({ type: "set-squad", squadIds: ids })}
            onClose={() => setShowSquadPicker(false)}
          />
        ) : null}
        {showForge ? (
          <Forge
            save={state.save}
            onSpend={(perkId) => dispatch({ type: "spend-perk", perkId })}
            onRespec={() => dispatch({ type: "respec" })}
            onClose={() => setShowForge(false)}
          />
        ) : null}
        <AchievementToaster />
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
      <>
        <Briefing
          region={region}
          save={state.save}
          onBack={() => dispatch({ type: "phase", phase: "warroom" })}
          onCommit={() => dispatch({ type: "phase", phase: "battle" })}
        />
        <AchievementToaster />
      </>
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
    const overlordLevel = xpProgress(state.save.xp).level
    return (
      <>
        <BattleScreen
          squad={squad}
          region={region}
          perks={state.save.perks}
          overlordLevel={overlordLevel}
          overlordName={state.save.underlordName}
          onComplete={(result) => {
            const goldEarned = result.victory ? region.goldReward : 0
            const forceRare = shouldForceRare(state.save) && result.victory
            // Only loot-bearing regions actually drop equipment. Other wins
            // still pay gold + XP, so true loot becomes a campaign milestone.
            const loot =
              result.victory && region.dropsLoot
                ? rollLoot(region.stage, 2, forceRare)
                : []
            const fallenIds = result.fallenIds
            fallenNameCache = fallenIds
              .map((id) => state.save.roster.find((u) => u.id === id)?.name)
              .filter((n): n is string => Boolean(n))
            dispatch({
              type: "apply-result",
              result: {
                victory: result.victory,
                fallenIds,
                killedHeroIds: result.killedHeroIds,
                comboHigh: result.comboHigh,
                flawless: result.flawless,
                critsLanded: result.critsLanded,
                firstBlood: result.firstBlood,
              },
              region,
              loot,
              goldEarned,
            })
            dispatch({ type: "phase", phase: "loot" })
          }}
        />
        <AchievementToaster />
      </>
    )
  }

  if (state.phase === "loot" && state.lastResult) {
    const fallenNames = fallenNameCache
    const result = state.lastResult
    const lootRegion = REGIONS.find((r) => r.id === result.regionId)
    return (
      <>
        <LootScreen
          victory={result.victory}
          goldEarned={result.goldEarned}
          xpEarned={result.xpEarned}
          levelsGained={result.levelsGained}
          perkPointsGained={result.perkPointsGained}
          comboMax={result.comboHigh}
          flawless={result.flawless}
          loot={result.loot}
          regionDropsLoot={lootRegion?.dropsLoot ?? false}
          unlockedArchetypes={result.unlockedArchetypes}
          fallenNames={fallenNames}
          killedHeroIds={result.killedHeroIds}
          onContinue={() => {
            // Fire achievement toasts on the way back to warroom
            for (const id of result.unlockedAchievements) {
              fireAchievement(id)
            }
            dispatch({ type: "phase", phase: "warroom" })
          }}
        />
        <AchievementToaster />
      </>
    )
  }

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
