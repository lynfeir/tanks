'use client';

export default function TankDisplay({ tank, index, isOpponent, isHighlighted, isHit, isShooter }) {
  if (tank.destroyed && !isHit) {
    return (
      <div className="relative w-20 h-16 opacity-20">
        <div
          className="w-full h-full rounded-lg"
          style={{
            backgroundImage: tank.imageUrl ? `url(${tank.imageUrl})` : 'none',
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'grayscale(1) brightness(0.3)',
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-red-500 text-2xl font-black">
          &#10060;
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative transition-all duration-300 ${
        isHit ? 'animate-tank-destroy' : ''
      } ${isShooter ? 'animate-pulse' : ''} ${
        isHighlighted ? 'scale-110 z-10' : ''
      }`}
    >
      {/* King crown */}
      {tank.isKing && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-lg animate-crown-bounce z-10">
          &#128081;
        </div>
      )}

      {/* Tank image */}
      <div
        className={`w-20 h-16 rounded-lg transition-all ${
          tank.isKing ? 'animate-king-glow' : ''
        } ${isHighlighted ? 'animate-pulse-glow' : ''}`}
        style={{
          backgroundImage: tank.imageUrl ? `url(${tank.imageUrl})` : 'none',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          background: !tank.imageUrl ? 'rgba(255,255,255,0.05)' : undefined,
          border: isHighlighted
            ? '2px solid var(--accent)'
            : tank.isKing
            ? '2px solid var(--king-gold)'
            : '1px solid rgba(255,255,255,0.1)',
          transform: isOpponent ? 'scaleX(-1)' : 'none',
        }}
      />

      {/* HP bar */}
      <div className="mt-1 w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.5)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${(tank.hp / (tank.isKing ? 1 : 2)) * 100}%`,
            background: tank.hp <= 1 ? (tank.isKing ? 'var(--king-gold)' : 'var(--danger)') : 'var(--success)',
          }}
        />
      </div>

      {/* Tank label */}
      <div className="text-center mt-0.5">
        <span className="text-[10px] font-bold" style={{ color: 'var(--text-secondary)' }}>
          {tank.isKing ? 'KING' : `#${index + 1}`}
        </span>
      </div>
    </div>
  );
}
