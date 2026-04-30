# Rollin' Tanks — Full Redesign Spec

**Date:** 2026-04-30
**Author:** Claude (autonomous, user requested "do it all without asking")
**Goal:** Take the existing partially-finished retro tank game from "looks like a web app pretending to be retro" to "actual game" — fix all dead points, complete all half-finished work, add features that the game obviously needs, and ship a polished playable build.

## Problem statement

The repo has a working multiplayer skeleton (Next.js + WebSocket server) and a half-finished retro pixel-art reskin. Two prior design docs in `docs/plans/` planned a battle-scene overhaul and a retro UI overhaul — these were partially executed, leaving:

1. **Hard inconsistencies** — `DrawingPhase.jsx` still uses old `glass-card`/`btn-primary`/emoji `✅` while the rest of the app moved to `pixel-panel`/`btn-pixel`. `DrawingCanvas.jsx` uses `rounded-2xl`, `rounded-lg`, `rounded-full` everywhere — the antithesis of pixel art.
2. **A real semantic bug** — `KingSelection.jsx` line 105 displays "1HP/ONE-SHOT"; `constants.js` and `server/GameRoom.js` both set `KING_HP = 2`. UI promises a glass-cannon king, server enforces a normal-HP king with one-shot. Players see one rule, the game enforces another.
3. **Zero strategic agency in battle** — players just press "ROLL THE DICE." It's pure RNG with no decisions.
4. **No audio** — a "real game" needs at least 8-bit SFX.
5. **No game-feel beats** — bullet flies in a straight arc; no anticipation, no impact pause, no hit-stop, no camera zoom on KING SHOT.
6. **No onboarding / persistent context** — room code disappears after match starts; no tutorial; no help.
7. **`border-3` is invalid Tailwind** (used in reconnecting overlay, drawing-canvas spinners). Renders as 0px.
8. **Tank facing direction is broken on the right side** — `scaleX(-1)` is applied indiscriminately. If a player drew a tank already pointing right, mirroring sends the cannon backwards.

## Non-goals

- Don't change the core game (draw-tanks → king-pick → dice-battle).
- Don't change the WebSocket protocol unless required for new features.
- Don't add audio file dependencies — generate SFX procedurally with Web Audio API.
- Don't break the existing reconnect/grace-period logic — it works.

## Architecture

The game keeps its existing 3-tier architecture:

- **Server** (`server/GameRoom.js`, `server/index.js`) — authoritative state, dice rolls, turn management.
- **State** (`src/stores/gameStore.js` — Zustand) — client mirror plus UI-only state.
- **UI** (`src/components/*`) — phase-rendered React tree, gated by `phase` in store.

New additions:

- **`src/lib/audio.js`** — small procedural-SFX module using `AudioContext`. No deps. Exposes `sfx.dice()`, `sfx.shoot()`, `sfx.hit()`, `sfx.kingShot()`, `sfx.explode()`, `sfx.victory()`, `sfx.defeat()`, `sfx.uiBlip()`. First user gesture unlocks the context.
- **`src/components/HUD.jsx`** — overlay HUD that's mounted from `page.js` and shows the room code badge + help button across all phases. Reads from `gameStore`.
- **`src/components/HelpOverlay.jsx`** — modal that explains rules; toggled by HUD help button.
- **`src/components/KillFeed.jsx`** — bottom-right log of recent shots/hits during battle. Subscribes to `gameStore.killFeed`.
- **`src/components/DamageNumber.jsx`** — single floating-up "−1" or "KING SHOT!" rendered absolutely.
- **`src/components/TankChassis.jsx`** — wraps a player's tank drawing in a stylized treaded chassis with a barrel, so even bad drawings look like tanks.

## Spec — what changes

### Section 1: Fix what's broken (Tier 1)

**1.1 King HP semantic — go with the UI promise (1 HP / one-shot).** The server already does the one-shot logic; we change `KING_HP = 1` in both `constants.js` and `server/GameRoom.js`. This makes the king interesting (high-risk/high-reward).

**1.2 DrawingPhase + DrawingCanvas re-theme.** Replace `glass-card` → `pixel-panel`, `btn-primary` → `btn-pixel`, emoji `✅` → ASCII `>>> SUBMITTED <<<`, `rounded-2xl/lg/full` → sharp pixel borders, `ring-2 ring-offset-2` → solid pixel borders, `text-2xl font-bold` → `font-pixel text-base`. Color thumbnails with `--accent`/`--king-gold` instead of generic borders.

