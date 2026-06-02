# UNDERLORD — Ascensão

> *Você é o sétimo Underlord, ressuscitado depois de catorze séculos para retomar o reino de Vael'Thrand das mãos de "heróis" insuportáveis — influencers, burocratas, paladinos com posto de gasolina do pai. Comande seus minions em táticas hex turn-based. Pedra-papel-tesoura virou guerra.*

A turn-based **hex-tactics roguelike** built around an elemental rock-paper-scissors combat triangle, wrapped in a darkly comedic Brazilian-Portuguese world. Originally a v0 rock-paper-scissors prototype, expanded **hugely** into a full campaign with deep meta-progression, an endgame difficulty ladder, and a lot of lore.

Built with **Next.js 16 + React 19 + Tailwind v4**. No backend — the whole game (save, economy, progression) runs client-side in `localStorage`.

```bash
pnpm install
pnpm dev      # http://localhost:3000
pnpm build    # production build
```

---

## The game

You fight on a hex grid. Each unit gets one **move** and one **action** per turn (XCOM-style). The "rock-paper-scissors" lives in **attack kinds** + **roles** that counter each other — bring the wrong squad to the wrong fight and you lose.

- **Tactics** — `cleave`, `splash`, `pierce`, `execute`, `heal`, `curse`, `siphon`, `volley`, and the v11 additions **`rend`** (applies BLEED — flat attrition that ignores armor) and **`chain`** (lightning that arcs to the nearest second mark). Plus **shields** (absorb pools), interactive map hazards (vents, spike-pits), fire, taunts, terrain, and flying.
- **Your army** — **45 minion archetypes** across five broods, unlocked as your Underlord levels up; an on-field **Overlord** avatar with an alterable **skill loadout**; a **Forja** perk tree; roguelite **Bençãos** (boons).
- **The enemies** — **42 heroes, minibosses & bosses**, each with flavor, taunts, themed entourages, and **16 unique elite passives** (thorns, enrage, revive, summon, time-stop, regenerate, warding, colossal, volatile, split, frenzy, siphon-aura, frostbite…).
- **Loot** — hand-authored named items across six rarities up to the new **MÍTICO** (mythic) tier, with a prismatic holo treatment. Power has a price: every item carries **Taint**.
- **Economy** — Gold + **Soulshards**, a daily-rotating **Mercado Negro**, dismantling, a daily login pouch.
- **Campaign** — **83 regions** across nine biomes (ash, moor, iron, verdant, crown, tundra, dunes, abyss, and the new **VAZIO/void**), with battle objectives beyond "kill them all": *survive*, *assassinate*, *protect*, and the new **overwhelm** (blitz before the clock).

## Ascensão — endgame replayability

Beat the campaign and the real game begins. The **Ascensão** panel (war-room) lets you ramp difficulty for fatter rewards:

- **12 Ascension tiers** — each scales every enemy's HP/ATK and multiplies gold/XP/Soulshards. Win at your frontier tier to unlock the next.
- **6 Maldições (curses)** — toggleable run modifiers (tankier heroes, faster heroes, blood-for-blood ATK, the Greed pact…) that stack on top for even bigger payouts.
- **The Void act** — an eight-region finale descending the Subtorre to confront the six Void bosses: the Hollow King, the Plague-Mother, the Unwritten, the Mirror-Self, the First Underlord, and finally **THE READER**.

## Lore

The Codex (war-room) holds **11 sections / 81 entries**: the world of Vael'Thrand, the seven crowns, the full history of all **seven Underlords**, a bestiary, the influencer-industrial **Liga**, the meta-textual **Vazio**, and the factions. It's the best writing in the game; go read it.

---

## Project layout

| Path | What |
| --- | --- |
| `lib/underlord/types.ts` | The data model (units, loot, regions, objectives, save state). |
| `lib/underlord/battle.ts` | Pure, React-independent battle engine (movement, attack kinds, statuses, AI, objectives). |
| `lib/underlord/state.ts` | Phase-driven reducer + `localStorage` persistence + migrations. |
| `lib/underlord/{units,regions,maps,loot,boons,perks,overlord-skills,specials,elite-passives,meta,economy,ascension,lore}.ts` | Content + systems. |
| `lib/elementum-flavor.ts` | The hero/boss catalog + flavor. |
| `components/underlord/*` | All screens (title, war-room, battle, loot, forge, skill-map, black-market, ascension-panel, codex…). |
| `components/underlord-game.tsx` | The phase router. |

Combat is fully decoupled from React: `lib/underlord/battle.ts` is pure and unit-testable.

See [`docs/EXPANSION.md`](docs/EXPANSION.md) for the full v11 "Ascensão" changelog.

🤖 Expanded with [Claude Code](https://claude.com/claude-code).
