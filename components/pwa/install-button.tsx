"use client"

import { useEffect, useState } from "react"
import { Download, Smartphone } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * BeforeInstallPromptEvent isn't in lib.dom yet — declare the bits we use.
 * It's the event Chromium fires when the PWA install criteria are met
 * (HTTPS, manifest with valid icons, service worker registered).
 */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

/**
 * Install-to-home-screen button.
 *
 * Behavior:
 *  - On Android Chrome / Edge / Samsung Internet, intercepts the native
 *    `beforeinstallprompt` event so we control WHERE the prompt fires
 *    (player taps INSTALAR, not a random banner).
 *  - On iOS Safari there's no programmatic prompt — Apple requires the
 *    user to use Share → Add to Home Screen. We detect iOS and render an
 *    inline hint instead of a button.
 *  - Once the app is installed (display-mode: standalone), the button
 *    disappears entirely — no point showing it inside the installed app.
 *
 * The variant prop lets the same button drop into the title screen
 * (compact pill) or a settings panel (full button).
 */
export function InstallButton({
  variant = "pill",
  className,
}: {
  variant?: "pill" | "block"
  className?: string
}) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  )
  const [isStandalone, setIsStandalone] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [showIosHint, setShowIosHint] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    // Already installed? Either we launched as a PWA OR Safari reports it.
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error — Safari-only legacy field.
      window.navigator.standalone === true
    setIsStandalone(standalone)

    // Detect iOS so we can swap to a hint card (no programmatic install).
    const ua = window.navigator.userAgent
    const ios = /iPhone|iPad|iPod/i.test(ua) && !/CriOS|FxiOS/i.test(ua)
    setIsIos(ios)

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    window.addEventListener("beforeinstallprompt", handler)
    const installed = () => {
      setIsStandalone(true)
      setDeferred(null)
    }
    window.addEventListener("appinstalled", installed)
    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
      window.removeEventListener("appinstalled", installed)
    }
  }, [])

  // Hidden inside the installed PWA — no point self-promoting.
  if (isStandalone) return null

  // iOS: show hint button that toggles a small instructions popover.
  if (isIos) {
    return (
      <div className={cn("relative inline-flex flex-col", className)}>
        <button
          type="button"
          onClick={() => setShowIosHint((v) => !v)}
          className={cn(
            "inline-flex items-center justify-center gap-1.5 rounded-md border-2 border-accent/70 bg-accent/15 font-display font-black uppercase tracking-[0.2em] text-accent transition active:scale-[0.97]",
            variant === "pill"
              ? "px-3 py-2 text-[11px]"
              : "px-5 py-3 text-sm",
          )}
        >
          <Smartphone className="size-3.5" />
          INSTALAR NO IPHONE
        </button>
        {showIosHint ? (
          <div className="absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-md border-2 border-border bg-card p-3 text-left shadow-xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
              Adicionar à Tela de Início
            </p>
            <ol className="mt-2 list-decimal space-y-1 pl-4 text-[11px] leading-snug text-foreground/85">
              <li>Toque no botão Compartilhar do Safari.</li>
              <li>Role e escolha &ldquo;Adicionar à Tela de Início&rdquo;.</li>
              <li>Confirme. O ícone vai aparecer entre seus apps.</li>
            </ol>
          </div>
        ) : null}
      </div>
    )
  }

  // Android/desktop Chromium: only render once the browser said the app
  // is installable (it fired beforeinstallprompt). Otherwise the button
  // would do nothing on tap, which is worse than not existing.
  if (!deferred) return null

  return (
    <button
      type="button"
      onClick={async () => {
        const ev = deferred
        if (!ev) return
        try {
          await ev.prompt()
          await ev.userChoice
        } finally {
          setDeferred(null)
        }
      }}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-md border-2 border-accent/70 bg-accent/15 font-display font-black uppercase tracking-[0.2em] text-accent transition active:scale-[0.97] hover:bg-accent/25",
        variant === "pill"
          ? "px-3 py-2 text-[11px]"
          : "px-5 py-3 text-sm",
        className,
      )}
    >
      <Download className="size-3.5" />
      INSTALAR APP
    </button>
  )
}
