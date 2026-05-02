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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { sfx } from "@/lib/jokenpo-sounds"

type Move = "pedra" | "papel" | "tesoura"
type Result = "win" | "lose" | "draw"
type Phase = "menu" | "choosing" | "shaking" | "reveal" | "gameover"

type PowerUpId = "shield" | "crit" | "spy" | "bomb" | "lucky" | "heal"

type PowerUp = {
  id: PowerUpId
  name: string
  desc: string
  Icon: typeof Shield
  color: "primary" | "accent" | "destructive"
  instant?: boolean
}

const POWER_UPS: Record<PowerUpId, PowerUp> = {
  shield: {
    id: "shield",
    name: "ESCUDO",
    desc: "Bloqueia o próximo dano recebido.",
    Icon: Shield,
    color: "primary",
  },
  crit: {
    id: "crit",
    name: "CRÍTICO",
    desc: "Próxima vitória causa dano DOBRADO.",
    Icon: Zap,
    color: "accent",
  },
  spy: {
    id: "spy",
    name: "ESPIÃO",
    desc: "Revela a jogada da CPU antes de você escolher.",
    Icon: Eye,
    color: "primary",
  },
  bomb: {
    id: "bomb",
    name: "BOMBA",
    desc: "Causa 25 de dano instantâneo na CPU.",
    Icon: Bomb,
    color: "destructive",
    instant: true,
  },
  lucky: {
    id: "lucky",
    name: "SORTE",
    desc: "Próximo empate vira vitória.",
    Icon: Sparkles,
    color: "accent",
  },
  heal: {
    id: "heal",
    name: "CURA",
    desc: "Recupera 30 de HP imediatamente.",
    Icon: Heart,
    color: "primary",
    instant: true,
  },
}

const POWER_UP_POOL: PowerUpId[] = ["shield", "crit", "spy", "bomb", "lucky", "heal"]

const MOVES: Record<Move, { label: string; emoji: string; beats: Move }> = {
  pedra: { label: "PEDRA", emoji: "✊", beats: "tesoura" },
  papel: { label: "PAPEL", emoji: "✋", beats: "pedra" },
  tesoura: { label: "TESOURA", emoji: "✌️", beats: "papel" },
}

const MAX_HP = 100
const BASE_DAMAGE = 20
const INVENTORY_LIMIT = 3
const STREAK_FOR_DROP = 2

type Buffs = {
  shield: boolean
  crit: boolean
  spy: boolean
  lucky: boolean
}

type FloatingNumber = {
  id: number
  value: string
  side: "player" | "cpu"
  tone: "damage" | "heal" | "info"
}

type Toast = {
  id: number
  text: string
  tone: "good" | "bad" | "info"
}

function randomMove(): Move {
  const list: Move[] = ["pedra", "papel", "tesoura"]
  return list[Math.floor(Math.random() * 3)]
}

function decide(player: Move, cpu: Move): Result {
  if (player === cpu) return "draw"
  return MOVES[player].beats === cpu ? "win" : "lose"
}

function rollPowerUp(): PowerUpId {
  return POWER_UP_POOL[Math.floor(Math.random() * POWER_UP_POOL.length)]
}

