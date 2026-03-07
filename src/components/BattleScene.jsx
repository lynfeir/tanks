'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import ValleyBackground from './ValleyBackground';
import TankDisplay from './TankDisplay';
import DiceRoller from './DiceRoller';
import BulletAnimation from './BulletAnimation';
import Explosion from './Explosion';
import useGameStore from '@/stores/gameStore';

// Percentage-based positions in a 1000x1000 virtual grid
// Tanks arranged in a V-formation on each slope
const TANK_POSITIONS_LEFT = [
  { x: 80, y: 58 },  { x: 155, y: 53 }, { x: 230, y: 50 },
  { x: 65, y: 70 },  { x: 140, y: 66 }, { x: 215, y: 63 },
];

const TANK_POSITIONS_RIGHT = [
  { x: 770, y: 50 }, { x: 845, y: 53 }, { x: 920, y: 58 },
  { x: 785, y: 63 }, { x: 860, y: 66 }, { x: 935, y: 70 },
];

function getPixelPosition(pos, container) {
  if (!container) return { x: 0, y: 0 };
  const rect = container.getBoundingClientRect();
  return {
    x: (pos.x / 1000) * rect.width,
    y: (pos.y / 100) * rect.height,
  };
}

export default function BattleScene({ onRollDice }) {
  const myTanks = useGameStore((s) => s.myTanks);
  const opponentTanks = useGameStore((s) => s.opponentTanks);
  const isMyTurn = useGameStore((s) => s.isMyTurn);
  const diceResults = useGameStore((s) => s.diceResults);
  const playerId = useGameStore((s) => s.playerId);
  const lastHit = useGameStore((s) => s.lastHit);
  const players = useGameStore((s) => s.players);
  const currentTurn = useGameStore((s) => s.currentTurn);
  const setAnimationPlaying = useGameStore((s) => s.setAnimationPlaying);
  const animationPlaying = useGameStore((s) => s.animationPlaying);

  const [rolling, setRolling] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [bulletActive, setBulletActive] = useState(false);
  const [explosionActive, setExplosionActive] = useState(false);
  const [bulletFrom, setBulletFrom] = useState(null);
  const [bulletTo, setBulletTo] = useState(null);
  const [bulletUrl, setBulletUrl] = useState(null);
  const [explosionPos, setExplosionPos] = useState({ x: 0, y: 0 });
  const [isKingShot, setIsKingShot] = useState(false);
  const [highlightShooter, setHighlightShooter] = useState(null);
  const [highlightTarget, setHighlightTarget] = useState(null);
  const [hitTank, setHitTank] = useState(null);
  const [announcement, setAnnouncement] = useState('');

  const containerRef = useRef(null);
  const timersRef = useRef([]);

  // Timer management for proper cleanup
  const addTimer = useCallback((fn, delay) => {
    const id = setTimeout(fn, delay);
    timersRef.current.push(id);
    return id;
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const handleRoll = useCallback(() => {
    if (!isMyTurn || animationPlaying || rolling) return;
    setRolling(true);
    setAnimationPlaying(true);
    onRollDice();
  }, [isMyTurn, animationPlaying, rolling, onRollDice, setAnimationPlaying]);

  // Handle dice result and trigger animation sequence
  useEffect(() => {
    if (!diceResults || !rolling) return;

    try {
      const isMyAttack = diceResults.attackerId === playerId;
      const shooterTanks = isMyAttack ? myTanks : opponentTanks;
      const targetTanks = isMyAttack ? opponentTanks : myTanks;
      const shooterPositions = isMyAttack ? TANK_POSITIONS_LEFT : TANK_POSITIONS_RIGHT;
      const targetPositions = isMyAttack ? TANK_POSITIONS_RIGHT : TANK_POSITIONS_LEFT;

      const shooterIdx = diceResults.shooterTank;
      const targetIdx = diceResults.targetTank;

      if (shooterIdx == null || targetIdx == null ||
          shooterIdx < 0 || shooterIdx >= shooterPositions.length ||
          targetIdx < 0 || targetIdx >= targetPositions.length) {
        setRolling(false);
        setAnimationPlaying(false);
        return;
      }

      const kingShot = diceResults.isKingShot;
      setIsKingShot(kingShot);

      addTimer(() => {
        setRolling(false);
        setHighlightShooter(shooterIdx);
        setAnnouncement(
          isMyAttack
            ? `Your Tank #${shooterIdx + 1} fires!${kingShot ? ' KING SHOT!' : ''}`
            : `Enemy Tank #${shooterIdx + 1} fires!${kingShot ? ' KING SHOT!' : ''}`
        );
      }, 1800);

      addTimer(() => {
        setHighlightTarget(targetIdx);
        const container = containerRef.current;
        if (!container) return;
        const from = getPixelPosition(shooterPositions[shooterIdx], container);
        const to = getPixelPosition(targetPositions[targetIdx], container);
        setBulletFrom(from);
        setBulletTo(to);
        setBulletUrl(shooterTanks[shooterIdx]?.bulletUrl || null);
        setBulletActive(true);
      }, 3000);
    } catch (err) {
      console.error('BattleScene animation error:', err);
      setRolling(false);
      setAnimationPlaying(false);
    }

    return () => clearTimers();
  }, [diceResults]);

  const handleBulletImpact = useCallback(() => {
    setBulletActive(false);

    if (bulletTo) {
      setExplosionPos(bulletTo);
      setExplosionActive(true);
      setShaking(true);
      setHitTank(diceResults?.targetTank);

      setAnnouncement(
        isKingShot ? 'KING SHOT! One-hit KO!' : 'Direct hit!'
      );
    }
  }, [bulletTo, diceResults, isKingShot]);

  const handleExplosionComplete = useCallback(() => {
    setExplosionActive(false);
    setShaking(false);

    addTimer(() => {
      setHighlightShooter(null);
      setHighlightTarget(null);
      setHitTank(null);
      setAnnouncement('');
      setAnimationPlaying(false);
      useGameStore.setState({ diceResults: null });
    }, 1000);
  }, [setAnimationPlaying, addTimer]);

  const myAlive = myTanks.filter((t) => !t.destroyed).length;
  const oppAlive = opponentTanks.filter((t) => !t.destroyed).length;

  const currentTurnName = currentTurn
    ? (currentTurn === playerId ? 'YOUR' : "ENEMY'S")
    : '';

  const myName = Object.values(players).find(p => p.id === playerId)?.name || 'You';
  const oppName = Object.values(players).find(p => p.id !== playerId)?.name || 'Opponent';

  return (
    <ValleyBackground shaking={shaking}>
      <div ref={containerRef} className="w-full h-full relative">
        {/* ═══ TOP HUD BAR ═══ */}
        <div className="absolute top-0 left-0 right-0 z-30 px-4 pt-3">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            {/* Player 1 (You) stats */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black"
                  style={{
                    background: 'linear-gradient(135deg, rgba(46, 213, 115, 0.2), rgba(46, 213, 115, 0.05))',
                    border: '1px solid rgba(46, 213, 115, 0.4)',
                  }}>
                  {myAlive}
                </div>
                {currentTurn === playerId && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                )}
              </div>
              <div>
                <div className="text-sm font-bold text-green-400">{myName}</div>
                <div className="flex gap-0.5">
                  {myTanks.map((t, i) => (
                    <div key={i} className="w-2 h-2 rounded-sm transition-all duration-500"
                      style={{
                        background: t.destroyed ? 'rgba(255,71,87,0.4)' : t.isKing ? 'var(--king-gold)' : 'rgba(46,213,115,0.7)',
                        boxShadow: t.isKing && !t.destroyed ? '0 0 4px var(--king-gold)' : 'none',
                      }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Center — Turn indicator + Announcement */}
            <div className="text-center flex-1 mx-4">
              <div className="inline-block rounded-xl px-5 py-2"
                style={{
                  background: 'rgba(10, 10, 30, 0.7)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 107, 53, 0.2)',
                }}>
                <div className="text-xs font-bold tracking-widest"
                  style={{ color: currentTurn === playerId ? 'var(--success)' : 'var(--danger)' }}>
                  {currentTurnName} TURN
                </div>
                {announcement && (
                  <div className={`text-sm font-bold mt-0.5 animate-fade-in ${isKingShot ? 'text-yellow-400' : ''}`}
                    style={{ color: isKingShot ? 'var(--king-gold)' : 'var(--accent)' }}>
                    {announcement}
                  </div>
                )}
              </div>
            </div>

            {/* Player 2 (Enemy) stats */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-bold text-red-400">{oppName}</div>
                <div className="flex gap-0.5 justify-end">
                  {opponentTanks.map((t, i) => (
                    <div key={i} className="w-2 h-2 rounded-sm transition-all duration-500"
                      style={{
                        background: t.destroyed ? 'rgba(255,71,87,0.4)' : t.isKing ? 'var(--king-gold)' : 'rgba(255,71,87,0.7)',
                        boxShadow: t.isKing && !t.destroyed ? '0 0 4px var(--king-gold)' : 'none',
                      }} />
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 71, 87, 0.2), rgba(255, 71, 87, 0.05))',
                    border: '1px solid rgba(255, 71, 87, 0.4)',
                  }}>
                  {oppAlive}
                </div>
                {currentTurn && currentTurn !== playerId && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-400 animate-pulse" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ TANKS — LEFT SIDE (You) ═══ */}
        {myTanks.map((tank, i) => {
          if (!containerRef.current) return null;
          const pos = getPixelPosition(TANK_POSITIONS_LEFT[i], containerRef.current);
          return (
            <div
              key={`my-${i}`}
              className="absolute transition-all duration-300"
              style={{
                left: pos.x - 44,
                top: pos.y - 36,
                zIndex: 20,
              }}
            >
              <TankDisplay
                tank={tank}
                index={i}
                isOpponent={false}
                isHighlighted={highlightShooter === i && diceResults?.attackerId === playerId}
                isHit={hitTank === i && diceResults?.defenderId === playerId}
                isShooter={highlightShooter === i && diceResults?.attackerId === playerId}
              />
            </div>
          );
        })}

        {/* ═══ TANKS — RIGHT SIDE (Enemy) ═══ */}
        {opponentTanks.map((tank, i) => {
          if (!containerRef.current) return null;
          const pos = getPixelPosition(TANK_POSITIONS_RIGHT[i], containerRef.current);
          return (
            <div
              key={`opp-${i}`}
              className="absolute transition-all duration-300"
              style={{
                left: pos.x - 44,
                top: pos.y - 36,
                zIndex: 20,
              }}
            >
              <TankDisplay
                tank={tank}
                index={i}
                isOpponent={true}
                isHighlighted={highlightTarget === i && diceResults?.defenderId !== playerId}
                isHit={hitTank === i && diceResults?.defenderId !== playerId}
                isShooter={highlightShooter === i && diceResults?.attackerId !== playerId}
              />
            </div>
          );
        })}

        {/* ═══ BULLET ═══ */}
        <BulletAnimation
          from={bulletFrom}
          to={bulletTo}
          bulletUrl={bulletUrl}
          active={bulletActive}
          onImpact={handleBulletImpact}
          isKingShot={isKingShot}
        />

        {/* ═══ EXPLOSION ═══ */}
        <Explosion
          x={explosionPos.x}
          y={explosionPos.y}
          active={explosionActive}
          onComplete={handleExplosionComplete}
          isKingShot={isKingShot}
        />

        {/* ═══ BOTTOM CONTROLS ═══ */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-4">
          {/* Dice display */}
          {(rolling || diceResults) && (
            <DiceRoller
              result={diceResults}
              rolling={rolling}
              label1="Shooter"
              label2="Target"
            />
          )}

          {/* Roll button */}
          {isMyTurn && !animationPlaying && (
            <button
              className="group relative overflow-hidden rounded-2xl text-xl font-black px-14 py-4 transition-all duration-300 hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, var(--accent), #ff8c5a)',
                boxShadow: '0 0 30px rgba(255, 107, 53, 0.4), 0 8px 32px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                letterSpacing: '2px',
                color: 'white',
              }}
              onClick={handleRoll}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                  animation: 'shimmer 2s ease-in-out infinite',
                }} />
              <span className="relative z-10">ROLL THE DICE</span>
            </button>
          )}

          {/* Waiting state */}
          {!isMyTurn && !animationPlaying && (
            <div className="rounded-2xl px-10 py-4 text-center"
              style={{
                background: 'rgba(10, 10, 30, 0.7)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}>
              <p className="text-base font-bold" style={{ color: 'var(--text-secondary)' }}>
                Waiting for opponent...
              </p>
              <div className="flex justify-center gap-1 mt-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: 'var(--accent)',
                      animation: `float 1.5s ease-in-out infinite ${i * 0.2}s`,
                    }} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </ValleyBackground>
  );
}
