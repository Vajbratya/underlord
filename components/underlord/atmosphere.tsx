"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

/**
 * Cinematic atmosphere layer used as the first child of every screen.
 *
 * Layers (back-to-front):
 *   1. Painted background image (priority)
 *   2. Radial vignette + bottom fade so UI sits readable on any contrast
 *   3. Optional ember particle field (CSS keyframes only, no JS ticker)
 *   4. Subtle film-grain texture
 *
 * Everything is `pointer-events-none` so it never blocks taps.
 */
export function Atmosphere({
  src,
  intensity = "default",
  embers = 18,
  className,
}: {
  src: string
  intensity?: "subtle" | "default" | "heavy"
  embers?: number
  className?: string
}) {
  const dim =
    intensity === "subtle" ? 0.78 : intensity === "heavy" ? 0.42 : 0.6
  const vignetteEdge =
    intensity === "subtle"
      ? "oklch(0.10 0.012 22 / 0.55)"
      : intensity === "heavy"
        ? "oklch(0.10 0.012 22 / 0.98)"
        : "oklch(0.10 0.012 22 / 0.85)"

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      {/* Painted background */}
      <Image
        src={src}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
        style={{ opacity: dim }}
      />

      {/* Radial vignette: dark at edges, transparent at center */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 90% 60% at 50% 40%, transparent 0%, oklch(0.10 0.012 22 / 0.10) 50%, ${vignetteEdge} 100%)`,
        }}
      />

      {/* Bottom fade — guarantees footer text legibility */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background via-background/70 to-transparent" />
      {/* Top fade — guarantees header text legibility */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background/85 via-background/40 to-transparent" />

      {/* Ember particles */}
      {Array.from({ length: embers }).map((_, i) => {
        const left = (i * 6.7 + (i % 3) * 2.3) % 100
        const delay = (i * 0.7) % 9
        const duration = 7 + (i % 5) * 1.4
        const drift = (i % 2 === 0 ? -1 : 1) * (8 + (i % 5) * 6)
        const size = i % 7 === 0 ? 3 : i % 3 === 0 ? 2 : 1
        const isAccent = i % 3 === 0
        return (
          <span
            key={i}
            className={cn(
              "ember-rise absolute rounded-full",
              isAccent ? "bg-accent" : "bg-primary",
            )}
            style={{
              left: `${left}%`,
              bottom: 0,
              width: `${size}px`,
              height: `${size}px`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              ["--drift" as string]: `${drift}px`,
              opacity: isAccent ? 0.85 : 0.55,
              filter: isAccent ? "drop-shadow(0 0 4px var(--accent))" : undefined,
            }}
          />
        )
      })}

      {/* Film grain texture */}
      <div
        className="absolute inset-0 opacity-[0.18] mix-blend-overlay"
        style={{
          backgroundImage:
            "repeating-radial-gradient(circle at 30% 40%, oklch(1 0 0 / 0.06) 0px, transparent 1px, transparent 3px), repeating-radial-gradient(circle at 70% 60%, oklch(0 0 0 / 0.10) 0px, transparent 1px, transparent 3px)",
          backgroundSize: "5px 5px, 7px 7px",
        }}
      />
    </div>
  )
}

/**
 * Decorative corner ornament — a forged-iron right-angle bracket used to
 * frame cards / panels. Cheap pure-CSS, no SVG, no images.
 */
export function CornerOrnament({
  position = "tl",
  className,
}: {
  position?: "tl" | "tr" | "bl" | "br"
  className?: string
}) {
  const pos: Record<typeof position, string> = {
    tl: "top-0 left-0 border-l-2 border-t-2",
    tr: "top-0 right-0 border-r-2 border-t-2",
    bl: "bottom-0 left-0 border-l-2 border-b-2",
    br: "bottom-0 right-0 border-r-2 border-b-2",
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute size-3 border-accent/70",
        pos[position],
        className,
      )}
    />
  )
}

/** Wraps content in a vellum panel with iron-forged corners. */
export function ForgedPanel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("relative", className)}>
      <CornerOrnament position="tl" />
      <CornerOrnament position="tr" />
      <CornerOrnament position="bl" />
      <CornerOrnament position="br" />
      {children}
    </div>
  )
}
