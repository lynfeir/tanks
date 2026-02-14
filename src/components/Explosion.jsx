'use client';
import { useEffect, useRef } from 'react';

const PARTICLE_COUNT = 30;
const COLORS = ['#ff6b35', '#ff4757', '#ffa502', '#ffda79', '#ff6348', '#ffffff'];

export default function Explosion({ x, y, active, onComplete, isKingShot }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const frameRef = useRef(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const count = isKingShot ? PARTICLE_COUNT * 2 : PARTICLE_COUNT;
    const colors = isKingShot
      ? ['#ffd700', '#ffed4a', '#ff6b35', '#ffffff', '#ffa502', '#ff4757']
      : COLORS;

    // Initialize particles
    particlesRef.current = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * (isKingShot ? 8 : 5);
      return {
        x: 0,
        y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 1 + Math.random() * (isKingShot ? 5 : 3),
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
        decay: 0.01 + Math.random() * 0.025,
        gravity: 0.05 + Math.random() * 0.05,
      };
    });

    let frame = 0;
    const maxFrames = isKingShot ? 80 : 50;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Shockwave ring
      if (frame < 20) {
        const ringRadius = frame * (isKingShot ? 6 : 4);
        const ringOpacity = 1 - frame / 20;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 107, 53, ${ringOpacity})`;
        ctx.lineWidth = isKingShot ? 4 : 2;
        ctx.stroke();

        if (isKingShot) {
          ctx.beginPath();
          ctx.arc(centerX, centerY, ringRadius * 0.7, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 215, 0, ${ringOpacity * 0.7})`;
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      }

      // Flash
      if (frame < 5) {
        const flashOpacity = 1 - frame / 5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, isKingShot ? 40 : 25, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, isKingShot ? 40 : 25);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${flashOpacity})`);
        gradient.addColorStop(1, `rgba(255, 107, 53, 0)`);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      // Particles
      let alive = false;
      particlesRef.current.forEach((p) => {
        if (p.life <= 0) return;
        alive = true;

        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.98;
        p.life -= p.decay;

        ctx.globalAlpha = Math.max(0, p.life);
        ctx.beginPath();
        ctx.arc(centerX + p.x, centerY + p.y, p.radius * p.life, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        // Trails
        if (p.life > 0.3) {
          ctx.beginPath();
          ctx.moveTo(centerX + p.x, centerY + p.y);
          ctx.lineTo(centerX + p.x - p.vx * 2, centerY + p.y - p.vy * 2);
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.radius * p.life * 0.5;
          ctx.globalAlpha = p.life * 0.3;
          ctx.stroke();
        }
      });

      ctx.globalAlpha = 1;
      frame++;

      if (alive && frame < maxFrames) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        if (onComplete) onComplete();
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [active, isKingShot, onComplete]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={300}
      className="absolute pointer-events-none"
      style={{
        left: (x || 0) - 150,
        top: (y || 0) - 150,
        zIndex: 50,
      }}
    />
  );
}
