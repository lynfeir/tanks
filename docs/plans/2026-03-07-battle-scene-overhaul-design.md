# Battle Scene Overhaul Design

## Summary

Redesign the battle scene with a proper valley terrain, visible tanks in labeled frames, live responsive repositioning, king HP normalization, and cross-player missile visibility.

## 1. Valley Shape & Terrain

Replace the current smooth bezier valley with a `\__/` shape:
- Two angled slopes (~25deg) with a flat plateau in the center third
- Plateau at ~75% viewport height, ridges at ~45%
- SVG path uses line segments instead of Q curves
- Subtle terrain texture on slopes (grass lines, rocky edges)
- Existing sky, mountains, stars, parallax layers preserved

## 2. Tank Placement on Slopes

- 6 tanks per player staggered in a 3x2 grid along each slope
- Positions derived from slope line equation: `y = ridgeY + (x - ridgeX) * slopeRatio`
- Left player tanks face right, right player tanks face left (scaleX flip)
- Tanks "sit on" the hillside — their Y position follows the slope

### Position Grid (percentage-based, 1000x1000 virtual space):
- Left slope: 3 columns spread from x=80 to x=350, y derived from slope
- Right slope: 3 columns spread from x=650 to x=920, y derived from slope
- 2 rows per column, offset vertically along the slope

## 3. Tank Frames (Labeled)

Each tank wrapped in a labeled frame component:
```
+-- TANK 3 -----------+
|  [tank drawing]      |
|  ██████░░  2/2 HP    |
+----------------------+
```
- Retro pixel border matching theme
- King tank: gold border, `[KING]` label
- HP bar integrated into bottom of frame
- Frame scales proportionally with container

## 4. King HP Normalization

- King HP changed from 1 to 2 (same as normal tanks)
- Server: `GameRoom.js` — change `KING_HP = 1` to `KING_HP = 2`
- Client: `constants.js` — change `KING_TANK_HP = 1` to `KING_TANK_HP = 2`
- King still has special visual treatment (gold frame, label) but same durability
- King shot still does instant-kill (unchanged)

## 5. Responsive Live Reflow

- Add `ResizeObserver` on battle container
- Store container dimensions in component state
- Tank positions recalculate on every resize
- Slope math runs against current container dimensions
- Bullet animation coordinates update if resize during animation
- No fixed pixel sizes for tank frames — use relative units

## 6. Missile System Fix

### Problem
Both players receive DICE_RESULT via server broadcast, but missile animation may not render correctly for both perspectives (attacker vs defender).

### Fix
- Verify BattleScene animation trigger works for both attacker and defender
- Calculate bullet `from` position from shooter tank's slope position
- Calculate bullet `to` position from target tank's slope position
- Both use the same getPixelPosition logic against current container
- Arc apex at ~30% viewport height above plateau
- Existing BulletAnimation.jsx trail/particle system preserved
- Existing Explosion.jsx canvas particle system preserved

## 7. Files to Modify

- `src/components/ValleyBackground.jsx` — new valley SVG path
- `src/components/BattleScene.jsx` — tank positioning, ResizeObserver, animation trigger fix
- `src/components/TankDisplay.jsx` — labeled frame wrapper, HP in frame
- `src/components/BulletAnimation.jsx` — arc trajectory for slope-to-slope
- `server/GameRoom.js` — KING_HP = 2
- `src/lib/constants.js` — KING_TANK_HP = 2
