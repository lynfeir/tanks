'use client';
import { useEffect, useRef, useState } from 'react';

export default function BulletAnimation({ from, to, bulletUrl, active, onImpact, isKingShot }) {
  const [pos, setPos] = useState(from);
  const [visible, setVisible] = useState(false);
  const [trail, setTrail] = useState([]);
  const [rotation, setRotation] = useState(0);
  const frameRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (!active || !from || !to) return;

    setPos(from);
    setVisible(true);
    startTimeRef.current = performance.now();
    const duration = isKingShot ? 550 : 750;

    // Arc parameters
    const arcHeight = Math.abs(to.x - from.x) * 0.25 + 100;
    const trailPoints = [];

    const animate = (now) => {
      const elapsed = now - startTimeRef.current;
      const t = Math.min(elapsed / duration, 1);

      // Smooth easing
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      const x = from.x + (to.x - from.x) * ease;
      const linearY = from.y + (to.y - from.y) * ease;
      const arcY = linearY - arcHeight * Math.sin(Math.PI * t);

      const newPos = { x, y: arcY };
      setPos(newPos);
      setRotation(t * 720); // Spin the bullet

      // Build trail
      trailPoints.push({ ...newPos, t });
      if (trailPoints.length > 20) trailPoints.shift();
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
  const safePos = pos || from || { x: 0, y: 0 };

  const trailColor = isKingShot ? '#ffd700' : '#ff6b35';
  const glowColor = isKingShot ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 107, 53, 0.2)';

  return (
    <>
      {/* Trail effect */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 40 }}>
        <defs>
          <linearGradient id="trailGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={trailColor} stopOpacity="0" />
            <stop offset="100%" stopColor={trailColor} stopOpacity="0.8" />
          </linearGradient>
          <filter id="trailGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Main trail line */}
        {trail.length > 1 && (
          <path
            d={`M ${trail.map(p => `${p.x} ${p.y}`).join(' L ')}`}
            fill="none"
            stroke={trailColor}
            strokeWidth={isKingShot ? 3 : 2}
            opacity="0.5"
            filter="url(#trailGlow)"
            strokeLinecap="round"
          />
        )}

        {/* Trail particles */}
        {trail.map((point, i) => {
          const opacity = (i / trail.length) * 0.7;
          const size = isKingShot ? 3 + (i / trail.length) * 5 : 1.5 + (i / trail.length) * 3;
          return (
            <circle
              key={i}
              cx={point.x}
              cy={point.y}
              r={size}
              fill={trailColor}
              opacity={opacity}
            />
          );
        })}

        {/* Ember/spark particles along trail */}
        {trail.filter((_, i) => i % 4 === 0).map((point, i) => (
          <circle
            key={`ember-${i}`}
            cx={point.x + (Math.sin(i * 3) * 8)}
            cy={point.y + (Math.cos(i * 2) * 8)}
            r={1 + Math.sin(i) * 0.5}
            fill={isKingShot ? '#ffed4a' : '#ffaa66'}
            opacity={0.4}
          />
        ))}
      </svg>

      {/* Bullet */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: safePos.x - (isKingShot ? 20 : 16),
          top: safePos.y - (isKingShot ? 20 : 16),
          width: isKingShot ? 40 : 32,
          height: isKingShot ? 40 : 32,
          zIndex: 45,
          filter: isKingShot
            ? 'drop-shadow(0 0 12px #ffd700) drop-shadow(0 0 25px #ff6b35)'
            : 'drop-shadow(0 0 8px #ff6b35) drop-shadow(0 0 4px #ff4444)',
          transform: `rotate(${rotation}deg)`,
        }}
      >
        {bulletUrl ? (
          <img src={bulletUrl} alt="bullet" className="w-full h-full object-contain" />
        ) : (
          <div
            className="w-full h-full rounded-full"
            style={{
              background: isKingShot
                ? 'radial-gradient(circle at 35% 35%, #fff5cc, #ffd700, #ff8c00)'
                : 'radial-gradient(circle at 35% 35%, #ffaa66, #ff6b35, #cc3300)',
              boxShadow: isKingShot
                ? 'inset 0 -2px 4px rgba(0,0,0,0.3), 0 0 8px rgba(255,215,0,0.5)'
                : 'inset 0 -2px 4px rgba(0,0,0,0.3)',
            }}
          />
        )}
      </div>

      {/* Leading glow */}
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          left: safePos.x - 30,
          top: safePos.y - 30,
          width: 60,
          height: 60,
          zIndex: 44,
          background: `radial-gradient(circle, ${glowColor}, transparent)`,
        }}
      />
    </>
  );
}
