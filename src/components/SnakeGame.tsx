import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RotateCcw, Play, Skull } from 'lucide-react';

/**
 * 霓虹貪食蛇遊戲
 * 使用 HTML5 Canvas 繪製，React 處理 UI 狀態
 */

// 遊戲常數
const GRID_SIZE = 20;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const INITIAL_SPEED = 150;
const SPEED_INCREMENT = 2;
const MIN_SPEED = 60;

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const SnakeGame: React.FC = () => {
  // 遊戲狀態
  const [snake, setSnake] = useState<Point[]>([
    { x: 10, y: 15 },
    { x: 10, y: 16 },
    { x: 10, y: 17 },
  ]);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>('UP');
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [logs, setLogs] = useState<string[]>(['[資訊] 遊戲引擎初始化中...', '[資訊] 等待使用者輸入...']);

  // Refs 用於遊戲引擎
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const directionRef = useRef<Direction>('UP');
  const nextDirectionRef = useRef<Direction>('UP');
  const gameLoopRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [msg, ...prev].slice(0, 5));
  }, []);

  // 生成隨機食物位置
  const generateFood = useCallback((currentSnake: Point[]): Point => {
    const cols = CANVAS_WIDTH / GRID_SIZE;
    const rows = CANVAS_HEIGHT / GRID_SIZE;
    let newFood: Point;
    
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows),
      };
      const isOnSnake = currentSnake.some(
        (segment) => segment.x === newFood.x && segment.y === newFood.y
      );
      if (!isOnSnake) break;
    }
    return newFood;
  }, []);

  // 遊戲重啟
  const resetGame = () => {
    const initialSnake = [
      { x: 10, y: 15 },
      { x: 10, y: 16 },
      { x: 10, y: 17 },
    ];
    setSnake(initialSnake);
    setFood(generateFood(initialSnake));
    setDirection('UP');
    directionRef.current = 'UP';
    nextDirectionRef.current = 'UP';
    setScore(0);
    setIsGameOver(false);
    setIsPaused(false);
    setSpeed(INITIAL_SPEED);
    lastUpdateTimeRef.current = performance.now();
    addLog('[事件] 遊戲重設');
  };

  // 鍵盤控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          if (directionRef.current !== 'DOWN') nextDirectionRef.current = 'UP';
          break;
        case 'ArrowDown':
          if (directionRef.current !== 'UP') nextDirectionRef.current = 'DOWN';
          break;
        case 'ArrowLeft':
          if (directionRef.current !== 'RIGHT') nextDirectionRef.current = 'LEFT';
          break;
        case 'ArrowRight':
          if (directionRef.current !== 'LEFT') nextDirectionRef.current = 'RIGHT';
          break;
        case ' ':
          if (!isGameOver) {
             setIsPaused((prev) => {
               addLog(prev ? '[資訊] 遊戲已恢復' : '[資訊] 遊戲已暫停');
               return !prev;
             });
          } else resetGame();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameOver, addLog]);

  // 繪製遊戲畫面
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#020617'; 
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.strokeStyle = 'rgba(51, 65, 85, 0.2)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke();
    }

    ctx.fillStyle = '#f43f5e';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#f43f5e';
    ctx.beginPath();
    ctx.arc(food.x * GRID_SIZE + GRID_SIZE / 2, food.y * GRID_SIZE + GRID_SIZE / 2, GRID_SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

    snake.forEach((segment, index) => {
      const isHead = index === 0;
      ctx.fillStyle = isHead ? '#34d399' : '#059669';
      ctx.shadowBlur = isHead ? 20 : 10;
      ctx.shadowColor = '#10b981';
      
      const opacity = Math.max(0.4, 1 - (index / snake.length) * 0.6);
      ctx.globalAlpha = opacity;

      ctx.beginPath();
      ctx.roundRect(
        segment.x * GRID_SIZE + 1,
        segment.y * GRID_SIZE + 1,
        GRID_SIZE - 2,
        GRID_SIZE - 2,
        isHead ? 4 : 2
      );
      ctx.fill();
      ctx.globalAlpha = 1.0;

      if (isHead) {
        ctx.fillStyle = '#020617';
        ctx.shadowBlur = 0;
        const eyeSize = 2;
        if (directionRef.current === 'UP' || directionRef.current === 'DOWN') {
          ctx.fillRect(segment.x * GRID_SIZE + 5, segment.y * GRID_SIZE + (directionRef.current === 'UP' ? 5 : 13), eyeSize, eyeSize);
          ctx.fillRect(segment.x * GRID_SIZE + 13, segment.y * GRID_SIZE + (directionRef.current === 'UP' ? 5 : 13), eyeSize, eyeSize);
        } else {
          ctx.fillRect(segment.x * GRID_SIZE + (directionRef.current === 'LEFT' ? 5 : 13), segment.y * GRID_SIZE + 5, eyeSize, eyeSize);
          ctx.fillRect(segment.x * GRID_SIZE + (directionRef.current === 'LEFT' ? 5 : 13), segment.y * GRID_SIZE + 13, eyeSize, eyeSize);
        }
      }
    });

    ctx.shadowBlur = 0;
  }, [snake, food]);

  const update = useCallback(() => {
    if (isPaused || isGameOver) return;

    directionRef.current = nextDirectionRef.current;
    
    setSnake((prevSnake) => {
      const head = prevSnake[0];
      const newHead = { ...head };

      switch (directionRef.current) {
        case 'UP': newHead.y -= 1; break;
        case 'DOWN': newHead.y += 1; break;
        case 'LEFT': newHead.x -= 1; break;
        case 'RIGHT': newHead.x += 1; break;
      }

      if (
        newHead.x < 0 || newHead.x >= CANVAS_WIDTH / GRID_SIZE ||
        newHead.y < 0 || newHead.y >= CANVAS_HEIGHT / GRID_SIZE ||
        prevSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)
      ) {
        setIsGameOver(true);
        addLog('[嚴重] 偵測到系統碰撞');
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      if (newHead.x === food.x && newHead.y === food.y) {
        setScore((s) => s + 100);
        setFood(generateFood(newSnake));
        setSpeed((prev) => Math.max(MIN_SPEED, prev - SPEED_INCREMENT));
        addLog(`[事件] 分數增加：+100`);
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [food, isPaused, isGameOver, generateFood, addLog]);

  useEffect(() => {
    const loop = (time: number) => {
      const delta = time - lastUpdateTimeRef.current;
      if (delta >= speed) {
        update();
        lastUpdateTimeRef.current = time;
      }
      draw();
      gameLoopRef.current = requestAnimationFrame(loop);
    };
    gameLoopRef.current = requestAnimationFrame(loop);
    return () => { if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current); };
  }, [update, draw, speed]);

  useEffect(() => {
    if (score > highScore) setHighScore(score);
  }, [score, highScore]);

  return (
    <div className="w-full max-w-[1024px] h-[768px] mx-auto bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden border border-slate-800 shadow-2xl rounded-3xl mt-8">
      {/* Header Section */}
      <header className="h-20 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between px-10 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <div className="w-6 h-6 border-4 border-slate-950 rounded-sm"></div>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-display">
              NEON<span className="text-emerald-500">SNAKE</span>.io
            </h1>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">v2.4.0-prod | TypeScript Engine</p>
          </div>
        </div>
        
        <div className="flex gap-8 items-center">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">目前分數</p>
            <p className="text-2xl font-mono text-emerald-400 font-bold">{score.toLocaleString().padStart(6, '0')}</p>
          </div>
          <div className="h-10 w-[1px] bg-slate-800"></div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">最高分數</p>
            <p className="text-2xl font-mono text-rose-400 font-bold">{highScore.toLocaleString().padStart(6, '0')}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex p-6 gap-6 overflow-hidden">
        {/* Game Canvas Area */}
        <div className="relative flex-none w-[640px] h-[480px] bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden self-center">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full h-full block"
          />

          {/* Game Over Overlay */}
          <AnimatePresence>
            {isGameOver && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center z-20"
              >
                <motion.h2 
                  initial={{ scale: 0.5, y: 20 }} animate={{ scale: 1, y: 0 }}
                  className="text-6xl font-black text-rose-500 mb-2 tracking-tighter italic"
                >
                  遊戲結束
                </motion.h2>
                <p className="text-slate-400 mb-8 font-mono">最終分數: {score.toLocaleString()}</p>
                <button 
                  onClick={resetGame}
                  className="px-10 py-4 bg-emerald-500 text-slate-950 font-black rounded-full hover:bg-emerald-400 transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                >
                  按空白鍵重新開始
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pause / Start Overlay */}
          <AnimatePresence>
            {isPaused && !isGameOver && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center z-10"
              >
                <div className="flex flex-col items-center">
                  <motion.button
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={() => setIsPaused(false)}
                    className="w-24 h-24 bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.4)]"
                  >
                    <Play size={40} className="ml-2 fill-current" />
                  </motion.button>
                  <p className="mt-8 text-white font-black text-xl tracking-[0.3em] uppercase animate-pulse font-display">
                    {score === 0 ? '準備好了嗎？' : '已暫停'}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Controls & Info */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          <section className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 flex-1 flex flex-col">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">系統狀態</h3>
            <div className="space-y-4 flex-1">
              <StatusRow label="引擎" value="React + Canvas" />
              <StatusRow label="難度" value={speed < 100 ? '困難' : '普通'} highlight={speed < 100} />
              <StatusRow label="蛇的長度" value={snake.length.toString()} />
              <StatusRow label="速度比率" value={`${((INITIAL_SPEED - speed) / (INITIAL_SPEED - MIN_SPEED) * 100).toFixed(0)}%`} />
            </div>

            <div className="mt-6 border-t border-slate-800 pt-6">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">按鍵對應</h3>
              <div className="grid grid-cols-2 gap-3">
                <InputKey label="上" icon="↑" />
                <InputKey label="下" icon="↓" />
                <InputKey label="左" icon="←" />
                <InputKey label="右" icon="→" />
              </div>
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 h-44 shrink-0 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981] animate-pulse"></div>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">終端輸出</h3>
            </div>
            <div className="font-mono text-[10px] space-y-1 text-slate-500 overflow-hidden">
              {logs.map((log, i) => (
                <p key={i} className={log.includes('事件') ? 'text-emerald-400/80' : log.includes('嚴重') ? 'text-rose-400' : ''}>
                  {log}
                </p>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="h-12 bg-slate-950 border-t border-slate-800 flex items-center justify-between px-10 text-[10px] text-slate-500 uppercase tracking-widest shrink-0">
        <div className="flex gap-8">
          <span className="flex items-center gap-2"><div className="w-1 h-1 bg-slate-700 rounded-full" /> 網格: 40 x 30</span>
          <span className="flex items-center gap-2"><div className="w-1 h-1 bg-slate-700 rounded-full" /> 單元格: {GRID_SIZE}px</span>
        </div>
        <div className="flex gap-4">
          <span className="text-slate-600">開發環境 </span>
          <span className="text-slate-400 font-bold tracking-tighter italic">Vite + React + Motion</span>
        </div>
      </footer>
    </div>
  );
};

const StatusRow = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className="flex justify-between items-center text-xs">
    <span className="text-slate-500 font-medium">{label}</span>
    <span className={`font-mono font-bold ${highlight ? 'px-2 py-0.5 bg-rose-500/20 text-rose-400 rounded text-[10px]' : 'text-slate-200'}`}>
      {value}
    </span>
  </div>
);

const InputKey = ({ label, icon }: { label: string; icon: string }) => (
  <div className="bg-slate-800/30 p-2 rounded-xl border border-slate-800/50 flex flex-col items-center group hover:bg-slate-800/50 transition-colors">
    <span className="text-lg text-slate-300 font-bold group-hover:text-emerald-400 transition-colors">{icon}</span>
    <span className="text-[8px] text-slate-600 uppercase font-black tracking-tighter">{label}</span>
  </div>
);

const ControlTip = ({ label }: { label: string }) => (
  <div className="flex flex-col items-center gap-2">
    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{label}</span>
  </div>
);

export default SnakeGame;