export function JokenpoGame() {
  const [phase, setPhase] = useState<Phase>("menu")
  const [playerHP, setPlayerHP] = useState(MAX_HP)
  const [cpuHP, setCpuHP] = useState(MAX_HP)
  const [playerChoice, setPlayerChoice] = useState<Move | null>(null)
  const [cpuChoice, setCpuChoice] = useState<Move | null>(null)
  const [round, setRound] = useState(1)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [wins, setWins] = useState(0)
  const [losses, setLosses] = useState(0)
  const [draws, setDraws] = useState(0)
  const [inventory, setInventory] = useState<PowerUpId[]>([])
  const [buffs, setBuffs] = useState<Buffs>({ shield: false, crit: false, spy: false, lucky: false })
  const [result, setResult] = useState<Result | null>(null)
  const [floats, setFloats] = useState<FloatingNumber[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])
  const [muted, setMuted] = useState(false)
  const [spyPeek, setSpyPeek] = useState<Move | null>(null)
  const [hpFlash, setHpFlash] = useState<"player" | "cpu" | null>(null)

  const idRef = useRef(0)

  const play = useCallback(
    (sound: keyof typeof sfx) => {
      if (muted) return
      // @ts-expect-error - dynamic key dispatch
      sfx[sound]?.()
    },
    [muted],
  )

  const pushFloat = useCallback((value: string, side: "player" | "cpu", tone: FloatingNumber["tone"]) => {
    const id = ++idRef.current
    setFloats((f) => [...f, { id, value, side, tone }])
    setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 1400)
  }, [])

  const pushToast = useCallback((text: string, tone: Toast["tone"] = "info") => {
    const id = ++idRef.current
    setToasts((t) => [...t, { id, text, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2200)
  }, [])

  const flashHP = useCallback((side: "player" | "cpu") => {
    setHpFlash(side)
    setTimeout(() => setHpFlash(null), 500)
  }, [])

  const reset = useCallback(() => {
    setPlayerHP(MAX_HP)
    setCpuHP(MAX_HP)
    setPlayerChoice(null)
    setCpuChoice(null)
    setRound(1)
    setStreak(0)
    setBestStreak(0)
    setWins(0)
    setLosses(0)
    setDraws(0)
    setInventory([])
    setBuffs({ shield: false, crit: false, spy: false, lucky: false })
    setResult(null)
    setSpyPeek(null)
  }, [])

  const start = useCallback(() => {
    sfx.resume()
    reset()
    setPhase("choosing")
    play("click")
  }, [play, reset])

  // Add power-up drop, respecting inventory limit
  const dropPowerUp = useCallback(() => {
    setInventory((inv) => {
      if (inv.length >= INVENTORY_LIMIT) {
        pushToast("Inventário cheio — bônus perdido!", "bad")
        return inv
      }
      const id = rollPowerUp()
      pushToast(`POWER-UP: ${POWER_UPS[id].name}!`, "good")
      play("drop")
      return [...inv, id]
    })
  }, [play, pushToast])

  // Trigger gameover when HP hits zero
  useEffect(() => {
    if (phase === "gameover" || phase === "menu") return
    if (playerHP <= 0 || cpuHP <= 0) {
      const won = cpuHP <= 0 && playerHP > 0
      setPhase("gameover")
      setTimeout(() => (won ? play("victory") : play("defeat")), 200)
    }
  }, [playerHP, cpuHP, phase, play])

  const usePowerUp = useCallback(
    (idx: number) => {
      if (phase !== "choosing") return
      const id = inventory[idx]
      if (!id) return

      // Instant power-ups
      if (id === "bomb") {
        const dmg = 25
        setCpuHP((hp) => Math.max(0, hp - dmg))
        pushFloat(`-${dmg}`, "cpu", "damage")
        flashHP("cpu")
        play("bomb")
        pushToast("BOMBA detonada!", "good")
        setInventory((inv) => inv.filter((_, i) => i !== idx))
        return
      }
      if (id === "heal") {
        const before = playerHP
        const next = Math.min(MAX_HP, playerHP + 30)
        setPlayerHP(next)
        pushFloat(`+${next - before}`, "player", "heal")
        play("heal")
        pushToast("CURA aplicada!", "good")
        setInventory((inv) => inv.filter((_, i) => i !== idx))
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

      if (id === "spy") {
        const peek = randomMove()
        setSpyPeek(peek)
        setBuffs((b) => ({ ...b, spy: true }))
        play("powerup")
        pushToast("ESPIÃO: jogada revelada!", "good")
      } else if (id === "shield") {
        setBuffs((b) => ({ ...b, shield: true }))
        play("powerup")
        pushToast("ESCUDO ativado.", "good")
      } else if (id === "crit") {
        setBuffs((b) => ({ ...b, crit: true }))
        play("powerup")
        pushToast("CRÍTICO armado.", "good")
      } else if (id === "lucky") {
        setBuffs((b) => ({ ...b, lucky: true }))
        play("powerup")
        pushToast("SORTE ativada.", "good")
      }

      setInventory((inv) => inv.filter((_, i) => i !== idx))
    },
    [phase, inventory, buffs, playerHP, play, pushFloat, pushToast, flashHP],
  )

  const choose = useCallback(
    (move: Move) => {
      if (phase !== "choosing") return

      // If spy peek was active, lock CPU choice to peek
      const cpu = buffs.spy && spyPeek ? spyPeek : randomMove()

      setPlayerChoice(move)
      setCpuChoice(cpu)
      setPhase("shaking")
      play("click")

      // Shake/countdown phase
      let shakeCount = 0
      const shakeInterval = setInterval(() => {
        shakeCount++
        play("shake")
        if (shakeCount >= 3) clearInterval(shakeInterval)
      }, 280)

      window.setTimeout(() => {
        clearInterval(shakeInterval)
        play("reveal")
        let outcome = decide(move, cpu)

        // Apply lucky buff: draw becomes win
        let luckyConsumed = false
        if (outcome === "draw" && buffs.lucky) {
          outcome = "win"
          luckyConsumed = true
        }

        setResult(outcome)
        setPhase("reveal")

        // Resolve outcome after a beat
        window.setTimeout(() => {
          if (outcome === "win") {
            const dmg = buffs.crit ? BASE_DAMAGE * 2 : BASE_DAMAGE
            setCpuHP((hp) => Math.max(0, hp - dmg))
            pushFloat(`-${dmg}${buffs.crit ? " CRIT!" : ""}`, "cpu", "damage")
            flashHP("cpu")
            play("win")
            setWins((w) => w + 1)
            setStreak((s) => {
              const next = s + 1
              setBestStreak((b) => Math.max(b, next))
              if (next % STREAK_FOR_DROP === 0) {
                window.setTimeout(() => dropPowerUp(), 400)
              }
              return next
            })
            if (buffs.crit) setBuffs((b) => ({ ...b, crit: false }))
          } else if (outcome === "lose") {
            if (buffs.shield) {
              setBuffs((b) => ({ ...b, shield: false }))
              pushFloat("BLOCK", "player", "info")
              play("powerup")
              pushToast("Escudo absorveu o dano!", "good")
            } else {
              const dmg = BASE_DAMAGE
              setPlayerHP((hp) => Math.max(0, hp - dmg))
              pushFloat(`-${dmg}`, "player", "damage")
              flashHP("player")
              play("damage")
            }
            setLosses((l) => l + 1)
            setStreak(0)
          } else {
            // draw
            play("draw")
            setDraws((d) => d + 1)
          }

          if (luckyConsumed) {
            setBuffs((b) => ({ ...b, lucky: false }))
            pushToast("SORTE: empate virou vitória!", "good")
          }

          // Spy was for THIS round only — clear after reveal
          if (buffs.spy) {
            setBuffs((b) => ({ ...b, spy: false }))
            setSpyPeek(null)
          }

          setRound((r) => r + 1)

          // Move on after a short pause unless game just ended
          window.setTimeout(() => {
            setPlayerChoice(null)
            setCpuChoice(null)
            setResult(null)
            setPhase((p) => (p === "gameover" ? p : "choosing"))
          }, 1100)
        }, 350)
      }, 1100)
    },
    [phase, buffs, spyPeek, play, pushFloat, pushToast, dropPowerUp, flashHP],
  )

  const playerWonGame = phase === "gameover" && cpuHP <= 0 && playerHP > 0

  return (
    <div className="min-h-dvh w-full">
      {/* Scanline overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden opacity-[0.04] mix-blend-screen">
        <div
          className="absolute inset-x-0 h-px bg-primary"
          style={{ animation: "scanline 6s linear infinite" }}
        />
      </div>

      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 pt-6">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-md bg-primary/15 text-primary ring-1 ring-primary/30">
            <Swords className="size-5" />
          </div>
          <div>
            <h1 className="font-mono text-lg font-bold tracking-[0.2em] text-primary">
              JOKENPÔ
              <span className="ml-2 text-foreground/80">ARENA</span>
            </h1>
            <p className="text-xs text-muted-foreground">
              Pedra · Papel · Tesoura — com power-ups
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          className="grid size-10 place-items-center rounded-md border border-border bg-card text-muted-foreground transition hover:text-foreground"
          aria-label={muted ? "Ativar som" : "Desativar som"}
          aria-pressed={muted}
        >
          {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </button>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-6">
        {phase === "menu" ? (
          <MenuScreen onStart={start} />
        ) : phase === "gameover" ? (
          <GameOverScreen
            won={playerWonGame}
            stats={{ wins, losses, draws, bestStreak, round }}
            onRestart={start}
          />
        ) : (
          <ArenaScreen
            phase={phase}
            playerHP={playerHP}
            cpuHP={cpuHP}
            playerChoice={playerChoice}
            cpuChoice={cpuChoice}
            result={result}
            round={round}
            streak={streak}
            inventory={inventory}
            buffs={buffs}
            spyPeek={spyPeek}
            hpFlash={hpFlash}
            floats={floats}
            onChoose={choose}
            onUsePowerUp={usePowerUp}
          />
        )}
      </main>

      {/* Toasts */}
      <div className="pointer-events-none fixed inset-x-0 top-20 z-40 flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-none rounded-md border px-4 py-2 font-mono text-xs font-bold tracking-wider shadow-lg backdrop-blur",
              "slam-in",
              t.tone === "good" && "border-primary/60 bg-primary/15 text-primary",
              t.tone === "bad" && "border-destructive/60 bg-destructive/15 text-destructive",
              t.tone === "info" && "border-border bg-card/80 text-foreground",
            )}
          >
            {t.text}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------------- Sub-components ---------------- */

function MenuScreen({ onStart }: { onStart: () => void }) {
  return (
    <section className="mt-10 flex flex-col items-center text-center">
      <div className="relative">
        <div className="absolute inset-0 -z-10 blur-3xl">
          <div className="mx-auto h-40 w-80 rounded-full bg-primary/30" />
        </div>
        <h2 className="font-mono text-5xl font-black leading-none tracking-tighter text-balance sm:text-7xl">
          <span className="text-primary">PEDRA</span>
          <span className="text-foreground">.</span>
          <span className="text-accent">PAPEL</span>
          <span className="text-foreground">.</span>
          <span className="text-destructive">TESOURA</span>
        </h2>
      </div>

      <p className="mt-6 max-w-xl text-pretty text-base text-muted-foreground">
        Não é o jokenpô do recreio. Sistema de HP, sequências, escudos, críticos
        e bombas. Vença a CPU antes que ela vença você.
      </p>

      <button
        type="button"
        onClick={onStart}
        className="pulse-glow group mt-10 inline-flex items-center gap-3 rounded-md bg-primary px-8 py-4 font-mono text-lg font-black tracking-[0.2em] text-primary-foreground shadow-[0_0_30px_oklch(0.78_0.17_205/0.4)] transition hover:scale-[1.02]"
      >
        <Swords className="size-5 transition group-hover:rotate-12" />
        COMEÇAR
      </button>

      <div className="mt-14 grid w-full max-w-4xl grid-cols-1 gap-3 sm:grid-cols-3">
        <FeatureCard
          icon={Shield}
          title="HP & Streak"
          desc="100 HP cada lado. Cada vitória tira 20. Sequências liberam bônus."
        />
        <FeatureCard
          icon={Zap}
          title="6 Power-Ups"
          desc="Escudo, crítico, espião, bomba, sorte e cura. Use a hora certa."
        />
        <FeatureCard
          icon={Trophy}
          title="Arena Sem Pena"
          desc="HP zera, alguém morre. Reinício em um clique. Ranking da run."
        />
      </div>

      <PowerUpLegend />
    </section>
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
    <div className="rounded-lg border border-border bg-card/60 p-5 text-left backdrop-blur">
      <div className="mb-3 grid size-9 place-items-center rounded-md bg-primary/15 text-primary ring-1 ring-primary/30">
        <Icon className="size-4" />
      </div>
      <h3 className="font-mono text-sm font-bold tracking-wider">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  )
}

function PowerUpLegend() {
  return (
    <div className="mt-10 w-full max-w-4xl">
      <p className="mb-3 font-mono text-xs font-bold tracking-[0.3em] text-muted-foreground">
        ARSENAL
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {POWER_UP_POOL.map((id) => {
          const p = POWER_UPS[id]
          return (
            <div
              key={id}
              className="flex items-start gap-3 rounded-md border border-border bg-card/40 p-3 text-left"
            >
              <PowerUpIcon power={p} size="sm" />
              <div className="min-w-0">
                <div className="font-mono text-xs font-bold tracking-wider">{p.name}</div>
                <div className="text-xs leading-relaxed text-muted-foreground">{p.desc}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PowerUpIcon({
  power,
  size = "md",
  active = false,
}: {
  power: PowerUp
  size?: "sm" | "md" | "lg"
  active?: boolean
}) {
  const sizing =
    size === "sm" ? "size-8" : size === "lg" ? "size-14" : "size-11"
  const iconSize =
    size === "sm" ? "size-4" : size === "lg" ? "size-6" : "size-5"
  const colorClasses =
    power.color === "primary"
      ? "bg-primary/15 text-primary ring-primary/40"
      : power.color === "accent"
        ? "bg-accent/15 text-accent ring-accent/40"
        : "bg-destructive/15 text-destructive ring-destructive/40"
  const Icon = power.Icon
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center rounded-md ring-1 transition",
        sizing,
        colorClasses,
        active && "pulse-glow",
      )}
    >
      <Icon className={iconSize} />
    </div>
  )
}

function ArenaScreen({
  phase,
  playerHP,
  cpuHP,
  playerChoice,
  cpuChoice,
  result,
  round,
  streak,
  inventory,
  buffs,
  spyPeek,
  hpFlash,
  floats,
  onChoose,
  onUsePowerUp,
}: {
  phase: Phase
  playerHP: number
  cpuHP: number
  playerChoice: Move | null
  cpuChoice: Move | null
  result: Result | null
  round: number
  streak: number
  inventory: PowerUpId[]
  buffs: Buffs
  spyPeek: Move | null
  hpFlash: "player" | "cpu" | null
  floats: FloatingNumber[]
  onChoose: (m: Move) => void
  onUsePowerUp: (i: number) => void
}) {
  const canChoose = phase === "choosing"

  return (
    <section className="space-y-6">
      {/* Status Bar */}
      <div className="grid grid-cols-3 items-center gap-3">
        <Stat label="ROUND" value={String(round).padStart(2, "0")} />
        <Stat label="STREAK" value={`x${streak}`} highlight={streak >= 2} />
        <Stat
          label="BUFFS"
          value={
            [
              buffs.shield && "🛡",
              buffs.crit && "⚡",
              buffs.spy && "👁",
              buffs.lucky && "✦",
            ]
              .filter(Boolean)
              .join(" ") || "—"
          }
        />
      </div>

      {/* HP Bars */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        <HPBar
          name="VOCÊ"
          hp={playerHP}
          align="left"
          flash={hpFlash === "player"}
        />
        <HPBar name="CPU" hp={cpuHP} align="right" flash={hpFlash === "cpu"} />
      </div>

      {/* Battle Stage */}
      <div
        className={cn(
          "relative grid grid-cols-2 items-center gap-4 overflow-hidden rounded-xl border border-border bg-card/40 p-4 backdrop-blur sm:p-8",
          phase === "shaking" && "flash-damage",
        )}
      >
        <BattleSide
          side="player"
          phase={phase}
          choice={playerChoice}
          result={result}
          floats={floats.filter((f) => f.side === "player")}
        />
        <BattleSide
          side="cpu"
          phase={phase}
          choice={cpuChoice}
          result={result}
          floats={floats.filter((f) => f.side === "cpu")}
        />

        {/* VS / Result badge */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <ResultBadge phase={phase} result={result} />
        </div>

        {/* Spy peek hint */}
        {spyPeek && phase === "choosing" ? (
          <div className="absolute inset-x-0 bottom-2 mx-auto w-fit rounded-md border border-accent/60 bg-accent/15 px-3 py-1 font-mono text-xs font-bold tracking-wider text-accent">
            ESPIÃO: CPU vai jogar {MOVES[spyPeek].label}
          </div>
        ) : null}
      </div>

      {/* Inventory */}
      <Inventory
        inventory={inventory}
        buffs={buffs}
        disabled={!canChoose}
        onUse={onUsePowerUp}
      />

      {/* Choice Buttons */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {(["pedra", "papel", "tesoura"] as Move[]).map((m) => (
          <ChoiceButton
            key={m}
            move={m}
            disabled={!canChoose}
            onClick={() => onChoose(m)}
          />
        ))}
      </div>
    </section>
  )
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="rounded-md border border-border bg-card/60 px-3 py-2 text-center backdrop-blur">
      <div className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "font-mono text-base font-bold tabular-nums",
          highlight ? "text-accent" : "text-foreground",
        )}
      >
        {value}
      </div>
    </div>
  )
}

function HPBar({
  name,
  hp,
  align,
  flash,
}: {
  name: string
  hp: number
  align: "left" | "right"
  flash: boolean
}) {
  const pct = Math.max(0, Math.min(100, (hp / MAX_HP) * 100))
  const tone =
    hp > 60 ? "primary" : hp > 30 ? "accent" : "destructive"
  const toneClass =
    tone === "primary"
      ? "bg-primary"
      : tone === "accent"
        ? "bg-accent"
        : "bg-destructive"
  return (
    <div
      className={cn(
        "rounded-md border border-border bg-card/60 p-3 backdrop-blur",
        flash && "flash-damage",
      )}
    >
      <div
        className={cn(
          "mb-2 flex items-baseline justify-between gap-2 font-mono",
          align === "right" && "flex-row-reverse",
        )}
      >
        <span className="text-xs font-bold tracking-[0.2em] text-muted-foreground">
          {name}
        </span>
        <span className="text-sm font-bold tabular-nums">
          {hp}
          <span className="text-muted-foreground">/{MAX_HP}</span>
        </span>
      </div>
      <div
        className={cn(
          "h-3 overflow-hidden rounded-full bg-secondary",
          align === "right" && "rotate-180",
        )}
      >
        <div
          className={cn("h-full transition-[width] duration-500 ease-out", toneClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function BattleSide({
  side,
  phase,
  choice,
  result,
  floats,
}: {
  side: "player" | "cpu"
  phase: Phase
  choice: Move | null
  result: Result | null
  floats: FloatingNumber[]
}) {
  const isShaking = phase === "shaking"
  const isReveal = phase === "reveal"
  const sideResult: Result | null =
    !result ? null : side === "player" ? result : result === "win" ? "lose" : result === "lose" ? "win" : "draw"

  const ringTone =
    isReveal && sideResult === "win"
      ? "ring-primary shadow-[0_0_30px_oklch(0.78_0.17_205/0.4)]"
      : isReveal && sideResult === "lose"
        ? "ring-destructive shadow-[0_0_30px_oklch(0.66_0.24_22/0.4)]"
        : isReveal && sideResult === "draw"
          ? "ring-accent"
          : "ring-border"

  return (
    <div
      className={cn(
        "relative flex aspect-square min-h-[180px] flex-col items-center justify-center rounded-lg bg-background/60 ring-2 transition",
        ringTone,
      )}
    >
      <div className="font-mono text-[10px] font-bold tracking-[0.3em] text-muted-foreground">
        {side === "player" ? "VOCÊ" : "CPU"}
      </div>

      <div className="relative mt-2 grid place-items-center">
        <div
          className={cn(
            "select-none text-7xl leading-none sm:text-8xl",
            isShaking && "shake-hand",
            isReveal && "slam-in",
          )}
          aria-hidden="true"
        >
          {isShaking || (!choice && phase === "choosing")
            ? "✊"
            : choice
              ? MOVES[choice].emoji
              : "✊"}
        </div>

        {/* Floating numbers */}
        {floats.map((f) => (
          <span
            key={f.id}
            className={cn(
              "pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 font-mono text-2xl font-black tabular-nums",
              "float-up",
              f.tone === "damage" && "text-destructive",
              f.tone === "heal" && "text-primary",
              f.tone === "info" && "text-accent",
            )}
          >
            {f.value}
          </span>
        ))}
      </div>

      {choice && (isReveal || isShaking) ? (
        <div className="mt-2 font-mono text-xs font-bold tracking-[0.2em] text-foreground/80">
          {isShaking ? "..." : MOVES[choice].label}
        </div>
      ) : (
        <div className="mt-2 font-mono text-xs tracking-[0.2em] text-muted-foreground">
          {phase === "choosing" && side === "player" ? "ESCOLHA" : "AGUARDA"}
        </div>
      )}
    </div>
  )
}

function ResultBadge({ phase, result }: { phase: Phase; result: Result | null }) {
  if (phase === "choosing") {
    return (
      <div className="rounded-full border border-border bg-card/80 px-3 py-1 font-mono text-xs font-bold tracking-[0.2em] text-muted-foreground backdrop-blur">
        VS
      </div>
    )
  }
  if (phase === "shaking") {
    return (
      <div className="rounded-full border border-accent/60 bg-accent/15 px-3 py-1 font-mono text-xs font-bold tracking-[0.2em] text-accent backdrop-blur">
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
      <div
        className={cn(
          "slam-in rounded-md border px-4 py-2 font-mono text-base font-black tracking-[0.3em] backdrop-blur",
          map.cls,
        )}
      >
        {map.text}
      </div>
    )
  }
  return null
}

function ChoiceButton({
  move,
  disabled,
  onClick,
}: {
  move: Move
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-lg border-2 border-border bg-card p-4 transition",
        "hover:-translate-y-1 hover:border-primary hover:bg-card/80 hover:shadow-[0_0_30px_oklch(0.78_0.17_205/0.3)]",
        "active:translate-y-0",
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:border-border disabled:hover:shadow-none",
      )}
      aria-label={`Jogar ${MOVES[move].label}`}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="text-5xl leading-none transition group-hover:scale-110 sm:text-6xl" aria-hidden="true">
          {MOVES[move].emoji}
        </div>
        <div className="font-mono text-xs font-bold tracking-[0.3em] text-muted-foreground transition group-hover:text-primary">
          {MOVES[move].label}
        </div>
      </div>
    </button>
  )
}

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

  return (
    <div className="rounded-lg border border-border bg-card/40 p-3 backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[10px] font-bold tracking-[0.3em] text-muted-foreground">
          INVENTÁRIO
        </span>
        <span className="font-mono text-[10px] tracking-wider text-muted-foreground">
          {inventory.length}/{INVENTORY_LIMIT}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
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
                (id === "lucky" && buffs.lucky)
              }
            />
          ) : (
            <div
              key={i}
              className="grid h-16 place-items-center rounded-md border border-dashed border-border/60 text-xs text-muted-foreground/60"
            >
              vazio
            </div>
          ),
        )}
      </div>
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
  return (
    <button
      type="button"
      onClick={onUse}
      disabled={disabled}
      title={power.desc}
      className={cn(
        "group flex h-16 items-center gap-2 rounded-md border bg-background/60 px-2 transition",
        "hover:-translate-y-0.5 hover:border-foreground/40",
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0",
        power.color === "primary" && "border-primary/40",
        power.color === "accent" && "border-accent/40",
        power.color === "destructive" && "border-destructive/40",
      )}
      aria-label={`Usar ${power.name}`}
    >
      <PowerUpIcon power={power} size="md" active={isActiveBuff} />
      <div className="min-w-0 text-left">
        <div className="truncate font-mono text-[11px] font-bold tracking-wider">
          {power.name}
        </div>
        <div className="truncate text-[10px] text-muted-foreground">
          {power.instant ? "instantâneo" : isActiveBuff ? "ativo" : "tocar p/ usar"}
        </div>
      </div>
    </button>
  )
}

function GameOverScreen({
  won,
  stats,
  onRestart,
}: {
  won: boolean
  stats: { wins: number; losses: number; draws: number; bestStreak: number; round: number }
  onRestart: () => void
}) {
  return (
    <section className="mt-10 flex flex-col items-center text-center">
      <div
        className={cn(
          "slam-in mb-6 grid size-20 place-items-center rounded-full ring-4",
          won
            ? "bg-primary/15 text-primary ring-primary/40"
            : "bg-destructive/15 text-destructive ring-destructive/40",
        )}
      >
        {won ? <Trophy className="size-10" /> : <Skull className="size-10" />}
      </div>
      <h2
        className={cn(
          "font-mono text-5xl font-black tracking-tighter sm:text-6xl",
          won ? "text-primary" : "text-destructive",
        )}
      >
        {won ? "VITÓRIA" : "DERROTA"}
      </h2>
      <p className="mt-3 max-w-md text-pretty text-muted-foreground">
        {won
          ? "Você dominou a arena. A CPU está em pedaços. Mais uma run?"
          : "A CPU não perdoou. Respira, reorganiza a estratégia, volta."}
      </p>

      <div className="mt-8 grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
        <ResultStat label="VITÓRIAS" value={stats.wins} tone="primary" />
        <ResultStat label="DERROTAS" value={stats.losses} tone="destructive" />
        <ResultStat label="EMPATES" value={stats.draws} tone="accent" />
        <ResultStat label="MELHOR STREAK" value={stats.bestStreak} tone="accent" />
      </div>

      <button
        type="button"
        onClick={onRestart}
        className="pulse-glow mt-10 inline-flex items-center gap-3 rounded-md bg-primary px-8 py-4 font-mono text-base font-black tracking-[0.2em] text-primary-foreground transition hover:scale-[1.02]"
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
  const cls =
    tone === "primary"
      ? "text-primary"
      : tone === "destructive"
        ? "text-destructive"
        : "text-accent"
  return (
    <div className="rounded-lg border border-border bg-card/60 p-4 backdrop-blur">
      <div className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground">
        {label}
      </div>
      <div className={cn("mt-1 font-mono text-3xl font-black tabular-nums", cls)}>
        {value}
      </div>
    </div>
  )
}
