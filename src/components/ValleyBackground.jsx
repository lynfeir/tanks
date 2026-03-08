'use client';
import { useEffect, useRef, useState } from 'react';

// Pre-compute star data to avoid random values on each render
const STARS = [
  { cx: 100, cy: 60, r: 1.2, baseOp: 0.5, dur: 2.3 },
  { cx: 200, cy: 90, r: 0.8, baseOp: 0.7, dur: 3.1 },
  { cx: 350, cy: 40, r: 1.5, baseOp: 0.4, dur: 2.7 },
  { cx: 500, cy: 80, r: 0.9, baseOp: 0.6, dur: 4.2 },
  { cx: 650, cy: 30, r: 1.1, baseOp: 0.8, dur: 2.5 },
  { cx: 780, cy: 70, r: 0.7, baseOp: 0.5, dur: 3.8 },
  { cx: 900, cy: 50, r: 1.3, baseOp: 0.9, dur: 2.1 },
  { cx: 1050, cy: 85, r: 0.8, baseOp: 0.3, dur: 4.5 },
  { cx: 1150, cy: 45, r: 1.0, baseOp: 0.7, dur: 3.3 },
  { cx: 150, cy: 120, r: 0.6, baseOp: 0.6, dur: 2.9 },
  { cx: 450, cy: 110, r: 1.4, baseOp: 0.4, dur: 3.6 },
  { cx: 700, cy: 100, r: 0.9, baseOp: 0.8, dur: 2.8 },
  { cx: 950, cy: 130, r: 1.1, baseOp: 0.5, dur: 4.1 },
  { cx: 300, cy: 150, r: 0.7, baseOp: 0.7, dur: 3.4 },
  { cx: 850, cy: 140, r: 1.2, baseOp: 0.3, dur: 2.6 },
  { cx: 50, cy: 30, r: 0.8, baseOp: 0.9, dur: 3.9 },
  { cx: 550, cy: 55, r: 1.5, baseOp: 0.6, dur: 2.2 },
  { cx: 1100, cy: 110, r: 0.6, baseOp: 0.4, dur: 4.3 },
  { cx: 250, cy: 75, r: 1.0, baseOp: 0.7, dur: 3.0 },
  { cx: 620, cy: 125, r: 0.8, baseOp: 0.5, dur: 2.4 },
  { cx: 420, cy: 25, r: 1.3, baseOp: 0.6, dur: 3.7 },
  { cx: 180, cy: 165, r: 0.7, baseOp: 0.8, dur: 4.0 },
  { cx: 830, cy: 35, r: 1.1, baseOp: 0.4, dur: 2.5 },
  { cx: 1020, cy: 65, r: 0.9, baseOp: 0.7, dur: 3.2 },
  { cx: 75, cy: 95, r: 1.4, baseOp: 0.5, dur: 2.8 },
];

const FIREFLIES = [
  { cx: 450, cy: 540, delay: 0 },
  { cx: 550, cy: 530, delay: 0.7 },
  { cx: 650, cy: 535, delay: 1.4 },
  { cx: 750, cy: 540, delay: 2.1 },
  { cx: 500, cy: 545, delay: 2.8 },
  { cx: 600, cy: 525, delay: 3.5 },
  { cx: 700, cy: 550, delay: 0.5 },
  { cx: 520, cy: 548, delay: 1.2 },
  { cx: 680, cy: 538, delay: 1.9 },
  { cx: 580, cy: 555, delay: 2.6 },
  { cx: 480, cy: 535, delay: 3.3 },
  { cx: 720, cy: 545, delay: 0.9 },
];

const LEFT_TREES = [
  { x: 60, y: 365, h: 18, rx: 10, ry: 14 },
  { x: 130, y: 400, h: 20, rx: 12, ry: 16 },
  { x: 200, y: 435, h: 16, rx: 9, ry: 13 },
  { x: 90, y: 380, h: 14, rx: 8, ry: 11 },
  { x: 40, y: 355, h: 12, rx: 7, ry: 10 },
];

const RIGHT_TREES = [
  { x: 1140, y: 365, h: 18, rx: 10, ry: 14 },
  { x: 1070, y: 400, h: 20, rx: 12, ry: 16 },
  { x: 1000, y: 435, h: 16, rx: 9, ry: 13 },
  { x: 1110, y: 380, h: 14, rx: 8, ry: 11 },
  { x: 1160, y: 355, h: 12, rx: 7, ry: 10 },
];

