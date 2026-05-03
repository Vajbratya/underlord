"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Eye,
  Heart,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
  Skull,
  RotateCcw,
  Flame,
  Droplet,
  ChevronRight,
  Cpu,
  Star,
  Lock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { sfx } from "@/lib/elementum-sounds"
import {
  POWER_UPS,
  POWER_UP_POOL,
  MOVES,
  MOVE_LIST,
  MAX_HP,
  BASE_DAMAGE,
  INVENTORY_LIMIT,
  RAGE_MAX,
  RAGE_GAIN_DAMAGE,
  RAGE_GAIN_DRAW,
  RAGE_GAIN_WIN,
  ULTIMATE_DAMAGE,
  SHOP_HEAL_SKIP,
  STAGE_HEAL_BONUS,
  ELEMENT_PROFILE,
  SHIELD_CAP,
  LOADOUT_SIZE,
  MAX_CARD_LEVEL,
  CHAIN_LENGTH,
  POSITION_MULT,
  POSITION_LABELS,
  PERFECT_CHAIN_BONUS,
  PERFECT_CHAIN_RAGE,
  COMBO_TIERS,
  getCombo,
  getTier,
  getNextTier,
  trophiesForStage,
  trophiesLossOnDefeat,
  shardsToNext,
  powerValue,
  type Move,
  type Result,
  type Phase,
  type PowerUpId,
  type PowerUp,
  type Tier,
} from "@/lib/elementum-types"
import { cpuPickChain, cpuRollsCrit, getCPUStats, type CPUStats } from "@/lib/elementum-cpu"
import { getHero, rand, UNDERLORD_LINES, type Hero } from "@/lib/elementum-flavor"
import {
  loadRecords,
  saveRecords,
  mergeRunIntoRecords,
  type Records,
  type CardLevels,
  type CardShards,
} from "@/lib/elementum-storage"

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

type Buffs = {
  shield: boolean
  crit: boolean
  spy: boolean
  lucky: boolean
  siphon: boolean
}

type FloatTone = "damage" | "heal" | "info" | "ultimate" | "crit"

type FloatingNumber = {
  id: number
  value: string
  side: "player" | "cpu"
  tone: FloatTone
}

type Toast = {
  id: number
  text: string
  tone: "good" | "bad" | "info" | "epic"
}

type Particle = {
  id: number
  side: "player" | "cpu"
  left: number
  tx: number
  delay: number
  color: "primary" | "accent" | "destructive"
}

type Banner = {
  id: number
  title: string
  sub: string
  tone: "primary" | "accent" | "destructive"
}

const EMPTY_BUFFS: Buffs = {
  shield: false,
  crit: false,
  spy: false,
  lucky: false,
  siphon: false,
}

function randomMove(): Move {
  return MOVE_LIST[Math.floor(Math.random() * 3)]
}

function rollPowerUp(): PowerUpId {
  return POWER_UP_POOL[Math.floor(Math.random() * POWER_UP_POOL.length)]
}

function rollShopOffer(): PowerUpId[] {
  const pool = [...POWER_UP_POOL]
  const out: PowerUpId[] = []
  for (let i = 0; i < 3; i++) {
    const idx = Math.floor(Math.random() * pool.length)
    out.push(pool[idx])
    pool.splice(idx, 1)
    if (pool.length === 0) pool.push(...POWER_UP_POOL)
  }
  return out
}

/** Roll 2-4 random shards. Each entry: which power-up gets +1 shard. */
function rollChestShards(stage: number): PowerUpId[] {
  const count = 2 + Math.min(2, Math.floor((stage - 1) / 3)) // 2 base, +1 every 3 stages, cap +2
  const out: PowerUpId[] = []
  for (let i = 0; i < count; i++) {
    out.push(POWER_UP_POOL[Math.floor(Math.random() * POWER_UP_POOL.length)])
  }
  return out
}

/**
 * Apply a list of shard drops to existing levels/shards.
 * Returns updated maps + which power-ups leveled up.
 */
function applyChestShards(
  shards: PowerUpId[],
  levels: CardLevels,
  shardCounts: CardShards,
): { levels: CardLevels; shards: CardShards; leveledUp: PowerUpId[]; gained: Record<PowerUpId, number> } {
  const newLevels: CardLevels = { ...levels }
  const newShards: CardShards = { ...shardCounts }
  const leveledUp: PowerUpId[] = []
  const gained = {} as Record<PowerUpId, number>

  for (const id of shards) {
    if (newLevels[id] >= MAX_CARD_LEVEL) continue // skip maxed
    newShards[id] = (newShards[id] ?? 0) + 1
    gained[id] = (gained[id] ?? 0) + 1
    const need = shardsToNext(newLevels[id])
    if (need !== null && newShards[id] >= need) {
      newLevels[id] = newLevels[id] + 1
      newShards[id] = 0
      if (!leveledUp.includes(id)) leveledUp.push(id)
    }
  }
  return { levels: newLevels, shards: newShards, leveledUp, gained }
}

function decide(player: Move, cpu: Move): Result {
  if (player === cpu) return "draw"
  return MOVES[player].beats === cpu ? "win" : "lose"
}

