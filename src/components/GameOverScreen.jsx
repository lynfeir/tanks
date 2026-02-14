'use client';
import { useEffect, useRef, useState } from 'react';
import useGameStore from '@/stores/gameStore';

export default function GameOverScreen() {
  const myTanks = useGameStore((s) => s.myTanks);
  const opponentTanks = useGameStore((s) => s.opponentTanks);
  const resetGame = useGameStore((s) => s.resetGame);

  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const frameRef = useRef(null);
  const [showContent, setShowContent] = useState(false);

  const myAlive = myTanks.filter((t) => !t.destroyed).length;
  const oppAlive = opponentTanks.filter((t) => !t.destroyed).length;
  const isWinner = myAlive > oppAlive;

  useEffect(() => {
    setTimeout(() => setShowContent(true), 500);
  }, []);

  // Confetti animation for winner
  useEffect(() => {
    if (!isWinner || !canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');

    const colors = ['#ff6b35', '#ffd700', '#2ed573', '#1e90ff', '#ff4757', '#a55eea', '#ffffff'];

    particlesRef.current = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      w: 4 + Math.random() * 6,
      h: 8 + Math.random() * 12,
      color: colors[Math.floor(Math.random() * colors.length)],
      vy: 1 + Math.random() * 3,
      vx: (Math.random() - 0.5) * 2,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.03 + Math.random() * 0.05,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p) => {
        p.y += p.vy;
        p.x += p.vx + Math.sin(p.wobble) * 0.5;
        p.rotation += p.rotSpeed;
        p.wobble += p.wobbleSpeed;

        if (p.y > canvas.height + 20) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [isWinner]);

  const handlePlayAgain = () => {
    resetGame();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(10, 10, 26, 0.9)' }}>

      {/* Confetti canvas */}
      {isWinner && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none"
        />
      )}

      {showContent && (
        <div className="text-center animate-slide-up z-10">
          <div className={`text-8xl mb-6 ${isWinner ? 'animate-victory' : ''}`}>
            {isWinner ? '\u{1F3C6}' : '\u{1F4A5}'}
          </div>

          <h1
            className="text-5xl font-black mb-4"
            style={{
              background: isWinner
                ? 'linear-gradient(135deg, var(--king-gold), var(--accent))'
                : 'linear-gradient(135deg, var(--danger), #ff8888)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {isWinner ? 'VICTORY!' : 'DEFEATED'}
          </h1>

          <p className="text-lg mb-8" style={{ color: 'var(--text-secondary)' }}>
            {isWinner
              ? 'You destroyed all enemy tanks!'
              : 'Your tanks have been eliminated.'}
          </p>

          <div className="glass-card p-6 mb-8 inline-block">
            <div className="grid grid-cols-2 gap-8 text-center">
              <div>
                <div className="text-3xl font-black" style={{ color: 'var(--success)' }}>
                  {myAlive}
                </div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Your Tanks Left
                </div>
              </div>
              <div>
                <div className="text-3xl font-black" style={{ color: 'var(--danger)' }}>
                  {oppAlive}
                </div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Enemy Tanks Left
                </div>
              </div>
            </div>
          </div>

          <br />

          <button className="btn-primary text-lg px-10 py-4" onClick={handlePlayAgain}>
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
