"use client"

/**
 * HeroPortrait — single source of truth for rendering a hero / elite
 * portrait with a graceful fallback.
 *
 * Why this exists:
 *   The codebase had 6 places building `/images/heroes/${id}.jpg`
 *   directly in JSX. When the underlying asset is missing — true for
 *   every miniboss / final-boss id — the browser shows the default
 *   broken-image icon. That breaks immersion in briefing, war-room,
 *   loot, and the battle HUD.
 *
 * What it does:
 *   - Renders next/image when an asset is available.
 *   - On `onError` (404), swaps to a deterministic tonal sigil card
 *     built from the hero name's first 2 letters. The sigil colour is
 *     hashed from the id, so the same hero always looks the same.
 *   - The sigil reads as a heraldic placeholder (gradient + shield
 *     glyph) — readable at every used size from 24px to 320px.
 */

import Image from "next/image"
import { useState } from "react"
import { cn } from "@/lib/utils"

/** Build a stable hue (0-360) from any string id. Same id → same hue. */
function hashHue(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0
  }
  // Cycle in increments of 47 so adjacent IDs in the alphabet don't
  // produce visually identical sigils.
  return ((h % 360) + 360 + (seed.length * 47)) % 360
}

/** Strip the last 1–2 grapheme clusters down to clean uppercase initials. */
function initialsOf(name: string): string {
  // Drop articles ("O ", "A ", "OS ", "AS ") so REI-CASCA → RC, not OR.
  const cleaned = name.replace(/^(O|A|OS|AS)\s+/i, "").trim()
  // Pull initials from up to two words; if a single word, take first
  // two letters so we never end up with a single character.
  const words = cleaned.split(/[\s-]+/).filter(Boolean)
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  return cleaned.slice(0, 2).toUpperCase() || "??"
}

type Variant = "elite" | "hero"

export function HeroPortrait({
  id,
  name,
  src,
  sizes,
  variant = "hero",
  className,
  rounded = false,
}: {
  /** Stable hero id used both for the asset path and the sigil hue. */
  id: string
  /** Display name — drives the sigil initials and alt text. */
  name: string
  /** Optional explicit asset path. Defaults to `/images/heroes/{id}.jpg`. */
  src?: string
  /** next/image `sizes` hint. */
  sizes?: string
  /** "elite" tints the fallback red (miniboss/boss); "hero" uses the
   * id-hashed hue. */
  variant?: Variant
  className?: string
  /** Pass true for circular (entourage) tiles. */
  rounded?: boolean
}) {
  const [errored, setErrored] = useState(false)
  const path = src ?? `/images/heroes/${id}.jpg`

  if (!errored) {
    return (
      <Image
        src={path || "/placeholder.svg"}
        alt={name}
        fill
        sizes={sizes}
        className={cn("object-cover", className)}
        // Browsers fire onError for 404s; we swap to the sigil. We do
        // NOT log here — missing portraits are expected for the elite
        // cast until their assets ship.
        onError={() => setErrored(true)}
      />
    )
  }

  // ---- Sigil fallback ---------------------------------------------
  const hue = variant === "elite" ? 18 : hashHue(id)
  // Two-stop gradient: a dark tonal base into a brighter rim. Picks
  // values that read as parchment-painted heraldry rather than UI.
  const bg = `radial-gradient(ellipse at 50% 35%, oklch(0.42 0.18 ${hue}) 0%, oklch(0.18 0.08 ${hue}) 70%, oklch(0.12 0.04 ${hue}) 100%)`
  const initials = initialsOf(name)

  return (
    <div
      role="img"
      aria-label={name}
      className={cn(
        "relative flex size-full items-center justify-center overflow-hidden",
        rounded ? "rounded-full" : "",
        className,
      )}
      style={{
        background: bg,
        // Establishes a size-container so the initials below can scale
        // off the parent dimensions with cq* units. Required for the
        // single component to render legibly at 24px and 320px alike.
        containerType: "size",
      }}
    >
      {/* Decorative diagonal slashes — heraldic chevron feel. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, oklch(1 0 0 / 0.18) 0 1px, transparent 1px 8px)",
        }}
      />
      {/* Center sigil */}
      <span
        className="relative font-display font-black uppercase leading-none tracking-tight text-foreground/95"
        style={{
          // Scales with parent; keeps initials readable at 24px AND 320px.
          fontSize: "min(48cqw, 48cqh)",
          textShadow: "0 1px 0 oklch(0 0 0 / 0.6), 0 0 8px oklch(0 0 0 / 0.4)",
        }}
      >
        {initials}
      </span>
      {/* Bottom edge dim so the disc reads as 3D, like the live
          portraits which have natural light fall-off. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
        style={{
          background:
            "linear-gradient(to bottom, transparent, oklch(0 0 0 / 0.45))",
        }}
      />
    </div>
  )
}