export default function ValleyBackground({ children, shaking }) {
  const containerRef = useRef(null);
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const handleMove = (e) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setMouse({ x: e.clientX / w, y: e.clientY / h });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  const px = (mouse.x - 0.5) * 2;
  const py = (mouse.y - 0.5) * 2;

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-screen overflow-hidden ${shaking ? 'animate-shake' : ''}`}
      style={{ background: '#060614' }}
    >
      <svg
        viewBox="0 0 1200 700"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Sky gradient — deep purple-blue night */}
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#050520" />
            <stop offset="20%" stopColor="#0d0d35" />
            <stop offset="45%" stopColor="#1a0f42" />
            <stop offset="70%" stopColor="#251450" />
            <stop offset="100%" stopColor="#1a1040" />
          </linearGradient>

          {/* Aurora gradient */}
          <linearGradient id="auroraGrad1" x1="0" y1="0" x2="1" y2="0.3">
            <stop offset="0%" stopColor="#1a8f5c" stopOpacity="0" />
            <stop offset="30%" stopColor="#2ed573" stopOpacity="0.08" />
            <stop offset="50%" stopColor="#1a8f5c" stopOpacity="0.12" />
            <stop offset="70%" stopColor="#7bed9f" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#2ed573" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="auroraGrad2" x1="0.2" y1="0" x2="0.8" y2="0.5">
            <stop offset="0%" stopColor="#6c5ce7" stopOpacity="0" />
            <stop offset="40%" stopColor="#a55eea" stopOpacity="0.06" />
            <stop offset="60%" stopColor="#6c5ce7" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#a55eea" stopOpacity="0" />
          </linearGradient>

          {/* Mountain gradients */}
          <linearGradient id="farMountGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e1650" />
            <stop offset="50%" stopColor="#161040" />
            <stop offset="100%" stopColor="#0e0a2a" />
          </linearGradient>
          <linearGradient id="nearMountGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2a2060" />
            <stop offset="40%" stopColor="#221850" />
            <stop offset="100%" stopColor="#181240" />
          </linearGradient>
          <linearGradient id="midMountGrad" x1="0.3" y1="0" x2="0.7" y2="1">
            <stop offset="0%" stopColor="#241a55" />
            <stop offset="100%" stopColor="#141030" />
          </linearGradient>

          {/* Valley floor */}
          <linearGradient id="valleyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a1545" />
            <stop offset="60%" stopColor="#121035" />
            <stop offset="100%" stopColor="#0a0825" />
          </linearGradient>
          <linearGradient id="grassGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a4030" />
            <stop offset="100%" stopColor="#0d2818" />
          </linearGradient>

          {/* Moon glow */}
          <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff5e0" stopOpacity="0.5" />
            <stop offset="30%" stopColor="#ffcc80" stopOpacity="0.2" />
            <stop offset="60%" stopColor="#ffaa44" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#ffaa44" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="moonDisc" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#fffbe8" />
            <stop offset="100%" stopColor="#ffe8b0" />
          </radialGradient>

          {/* Mist */}
          <linearGradient id="mistGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="40%" stopColor="#aaaacc" stopOpacity="0.03" />
            <stop offset="60%" stopColor="#aaaacc" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          <filter id="starBlur">
            <feGaussianBlur stdDeviation="1" />
          </filter>

          <radialGradient id="fireflyGlow">
            <stop offset="0%" stopColor="#7bed9f" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#2ed573" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#2ed573" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Layer 1: Deep Sky */}
        <rect width="1200" height="700" fill="url(#skyGrad)" />

        {/* Aurora bands */}
        <g style={{ transform: `translate(${px * -6}px, ${py * -3}px)` }}>
          <ellipse cx="600" cy="140" rx="500" ry="80" fill="url(#auroraGrad1)">
            <animate attributeName="rx" values="500;520;480;500" dur="8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0.7;1" dur="6s" repeatCount="indefinite" />
          </ellipse>
          <ellipse cx="500" cy="170" rx="400" ry="60" fill="url(#auroraGrad2)">
            <animate attributeName="rx" values="400;380;420;400" dur="10s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;1;0.8" dur="7s" repeatCount="indefinite" />
          </ellipse>
        </g>

        {/* Stars */}
        <g style={{ transform: `translate(${px * -2}px, ${py * -2}px)` }}>
          {STARS.map((star, i) => (
            <g key={i}>
              <circle cx={star.cx} cy={star.cy} r={star.r} fill="white" opacity={star.baseOp}>
                <animate
                  attributeName="opacity"
                  values={`${star.baseOp * 0.4};${star.baseOp};${star.baseOp * 0.4}`}
                  dur={`${star.dur}s`}
                  repeatCount="indefinite"
                />
              </circle>
              {star.r > 1.2 && (
                <circle cx={star.cx} cy={star.cy} r={star.r * 3} fill="white" opacity={star.baseOp * 0.08} />
              )}
            </g>
          ))}
        </g>

        {/* Shooting stars */}
        <g style={{ transform: `translate(${px * -3}px, ${py * -2}px)` }}>
          <line x1="0" y1="0" x2="40" y2="20" stroke="white" strokeWidth="1.5" opacity="0" filter="url(#starBlur)">
            <animateMotion path="M300,50 L500,130" dur="1.5s" begin="0s" repeatCount="indefinite" repeatDur="12s" />
            <animate attributeName="opacity" values="0;0;0.9;0" dur="1.5s" begin="0s" repeatCount="indefinite" repeatDur="12s" />
          </line>
          <line x1="0" y1="0" x2="30" y2="15" stroke="white" strokeWidth="1" opacity="0" filter="url(#starBlur)">
            <animateMotion path="M800,30 L950,100" dur="1.2s" begin="7s" repeatCount="indefinite" repeatDur="15s" />
            <animate attributeName="opacity" values="0;0;0.7;0" dur="1.2s" begin="7s" repeatCount="indefinite" repeatDur="15s" />
          </line>
        </g>

        {/* Moon */}
        <g style={{ transform: `translate(${px * -5}px, ${py * -3}px)` }}>
          <circle cx="950" cy="100" r="100" fill="url(#moonGlow)" />
          <circle cx="950" cy="100" r="28" fill="url(#moonDisc)" />
          <circle cx="938" cy="91" r="5" fill="#e8d8b0" opacity="0.2" />
          <circle cx="960" cy="107" r="3.5" fill="#e8d8b0" opacity="0.15" />
          <circle cx="945" cy="112" r="6" fill="#e8d8b0" opacity="0.18" />
          <circle cx="955" cy="90" r="2" fill="#e8d8b0" opacity="0.12" />
          <circle cx="950" cy="100" r="45" fill="none" stroke="#fff5e0" strokeWidth="0.5" opacity="0.08">
            <animate attributeName="r" values="45;50;45" dur="4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.08;0.04;0.08" dur="4s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Far mountains */}
        <g style={{ transform: `translate(${px * -8}px, ${py * -4}px)` }}>
          <path
            d="M-50 420 L60 280 L150 320 L250 240 L340 290 L440 220 L530 260 L640 200 L730 250 L830 210 L920 245 L1020 190 L1100 250 L1180 220 L1250 280 L1250 700 L-50 700Z"
            fill="url(#farMountGrad)"
            opacity="0.5"
          />
          <path d="M640 200 L625 215 L655 215Z" fill="white" opacity="0.06" />
          <path d="M1020 190 L1005 208 L1035 208Z" fill="white" opacity="0.05" />
        </g>

        {/* Mid mountains */}
        <g style={{ transform: `translate(${px * -12}px, ${py * -5}px)` }}>
          <path
            d="M-50 440 L80 330 L170 370 L300 280 L400 340 L510 290 L620 310 L740 260 L860 310 L960 270 L1070 330 L1170 295 L1250 350 L1250 700 L-50 700Z"
            fill="url(#midMountGrad)"
            opacity="0.65"
          />
        </g>

        {/* Near mountains */}
        <g style={{ transform: `translate(${px * -16}px, ${py * -6}px)` }}>
          <path
            d="M-50 460 L30 370 L120 400 L230 320 L330 370 L440 330 L540 355 L660 300 L790 345 L900 310 L1020 360 L1120 330 L1200 375 L1250 370 L1250 700 L-50 700Z"
            fill="url(#nearMountGrad)"
            opacity="0.8"
          />
          <path
            d="M230 320 L330 370 L440 330 L540 355 L660 300"
            fill="none"
            stroke="rgba(160, 140, 200, 0.08)"
            strokeWidth="2"
          />
        </g>

        {/* Mist layer */}
        <g style={{ transform: `translate(${px * -5}px, 0)` }}>
          <rect x="0" y="360" width="1200" height="100" fill="url(#mistGrad)">
            <animate attributeName="opacity" values="0.4;0.7;0.4" dur="8s" repeatCount="indefinite" />
          </rect>
        </g>

        {/* Valley floor — angular \__/ shape */}
        <g style={{ transform: `translate(${px * -5}px, 0)` }}>
          {/* Main valley shape */}
          <path
            d="M-50 700 L-50 340 L420 560 L780 560 L1250 340 L1250 700Z"
            fill="url(#valleyGrad)"
          />
          {/* Grass edge on slopes */}
          <path
            d="M-50 345 L420 565 L780 565 L1250 345 L1250 355 L780 575 L420 575 L-50 355Z"
            fill="url(#grassGrad)"
            opacity="0.6"
          />
          {/* Plateau surface detail */}
          <path
            d="M450 565 Q600 570 750 565"
            fill="none"
            stroke="rgba(100, 90, 140, 0.15)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Left slope texture lines */}
          <line x1="100" y1="395" x2="120" y2="405" stroke="rgba(100, 90, 140, 0.08)" strokeWidth="1.5" />
          <line x1="200" y1="440" x2="225" y2="452" stroke="rgba(100, 90, 140, 0.08)" strokeWidth="1.5" />
          <line x1="300" y1="485" x2="330" y2="500" stroke="rgba(100, 90, 140, 0.08)" strokeWidth="1.5" />
          {/* Right slope texture lines */}
          <line x1="1100" y1="395" x2="1080" y2="405" stroke="rgba(100, 90, 140, 0.08)" strokeWidth="1.5" />
          <line x1="1000" y1="440" x2="975" y2="452" stroke="rgba(100, 90, 140, 0.08)" strokeWidth="1.5" />
          <line x1="900" y1="485" x2="870" y2="500" stroke="rgba(100, 90, 140, 0.08)" strokeWidth="1.5" />
        </g>

        {/* Trees */}
        <g style={{ transform: `translate(${px * -10}px, 0)` }} opacity="0.55">
          {LEFT_TREES.map((t, i) => (
            <g key={`tree-l-${i}`}>
              <rect x={t.x - 1.5} y={t.y} width="3" height={t.h} fill="#2d1b0e" opacity="0.8" />
              <ellipse cx={t.x} cy={t.y - t.ry * 0.4} rx={t.rx} ry={t.ry} fill="#15422a" opacity="0.75" />
              <ellipse cx={t.x} cy={t.y - t.ry * 0.4} rx={t.rx * 0.7} ry={t.ry * 0.7} fill="#1a5030" opacity="0.5" />
            </g>
          ))}
          {RIGHT_TREES.map((t, i) => (
            <g key={`tree-r-${i}`}>
              <rect x={t.x - 1.5} y={t.y} width="3" height={t.h} fill="#2d1b0e" opacity="0.8" />
              <ellipse cx={t.x} cy={t.y - t.ry * 0.4} rx={t.rx} ry={t.ry} fill="#15422a" opacity="0.75" />
              <ellipse cx={t.x} cy={t.y - t.ry * 0.4} rx={t.rx * 0.7} ry={t.ry * 0.7} fill="#1a5030" opacity="0.5" />
            </g>
          ))}
          <ellipse cx="580" cy="433" rx="12" ry="5" fill="#12301e" opacity="0.4" />
          <ellipse cx="620" cy="431" rx="10" ry="4" fill="#12301e" opacity="0.35" />
          <ellipse cx="440" cy="428" rx="8" ry="3" fill="#12301e" opacity="0.3" />
          <ellipse cx="760" cy="428" rx="9" ry="4" fill="#12301e" opacity="0.3" />
        </g>

        {/* Fireflies */}
        <g style={{ transform: `translate(${px * -20}px, ${py * -10}px)` }}>
          {FIREFLIES.map((fly, i) => (
            <g key={`fly-${i}`}>
              <circle cx={fly.cx} cy={fly.cy} r="6" fill="url(#fireflyGlow)" opacity="0">
                <animate attributeName="opacity" values="0;0.5;0" dur={`${3 + i * 0.4}s`} repeatCount="indefinite" begin={`${fly.delay}s`} />
                <animate attributeName="cy" values={`${fly.cy};${fly.cy - 18};${fly.cy}`} dur={`${4 + i * 0.3}s`} repeatCount="indefinite" begin={`${fly.delay}s`} />
              </circle>
              <circle cx={fly.cx} cy={fly.cy} r="1.5" fill="#7bed9f" opacity="0">
                <animate attributeName="opacity" values="0;0.9;0" dur={`${3 + i * 0.4}s`} repeatCount="indefinite" begin={`${fly.delay}s`} />
                <animate attributeName="cy" values={`${fly.cy};${fly.cy - 18};${fly.cy}`} dur={`${4 + i * 0.3}s`} repeatCount="indefinite" begin={`${fly.delay}s`} />
              </circle>
            </g>
          ))}
        </g>

        {/* Dust motes */}
        <g style={{ transform: `translate(${px * -25}px, ${py * -12}px)` }} opacity="0.3">
          {[
            { cx: 150, cy: 410, r: 1 },
            { cx: 250, cy: 455, r: 0.8 },
            { cx: 350, cy: 500, r: 1.2 },
            { cx: 850, cy: 500, r: 0.7 },
            { cx: 950, cy: 455, r: 1 },
            { cx: 1050, cy: 410, r: 0.9 },
          ].map((p, i) => (
            <circle key={`dust-${i}`} cx={p.cx} cy={p.cy} r={p.r} fill="#aabbcc">
              <animate attributeName="cy" values={`${p.cy};${p.cy - 8};${p.cy}`} dur={`${5 + i}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.2;0.5;0.2" dur={`${4 + i * 0.5}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </g>
      </svg>

      {/* Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none z-[5]"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)',
        }} />

      {/* Content overlay */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}
