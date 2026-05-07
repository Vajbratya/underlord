# v9 — Design Expansion Plan

Status: PLAN. No code in this doc; only contracts, file targets, and
acceptance tests. Implementation lands in follow-up PRs.

Locked assumptions (defaults chosen pragmatically; flag means assumption
not yet validated against real playtesting):

- Hex grid + per-region MapLayout stays the spatial substrate.
- Minion roster grows breadth-first (more archetypes) before depth (per-hero
  uniques). [Unverified] — open for re-prioritization.
- Objectives compose with the existing `initBattle` flow rather than replace
  it; a region with no explicit objective still defaults to "kill all heroes".
- Soundcn samples are the source of truth for non-procedural SFX. Tones stay
  as the SSR/locked-context fallback.

---

## 1. Audit — what exists today

Inventoried from the live codebase:

- **Archetypes (24):** brown, red, green, blue, grey, bone, harpy, gorger,
  wraith, lich, behemoth, spore, oracle, ravager, wyrmling, crowlord, golem,
  gargoyle, leech, succubus, pyrelich, tidesinger, ratking, thornbeast.
  Source of truth: `lib/underlord/types.ts` `Archetype` union +
  `lib/underlord/units.ts` `UNIT_TEMPLATES`.
- **Roles (6):** basic, cleave, splash, execute, heal, pierce. Source:
  `Role` union in `types.ts`.
- **Win condition (1, hard-coded):** "Underlord dies → defeat", "all hero
  units dead → victory". Lives implicitly inside `lib/underlord/battle.ts`;
  no `objective` field on `Region`.
- **Biomes (8):** ash, moor, iron, verdant, crown, tundra, dunes, abyss.
  Source: `Region.biome` union in `types.ts`.
- **Signature maps (22):** in `SIGNATURE_MAPS` (`lib/underlord/maps.ts`).
- **Terrain kinds:** rock, pillar, tree, crystal, idol, altar, bones, wreck,
  coral, ice, dune. (Inferred from `MapLayout.obstacles[].kind`.)
- **SFX library:** `lib/elementum-sounds.ts` exports `sfx.{click, damage,
  heavyHit, rangedHit, magicHit, bomb, heal, victory, defeat, combo,
  ultimate, stageClear, shopOpen, shopBuy, bossIntro, bossLastStand, …}`.
- **SFX call sites in UI:** ONLY `components/underlord/battle.tsx`. Twelve
  components have zero audio: `title, war-room, skill-map, squad-picker,
  briefing, codex, forge, intro, loot-screen, black-market, boons-panel,
  achievement-toast, atmosphere`.

That last bullet is the single biggest miss in the current build.

---

## 2. Minion expansion — `v9.minions`

### 2a. Eight new archetypes (rounding the roster to 32)

Each archetype is a **behavior + role + counter** triplet. New archetypes
must answer "what does this make the player change?" — no skin-only adds.

