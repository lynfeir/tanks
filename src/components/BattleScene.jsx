'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import ValleyBackground from './ValleyBackground';
import TankDisplay from './TankDisplay';
import DiceRoller from './DiceRoller';
import BulletAnimation from './BulletAnimation';
import Explosion from './Explosion';
import DamageNumber from './DamageNumber';
import KillFeed from './KillFeed';
import useGameStore from '@/stores/gameStore';
import sfx from '@/lib/audio';

// Tank positions calculated to sit on the \__/ slopes
// SVG valley: left ridge at x=0,y=340 slopes down to plateau at x=420,y=560
// Right ridge at x=1250,y=340 slopes down to plateau at x=780,y=560
// In 1000-unit virtual space, proportionally:
// Left slope: x=0→336, y=485→800  |  Right slope: x=624→1000, y=800→485
// Plateau: x=336→624, y=800

function getSlopeY(x) {
  // Left slope: from (0, 485) to (336, 800)
  if (x <= 336) {
    return 485 + (x / 336) * (800 - 485);
  }
  // Plateau
  if (x <= 624) {
    return 800;
  }
  // Right slope: from (624, 800) to (1000, 485)
  return 800 - ((x - 624) / (1000 - 624)) * (800 - 485);
}

const TANK_POSITIONS_LEFT = [
  { x: 60 },  { x: 130 }, { x: 200 },   // Top row (higher on slope)
  { x: 90 },  { x: 160 }, { x: 235 },   // Bottom row (lower on slope)
].map((t, i) => ({ x: t.x, y: getSlopeY(t.x) - (i < 3 ? 130 : 85) }));

const TANK_POSITIONS_RIGHT = [
  { x: 800 }, { x: 870 }, { x: 940 },   // Top row
  { x: 770 }, { x: 840 }, { x: 905 },   // Bottom row
].map((t, i) => ({ x: t.x, y: getSlopeY(t.x) - (i < 3 ? 130 : 85) }));

