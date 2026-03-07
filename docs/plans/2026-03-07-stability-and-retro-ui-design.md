# Stability Fixes + Retro Pixel Art UI Overhaul — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix random crashes/disconnects that blank the screen, and transform the UI from a generic web-app look into a retro arcade pixel art game.

**Architecture:** Error boundaries catch per-phase crashes. Server/client disconnect grace periods aligned. Full CSS overhaul with Press Start 2P font, scanline overlays, CRT vignette, and pixel-art styled components. Zustand store extended with gameOverData for proper winner tracking.

**Tech Stack:** Next.js 16, React 19, Zustand, Tailwind CSS, Google Fonts (Press Start 2P), WebSocket (ws)

---

### Task 1: Fix Disconnect Grace Period Mismatch

**Files:**
- Modify: `src/lib/constants.js:15`

**Step 1: Fix the constant**

Change `DISCONNECT_GRACE_MS` from `60000` to `90000` to match the server:

```js
export const DISCONNECT_GRACE_MS = 90000;
```

**Step 2: Verify no other references**

Search for `60000` or `DISCONNECT_GRACE` across the codebase to confirm alignment.

**Step 3: Commit**

```bash
git add src/lib/constants.js
git commit -m "fix: align client disconnect grace period to 90s to match server"
```

---

### Task 2: Make Server Heartbeat More Forgiving

**Files:**
- Modify: `server/index.js:248-258`

**Step 1: Add missed-pong counter instead of immediate termination**

Replace the heartbeat interval:

```js
// Heartbeat to detect stale connections
const heartbeat = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.missedPongs >= 2) {
      ws.terminate();
      return;
    }
    if (!ws.isAlive) {
      ws.missedPongs = (ws.missedPongs || 0) + 1;
    } else {
      ws.missedPongs = 0;
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);
```

This allows 2 missed pongs (~60s) before terminating, instead of 1 (~30s). Keeps 30s interval for responsiveness but doubles tolerance.

**Step 2: Initialize missedPongs on connection**

In the `wss.on('connection')` handler after `ws.isAlive = true;` (line 48), add:

```js
ws.missedPongs = 0;
```

**Step 3: Commit**

```bash
git add server/index.js
git commit -m "fix: allow 2 missed pongs before terminating connection"
```

---

### Task 3: Store GAME_OVER Payload Properly

**Files:**
- Modify: `src/stores/gameStore.js`
- Modify: `src/hooks/useWebSocket.js:60-62`

**Step 1: Add gameOverData to Zustand store**

In `src/stores/gameStore.js`, add to state (after line 40):

```js
gameOverData: null,
```

Add a setter (after `setAnimationPlaying`):

```js
setGameOverData: (data) => set({ gameOverData: data }),
```

In `resetGame`, add `gameOverData: null` to the reset object.

**Step 2: Handle GAME_OVER payload in useWebSocket**

In `src/hooks/useWebSocket.js`, replace the GAME_OVER handler (lines 60-62):

```js
case WS_MESSAGES.GAME_OVER:
  s.setGameOverData(msg.payload);
  s.setPhase(GAME_PHASES.GAME_OVER);
  break;
```

**Step 3: Commit**

```bash
git add src/stores/gameStore.js src/hooks/useWebSocket.js
git commit -m "fix: store GAME_OVER payload (winnerId, loserId, reason) in Zustand"
```

---

### Task 4: Add Crash Guards to BattleScene

**Files:**
- Modify: `src/components/BattleScene.jsx`

**Step 1: Guard the dice result animation effect**

Wrap the dice result animation logic (inside the `useEffect` at line 84) with safety checks:

