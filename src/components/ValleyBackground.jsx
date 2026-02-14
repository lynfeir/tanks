'use client';
import { useEffect, useRef, useState } from 'react';

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
      style={{ background: '#0a0a1a' }}
    >
      <svg
        viewBox="0 0 1200 700"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Sky gradient */}
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0a0a2e" />
            <stop offset="30%" stopColor="#1a1040" />
            <stop offset="60%" stopColor="#2d1b4e" />
            <stop offset="100%" stopColor="#1a1a3e" />
          </linearGradient>

          {/* Stars */}
          <radialGradient id="starGlow">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>

          {/* Mountain gradients */}
          <linearGradient id="farMountGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a1a4e" />
            <stop offset="100%" stopColor="#12122a" />
          </linearGradient>
          <linearGradient id="nearMountGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#252550" />
            <stop offset="100%" stopColor="#1a1a3e" />
          </linearGradient>
          <linearGradient id="valleyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e1e45" />
            <stop offset="100%" stopColor="#151530" />
          </linearGradient>
          <linearGradient id="grassGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a3a25" />
            <stop offset="100%" stopColor="#0f2518" />
          </linearGradient>

          {/* Moon glow */}
          <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffeedd" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#ffcc99" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#ffcc99" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Layer 1: Sky */}
        <rect width="1200" height="700" fill="url(#skyGrad)" />

        {/* Stars */}
        <g style={{ transform: `translate(${px * -2}px, ${py * -2}px)` }}>
          {[
            [100, 60], [200, 90], [350, 40], [500, 80], [650, 30],
            [780, 70], [900, 50], [1050, 85], [1150, 45], [150, 120],
            [450, 110], [700, 100], [950, 130], [300, 150], [850, 140],
            [50, 30], [550, 55], [1100, 110], [250, 75], [620, 125],
          ].map(([cx, cy], i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={Math.random() > 0.7 ? 1.5 : 0.8}
              fill="white"
              opacity={0.3 + Math.random() * 0.7}
            >
              <animate
                attributeName="opacity"
                values={`${0.3 + Math.random() * 0.4};${0.7 + Math.random() * 0.3};${0.3 + Math.random() * 0.4}`}
                dur={`${2 + Math.random() * 3}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </g>

        {/* Moon */}
        <g style={{ transform: `translate(${px * -5}px, ${py * -3}px)` }}>
          <circle cx="950" cy="100" r="80" fill="url(#moonGlow)" />
          <circle cx="950" cy="100" r="25" fill="#ffeedd" opacity="0.9" />
          <circle cx="940" cy="93" r="4" fill="#eeddcc" opacity="0.3" />
          <circle cx="958" cy="105" r="3" fill="#eeddcc" opacity="0.2" />
          <circle cx="945" cy="110" r="5" fill="#eeddcc" opacity="0.25" />
        </g>

        {/* Layer 2: Far mountains */}
        <g style={{ transform: `translate(${px * -8}px, ${py * -4}px)` }}>
          <path
            d="M-50 400 L100 250 L200 310 L350 200 L450 280 L550 220 L700 190 L850 260 L950 210 L1050 280 L1150 230 L1250 300 L1250 700 L-50 700Z"
            fill="url(#farMountGrad)"
            opacity="0.6"
          />
        </g>

        {/* Layer 3: Near mountains */}
        <g style={{ transform: `translate(${px * -15}px, ${py * -6}px)` }}>
          <path
            d="M-50 450 L50 350 L150 390 L280 300 L380 360 L500 310 L600 340 L720 280 L850 330 L950 290 L1080 350 L1180 310 L1250 370 L1250 700 L-50 700Z"
            fill="url(#nearMountGrad)"
            opacity="0.8"
          />
        </g>

        {/* Layer 4: Valley floor — gentle U shape */}
        <g style={{ transform: `translate(${px * -5}px, 0)` }}>
          <path
            d="M-50 700 L-50 520 Q0 500 100 470 Q200 445 300 430 Q450 420 600 425 Q750 420 900 430 Q1000 445 1100 470 Q1200 500 1250 520 L1250 700Z"
            fill="url(#valleyGrad)"
          />
          {/* Grass layer on top of valley */}
          <path
            d="M-50 525 Q0 505 100 475 Q200 450 300 435 Q450 425 600 430 Q750 425 900 435 Q1000 450 1100 475 Q1200 505 1250 525 L1250 540 Q1200 518 1100 488 Q1000 463 900 448 Q750 438 600 443 Q450 438 300 448 Q200 463 100 488 Q0 518 -50 540Z"
            fill="url(#grassGrad)"
            opacity="0.7"
          />
        </g>

        {/* Layer 5: Grass details and small trees */}
        <g style={{ transform: `translate(${px * -10}px, 0)` }} opacity="0.5">
          {/* Left slope trees */}
          {[
            [80, 478], [150, 458], [50, 490],
          ].map(([x, y], i) => (
            <g key={`tree-l-${i}`}>
              <rect x={x - 1} y={y} width="2" height="12" fill="#2d1b0e" />
              <ellipse cx={x} cy={y - 4} rx="8" ry="10" fill="#1a4a25" opacity="0.7" />
            </g>
          ))}
          {/* Right slope trees */}
          {[
            [1100, 478], [1050, 458], [1150, 490],
          ].map(([x, y], i) => (
            <g key={`tree-r-${i}`}>
              <rect x={x - 1} y={y} width="2" height="12" fill="#2d1b0e" />
              <ellipse cx={x} cy={y - 4} rx="8" ry="10" fill="#1a4a25" opacity="0.7" />
            </g>
          ))}
        </g>

        {/* Layer 6: Atmospheric particles (fireflies) */}
        <g style={{ transform: `translate(${px * -20}px, ${py * -10}px)` }}>
          {[
            [200, 400], [400, 380], [600, 420], [800, 390], [1000, 410],
            [300, 450], [500, 440], [700, 460], [900, 430], [150, 430],
          ].map(([cx, cy], i) => (
            <circle key={`fly-${i}`} cx={cx} cy={cy} r="1.5" fill="#7bed9f" opacity="0.6">
              <animate
                attributeName="opacity"
                values="0;0.8;0"
                dur={`${3 + i * 0.5}s`}
                repeatCount="indefinite"
                begin={`${i * 0.7}s`}
              />
              <animate
                attributeName="cy"
                values={`${cy};${cy - 15};${cy}`}
                dur={`${4 + i * 0.3}s`}
                repeatCount="indefinite"
                begin={`${i * 0.5}s`}
              />
            </circle>
          ))}
        </g>
      </svg>

      {/* Content overlay */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}
