# v12 — "A SÉTIMA TEMPORADA" expansion

Builds on v11. Focus: kill the repetition, add way more loot + bosses, and give every unit real art. Build + `tsc --noEmit` green; verified by a headless engine smoke test.

- **Presságios (battle omens)** — `lib/underlord/modifiers.ts`. Every battle rolls 1–2 random battlefield conditions (Maré de Sangue, Névoa, Frenesi, Pacto de Ferro, Chuva de Brasas, Véu Quebradiço, Gigantismo, Passos Pesados, Ira Arcana) that reshape *all* units' ATK/HP/move/range or scatter fire. Higher Ascension rolls more omens. Revealed in a slam-in banner + HUD chips. The same region now plays differently every run — the core anti-repetition fix.
- **soundcn** — pulled the sibling variation takes (`impact-metal-*-000…004`, `impact-glass-*`, `explosion-crunch-*`) from the soundcn CC0 registry (the same source the originals came from) into `lib/sounds/`, and wired **randomized sample selection + pitch jitter** into the sfx engine so hits/crits/booms never sound identical twice.
- **+12 bosses & minibosses** — a new act "A Sétima Temporada" (12 regions, stages 25–40) satirizing the games industry, ending on the superboss *Os Créditos Finais*. All use existing elite passives.
- **+55 loot** (→116 items, 20 mythic), **+13 boons** (→49), **+6 skills** (→24), **+10 achievements** (→36), **+1 codex section / +12 entries** (→12 sections).
- **Objective variety** — spread survive/overwhelm/assassinate across ~10 existing mid-game regions so battles stop feeling identical.
- **Graph repair** — fixed 12 pre-existing orphaned regions; the campaign is now **95/95 reachable**.
- **Real sprites** — generated unit/hero/boss portraits via OpenRouter **`openai/gpt-5.4-image-2`** (`scripts/gen-sprites.mts`, idempotent) so the procedural-sigil fallback is no longer needed for the new content. 45/45 minions + all heroes now have art.

---

# v11 — "ASCENSÃO" expansion

A large content + mechanics expansion of the Underlord hex-tactics roguelike. Everything below was added on top of the v10 base while keeping the production build and `tsc --noEmit` green, verified by a 34-check headless engine smoke test driving the real battle engine.

## New mechanics (engine)

- **BLEED** status — flat damage at the start of the victim's turn for N turns; ignores armor/resist and can never land the killing blow. Applied by the new `rend` attack kind, the `frostbite` elite passive, and the Overlord `rupture`/`plaguelance` skills.
- **SHIELD (absorb)** — a temp-HP pool that eats incoming damage before real HP. Granted by the Overlord `ward`/`sanctuary` skills and the `warding` elite passive.
- **`rend`** attack kind — full damage + BLEED.
- **`chain`** attack kind — full damage to the target + an arc to the *nearest other enemy within 3 hexes* (50%). Distance-based, not adjacency.
- **`overwhelm`** battle objective — rout every hero before a round limit, or instant defeat. Forces aggressive tempo.
- **MÍTICO (mythic)** loot rarity — an artifact tier above legendary, with a prismatic animated holo border, the steepest Taint, and the biggest stat spikes. Wired through drop tables, dismantle values, and the Black Market.
- **8 new elite passives** (→ 16 total): `regenerate`, `warding`, `colossal`, `volatile`, `split`, `frenzy`, `siphon-aura`, `frostbite`. Implemented across the incoming/post-damage/deal-damage/round-start hooks.
- **`void`** biome — a starless violet-black ground for the final act, with two new terrain kinds (`rift`, `obelisk`) and bespoke boss arenas.
- Completed the half-wired `region.mapId` lookup in `pickMapLayout` so bespoke signature arenas actually load.

## Ascension system (replayability)

- **`lib/underlord/ascension.ts`** — 12 difficulty tiers + 6 Maldições (curses). Folds into a single `AscensionMods` struct applied to enemy stats and reward multipliers.
- Save-safe `SaveState` fields: `ascension`, `ascensionUnlocked`, `curses` (+ daily-trial scaffolding).
- `set-ascension` reducer action; winning at your frontier tier unlocks the next; rewards (gold/XP/Soulshards) and loot quality scale with the active mods.
- New **AscensionPanel** UI + war-room button + in-battle HUD chip.

## Content

| Domain | Added | Total |
| --- | --- | --- |
| Minion archetypes | +14 | 45 |
| Heroes / minibosses / bosses | +14 | 42 |
| Regions (incl. the 16-region "Vazio" act) | +16 | 83 |
| Loot items (incl. 14 mythic) | +24 | 61 |
| Boons (incl. 3 mythic) | +16 | 36 |
| Perks (wired into the Forja helpers) | +7 | 17 |
| Overlord skills | +9 | 18 |
| Achievements | +14 | 26 |
| Codex sections / entries | +5 / +40 | 11 / 81 |
| Elite passives | +8 | 16 |

New minions lean into the new kinds: `revenant`/`gravewither` (rend/bleed), `stormcaller`/`thunderbird`/`riftcaller` (chain), plus `voidling`, `dreadnought`, `plaguelord`, `mawmother`, `seraphage`, `ironmaiden`, `warhound`, `wisp`, `dunestalker`.

The Void finale ends on **THE READER** — the meta-textual final boss in the arena "A Página Final".

## Visual layer

Prismatic mythic holo border, bleed/shield status badges in battle, an Ascension HUD chip, a combo-milestone popup, and a void aura — all additive CSS in `app/globals.css`.

## Notes for maintainers

- `lib/underlord/battle.ts` stays pure (no React); the whole expansion was unit-testable headlessly.
- Adding an archetype requires registering it in `MINION_TEMPLATES`, `RECRUIT_NAMES`, `archMinionTitle` (units.ts) and `VOICE` + `FLASH` (sfx-archetype.ts) — all exhaustive.
- Adding a biome touches `Region['biome']` (types), `MapLayout['ground']` + `GROUND_TONES` (maps), and `BIOME_COLOR`/`BIOME_LABEL` (war-room) + `BIOME` (world-map) — all exhaustive records.
