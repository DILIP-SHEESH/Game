'use client';

import { useState, useEffect, useRef } from 'react';
import { GameState, Player } from '@/types/game';

const LEADERBOARD_KEY = 'maze_leaderboard';

type CountdownState = 3 | 2 | 1 | null;

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [countdown, setCountdown] = useState<CountdownState>(null);
  const [gameState, setGameState] = useState<GameState>({
    currentScore: 0,
    isPlaying: false,
    playerName: '',
    lives: 3,
    gameSpeed: 6,
  });

  // Lane setup
  const lanes = [100, 200, 300];
  const laneCount = lanes.length;
  const [currentLane, setCurrentLane] = useState(1);
  const playerX = 100;
  const playerSize = 40;

  // Obstacles
  const [obstacles, setObstacles] = useState<{ x: number; lane: number }[]>([]);
  const [gameOver, setGameOver] = useState(false);

  const lastTime = useRef(0);
  const obstacleTimer = useRef(0);

  // Countdown
  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 1) {
      const timer = setTimeout(() => setCountdown(c => (c! - 1) as CountdownState), 1000);
      return () => clearTimeout(timer);
    }
    if (countdown === 1) {
      const timer = setTimeout(() => {
        setCountdown(null);
        setGameState(gs => ({ ...gs, isPlaying: true, currentScore: 0, lives: 3, gameSpeed: 6 }));
        obstacleTimer.current = 0;
        lastTime.current = 0;
        setObstacles([]);
        setCurrentLane(1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Handle lane switching via Arrow or WASD
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!gameState.isPlaying) return;
      if ((e.code === 'ArrowUp' || e.code === 'KeyW') && currentLane > 0) {
        setCurrentLane(l => l - 1);
      } else if ((e.code === 'ArrowDown' || e.code === 'KeyS') && currentLane < laneCount - 1) {
        setCurrentLane(l => l + 1);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameState.isPlaying, currentLane]);

  // Main loop
  useEffect(() => {
    if (!gameState.isPlaying || countdown !== null) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let animationId: number;
    const loop = (timestamp: number) => {
      const delta = timestamp - lastTime.current;
      lastTime.current = timestamp;

      // Clear static background (no camera movement)
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      updateObstacles(delta, canvas.width);
      detectCollision();
      drawScene(ctx);

      if (gameState.isPlaying) animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [gameState.isPlaying, countdown, obstacles, currentLane]);

  // Score & dynamic difficulty
  useEffect(() => {
    if (!gameState.isPlaying || countdown !== null) return;
    const interval = setInterval(() => {
      setGameState(gs => {
        const newScore = gs.currentScore + 1;
        // Increase speed in tiers every 50 points
        const tier = Math.floor(newScore / 50);
        const newSpeed = Math.min(6 + tier * 1.0, 25); // cap
        return { ...gs, currentScore: newScore, gameSpeed: newSpeed };
      });
    }, 150);
    return () => clearInterval(interval);
  }, [gameState.isPlaying, countdown]);

  // Spawn and move obstacles
  const updateObstacles = (delta: number, width: number) => {
    obstacleTimer.current += delta;
    // Spawn interval decreases as score increases
    const baseInterval = 1200;
    const interval = Math.max(400, baseInterval - gameState.currentScore * 10);
    if (obstacleTimer.current > interval) {
      const lane = Math.floor(Math.random() * laneCount);
      setObstacles(obs => [...obs, { x: width, lane }]);
      obstacleTimer.current = 0;
    }
    setObstacles(obs =>
      obs
        .map(o => ({ ...o, x: o.x - gameState.gameSpeed }))
        .filter(o => o.x + playerSize > 0)
    );
  };

  // Collision detection
  const detectCollision = () => {
    for (const obs of obstacles) {
      if (
        obs.lane === currentLane &&
        obs.x < playerX + playerSize &&
        obs.x + playerSize > playerX
      ) {
        handleHit();
        break;
      }
    }
  };

  // Draw everything
  const drawScene = (ctx: CanvasRenderingContext2D) => {
    // Static background
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, 800, 400);

    // Draw lanes
    ctx.strokeStyle = '#444';
    lanes.forEach(y => {
      ctx.beginPath();
      ctx.moveTo(0, y + playerSize / 2);
      ctx.lineTo(800, y + playerSize / 2);
      ctx.stroke();
    });

    // Draw player
    const py = lanes[currentLane] - playerSize / 2;
    ctx.fillStyle = '#0af';
    ctx.fillRect(playerX, py, playerSize, playerSize);

    // Draw obstacles
    ctx.fillStyle = '#f33';
    obstacles.forEach(o => {
      const oy = lanes[o.lane] - playerSize / 2;
      ctx.fillRect(o.x, oy, playerSize, playerSize);
    });

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(`Score: ${gameState.currentScore}`, 20, 30);
    ctx.fillText(`Lives: ${gameState.lives}`, 20, 60);
  };

  // On hit
  const handleHit = () => {
    setGameState(gs => ({ ...gs, lives: gs.lives - 1 }));
    if (gameState.lives <= 1) {
      endGame();
    } else {
      setObstacles([]); // clear for next life
    }
  };

  // Save score
  const saveToLeaderboard = (score: number, name: string) => {
    const entry: Player = { id: Date.now().toString(), name, score, timestamp: new Date() };
    const data: Player[] = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || '[]');
    data.push(entry);
    data.sort((a, b) => b.score - a.score);
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(data.slice(0, 5)));
    window.dispatchEvent(new Event('leaderboardUpdate'));
  };

  // End game
  const endGame = () => {
    setGameState(gs => ({ ...gs, isPlaying: false }));
    saveToLeaderboard(gameState.currentScore, gameState.playerName);
    setGameOver(true);
    setTimeout(() => setGameOver(false), 2000);
  };

  // Start game
  const startGame = () => {
    if (!gameState.playerName) return;
    setCountdown(3);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-4">
      <div className="w-full max-w-lg bg-slate-800 rounded-xl shadow-xl p-6 border border-slate-700 relative">
        <h2 className="text-3xl font-bold mb-6 text-center text-white">Maze Runner</h2>

        {/* Pre-game UI */}
        {!gameState.isPlaying && !countdown && !gameOver && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter your name"
              className="w-full p-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:outline-none"
              value={gameState.playerName}
              onChange={e => setGameState(gs => ({ ...gs, playerName: e.target.value }))}
            />
            <button
              onClick={startGame}
              className="w-full py-3 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors"
              disabled={!gameState.playerName}
            >
              Start in 3...
            </button>
          </div>
        )}

        {/* Countdown Overlay */}
        {countdown && (
          <div className="absolute inset-0 flex items-center justify-center text-6xl font-extrabold text-white bg-black bg-opacity-60">
            {countdown}
          </div>
        )}

        {/* Game Canvas */}
        {(gameState.isPlaying || gameOver) && (
          <div className="relative">
            <canvas ref={canvasRef} width={800} height={400} className="rounded-lg mx-auto block" />
            {gameOver && (
              <div className="absolute inset-0 flex items-center justify-center text-5xl font-extrabold text-red-500 bg-black bg-opacity-70">
                GAME OVER
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