```js
useEffect(() => {
  if (!diceResults || !rolling) return;

  try {
    const isMyAttack = diceResults.attackerId === playerId;
    const shooterTanks = isMyAttack ? myTanks : opponentTanks;
    const targetTanks = isMyAttack ? opponentTanks : myTanks;
    const shooterPositions = isMyAttack ? TANK_POSITIONS_LEFT : TANK_POSITIONS_RIGHT;
    const targetPositions = isMyAttack ? TANK_POSITIONS_RIGHT : TANK_POSITIONS_LEFT;

    const shooterIdx = diceResults.shooterTank;
    const targetIdx = diceResults.targetTank;

    // Bounds checks
    if (shooterIdx == null || targetIdx == null) {
      setRolling(false);
      setAnimationPlaying(false);
      return;
    }
    if (shooterIdx < 0 || shooterIdx >= shooterPositions.length ||
        targetIdx < 0 || targetIdx >= targetPositions.length) {
      setRolling(false);
      setAnimationPlaying(false);
      return;
    }

    const kingShot = diceResults.isKingShot;
    setIsKingShot(kingShot);

    // Step 1: Dice finishes rolling, highlight shooter
    addTimer(() => {
      setRolling(false);
      setHighlightShooter(shooterIdx);
      setAnnouncement(
        isMyAttack
          ? `Your Tank #${shooterIdx + 1} fires!${kingShot ? ' KING SHOT!' : ''}`
          : `Enemy Tank #${shooterIdx + 1} fires!${kingShot ? ' KING SHOT!' : ''}`
      );
    }, 1800);

    // Step 2: Fire bullet
    addTimer(() => {
      setHighlightTarget(targetIdx);
      const container = containerRef.current;
      if (!container) return;
      const from = getPixelPosition(shooterPositions[shooterIdx], container);
      const to = getPixelPosition(targetPositions[targetIdx], container);
      setBulletFrom(from);
      setBulletTo(to);
      setBulletUrl(shooterTanks[shooterIdx]?.bulletUrl || null);
      setBulletActive(true);
    }, 3000);
  } catch (err) {
    console.error('BattleScene animation error:', err);
    setRolling(false);
    setAnimationPlaying(false);
  }

  return () => clearTimers();
}, [diceResults]);
```

**Step 2: Guard tank rendering with containerRef check**

In the tank rendering sections (lines 250-272 and 275-297), add a guard for containerRef:

```js
{myTanks.map((tank, i) => {
  if (!containerRef.current) return null;
  const pos = getPixelPosition(TANK_POSITIONS_LEFT[i], containerRef.current);
  // ... rest of rendering
})}
```

Same for opponentTanks.

**Step 3: Commit**

```bash
git add src/components/BattleScene.jsx
git commit -m "fix: add crash guards to BattleScene animation and rendering"
```

---

### Task 5: Create ErrorBoundary Component

**Files:**
- Create: `src/components/ErrorBoundary.jsx`

**Step 1: Write the ErrorBoundary**

```jsx
'use client';
import { Component } from 'react';
import useGameStore from '@/stores/gameStore';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Game crash caught:', error, errorInfo);
  }

  handleReset = () => {
    useGameStore.getState().resetGame();
    this.setState({ hasError: false });
    window.location.reload();
  };

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center"
          style={{ background: 'var(--bg-primary)' }}>
          <div className="pixel-panel p-8 text-center max-w-md">
            <div className="text-4xl mb-4 font-pixel" style={{ color: 'var(--danger)' }}>
              SYSTEM ERROR
            </div>
            <p className="text-sm mb-6 font-mono" style={{ color: 'var(--text-secondary)' }}>
              Something went wrong. Don&apos;t worry, your game might still be recoverable.
            </p>
            <div className="flex gap-4 justify-center">
              <button className="btn-pixel" onClick={this.handleRetry}>
                RETRY
              </button>
              <button className="btn-pixel-secondary" onClick={this.handleReset}>
                BACK TO LOBBY
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
```

**Step 2: Wire into page.js**

In `src/app/page.js`, import ErrorBoundary and wrap each phase:

```jsx
import ErrorBoundary from '@/components/ErrorBoundary';

// Then wrap each phase component:
{phase === GAME_PHASES.BATTLE && (
  <ErrorBoundary>
    <BattleScene onRollDice={rollDice} />
  </ErrorBoundary>
)}
```

Wrap all phases: DRAWING, KING_SELECTION, BATTLE, GAME_OVER.

**Step 3: Commit**

```bash
git add src/components/ErrorBoundary.jsx src/app/page.js
git commit -m "feat: add ErrorBoundary to catch phase crashes instead of blanking"
```

---

### Task 6: Add Press Start 2P Font + Update Layout

**Files:**
- Modify: `src/app/layout.js`

**Step 1: Add Google Font import and font classes**

```jsx
import './globals.css';

