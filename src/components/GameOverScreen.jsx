'use client';
import { useEffect, useRef, useState } from 'react';
import useGameStore from '@/stores/gameStore';
import sfx from '@/lib/audio';

function formatDuration(ms) {
  if (!ms || ms < 0) return '—';
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function Stat({ value, label, color }) {
  return (
    <div>
      <div className="font-pixel text-base" style={{ color: color || 'var(--text-primary)' }}>
        {value}
      </div>
      <div className="font-pixel text-[6px] mt-1" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </div>
    </div>
  );
}

export default function GameOverScreen() {
  const myTanks = useGameStore((s) => s.myTanks);
  const opponentTanks = useGameStore((s) => s.opponentTanks);
  const resetGame = useGameStore((s) => s.resetGame);
  const gameOverData = useGameStore((s) => s.gameOverData);
  const playerId = useGameStore((s) => s.playerId);
  const killFeed = useGameStore((s) => s.killFeed);
  const analytics = gameOverData?.analytics;

  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const frameRef = useRef(null);
  const [showContent, setShowContent] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const myAlive = myTanks.filter((t) => !t.destroyed).length;
  const oppAlive = opponentTanks.filter((t) => !t.destroyed).length;

  // Use gameOverData if available, fall back to tank count
  const isWinner = gameOverData
    ? gameOverData.winnerId === playerId
    : myAlive > oppAlive;

  const disconnectWin = gameOverData?.reason === 'disconnect' && isWinner;

  useEffect(() => {
    const t1 = setTimeout(() => setShowContent(true), 400);
    const t2 = setTimeout(() => setShowStats(true), 1200);
    // Victory / defeat sting plays as the title appears
    const t3 = setTimeout(() => {
      if (isWinner) sfx.victory();
      else sfx.defeat();
    }, 500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [isWinner]);

  // Particle animation
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    const ctx = canvas.getContext('2d');

    const colors = isWinner
      ? ['#ff6600', '#ffcc00', '#00ff41', '#ff0044', '#ffffff']
      : ['#ff0044', '#cc0033', '#660022', '#444444'];

    const count = isWinner ? 80 : 20;

    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: isWinner ? Math.random() * -canvas.height : Math.random() * canvas.height,
      w: 3 + Math.random() * 6,
      h: 3 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      vy: isWinner ? 1 + Math.random() * 3 : -0.3 - Math.random() * 0.8,
      vx: (Math.random() - 0.5) * 2,
      opacity: isWinner ? 1 : 0.3 + Math.random() * 0.4,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p) => {
        p.y += p.vy;
        p.x += p.vx;

        if (isWinner) {
          if (p.y > canvas.height + 20) {
            p.y = -20;
            p.x = Math.random() * canvas.width;
          }
        } else {
          if (p.y < -20) {
            p.y = canvas.height + 20;
            p.x = Math.random() * canvas.width;
          }
          p.opacity *= 0.999;
        }

        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        // Square pixel particles
        ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.w, p.h);
      });

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    window.addEventListener('resize', resize);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [isWinner]);

  const handleNewMatch = () => {
    resetGame();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(15, 15, 35, 0.95)' }}>

      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {showContent && (
        <div className="text-center z-10 px-4">
          {/* Title */}
          <h1 className={`font-pixel text-3xl sm:text-5xl mb-4 animate-slide-up ${isWinner ? 'animate-flicker' : ''}`}
            style={{
              color: isWinner ? 'var(--king-gold)' : 'var(--danger)',
              textShadow: isWinner
                ? '0 0 20px rgba(255, 204, 0, 0.4), 0 4px 0 #663300'
                : '0 0 20px rgba(255, 0, 68, 0.4), 0 4px 0 #330011',
            }}>
            {isWinner ? '>>> VICTORY <<<' : '>>> DEFEAT <<<'}
          </h1>

          {/* Subtitle */}
          <p className="font-pixel text-[10px] mb-8 animate-fade-in"
            style={{ color: 'var(--text-secondary)', animationDelay: '0.3s' }}>
            {disconnectWin
              ? 'OPPONENT DISCONNECTED'
              : isWinner
              ? 'ALL ENEMY TANKS ELIMINATED'
              : 'YOUR TANKS HAVE FALLEN'}
          </p>

          {/* Stats */}
          {showStats && (
            <div className="inline-block p-6 mb-6 animate-slide-up pixel-panel">
              <div className="font-pixel text-[8px] mb-4" style={{ color: 'var(--accent)' }}>
                {'-- BATTLE REPORT --'}
              </div>
              <div className="grid grid-cols-2 gap-10 text-center mb-4">
                <div>
                  <div className="font-pixel text-2xl" style={{ color: 'var(--success)' }}>
                    {myAlive}
                  </div>
                  <div className="font-pixel text-[7px] mt-2" style={{ color: 'var(--text-secondary)' }}>
                    YOUR TANKS
                  </div>
                </div>
                <div>
                  <div className="font-pixel text-2xl" style={{ color: 'var(--danger)' }}>
                    {oppAlive}
                  </div>
                  <div className="font-pixel text-[7px] mt-2" style={{ color: 'var(--text-secondary)' }}>
                    ENEMY TANKS
                  </div>
                </div>
              </div>

              {analytics && (
                <div className="grid grid-cols-3 gap-4 pt-4 text-center"
                  style={{ borderTop: '1px solid var(--pixel-border)' }}>
                  <Stat
                    value={formatDuration(analytics.durationMs)}
                    label="DURATION"
                  />
                  <Stat
                    value={analytics.turnsCompleted ?? 0}
                    label="TURNS"
                  />
                  <Stat
                    value={analytics.kingShotsFired ?? 0}
                    label="KING SHOTS"
                    color={analytics.kingShotsFired > 0 ? 'var(--king-gold)' : undefined}
                  />
                </div>
              )}
            </div>
          )}

          {/* Match recap (kill feed history) */}
          {showStats && killFeed && killFeed.length > 0 && (
            <div className="inline-block p-4 mb-6 animate-slide-up pixel-panel max-w-md text-left"
              style={{ animationDelay: '0.7s' }}>
              <div className="font-pixel text-[8px] mb-3" style={{ color: 'var(--accent)' }}>
                {'-- MATCH LOG --'}
              </div>
              <div className="font-pixel text-[7px] space-y-1 max-h-40 overflow-y-auto"
                style={{ color: 'var(--text-secondary)' }}>
                {killFeed.slice(-10).map((entry, i) => (
                  <div key={entry.id || i} className="flex gap-2">
                    <span style={{ color: 'var(--pixel-border)', minWidth: 24 }}>
                      {String(killFeed.length - killFeed.slice(-10).length + i + 1).padStart(2, '0')}
                    </span>
                    <span style={{ color: 'var(--success)' }}>
                      {entry.attackerName} {entry.isKing ? 'KING' : `T${entry.shooterTank + 1}`}
                    </span>
                    <span>{'>'}</span>
                    <span style={{ color: 'var(--danger)' }}>
                      {entry.targetName} T{entry.targetTank + 1}
                    </span>
                    <span style={{
                      color: entry.isKing
                        ? 'var(--king-gold)'
                        : entry.destroyed
                        ? 'var(--danger)'
                        : 'var(--text-primary)',
                      marginLeft: 'auto',
                    }}>
                      {entry.isKing ? '[K]' : entry.destroyed ? '[KO]' : '[HIT]'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {showStats && (
            <div className="flex gap-3 justify-center animate-fade-in flex-wrap" style={{ animationDelay: '0.5s' }}>
              <button
                className="btn-pixel text-sm px-10 py-4"
                onClick={handleNewMatch}
                style={isWinner ? {
                  background: 'var(--king-gold)',
                  color: '#000',
                  boxShadow: '0 4px 0 0 #cc9900, 0 6px 0 0 #0a0a1a, 0 0 30px rgba(255, 204, 0, 0.3)',
                } : {}}
              >
                {'> NEW MATCH'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
