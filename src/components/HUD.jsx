'use client';
import { useState, useCallback, useEffect } from 'react';
import useGameStore from '@/stores/gameStore';

/**
 * HUD — pinned overlay shown across all phases once a room exists.
 * Top-left: room-code pill (click to copy).
 * Top-right: help (?) button — opens the rules overlay.
 */
export default function HUD({ onOpenHelp }) {
  const roomCode = useGameStore((s) => s.roomCode);
  const phase = useGameStore((s) => s.phase);
  const [copied, setCopied] = useState(false);

  // Keyboard shortcut: ? to open help
  useEffect(() => {
    const handler = (e) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        onOpenHelp?.();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onOpenHelp]);

  const copyCode = useCallback(async () => {
    if (!roomCode) return;
    try {
      await navigator.clipboard.writeText(roomCode);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = roomCode;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [roomCode]);

  return (
    <>
      {/* Room-code pill — only when a room is joined */}
      {roomCode && (
        <button
          onClick={copyCode}
          className="fixed top-3 left-3 z-[60] px-3 py-2 transition-all hover:opacity-90"
          style={{
            background: 'var(--bg-primary)',
            border: '2px solid var(--accent)',
            boxShadow: '0 2px 0 0 #0a0a1a',
            cursor: 'pointer',
          }}
          title="Click to copy room code"
        >
          <div className="font-pixel text-[7px] mb-1" style={{ color: 'var(--text-secondary)' }}>
            ROOM
          </div>
          <div className="font-pixel text-[10px] tracking-[0.25em]"
            style={{ color: copied ? 'var(--success)' : 'var(--accent)' }}>
            {copied ? 'COPIED!' : roomCode}
          </div>
        </button>
      )}

      {/* Help (?) button — always visible */}
      <button
        onClick={onOpenHelp}
        className="fixed top-3 right-3 z-[60] flex items-center justify-center transition-all hover:opacity-90"
        style={{
          width: 36,
          height: 36,
          background: 'var(--bg-primary)',
          border: '2px solid var(--pixel-border)',
          color: 'var(--text-primary)',
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 14,
          boxShadow: '0 2px 0 0 #0a0a1a',
          cursor: 'pointer',
        }}
        title="Help (?)"
        aria-label="Help"
      >
        ?
      </button>

      {/* Phase indicator (small, secondary) — only during gameplay phases */}
      {roomCode && phase && phase !== 'lobby' && (
        <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-[55] px-3 py-1 pointer-events-none"
          style={{
            background: 'rgba(15, 15, 35, 0.7)',
            border: '1px solid var(--pixel-border)',
          }}>
          <span className="font-pixel text-[7px]" style={{ color: 'var(--text-secondary)' }}>
            {phase.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      )}
    </>
  );
}
