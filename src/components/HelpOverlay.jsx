'use client';
import { useEffect } from 'react';

/**
 * HelpOverlay — modal explaining game rules. Toggleable via HUD or "?" key.
 */
export default function HelpOverlay({ open, onClose }) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(0, 0, 0, 0.85)' }}
      onClick={onClose}
    >
      <div
        className="pixel-panel max-w-lg w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-pixel text-base" style={{ color: 'var(--accent)' }}>
            HOW TO PLAY
          </h2>
          <button
            onClick={onClose}
            className="font-pixel text-sm px-3 py-1 transition-all hover:opacity-80"
            style={{
              background: 'var(--bg-primary)',
              border: '2px solid var(--pixel-border)',
              color: 'var(--text-primary)',
            }}
            aria-label="Close help"
          >
            X
          </button>
        </div>

        <div className="space-y-5 font-mono text-xs leading-relaxed"
          style={{ color: 'var(--text-primary)' }}>

          <Section title="1. DRAW">
            <p>Each player draws <Hi>6 tanks</Hi> and <Hi>6 bullets</Hi> on the canvas.</p>
            <p style={{ color: 'var(--text-secondary)' }}>
              Tanks fire to the RIGHT. The <Hi accent>FRONT &gt;</Hi> indicator shows which side the cannon faces.
            </p>
          </Section>

          <Section title="2. CROWN A KING">
            <p>Pick one of your tanks to be the <Hi gold>KING</Hi>.</p>
            <p style={{ color: 'var(--text-secondary)' }}>
              The King has only <Hi danger>1 HP</Hi> but every shot it fires is a <Hi gold>ONE-HIT KO</Hi>.
              Pick wisely — losing the king is just losing one tank, but using it is your win condition.
            </p>
          </Section>

          <Section title="3. BATTLE">
            <p>Take turns rolling <Hi>2 dice</Hi>:</p>
            <ul className="ml-4 space-y-1" style={{ color: 'var(--text-secondary)' }}>
              <li>{'•'} Die 1 = which of YOUR alive tanks fires</li>
              <li>{'•'} Die 2 = which ENEMY alive tank gets hit</li>
            </ul>
            <p>Normal hit = <Hi danger>−1 HP</Hi>. King firing = <Hi gold>instant kill</Hi>.</p>
          </Section>

          <Section title="WIN CONDITION">
            <p>Eliminate <Hi>all 6</Hi> of your opponent&apos;s tanks.</p>
          </Section>

          <Section title="SHORTCUTS">
            <ul className="ml-4 space-y-1" style={{ color: 'var(--text-secondary)' }}>
              <li><Hi>?</Hi> — open this help</li>
              <li><Hi>ESC</Hi> — close help</li>
              <li>Click <Hi>ROOM</Hi> — copy room code</li>
            </ul>
          </Section>
        </div>

        <div className="mt-8 pt-4" style={{ borderTop: '1px solid var(--pixel-border)' }}>
          <button
            onClick={onClose}
            className="btn-pixel w-full py-3"
          >
            BACK TO GAME
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="font-pixel text-[10px] mb-2" style={{ color: 'var(--king-gold)' }}>
        {title}
      </h3>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}

function Hi({ children, gold, danger, accent }) {
  let color = 'var(--text-primary)';
  if (gold) color = 'var(--king-gold)';
  else if (danger) color = 'var(--danger)';
  else if (accent) color = 'var(--accent)';
  return <span style={{ color, fontWeight: 'bold' }}>{children}</span>;
}
