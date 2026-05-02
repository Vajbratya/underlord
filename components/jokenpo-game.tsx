"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Bomb,
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
  ShoppingBag,
  ChevronRight,
  Cpu,
  Star,
  Lock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { sfx } from "@/lib/jokenpo-sounds"
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
  getCombo,
  type Move,
  type Result,
  type Phase,
  type PowerUpId,
  type PowerUp,
} from "@/lib/jokenpo-types"
import { cpuPick, cpuRollsCrit, getCPUStats, type CPUStats } from "@/lib/jokenpo-cpu"
import { loadRecords, saveRecords, mergeRunIntoRecords, type Records } from "@/lib/jokenpo-storage"

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

export function JokenpoGame() {
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
  const [cpuStats, setCpuStats] = useState<CPUStats>(() => getCPUStats(1))
  const [cpuHP, setCpuHP] = useState<number>(() => getCPUStats(1).hp)
  const [playerChoice, setPlayerChoice] = useState<Move | null>(null)
  const [cpuChoice, setCpuChoice] = useState<Move | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [history, setHistory] = useState<Move[]>([])

  // Power systems
  const [inventory, setInventory] = useState<PowerUpId[]>([])
  const [buffs, setBuffs] = useState<Buffs>(EMPTY_BUFFS)
  const [rage, setRage] = useState(0)
  const [spyPeek, setSpyPeek] = useState<Move | null>(null)
  const [shopOffers, setShopOffers] = useState<PowerUpId[]>([])

  // FX state
  const [floats, setFloats] = useState<FloatingNumber[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])
  const [particles, setParticles] = useState<Particle[]>([])
  const [banner, setBanner] = useState<Banner | null>(null)
  const [hpFlash, setHpFlash] = useState<"player" | "cpu" | null>(null)
  const [screenShake, setScreenShake] = useState(false)
  const [muted, setMuted] = useState(false)
  const [records, setRecords] = useState<Records>({
    bestStage: 0,
    bestStreak: 0,
    totalWins: 0,
    totalRuns: 0,
    totalDamage: 0,
    totalPowerUps: 0,
  })

  const idRef = useRef(0)
  const ultimateInProgress = useRef(false)
  const rageWasFull = useRef(false)

  // Load records on mount
  useEffect(() => {
    setRecords(loadRecords())
  }, [])

  /* ---------------- helpers tied to component ----------------------- */

  const play = useCallback(
    (sound: keyof typeof sfx) => {
      if (muted) return
      // @ts-expect-error - dynamic key dispatch
      sfx[sound]?.()
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
      setPlayerChoice(null)
      setCpuChoice(null)
      setResult(null)
      setHistory([])
      setBuffs(EMPTY_BUFFS)
      setSpyPeek(null)
      if (!options?.keepHP) {
        setPlayerHP(MAX_HP)
      }
      setPhase("choosing")
      const tone: Banner["tone"] =
        stats.level === "boss" ? "destructive" : stats.level === "predictive" ? "accent" : "primary"
      showBanner(`STAGE ${stageNumber}`, `${stats.name} · ${stats.intro}`, tone)
      if (stats.level === "boss") {
        play("bossIntro")
        haptic([30, 30, 30, 30, 80])
      } else {
        play("drop")
      }
    },
    [play, showBanner],
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
    setInventory([])
    setRage(0)
    rageWasFull.current = false
    setPlayerHP(MAX_HP)
    play("click")
    startStage(1)
  }, [play, startStage])

  const finishGame = useCallback(
    (won: boolean) => {
      ultimateInProgress.current = false
      setPhase("gameover")
      const stageReached = won ? stage + 1 : stage
      const updated = mergeRunIntoRecords(records, {
        stageReached,
        bestStreak,
        wins,
        damageDealt,
        powerUpsUsed,
      })
      setRecords(updated)
      saveRecords(updated)
      setTimeout(() => (won ? play("victory") : play("defeat")), 200)
    },
    [bestStreak, damageDealt, play, powerUpsUsed, records, stage, wins],
  )

  // Detect HP-zero -> stage clear or game over
  useEffect(() => {
    if (phase === "gameover" || phase === "menu" || phase === "shop") return
    if (playerHP <= 0) {
      // game over
      setTimeout(() => finishGame(false), 600)
    } else if (cpuHP <= 0) {
      // stage cleared, open shop
      setTimeout(() => {
        play("stageClear")
        haptic([30, 60, 30, 80])
        showBanner("STAGE LIMPO", `Vai pra loja, escolhe sua arma.`, "accent")
        setShopOffers(rollShopOffer())
        setPhase("shop")
      }, 600)
    }
  }, [playerHP, cpuHP, phase, finishGame, play, showBanner])

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

      // Instant
      if (id === "bomb") {
        const dmg = 25
        setCpuHP((hp) => Math.max(0, hp - dmg))
        setDamageDealt((d) => d + dmg)
        pushFloat(`-${dmg}`, "cpu", "damage")
        flashHP("cpu")
        triggerScreenShake()
        burstParticles("cpu", "destructive", 10)
        play("bomb")
        haptic([20, 30, 60])
        pushToast("BOMBA detonada!", "good")
        setInventory((inv) => inv.filter((_, i) => i !== idx))
        setPowerUpsUsed((n) => n + 1)
        return
      }
      if (id === "heal") {
        const before = playerHP
        const next = Math.min(MAX_HP, playerHP + 30)
        setPlayerHP(next)
        pushFloat(`+${next - before}`, "player", "heal")
        burstParticles("player", "primary", 8)
        play("heal")
        haptic(20)
        pushToast("CURA aplicada!", "good")
        setInventory((inv) => inv.filter((_, i) => i !== idx))
        setPowerUpsUsed((n) => n + 1)
        return
      }
      if (id === "rage") {
        addRage(50)
        pushFloat("+50 RAGE", "player", "ultimate")
        play("rageGain")
        haptic([10, 20, 10, 20])
        pushToast("FÚRIA acumulada.", "good")
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
        const peek = cpuPick(cpuStats.level, history)
        setSpyPeek(peek)
        setBuffs((b) => ({ ...b, spy: true }))
        play("powerup")
        haptic(15)
        pushToast(`ESPIÃO: CPU vai jogar ${MOVES[peek].label}`, "good")
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

  const runRound = useCallback(
    (move: Move, cpuMove: Move, opts?: { ultimate?: boolean }) => {
      setPlayerChoice(move)
      setCpuChoice(cpuMove)
      setPhase("shaking")
      play(opts?.ultimate ? "ultimate" : "click")
      haptic(opts?.ultimate ? [50, 80, 200] : 12)

      // shake/countdown
      let shakeCount = 0
      const shakeInterval = setInterval(() => {
        shakeCount++
        play("shake")
        if (shakeCount >= 3) clearInterval(shakeInterval)
      }, 280)

      window.setTimeout(() => {
        clearInterval(shakeInterval)
        play("reveal")

        let outcome: Result = opts?.ultimate ? "win" : decide(move, cpuMove)
        let luckyConsumed = false
        if (outcome === "draw" && buffs.lucky && !opts?.ultimate) {
          outcome = "win"
          luckyConsumed = true
        }

        setResult(outcome)
        setPhase("reveal")

        // Track player's move history for CPU AI (don't push the auto-counter on ultimate)
        if (!opts?.ultimate) {
          setHistory((h) => [...h, move].slice(-12))
        }

        window.setTimeout(() => {
          if (outcome === "win") {
            const newCombo = getCombo(streak + 1)
            const critMult = buffs.crit ? 2 : 1
            const dmg = opts?.ultimate
              ? ULTIMATE_DAMAGE
              : Math.round(BASE_DAMAGE * newCombo.mult * critMult)

            setCpuHP((hp) => Math.max(0, hp - dmg))
            setDamageDealt((d) => d + dmg)

            const labelParts: string[] = [`-${dmg}`]
            if (opts?.ultimate) labelParts.push("ULT")
            else if (buffs.crit) labelParts.push("CRIT")
            else if (newCombo.level >= 2) labelParts.push(newCombo.label)
            pushFloat(labelParts.join(" "), "cpu", opts?.ultimate ? "ultimate" : buffs.crit ? "crit" : "damage")

            flashHP("cpu")
            burstParticles("cpu", opts?.ultimate ? "destructive" : "primary", opts?.ultimate ? 18 : 10)
            if (opts?.ultimate) triggerScreenShake()

            play(opts?.ultimate ? "ultimate" : "win")
            haptic(opts?.ultimate ? [60, 80, 60, 80, 200] : 25)

            // Siphon: heal player for 50% of damage dealt
            if (buffs.siphon) {
              const heal = Math.round(dmg * 0.5)
              setPlayerHP((hp) => Math.min(MAX_HP, hp + heal))
              pushFloat(`+${heal}`, "player", "heal")
              burstParticles("player", "primary", 6)
              play("heal")
              setBuffs((b) => ({ ...b, siphon: false }))
              pushToast("SIFÃO drenou HP da CPU!", "good")
            }

            setWins((w) => w + 1)
            // Combo / streak
            setStreak((s) => {
              const next = s + 1
              setBestStreak((b) => Math.max(b, next))
              const tierNext = getCombo(next)
              const tierOld = getCombo(s)
              if (tierNext.level > tierOld.level) {
                play("combo")
                haptic([20, 30, 60])
                pushToast(tierNext.word ? `${tierNext.word}!  ${tierNext.label}` : tierNext.label, "epic")
              }
              if (next % 2 === 0 && next >= 2) {
                window.setTimeout(() => dropPowerUpFromStreak(), 350)
              }
              return next
            })

            addRage(RAGE_GAIN_WIN)
            if (buffs.crit) setBuffs((b) => ({ ...b, crit: false }))
          } else if (outcome === "lose") {
            const isCpuCrit = cpuRollsCrit(cpuStats)
            const baseDmg = isCpuCrit ? BASE_DAMAGE * 2 : BASE_DAMAGE

            if (buffs.shield) {
              setBuffs((b) => ({ ...b, shield: false }))
              pushFloat("BLOCK", "player", "info")
              burstParticles("player", "accent", 8)
              play("powerup")
              haptic([15, 25, 15])
              pushToast("Escudo absorveu o dano!", "good")
            } else {
              setPlayerHP((hp) => Math.max(0, hp - baseDmg))
              pushFloat(`-${baseDmg}${isCpuCrit ? " CRIT!" : ""}`, "player", isCpuCrit ? "crit" : "damage")
              flashHP("player")
              if (isCpuCrit) triggerScreenShake()
              play("damage")
              haptic(isCpuCrit ? [40, 60, 80] : 30)
              addRage(RAGE_GAIN_DAMAGE + (isCpuCrit ? 12 : 0))
              if (isCpuCrit) pushToast("CPU CRÍTICO!", "bad")
            }
            setLosses((l) => l + 1)
            setStreak(0)
          } else {
            // draw
            play("draw")
            haptic(12)
            setDraws((d) => d + 1)
            addRage(RAGE_GAIN_DRAW)
          }

          if (luckyConsumed) {
            setBuffs((b) => ({ ...b, lucky: false }))
            pushToast("SORTE: empate virou vitória!", "good")
          }

          if (buffs.spy) {
            setBuffs((b) => ({ ...b, spy: false }))
            setSpyPeek(null)
          }

          setRound((r) => r + 1)

          window.setTimeout(() => {
            ultimateInProgress.current = false
            setPlayerChoice(null)
            setCpuChoice(null)
            setResult(null)
            setPhase((p) => (p === "gameover" || p === "shop" ? p : "choosing"))
          }, 1100)
        }, 350)
      }, 1100)
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
      streak,
      triggerScreenShake,
    ],
  )

  const choose = useCallback(
    (move: Move) => {
      if (phase !== "choosing") return
      const cpu = buffs.spy && spyPeek ? spyPeek : cpuPick(cpuStats.level, history)
      runRound(move, cpu)
    },
    [phase, buffs.spy, spyPeek, cpuStats, history, runRound],
  )

  const triggerUltimate = useCallback(() => {
    if (phase !== "choosing") return
    if (rage < RAGE_MAX) return
    if (ultimateInProgress.current) return
    ultimateInProgress.current = true
    const cpuMove = buffs.spy && spyPeek ? spyPeek : cpuPick(cpuStats.level, history)
    const playerMove = MOVES[cpuMove].counter
    pushToast("ULTIMATE!", "epic")
    setRage(0)
    rageWasFull.current = false
    runRound(playerMove, cpuMove, { ultimate: true })
  }, [phase, rage, buffs.spy, spyPeek, cpuStats, history, runRound, pushToast])

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
          <MenuScreen onStart={newRun} records={records} />
        ) : phase === "shop" ? (
          <ShopScreen
            offers={shopOffers}
            stage={stage}
            playerHP={playerHP}
            inventory={inventory}
            onBuy={buyShop}
            onSkip={skipShop}
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
            onRestart={newRun}
          />
        ) : (
          <ArenaScreen
            phase={phase}
            playerHP={playerHP}
            cpuHP={cpuHP}
            cpuStats={cpuStats}
            playerChoice={playerChoice}
            cpuChoice={cpuChoice}
            result={result}
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
            onChoose={choose}
            onUsePowerUp={usePowerUp}
            onUltimate={triggerUltimate}
          />
        )}
      </main>

      {/* Banner overlay */}
      {banner ? <BannerOverlay banner={banner} key={banner.id} /> : null}

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
            JOKENPÔ
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

