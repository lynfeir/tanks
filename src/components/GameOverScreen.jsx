'use client';
import { useEffect, useRef, useState } from 'react';
import useGameStore from '@/stores/gameStore';

export default function GameOverScreen() {
  const myTanks = useGameStore((s) => s.myTanks);
  const opponentTanks = useGameStore((s) => s.opponentTanks);
  const resetGame = useGameStore((s) => s.resetGame);
  const gameOverData = useGameStore((s) => s.gameOverData);
  const playerId = useGameStore((s) => s.playerId);

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
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

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

  const handlePlayAgain = () => {
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
          <h1 className="font-pixel text-3xl sm:text-5xl mb-4 animate-slide-up"
            style={{ color: isWinner ? 'var(--king-gold)' : 'var(--danger)' }}>
            {isWinner ? '>>> VICTORY <<<' : '>>> DEFEAT <<<'}
          </h1>

          {/* Subtitle */}
          <p className="font-mono text-sm mb-8 animate-fade-in"
            style={{ color: 'var(--text-secondary)', animationDelay: '0.3s' }}>
            {disconnectWin
              ? 'OPPONENT DISCONNECTED'
              : isWinner
              ? 'ALL ENEMY TANKS DESTROYED'
              : 'YOUR TANKS HAVE BEEN ELIMINATED'}
          </p>

          {/* Stats */}
          {showStats && (
            <div className="inline-block p-6 mb-8 animate-slide-up"
              style={{
                background: 'var(--bg-secondary)',
                border: '3px solid var(--pixel-border)',
              }}>
              <div className="font-pixel text-[8px] mb-4" style={{ color: 'var(--text-secondary)' }}>
                -- BATTLE REPORT --
              </div>
              <div className="grid grid-cols-2 gap-10 text-center">
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
            </div>
          )}

          {/* Play again */}
          {showStats && (
            <div className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <button
                className="btn-pixel text-sm px-12 py-4"
                onClick={handlePlayAgain}
                style={isWinner ? {
                  background: 'var(--king-gold)',
                  color: '#000',
                  boxShadow: '0 4px 0 0 #cc9900, 0 6px 0 0 #0a0a1a, 0 0 30px rgba(255, 204, 0, 0.3)',
                } : {}}
              >
                PLAY AGAIN?
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
