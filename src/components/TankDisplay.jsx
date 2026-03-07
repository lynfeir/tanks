'use client';

export default function TankDisplay({ tank, index, isOpponent, isHighlighted, isHit, isShooter }) {
  if (tank.destroyed && !isHit) {
    return (
      <div className="relative w-[88px] h-[72px] opacity-30">
        <div className="w-full h-full"
          style={{
            backgroundImage: tank.imageUrl ? `url(${tank.imageUrl})` : 'none',
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'grayscale(1) brightness(0.2)',
          }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-pixel text-lg" style={{
            color: 'var(--danger)',
            textShadow: '0 0 10px rgba(255, 0, 68, 0.5)',
          }}>X</span>
        </div>
      </div>
    );
  }

  const maxHp = tank.isKing ? 1 : 2;
  const segments = [];
  for (let s = 0; s < maxHp; s++) {
    const filled = s < tank.hp;
    let segClass = 'hp-segment ';
    if (!filled) {
      segClass += 'hp-segment-empty';
    } else if (tank.isKing) {
      segClass += 'hp-segment-king';
    } else if (tank.hp <= 1) {
      segClass += 'hp-segment-danger';
    } else {
      segClass += 'hp-segment-full';
    }
    segments.push(<div key={s} className={segClass} />);
  }

  return (
    <div className={`relative transition-all duration-300 ${
      isHit ? 'animate-tank-destroy' : ''
    } ${isShooter ? 'animate-tank-fire' : ''} ${
      isHighlighted ? 'scale-110 z-10' : ''
    }`}>
      {/* King indicator */}
      {tank.isKing && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10">
          <span className="font-pixel text-[7px] animate-blink"
            style={{ color: 'var(--king-gold)' }}>[K]</span>
        </div>
      )}

      {/* Tank image */}
      <div className={`w-[88px] h-[72px] transition-all duration-300 ${
        isHighlighted ? 'animate-pixel-pulse' : ''
      }`}
        style={{
          backgroundImage: tank.imageUrl ? `url(${tank.imageUrl})` : 'none',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          background: !tank.imageUrl ? 'rgba(255,255,255,0.03)' : undefined,
          border: isHighlighted
            ? '2px solid var(--accent)'
            : tank.isKing
            ? '2px solid var(--king-gold)'
            : '2px solid var(--pixel-border)',
          transform: isOpponent ? 'scaleX(-1)' : 'none',
          boxShadow: isHighlighted
            ? '0 0 15px rgba(255, 102, 0, 0.4)'
            : tank.isKing
            ? '0 0 10px rgba(255, 204, 0, 0.2)'
            : 'none',
        }} />

      {/* HP segments */}
      <div className="flex gap-0.5 justify-center mt-1">
        {segments}
      </div>

      {/* Label */}
      <div className="text-center mt-0.5">
        <span className="font-pixel text-[6px]"
          style={{
            color: tank.isKing ? 'var(--king-gold)' : 'var(--text-secondary)',
          }}>
          {tank.isKing ? 'KING' : `#${index + 1}`}
        </span>
      </div>
    </div>
  );
}