function MenuScreen({ onStart, records }: { onStart: () => void; records: Records }) {
  return (
    <section className="flex flex-1 flex-col items-center pt-4 text-center sm:pt-8">
      <div className="relative">
        <div className="absolute inset-0 -z-10 blur-3xl">
          <div className="mx-auto h-32 w-72 rounded-full bg-primary/30 sm:h-40 sm:w-80" />
        </div>
        <h2 className="font-mono text-4xl font-black leading-none tracking-tighter text-balance sm:text-7xl">
          <span className="text-primary">PEDRA</span>
          <span className="text-foreground">.</span>
          <span className="text-accent">PAPEL</span>
          <span className="text-foreground">.</span>
          <span className="text-destructive">TESOURA</span>
        </h2>
      </div>

      <p className="mt-4 max-w-md text-pretty text-sm text-muted-foreground sm:mt-6 sm:text-base">
        Sobreviva a stages infinitos. Combo multiplicador, rage meter, ultimate, loja entre stages.
        Quanto mais longe, mais brutal a CPU.
      </p>

      <button
        type="button"
        onClick={onStart}
        className="pulse-glow group mt-8 inline-flex items-center gap-3 rounded-md bg-primary px-8 py-4 font-mono text-lg font-black tracking-[0.2em] text-primary-foreground shadow-[0_0_30px_oklch(0.78_0.17_205/0.4)] transition active:scale-95 hover:scale-[1.02]"
      >
        <Swords className="size-5 transition group-hover:rotate-12" />
        COMEÇAR
      </button>

      {records.totalRuns > 0 ? (
        <div className="mt-6 grid w-full max-w-md grid-cols-3 gap-2 text-center">
          <RecordChip label="BEST STAGE" value={records.bestStage} accent />
          <RecordChip label="BEST STREAK" value={records.bestStreak} />
          <RecordChip label="VITÓRIAS" value={records.totalWins} />
        </div>
      ) : null}

      <div className="mt-8 grid w-full max-w-3xl grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3">
        <FeatureCard
          icon={Flame}
          title="Combo Multiplicador"
          desc="Vitórias seguidas multiplicam o dano até x3. Erra uma, perde tudo."
        />
        <FeatureCard
          icon={Zap}
          title="Rage & Ultimate"
          desc="Tomar dano enche a Fúria. Cheia, libera ULTIMATE: vitória garantida + 60 dmg."
        />
        <FeatureCard
          icon={ShoppingBag}
          title="Loja entre Stages"
          desc="Cada vitória de stage te deixa escolher 1 de 3 power-ups. Skip cura HP."
        />
      </div>

      <PowerUpLegend />
    </section>
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

function FeatureCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof Shield
  title: string
  desc: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card/60 p-3.5 text-left backdrop-blur sm:p-5">
      <div className="mb-2 grid size-9 place-items-center rounded-md bg-primary/15 text-primary ring-1 ring-primary/30 sm:mb-3">
        <Icon className="size-4" />
      </div>
      <h3 className="font-mono text-sm font-bold tracking-wider">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">{desc}</p>
    </div>
  )
}

