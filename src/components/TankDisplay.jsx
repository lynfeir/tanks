'use client';

export default function TankDisplay({ tank, index, isOpponent, isHighlighted, isHit, isShooter }) {
  const maxHp = 2;
  const label = tank.isKing ? 'KING' : `TANK ${index + 1}`;

  const borderColor = isHighlighted
    ? 'var(--accent)'
    : tank.isKing
    ? 'var(--king-gold)'
    : 'var(--pixel-border)';

  const glowStyle = isHighlighted
    ? '0 0 15px rgba(255, 102, 0, 0.4)'
    : tank.isKing
    ? '0 0 10px rgba(255, 204, 0, 0.2)'
    : 'none';

  // HP bar segments
  const segments = [];
  for (let s = 0; s < maxHp; s++) {
    const filled = s < tank.hp;
    let bgColor;
    if (!filled) {
      bgColor = 'var(--bg-primary)';
    } else if (tank.isKing) {
      bgColor = 'var(--king-gold)';
    } else if (tank.hp <= 1) {
      bgColor = 'var(--danger)';
    } else {
      bgColor = 'var(--success)';
    }
    segments.push(
      <div key={s} className="flex-1 h-[6px]" style={{
        background: bgColor,
        border: `1px solid ${filled ? 'transparent' : 'var(--pixel-border)'}`,
      }} />
    );
  }

  if (tank.destroyed && !isHit) {
    return (
      <div className="w-[104px] opacity-40" style={{
        border: `2px solid var(--pixel-border)`,
        background: 'rgba(10, 10, 30, 0.8)',
      }}>
        {/* Label bar */}
        <div className="px-1 py-0.5 text-center" style={{
          background: 'var(--bg-primary)',
          borderBottom: '1px solid var(--pixel-border)',
        }}>
          <span className="font-pixel text-[6px]" style={{ color: 'var(--text-secondary)' }}>
            {label}
          </span>
        </div>
        {/* Tank image — destroyed */}
        <div className="w-full h-[68px] relative"
          style={{
            backgroundImage: tank.imageUrl ? `url(${tank.imageUrl})` : 'none',
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'grayscale(1) brightness(0.2)',
          }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-pixel text-lg" style={{
              color: 'var(--danger)',
              textShadow: '0 0 10px rgba(255, 0, 68, 0.5)',
            }}>X</span>
          </div>
        </div>
        {/* HP bar — empty */}
        <div className="flex gap-0.5 px-1 py-1">
          {Array.from({ length: maxHp }, (_, s) => (
            <div key={s} className="flex-1 h-[6px]" style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--pixel-border)',
            }} />
          ))}
          <span className="font-pixel text-[5px] ml-1" style={{ color: 'var(--text-secondary)' }}>
            0/{maxHp}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-[104px] transition-all duration-300 ${
      isHit ? 'animate-tank-destroy' : ''
    } ${isShooter ? 'animate-tank-fire' : ''} ${
      isHighlighted ? 'scale-110 z-10' : ''
    }`}
      style={{
        border: `2px solid ${borderColor}`,
        background: 'rgba(10, 10, 30, 0.85)',
        boxShadow: glowStyle,
      }}>
      {/* Label bar */}
      <div className="px-1 py-0.5 text-center" style={{
        background: tank.isKing ? 'rgba(255, 204, 0, 0.15)' : 'var(--bg-primary)',
        borderBottom: `1px solid ${borderColor}`,
      }}>
        <span className="font-pixel text-[6px]" style={{
          color: tank.isKing ? 'var(--king-gold)' : 'var(--text-secondary)',
        }}>
          {tank.isKing ? '[KING]' : label}
        </span>
      </div>

      {/* Tank image */}
      <div className="w-full h-[68px]"
        style={{
          backgroundImage: tank.imageUrl ? `url(${tank.imageUrl})` : 'none',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          background: !tank.imageUrl ? 'rgba(255,255,255,0.03)' : undefined,
          transform: isOpponent ? 'scaleX(-1)' : 'none',
        }} />

      {/* HP bar with count */}
      <div className="flex gap-0.5 items-center px-1 py-1">
        {segments}
        <span className="font-pixel text-[5px] ml-1 whitespace-nowrap" style={{
          color: tank.hp <= 1 && tank.hp > 0 ? 'var(--danger)' : 'var(--text-secondary)',
        }}>
          {tank.hp}/{maxHp}
        </span>
      </div>
    </div>
  );
}