| id           | role     | gimmick                                          | counters / countered by |
|--------------|----------|--------------------------------------------------|--------------------------|
| `mimic`      | basic    | Copies the highest-ATK adjacent ally on spawn.   | Counters splash; hard-countered by execute. |
| `swarm`      | cleave   | Spawns 1 dummy minion on first hit (one-shot).   | Counters execute; loses to splash. |
| `bulwark`    | pierce   | Adjacent allies take −1 damage from ranged.      | Counters grey/oracle; loses to gorger. |
| `assassin`   | execute  | +200% damage from behind (hex flanking).         | Counters lich/blue; loses to bulwark. |
| `mortar`     | splash   | Range 4, can't shoot adjacent (dead zone 1).     | Counters swarm/bone; loses to harpy. |
| `corruptor`  | basic    | Hits apply 1-turn `disarm` (target can't ATK).   | Counters ravager; loses to spore. |
| `siren`      | heal     | Heal trigger pulls one ally 1 hex toward self.   | Counters scattered formations. |
| `thresher`   | cleave   | Damage increases with adjacent enemy count.      | Counters swarm walls; loses to bulwark. |

**Files touched:** `types.ts` (union + role re-mapping if needed),
`units.ts` (templates + recruit-name pools + unlock tier), `sfx-archetype.ts`
(voices), `recruit-flash.ts` (OKLCH theme), `flavor.ts` (vignettes).

### 2b. Quantity scaling — region-side

Today every region declares `heroIds: string[]` and the engine spawns one
unit per id. Expand with two optional fields on `Region`:

```ts
encounterSize?: number          // total minions to spawn (default = heroIds.length)
swarmTemplate?: { id: string; count: number; weight?: number }[]
```

When `swarmTemplate` is present, the engine fills up to `encounterSize` by
weighted-random sampling, while `heroIds` still pins the named heroes /
elites. Lets one region say "1 named boss + 6 random ratking + 3 random
gargoyle" without exploding the `heroIds` array.

**Files touched:** `types.ts` (Region), `regions.ts` (data only), and a
new `lib/underlord/encounter.ts` that turns `(Region) → Unit[]` deterministically using `region.id` as RNG seed.

### 2c. Behavior tags — engine-side, opt-in

Add a thin `BehaviorTag` union to `Unit`:

```ts
behaviorTags?: ('flanker' | 'shield-bearer' | 'caster' | 'scavenger'
              | 'guardian' | 'ambusher')[]
```

The AI scorer in `battle.ts` already ranks moves; tag handlers add small
deltas (e.g., `flanker → +30 score for hitting the back arc`). Backwards
compatible: missing tag = vanilla AI.

**Acceptance test (manual):** spawn a `mortar` adjacent to its target; the
AI must reposition rather than fire. Spawn an `assassin` two hexes behind a
target; the AI must close.

---

## 3. Objective system — `v9.objectives`

### 3a. Contract

```ts
// lib/underlord/types.ts
export type ObjectiveId =
  | 'rout'           // (default) kill all heroes
  | 'survive'        // last N rounds; heroes win if Underlord dies
  | 'protect'        // a non-Underlord unit must live; player wins on rout
  | 'capture'        // stand on N marked tiles by end of round X
  | 'extract'        // Underlord must reach an extraction tile
  | 'assassinate'    // kill ONE specific hero — kill any other = penalty
  | 'siege'          // destroy N marked obstacles (idols/altars)
  | 'pyre'           // light all marked fires before round X

export type Objective = {
  id: ObjectiveId
  /** Optional tile annotations the engine treats specially. */
  markedTiles?: Axial[]
  /** Round budget for time-bounded objectives. */
  rounds?: number
  /** For assassinate / protect — the hero this objective points at. */
  targetUnitId?: string
}

// Region gains:
objective?: Objective
```

Default still `rout` so every existing region keeps working untouched.

### 3b. Engine integration

One pure function per objective in a new
`lib/underlord/objectives.ts`:

```ts
evaluateObjective(state: BattleState, objective: Objective):
  | { status: 'ongoing' }
  | { status: 'won'; reason: string }
  | { status: 'lost'; reason: string }
```

`battle.ts` calls it at end-of-round AFTER the existing rout check. The
existing rout shortcut is implicitly the `rout` objective.

### 3c. UI

Briefing screen (`components/underlord/briefing.tsx`) must read
`region.objective` and render an objective ribbon: icon + one-line text +
round budget (if any). If `objective.markedTiles` is non-empty, the battle
HUD paints them with a 1-px dashed accent ring (uses existing token, no
new color).

### 3d. Initial deployment plan

Don't add objectives to all 68 regions. Tag exactly these to start:

- `eternity-foyer` → `survive` 6 rounds. Boss is a wall of revives.
- `kraken-rise` (`wyrm-shelf`) → `siege` — break 3 mast pillars.
- `convoy-ambush` (`thorn-arena`) → `protect` a wagon (non-Underlord allied
  unit); rout still ends battle.
- `the-gauntlet` (`pilgrim-pass`) → `extract` to the far edge.
- `bone-orchard` (`wraith-fen`) → `assassinate` `mb-husk-king` only.
- `sandstorm-spire` (`salt-tomb`) → `capture` 2 marked tiles for 1 round.
- `frozen-confessional` (`tundra-gate`) → `pyre` light 4 marked fires.
- `buried-archive` (`royal-archives`) → `siege` destroy 4 idols.

That's 8 regions across stages 3 → 16 — enough variety to prove the system
without a giga-PR.

**Acceptance test:** All 8 regions are completable with at least 2 distinct
strategies. `rout` regions remain unchanged on save-load.

---

## 4. Map design — `v9.maps`

### 4a. Two new biomes

- **`bog`** — water-logged peat, slow-fields. New tile kind `mire` adds
  +1 movement cost and disables sprint. Visually: olive ground with damp
  highlights.
- **`ember`** — post-eruption ash with cooling lava veins. New kind
  `ember-vein` deals 1 dmg/round to anyone standing on it (Underlord
  immune; minions take half).

`Region.biome` union grows to include both. Update `PATTERNS_BY_BIOME` and
ground-tint tables.

### 4b. Six new terrain features (cross-biome)

| kind            | effect                                                          |
|-----------------|-----------------------------------------------------------------|
| `pressure-plate`| First unit to step here triggers `markedTiles` event.           |
| `ladder`        | 2-hex teleport up/down between paired tiles (XCOM 2 grappling). |
| `pit`           | Blocks movement; ranged can fire across.                        |
| `barrel`        | Destructible; explodes on damage (range 1, dmg 4).              |
| `vent`          | Shifts wind direction each round; pushes projectiles ±1 hex.    |
| `mirror`        | Reflects line-of-sight; lets a sniper see through one hex.      |

All are additive to `MapLayout.obstacles[].kind` — engine checks tag, not
shape.

### 4c. Twelve new signature maps

Targets, paired with the objectives above where applicable:

1. `flooded-courtyard` — bog, 11×15. Central pit ringed with mires.
2. `lava-bridge` — ember, 9×17. Single 1-hex-wide bridge over ember-veins.
3. `mirror-hall` — iron, 11×11. Two parallel mirror walls, 1 sniper lane.
4. `barrel-yard` — moor, 13×13. 8 barrels in a perimeter — one shot pops
   the chain.
5. `sky-platforms` — verdant, 11×17. Three floating tiers connected by
   four ladders.
6. `pressure-vault` — iron, 9×11. Four pressure-plates open the back room.
7. `fungal-bloom` — bog, 13×15. Spore clouds (mires) regenerate each round.
8. `salt-flats` — dunes, 15×11. Open board, three wind vents, no cover.
9. `kingsway` — crown, 13×17. Long royal aisle with rotating throne hex.
10. `frostmaze` — tundra, 11×13. Ice walls form a randomized maze (seeded).
11. `coral-cathedral` — abyss, 13×15. Coral pillars + ladders to a balcony.
12. `corpse-ledger` — moor, 11×17. Bones + idols around an extraction tile.

### 4d. Map metadata

Add to `MapLayout`:

```ts
markedTiles?: Axial[]              // objective annotations
extractionTiles?: Axial[]          // 'extract' objective targets
spawnHints?: { side: 'N'|'S'|'E'|'W'; preferredFor: 'player'|'enemy' }[]
```

`pickMapLayout` already deterministic; just plumb the new fields through.

**Acceptance test:** `mapId` set on a region uses its bespoke layout +
`markedTiles` overlay; missing layout falls back to biome pool with no crash.

---

## 5. Sound — `v9.audio`

### 5a. The silence inventory

Twelve UI components currently make no sound. The plan covers them all:

| component          | event                          | sound                                    |
|--------------------|--------------------------------|------------------------------------------|
| `title.tsx`        | start-game / continue          | `sfx.click` + cue `sfx.bossIntro` low    |
| `war-room.tsx`     | open / hover-region / pick     | `sfx.shopOpen`, `sfx.tick`, `sfx.click`  |
| `skill-map.tsx`    | hover edge / unlock node       | `sfx.tap`, `sfx.combo(1)`                |
| `squad-picker.tsx` | toggle slot / lock-in          | `sfx.click`, `sfx.shopBuy`               |
| `briefing.tsx`     | scroll-in / proceed            | `sfx.tick`, `sfx.click`                  |
| `codex.tsx`        | page-flip / unlock             | `sfx.tap`, `sfx.combo(2)`                |
| `forge.tsx`        | reroll / craft                 | `sfx.heavyHit`, `sfx.shopBuy`            |
| `intro.tsx`        | typewriter line / advance      | per-letter `sfx.tick`, `sfx.click`       |
| `loot-screen.tsx`  | item reveal / pick             | `sfx.combo(rarity)`, `sfx.shopBuy`       |
| `black-market.tsx` | open / buy / refuse            | `sfx.shopOpen`, `sfx.shopBuy`, `sfx.tap` |
| `boons-panel.tsx`  | hover / equip                  | `sfx.tick`, `sfx.heal`                   |
| `achievement-toast.tsx`| toast appear               | `sfx.stageClear` (low volume)            |
| `atmosphere.tsx`   | round-tick wind cue            | new `sfx.ambient(biome)`                 |

Only the **last** row needs new infra; everything else is wiring existing
events.

### 5b. Three new sfx primitives

- **`sfx.ambient(biome)`** — short biome-keyed sting (one of: tundra wind,
  abyss bubble, dunes whistle, ember crackle, bog drip). Plays at low
  volume on `setRound()` boundaries with a 1-in-3 chance, never two in a
  row. Source: soundcn samples `wind-cold-001`, `underwater-001`,
  `wind-sand-001`, `fire-crackle-001`, `bog-drip-001` (install when wiring).
- **`sfx.uiHover()`** — debounced tick (50ms cooldown). Distinct from
  `sfx.tick` so we can mute hover sounds independently in settings.
- **`sfx.uiNeg()`** — short rasp for invalid actions (locked tile, no
  funds). Currently silent — players don't know why their click did nothing.

### 5c. Settings model

Two sliders + one toggle in a small `components/underlord/audio-settings.tsx`
panel reachable from the title screen:

- Master volume (0–1, default 0.7)
- SFX volume (0–1, default 1)
- "Reduce sounds" toggle (mutes ambient + hover; keeps combat/UI critical)

Settings persist alongside the save (`lib/underlord/state.ts` `Settings`
slice). `sfx.*` reads master × sfx multiplier before each `playSound`.

**Acceptance test:** muting "Reduce sounds" silences all `ambient` + hover
calls within 1 frame; combat sounds still play.

### 5d. No-redundancy rule

Two simultaneous samples within the same 50ms window must collapse to one.
Implement a `lastFiredAt: Map<key, number>` guard inside `sfx`. Avoids the
"machine-gun click" problem when buttons re-render quickly.

---

## 6. Implementation order (lands across 4 PRs)

1. **PR-1 (audio coverage):** Wire all 12 silent components + add settings
   panel + redundancy guard. Lowest risk, biggest perceived win.
2. **PR-2 (objectives):** Add `Objective` type + `objectives.ts` + briefing
   ribbon + tag the 8 starter regions. Adds variety without new content.
3. **PR-3 (maps + biomes):** Add `bog`/`ember` biomes, 6 terrain kinds, 12
   maps. Pure data; no engine refactor.
4. **PR-4 (minions):** Add 8 archetypes, behavior tags, encounter scaling,
   AI hooks. Biggest engine surface — last so the audio + objective layers
   are stable to test against.

---

## 7. Acceptance tests (campaign-level)

- A new player can finish stage 1 without hearing a click event with no
  sound — every interactive element responds audibly.
- At least 4 of the 8 stage-3 regions present meaningfully different
  battles (different objective OR different layout OR different roster).
- Reaching stage 6 exposes the player to ≥6 unique archetypes they did not
  see in stages 1–3.
- One of the eight v9 regions is unwinnable with the previous "rush
  Underlord" strategy (forces tactical adaptation).
- Save-load preserves settings, objective progress mid-battle, and elite
  passive `passiveFired` flags across the new fields.

---

## 8. Open questions (need design call)

- Should `assassinate` count any other hero kill as a penalty (gold loss)
  or a hard fail? Default chosen: gold loss.
- Should `bog` mires apply to the Underlord too? Default: yes, Underlord is
  not exempt from terrain.
- Do we surface objective progress mid-battle as HUD text or only post-
  victory? Default: HUD chip in the top-left, mirroring round counter.
