'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import ValleyBackground from './ValleyBackground';
import TankDisplay from './TankDisplay';
import DiceRoller from './DiceRoller';
import BulletAnimation from './BulletAnimation';
import Explosion from './Explosion';
import useGameStore from '@/stores/gameStore';

const TANK_POSITIONS_LEFT = [
  { x: 120, y: 440 }, { x: 200, y: 420 }, { x: 280, y: 410 },
  { x: 100, y: 510 }, { x: 180, y: 490 }, { x: 260, y: 475 },
];

const TANK_POSITIONS_RIGHT = [
  { x: 920, y: 440 }, { x: 1000, y: 420 }, { x: 1080, y: 410 },
  { x: 940, y: 510 }, { x: 1020, y: 490 }, { x: 1100, y: 475 },
];

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

  const getScaledPosition = useCallback((pos) => {
    const container = containerRef.current;
    if (!container) return pos;
    const rect = container.getBoundingClientRect();
    return {
      x: (pos.x / 1200) * rect.width,
      y: (pos.y / 700) * rect.height,
    };
  }, []);

  const handleRoll = useCallback(() => {
    if (!isMyTurn || animationPlaying || rolling) return;
    setRolling(true);
    setAnimationPlaying(true);
    onRollDice();
  }, [isMyTurn, animationPlaying, rolling, onRollDice, setAnimationPlaying]);

  // Handle dice result and trigger animation sequence
  useEffect(() => {
    if (!diceResults || !rolling) return;

    const isMyAttack = diceResults.attackerId === playerId;
    const shooterTanks = isMyAttack ? myTanks : opponentTanks;
    const targetTanks = isMyAttack ? opponentTanks : myTanks;
    const shooterPositions = isMyAttack ? TANK_POSITIONS_LEFT : TANK_POSITIONS_RIGHT;
    const targetPositions = isMyAttack ? TANK_POSITIONS_RIGHT : TANK_POSITIONS_LEFT;

    const shooterIdx = diceResults.shooterTank;
    const targetIdx = diceResults.targetTank;
    const kingShot = diceResults.isKingShot;

    setIsKingShot(kingShot);

    // Step 1: Dice finishes, show which tanks
    const step1 = setTimeout(() => {
      setRolling(false);
      setHighlightShooter(shooterIdx);
      setAnnouncement(
        isMyAttack
          ? `Your Tank #${shooterIdx + 1} fires!${kingShot ? ' KING SHOT!' : ''}`
          : `Enemy Tank #${shooterIdx + 1} fires!${kingShot ? ' KING SHOT!' : ''}`
      );
    }, 1800);

    // Step 2: Fire bullet
    const step2 = setTimeout(() => {
      setHighlightTarget(targetIdx);
      const from = getScaledPosition(shooterPositions[shooterIdx]);
      const to = getScaledPosition(targetPositions[targetIdx]);
      setBulletFrom(from);
      setBulletTo(to);
      setBulletUrl(shooterTanks[shooterIdx]?.bulletUrl);
      setBulletActive(true);
    }, 3000);

    return () => {
      clearTimeout(step1);
      clearTimeout(step2);
    };
  }, [diceResults]);

  const handleBulletImpact = useCallback(() => {
    setBulletActive(false);

    // Step 3: Explosion
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

    // Step 4: Cleanup after a beat
    setTimeout(() => {
      setHighlightShooter(null);
      setHighlightTarget(null);
      setHitTank(null);
      setAnnouncement('');
      setAnimationPlaying(false);
      useGameStore.setState({ diceResults: null });
    }, 1000);
  }, [setAnimationPlaying]);

  const currentTurnName = currentTurn
    ? (currentTurn === playerId ? 'Your' : "Opponent's")
    : '';

  return (
    <ValleyBackground shaking={shaking}>
      <div ref={containerRef} className="w-full h-full relative">
        {/* Turn indicator */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
          <div className="glass-card px-6 py-3 text-center">
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {currentTurnName} Turn
            </div>
            {announcement && (
              <div className={`text-lg font-bold mt-1 animate-fade-in ${isKingShot ? 'text-yellow-400' : ''}`}
                style={{ color: isKingShot ? 'var(--king-gold)' : 'var(--accent)' }}>
                {announcement}
              </div>
            )}
          </div>
        </div>

        {/* Player labels */}
        <div className="absolute top-4 left-4 z-30 glass-card px-4 py-2">
          <span className="text-sm font-bold" style={{ color: 'var(--success)' }}>You</span>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {myTanks.filter((t) => !t.destroyed).length}/6 tanks
          </div>
        </div>
        <div className="absolute top-4 right-4 z-30 glass-card px-4 py-2 text-right">
          <span className="text-sm font-bold" style={{ color: 'var(--danger)' }}>Enemy</span>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {opponentTanks.filter((t) => !t.destroyed).length}/6 tanks
          </div>
        </div>

        {/* My tanks (left side) */}
        {myTanks.map((tank, i) => {
          const pos = getScaledPosition(TANK_POSITIONS_LEFT[i]);
          return (
            <div
              key={`my-${i}`}
              className="absolute"
              style={{ left: pos.x - 40, top: pos.y - 32, zIndex: 20 }}
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

        {/* Opponent tanks (right side) */}
        {opponentTanks.map((tank, i) => {
          const pos = getScaledPosition(TANK_POSITIONS_RIGHT[i]);
          return (
            <div
              key={`opp-${i}`}
              className="absolute"
              style={{ left: pos.x - 40, top: pos.y - 32, zIndex: 20 }}
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

        {/* Bullet animation */}
        <BulletAnimation
          from={bulletFrom}
          to={bulletTo}
          bulletUrl={bulletUrl}
          active={bulletActive}
          onImpact={handleBulletImpact}
          isKingShot={isKingShot}
        />

        {/* Explosion */}
        <Explosion
          x={explosionPos.x}
          y={explosionPos.y}
          active={explosionActive}
          onComplete={handleExplosionComplete}
          isKingShot={isKingShot}
        />

        {/* Roll button */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-4">
          {(rolling || diceResults) && (
            <DiceRoller
              result={diceResults}
              rolling={rolling}
              label1="Shooter"
              label2="Target"
            />
          )}

          {isMyTurn && !animationPlaying && (
            <button
              className="btn-primary text-xl px-12 py-4 animate-pulse-glow"
              onClick={handleRoll}
            >
              &#127922; ROLL THE DICE
            </button>
          )}

          {!isMyTurn && !animationPlaying && (
            <div className="glass-card px-8 py-4 text-center">
              <p className="text-lg font-bold" style={{ color: 'var(--text-secondary)' }}>
                Opponent's turn...
              </p>
            </div>
          )}
        </div>
      </div>
    </ValleyBackground>
  );
}
