'use client';
import { useEffect, useState } from 'react';
import useGameStore from '@/stores/gameStore';

/**
 * KillFeed — bottom-right log of recent shots and hits.
 * Reads gameStore.killFeed (newest entries pushed at the end).
 * Each entry: { id, attackerName, shooterTank, targetName, targetTank, isKing, destroyed, ts }
 */
export default function KillFeed() {
  const feed = useGameStore((s) => s.killFeed);
  const [now, setNow] = useState(() => Date.now());

  // Tick every second so old entries fade out
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  if (!feed || feed.length === 0) return null;

  const visible = feed.slice(-5);

  return (
    <div className="fixed bottom-2 sm:bottom-4 right-2 sm:right-4 z-30 flex flex-col gap-1 items-end pointer-events-none max-w-[60vw] sm:max-w-none">
      {visible.map((entry) => {
        const age = now - entry.ts;
        const opacity = age > 5000 ? Math.max(0, 1 - (age - 5000) / 1500) : 1;
        if (opacity <= 0) return null;
        return (
          <div
            key={entry.id}
            className="font-pixel text-[7px] sm:text-[8px] px-2 py-1 animate-slide-up truncate max-w-full"
            style={{
              background: 'rgba(15, 15, 35, 0.85)',
              border: `1px solid ${entry.isKing ? 'var(--king-gold)' : 'var(--pixel-border)'}`,
              color: 'var(--text-primary)',
              opacity,
            }}
          >
            <span style={{ color: 'var(--success)' }}>
              {entry.attackerName} {entry.isKing ? 'KING' : `T${entry.shooterTank + 1}`}
            </span>
            <span style={{ color: 'var(--text-secondary)' }}> {'>>>'} </span>
            <span style={{ color: 'var(--danger)' }}>
              {entry.targetName} T{entry.targetTank + 1}
            </span>
            <span style={{
              color: entry.isKing
                ? 'var(--king-gold)'
                : entry.destroyed
                ? 'var(--danger)'
                : 'var(--accent)',
              marginLeft: 6,
            }}>
              {entry.isKing ? '[KING SHOT]' : entry.destroyed ? '[KO]' : '[HIT]'}
            </span>
          </div>
        );
      })}
    </div>
  );
}