export const metadata = {
  title: "Rollin' Tanks",
  description: 'Draw your tanks. Roll the dice. Destroy your friends.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/layout.js
git commit -m "feat: add Press Start 2P pixel font via Google Fonts"
```

---

### Task 7: Overhaul globals.css with Retro Pixel Art Theme

**Files:**
- Modify: `src/app/globals.css` (full rewrite)

**Step 1: Replace entire globals.css**

Key changes:
- New CSS variables with 8-bit color palette
- `.font-pixel` class for Press Start 2P
- `.pixel-panel` replacing `.glass-card` (no blur, hard borders)
- `.btn-pixel` replacing `.btn-primary` (3D pixel button effect)
- `.btn-pixel-secondary` replacing `.btn-secondary`
- `.input-pixel` replacing `.input-field`
- Scanline overlay via `::after` pseudo-element on body
- CRT vignette via `::before` on body
- All existing keyframe animations preserved
- New `@keyframes blink` for cursor/text effects
- New `@keyframes pixelPulse` for retro pulsing

The full CSS is extensive — see the actual implementation for complete code. Core structure:

```css
@import "tailwindcss";

:root {
  --bg-primary: #0f0f23;
  --bg-secondary: #1a1a2e;
  --bg-card: #16213e;
  --text-primary: #cccccc;
  --text-secondary: #666688;
  --accent: #ff6600;
  --accent-glow: #ff8800;
  --danger: #ff0044;
  --success: #00ff41;
  --warning: #ffaa00;
  --king-gold: #ffcc00;
  --pixel-border: #33335a;
}

body {
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Courier New', monospace;
  overflow-x: hidden;
  position: relative;
}

/* Scanline overlay */
body::after {
  content: '';
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.08) 2px,
    rgba(0, 0, 0, 0.08) 4px
  );
  pointer-events: none;
  z-index: 9999;
}

/* CRT vignette */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 60%, rgba(0, 0, 0, 0.4) 100%);
  pointer-events: none;
  z-index: 9998;
}

.font-pixel {
  font-family: 'Press Start 2P', monospace;
}

/* ... rest of retro styles */
```

**Step 2: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: overhaul CSS with retro pixel art theme, scanlines, CRT vignette"
```

---

### Task 8: Restyle Lobby Component

**Files:**
- Modify: `src/components/Lobby.jsx` (full rewrite)

**Step 1: Rewrite with retro pixel art style**

Key changes:
- Replace floating orbs background with a pixel grid pattern
- Title in Press Start 2P (`font-pixel` class) with a blinking cursor
- "INSERT COIN" subtitle
- Pixel-style input fields with `input-pixel` class
- Arcade-style buttons with `btn-pixel` class
- Connection indicator as a pixelated dot
- Remove all glass-card, gradient, blur effects
- Sharp corners, thick borders, solid backgrounds

**Step 2: Commit**

```bash
git add src/components/Lobby.jsx
git commit -m "feat: restyle Lobby with retro arcade pixel art theme"
```

---

### Task 9: Restyle WaitingRoom Component

**Files:**
- Modify: `src/components/WaitingRoom.jsx` (full rewrite)

**Step 1: Rewrite with retro style**

Key changes:
- Replace glass-card with pixel-panel
- Room code in Press Start 2P, big and monospaced
- Flashing "WAITING FOR PLAYER 2" text with blink animation
- Player slots as pixelated terminal-style rows
- Replace floating orbs with static pixel pattern
- Loading dots as blinking pixel blocks

**Step 2: Commit**

```bash
git add src/components/WaitingRoom.jsx
git commit -m "feat: restyle WaitingRoom with retro pixel art theme"
```

---

### Task 10: Restyle KingSelection Component

**Files:**
- Modify: `src/components/KingSelection.jsx` (full rewrite)

**Step 1: Rewrite with retro style**