**1.3 Tank facing direction.** Right-side tanks should NOT mirror the player's drawing. Players draw tanks already facing right; mirroring breaks them. Remove the `scaleX(-1)` on opponent tanks. (Optional: rotate the chassis frame, not the user art.)

**1.4 Broken Tailwind classes.** `border-3` → `border-2` or inline style `border: 3px solid …`. Audit all `border-3`, `ring-3`, `gap-2.5`, etc.

**1.5 Persistent room code badge.** A small fixed-position HUD pill in the top-left showing `ROOM ABC123` whenever there's a `roomCode` in store. Click-to-copy.

**1.6 GameOverScreen polish.** Already mostly retro — tighten typography, add `[K]` indicator if king-shot ended it, replace generic "PLAY AGAIN?" flow with `> CONTINUE?` and `> NEW MATCH` (back to lobby).

**1.7 ErrorBoundary retro pass.** Currently uses `text-2xl font-bold`/`btn-primary`/`btn-secondary`. Switch to `font-pixel`/`btn-pixel`/`btn-pixel-secondary`.

### Section 2: Game feel (Tier 2)

**2.1 Procedural 8-bit audio.** New `src/lib/audio.js`. Each sfx uses `OscillatorNode` + `GainNode` + small noise bursts via `AudioBufferSourceNode`. SFX list:
- `uiBlip` — short 660Hz blip on button hover/click (low volume).
- `dice` — series of fast clacks (filtered noise + descending square pulse).
- `shoot` — descending square wave, ~120Hz over 80ms, with a noise tail.
- `bulletWhoosh` — band-passed white noise rising in pitch over flight duration.
- `hit` — short noise burst + 200Hz tone falling to 50Hz.
- `kingShot` — bigger version of hit + a major-third arpeggio (E5 → G5 → C6).
- `explode` — pitched-noise sweep + low rumble (sine 60Hz fade).
- `victory` — ascending arpeggio (C5 → E5 → G5 → C6).
- `defeat` — descending minor arpeggio (C5 → A4 → F4).

Wire into BattleScene at the corresponding moments. Init the AudioContext on first interaction (lobby button click).

**2.2 Damage numbers.** When `TANK_HIT` resolves, render a `DamageNumber` at the impact position that floats up + fades over 800ms. King shots show "KING SHOT!" in gold; normal hits show "−1" in red; destroying hits show "DESTROYED" in red.

**2.3 Hit-stop on KING SHOT.** When `isKingShot && targetTank.destroyed`, freeze the scene for 350ms (no-op timers can be done by adding a wait before the explosion completes), apply a `scale(1.05)` zoom on `ValleyBackground`, and slightly desaturate everything else with a brief CSS filter. Resume on impact-complete.

**2.4 Kill feed.** Bottom-right of battle scene. Last 5 events as one-line entries: `> P1 TANK 3 → P2 TANK 5 [HIT]` or `> P1 KING → P2 TANK 4 [DESTROYED]`. Each entry fades in from the right and persists ~6s. Stored in `gameStore.killFeed` array; pushed in the DICE_RESULT handler.

**2.5 DiceRoller polish.** Add an "anticipation" beat — when rolling=true, dice grow slightly (1.0 → 1.1 → 1.0). Use the new `sfx.dice()` for the clatter. Add a small dotted underline below each die labeled "TANK #X" / "TARGET #Y" once the roll resolves.

### Section 3: Polish (Tier 3)

**3.1 TankChassis frame.** A small SVG wrapper that draws:
- Two pixel-style track wheels (4 small circles in a row).
- A connecting tread line at the bottom.
- A barrel sticking out at 0deg (right-side default) or 180deg (left-side flipped).
- Renders the player's drawing INSIDE the chassis as the "turret/body."

`TankDisplay` uses `TankChassis` to wrap `tank.imageUrl`. King tanks have a small gold crown above the chassis.

**3.2 Drawing canvas grid + facing indicator.** When drawing a TANK (not a bullet):
- Add a faint vertical line at the canvas center.
- Add a right-pointing arrow at the right edge labeled "FRONT".
- Caption above canvas: "Tank fires to the RIGHT — design accordingly."

