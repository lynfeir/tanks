'use client';

/**
 * TankChassis — wraps a player's drawing in a stylized tank silhouette.
 * The drawing is rendered inside the chassis "body" rect; treads + barrel
 * + crown (if king) are drawn around it as separate SVG layers so they
 * always look right regardless of what the player drew.
 *
 * Coordinate system: 100w x 70h SVG viewBox. Container scales it to fit
 * however the parent sized us. Faces RIGHT by default; parent applies
 * scaleX(-1) for opponent side via a wrapper.
 */
export default function TankChassis({
  imageUrl,
  isKing,
  isHighlighted,
  isDestroyed,
  facing = 'right', // 'right' (own) or 'left' (opponent)
}) {
  const accent = isHighlighted ? '#ff6600' : isKing ? '#ffcc00' : '#666688';
  const treadColor = isDestroyed ? '#222233' : '#1a1a2e';
  const wheelColor = isDestroyed ? '#333344' : '#2a2a40';
  const wheelHL = isDestroyed ? '#444455' : '#444466';
  const barrelColor = isDestroyed ? '#222233' : '#3a3a55';
  const flip = facing === 'left';

  return (
    <div className="relative w-full h-full">
      <svg
        viewBox="0 0 100 70"
        className="w-full h-full block"
        preserveAspectRatio="xMidYMid meet"
        style={{ transform: flip ? 'scaleX(-1)' : 'none' }}
      >
        {/* Barrel — sticks out from the top-right of the body */}
        <g>
          <rect x="68" y="22" width="28" height="6" fill={barrelColor} />
          <rect x="68" y="22" width="28" height="2" fill="rgba(255,255,255,0.15)" />
          <rect x="92" y="20" width="4" height="10" fill={barrelColor} />
          <rect x="93" y="22" width="2" height="6" fill="rgba(0,0,0,0.4)" />
        </g>

        {/* Body backplate (behind drawing) */}
        <g>
          <rect x="14" y="18" width="56" height="34" fill="rgba(20, 20, 40, 0.9)"
            stroke={accent} strokeWidth="1.5" />
          {/* Highlight rim */}
          <rect x="15" y="19" width="54" height="2" fill="rgba(255,255,255,0.08)" />
        </g>

        {/* Player drawing — counter-flip so it stays right-side-up even when chassis is mirrored */}
        {imageUrl && (
          <foreignObject x="14" y="18" width="56" height="34">
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                transform: flip ? 'scaleX(-1)' : 'none',
                filter: isDestroyed ? 'grayscale(1) brightness(0.3)' : 'none',
              }}
            />
          </foreignObject>
        )}

        {/* Tread base — long bar across the bottom */}
        <g>
          <rect x="6" y="50" width="80" height="10" fill={treadColor} />
          <rect x="6" y="50" width="80" height="1.5" fill="rgba(255,255,255,0.08)" />
          <rect x="6" y="58.5" width="80" height="1.5" fill="rgba(0,0,0,0.4)" />
          {/* Tread block pattern */}
          {[10, 18, 26, 34, 42, 50, 58, 66, 74, 82].map((x, i) => (
            <rect key={i} x={x} y="52" width="4" height="6" fill={isDestroyed ? '#1a1a22' : '#0a0a18'} />
          ))}
        </g>

        {/* Wheels */}
        {[14, 28, 42, 56, 70].map((cx, i) => (
          <g key={i}>
            <circle cx={cx} cy="55" r="5" fill={wheelColor} stroke="#0a0a14" strokeWidth="1" />
            <circle cx={cx} cy="55" r="2" fill={wheelHL} />
          </g>
        ))}

        {/* Crown (only for king) */}
        {isKing && !isDestroyed && (
          <g>
            <polygon
              points="42,10 47,4 50,10 53,4 58,10 58,16 42,16"
              fill="#ffcc00"
              stroke="#996600"
              strokeWidth="1"
            />
            <circle cx="47" cy="6" r="1.5" fill="#ff4444" />
            <circle cx="50" cy="6" r="1.5" fill="#22cc44" />
            <circle cx="53" cy="6" r="1.5" fill="#4488ff" />
          </g>
        )}

        {/* Destroyed X overlay */}
        {isDestroyed && (
          <g>
            <line x1="14" y1="18" x2="70" y2="52" stroke="#ff0044" strokeWidth="2.5" opacity="0.85" />
            <line x1="70" y1="18" x2="14" y2="52" stroke="#ff0044" strokeWidth="2.5" opacity="0.85" />
          </g>
        )}

        {/* Highlight glow */}
        {isHighlighted && !isDestroyed && (
          <rect x="6" y="14" width="92" height="48" fill="none"
            stroke="#ff6600" strokeWidth="1.5" opacity="0.6" />
        )}
      </svg>
    </div>
  );
}
