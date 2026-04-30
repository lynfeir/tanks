'use client';
import TankChassis from './TankChassis';

export default function TankDisplay({ tank, index, isOpponent, isHighlighted, isHit, isShooter }) {
  const maxHp = tank.isKing ? 1 : 2;
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

  return (
    <div className={`w-[104px] transition-all duration-300 ${
      isHit ? 'animate-tank-destroy' : ''
    } ${isShooter ? 'animate-tank-fire' : ''} ${
      isHighlighted ? 'scale-110 z-10' : ''
    } ${tank.destroyed && !isHit ? 'opacity-60' : ''}`}
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

      {/* Tank chassis with player drawing inside */}
      <div className="w-full h-[68px]">
        <TankChassis
          imageUrl={tank.imageUrl}
          isKing={tank.isKing}
          isHighlighted={isHighlighted}
          isDestroyed={tank.destroyed}
          facing={isOpponent ? 'left' : 'right'}
        />
      </div>

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