**3.3 Help overlay.** Single modal triggered by `?` button in HUD. Shows:
- Game flow (1. Draw → 2. Pick King → 3. Battle).
- Battle rules (Die 1 = which of yours fires; Die 2 = which enemy hit; King = one-shot KO with 1 HP).
- The re-roll mechanic (see Tier 4).
- Keyboard shortcut: `?` to toggle.

### Section 4: Depth (Tier 4)

**4.1 Re-roll token.** Each player gets exactly ONE re-roll per match. Used after seeing the dice but before the bullet fires. Adds a single decision moment per match without complicating the protocol heavily.

Server changes:
- Add `rerollUsed: { [playerId]: bool }` to GameRoom state.
- New WS message `REROLL` from client. If valid (player is current attacker, hasn't used it yet, dice are showing), server re-rolls and broadcasts a new `DICE_RESULT` with `wasReroll: true`. The original DICE_RESULT must be revertible — so we delay applying damage until after a `REROLL_WINDOW_MS` (1500ms grace before damage applies).
- Easier impl: keep current flow, but add a 1.5s grace where attacker can press REROLL. If they don't, damage applies. If they do, we cancel the in-flight animation and re-roll.

Client changes:
- New constant `WS_MESSAGES.REROLL`.
- BattleScene shows a "REROLL [1]" button below the dice during the grace window if `gameStore.myRerollAvailable` is true.
- Token visualized in HUD as a small star icon next to the player's name.

This is a non-trivial server change. **If time-budget pressures: ship Tier 1–3 first, mark Tier 4 as a follow-up commit.** Simpler fallback: client-only "regret" — let the player tap REROLL within 1.5s of the dice resolving, but the server has already committed. We instead just **let the player re-roll at the START of their next turn** (one extra roll). That keeps the protocol untouched: just a counter on the client. Server just sees a normal ROLL_DICE message; client tracks a `myRerollsUsed` count and visually rewards the player who uses it strategically.

**Decision: ship the simpler client-only re-roll.** A small bonus turn token. Visible in HUD ("BONUS ROLL: ★"); when used, the next ROLL_DICE on your turn doesn't end your turn — you immediately get a second roll. Server doesn't need to know.

(Wait — server controls turn advancement via `TURN_DELAY_MS` setTimeout. Client can't override that. So we DO need a server change. Simplest server change: add a `useReroll` flag inside the ROLL_DICE message. If set and unused, after damage applies, server skips advancing the turn. Single one-line change to server.)

**Going with the server-flagged bonus roll.** Minimal server diff. Documented in code.

### Section 5: Implementation order

Each tier is a coherent commit batch. Each item commits independently so we can roll back specific changes.

1. **Tier 1.1–1.7** — fix what's broken, retheme, persistence (commits 1-7).
2. **Tier 2.1–2.5** — game feel layer (commits 8-12).
3. **Tier 3.1–3.3** — chassis, canvas guidance, help overlay (commits 13-15).
4. **Tier 4** — re-roll mechanic (commit 16).
5. **Final pass** — build/lint, fix issues (commits 17+).

## Risks & mitigations

- **Risk:** Web Audio doesn't play on iOS without a user gesture. **Mitigation:** Init `AudioContext` lazily on first lobby button click; expose `sfx.unlock()`.
- **Risk:** Tank drawings vary wildly; chassis frame might look weird wrapped around a circle. **Mitigation:** Render player drawing in a fixed inner rectangle scaled to fit, with chassis treads/barrel as a SEPARATE outer SVG layer that doesn't overlap the drawing.
- **Risk:** Re-roll server change touches turn advancement, which has timer cleanup paths. **Mitigation:** Add explicit unit test in `server/GameRoom.test.js` for the bonus-roll branch before integrating.
- **Risk:** Hit-stop / camera zoom interferes with `ResizeObserver` recalcs. **Mitigation:** Apply the zoom to an inner wrapper div, not the observed container.

## Verification

- `npm run build` succeeds with no errors.
- `npm run test` passes (existing GameRoom tests + new bonus-roll test).
- `npm run lint` passes.
- Manual end-to-end smoke test (open two tabs as P1/P2, play a full match): Lobby → Drawing → King-pick → Battle (with re-roll used at least once) → Game Over → New match.
- Verify all visible inconsistencies from the audit (king HP, drawing-phase theme, mirroring, room-code persistence) are gone.

---

**This spec was written autonomously based on a code audit. The user requested "do it all without asking" — we proceed under that authorization.**
