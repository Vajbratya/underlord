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
import { SkillMap } from "@/components/underlord/skill-map"
import { BoonsPanel } from "@/components/underlord/boons-panel"
import { BlackMarket } from "@/components/underlord/black-market"
import { AscensionPanel } from "@/components/underlord/ascension-panel"
import { MerchantPanel } from "@/components/underlord/merchant-panel"
import { BountiesPanel } from "@/components/underlord/bounties-panel"
import { Tutorial } from "@/components/underlord/tutorial"
import {
  GauntletRewardScreen,
  GauntletEndScreen,
} from "@/components/underlord/gauntlet-screens"
import {
  synthFloor,
  gauntletAscension,
  rollRewards,
  gauntletPayout,
  type GauntletReward,
} from "@/lib/underlord/gauntlet"
import { weekKey } from "@/lib/underlord/bounties"
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
import { regionLootProfile, rollLootWeighted } from "@/lib/underlord/loot"
import { REGIONS } from "@/lib/underlord/regions"
import { tickStreak, todayKey, shouldForceRare, xpProgress } from "@/lib/underlord/meta"
import type { Region, Unit } from "@/lib/underlord/types"

let fallenNameCache: string[] = []

export function UnderlordGame() {
  const [state, dispatch] = useReducer(reduce, undefined as unknown as GameState, () =>
    freshGame(),
  )
  const [hydrated, setHydrated] = useState(false)
  const [hasSave, setHasSave] = useState(false)
  const [showSquadPicker, setShowSquadPicker] = useState(false)
  const [showForge, setShowForge] = useState(false)
  const [showSkillMap, setShowSkillMap] = useState(false)
  const [showBoons, setShowBoons] = useState(false)
  const [showMarket, setShowMarket] = useState(false)
  const [showAscension, setShowAscension] = useState(false)
  const [showMerchant, setShowMerchant] = useState(false)
  const [showBounties, setShowBounties] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [streakBonusToShow, setStreakBonusToShow] = useState<number | null>(null)
  const dailyCheckedToday = useRef<string>("")

  /* v13 — endless gauntlet ("O Poço") run state. Driven entirely by local
   * state so the reducer's phase machine stays untouched; battles reuse the
   * real BattleScreen with a synthesized floor + run-buffed squad copies. */
  type GauntletRun = {
    floor: number
    region: Region
    atkMult: number
    hpMult: number
    bankedShards: number
    stage: "battle" | "reward" | "end"
    rewardChoices: GauntletReward[]
    payout: { shards: number; xp: number }
    isRecord: boolean
  }
  const [gauntlet, setGauntlet] = useState<GauntletRun | null>(null)

  function startGauntlet() {
    setGauntlet({
      floor: 1,
      region: synthFloor(1),
      atkMult: 1,
      hpMult: 1,
      bankedShards: 0,
      stage: "battle",
      rewardChoices: [],
      payout: { shards: 0, xp: 0 },
      isRecord: false,
    })
  }

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

  /* v13 — keep Contratos + Mercante rotated to today on warroom entry, and
   * trigger the first-run tutorial once (gated by localStorage). */
  useEffect(() => {
    if (!hydrated || state.phase !== "warroom") return
    const day = todayKey()
    const wk = weekKey()
    const b = state.save.bounties
    if (!b || b.day !== day || b.week !== wk) {
      dispatch({ type: "refresh-bounties", day, week: wk })
    }
    if (!state.save.merchant || state.save.merchant.day !== day) {
      dispatch({ type: "refresh-merchant", day })
    }
    if (
      typeof window !== "undefined" &&
      !window.localStorage.getItem("underlord-tutorial-seen")
    ) {
      setShowTutorial(true)
      window.localStorage.setItem("underlord-tutorial-seen", "1")
    }
  }, [hydrated, state.phase, state.save.bounties, state.save.merchant])

  if (!hydrated) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background">
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          DESPERTANDO…
        </span>
      </div>
    )
  }

  /* v13 — O POÇO SEM FUNDO. Active run takes over the screen; on end it
   * clears back to the war room (reducer phase is untouched throughout). */
  if (gauntlet) {
    if (gauntlet.stage === "reward") {
      return (
        <>
          <GauntletRewardScreen
            floorCleared={gauntlet.floor}
            choices={gauntlet.rewardChoices}
            onPick={(r) =>
              setGauntlet((g) =>
                g
                  ? {
                      ...g,
                      atkMult: g.atkMult * (r.atkMult ?? 1),
                      hpMult: g.hpMult * (r.hpMult ?? 1),
                      bankedShards: g.bankedShards + (r.shards ?? 0),
                      floor: g.floor + 1,
                      region: synthFloor(g.floor + 1),
                      stage: "battle",
                      rewardChoices: [],
                    }
                  : g,
              )
            }
          />
          <AchievementToaster />
        </>
      )
    }
    if (gauntlet.stage === "end") {
      return (
        <>
          <GauntletEndScreen
            floorReached={gauntlet.floor}
            best={state.save.gauntletBest ?? 0}
            shards={gauntlet.payout.shards}
            xp={gauntlet.payout.xp}
            isRecord={gauntlet.isRecord}
            onClose={() => setGauntlet(null)}
          />
          <AchievementToaster />
        </>
      )
    }
    // stage === "battle"
    const g = gauntlet
    const baseSquad = state.save.squad
      .map((id) => state.save.roster.find((u) => u.id === id))
      .filter((u): u is NonNullable<typeof u> => Boolean(u))
    const buffed: Unit[] = baseSquad.map((u) => {
      const hpMax = Math.max(1, Math.round(u.hpMax * g.hpMult))
      return { ...u, hpMax, hp: hpMax, atk: Math.max(1, Math.round(u.atk * g.atkMult)) }
    })
    const overlordLevel = xpProgress(state.save.xp).level
    return (
      <>
        <BattleScreen
          key={`gauntlet-${g.floor}`}
          squad={buffed}
          region={g.region}
          perks={state.save.perks}
          overlordLevel={overlordLevel}
          overlordName={state.save.underlordName}
          equippedSkills={state.save.equippedSkills}
          boons={state.save.boons ?? []}
          ascension={gauntletAscension(g.floor)}
          curses={[]}
          onComplete={(result) => {
            if (result.victory) {
              setGauntlet((cur) =>
                cur ? { ...cur, stage: "reward", rewardChoices: rollRewards() } : cur,
              )
            } else {
              const payout = gauntletPayout(g.floor, g.bankedShards)
              const isRecord = g.floor > (state.save.gauntletBest ?? 0)
              dispatch({
                type: "gauntlet-end",
                floorReached: g.floor,
                shards: payout.shards,
                xp: payout.xp,
              })
              setGauntlet((cur) =>
                cur ? { ...cur, stage: "end", payout, isRecord } : cur,
              )
            }
          }}
        />
        <AchievementToaster />
      </>
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
            // Hydrate the actual saved tree into the reducer in a single
            // tick — no `window.location.reload()`. The old code reloaded
            // the page, which (a) caused a one-frame flicker of WarRoom
            // backed by an empty `freshGame()` state, and (b) bounced
            // straight back to Title because `useReducer`'s initializer
            // always runs `freshGame()` on mount and the persisted save
            // was never re-injected. `load-save` swaps the entire
            // GameState atomically and the next render is the real run.
            const saved = loadGame()
            if (saved) {
              dispatch({ type: "load-save", state: saved })
            } else {
              // Save disappeared (cleared between mount and click) — start
              // a fresh campaign rather than getting stuck on Title.
              setHasSave(false)
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
          onOpenSkillMap={() => setShowSkillMap(true)}
          onOpenBoons={() => setShowBoons(true)}
          onOpenMarket={() => setShowMarket(true)}
          onOpenAscension={() => setShowAscension(true)}
          onOpenMerchant={() => setShowMerchant(true)}
          onOpenBounties={() => setShowBounties(true)}
          onOpenGauntlet={startGauntlet}
          onOpenTutorial={() => setShowTutorial(true)}
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
        {showSkillMap ? (
          <SkillMap
            save={state.save}
            onSetLoadout={(skillIds) =>
              dispatch({ type: "set-skill-loadout", skillIds })
            }
            onClose={() => setShowSkillMap(false)}
          />
        ) : null}
        {showBoons ? (
          <BoonsPanel
            ownedBoons={state.save.boons ?? []}
            onClose={() => setShowBoons(false)}
          />
        ) : null}
        {showMarket ? (
          <BlackMarket
            save={state.save}
            onClaimDaily={() => dispatch({ type: "claim-shards" })}
            onBuy={(itemId, price, item) =>
              dispatch({ type: "bm-buy", itemId, price, item })
            }
            onDismantle={(lootId) =>
              dispatch({ type: "dismantle-loot", lootId })
            }
            onClose={() => setShowMarket(false)}
          />
        ) : null}
        {showAscension ? (
          <AscensionPanel
            save={state.save}
            onSet={(tier, curses) =>
              dispatch({ type: "set-ascension", tier, curses })
            }
            onClose={() => setShowAscension(false)}
          />
        ) : null}
        {showMerchant ? (
          <MerchantPanel
            save={state.save}
            onBuy={(itemId, price, item) =>
              dispatch({ type: "merchant-buy", itemId, price, item })
            }
            onReroll={(cost) => dispatch({ type: "merchant-reroll", cost })}
            onClose={() => setShowMerchant(false)}
          />
        ) : null}
        {showBounties ? (
          <BountiesPanel
            save={state.save}
            onClaim={(bountyId) => dispatch({ type: "claim-bounty", bountyId })}
            onClose={() => setShowBounties(false)}
          />
        ) : null}
        {showTutorial ? (
          <Tutorial onClose={() => setShowTutorial(false)} />
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
          equippedSkills={state.save.equippedSkills}
          boons={state.save.boons ?? []}
          ascension={state.save.ascension ?? 0}
          curses={state.save.curses ?? []}
          onComplete={(result) => {
            const goldEarned = result.victory ? region.goldReward : 0
            // Ascension guarantees a rare-or-better drop on every win, on
            // top of the normal pity timer.
            const forceRare =
              (shouldForceRare(state.save) || (state.save.ascension ?? 0) > 0) &&
              result.victory
            // v13 — loot chance PER AREA + grind. Each area has its own drop
            // chance (so wins don't always pay) and a biome/stage-weighted
            // rarity table. forceRare (pity/Ascension) bypasses the chance.
            const profile = regionLootProfile(region.biome, region.stage)
            const dropsThisTime =
              result.victory &&
              region.dropsLoot &&
              (forceRare || Math.random() < profile.chance)
            const loot = dropsThisTime
              ? rollLootWeighted(profile.weights, profile.count, forceRare)
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
          shardsEarned={result.shardsEarned}
          xpEarned={result.xpEarned}
          levelsGained={result.levelsGained}
          perkPointsGained={result.perkPointsGained}
          comboMax={result.comboHigh}
          flawless={result.flawless}
          loot={result.loot}
          regionDropsLoot={lootRegion?.dropsLoot ?? false}
          unlockedArchetypes={result.unlockedArchetypes}
          unlockedSkills={result.unlockedSkills}
          boonChoices={result.boonChoices}
          ownedBoons={state.save.boons ?? []}
          onPickBoon={(id) => dispatch({ type: "pick-boon", boonId: id })}
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