function haptic(pattern: number | number[]) {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return
  try {
    navigator.vibrate(pattern)
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------------------------ */
/* Main component                                                       */
/* ------------------------------------------------------------------ */

export function ElementumGame() {
  const [phase, setPhase] = useState<Phase>("menu")

  // Run stats
  const [stage, setStage] = useState(1)
  const [round, setRound] = useState(1)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [wins, setWins] = useState(0)
  const [losses, setLosses] = useState(0)
  const [draws, setDraws] = useState(0)
  const [damageDealt, setDamageDealt] = useState(0)
  const [powerUpsUsed, setPowerUpsUsed] = useState(0)

  // Battle state
  const [playerHP, setPlayerHP] = useState(MAX_HP)
  const [playerShield, setPlayerShield] = useState(0)
  const [cpuStats, setCpuStats] = useState<CPUStats>(() => getCPUStats(1))
  const [cpuHP, setCpuHP] = useState<number>(() => getCPUStats(1).hp)
  // CHAIN CAST core: each round both casters build a 3-spell chain
  const [playerChain, setPlayerChain] = useState<Move[]>([])
  const [cpuChain, setCpuChain] = useState<Move[]>([])
  const [chainResults, setChainResults] = useState<(Result | null)[]>([null, null, null])
  const [revealIndex, setRevealIndex] = useState<number>(-1) // -1 = not revealing
  const [history, setHistory] = useState<Move[]>([]) // flat history of every move
  const [chainHistory, setChainHistory] = useState<Move[][]>([]) // last few full chains for AI
  const [cpuHistory, setCpuHistory] = useState<Move[]>([]) // flat CPU history (HUD strip)

  // Power systems
  const [inventory, setInventory] = useState<PowerUpId[]>([])
  const [buffs, setBuffs] = useState<Buffs>(EMPTY_BUFFS)
  const [rage, setRage] = useState(0)
  const [spyPeek, setSpyPeek] = useState<Move[] | null>(null)
  const [shopOffers, setShopOffers] = useState<PowerUpId[]>([])

  // FX state
  const [floats, setFloats] = useState<FloatingNumber[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])
  const [particles, setParticles] = useState<Particle[]>([])
  const [banner, setBanner] = useState<Banner | null>(null)
  const [heroIntro, setHeroIntro] = useState<{ stage: number; hero: Hero } | null>(null)
  const [hpFlash, setHpFlash] = useState<"player" | "cpu" | null>(null)
  const [screenShake, setScreenShake] = useState(false)
  const [muted, setMuted] = useState(false)
  const [records, setRecords] = useState<Records>(() => loadRecords())

  // Per-stage chest reward summary (shown on shop screen)
  const [stageReward, setStageReward] = useState<{
    trophiesGained: number
    shards: PowerUpId[]
    leveledUp: PowerUpId[]
    gained: Partial<Record<PowerUpId, number>>
  } | null>(null)

  const idRef = useRef(0)
  const ultimateInProgress = useRef(false)
  const rageWasFull = useRef(false)

  // Load records on mount
  useEffect(() => {
    setRecords(loadRecords())
  }, [])

  /* ---------------- helpers tied to component ----------------------- */

  const play = useCallback(
    (sound: keyof typeof sfx, ...args: unknown[]) => {
      if (muted) return
      const fn = sfx[sound] as ((...a: unknown[]) => void) | undefined
      try {
        fn?.(...args)
      } catch {
        // never let audio crash gameplay
      }
    },
    [muted],
  )

  const pushFloat = useCallback((value: string, side: "player" | "cpu", tone: FloatTone) => {
    const id = ++idRef.current
    setFloats((f) => [...f, { id, value, side, tone }])
    setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 1400)
  }, [])

  const pushToast = useCallback((text: string, tone: Toast["tone"] = "info") => {
    const id = ++idRef.current
    setToasts((t) => [...t, { id, text, tone }])
    const ttl = tone === "epic" ? 2400 : 1900
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ttl)
  }, [])

  const flashHP = useCallback((side: "player" | "cpu") => {
    setHpFlash(side)
    setTimeout(() => setHpFlash(null), 500)
  }, [])

  const triggerScreenShake = useCallback(() => {
    setScreenShake(true)
    setTimeout(() => setScreenShake(false), 450)
  }, [])

  const burstParticles = useCallback(
    (
      side: "player" | "cpu",
      color: "primary" | "accent" | "destructive" = "primary",
      count = 12,
    ) => {
      const newOnes: Particle[] = Array.from({ length: count }, () => ({
        id: ++idRef.current,
        side,
        left: 30 + Math.random() * 40,
        tx: (Math.random() - 0.5) * 160,
        delay: Math.random() * 0.2,
        color,
      }))
      setParticles((p) => [...p, ...newOnes])
      setTimeout(() => {
        const ids = new Set(newOnes.map((n) => n.id))
        setParticles((p) => p.filter((x) => !ids.has(x.id)))
      }, 1800)
    },
    [],
  )

  const showBanner = useCallback((title: string, sub: string, tone: Banner["tone"] = "primary") => {
    const id = ++idRef.current
    setBanner({ id, title, sub, tone })
    setTimeout(() => {
      setBanner((b) => (b && b.id === id ? null : b))
    }, 1700)
  }, [])

  /* ---------------- rage handling ----------------------------------- */

  const addRage = useCallback(
    (amount: number) => {
      setRage((r) => {
        const next = Math.min(RAGE_MAX, r + amount)
        if (next >= RAGE_MAX && !rageWasFull.current) {
          rageWasFull.current = true
          setTimeout(() => {
            play("rageReady")
            haptic([20, 40, 20, 40])
            pushToast("ULTIMATE PRONTO!", "epic")
          }, 50)
        } else if (next < RAGE_MAX) {
          rageWasFull.current = false
        }
        return next
      })
    },
    [play, pushToast],
  )

  /* ---------------- run lifecycle ----------------------------------- */

  const startStage = useCallback(
    (stageNumber: number, options?: { keepHP?: boolean }) => {
      const stats = getCPUStats(stageNumber)
      setCpuStats(stats)
      setCpuHP(stats.hp)
      setPlayerChain([])
      setCpuChain([])
      setChainResults([null, null, null])
      setRevealIndex(-1)
      setHistory([])
      setChainHistory([])
      setCpuHistory([])
      setBuffs(EMPTY_BUFFS)
      setSpyPeek(null)
      if (!options?.keepHP) {
        setPlayerHP(MAX_HP)
        setPlayerShield(0)
      }
      setPhase("choosing")
      const hero = getHero(stageNumber)
      setHeroIntro({ stage: stageNumber, hero })
      // Auto-dismiss the cinematic intro after a beat
      window.setTimeout(() => setHeroIntro(null), stats.level === "boss" ? 3200 : 2400)
      if (stats.level === "boss") {
        play("bossIntro")
        haptic([30, 30, 30, 30, 80])
      } else {
        play("drop")
      }
    },
    [play],
  )

  const newRun = useCallback(() => {
    sfx.resume()
    setStage(1)
    setRound(1)
    setStreak(0)
    setBestStreak(0)
    setWins(0)
    setLosses(0)
    setDraws(0)
    setDamageDealt(0)
    setPowerUpsUsed(0)
    // Inventory is seeded from the loadout deck (Clash-style starting hand)
    const startingHand = (records.loadout ?? []).slice(0, INVENTORY_LIMIT)
    setInventory(startingHand)
    setRage(0)
    rageWasFull.current = false
    setPlayerHP(MAX_HP)
    setPlayerShield(0)
    setCpuHistory([])
    setChainHistory([])
    setStageReward(null)
    play("click")
    startStage(1)
  }, [play, startStage, records.loadout])

  const finishGame = useCallback(
    (won: boolean) => {
      ultimateInProgress.current = false
      setPhase("gameover")
      const stageReached = won ? stage + 1 : stage
      const merged = mergeRunIntoRecords(records, {
        stageReached,
        bestStreak,
        wins,
        damageDealt,
        powerUpsUsed,
      })
      // Trophy adjustment: defeat = loss, victory (last stage) handled when player clears next
      const trophyDelta = won ? 0 : -trophiesLossOnDefeat(stage)
      const newTrophies = Math.max(0, records.trophies + trophyDelta)
      const updated: Records = {
        ...merged,
        trophies: newTrophies,
        bestTrophies: Math.max(records.bestTrophies, newTrophies),
      }
      setRecords(updated)
      saveRecords(updated)
      if (!won && trophyDelta < 0) {
        pushToast(`${trophyDelta} TROFÉUS`, "bad")
      }
      setTimeout(() => (won ? play("victory") : play("defeat")), 200)
    },
    [bestStreak, damageDealt, play, powerUpsUsed, records, stage, wins, pushToast],
  )

  // Detect HP-zero -> stage clear or game over
  // Only fires after a chain fully resolves (phase back to "choosing")
  // so mid-cascade HP zeroing waits for the PERFECT CAST / DRENO tail.
  useEffect(() => {
    if (phase !== "choosing") return
    if (playerHP <= 0) {
      // game over
      setTimeout(() => finishGame(false), 200)
    } else if (cpuHP <= 0) {
      // stage cleared, open shop with chest reward
      setTimeout(() => {
        play("stageClear")
        haptic([30, 60, 30, 80])

        // Compute chest reward + trophies
        const trophiesGained = trophiesForStage(stage, getCombo(streak).level)
        const droppedShards = rollChestShards(stage)
        const { levels, shards: shardCounts, leveledUp, gained } = applyChestShards(
          droppedShards,
          records.cardLevels,
          records.cardShards,
        )

        const newTrophies = records.trophies + trophiesGained
        const updated: Records = {
          ...records,
          trophies: newTrophies,
          bestTrophies: Math.max(records.bestTrophies, newTrophies),
          cardLevels: levels,
          cardShards: shardCounts,
        }
        setRecords(updated)
        saveRecords(updated)
        setStageReward({ trophiesGained, shards: droppedShards, leveledUp, gained })

        // Tier promotion celebration
        const oldTier = getTier(records.trophies)
        const nextTier = getTier(newTrophies)
        if (nextTier.min > oldTier.min) {
          showBanner(`PROMOVIDO: ${nextTier.name}`, "Nova hierarquia desbloqueada.", "accent")
        } else {
          showBanner("STAGE LIMPO", `+${trophiesGained} troféus`, "accent")
        }

        setShopOffers(rollShopOffer())
        setPhase("shop")
      }, 600)
    }
  }, [playerHP, cpuHP, phase, finishGame, play, showBanner, stage, streak, records])

  /* ---------------- power-up usage ---------------------------------- */

  const dropPowerUpFromStreak = useCallback(() => {
    setInventory((inv) => {
      if (inv.length >= INVENTORY_LIMIT) {
        pushToast("Inventário cheio — bônus perdido!", "bad")
        return inv
      }
      const id = rollPowerUp()
      pushToast(`POWER-UP: ${POWER_UPS[id].name}!`, "good")
      play("drop")
      haptic(20)
      return [...inv, id]
    })
  }, [play, pushToast])

  const usePowerUp = useCallback(
    (idx: number) => {
      if (phase !== "choosing") return
      const id = inventory[idx]
      if (!id) return

      // Instant — values scale with card level
      if (id === "bomb") {
        const dmg = powerValue("bomb", records.cardLevels.bomb)
        setCpuHP((hp) => Math.max(0, hp - dmg))
        setDamageDealt((d) => d + dmg)
        pushFloat(`-${dmg}`, "cpu", "damage")
        flashHP("cpu")
        triggerScreenShake()
        burstParticles("cpu", "destructive", 10)
        play("bomb")
        haptic([20, 30, 60])
        pushToast(`METEORO -${dmg}!`, "good")
        setInventory((inv) => inv.filter((_, i) => i !== idx))
        setPowerUpsUsed((n) => n + 1)
        return
      }
      if (id === "heal") {
        const amount = powerValue("heal", records.cardLevels.heal)
        const before = playerHP
        const next = Math.min(MAX_HP, playerHP + amount)
        setPlayerHP(next)
        pushFloat(`+${next - before}`, "player", "heal")
        burstParticles("player", "primary", 8)
        play("heal")
        haptic(20)
        pushToast(`ELIXIR +${next - before}`, "good")
        setInventory((inv) => inv.filter((_, i) => i !== idx))
        setPowerUpsUsed((n) => n + 1)
        return
      }
      if (id === "rage") {
        const amount = powerValue("rage", records.cardLevels.rage)
        addRage(amount)
        pushFloat(`+${amount} FÚRIA`, "player", "ultimate")
        play("rageGain")
        haptic([10, 20, 10, 20])
        pushToast(`CÓLERA +${amount}`, "good")
        setInventory((inv) => inv.filter((_, i) => i !== idx))
        setPowerUpsUsed((n) => n + 1)
        return
      }

      // Buff power-ups
      if (id === "shield" && buffs.shield) {
        pushToast("Escudo já ativo.", "info")
        return
      }
      if (id === "crit" && buffs.crit) {
        pushToast("Crítico já armado.", "info")
        return
      }
      if (id === "lucky" && buffs.lucky) {
        pushToast("Sorte já ativa.", "info")
        return
      }
      if (id === "spy" && buffs.spy) {
        pushToast("Espião já em campo.", "info")
        return
      }
      if (id === "siphon" && buffs.siphon) {
        pushToast("Sifão já armado.", "info")
        return
      }

      if (id === "spy") {
        const peek = cpuPickChain(cpuStats.level, history, chainHistory)
        setSpyPeek(peek)
        setBuffs((b) => ({ ...b, spy: true }))
        play("powerup")
        haptic(15)
        pushToast(
          `VIDÊNCIA: ${peek.map((m) => MOVES[m].label).join(" → ")}`,
          "good",
        )
      } else if (id === "shield") {
        setBuffs((b) => ({ ...b, shield: true }))
        play("powerup")
        haptic(15)
        pushToast("ESCUDO ativado.", "good")
      } else if (id === "crit") {
        setBuffs((b) => ({ ...b, crit: true }))
        play("powerup")
        haptic(15)
        pushToast("CRÍTICO armado.", "good")
      } else if (id === "lucky") {
        setBuffs((b) => ({ ...b, lucky: true }))
        play("powerup")
        haptic(15)
        pushToast("SORTE ativada.", "good")
      } else if (id === "siphon") {
        setBuffs((b) => ({ ...b, siphon: true }))
        play("powerup")
        haptic(15)
        pushToast("SIFÃO armado.", "good")
      }

      setInventory((inv) => inv.filter((_, i) => i !== idx))
      setPowerUpsUsed((n) => n + 1)
    },
    [
      phase,
      inventory,
      buffs,
      playerHP,
      cpuStats,
      history,
      chainHistory,
      records.cardLevels,
      addRage,
      burstParticles,
      flashHP,
      play,
      pushFloat,
      pushToast,
      triggerScreenShake,
    ],
  )

  /* ---------------- core round resolution --------------------------- */

  /**
   * Resolves a 3-spell chain. Pre-computes all outcomes synchronously for the
   * given player + cpu chains, then schedules per-position cascade VFX.
   * Each position's WIN counts toward streak (so combo can ramp mid-chain).
   * All 3 wins = PERFECT CAST → bonus damage + bonus rage.
   */
  const runChain = useCallback(
    (pChain: Move[], cChain: Move[]) => {
      if (pChain.length !== CHAIN_LENGTH || cChain.length !== CHAIN_LENGTH) return

      setPlayerChain(pChain)
      setCpuChain(cChain)
      setChainResults([null, null, null])
      setPhase("shaking")
      play("click")
      haptic(12)

      // Quick shake telegraph
      let shakeCount = 0
      const shakeInterval = setInterval(() => {
        shakeCount++
        play("shake")
        if (shakeCount >= 2) clearInterval(shakeInterval)
      }, 220)

      window.setTimeout(() => {
        clearInterval(shakeInterval)
        play("reveal")
        setPhase("reveal")

        // Capture per-chain buffs (consumed at end)
        const luckyOn = buffs.lucky
        const surtoOn = buffs.crit
        const barrierOn = buffs.shield
        const siphonOn = buffs.siphon
        const surtoMult = surtoOn ? powerValue("crit", records.cardLevels.crit) : 1

        // Pre-compute per-position outcomes + damages (uses local running streak)
        let runStreak = streak
        let perfect = true
        let totalDealt = 0
        type Slot = {
          outcome: Result
          dmgDealt: number
          dmgTakenRaw: number
          isCpuCrit: boolean
          shieldOnDraw: number
          rageOnFlow: number
          recoilOnLose: number
          comboLabel: string
          comboLevel: number
          comboLevelUp: boolean
          luckyConsumed: boolean
        }
        const slots: Slot[] = []
        for (let i = 0; i < CHAIN_LENGTH; i++) {
          const pmove = pChain[i]
          const cmove = cChain[i]
          const pProfile = ELEMENT_PROFILE[pmove]
          const cProfile = ELEMENT_PROFILE[cmove]

          const raw = decide(pmove, cmove)
          const luckyConsumed = raw === "draw" && luckyOn
          const outcome: Result = luckyConsumed ? "win" : raw

          if (outcome === "win") {
            const oldCombo = getCombo(runStreak)
            const newStreak = runStreak + 1
            const newCombo = getCombo(newStreak)
            const elementBase = pProfile.baseDamage
            const dmg = Math.max(
              1,
              Math.round(elementBase * newCombo.mult * POSITION_MULT[i] * surtoMult),
            )
            runStreak = newStreak
            totalDealt += dmg
            slots.push({
              outcome,
              dmgDealt: dmg,
              dmgTakenRaw: 0,
              isCpuCrit: false,
              shieldOnDraw: 0,
              rageOnFlow: pProfile.onWinFlowRage ?? 0,
              recoilOnLose: 0,
              comboLabel: newCombo.label,
              comboLevel: newCombo.level,
              comboLevelUp: newCombo.level > oldCombo.level,
              luckyConsumed,
            })
          } else if (outcome === "lose") {
            perfect = false
            runStreak = 0
            const isCpuCrit = cpuRollsCrit(cpuStats)
            const baseDmg = isCpuCrit ? cProfile.baseDamage * 2 : cProfile.baseDamage
            const dmg = Math.max(1, Math.round(baseDmg * POSITION_MULT[i]))
            slots.push({
              outcome,
              dmgDealt: 0,
              dmgTakenRaw: dmg,
              isCpuCrit,
              shieldOnDraw: 0,
              rageOnFlow: 0,
              recoilOnLose: pProfile.onLoseRecoil ?? 0,
              comboLabel: "",
              comboLevel: 0,
              comboLevelUp: false,
              luckyConsumed: false,
            })
          } else {
            perfect = false
            slots.push({
              outcome,
              dmgDealt: 0,
              dmgTakenRaw: 0,
              isCpuCrit: false,
              shieldOnDraw: pProfile.onDrawShield ?? 0,
              rageOnFlow: 0,
              recoilOnLose: 0,
              comboLabel: "",
              comboLevel: 0,
              comboLevelUp: false,
              luckyConsumed: false,
            })
          }
        }

        // Mutable BARREIRA flag — absorbs FIRST damage taken in this chain
        let barrierLeft = barrierOn

        // Track move history (input for future CPU AI)
        setHistory((h) => [...h, ...pChain].slice(-18))
        setChainHistory((h) => [...h, pChain].slice(-6))
        setCpuHistory((h) => [...h, ...cChain].slice(-12))

        // Schedule cascade — each slot resolves with stagger
        const POS_DELAY = 620
        slots.forEach((slot, i) => {
          window.setTimeout(() => {
            setRevealIndex(i)
            setChainResults((r) => {
              const n = [...r]
              n[i] = slot.outcome
              return n
            })

            if (slot.outcome === "win") {
              setCpuHP((hp) => Math.max(0, hp - slot.dmgDealt))
              setDamageDealt((d) => d + slot.dmgDealt)
              const labelParts = [`-${slot.dmgDealt}`]
              if (surtoOn) labelParts.push("SURTO")
              else if (slot.comboLevel >= 2) labelParts.push(slot.comboLabel)
              pushFloat(
                labelParts.join(" "),
                "cpu",
                surtoOn ? "crit" : slot.comboLevel >= 3 ? "ultimate" : "damage",
              )
              flashHP("cpu")
              burstParticles("cpu", surtoOn ? "destructive" : "primary", 8)
              play("win")
              haptic(20)

              if (slot.comboLevelUp) {
                play("combo", slot.comboLevel)
                haptic([20, 30, 60])
                const tier = COMBO_TIERS.find((t) => t.level === slot.comboLevel)
                if (tier?.word) pushToast(`${tier.word}!  ${tier.label}`, "epic")
              }

              // FLUXO: HYDRO win → bonus rage
              if (slot.rageOnFlow > 0) {
                addRage(slot.rageOnFlow)
                pushFloat(`FLUXO +${slot.rageOnFlow}`, "player", "info")
              }

              setWins((w) => w + 1)
              setStreak((s) => {
                const next = s + 1
                setBestStreak((b) => Math.max(b, next))
                if (next % 4 === 0 && next >= 4) {
                  window.setTimeout(() => dropPowerUpFromStreak(), 250)
                }
                return next
              })
              addRage(RAGE_GAIN_WIN)
            } else if (slot.outcome === "lose") {
              if (barrierLeft) {
                barrierLeft = false
                pushFloat("BARREIRA", "player", "info")
                burstParticles("player", "accent", 8)
                play("powerup")
                haptic([15, 25, 15])
                pushToast("BARREIRA repele o feitiço!", "good")
              } else {
                let incoming = slot.dmgTakenRaw
                setPlayerShield((s) => {
                  if (s <= 0) return s
                  const absorbed = Math.min(s, incoming)
                  incoming -= absorbed
                  if (absorbed > 0) pushFloat(`ESCUDO -${absorbed}`, "player", "info")
                  return s - absorbed
                })
                if (incoming > 0) {
                  setPlayerHP((hp) => Math.max(0, hp - incoming))
                  pushFloat(
                    `-${incoming}${slot.isCpuCrit ? " CRIT!" : ""}`,
                    "player",
                    slot.isCpuCrit ? "crit" : "damage",
                  )
                  flashHP("player")
                  if (slot.isCpuCrit) triggerScreenShake()
                  play("damage")
                  haptic(slot.isCpuCrit ? [40, 60, 80] : 30)
                  addRage(RAGE_GAIN_DAMAGE + (slot.isCpuCrit ? 12 : 0))
                  if (slot.isCpuCrit) pushToast("FEITIÇO CRÍTICO!", "bad")
                } else {
                  play("powerup")
                  haptic([10, 20])
                }

                // RECUO: PYRO loss recoil
                if (slot.recoilOnLose > 0) {
                  setPlayerHP((hp) => Math.max(0, hp - slot.recoilOnLose))
                  pushFloat(`RECUO -${slot.recoilOnLose}`, "player", "damage")
                  flashHP("player")
                  play("damage")
                  haptic([20, 40])
                  addRage(RAGE_GAIN_DRAW)
                }
              }
              setLosses((l) => l + 1)
              setStreak(0)
            } else {
              // draw
              play("draw")
              haptic(10)
              setDraws((d) => d + 1)
              addRage(RAGE_GAIN_DRAW)
              if (slot.shieldOnDraw > 0) {
                setPlayerShield((s) => Math.min(SHIELD_CAP, s + slot.shieldOnDraw))
                pushFloat(`RAÍZ +${slot.shieldOnDraw}`, "player", "info")
                burstParticles("player", "accent", 5)
              }
            }
          }, i * POS_DELAY)
        })

        // After all positions: PERFECT bonus + DRENO + buff cleanup + reset
        const tailDelay = CHAIN_LENGTH * POS_DELAY + 200
        window.setTimeout(() => {
          let finalDealt = totalDealt
          if (perfect) {
            setCpuHP((hp) => Math.max(0, hp - PERFECT_CHAIN_BONUS))
            setDamageDealt((d) => d + PERFECT_CHAIN_BONUS)
            finalDealt += PERFECT_CHAIN_BONUS
            pushFloat(`PERFECT CAST -${PERFECT_CHAIN_BONUS}`, "cpu", "ultimate")
            flashHP("cpu")
            triggerScreenShake()
            burstParticles("cpu", "destructive", 18)
            play("ultimate")
            haptic([60, 80, 60, 80, 200])
            addRage(PERFECT_CHAIN_RAGE)
            pushToast("PERFECT CAST!", "epic")
          }

          // DRENO siphon: lifesteal % of total chain damage
          if (siphonOn && finalDealt > 0) {
            const pct = powerValue("siphon", records.cardLevels.siphon) / 100
            const heal = Math.round(finalDealt * pct)
            if (heal > 0) {
              setPlayerHP((hp) => Math.min(MAX_HP, hp + heal))
              pushFloat(`+${heal}`, "player", "heal")
              burstParticles("player", "primary", 6)
              play("heal")
              pushToast(`DRENO +${heal}`, "good")
            }
          }

          // Consume buffs spent this chain
          if (luckyOn || surtoOn || barrierOn || siphonOn || buffs.spy) {
            setBuffs((b) => ({
              ...b,
              lucky: luckyOn ? false : b.lucky,
              crit: surtoOn ? false : b.crit,
              shield: barrierOn ? false : b.shield,
              siphon: siphonOn ? false : b.siphon,
              spy: false,
            }))
          }
          if (buffs.spy) setSpyPeek(null)

          setRound((r) => r + 1)

          window.setTimeout(() => {
            setRevealIndex(-1)
            ultimateInProgress.current = false
            setPlayerChain([])
            setCpuChain([])
            setChainResults([null, null, null])
            setPhase((p) => (p === "gameover" || p === "shop" ? p : "choosing"))
          }, 900)
        }, tailDelay)
      }, 600)
    },
    [
      addRage,
      buffs,
      burstParticles,
      cpuStats,
      dropPowerUpFromStreak,
      flashHP,
      play,
      pushFloat,
      pushToast,
      records.cardLevels,
      streak,
      triggerScreenShake,
    ],
  )

  /* ---------------- chain build callbacks --------------------------- */

  const addToChain = useCallback(
    (m: Move) => {
      if (phase !== "choosing") return
      setPlayerChain((c) => {
        if (c.length >= CHAIN_LENGTH) return c
        return [...c, m]
      })
      play("click")
      haptic(6)
    },
    [phase, play],
  )

  const undoChain = useCallback(() => {
    if (phase !== "choosing") return
    setPlayerChain((c) => {
      if (c.length === 0) return c
      return c.slice(0, -1)
    })
    play("click")
    haptic(4)
  }, [phase, play])

  const commitChain = useCallback(() => {
    if (phase !== "choosing") return
    if (playerChain.length !== CHAIN_LENGTH) return
    const cpu = buffs.spy && spyPeek ? spyPeek : cpuPickChain(cpuStats.level, history, chainHistory)
    runChain(playerChain, cpu)
  }, [phase, playerChain, buffs.spy, spyPeek, cpuStats, history, chainHistory, runChain])

  const triggerUltimate = useCallback(() => {
    if (phase !== "choosing") return
    if (rage < RAGE_MAX) return
    if (ultimateInProgress.current) return
    ultimateInProgress.current = true
    pushToast("ULTIMATE!", "epic")
    setRage(0)
    rageWasFull.current = false

    // Big single-hit burst — ignores chain
    setCpuHP((hp) => Math.max(0, hp - ULTIMATE_DAMAGE))
    setDamageDealt((d) => d + ULTIMATE_DAMAGE)
    pushFloat(`-${ULTIMATE_DAMAGE} ULT`, "cpu", "ultimate")
    flashHP("cpu")
    triggerScreenShake()
    burstParticles("cpu", "destructive", 22)
    play("ultimate")
    haptic([60, 80, 60, 80, 200])

    window.setTimeout(() => {
      ultimateInProgress.current = false
    }, 1200)
  }, [
    phase,
    rage,
    pushToast,
    pushFloat,
    flashHP,
    triggerScreenShake,
    burstParticles,
    play,
  ])

  /* ---------------- shop -------------------------------------------- */

  const buyShop = useCallback(
    (id: PowerUpId) => {
      setInventory((inv) => {
        if (inv.length >= INVENTORY_LIMIT) {
          // overwrite first slot
          const next = [...inv]
          next.shift()
          next.push(id)
          return next
        }
        return [...inv, id]
      })
      play("shopBuy")
      haptic(25)
      pushToast(`${POWER_UPS[id].name} adquirido.`, "good")
      setShopOffers([])
      // Heal a bit and advance
      setPlayerHP((hp) => Math.min(MAX_HP, hp + STAGE_HEAL_BONUS))
      const nextStage = stage + 1
      setStage(nextStage)
      setRound(1)
      setTimeout(() => startStage(nextStage, { keepHP: true }), 250)
    },
    [play, pushToast, stage, startStage],
  )

  const skipShop = useCallback(() => {
    play("shopBuy")
    haptic(15)
    setPlayerHP((hp) => Math.min(MAX_HP, hp + SHOP_HEAL_SKIP + STAGE_HEAL_BONUS))
    pushToast(`Recuperou ${SHOP_HEAL_SKIP + STAGE_HEAL_BONUS} HP.`, "good")
    setShopOffers([])
    const nextStage = stage + 1
    setStage(nextStage)
    setRound(1)
    setTimeout(() => startStage(nextStage, { keepHP: true }), 250)
  }, [play, pushToast, stage, startStage])

  /* ---------------- meta progression mutations ---------------------- */

  const setLoadout = useCallback(
    (loadout: PowerUpId[]) => {
      const cleaned = loadout.filter((id) => POWER_UP_POOL.includes(id)).slice(0, LOADOUT_SIZE)
      if (cleaned.length === 0) return
      const updated: Records = { ...records, loadout: cleaned }
      setRecords(updated)
      saveRecords(updated)
      play("click")
    },
    [records, play],
  )

  /* ---------------- derived ----------------------------------------- */

  const playerWonGame = phase === "gameover" && playerHP > 0
  const combo = useMemo(() => getCombo(streak), [streak])
  const ultimateReady = rage >= RAGE_MAX && phase === "choosing"

  /* ---------------- render ------------------------------------------ */

  return (
    <div className={cn("relative flex min-h-dvh flex-col", screenShake && "screen-shake")}>
      {/* Scanline */}
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden opacity-[0.04] mix-blend-screen">
        <div className="absolute inset-x-0 h-px bg-primary" style={{ animation: "scanline 6s linear infinite" }} />
      </div>

      {/* Top bar */}
      <Header muted={muted} onToggleMute={() => setMuted((m) => !m)} stage={stage} bestStage={records.bestStage} phase={phase} />

      <main
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-3 pt-2 sm:px-4 sm:pt-4"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        {phase === "menu" ? (
          <MenuScreen onStart={newRun} records={records} onSetLoadout={setLoadout} />
        ) : phase === "shop" ? (
          <ShopScreen
            offers={shopOffers}
            stage={stage}
            playerHP={playerHP}
            inventory={inventory}
            onBuy={buyShop}
            onSkip={skipShop}
            reward={stageReward}
            trophies={records.trophies}
          />
        ) : phase === "gameover" ? (
          <GameOverScreen
            won={playerWonGame}
            stats={{
              wins,
              losses,
              draws,
              bestStreak,
              stageReached: playerWonGame ? stage + 1 : stage,
              damageDealt,
              powerUpsUsed,
            }}
            records={records}
            killerHero={cpuStats.heroId}
            onRestart={newRun}
          />
        ) : (
        <ArenaScreen
          phase={phase}
          playerHP={playerHP}
          playerShield={playerShield}
          cpuHP={cpuHP}
          cpuStats={cpuStats}
          cpuHistory={cpuHistory}
          playerChain={playerChain}
          cpuChain={cpuChain}
          chainResults={chainResults}
          revealIndex={revealIndex}
          round={round}
          streak={streak}
          combo={combo}
          rage={rage}
          inventory={inventory}
          buffs={buffs}
          spyPeek={spyPeek}
          hpFlash={hpFlash}
          floats={floats}
          particles={particles}
          ultimateReady={ultimateReady}
          onAddToChain={addToChain}
          onUndoChain={undoChain}
          onCommitChain={commitChain}
          onUsePowerUp={usePowerUp}
          onUltimate={triggerUltimate}
          />
        )}
      </main>

      {/* Banner overlay */}
      {banner ? <BannerOverlay banner={banner} key={banner.id} /> : null}

      {/* Hero intro overlay — cinematic name drop for each stage */}
      {heroIntro ? (
        <HeroIntroOverlay
          stage={heroIntro.stage}
          hero={heroIntro.hero}
          isBoss={cpuStats.level === "boss"}
          onDismiss={() => setHeroIntro(null)}
          key={`hero-${heroIntro.stage}`}
        />
      ) : null}

      {/* Toasts */}
      <div
        className="pointer-events-none fixed inset-x-0 z-40 flex flex-col items-center gap-1.5 px-4 sm:top-20"
        style={{ top: "calc(max(0.5rem, env(safe-area-inset-top)) + 3rem)" }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-none max-w-[92vw] rounded-md border px-2.5 py-1 text-center font-mono text-[10px] font-bold tracking-wider shadow-lg backdrop-blur sm:px-3 sm:py-1.5 sm:text-xs",
              "slam-in",
              t.tone === "good" && "border-primary/60 bg-primary/15 text-primary",
              t.tone === "bad" && "border-destructive/60 bg-destructive/15 text-destructive",
              t.tone === "info" && "border-border bg-card/80 text-foreground",
              t.tone === "epic" && "border-accent/70 bg-accent/20 text-accent",
            )}
          >
            {t.text}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Header                                                               */
