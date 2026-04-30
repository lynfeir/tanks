'use client';
import { useState, useCallback, useEffect } from 'react';
import useGameStore from '@/stores/gameStore';
import sfx from '@/lib/audio';

const MUTE_STORAGE_KEY = 'tanks:muted';

/**
 * HUD — pinned overlay shown across all phases once a room exists.
 * Top-left: room-code pill (click to copy).
 * Top-right: mute + help (?) buttons.
 */
export default function HUD({ onOpenHelp }) {
  const roomCode = useGameStore((s) => s.roomCode);
  const phase = useGameStore((s) => s.phase);
  const isSpectator = useGameStore((s) => s.isSpectator);
  const [copied, setCopied] = useState(false);
  const [watchCopied, setWatchCopied] = useState(false);
  const [muted, setMuted] = useState(false);

  // Hydrate mute from localStorage on mount
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(MUTE_STORAGE_KEY);
      if (saved === '1') {
        setMuted(true);
        sfx.setMuted(true);
      }
    } catch {
      // localStorage unavailable — fall back to default
    }
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      sfx.setMuted(next);
      try {
        window.localStorage.setItem(MUTE_STORAGE_KEY, next ? '1' : '0');
      } catch {
        // ignore
      }
      // Confirmation blip when unmuting
      if (!next) {
        sfx.unlock();
        sfx.uiBlip();
      }
      return next;
    });
  }, []);

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

  const copyWatchLink = useCallback(async () => {
    if (!roomCode || typeof window === 'undefined') return;
    const url = `${window.location.origin}${window.location.pathname}?spectate=${roomCode}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setWatchCopied(true);
    setTimeout(() => setWatchCopied(false), 1500);
  }, [roomCode]);

  return (
    <>
      {/* Room-code pill + watch-link / spectator badge */}
      {roomCode && (
        <div className="fixed top-3 left-3 z-[60] flex flex-col gap-1 items-start">
          <button
            onClick={copyCode}
            className="px-3 py-2 transition-all hover:opacity-90"
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

          {isSpectator ? (
            <div className="px-2 py-1 font-pixel text-[7px]"
              style={{
                background: 'var(--bg-primary)',
                border: '2px solid var(--king-gold)',
                color: 'var(--king-gold)',
              }}>
              {'[ SPECTATING ]'}
            </div>
          ) : (
            <button
              onClick={copyWatchLink}
              className="px-2 py-1 font-pixel text-[7px] transition-all hover:opacity-90"
              style={{
                background: 'var(--bg-primary)',
                border: `2px solid ${watchCopied ? 'var(--success)' : 'var(--pixel-border)'}`,
                color: watchCopied ? 'var(--success)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
              title="Copy a read-only watch link"
            >
              {watchCopied ? 'LINK COPIED!' : '+ WATCH LINK'}
            </button>
          )}
        </div>
      )}

      {/* Mute toggle */}
      <button
        onClick={toggleMute}
        className="fixed top-3 z-[60] flex items-center justify-center transition-all hover:opacity-90"
        style={{
          right: 51,
          width: 36,
          height: 36,
          background: 'var(--bg-primary)',
          border: `2px solid ${muted ? 'var(--danger)' : 'var(--pixel-border)'}`,
          color: muted ? 'var(--danger)' : 'var(--text-primary)',
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 11,
          boxShadow: '0 2px 0 0 #0a0a1a',
          cursor: 'pointer',
          letterSpacing: 0,
        }}
        title={muted ? 'Unmute' : 'Mute'}
        aria-label={muted ? 'Unmute' : 'Mute'}
      >
        {muted ? 'X' : '))'}
      </button>

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