function getPixelPosition(pos, containerWidth, containerHeight) {
  return {
    x: (pos.x / 1000) * containerWidth,
    y: (pos.y / 1000) * containerHeight,
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
  const bonusRollsLeft = useGameStore((s) => s.bonusRollsLeft);
  const myBonus = bonusRollsLeft?.[playerId] ?? 0;
  const oppId = Object.values(players).find((p) => p.id !== playerId)?.id;
  const oppBonus = oppId ? bonusRollsLeft?.[oppId] ?? 0 : 0;

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
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [floatingNumbers, setFloatingNumbers] = useState([]);
  const [freezeFrame, setFreezeFrame] = useState(false);
  const addKillFeedEntry = useGameStore((s) => s.addKillFeedEntry);

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

  // ResizeObserver for live reflow
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });
      }
    });
    observer.observe(el);

    // Initial measurement
    const rect = el.getBoundingClientRect();
    setContainerSize({ width: rect.width, height: rect.height });

    return () => observer.disconnect();
  }, []);

  const handleRoll = useCallback((useBonus = false) => {
    if (!isMyTurn || animationPlaying || rolling) return;
    if (useBonus && myBonus <= 0) return;
    sfx.unlock();
    sfx.dice();
    setRolling(true);
    onRollDice({ useBonus });
  }, [isMyTurn, animationPlaying, rolling, onRollDice, myBonus]);

  // Handle dice result and trigger animation sequence
  useEffect(() => {
    if (!diceResults) return;

    // If we were rolling (attacker), stop the dice spin
    if (rolling) setRolling(false);

    // Prevent duplicate triggers
    if (animationPlaying && !rolling) return;
    setAnimationPlaying(true);

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
        setAnimationPlaying(false);
        return;
      }

      const kingShot = diceResults.isKingShot;
      setIsKingShot(kingShot);

      addTimer(() => {
        setHighlightShooter(shooterIdx);
        setAnnouncement(
          isMyAttack
            ? `Your Tank #${shooterIdx + 1} fires!${kingShot ? ' KING SHOT!' : ''}`
            : `Enemy Tank #${shooterIdx + 1} fires!${kingShot ? ' KING SHOT!' : ''}`
        );
      }, 1800);

      addTimer(() => {
        setHighlightTarget(targetIdx);
        if (!containerSize.width) return;
        const from = getPixelPosition(shooterPositions[shooterIdx], containerSize.width, containerSize.height);
        const to = getPixelPosition(targetPositions[targetIdx], containerSize.width, containerSize.height);
        setBulletFrom(from);
        setBulletTo(to);
        setBulletUrl(diceResults.shooterBulletUrl || shooterTanks[shooterIdx]?.bulletUrl || null);
        setBulletActive(true);
        sfx.shoot();
        sfx.whoosh(kingShot ? 0.55 : 0.75);
      }, 3000);
    } catch (err) {
      console.error('BattleScene animation error:', err);
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

      // Audio
      if (isKingShot) sfx.kingShot();
      else sfx.hit();
      sfx.explode();

      // Floating damage number — read fresh tank state to know if destroyed
      const targetIsMine = diceResults?.defenderId === playerId;
      const targetTank = (targetIsMine ? myTanks : opponentTanks)[diceResults?.targetTank];
      const wasDestroyed = targetTank ? targetTank.destroyed || (targetTank.hp <= 0) : isKingShot;
      const dmgText = isKingShot ? 'KING SHOT!' : wasDestroyed ? 'DESTROYED' : '−1';
      const dmgColor = isKingShot
        ? 'var(--king-gold)'
        : wasDestroyed
        ? 'var(--danger)'
        : '#ff8866';
      const dmgId = `dmg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setFloatingNumbers((prev) => [
        ...prev,
        { id: dmgId, x: bulletTo.x, y: bulletTo.y - 20, text: dmgText, color: dmgColor, kingShot: isKingShot },
      ]);

      // Kill feed entry — both players push, both see the same log
      const attackerName =
        Object.values(players).find((p) => p.id === diceResults?.attackerId)?.name || '?';
      const targetName =
        Object.values(players).find((p) => p.id === diceResults?.defenderId)?.name || '?';
      addKillFeedEntry({
        attackerName,
        shooterTank: diceResults?.shooterTank,
        targetName,
        targetTank: diceResults?.targetTank,
        isKing: isKingShot,
        destroyed: wasDestroyed,
      });

      // Hit-stop: freeze for 350ms on king shot
      if (isKingShot) {
        setFreezeFrame(true);
        addTimer(() => setFreezeFrame(false), 350);
      }
    }
  }, [bulletTo, diceResults, isKingShot, myTanks, opponentTanks, playerId, players, addKillFeedEntry, addTimer]);

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
      <KillFeed />
      <div
        ref={containerRef}
        className="w-full h-full relative"
        style={{
          transform: freezeFrame ? 'scale(1.04)' : 'scale(1)',
          transition: freezeFrame ? 'transform 60ms linear' : 'transform 220ms ease-out',
          filter: freezeFrame ? 'saturate(1.4) contrast(1.1)' : 'none',
          transformOrigin: bulletTo ? `${bulletTo.x}px ${bulletTo.y}px` : 'center center',
        }}
      >
        {/* ═══ TOP HUD BAR ═══ */}
        <div className="absolute top-0 left-0 right-0 z-30 px-4 pt-3">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            {/* Player 1 (You) stats */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 flex items-center justify-center font-pixel text-[10px]"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '2px solid var(--success)',
                    color: 'var(--success)',
                  }}>
                  {myAlive}
                </div>
                {currentTurn === playerId && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 animate-blink"
                    style={{ background: 'var(--success)' }} />
                )}
              </div>
              <div>
                <div className="font-pixel text-[8px] flex items-center gap-1" style={{ color: 'var(--success)' }}>
                  <span>{myName}</span>
                  {myBonus > 0 && (
                    <span title="Bonus roll available"
                      style={{ color: 'var(--king-gold)', textShadow: '0 0 6px rgba(255,204,0,0.6)' }}>
                      {'★'.repeat(Math.min(3, myBonus))}
                    </span>
                  )}
                </div>
                <div className="flex gap-0.5 mt-1">
                  {myTanks.map((t, i) => (
                    <div key={i} className="w-2.5 h-2.5 transition-all duration-500"
                      style={{
                        background: t.destroyed
                          ? 'var(--bg-primary)'
                          : t.isKing ? 'var(--king-gold)' : 'var(--success)',
                        border: '1px solid ' + (t.destroyed ? 'var(--pixel-border)' : 'transparent'),
                      }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Center — Turn indicator */}
            <div className="text-center flex-1 mx-4">
              <div className="inline-block px-5 py-2"
                style={{
                  background: 'var(--bg-primary)',
                  border: '2px solid var(--pixel-border)',
                }}>
                <div className="font-pixel text-[10px] animate-blink"
                  style={{ color: currentTurn === playerId ? 'var(--success)' : 'var(--danger)' }}>
                  {'>> '}{currentTurnName} TURN{' <<'}
                </div>
                {announcement && (
                  <div className={`font-pixel text-[8px] mt-1 animate-fade-in`}
                    style={{ color: isKingShot ? 'var(--king-gold)' : 'var(--accent)' }}>
                    {announcement}
                  </div>
                )}
              </div>
            </div>

            {/* Player 2 (Enemy) stats */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="font-pixel text-[8px] flex items-center justify-end gap-1" style={{ color: 'var(--danger)' }}>
                  {oppBonus > 0 && (
                    <span title="Opponent has a bonus roll"
                      style={{ color: 'var(--king-gold)', textShadow: '0 0 6px rgba(255,204,0,0.6)' }}>
                      {'★'.repeat(Math.min(3, oppBonus))}
                    </span>
                  )}
                  <span>{oppName}</span>
                </div>
                <div className="flex gap-0.5 justify-end mt-1">
                  {opponentTanks.map((t, i) => (
                    <div key={i} className="w-2.5 h-2.5 transition-all duration-500"
                      style={{
                        background: t.destroyed
                          ? 'var(--bg-primary)'
                          : t.isKing ? 'var(--king-gold)' : 'var(--danger)',
                        border: '1px solid ' + (t.destroyed ? 'var(--pixel-border)' : 'transparent'),
                      }} />
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="w-10 h-10 flex items-center justify-center font-pixel text-[10px]"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '2px solid var(--danger)',
                    color: 'var(--danger)',
                  }}>
                  {oppAlive}
                </div>
                {currentTurn && currentTurn !== playerId && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 animate-blink"
                    style={{ background: 'var(--danger)' }} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* TANKS — LEFT SIDE (You) */}
        {containerSize.width > 0 && myTanks.map((tank, i) => {
          const pos = getPixelPosition(TANK_POSITIONS_LEFT[i], containerSize.width, containerSize.height);
          return (
            <div
              key={`my-${i}`}
              className="absolute transition-all duration-300"
              style={{
                left: pos.x - 52,
                top: pos.y - 44,
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

        {/* TANKS — RIGHT SIDE (Enemy) */}
        {containerSize.width > 0 && opponentTanks.map((tank, i) => {
          const pos = getPixelPosition(TANK_POSITIONS_RIGHT[i], containerSize.width, containerSize.height);
          return (
            <div
              key={`opp-${i}`}
              className="absolute transition-all duration-300"
              style={{
                left: pos.x - 52,
                top: pos.y - 44,
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

        {/* ═══ DAMAGE NUMBERS ═══ */}
        {floatingNumbers.map((n) => (
          <DamageNumber
            key={n.id}
            x={n.x}
            y={n.y}
            text={n.text}
            color={n.color}
            kingShot={n.kingShot}
            onDone={() => setFloatingNumbers((prev) => prev.filter((p) => p.id !== n.id))}
          />
        ))}

        {/* ═══ BOTTOM CONTROLS ═══ */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-4">
          {(rolling || diceResults) && (
            <DiceRoller
              result={diceResults}
              rolling={rolling}
              label1="SHOOTER"
              label2="TARGET"
            />
          )}

          {isMyTurn && !animationPlaying && (
            <div className="flex flex-col items-center gap-3">
              <button
                className="btn-pixel text-base px-14 py-4"
                onClick={() => handleRoll(false)}
                style={{
                  fontSize: '0.85rem',
                  boxShadow: '0 4px 0 0 #cc5200, 0 6px 0 0 #0a0a1a, 0 0 30px rgba(255, 102, 0, 0.3)',
                }}
              >
                ROLL THE DICE
              </button>
              {myBonus > 0 && (
                <button
                  className="px-6 py-2 font-pixel text-[9px] transition-all hover:opacity-90"
                  onClick={() => handleRoll(true)}
                  style={{
                    background: 'var(--bg-primary)',
                    color: 'var(--king-gold)',
                    border: '2px solid var(--king-gold)',
                    boxShadow: '0 3px 0 0 #996600, 0 0 14px rgba(255, 204, 0, 0.35)',
                    cursor: 'pointer',
                  }}
                  title="Use your bonus roll — turn doesn't end after this shot"
                >
                  {'★'} BONUS ROLL ({myBonus})
                </button>
              )}
            </div>
          )}

          {!isMyTurn && !animationPlaying && (
            <div className="px-10 py-4 text-center"
              style={{
                background: 'var(--bg-primary)',
                border: '2px solid var(--pixel-border)',
              }}>
              <p className="font-pixel text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                WAITING FOR OPPONENT
              </p>
              <div className="font-pixel text-[8px] mt-2 animate-blink" style={{ color: 'var(--accent)' }}>
                . . .
              </div>
            </div>
          )}
        </div>
      </div>
    </ValleyBackground>
  );
}