/* ------------------------------------------------------------------ */

function Header({
  muted,
  onToggleMute,
  stage,
  bestStage,
  phase,
}: {
  muted: boolean
  onToggleMute: () => void
  stage: number
  bestStage: number
  phase: Phase
}) {
  const inMatch = phase !== "menu" && phase !== "gameover"
  return (
    <header
      className="mx-auto flex w-full max-w-3xl items-center justify-between gap-2 px-3 pt-2 sm:px-4 sm:pt-3"
      style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
    >
      <div className="flex min-w-0 items-center gap-2">
        <div className="grid size-8 shrink-0 place-items-center rounded-md bg-primary/15 text-primary ring-1 ring-primary/30 sm:size-9">
          <Swords className="size-4" />
        </div>
        <div className="flex min-w-0 items-baseline gap-2 leading-tight">
          <h1 className="truncate font-mono text-sm font-bold tracking-[0.18em] text-primary sm:text-base">
            ELEMENTUM
          </h1>
          {inMatch ? (
            <span className="rounded-sm border border-border bg-card/80 px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-wider text-foreground/80 sm:text-[10px]">
              STAGE {stage}
            </span>
          ) : null}
          {bestStage > 0 ? (
            <span className="hidden font-mono text-[10px] tracking-wider text-accent sm:inline">
              Best {bestStage}
            </span>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={onToggleMute}
        className="grid size-9 shrink-0 place-items-center rounded-md border border-border bg-card text-muted-foreground transition active:scale-95 hover:text-foreground sm:size-10"
        aria-label={muted ? "Ativar som" : "Desativar som"}
        aria-pressed={muted}
      >
        {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
      </button>
    </header>
  )
}

/* ------------------------------------------------------------------ */
/* Menu                                                                 */
/* ------------------------------------------------------------------ */

function MenuScreen({
  onStart,
  records,
  onSetLoadout,
}: {
  onStart: () => void
  records: Records
  onSetLoadout: (loadout: PowerUpId[]) => void
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const tier = getTier(records.trophies)
  const nextTier = getNextTier(records.trophies)

  return (
    <section className="flex flex-1 flex-col items-center pt-3 sm:pt-5">
      {/* Hero */}
      <div className="relative">
        <div className="absolute inset-0 -z-10 blur-3xl">
          <div className="mx-auto h-28 w-72 rounded-full bg-primary/25 sm:h-36 sm:w-80" />
        </div>
        <h2 className="text-center font-mono text-3xl font-black leading-none tracking-tighter text-balance sm:text-6xl">
          <span className="text-destructive">PYRO</span>
          <span className="text-foreground">.</span>
          <span className="text-primary">HYDRO</span>
          <span className="text-foreground">.</span>
          <span className="text-accent">TERRA</span>
        </h2>
      </div>

      {/* Trophy + Tier badge */}
      <TrophyTierBadge
        trophies={records.trophies}
        bestTrophies={records.bestTrophies}
        tier={tier}
        nextTier={nextTier}
      />

      {/* Loadout */}
      <LoadoutStrip
        loadout={records.loadout}
        levels={records.cardLevels}
        onEdit={() => setPickerOpen(true)}
      />

      {/* Start */}
      <button
        type="button"
        onClick={onStart}
        className="pulse-glow group mt-6 inline-flex items-center gap-3 rounded-md bg-primary px-10 py-4 font-mono text-base font-black tracking-[0.22em] text-primary-foreground shadow-[0_0_30px_oklch(0.78_0.17_205/0.4)] transition active:scale-95 hover:scale-[1.02] sm:text-lg"
      >
        <Swords className="size-5 transition group-hover:rotate-12" />
        ENTRAR NA TORRE
      </button>

      {records.totalRuns > 0 ? (
        <div className="mt-6 grid w-full max-w-md grid-cols-3 gap-2 text-center">
          <RecordChip label="BEST STAGE" value={records.bestStage} accent />
          <RecordChip label="BEST STREAK" value={records.bestStreak} />
          <RecordChip label="VITÓRIAS" value={records.totalWins} />
        </div>
      ) : null}

      <ElementBriefing />

      {/* Card collection — shows level + shard progress for all 8 power-ups */}
      <CardCollection levels={records.cardLevels} shards={records.cardShards} />

      {pickerOpen ? (
        <LoadoutPickerSheet
          current={records.loadout}
          levels={records.cardLevels}
          shards={records.cardShards}
          onClose={() => setPickerOpen(false)}
          onSave={(next) => {
            onSetLoadout(next)
            setPickerOpen(false)
          }}
        />
      ) : null}
    </section>
  )
}

function TrophyTierBadge({
  trophies,
  bestTrophies,
  tier,
  nextTier,
}: {
  trophies: number
  bestTrophies: number
  tier: Tier
  nextTier: Tier | null
}) {
  const span = nextTier ? nextTier.min - tier.min : 1
  const progressed = nextTier ? trophies - tier.min : span
  const pct = nextTier ? Math.max(0, Math.min(100, (progressed / span) * 100)) : 100
  return (
    <div className={cn("mt-5 w-full max-w-md rounded-lg border-2 px-4 py-3 backdrop-blur sm:px-5 sm:py-4", tier.ring)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Trophy className={cn("size-5 sm:size-6", tier.text)} />
          <div className="flex flex-col">
            <span className={cn("font-mono text-sm font-black tracking-[0.2em] sm:text-base", tier.text)}>
              {tier.name}
            </span>
            {bestTrophies > trophies ? (
              <span className="font-mono text-[9px] tracking-wider text-muted-foreground sm:text-[10px]">
                RECORDE {bestTrophies}
              </span>
            ) : null}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-2xl font-black tabular-nums text-foreground sm:text-3xl">
            {trophies}
          </div>
          {nextTier ? (
            <div className="font-mono text-[9px] tracking-wider text-muted-foreground sm:text-[10px]">
              {nextTier.min - trophies} → {nextTier.name}
            </div>
          ) : (
            <div className="font-mono text-[9px] tracking-wider text-destructive sm:text-[10px]">
              MAX TIER
            </div>
          )}
        </div>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            "h-full transition-[width] duration-500 ease-out",
            tier.name === "BRONZE"
              ? "bg-amber-600"
              : tier.name === "PRATA"
                ? "bg-zinc-300"
                : tier.name === "OURO"
                  ? "bg-accent"
                  : tier.name === "DIAMANTE"
                    ? "bg-primary"
                    : "bg-destructive",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function LoadoutStrip({
  loadout,
  levels,
  onEdit,
}: {
  loadout: PowerUpId[]
  levels: CardLevels
  onEdit: () => void
}) {
  const slots: (PowerUpId | null)[] = Array.from(
    { length: LOADOUT_SIZE },
    (_, i) => loadout[i] ?? null,
  )
  return (
    <div className="mt-4 w-full max-w-md">
      <div className="mb-1.5 flex items-center justify-between">
        <p className="font-mono text-[10px] font-bold tracking-[0.3em] text-muted-foreground sm:text-xs">
          DECK
        </p>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 rounded-sm border border-border bg-card px-2 py-0.5 font-mono text-[9px] font-bold tracking-wider text-muted-foreground transition hover:border-primary hover:text-primary active:scale-95 sm:text-[10px]"
        >
          EDITAR
          <ChevronRight className="size-2.5" />
        </button>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="grid w-full grid-cols-3 gap-2 rounded-md border border-border bg-card/60 p-2 backdrop-blur transition hover:border-primary/50 active:scale-[0.99]"
        aria-label="Editar deck de feitiços"
      >
        {slots.map((id, i) =>
          id ? (
            <LoadoutCard key={i} id={id} level={levels[id] ?? 1} />
          ) : (
            <div
              key={i}
              className="flex aspect-[3/4] items-center justify-center rounded-sm border border-dashed border-border/60 bg-secondary/40 text-muted-foreground"
            >
              <Lock className="size-4 opacity-50" />
            </div>
          ),
        )}
      </button>
    </div>
  )
}

function LoadoutCard({ id, level }: { id: PowerUpId; level: number }) {
  const p = POWER_UPS[id]
  const Icon = p.Icon
  const tone =
    p.color === "primary"
      ? "border-primary/40 bg-primary/10 text-primary"
      : p.color === "accent"
        ? "border-accent/40 bg-accent/10 text-accent"
        : "border-destructive/40 bg-destructive/10 text-destructive"
  return (
    <div
      className={cn(
        "relative flex aspect-[3/4] flex-col items-center justify-center gap-1 overflow-hidden rounded-sm border-2",
        tone,
      )}
    >
      <Icon className="size-5 sm:size-6" />
      <span className="font-mono text-[9px] font-black tracking-wider sm:text-[10px]">{p.name}</span>
      <span className="absolute right-1 top-1 rounded-sm border border-current bg-background/80 px-1 font-mono text-[8px] font-black leading-none tabular-nums sm:text-[9px]">
        L{level}
      </span>
    </div>
  )
}

function CardCollection({ levels, shards }: { levels: CardLevels; shards: CardShards }) {
  return (
    <div className="mt-8 w-full max-w-3xl">
      <p className="mb-2 font-mono text-[10px] font-bold tracking-[0.3em] text-muted-foreground sm:text-xs">
        COLEÇÃO DE FEITIÇOS
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5">
        {POWER_UP_POOL.map((id) => (
          <CollectionCard
            key={id}
            id={id}
            level={levels[id] ?? 1}
            shards={shards[id] ?? 0}
          />
        ))}
      </div>
    </div>
  )
}

function CollectionCard({ id, level, shards }: { id: PowerUpId; level: number; shards: number }) {
  const p = POWER_UPS[id]
  const Icon = p.Icon
  const need = shardsToNext(level)
  const pct = need ? Math.min(100, (shards / need) * 100) : 100
  const maxed = need === null
  const tone =
    p.color === "primary"
      ? "text-primary border-primary/40 bg-primary/5"
      : p.color === "accent"
        ? "text-accent border-accent/40 bg-accent/5"
        : "text-destructive border-destructive/40 bg-destructive/5"
  const fillTone =
    p.color === "primary" ? "bg-primary" : p.color === "accent" ? "bg-accent" : "bg-destructive"
  return (
    <div className={cn("flex flex-col gap-2 rounded-md border p-2.5 backdrop-blur sm:p-3", tone)}>
      <div className="flex items-start justify-between gap-2">
        <Icon className="size-5 shrink-0 sm:size-6" />
        <span className="rounded-sm border border-current bg-background/60 px-1.5 py-0.5 font-mono text-[9px] font-black leading-none tabular-nums sm:text-[10px]">
          L{level}
        </span>
      </div>
      <div>
        <div className="font-mono text-[10px] font-black tracking-wider text-foreground sm:text-xs">
          {p.name}
        </div>
        <div className="mt-0.5 line-clamp-2 text-[9px] leading-snug text-muted-foreground sm:text-[10px]">
          {p.desc}
        </div>
      </div>
      <div className="mt-auto">
        {maxed ? (
          <div className="rounded-sm border border-current px-1.5 py-0.5 text-center font-mono text-[8px] font-black tracking-[0.2em] sm:text-[9px]">
            MAX
          </div>
        ) : (
          <>
            <div className="mb-0.5 flex justify-between font-mono text-[8px] tabular-nums text-muted-foreground sm:text-[9px]">
              <span>FRAGMENTOS</span>
              <span>
                {shards}/{need}
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-secondary">
              <div className={cn("h-full transition-[width]", fillTone)} style={{ width: `${pct}%` }} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function LoadoutPickerSheet({
  current,
  levels,
  shards,
  onClose,
  onSave,
}: {
  current: PowerUpId[]
  levels: CardLevels
  shards: CardShards
  onClose: () => void
  onSave: (next: PowerUpId[]) => void
}) {
  const [draft, setDraft] = useState<PowerUpId[]>(() => [...current])
  const toggle = (id: PowerUpId) => {
    setDraft((d) => {
      if (d.includes(id)) return d.filter((x) => x !== id)
      if (d.length >= LOADOUT_SIZE) return d
      return [...d, id]
    })
  }
  const valid = draft.length === LOADOUT_SIZE
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Editar deck"
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="slam-in flex max-h-[92dvh] w-full max-w-xl flex-col gap-3 rounded-t-xl border-2 border-border bg-card p-4 shadow-2xl sm:rounded-xl"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-mono text-sm font-black tracking-[0.2em] text-primary sm:text-base">
              MONTAR DECK
            </h3>
            <p className="font-mono text-[10px] tracking-wider text-muted-foreground">
              Escolha {LOADOUT_SIZE} feitiços iniciais — {draft.length}/{LOADOUT_SIZE}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm border border-border bg-secondary px-2 py-1 font-mono text-[10px] font-bold tracking-wider text-muted-foreground transition hover:text-foreground active:scale-95"
            aria-label="Fechar"
          >
            FECHAR
          </button>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-4">
          {POWER_UP_POOL.map((id) => {
            const p = POWER_UPS[id]
            const Icon = p.Icon
            const selected = draft.includes(id)
            const slotIndex = draft.indexOf(id)
            const tone =
              p.color === "primary"
                ? "text-primary"
                : p.color === "accent"
                  ? "text-accent"
                  : "text-destructive"
            const need = shardsToNext(levels[id] ?? 1)
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggle(id)}
                className={cn(
                  "relative flex flex-col items-center gap-1 rounded-md border-2 bg-card p-2 text-center transition active:scale-95 sm:p-2.5",
                  selected
                    ? "border-primary shadow-[0_0_18px_oklch(0.78_0.17_205/0.45)]"
                    : "border-border hover:border-primary/40",
                )}
                aria-pressed={selected}
              >
                {selected ? (
                  <span className="absolute -top-1.5 -left-1.5 grid size-5 place-items-center rounded-full bg-primary font-mono text-[10px] font-black text-primary-foreground sm:size-6 sm:text-[11px]">
                    {slotIndex + 1}
                  </span>
                ) : null}
                <span className="absolute right-1 top-1 rounded-sm border border-border bg-background/70 px-1 font-mono text-[8px] font-black leading-none tabular-nums sm:text-[9px]">
                  L{levels[id] ?? 1}
                </span>
                <Icon className={cn("size-6 sm:size-7", tone)} />
                <span className="font-mono text-[9px] font-black tracking-wider sm:text-[10px]">
                  {p.name}
                </span>
                <span className="line-clamp-2 text-[9px] leading-snug text-muted-foreground sm:text-[10px]">
                  {p.desc}
                </span>
                {need !== null ? (
                  <span className="font-mono text-[8px] tabular-nums text-muted-foreground sm:text-[9px]">
                    {shards[id] ?? 0}/{need}
                  </span>
                ) : (
                  <span className="font-mono text-[8px] font-black tabular-nums text-destructive sm:text-[9px]">
                    MAX
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => onSave(draft)}
          disabled={!valid}
          className={cn(
            "rounded-md py-3 font-mono text-sm font-black tracking-[0.2em] transition active:scale-95",
            valid
              ? "bg-primary text-primary-foreground shadow-[0_0_24px_oklch(0.78_0.17_205/0.4)] hover:scale-[1.01]"
              : "cursor-not-allowed bg-secondary text-muted-foreground",
          )}
        >
          CONFIRMAR DECK
        </button>
      </div>
    </div>
  )
}

function ElementBriefing() {
  const order: Move[] = ["pyro", "terra", "hydro"] // PYRO, TERRA, HYDRO for visual punch
  return (
    <div className="mt-8 w-full max-w-3xl">
      <div className="mb-3 rounded-md border border-primary/40 bg-primary/5 p-3 text-left backdrop-blur sm:p-4">
        <p className="font-mono text-[10px] font-bold tracking-[0.3em] text-primary sm:text-xs">
          CHAIN CAST
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
          Monte uma sequência de <span className="font-bold text-foreground">3 feitiços</span> antes
          de lançar. A CPU monta a dela em paralelo. Resolução posição por posição —{" "}
          <span className="font-bold text-foreground">slot III</span> bate{" "}
          <span className="font-mono font-bold text-primary">x1.4</span>, então guarde o golpe pesado.
          Vencer todos os 3 ativa{" "}
          <span className="font-mono font-black tracking-wider text-destructive">PERFECT CAST</span>{" "}
          (+{PERFECT_CHAIN_BONUS} dano, +{PERFECT_CHAIN_RAGE} fúria).
        </p>
      </div>
      <p className="mb-2 font-mono text-[10px] font-bold tracking-[0.3em] text-muted-foreground sm:text-xs">
        ELEMENTOS — assimétricos
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
        {order.map((m) => {
          const profile = ELEMENT_PROFILE[m]
          const move = MOVES[m]
          const tone =
            m === "pyro"
              ? "border-destructive/40 bg-destructive/5"
              : m === "hydro"
                ? "border-primary/40 bg-primary/5"
                : "border-accent/40 bg-accent/5"
          const accent =
            m === "pyro"
              ? "text-destructive"
              : m === "hydro"
                ? "text-primary"
                : "text-accent"
          return (
            <div
              key={m}
              className={cn(
                "flex items-start gap-3 rounded-md border p-3 text-left backdrop-blur",
                tone,
              )}
            >
              <div className="text-3xl leading-none sm:text-4xl" aria-hidden="true">
                {move.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className={cn("font-mono text-sm font-black tracking-wider", accent)}>
                    {move.label}
                  </span>
                  <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                    {profile.baseDamage} dmg
                  </span>
                </div>
                <div className="mt-0.5">
                  <span className={cn("font-mono text-[10px] font-bold tracking-wider sm:text-[11px]", accent)}>
                    {profile.passiveLabel}
                  </span>
                  <span className="ml-1.5 text-[10px] leading-snug text-muted-foreground sm:text-[11px]">
                    {profile.passiveDesc}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RecordChip({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-card/60 px-2 py-2 backdrop-blur">
      <div className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className={cn("font-mono text-lg font-black tabular-nums", accent ? "text-accent" : "text-primary")}>
        {value}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Power-up icon                                                        */
/* ------------------------------------------------------------------ */

function PowerUpIcon({
  power,
  size = "md",
  active = false,
}: {
  power: PowerUp
  size?: "sm" | "md" | "lg"
  active?: boolean
}) {
  const sizing = size === "sm" ? "size-8" : size === "lg" ? "size-14" : "size-10"
  const iconSize = size === "sm" ? "size-4" : size === "lg" ? "size-6" : "size-5"
  const colorClasses =
    power.color === "primary"
      ? "bg-primary/15 text-primary ring-primary/40"
      : power.color === "accent"
        ? "bg-accent/15 text-accent ring-accent/40"
        : "bg-destructive/15 text-destructive ring-destructive/40"
  const Icon = power.Icon
  return (
    <div className={cn("grid shrink-0 place-items-center rounded-md ring-1 transition", sizing, colorClasses, active && "pulse-glow")}>
      <Icon className={iconSize} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Arena                                                                */
/* ------------------------------------------------------------------ */

type ComboTierLite = ReturnType<typeof getCombo>

function ArenaScreen({
  phase,
  playerHP,
  playerShield,
  cpuHP,
  cpuStats,
  cpuHistory,
  playerChain,
  cpuChain,
  chainResults,
  revealIndex,
  round,
  streak,
  combo,
  rage,
  inventory,
  buffs,
  spyPeek,
  hpFlash,
  floats,
  particles,
  ultimateReady,
  onAddToChain,
  onUndoChain,
  onCommitChain,
  onUsePowerUp,
  onUltimate,
}: {
  phase: Phase
  playerHP: number
  playerShield: number
  cpuHP: number
  cpuStats: CPUStats
  cpuHistory: Move[]
  playerChain: Move[]
  cpuChain: Move[]
  chainResults: (Result | null)[]
  revealIndex: number
  round: number
  streak: number
  combo: ComboTierLite
  rage: number
  inventory: PowerUpId[]
  buffs: Buffs
  spyPeek: Move[] | null
  hpFlash: "player" | "cpu" | null
  floats: FloatingNumber[]
  particles: Particle[]
  ultimateReady: boolean
  onAddToChain: (m: Move) => void
  onUndoChain: () => void
  onCommitChain: () => void
  onUsePowerUp: (i: number) => void
  onUltimate: () => void
}) {
  const canBuild = phase === "choosing"
  const chainFull = playerChain.length === CHAIN_LENGTH
  const canCommit = canBuild && chainFull
  const canUndo = canBuild && playerChain.length > 0
  const isResolving = phase === "shaking" || phase === "reveal"

  return (
    <section className="flex flex-1 flex-col gap-1.5 sm:gap-3">
      {/* HP strip */}
      <div className="grid grid-cols-2 gap-1.5 sm:gap-3">
        <HPBar
          name="VOCÊ"
          hp={playerHP}
          max={MAX_HP}
          align="left"
          flash={hpFlash === "player"}
          shield={playerShield}
        />
        <HPBar
          name={cpuStats.name}
          hp={cpuHP}
          max={cpuStats.hp}
          align="right"
          flash={hpFlash === "cpu"}
          isBoss={cpuStats.level === "boss"}
          history={cpuHistory}
        />
      </div>

      {/* Meters */}
      <div className="grid grid-cols-2 gap-1.5 sm:gap-3">
        <ComboMeter combo={combo} streak={streak} />
        <RageMeter rage={rage} ready={ultimateReady} onUltimate={onUltimate} />
      </div>

      {/* CHAIN STAGE */}
      <div
        className={cn(
          "relative flex flex-1 flex-col justify-between gap-1.5 overflow-hidden rounded-xl border border-border bg-card/40 p-2 backdrop-blur sm:gap-2 sm:p-3",
          phase === "shaking" && "flash-damage",
        )}
      >
        {/* Top corners: round + cpu level */}
        <div className="absolute left-1.5 top-1.5 z-10 rounded-md border border-border bg-background/80 px-1.5 py-0.5 font-mono text-[9px] tracking-wider text-muted-foreground backdrop-blur sm:left-2 sm:top-2 sm:px-2 sm:text-[10px]">
          R{String(round).padStart(2, "0")}
        </div>
        <div className="absolute right-1.5 top-1.5 z-10 flex items-center gap-1 rounded-md border border-border bg-background/80 px-1.5 py-0.5 font-mono text-[9px] tracking-wider text-muted-foreground backdrop-blur sm:right-2 sm:top-2 sm:px-2 sm:text-[10px]">
          <Cpu className="size-3" />
          {cpuStats.level.toUpperCase()}
        </div>

        {/* CPU CHAIN */}
        <ChainStrip
          side="cpu"
          chain={cpuChain}
          spyPreview={buffs.spy ? spyPeek : null}
          results={chainResults}
          revealIndex={revealIndex}
          phase={phase}
          floats={floats.filter((f) => f.side === "cpu")}
          particles={particles.filter((p) => p.side === "cpu")}
        />

        {/* Position multipliers ribbon */}
        <div className="z-0 flex items-center justify-center gap-1 font-mono text-[9px] tracking-[0.3em] text-muted-foreground sm:gap-2 sm:text-[10px]">
          {POSITION_MULT.map((m, i) => (
            <span
              key={i}
              className={cn(
                "rounded-sm border border-border bg-background/60 px-1.5 py-0.5 transition",
                revealIndex === i && "border-primary text-primary",
              )}
            >
              {POSITION_LABELS[i]} · x{m.toFixed(1)}
            </span>
          ))}
        </div>

        {/* PLAYER CHAIN */}
        <ChainStrip
          side="player"
          chain={playerChain}
          spyPreview={null}
          results={chainResults}
          revealIndex={revealIndex}
          phase={phase}
          floats={floats.filter((f) => f.side === "player")}
          particles={particles.filter((p) => p.side === "player")}
        />

        {/* CAST overlay during shake */}
        {phase === "shaking" ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="slam-in rounded-md border-2 border-primary bg-background/80 px-3 py-1 font-mono text-sm font-black tracking-[0.3em] text-primary backdrop-blur sm:text-base">
              CAST!
            </div>
          </div>
        ) : null}

        <ActiveBuffsFloat buffs={buffs} />
      </div>

      {/* Inventory */}
      <Inventory inventory={inventory} buffs={buffs} disabled={!canBuild} onUse={onUsePowerUp} />

      {/* Element selectors */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
        {MOVE_LIST.map((m) => (
          <ChoiceButton
            key={m}
            move={m}
            disabled={!canBuild || chainFull}
            onClick={() => onAddToChain(m)}
          />
        ))}
      </div>

      {/* Undo + Commit row */}
      <div className="grid grid-cols-[1fr_2fr] gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={onUndoChain}
          disabled={!canUndo}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-md border-2 border-border bg-card py-2 font-mono text-[10px] font-bold tracking-[0.2em] text-muted-foreground transition active:scale-95 sm:py-2.5 sm:text-xs",
            canUndo && "hover:border-destructive/60 hover:text-destructive",
            !canUndo && "cursor-not-allowed opacity-40",
          )}
          aria-label="Desfazer último feitiço da sequência"
        >
          <RotateCcw className="size-3.5 sm:size-4" />
          DESFAZER
        </button>
        <button
          type="button"
          onClick={onCommitChain}
          disabled={!canCommit}
          className={cn(
            "relative flex items-center justify-center gap-2 overflow-hidden rounded-md py-2 font-mono text-xs font-black tracking-[0.25em] transition active:scale-95 sm:py-2.5 sm:text-sm",
            canCommit
              ? "pulse-glow bg-primary text-primary-foreground shadow-[0_0_24px_oklch(0.78_0.17_205/0.4)]"
              : isResolving
                ? "cursor-not-allowed bg-secondary text-muted-foreground"
                : "cursor-not-allowed bg-secondary/60 text-muted-foreground",
          )}
          aria-label="Lançar sequência de feitiços"
        >
          <Swords className="size-4 sm:size-5" />
          {isResolving ? "LANÇANDO..." : canCommit ? "LANÇAR CADEIA" : `MONTE ${CHAIN_LENGTH - playerChain.length} FEITIÇO${CHAIN_LENGTH - playerChain.length === 1 ? "" : "S"}`}
        </button>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Chain strip                                                          */
/* ------------------------------------------------------------------ */

function ChainStrip({
  side,
  chain,
  spyPreview,
  results,
  revealIndex,
  phase,
  floats,
  particles,
}: {
  side: "player" | "cpu"
  chain: Move[]
  spyPreview: Move[] | null
  results: (Result | null)[]
  revealIndex: number
  phase: Phase
  floats: FloatingNumber[]
  particles: Particle[]
}) {
  const isCpu = side === "cpu"
  // CPU hides chain until reveal; player chain visible during build
  const showCpuChain = isCpu && (phase === "shaking" || phase === "reveal")

  return (
    <div className="relative grid grid-cols-3 items-center gap-1 sm:gap-2">
      {/* particle layer */}
      <div className="pointer-events-none absolute inset-0 z-10">
        {particles.map((p) => (
          <span
            key={p.id}
            className={cn(
              "absolute top-1/2 size-1.5 rounded-full sm:size-2",
              p.color === "primary"
                ? "bg-primary"
                : p.color === "accent"
                  ? "bg-accent"
                  : "bg-destructive",
            )}
            style={{
              left: `${p.left}%`,
              animation: `particle 1.4s ease-out ${p.delay}s forwards`,
              ["--tx" as string]: `${p.tx}px`,
            }}
          />
        ))}
      </div>

      {/* floating labels (relative to whole strip) */}
      <div className="pointer-events-none absolute inset-0 z-20">
        {floats.map((f) => (
          <span
            key={f.id}
            className={cn(
              "absolute left-1/2 top-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-base font-black tabular-nums sm:text-xl",
              "float-up",
              f.tone === "damage" && "text-destructive",
              f.tone === "heal" && "text-primary",
              f.tone === "info" && "text-accent",
              f.tone === "crit" && "text-accent",
              f.tone === "ultimate" && "text-destructive drop-shadow-[0_0_8px_oklch(0.66_0.24_22/0.8)]",
            )}
          >
            {f.value}
          </span>
        ))}
      </div>

      {Array.from({ length: CHAIN_LENGTH }, (_, i) => {
        const filled = chain[i]
        const result = results[i]
        const revealed = revealIndex >= i || phase === "reveal" && revealIndex === -1 && filled !== undefined
        const showSpyPreview = isCpu && !showCpuChain && spyPreview?.[i]
        const cpuMove = showCpuChain ? chain[i] : showSpyPreview ? spyPreview![i] : null
        const playerMove = !isCpu ? filled : null
        const move = isCpu ? cpuMove : playerMove
        return (
          <ChainSlot
            key={i}
            position={i}
            move={move}
            result={revealIndex >= i ? result : null}
            isCurrent={revealIndex === i}
            isCpu={isCpu}
            isSpyPreview={!!showSpyPreview && !showCpuChain}
            phase={phase}
          />
        )
      })}
    </div>
  )
}

function ChainSlot({
  position,
  move,
  result,
  isCurrent,
  isCpu,
  isSpyPreview,
  phase,
}: {
  position: number
  move: Move | null
  result: Result | null
  isCurrent: boolean
  isCpu: boolean
  isSpyPreview: boolean
  phase: Phase
}) {
  const empty = !move
  const tone =
    result === "win"
      ? isCpu
        ? "border-destructive bg-destructive/15"
        : "border-primary bg-primary/15"
      : result === "lose"
        ? isCpu
          ? "border-primary bg-primary/15"
          : "border-destructive bg-destructive/15"
        : result === "draw"
          ? "border-accent/60 bg-accent/10"
          : empty
            ? "border-border/50 border-dashed bg-secondary/30"
            : "border-border bg-card"

  const resultLabel = result === "win" ? (isCpu ? "−" : "+") : result === "lose" ? (isCpu ? "+" : "−") : result === "draw" ? "=" : ""

  return (
    <div
      className={cn(
        "relative flex aspect-[5/4] flex-col items-center justify-center overflow-hidden rounded-lg border-2 transition",
        tone,
        isCurrent && "scale-[1.04] shadow-[0_0_18px_oklch(0.78_0.17_205/0.45)]",
        isSpyPreview && "opacity-60",
      )}
    >
      <span className="absolute left-1 top-0.5 font-mono text-[8px] font-black tracking-wider text-muted-foreground sm:left-1.5 sm:text-[9px]">
        {POSITION_LABELS[position]}
      </span>
      {move ? (
        <span
          className={cn(
            "text-3xl leading-none transition sm:text-5xl",
            phase === "shaking" && "animate-pulse",
            isSpyPreview && "blur-[1px]",
          )}
          aria-label={MOVES[move].label}
        >
          {MOVES[move].emoji}
        </span>
      ) : (
        <span className="font-mono text-2xl font-black text-muted-foreground/40 sm:text-4xl" aria-hidden="true">
          ?
        </span>
      )}
      {result ? (
        <span
          className={cn(
            "absolute right-1 top-0.5 font-mono text-sm font-black sm:right-1.5 sm:text-base",
            result === "win"
              ? isCpu
                ? "text-destructive"
                : "text-primary"
              : result === "lose"
                ? isCpu
                  ? "text-primary"
                  : "text-destructive"
                : "text-accent",
          )}
        >
          {resultLabel}
        </span>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* HP Bar                                                               */
/* ------------------------------------------------------------------ */

function HPBar({
  name,
  hp,
  max,
  align,
  flash,
  isBoss,
  shield,
  history,
}: {
  name: string
  hp: number
  max: number
  align: "left" | "right"
  flash: boolean
  isBoss?: boolean
  shield?: number
  history?: Move[]
}) {
  const pct = Math.max(0, Math.min(100, (hp / max) * 100))
  const tone = pct > 60 ? "primary" : pct > 30 ? "accent" : "destructive"
  const toneClass =
    tone === "primary" ? "bg-primary" : tone === "accent" ? "bg-accent" : "bg-destructive"
  const low = pct <= 30
  const hasFooter = (shield ?? 0) > 0 || (history && history.length > 0)
  return (
    <div
      className={cn(
        "rounded-md border bg-card/60 px-2 py-1.5 backdrop-blur sm:px-3 sm:py-2",
        low ? "border-destructive/40" : "border-border",
        flash && "flash-damage",
      )}
    >
      <div className={cn("mb-1 flex items-baseline justify-between gap-2 font-mono", align === "right" && "flex-row-reverse")}>
        <span className="min-w-0 truncate text-[9px] font-bold tracking-[0.16em] text-muted-foreground sm:text-xs sm:tracking-[0.2em]">
          {isBoss ? <span className="text-destructive">[BOSS] </span> : null}
          {name}
        </span>
        <span className={cn("shrink-0 text-[11px] font-bold tabular-nums sm:text-sm", low && "text-destructive")}>
          {hp}
          <span className="text-muted-foreground">/{max}</span>
        </span>
      </div>
      <div className={cn("h-2 overflow-hidden rounded-full bg-secondary sm:h-2.5", align === "right" && "rotate-180")}>
        <div className={cn("h-full transition-[width] duration-500 ease-out", toneClass)} style={{ width: `${pct}%` }} />
      </div>
      {hasFooter ? (
        <div
          className={cn(
            "mt-1 flex items-center gap-1 font-mono text-[9px] sm:mt-1.5 sm:text-[10px]",
            align === "right" && "flex-row-reverse",
          )}
        >
          {(shield ?? 0) > 0 ? (
            <span className="drop-in inline-flex items-center gap-0.5 rounded-sm border border-accent/50 bg-accent/15 px-1 py-px font-bold tracking-wider text-accent">
              <Shield className="size-2.5 sm:size-3" />
              {shield}
            </span>
          ) : null}
          {history && history.length > 0 ? (
            <div
              className={cn(
                "flex min-w-0 items-center gap-0.5 truncate text-[10px] leading-none sm:text-xs",
                align === "right" && "flex-row-reverse",
              )}
              aria-label="Últimos lances do oponente"
            >
              {history.slice(-6).map((m, i, arr) => (
                <span
                  key={i}
                  aria-hidden="true"
                  className="leading-none"
                  style={{ opacity: 0.4 + (0.6 * (i + 1)) / arr.length }}
                >
                  {MOVES[m].emoji}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Combo / Rage meters                                                  */
/* ------------------------------------------------------------------ */

function ComboMeter({ combo, streak }: { combo: ComboTierLite; streak: number }) {
  const active = combo.level > 0
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-md border bg-card/60 px-2 py-1 backdrop-blur sm:gap-2 sm:px-3 sm:py-2",
        active ? "border-accent/60" : "border-border",
        active && "combo-pulse",
      )}
    >
      <div
        className={cn(
          "grid size-7 shrink-0 place-items-center rounded-md ring-1 sm:size-9",
          active ? "bg-accent/15 text-accent ring-accent/40" : "bg-muted/50 text-muted-foreground ring-border",
        )}
      >
        <Flame className="size-3.5 sm:size-4" />
      </div>
      <div className="min-w-0 leading-tight">
        <div className="font-mono text-[8px] tracking-[0.25em] text-muted-foreground sm:text-[9px]">COMBO</div>
        <div className={cn("truncate font-mono text-xs font-black tabular-nums sm:text-base", active ? "text-accent" : "text-muted-foreground")}>
          {combo.label}
          <span className="ml-1 text-[9px] text-muted-foreground sm:text-[10px]">({streak})</span>
        </div>
      </div>
    </div>
  )
}

function RageMeter({ rage, ready, onUltimate }: { rage: number; ready: boolean; onUltimate: () => void }) {
  const pct = (rage / RAGE_MAX) * 100
  return (
    <button
      type="button"
      disabled={!ready}
      onClick={onUltimate}
      className={cn(
        "group relative flex items-center gap-1.5 overflow-hidden rounded-md border bg-card/60 px-2 py-1 text-left backdrop-blur transition sm:gap-2 sm:px-3 sm:py-2",
        ready ? "border-destructive/70 ultimate-charge active:scale-95" : "border-border",
        !ready && "cursor-default",
      )}
      aria-label={ready ? "Disparar ULTIMATE" : "Fúria carregando"}
    >
      <div
        className={cn(
          "grid size-7 shrink-0 place-items-center rounded-md ring-1 sm:size-9",
          ready ? "bg-destructive/20 text-destructive ring-destructive/50" : "bg-muted/50 text-muted-foreground ring-border",
        )}
      >
        <Zap className="size-3.5 sm:size-4" />
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <div className="flex items-center justify-between gap-1">
          <span className="font-mono text-[8px] tracking-[0.25em] text-muted-foreground sm:text-[9px]">
            {ready ? <span className="text-destructive font-black">ULTIMATE</span> : "FÚRIA"}
          </span>
          <span className={cn("font-mono text-[9px] font-bold tabular-nums sm:text-[10px]", ready ? "text-destructive" : "text-muted-foreground")}>
            {rage}/{RAGE_MAX}
          </span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
          <div
            className={cn("h-full transition-[width] duration-500 ease-out", ready ? "bg-destructive" : "bg-accent/80")}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Active buffs                                                         */
/* ------------------------------------------------------------------ */

function ActiveBuffsFloat({ buffs }: { buffs: Buffs }) {
  const items = [
    buffs.shield && { id: "shield", icon: Shield, color: "primary" as const, title: "Escudo" },
    buffs.crit && { id: "crit", icon: Zap, color: "accent" as const, title: "Crítico" },
    buffs.spy && { id: "spy", icon: Eye, color: "primary" as const, title: "Espião" },
    buffs.lucky && { id: "lucky", icon: Sparkles, color: "accent" as const, title: "Sorte" },
    buffs.siphon && { id: "siphon", icon: Droplet, color: "primary" as const, title: "Sifão" },
  ].filter(Boolean) as Array<{
    id: string
    icon: typeof Shield
    color: "primary" | "accent" | "destructive"
    title: string
  }>

  if (items.length === 0) return null

  return (
    <div className="pointer-events-none absolute bottom-1.5 right-1.5 flex items-center gap-1 sm:bottom-2 sm:right-2">
      {items.map((it) => (
        <span
          key={it.id}
          title={it.title}
          aria-label={it.title}
          className={cn(
            "drop-in grid size-6 place-items-center rounded-md border backdrop-blur sm:size-7",
            it.color === "primary" && "border-primary/60 bg-primary/20 text-primary",
            it.color === "accent" && "border-accent/60 bg-accent/20 text-accent",
            it.color === "destructive" && "border-destructive/60 bg-destructive/20 text-destructive",
          )}
        >
          <it.icon className="size-3 sm:size-3.5" />
        </span>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Choice button                                                        */
/* ------------------------------------------------------------------ */

function ChoiceButton({ move, disabled, onClick }: { move: Move; disabled: boolean; onClick: () => void }) {
  const profile = ELEMENT_PROFILE[move]
  const accent =
    move === "pyro"
      ? "border-destructive/50 hover:border-destructive hover:shadow-[0_0_24px_oklch(0.66_0.24_22/0.35)] active:border-destructive active:bg-destructive/15"
      : move === "hydro"
        ? "border-primary/50 hover:border-primary hover:shadow-[0_0_24px_oklch(0.78_0.17_205/0.35)] active:border-primary active:bg-primary/15"
        : "border-accent/50 hover:border-accent hover:shadow-[0_0_24px_oklch(0.86_0.18_92/0.35)] active:border-accent active:bg-accent/15"
  const passiveColor =
    move === "pyro" ? "text-destructive" : move === "hydro" ? "text-primary" : "text-accent"
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "group relative flex min-h-[60px] flex-row items-center justify-center gap-1.5 overflow-hidden rounded-lg border-2 bg-card px-2 py-1.5 transition sm:min-h-[72px] sm:gap-2 sm:py-2",
        accent,
        "active:scale-[0.95]",
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:shadow-none disabled:active:scale-100",
      )}
      aria-label={`Adicionar ${MOVES[move].label} à cadeia, dano base ${profile.baseDamage}, passiva ${profile.passiveLabel}`}
    >
      <span className="text-2xl leading-none transition group-hover:scale-110 sm:text-3xl" aria-hidden="true">
        {MOVES[move].emoji}
      </span>
      <span className="flex flex-col items-start gap-0">
        <span className="font-mono text-[10px] font-black tracking-[0.18em] text-foreground sm:text-xs sm:tracking-[0.22em]">
          {MOVES[move].label}
        </span>
        <span className="flex items-center gap-1 font-mono text-[8px] tabular-nums text-muted-foreground sm:text-[10px]">
          <span className="font-bold text-foreground">{profile.baseDamage}</span>
          <span aria-hidden="true">·</span>
          <span className={cn("font-black tracking-wider", passiveColor)}>
            {profile.passiveLabel}
          </span>
        </span>
      </span>
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Inventory                                                            */
/* ------------------------------------------------------------------ */

function Inventory({
  inventory,
  buffs,
  disabled,
  onUse,
}: {
  inventory: PowerUpId[]
  buffs: Buffs
  disabled: boolean
  onUse: (i: number) => void
}) {
  const slots: (PowerUpId | null)[] = Array.from({ length: INVENTORY_LIMIT }, (_, i) => inventory[i] ?? null)
  const empty = inventory.length === 0

  return (
    <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
      {slots.map((id, i) =>
        id ? (
          <PowerUpSlot
            key={i}
            power={POWER_UPS[id]}
            disabled={disabled}
            onUse={() => onUse(i)}
            isActiveBuff={
              (id === "shield" && buffs.shield) ||
              (id === "crit" && buffs.crit) ||
              (id === "spy" && buffs.spy) ||
              (id === "lucky" && buffs.lucky) ||
              (id === "siphon" && buffs.siphon)
            }
          />
        ) : (
          <div
            key={i}
            className="grid h-11 place-items-center rounded-md border border-dashed border-border/60 bg-card/30 text-muted-foreground/40 sm:h-14"
          >
            {empty && i === 0 ? (
              <span className="font-mono text-[8px] tracking-[0.2em] sm:text-[9px]">SEM ITEMS</span>
            ) : (
              <Lock className="size-3" />
            )}
          </div>
        ),
      )}
    </div>
  )
}

function PowerUpSlot({
  power,
  disabled,
  onUse,
  isActiveBuff,
}: {
  power: PowerUp
  disabled: boolean
  onUse: () => void
  isActiveBuff: boolean
}) {
  const colorRing =
    power.color === "primary"
      ? "border-primary/50 bg-primary/10 text-primary"
      : power.color === "accent"
        ? "border-accent/60 bg-accent/10 text-accent"
        : "border-destructive/50 bg-destructive/10 text-destructive"
  const Icon = power.Icon
  return (
    <button
      type="button"
      onClick={onUse}
      disabled={disabled}
      title={`${power.name} — ${power.desc}`}
      aria-label={`Usar ${power.name}`}
      className={cn(
        "group relative grid h-11 place-items-center rounded-md border transition sm:h-14",
        "active:scale-[0.94]",
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100",
        colorRing,
        isActiveBuff && "pulse-glow",
      )}
    >
      <Icon className="size-5 sm:size-6" />
      <span className="absolute -bottom-1 left-1/2 hidden -translate-x-1/2 rounded-sm bg-background/90 px-1 font-mono text-[8px] font-bold tracking-wider sm:block">
        {power.name}
      </span>
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Shop                                                                 */
/* ------------------------------------------------------------------ */

function ShopScreen({
  offers,
  stage,
  playerHP,
  inventory,
  onBuy,
  onSkip,
  reward,
  trophies,
}: {
  offers: PowerUpId[]
  stage: number
  playerHP: number
  inventory: PowerUpId[]
  onBuy: (id: PowerUpId) => void
  onSkip: () => void
  reward: {
    trophiesGained: number
    shards: PowerUpId[]
    leveledUp: PowerUpId[]
    gained: Partial<Record<PowerUpId, number>>
  } | null
  trophies: number
}) {
  const inventoryFull = inventory.length >= INVENTORY_LIMIT
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-4 py-4 text-center sm:gap-6">
      <div className="pop-in inline-flex items-center gap-2 rounded-md border border-accent/60 bg-accent/15 px-3 py-1 font-mono text-[10px] font-bold tracking-[0.3em] text-accent sm:text-xs">
        <Star className="size-3.5" />
        STAGE {stage} CONCLUÍDO
      </div>

      {/* Chest reward summary */}
      {reward ? <ChestRewardCard reward={reward} trophies={trophies} /> : null}

      <div>
        <h2 className="font-mono text-2xl font-black tracking-tighter text-balance sm:text-4xl">ESCOLHA UMA RECOMPENSA</h2>
        <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">
          HP atual: <span className="font-bold text-foreground tabular-nums">{playerHP}/{MAX_HP}</span>
          {inventoryFull ? (
            <span className="ml-2 text-destructive">· inventário cheio: substitui o item mais antigo</span>
          ) : null}
        </p>
      </div>

      <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
        {offers.map((id) => {
          const p = POWER_UPS[id]
          return (
            <button
              key={id}
              type="button"
              onClick={() => onBuy(id)}
              className={cn(
                "drop-in group flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition active:scale-[0.97] sm:p-6",
                p.color === "primary" && "border-primary/40 bg-primary/5 hover:bg-primary/15 hover:shadow-[0_0_30px_oklch(0.78_0.17_205/0.3)]",
                p.color === "accent" && "border-accent/50 bg-accent/5 hover:bg-accent/15 hover:shadow-[0_0_30px_oklch(0.86_0.18_92/0.3)]",
                p.color === "destructive" && "border-destructive/40 bg-destructive/5 hover:bg-destructive/15 hover:shadow-[0_0_30px_oklch(0.66_0.24_22/0.3)]",
              )}
            >
              <PowerUpIcon power={p} size="lg" />
              <div className="font-mono text-base font-black tracking-wider sm:text-lg">{p.name}</div>
              <div className="text-xs leading-relaxed text-muted-foreground">{p.desc}</div>
              <div className="mt-1 inline-flex items-center gap-1 font-mono text-[10px] font-bold tracking-wider text-foreground/70">
                <ChevronRight className="size-3" />
                LEVAR
              </div>
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={onSkip}
        className="mt-2 inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-2.5 font-mono text-xs font-bold tracking-[0.2em] text-muted-foreground transition active:scale-95 hover:text-foreground"
      >
        <Heart className="size-4 text-primary" />
        PULAR · +{SHOP_HEAL_SKIP + STAGE_HEAL_BONUS} HP
      </button>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Game over                                                            */
/* ------------------------------------------------------------------ */

function GameOverScreen({
  won,
  stats,
  records,
  killerHero,
  onRestart,
}: {
  won: boolean
  stats: {
    wins: number
    losses: number
    draws: number
    bestStreak: number
    stageReached: number
    damageDealt: number
    powerUpsUsed: number
  }
  records: Records
  killerHero: string
  onRestart: () => void
}) {
  const isNewBest = stats.stageReached >= records.bestStage && stats.stageReached > 1
  // Pull the cinematic line — hero gloats if they killed you, Underlord scoffs if you survived
  const killer = useMemo(() => getHero(stats.stageReached), [stats.stageReached])
  const headline = won ? rand(UNDERLORD_LINES.victory) : killer.gloat
  const speaker = won ? "UNDERLORD" : killer.name
  const speakerSub = won ? "(você, finalmente em paz)" : killer.title

  return (
    <section className="flex flex-1 flex-col items-center justify-center py-4 text-center sm:py-8">
      <div
        className={cn(
          "slam-in mb-4 grid size-16 place-items-center rounded-full ring-4 sm:mb-6 sm:size-20",
          won
            ? "bg-primary/15 text-primary ring-primary/40"
            : "bg-destructive/15 text-destructive ring-destructive/40",
        )}
      >
        {won ? <Trophy className="size-8 sm:size-10" /> : <Skull className="size-8 sm:size-10" />}
      </div>
      <h2
        className={cn(
          "font-mono text-4xl font-black tracking-tighter sm:text-6xl",
          won ? "text-primary" : "text-destructive",
        )}
      >
        {won ? "TORRE LIMPA" : "MORTO POR UM CUZÃO"}
      </h2>

      {/* Speech bubble from the killer / underlord */}
      <div
        className={cn(
          "slam-in mt-5 w-full max-w-md rounded-lg border-2 px-4 py-3 text-left font-mono backdrop-blur sm:px-5 sm:py-4",
          won
            ? "border-primary/50 bg-primary/10"
            : "border-destructive/50 bg-destructive/10",
        )}
      >
        <p className="text-[9px] font-bold tracking-[0.3em] text-muted-foreground sm:text-[10px]">
          {speaker}
        </p>
        <p className="text-[9px] tracking-[0.18em] text-muted-foreground/70 sm:text-[10px]">
          {speakerSub}
        </p>
        <p
          className={cn(
            "mt-2 text-balance text-base font-black leading-snug sm:text-xl",
            won ? "text-primary" : "text-destructive",
          )}
        >
          <span className="opacity-60">&ldquo;</span>
          {headline}
          <span className="opacity-60">&rdquo;</span>
        </p>
      </div>

      <p className="mt-4 max-w-md text-pretty text-sm text-muted-foreground sm:text-base">
        Chegou até o <span className="font-bold text-foreground">Stage {stats.stageReached}</span>{" "}
        antes de {won ? "fazer o reino calar a boca" : "ser derrotado por essa criatura insuportável"}.{" "}
        {isNewBest ? (
          <span className="text-accent font-bold">NOVO RECORDE!</span>
        ) : (
          <span>Melhor stage: {records.bestStage}.</span>
        )}
      </p>

      {/* Trophy total — shows where you stand after the run */}
      <div
        className={cn(
          "mt-4 inline-flex items-center gap-2 rounded-md border-2 px-3 py-1.5 font-mono backdrop-blur sm:px-4 sm:py-2",
          getTier(records.trophies).ring,
        )}
      >
        <Trophy className={cn("size-4 sm:size-5", getTier(records.trophies).text)} />
        <span className="font-black tabular-nums">{records.trophies}</span>
        <span className={cn("text-[10px] font-bold tracking-[0.2em] sm:text-xs", getTier(records.trophies).text)}>
          {getTier(records.trophies).name}
        </span>
      </div>

      <div className="mt-6 grid w-full max-w-2xl grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <ResultStat label="STAGE" value={stats.stageReached} tone="primary" />
        <ResultStat label="VITÓRIAS" value={stats.wins} tone="primary" />
        <ResultStat label="DERROTAS" value={stats.losses} tone="destructive" />
        <ResultStat label="MAX STREAK" value={stats.bestStreak} tone="accent" />
        <ResultStat label="EMPATES" value={stats.draws} tone="accent" />
        <ResultStat label="DANO TOTAL" value={stats.damageDealt} tone="destructive" />
        <ResultStat label="POWER-UPS" value={stats.powerUpsUsed} tone="primary" />
        <ResultStat label="RECORDE" value={records.bestStage} tone="accent" />
      </div>

      <button
        type="button"
        onClick={onRestart}
        className="pulse-glow mt-8 inline-flex items-center gap-3 rounded-md bg-primary px-7 py-3.5 font-mono text-base font-black tracking-[0.2em] text-primary-foreground transition active:scale-95 hover:scale-[1.02]"
      >
        <RotateCcw className="size-4" />
        REVANCHE
      </button>
    </section>
  )
}

function ResultStat({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: "primary" | "destructive" | "accent"
}) {
  const cls = tone === "primary" ? "text-primary" : tone === "destructive" ? "text-destructive" : "text-accent"
  return (
    <div className="rounded-lg border border-border bg-card/60 p-2.5 backdrop-blur sm:p-4">
      <div className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className={cn("mt-0.5 font-mono text-2xl font-black tabular-nums sm:text-3xl", cls)}>{value}</div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Banner overlay                                                       */
/* ------------------------------------------------------------------ */

function ChestRewardCard({
  reward,
  trophies,
}: {
  reward: {
    trophiesGained: number
    shards: PowerUpId[]
    leveledUp: PowerUpId[]
    gained: Partial<Record<PowerUpId, number>>
  }
  trophies: number
}) {
  // Aggregate per-power-up shard counts for tidy display
  const entries = Object.entries(reward.gained) as [PowerUpId, number][]
  return (
    <div className="slam-in flex w-full max-w-md flex-col gap-3 rounded-lg border-2 border-accent/60 bg-accent/10 p-3 backdrop-blur sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Trophy className="size-5 text-accent" />
          <span className="font-mono text-xs font-black tracking-[0.2em] text-accent sm:text-sm">
            +{reward.trophiesGained} TROFÉUS
          </span>
        </div>
        <span className="font-mono text-xs font-bold tabular-nums text-foreground/70 sm:text-sm">
          TOTAL {trophies}
        </span>
      </div>

      {entries.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {entries.map(([id, count]) => {
            const p = POWER_UPS[id]
            const Icon = p.Icon
            const tone =
              p.color === "primary"
                ? "text-primary border-primary/40 bg-primary/10"
                : p.color === "accent"
                  ? "text-accent border-accent/40 bg-accent/10"
                  : "text-destructive border-destructive/40 bg-destructive/10"
            return (
              <div
                key={id}
                className={cn(
                  "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-black tabular-nums sm:text-[11px]",
                  tone,
                )}
              >
                <Icon className="size-3" />
                <span>+{count}</span>
              </div>
            )
          })}
        </div>
      ) : null}

      {reward.leveledUp.length > 0 ? (
        <div className="flex flex-col gap-1 rounded-md border border-primary/50 bg-primary/15 px-2.5 py-2">
          <span className="font-mono text-[10px] font-black tracking-[0.2em] text-primary">
            CARTA EVOLUIU
          </span>
          <div className="flex flex-wrap gap-1.5">
            {reward.leveledUp.map((id) => {
              const p = POWER_UPS[id]
              const Icon = p.Icon
              return (
                <div
                  key={id}
                  className="pop-in inline-flex items-center gap-1 rounded-sm border border-primary bg-primary/20 px-1.5 py-0.5 font-mono text-[10px] font-black tracking-wider text-primary sm:text-[11px]"
                >
                  <Icon className="size-3" />
                  {p.name}
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function BannerOverlay({ banner }: { banner: Banner }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-40 grid place-items-center px-4">
      <div
        className={cn(
          "banner-sweep relative max-w-[92vw] overflow-hidden rounded-md border px-4 py-2.5 font-mono text-center backdrop-blur sm:px-10 sm:py-4",
          banner.tone === "primary" && "border-primary/60 bg-primary/15 text-primary",
          banner.tone === "accent" && "border-accent/60 bg-accent/15 text-accent",
          banner.tone === "destructive" && "border-destructive/60 bg-destructive/15 text-destructive",
        )}
      >
        <div className="text-2xl font-black tracking-[0.18em] text-balance sm:text-5xl sm:tracking-[0.25em]">
          {banner.title}
        </div>
        <div className="mt-0.5 text-[10px] tracking-[0.2em] opacity-80 sm:mt-1 sm:text-xs sm:tracking-[0.3em]">
          {banner.sub}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Hero intro — cinematic asshole-hero card                             */
/* ------------------------------------------------------------------ */

function HeroIntroOverlay({
  stage,
  hero,
  isBoss,
  onDismiss,
}: {
  stage: number
  hero: Hero
  isBoss: boolean
  onDismiss: () => void
}) {
  return (
    <button
      type="button"
      onClick={onDismiss}
      aria-label="Pular apresentação"
      className="fixed inset-0 z-50 grid place-items-center bg-background/80 px-4 backdrop-blur-sm"
    >
      <div
        className={cn(
          "slam-in relative w-full max-w-md rounded-lg border-2 bg-card/95 p-5 text-left font-mono shadow-2xl sm:p-7",
          isBoss
            ? "border-destructive/70 shadow-[0_0_60px_oklch(0.66_0.24_22/0.35)]"
            : "border-accent/60 shadow-[0_0_40px_oklch(0.86_0.18_92/0.25)]",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-sm border border-border bg-background/80 px-1.5 py-0.5 text-[9px] tracking-[0.3em] text-muted-foreground sm:text-[10px]">
            STAGE {String(stage).padStart(2, "0")}
          </span>
          <span
            className={cn(
              "rounded-sm border px-1.5 py-0.5 text-[9px] font-bold tracking-[0.25em] sm:text-[10px]",
              isBoss
                ? "border-destructive/60 bg-destructive/15 text-destructive"
                : "border-accent/60 bg-accent/15 text-accent",
            )}
          >
            {isBoss ? "BOSS" : "INTRUSO"}
          </span>
        </div>

        <h2
          className={cn(
            "mt-4 text-balance text-2xl font-black leading-tight tracking-tight sm:text-4xl",
            isBoss ? "text-destructive" : "text-foreground",
          )}
        >
          {hero.name}
        </h2>
        <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground sm:text-xs">
          {hero.title}
        </p>

        <div className="mt-4 rounded-md border border-border/60 bg-background/40 p-3 text-[12px] leading-relaxed text-foreground/90 sm:text-sm">
          <span className="mr-1 font-black text-accent">&ldquo;</span>
          {hero.entry}
          <span className="ml-0.5 font-black text-accent">&rdquo;</span>
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground sm:text-[12px]">
          {hero.bio}
        </p>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/50 pt-3">
          <span className="text-[9px] tracking-[0.25em] text-muted-foreground sm:text-[10px]">
            UNDERLORD: já cansei.
          </span>
          <span className="text-[9px] tracking-[0.25em] text-muted-foreground sm:text-[10px]">
            tap para continuar
          </span>
        </div>
      </div>
    </button>
  )
}
