'use client';

/**
 * DamageNumber — floating "−1", "DESTROYED", or "KING SHOT!" text.
 * Renders absolutely at (x, y), animates up + fades out via CSS keyframes
 * declared inline so we don't have to touch globals.css for one effect.
 *
 * Lifetime managed by parent — pass `onDone` and parent removes from list.
 */
export default function DamageNumber({ x, y, text, color, kingShot, onDone }) {
  // Tick onDone after the animation finishes (CSS sets total ~900ms)
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        zIndex: 60,
        pointerEvents: 'none',
        fontFamily: "'Press Start 2P', monospace",
        fontSize: kingShot ? '18px' : '12px',
        color: color || 'var(--danger)',
        textShadow: kingShot
          ? '0 0 10px rgba(255, 204, 0, 0.6), 2px 2px 0 #663300'
          : '2px 2px 0 #000',
        animation: 'dmgFloat 0.9s cubic-bezier(0.2, 0.7, 0.3, 1) forwards',
        whiteSpace: 'nowrap',
      }}
      onAnimationEnd={onDone}
    >
      <style>{`
        @keyframes dmgFloat {
          0%   { transform: translate(-50%, -50%) scale(0.6); opacity: 0; }
          15%  { transform: translate(-50%, -65%) scale(1.3); opacity: 1; }
          40%  { transform: translate(-50%, -85%) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -135%) scale(0.95); opacity: 0; }
        }
      `}</style>
      {text}
    </div>
  );
}