Key changes:
- "SELECT YOUR KING" in pixel font
- Tank cards with pixel borders, no rounded corners
- Selected card gets flashing pixel border
- Crown as ASCII `[KING]` badge instead of emoji
- Stats as pixel text: "1 HP / ONE-SHOT KILL" vs "2 HP / STANDARD"
- Confirm button as pixel arcade button
- Waiting state: blinking "WAITING..." text

**Step 2: Commit**

```bash
git add src/components/KingSelection.jsx
git commit -m "feat: restyle KingSelection with retro pixel art theme"
```

---

### Task 11: Restyle BattleScene HUD and Controls

**Files:**
- Modify: `src/components/BattleScene.jsx`

**Step 1: Update HUD bar with pixel styling**

Key changes:
- Top HUD: pixel font for names and scores
- Tank status as filled/empty pixel squares (not smooth dots)
- Turn indicator: ">> YOUR TURN <<" or ">> ENEMY TURN <<" in pixel font with blink
- Announcement text in pixel font
- "ROLL THE DICE" button as arcade-style pixel button
- Waiting state: blinking "WAITING..." text
- Replace all inline gradient/glass styles with pixel-panel equivalents

**Step 2: Commit**

```bash
git add src/components/BattleScene.jsx
git commit -m "feat: restyle BattleScene HUD with retro pixel art theme"
```

---

### Task 12: Restyle TankDisplay Component

**Files:**
- Modify: `src/components/TankDisplay.jsx`

**Step 1: Update with pixel styling**

Key changes:
- HP bar as segmented blocks (like classic games): 2 blocks for normal, 1 for king
- Replace rounded corners with sharp pixel borders
- King indicator: "[K]" text badge instead of crown emoji
- Destroyed state: "X" marker in pixel font
- Highlight glow as solid pixel border, not box-shadow blur

**Step 2: Commit**

```bash
git add src/components/TankDisplay.jsx
git commit -m "feat: restyle TankDisplay with pixel HP bars and retro borders"
```

---

### Task 13: Restyle DiceRoller Component

**Files:**
- Modify: `src/components/DiceRoller.jsx`

**Step 1: Update dice with pixel styling**

Key changes:
- Dice face: sharp corners, dark background with pixel border
- Dots as square pixels instead of round circles
- Rolling animation: keep spin3d but remove gradient shimmer
- "VS" text in pixel font
- Labels in pixel font

**Step 2: Commit**

```bash
git add src/components/DiceRoller.jsx
git commit -m "feat: restyle DiceRoller with pixel art dice faces"
```

---

### Task 14: Add Scanline Overlay to ValleyBackground

**Files:**
- Modify: `src/components/ValleyBackground.jsx`

**Step 1: Add scanline overlay div**

Add a scanline overlay div inside the ValleyBackground component, before the children content div:

```jsx
{/* Scanline overlay */}
<div className="absolute inset-0 pointer-events-none z-[5]"
  style={{
    background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)',
  }} />
```

**Step 2: Commit**

```bash
git add src/components/ValleyBackground.jsx
git commit -m "feat: add scanline overlay to ValleyBackground"
```

---

### Task 15: Restyle GameOverScreen with Proper Winner Data

**Files:**
- Modify: `src/components/GameOverScreen.jsx`

**Step 1: Use gameOverData from store + retro styling**

Key changes:
- Read `gameOverData` from Zustand store to determine winner (fall back to tank count if null)
- Replace emoji trophy/skull with ASCII art text: `>>> VICTORY <<<` or `>>> DEFEAT <<<`
- Stats in terminal-style layout with pixel font
- "PLAY AGAIN?" as arcade "CONTINUE?" style
- Keep confetti particles but use pixel-style colors
- Disconnect reason shows "OPPONENT DISCONNECTED" message

**Step 2: Commit**

```bash
git add src/components/GameOverScreen.jsx
git commit -m "feat: restyle GameOverScreen with retro theme + proper winner data"
```

---

### Task 16: Final Verification

**Step 1: Run the dev server**

```bash
npm run dev
```

**Step 2: Verify no build errors**

Check console for any compilation errors.

**Step 3: Visual check each screen**

Walk through: Lobby -> Create Room -> Waiting Room (verify retro look at each step).

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: address any remaining issues from retro UI overhaul"
```
