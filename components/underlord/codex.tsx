"use client"

import { useState } from "react"
import { ChevronLeft, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { CODEX_SECTIONS } from "@/lib/underlord/lore"

/**
 * Codex — full-screen, swipeable lore archive.
 *
 * Layout choices for mobile-first:
 *  - Two-pane: left = section tabs (vertical strip, scrollable), right =
 *    entry list + open entry. On phones (<sm) the section tabs collapse
 *    into a horizontal scroller above the entry list to free vertical space.
 *  - Each entry opens in-pane (no nested modal). A back button returns to
 *    the entry list. Avoids router state and history-stack confusion.
 *  - Body paragraphs render with `whitespace-pre-wrap` and split on \n\n
 *    so writers can lay out paragraphs naturally in lore.ts.
 */
export function Codex({ onClose }: { onClose: () => void }) {
  const [sectionId, setSectionId] = useState(CODEX_SECTIONS[0].id)
  const [entryId, setEntryId] = useState<string | null>(null)

  const section =
    CODEX_SECTIONS.find((s) => s.id === sectionId) ?? CODEX_SECTIONS[0]
  const entry = entryId
    ? section.entries.find((e) => e.id === entryId) ?? null
    : null

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-background pb-safe pt-safe"
      role="dialog"
      aria-modal="true"
      aria-label="Códex"
    >
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex flex-col">
          <span className="font-mono text-[9px] uppercase tracking-[0.32em] text-accent sm:text-[10px]">
            VAEL&apos;THRAND · CÓDEX 814
          </span>
          <h1 className="font-display text-lg font-black uppercase leading-none tracking-tight text-foreground sm:text-xl">
            Arquivo da Subtorre
          </h1>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar códex"
          className="flex size-9 items-center justify-center rounded-md border border-border bg-card/70 text-muted-foreground transition active:scale-95 hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </header>

      {/* Section tabs — horizontal on mobile, vertical column on >=sm */}
      <nav
        className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-border/60 bg-background/80 px-3 py-2 sm:hidden"
        aria-label="Seções"
      >
        {CODEX_SECTIONS.map((s) => {
          const active = s.id === sectionId
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setSectionId(s.id)
                setEntryId(null)
              }}
              className={cn(
                "shrink-0 rounded-sm border-2 px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-[0.18em] transition",
                active
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border bg-card/60 text-muted-foreground",
              )}
            >
              {s.label}
            </button>
          )
        })}
      </nav>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar — desktop only */}
        <aside className="hidden w-52 shrink-0 overflow-y-auto border-r border-border/60 bg-card/40 px-3 py-4 sm:block">
          <ul className="flex flex-col gap-1">
            {CODEX_SECTIONS.map((s) => {
              const active = s.id === sectionId
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSectionId(s.id)
                      setEntryId(null)
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md border-2 px-3 py-2 text-left font-mono text-[10px] font-black uppercase tracking-[0.18em] transition",
                      active
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-transparent text-muted-foreground hover:border-border hover:bg-card/60 hover:text-foreground",
                    )}
                  >
                    {s.label}
                    <span className="font-display text-[10px] tabular-nums opacity-60">
                      {s.entries.length}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </aside>

        {/* Main pane: entry list OR open entry */}
        <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-8 sm:py-6">
          {entry ? (
            <article className="mx-auto max-w-2xl">
              <button
                type="button"
                onClick={() => setEntryId(null)}
                className="mb-4 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground transition hover:text-foreground"
              >
                <ChevronLeft className="size-3.5" />
                {section.label}
              </button>
              <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-accent">
                {section.label}
              </p>
              <h2 className="mt-1 font-display text-2xl font-black uppercase leading-tight text-foreground sm:text-3xl">
                {entry.title}
              </h2>
              {entry.subtitle ? (
                <p className="mt-1 font-mono text-xs uppercase tracking-[0.16em] text-foreground/70">
                  {entry.subtitle}
                </p>
              ) : null}
              <div className="mt-5 flex flex-col gap-3.5 text-pretty text-[15px] leading-relaxed text-foreground/90 sm:gap-4 sm:text-base">
                {entry.body.split("\n\n").map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              <div className="mt-8 flex items-center gap-2 opacity-60">
                <span className="h-px flex-1 bg-border" />
                <span className="size-1 rotate-45 bg-accent" />
                <span className="h-px flex-1 bg-border" />
              </div>
            </article>
          ) : (
            <div className="mx-auto max-w-2xl">
              <header className="mb-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-accent">
                  {section.label}
                </p>
                <h2 className="mt-1 font-display text-xl font-black uppercase leading-tight text-foreground sm:text-2xl">
                  {section.blurb}
                </h2>
              </header>
              <ul className="flex flex-col gap-2">
                {section.entries.map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => setEntryId(e.id)}
                      className="flex w-full flex-col gap-1 rounded-lg border-2 border-border bg-card/60 px-4 py-3 text-left transition active:scale-[0.99] hover:border-foreground/60 hover:bg-card sm:px-5 sm:py-4"
                    >
                      <span className="font-display text-base font-black uppercase leading-tight tracking-tight text-foreground sm:text-lg">
                        {e.title}
                      </span>
                      {e.subtitle ? (
                        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                          {e.subtitle}
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
