"use client";
import React, { useState, useEffect, useRef } from 'react';

const TankBattleGame = () => {
  const [gameState, setGameState] = useState('lobby'); // lobby, drawing, playing, gameOver
  const [roomCode, setRoomCode] = useState('');
  const [players, setPlayers] = useState({});
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [playerTanks, setPlayerTanks] = useState({ player1: [], player2: [] });
  const [kingTanks, setKingTanks] = useState({ player1: null, player2: null });
  const [currentTurn, setCurrentTurn] = useState('player1');
  const [drawingPhase, setDrawingPhase] = useState(0); // 0-5 for 6 tanks
  const [tankLives, setTankLives] = useState({});
  const [diceRolling, setDiceRolling] = useState(false);
  const [diceResults, setDiceResults] = useState({ shooter: null, target: null });
  const [animating, setAnimating] = useState(false);
  const [explosions, setExplosions] = useState([]);
  const canvasRef = useRef(null);

  // Tank colors for drawing
  const tankColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];

  // Initialize game room
  const createRoom = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomCode(code);
    setCurrentPlayer('player1');
    setPlayers({ player1: { id: 'player1', ready: false } });
    setGameState('drawing');
  };

  const joinRoom = (code) => {
    setRoomCode(code);
    setCurrentPlayer('player2');
    setPlayers(prev => ({ ...prev, player2: { id: 'player2', ready: false } }));
    setGameState('drawing');
  };

  // Drawing functions
  const drawTank = (x, y, color, isKing = false) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Tank body
    ctx.fillStyle = color;
    ctx.fillRect(x - 15, y - 8, 30, 16);
    
    // Tank turret
    ctx.fillRect(x - 8, y - 12, 16, 8);
    
    // Tank barrel
    ctx.fillStyle = '#333';
    ctx.fillRect(x + 8, y - 6, 20, 4);
    
    // King crown
    if (isKing) {
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(x - 10, y - 18, 20, 6);
      ctx.fillRect(x - 8, y - 24, 4, 6);
      ctx.fillRect(x - 2, y - 24, 4, 6);
      ctx.fillRect(x + 4, y - 24, 4, 6);
    }
  };

  const drawScene = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background gradient (sky)
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#98FB98');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Mountain terrain |\_/|
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    ctx.lineTo(0, canvas.height * 0.3);
    ctx.lineTo(canvas.width * 0.4, canvas.height * 0.7);
    ctx.lineTo(canvas.width * 0.6, canvas.height * 0.7);
    ctx.lineTo(canvas.width, canvas.height * 0.3);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fill();
    
    // Grass on mountains
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    ctx.lineTo(0, canvas.height * 0.35);
    ctx.lineTo(canvas.width * 0.4, canvas.height * 0.75);
    ctx.lineTo(canvas.width * 0.6, canvas.height * 0.75);
    ctx.lineTo(canvas.width, canvas.height * 0.35);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fill();
    
    // Draw tanks
    const leftPositions = [
      { x: 80, y: canvas.height * 0.45 },
      { x: 120, y: canvas.height * 0.5 },
      { x: 160, y: canvas.height * 0.55 },
      { x: 200, y: canvas.height * 0.6 },
      { x: 240, y: canvas.height * 0.65 },
      { x: 280, y: canvas.height * 0.7 }
    ];
    
    const rightPositions = [
      { x: canvas.width - 80, y: canvas.height * 0.45 },
      { x: canvas.width - 120, y: canvas.height * 0.5 },
      { x: canvas.width - 160, y: canvas.height * 0.55 },
      { x: canvas.width - 200, y: canvas.height * 0.6 },
      { x: canvas.width - 240, y: canvas.height * 0.65 },
      { x: canvas.width - 280, y: canvas.height * 0.7 }
    ];
    
    // Draw player 1 tanks (left side)
    playerTanks.player1.forEach((tank, index) => {
      if (tankLives[`player1_${index}`] > 0) {
        const pos = leftPositions[index];
        const isKing = kingTanks.player1 === index;
        drawTank(pos.x, pos.y, tank.color, isKing);
        
        // Health bars
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(pos.x - 15, pos.y - 25, 30, 4);
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(pos.x - 15, pos.y - 25, (tankLives[`player1_${index}`] / 3) * 30, 4);
      }
    });
    
    // Draw player 2 tanks (right side)
    playerTanks.player2.forEach((tank, index) => {
      if (tankLives[`player2_${index}`] > 0) {
        const pos = rightPositions[index];
        const isKing = kingTanks.player2 === index;
        drawTank(pos.x, pos.y, tank.color, isKing);
        
        // Health bars
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(pos.x - 15, pos.y - 25, 30, 4);
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(pos.x - 15, pos.y - 25, (tankLives[`player2_${index}`] / 3) * 30, 4);
      }
    });
    
    // Draw explosions
    explosions.forEach(explosion => {
      ctx.fillStyle = `rgba(255, ${100 + explosion.frame * 20}, 0, ${1 - explosion.frame * 0.1})`;
      ctx.beginPath();
      ctx.arc(explosion.x, explosion.y, 10 + explosion.frame * 5, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const addTank = (color) => {
    const newTank = { color, id: Date.now() };
    setPlayerTanks(prev => ({
      ...prev,
      [currentPlayer]: [...prev[currentPlayer], newTank]
    }));
    
    // Initialize tank lives
    const tankIndex = playerTanks[currentPlayer].length;
    setTankLives(prev => ({
      ...prev,
      [`${currentPlayer}_${tankIndex}`]: 3
    }));
    
    if (drawingPhase < 5) {
      setDrawingPhase(prev => prev + 1);
    } else {
      // Move to king selection
      setDrawingPhase(6);
    }
  };

  const selectKing = (tankIndex) => {
    setKingTanks(prev => ({
      ...prev,
      [currentPlayer]: tankIndex
    }));
    
    if (currentPlayer === 'player1' && !players.player2) {
      // Wait for player 2
      return;
    } else if (currentPlayer === 'player1') {
      setCurrentPlayer('player2');
      setDrawingPhase(0);
    } else {
      // Both players ready, start game
      setGameState('playing');
    }
  };

  const rollDice = () => {
    if (diceRolling || animating) return;
    
    setDiceRolling(true);
    setDiceResults({ shooter: null, target: null });
    
    // Simulate dice rolling animation
    let rollCount = 0;
    const rollInterval = setInterval(() => {
      setDiceResults({
        shooter: Math.floor(Math.random() * 6) + 1,
        target: Math.floor(Math.random() * 6) + 1
      });
      rollCount++;
      
      if (rollCount > 10) {
        clearInterval(rollInterval);
        const finalShooter = Math.floor(Math.random() * 6) + 1;
        const finalTarget = Math.floor(Math.random() * 6) + 1;
        setDiceResults({ shooter: finalShooter, target: finalTarget });
        setDiceRolling(false);
        
        // Execute attack after dice roll
        setTimeout(() => executeAttack(finalShooter - 1, finalTarget - 1), 1000);
      }
    }, 100);
  };

  const executeAttack = (shooterIndex, targetIndex) => {
    const opponent = currentTurn === 'player1' ? 'player2' : 'player1';
    const shooterKey = `${currentTurn}_${shooterIndex}`;
    const targetKey = `${opponent}_${targetIndex}`;
    
    // Check if shooter and target are alive
    const shooterAlive = tankLives[shooterKey] > 0;
    const targetAlive = tankLives[targetKey] > 0;
    
    if (!shooterAlive || !targetAlive) {
      setCurrentTurn(currentTurn === 'player1' ? 'player2' : 'player1');
      return;
    }
    
    setAnimating(true);
    
    // Bullet animation would go here
    setTimeout(() => {
      // Determine damage
      const isKingShooter = kingTanks[currentTurn] === shooterIndex;
      const damage = isKingShooter ? 3 : 1; // King tank one-shots
      
      // Apply damage
      setTankLives(prev => ({
        ...prev,
        [targetKey]: Math.max(0, prev[targetKey] - damage)
      }));
      
      // Add explosion
      const canvas = canvasRef.current;
      const positions = currentTurn === 'player1' ? 
        [
          { x: canvas.width - 80, y: canvas.height * 0.45 },
          { x: canvas.width - 120, y: canvas.height * 0.5 },
          { x: canvas.width - 160, y: canvas.height * 0.55 },
          { x: canvas.width - 200, y: canvas.height * 0.6 },
          { x: canvas.width - 240, y: canvas.height * 0.65 },
          { x: canvas.width - 280, y: canvas.height * 0.7 }
        ] :
        [
          { x: 80, y: canvas.height * 0.45 },
          { x: 120, y: canvas.height * 0.5 },
          { x: 160, y: canvas.height * 0.55 },
          { x: 200, y: canvas.height * 0.6 },
          { x: 240, y: canvas.height * 0.65 },
          { x: 280, y: canvas.height * 0.7 }
        ];
      
      const targetPos = positions[targetIndex];
      setExplosions(prev => [...prev, { x: targetPos.x, y: targetPos.y, frame: 0 }]);
      
      setAnimating(false);
      setCurrentTurn(currentTurn === 'player1' ? 'player2' : 'player1');
      
      // Check win condition
      checkWinCondition();
    }, 1500);
  };

  const checkWinCondition = () => {
    const player1Alive = Object.keys(tankLives)
      .filter(key => key.startsWith('player1_'))
      .some(key => tankLives[key] > 0);
    
    const player2Alive = Object.keys(tankLives)
      .filter(key => key.startsWith('player2_'))
      .some(key => tankLives[key] > 0);
    
    if (!player1Alive || !player2Alive) {
      setGameState('gameOver');
    }
  };

  // Animation loop for explosions
  useEffect(() => {
    const interval = setInterval(() => {
      setExplosions(prev => 
        prev.map(explosion => ({ ...explosion, frame: explosion.frame + 1 }))
           .filter(explosion => explosion.frame < 10)
      );
    }, 100);
    
    return () => clearInterval(interval);
  }, []);

  // Redraw scene when state changes
  useEffect(() => {
    drawScene();
  }, [playerTanks, tankLives, kingTanks, explosions]);

  const DiceComponent = ({ value, label }) => (
    <div className="flex flex-col items-center">
      <div className={`w-16 h-16 border-2 border-gray-800 rounded-lg flex items-center justify-center text-2xl font-bold bg-white ${diceRolling ? 'animate-spin' : ''}`}>
        {value || '?'}
      </div>
      <span className="text-sm mt-1">{label}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 to-green-400 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white text-center mb-8">Tank Battle Royale</h1>
        
        {gameState === 'lobby' && (
          <div className="bg-white rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-6">Welcome to Tank Battle!</h2>
            <div className="space-y-4">
              <button 
                onClick={createRoom}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-semibold"
              >
                Create Game Room
              </button>
              <div className="flex items-center justify-center space-x-4">
                <input 
                  type="text" 
                  placeholder="Enter room code"
                  className="border-2 border-gray-300 px-4 py-2 rounded-lg"
                  onChange={(e) => setRoomCode(e.target.value)}
                />
                <button 
                  onClick={() => joinRoom(roomCode)}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold"
                  disabled={!roomCode}
                >
                  Join Game
                </button>
              </div>
            </div>
          </div>
        )}

        {gameState === 'drawing' && (
          <div className="bg-white rounded-lg p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">Room Code: {roomCode}</h2>
              <p className="text-lg">Player: {currentPlayer}</p>
            </div>
            
            {drawingPhase < 6 ? (
              <div>
                <h3 className="text-xl font-bold mb-4">Draw Tank {drawingPhase + 1}/6</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {tankColors.map((color, index) => (
                    <button
                      key={index}
                      onClick={() => addTank(color)}
                      className="w-16 h-16 rounded-lg border-4 border-gray-300 hover:border-gray-600"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-bold mb-4">Select Your King Tank</h3>
                <div className="grid grid-cols-6 gap-4">
                  {playerTanks[currentPlayer].map((tank, index) => (
                    <button
                      key={index}
                      onClick={() => selectKing(index)}
                      className="w-16 h-16 rounded-lg border-4 border-gray-300 hover:border-yellow-400"
                      style={{ backgroundColor: tank.color }}
                    >
                      👑
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {gameState === 'playing' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-4 text-center">
              <h2 className="text-2xl font-bold mb-4">Current Turn: {currentTurn}</h2>
              
              <div className="flex justify-center space-x-8 mb-4">
                <DiceComponent value={diceResults.shooter} label="Your Tank" />
                <DiceComponent value={diceResults.target} label="Enemy Tank" />
              </div>
              
              <button
                onClick={rollDice}
                disabled={diceRolling || animating || currentTurn !== currentPlayer}
                className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-8 py-4 rounded-lg text-xl font-bold"
              >
                {diceRolling ? 'Rolling...' : animating ? 'Firing...' : 'Roll Dice & Fire!'}
              </button>
            </div>
            
            <canvas
              ref={canvasRef}
              width={800}
              height={400}
              className="border-4 border-gray-800 rounded-lg bg-blue-200 mx-auto block"
            />
          </div>
        )}

        {gameState === 'gameOver' && (
          <div className="bg-white rounded-lg p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Game Over!</h2>
            <p className="text-xl mb-6">
              Winner: {Object.keys(tankLives).filter(key => key.startsWith('player1_')).some(key => tankLives[key] > 0) ? 'Player 1' : 'Player 2'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-semibold"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TankBattleGame;