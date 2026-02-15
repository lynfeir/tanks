'use client';
import { useEffect, useRef } from 'react';

const COLORS_NORMAL = ['#ff6b35', '#ff4757', '#ffa502', '#ffda79', '#ff6348', '#ffffff', '#ff7675'];
const COLORS_KING = ['#ffd700', '#ffed4a', '#ff6b35', '#ffffff', '#ffa502', '#ff4757', '#ffe066'];

export default function Explosion({ x, y, active, onComplete, isKingShot }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const frameRef = useRef(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const count = isKingShot ? 80 : 40;
    const colors = isKingShot ? COLORS_KING : COLORS_NORMAL;

    // Create particles with varied behaviors
    particlesRef.current = Array.from({ length: count }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * (isKingShot ? 10 : 6);
      const type = i < count * 0.3 ? 'spark' : i < count * 0.6 ? 'ember' : 'debris';

      return {
        x: 0,
        y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: type === 'spark' ? 0.5 + Math.random() * 1.5
          : type === 'ember' ? 1.5 + Math.random() * 3
          : 2 + Math.random() * (isKingShot ? 6 : 4),
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
        decay: 0.008 + Math.random() * 0.02,
        gravity: type === 'debris' ? 0.08 + Math.random() * 0.06 : 0.02 + Math.random() * 0.03,
        type,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 15,
      };
    });

    let frame = 0;
    const maxFrames = isKingShot ? 100 : 65;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Shockwave rings
      if (frame < 25) {
        const progress = frame / 25;
        const ringRadius = progress * (isKingShot ? 140 : 90);
        const ringOpacity = 1 - progress;

        // Outer ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 107, 53, ${ringOpacity * 0.6})`;
        ctx.lineWidth = isKingShot ? 4 : 2.5;
        ctx.stroke();

        // Inner distortion ring
        if (isKingShot) {
          ctx.beginPath();
          ctx.arc(centerX, centerY, ringRadius * 0.6, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 215, 0, ${ringOpacity * 0.5})`;
          ctx.lineWidth = 3;
          ctx.stroke();

          // Third glow ring
          ctx.beginPath();
          ctx.arc(centerX, centerY, ringRadius * 0.3, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 255, 255, ${ringOpacity * 0.3})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // Initial flash
      if (frame < 8) {
        const flashProgress = frame / 8;
        const flashRadius = isKingShot ? 50 + flashProgress * 20 : 30 + flashProgress * 15;
        const flashOpacity = 1 - flashProgress;

        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, flashRadius);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${flashOpacity})`);
        gradient.addColorStop(0.3, `rgba(255, 220, 100, ${flashOpacity * 0.6})`);
        gradient.addColorStop(1, `rgba(255, 107, 53, 0)`);
        ctx.beginPath();
        ctx.arc(centerX, centerY, flashRadius, 0, Math.PI * 2);
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
        p.vx *= 0.97;
        p.life -= p.decay;
        p.rotation += p.rotSpeed;

        const px = centerX + p.x;
        const py = centerY + p.y;
        const safeLife = Number.isFinite(p.life) ? p.life : 0;
        const currentRadius = Math.max(0.001, p.radius * Math.max(0.1, safeLife));

        ctx.globalAlpha = Math.max(0, p.life);

        if (p.type === 'spark') {
          // Sparks: small bright lines
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(Math.atan2(p.vy, p.vx));
          ctx.beginPath();
          ctx.moveTo(-currentRadius * 3, 0);
          ctx.lineTo(currentRadius * 3, 0);
          ctx.strokeStyle = p.color;
          ctx.lineWidth = Math.max(0.001, currentRadius);
          ctx.stroke();
          ctx.restore();
        } else if (p.type === 'ember') {
          // Embers: glowing circles
          const emberGrad = ctx.createRadialGradient(px, py, 0, px, py, currentRadius * 1.5);
          emberGrad.addColorStop(0, p.color);
          emberGrad.addColorStop(1, 'transparent');
          ctx.beginPath();
          const emberRadius = Math.max(0.001, currentRadius * 1.5);
          ctx.arc(px, py, emberRadius, 0, Math.PI * 2);
          ctx.fillStyle = emberGrad;
          ctx.fill();
        } else {
          // Debris: rotating rectangles
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-currentRadius, -currentRadius * 0.5, currentRadius * 2, currentRadius);
          ctx.restore();
        }

        // Trails for fast particles
        if (p.life > 0.4 && p.type !== 'debris') {
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px - p.vx * 2, py - p.vy * 2);
          ctx.strokeStyle = p.color;
          ctx.lineWidth = Math.max(0.001, currentRadius * 0.4);
          ctx.globalAlpha = p.life * 0.2;
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

  const size = isKingShot ? 400 : 300;

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="absolute pointer-events-none"
      style={{
        left: (x || 0) - size / 2,
        top: (y || 0) - size / 2,
        zIndex: 50,
      }}
    />
  );
}