function PowerUpLegend() {
  return (
    <div className="mt-8 w-full max-w-3xl">
      <p className="mb-2 font-mono text-[10px] font-bold tracking-[0.3em] text-muted-foreground sm:text-xs">
        ARSENAL
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {POWER_UP_POOL.map((id) => {
          const p = POWER_UPS[id]
          return (
            <div key={id} className="flex items-start gap-2 rounded-md border border-border bg-card/40 p-2.5 text-left">
              <PowerUpIcon power={p} size="sm" />
              <div className="min-w-0">
                <div className="font-mono text-[10px] font-bold tracking-wider sm:text-xs">{p.name}</div>
                <div className="text-[10px] leading-snug text-muted-foreground sm:text-xs">{p.desc}</div>
              </div>
            </div>
          )
        })}
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
  cpuHP,
  cpuStats,
  playerChoice,
  cpuChoice,
  result,
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
  onChoose,
  onUsePowerUp,
  onUltimate,
}: {
  phase: Phase
  playerHP: number
  cpuHP: number
  cpuStats: CPUStats
  playerChoice: Move | null
  cpuChoice: Move | null
  result: Result | null
  round: number
  streak: number
  combo: ComboTierLite
  rage: number
  inventory: PowerUpId[]
  buffs: Buffs
  spyPeek: Move | null
  hpFlash: "player" | "cpu" | null
  floats: FloatingNumber[]
  particles: Particle[]
  ultimateReady: boolean
  onChoose: (m: Move) => void
  onUsePowerUp: (i: number) => void
  onUltimate: () => void
}) {
  const canChoose = phase === "choosing"

  return (
    <section className="flex flex-1 flex-col gap-1.5 sm:gap-3">
      {/* HP strip mirror */}
      <div className="grid grid-cols-2 gap-1.5 sm:gap-3">
        <HPBar name="VOCÊ" hp={playerHP} max={MAX_HP} align="left" flash={hpFlash === "player"} />
        <HPBar
          name={cpuStats.name}
          hp={cpuHP}
          max={cpuStats.hp}
          align="right"
          flash={hpFlash === "cpu"}
          isBoss={cpuStats.level === "boss"}
        />
      </div>

      {/* Meters row */}
      <div className="grid grid-cols-2 gap-1.5 sm:gap-3">
        <ComboMeter combo={combo} streak={streak} />
        <RageMeter rage={rage} ready={ultimateReady} onUltimate={onUltimate} />
      </div>

      {/* Battle stage */}
      <div
        className={cn(
          "relative grid min-h-[180px] flex-1 grid-cols-2 items-center gap-2 overflow-hidden rounded-xl border border-border bg-card/40 p-2 backdrop-blur sm:gap-4 sm:p-6",
          phase === "shaking" && "flash-damage",
        )}
      >
        <BattleSide
          side="player"
          phase={phase}
          choice={playerChoice}
          result={result}
          floats={floats.filter((f) => f.side === "player")}
          particles={particles.filter((p) => p.side === "player")}
        />
        <BattleSide
          side="cpu"
          phase={phase}
          choice={cpuChoice}
          result={result}
          floats={floats.filter((f) => f.side === "cpu")}
          particles={particles.filter((p) => p.side === "cpu")}
        />

        {/* VS / Result badge */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <ResultBadge phase={phase} result={result} />
        </div>

        {/* Round counter pill */}
        <div className="absolute left-1.5 top-1.5 rounded-md border border-border bg-background/80 px-1.5 py-0.5 font-mono text-[9px] tracking-wider text-muted-foreground backdrop-blur sm:left-2 sm:top-2 sm:px-2 sm:text-[10px]">
          R{String(round).padStart(2, "0")}
        </div>

        {/* CPU level chip */}
        <div className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-md border border-border bg-background/80 px-1.5 py-0.5 font-mono text-[9px] tracking-wider text-muted-foreground backdrop-blur sm:right-2 sm:top-2 sm:px-2 sm:text-[10px]">
          <Cpu className="size-3" />
          {cpuStats.level.toUpperCase()}
        </div>

        {/* Spy peek hint */}
        {spyPeek && phase === "choosing" ? (
          <div className="absolute inset-x-0 bottom-1.5 mx-auto w-fit max-w-[90%] rounded-md border border-accent/60 bg-accent/20 px-2 py-0.5 text-center font-mono text-[10px] font-bold tracking-wider text-accent sm:bottom-2 sm:px-2.5 sm:py-1">
            ESPIÃO: CPU joga {MOVES[spyPeek].label}
          </div>
        ) : null}

        {/* Active buffs floating */}
        <ActiveBuffsFloat buffs={buffs} />
      </div>

      {/* Inventory chip strip */}
      <Inventory inventory={inventory} buffs={buffs} disabled={!canChoose} onUse={onUsePowerUp} />

      {/* Choice buttons */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
        {MOVE_LIST.map((m) => (
          <ChoiceButton key={m} move={m} disabled={!canChoose} onClick={() => onChoose(m)} />
        ))}
      </div>
    </section>
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
}: {
  name: string
  hp: number
  max: number
  align: "left" | "right"
  flash: boolean
  isBoss?: boolean
}) {
  const pct = Math.max(0, Math.min(100, (hp / max) * 100))
  const tone = pct > 60 ? "primary" : pct > 30 ? "accent" : "destructive"
  const toneClass =
    tone === "primary" ? "bg-primary" : tone === "accent" ? "bg-accent" : "bg-destructive"
  const low = pct <= 30
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
            {ready ? <span className="text-destructive font-black">ULTIMATE</span> : "RAGE"}
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
/* Battle side                                                          */
/* ------------------------------------------------------------------ */

function BattleSide({
  side,
  phase,
  choice,
  result,
  floats,
  particles,
}: {
  side: "player" | "cpu"
  phase: Phase
  choice: Move | null
  result: Result | null
  floats: FloatingNumber[]
  particles: Particle[]
}) {
  const isShaking = phase === "shaking"
  const isReveal = phase === "reveal"
  const sideResult: Result | null =
    !result ? null : side === "player" ? result : result === "win" ? "lose" : result === "lose" ? "win" : "draw"

  const ringTone =
    isReveal && sideResult === "win"
      ? "ring-primary shadow-[0_0_24px_oklch(0.78_0.17_205/0.4)]"
      : isReveal && sideResult === "lose"
        ? "ring-destructive shadow-[0_0_24px_oklch(0.66_0.24_22/0.4)]"
        : isReveal && sideResult === "draw"
          ? "ring-accent"
          : "ring-border"

  return (
    <div
      className={cn(
        "relative flex h-full min-h-[160px] flex-col items-center justify-center rounded-lg bg-background/60 px-1 py-2 ring-2 transition sm:min-h-[220px] sm:py-4",
        ringTone,
      )}
    >
      <div className="font-mono text-[9px] font-bold tracking-[0.25em] text-muted-foreground sm:text-[10px] sm:tracking-[0.3em]">
        {side === "player" ? "VOCÊ" : "CPU"}
      </div>

      <div className="relative mt-1 flex flex-1 items-center justify-center sm:mt-2">
        <div
          className={cn(
            "select-none leading-none",
            "text-[clamp(3.5rem,18vw,7rem)] sm:text-8xl",
            isShaking && "shake-hand",
            isReveal && "slam-in",
          )}
          aria-hidden="true"
        >
          {isShaking || (!choice && phase === "choosing") ? "✊" : choice ? MOVES[choice].emoji : "✊"}
        </div>

        {/* Floating numbers */}
        {floats.map((f) => (
          <span
            key={f.id}
            className={cn(
              "pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-lg font-black tabular-nums sm:text-2xl",
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

        {/* Particles */}
        {particles.map((p) => (
          <span
            key={p.id}
            className={cn(
              "pointer-events-none absolute top-1/2 size-1.5 rounded-full sm:size-2",
              "confetti",
              p.color === "primary" && "bg-primary",
              p.color === "accent" && "bg-accent",
              p.color === "destructive" && "bg-destructive",
            )}
            style={{
              left: `${p.left}%`,
              ["--tx" as string]: `${p.tx}px`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      {choice && (isReveal || isShaking) ? (
        <div className="mt-1 font-mono text-[10px] font-bold tracking-[0.18em] text-foreground/80 sm:mt-2 sm:text-xs sm:tracking-[0.2em]">
          {isShaking ? "..." : MOVES[choice].label}
        </div>
      ) : (
        <div className="mt-1 font-mono text-[9px] tracking-[0.18em] text-muted-foreground sm:mt-2 sm:text-xs sm:tracking-[0.2em]">
          {phase === "choosing" && side === "player" ? "ESCOLHA" : "AGUARDA"}
        </div>
      )}
    </div>
  )
}

function ResultBadge({ phase, result }: { phase: Phase; result: Result | null }) {
  if (phase === "choosing") {
    return (
      <div className="rounded-full border border-border bg-card/80 px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-[0.2em] text-muted-foreground backdrop-blur sm:px-3 sm:py-1 sm:text-xs">
        VS
      </div>
    )
  }
  if (phase === "shaking") {
    return (
      <div className="rounded-full border border-accent/60 bg-accent/15 px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-[0.2em] text-accent backdrop-blur sm:px-3 sm:py-1 sm:text-xs">
        JO · KEN · PÔ
      </div>
    )
  }
  if (phase === "reveal" && result) {
    const map = {
      win: { text: "VITÓRIA", cls: "border-primary/60 bg-primary/20 text-primary" },
      lose: { text: "DERROTA", cls: "border-destructive/60 bg-destructive/20 text-destructive" },
      draw: { text: "EMPATE", cls: "border-accent/60 bg-accent/20 text-accent" },
    }[result]
    return (
      <div className={cn("slam-in rounded-md border px-2.5 py-1 font-mono text-xs font-black tracking-[0.25em] backdrop-blur sm:px-3 sm:py-1.5 sm:text-base sm:tracking-[0.3em]", map.cls)}>
        {map.text}
      </div>
    )
  }
  return null
}

/* ------------------------------------------------------------------ */
/* Choice button                                                        */
/* ------------------------------------------------------------------ */

function ChoiceButton({ move, disabled, onClick }: { move: Move; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "group relative flex min-h-[76px] flex-col items-center justify-center gap-0.5 overflow-hidden rounded-xl border-2 border-border bg-card py-2 transition sm:min-h-[110px] sm:gap-2 sm:py-4",
        "hover:border-primary hover:bg-card/80 hover:shadow-[0_0_24px_oklch(0.78_0.17_205/0.3)]",
        "active:scale-[0.95] active:border-primary active:bg-primary/15",
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:shadow-none disabled:active:scale-100",
      )}
      aria-label={`Jogar ${MOVES[move].label}`}
    >
      <div className="text-[2.5rem] leading-none transition group-hover:scale-110 sm:text-6xl" aria-hidden="true">
        {MOVES[move].emoji}
      </div>
      <div className="font-mono text-[9px] font-bold tracking-[0.22em] text-muted-foreground transition group-hover:text-primary sm:text-xs sm:tracking-[0.3em]">
        {MOVES[move].label}
      </div>
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
}: {
  offers: PowerUpId[]
  stage: number
  playerHP: number
  inventory: PowerUpId[]
  onBuy: (id: PowerUpId) => void
  onSkip: () => void
}) {
  const inventoryFull = inventory.length >= INVENTORY_LIMIT
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-4 py-4 text-center sm:gap-6">
      <div className="pop-in inline-flex items-center gap-2 rounded-md border border-accent/60 bg-accent/15 px-3 py-1 font-mono text-[10px] font-bold tracking-[0.3em] text-accent sm:text-xs">
        <Star className="size-3.5" />
        STAGE {stage} CONCLUÍDO
      </div>

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
  onRestart: () => void
}) {
  const isNewBest = stats.stageReached >= records.bestStage && stats.stageReached > 1
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
        {won ? "VITÓRIA" : "DERROTA"}
      </h2>
      <p className="mt-2 max-w-md text-pretty text-sm text-muted-foreground sm:text-base">
        Chegou ao <span className="font-bold text-foreground">Stage {stats.stageReached}</span>.{" "}
        {isNewBest ? (
          <span className="text-accent font-bold">NOVO RECORDE!</span>
        ) : (
          <span>Melhor stage: {records.bestStage}.</span>
        )}
      </p>

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
