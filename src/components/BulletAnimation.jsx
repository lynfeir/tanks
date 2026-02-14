'use client';
import { useEffect, useRef, useState } from 'react';

export default function BulletAnimation({ from, to, bulletUrl, active, onImpact, isKingShot }) {
  const [pos, setPos] = useState(from);
  const [visible, setVisible] = useState(false);
  const [trail, setTrail] = useState([]);
  const frameRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (!active || !from || !to) return;

    setVisible(true);
    startTimeRef.current = performance.now();
    const duration = isKingShot ? 600 : 800;

    // Arc parameters - bullet goes up then comes down
    const midX = (from.x + to.x) / 2;
    const arcHeight = Math.abs(to.x - from.x) * 0.3 + 80;

    const trailPoints = [];

    const animate = (now) => {
      const elapsed = now - startTimeRef.current;
      const t = Math.min(elapsed / duration, 1);

      // Quadratic bezier for arc
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      const x = from.x + (to.x - from.x) * ease;
      const linearY = from.y + (to.y - from.y) * ease;
      const arcY = linearY - arcHeight * Math.sin(Math.PI * t);

      const newPos = { x, y: arcY };
      setPos(newPos);

      // Add to trail
      trailPoints.push({ ...newPos, opacity: 1 });
      if (trailPoints.length > 15) trailPoints.shift();
      setTrail([...trailPoints]);

      if (t < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setVisible(false);
        setTrail([]);
        if (onImpact) onImpact();
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [active, from, to, isKingShot, onImpact]);

  if (!visible) return null;

  return (
    <>
      {/* Trail */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 40 }}>
        {trail.map((point, i) => {
          const opacity = (i / trail.length) * 0.6;
          const size = isKingShot ? 4 + (i / trail.length) * 4 : 2 + (i / trail.length) * 3;
          return (
            <circle
              key={i}
              cx={point.x}
              cy={point.y}
              r={size}
              fill={isKingShot ? '#ffd700' : '#ff6b35'}
              opacity={opacity}
            />
          );
        })}
        {/* Smoke trail */}
        {trail.filter((_, i) => i % 3 === 0).map((point, i) => (
          <circle
            key={`smoke-${i}`}
            cx={point.x + (Math.random() - 0.5) * 10}
            cy={point.y + (Math.random() - 0.5) * 10}
            r={3 + Math.random() * 5}
            fill="rgba(150, 150, 150, 0.15)"
          />
        ))}
      </svg>

      {/* Bullet */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: pos.x - 16,
          top: pos.y - 16,
          width: 32,
          height: 32,
          zIndex: 45,
          filter: isKingShot ? 'drop-shadow(0 0 10px #ffd700) drop-shadow(0 0 20px #ff6b35)' : 'drop-shadow(0 0 6px #ff6b35)',
        }}
      >
        {bulletUrl ? (
          <img src={bulletUrl} alt="bullet" className="w-full h-full object-contain" />
        ) : (
          <div
            className="w-full h-full rounded-full"
            style={{
              background: isKingShot
                ? 'radial-gradient(circle, #ffd700, #ff6b35)'
                : 'radial-gradient(circle, #ff6b35, #cc4422)',
            }}
          />
        )}
      </div>
    </>
  );
}
