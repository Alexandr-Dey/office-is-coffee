"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const COLS = 7;
const ROWS = 7;
const MAX_MOVES = 20;
const GOAL = 500;

interface Gem {
  id: string;
  type: GemType;
  key: number;
}

type GemType = "bean" | "cup" | "leaf" | "milk" | "sugar" | "heart";

const GEM_CONFIG: Record<GemType, { emoji: string; bg: string }> = {
  bean:  { emoji: "☕", bg: "#f5e0c8" },
  cup:   { emoji: "🥤", bg: "#d4f0e4" },
  leaf:  { emoji: "🍃", bg: "#dff0c8" },
  milk:  { emoji: "🥛", bg: "#ebebeb" },
  sugar: { emoji: "🍬", bg: "#faeac8" },
  heart: { emoji: "❤️", bg: "#f5d0df" },
};

const GEM_TYPES: GemType[] = ["bean", "cup", "leaf", "milk", "sugar", "heart"];

let keyCounter = 0;
function nextKey(): number { return ++keyCounter; }

function randomType(): GemType {
  return GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)];
}

function createBoard(): Gem[][] {
  const board: Gem[][] = [];
  for (let r = 0; r < ROWS; r++) {
    const row: Gem[] = [];
    for (let c = 0; c < COLS; c++) {
      let t = randomType();
      // Avoid initial matches
      while (
        (c >= 2 && row[c - 1].type === t && row[c - 2].type === t) ||
        (r >= 2 && board[r - 1][c].type === t && board[r - 2][c].type === t)
      ) {
        t = randomType();
      }
      row.push({ id: `${r}-${c}`, type: t, key: nextKey() });
    }
    board.push(row);
  }
  return board;
}

function copyBoard(b: Gem[][]): Gem[][] {
  return b.map(row => row.map(g => ({ ...g })));
}

function findMatches(board: Gem[][]): Set<string> {
  const matched = new Set<string>();
  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 2; c++) {
      const t = board[r][c].type;
      if (t === board[r][c + 1].type && t === board[r][c + 2].type) {
        let end = c + 2;
        while (end + 1 < COLS && board[r][end + 1].type === t) end++;
        for (let i = c; i <= end; i++) matched.add(`${r}-${i}`);
      }
    }
  }
  // Vertical
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS - 2; r++) {
      const t = board[r][c].type;
      if (t === board[r + 1][c].type && t === board[r + 2][c].type) {
        let end = r + 2;
        while (end + 1 < ROWS && board[end + 1][c].type === t) end++;
        for (let i = r; i <= end; i++) matched.add(`${i}-${c}`);
      }
    }
  }
  return matched;
}

function removeAndDrop(board: Gem[][], matched: Set<string>): Gem[][] {
  const b = copyBoard(board);
  // Remove matched
  Array.from(matched).forEach(key => {
    const [r, c] = key.split("-").map(Number);
    b[r][c] = { id: `${r}-${c}`, type: "bean", key: -1 };
  });
  // Drop columns
  for (let c = 0; c < COLS; c++) {
    const col: Gem[] = [];
    for (let r = ROWS - 1; r >= 0; r--) {
      if (!matched.has(`${r}-${c}`)) col.push(b[r][c]);
    }
    // Fill from top with new gems
    while (col.length < ROWS) {
      col.push({ id: `new-${nextKey()}`, type: randomType(), key: nextKey() });
    }
    col.reverse();
    for (let r = 0; r < ROWS; r++) {
      b[r][c] = { ...col[r], id: `${r}-${c}` };
    }
  }
  return b;
}

function hasValidMoves(board: Gem[][]): boolean {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      // Try swap right
      if (c + 1 < COLS) {
        const b = copyBoard(board);
        [b[r][c], b[r][c + 1]] = [b[r][c + 1], b[r][c]];
        if (findMatches(b).size > 0) return true;
      }
      // Try swap down
      if (r + 1 < ROWS) {
        const b = copyBoard(board);
        [b[r][c], b[r + 1][c]] = [b[r + 1][c], b[r][c]];
        if (findMatches(b).size > 0) return true;
      }
    }
  }
  return false;
}

function shuffleBoard(board: Gem[][]): Gem[][] {
  let b = copyBoard(board);
  // Fisher-Yates on flat array
  const flat = b.flat();
  for (let i = flat.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [flat[i].type, flat[j].type] = [flat[j].type, flat[i].type];
  }
  let idx = 0;
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      b[r][c] = { ...flat[idx], id: `${r}-${c}`, key: nextKey() };
      idx++;
    }
  // Remove accidental matches
  let matches = findMatches(b);
  while (matches.size > 0) {
    b = removeAndDrop(b, matches);
    matches = findMatches(b);
  }
  if (!hasValidMoves(b)) return shuffleBoard(b);
  return b;
}

interface CoffeeMatch3Props {
  onScoreUpdate?: (score: number) => void;
}

export default function CoffeeMatch3({ onScoreUpdate }: CoffeeMatch3Props) {
  const [board, setBoard] = useState<Gem[][]>(() => createBoard());
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(MAX_MOVES);
  const [combo, setCombo] = useState(0);
  const [comboMsg, setComboMsg] = useState("");
  const [shaking, setShaking] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [gameOver, setGameOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const savedScore = useRef(false);

  const processMatches = useCallback(async (b: Gem[][], chainNum: number) => {
    const m = findMatches(b);
    if (m.size === 0) {
      if (!hasValidMoves(b)) {
        const shuffled = shuffleBoard(b);
        setBoard(shuffled);
      }
      setProcessing(false);
      return;
    }

    setMatched(m);
    const pts = m.size * 10 * chainNum;
    setScore(prev => {
      const next = prev + pts;
      onScoreUpdate?.(next);
      return next;
    });

    if (chainNum >= 2) {
      const msg = chainNum === 2 ? `Комбо! +${pts}` : chainNum === 3 ? `Горячо! +${pts}` : `КОФЕ-МАН! +${pts}`;
      setComboMsg(msg);
      setCombo(chainNum);
      setTimeout(() => setComboMsg(""), 1200);
    }

    // Wait for pop animation
    await new Promise(res => setTimeout(res, 350));
    setMatched(new Set());

    const newBoard = removeAndDrop(b, m);
    setBoard(newBoard);

    // Wait for drop animation
    await new Promise(res => setTimeout(res, 300));

    // Chain
    processMatches(newBoard, chainNum + 1);
  }, [onScoreUpdate]);

  const handleTap = useCallback((r: number, c: number) => {
    if (processing || gameOver || moves <= 0) return;

    if (!selected) {
      setSelected([r, c]);
      return;
    }

    const [sr, sc] = selected;
    if (sr === r && sc === c) {
      setSelected(null);
      return;
    }

    // Must be adjacent
    const isAdj = (Math.abs(sr - r) + Math.abs(sc - c)) === 1;
    if (!isAdj) {
      setSelected([r, c]);
      return;
    }

    // Swap
    const b = copyBoard(board);
    [b[sr][sc], b[r][c]] = [b[r][c], b[sr][sc]];
    // Fix ids
    b[sr][sc] = { ...b[sr][sc], id: `${sr}-${sc}` };
    b[r][c] = { ...b[r][c], id: `${r}-${c}` };

    const m = findMatches(b);
    if (m.size === 0) {
      // No match — shake
      setShaking(`${r}-${c}`);
      setTimeout(() => setShaking(null), 500);
      setSelected(null);
      return;
    }

    setBoard(b);
    setSelected(null);
    setMoves(prev => prev - 1);
    setProcessing(true);
    processMatches(b, 1);
  }, [selected, board, processing, gameOver, moves, processMatches]);

  // Game over check
  useEffect(() => {
    if (moves <= 0 && !processing && !gameOver) {
      setGameOver(true);
    }
  }, [moves, processing, gameOver]);

  // Save score once
  useEffect(() => {
    if (gameOver && !savedScore.current) {
      savedScore.current = true;
      onScoreUpdate?.(score);
    }
  }, [gameOver, score, onScoreUpdate]);

  const restart = useCallback(() => {
    keyCounter = 0;
    setBoard(createBoard());
    setSelected(null);
    setScore(0);
    setMoves(MAX_MOVES);
    setCombo(0);
    setComboMsg("");
    setGameOver(false);
    setProcessing(false);
    savedScore.current = false;
  }, []);

  const movesPercent = (moves / MAX_MOVES) * 100;
  const movesColor = moves > 10 ? "bg-green-500" : moves > 5 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="relative">
      {/* Combo message */}
      <AnimatePresence>
        {comboMsg && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 z-10 bg-brand-dark text-white px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap"
          >
            {combo >= 4 ? "🔥" : "⚡"} {comboMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Board */}
      <div className="grid gap-[3px] p-2 bg-[#1a7a44]/10 rounded-2xl" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
        {board.map((row, r) =>
          row.map((gem, c) => {
            const isSelected = selected?.[0] === r && selected?.[1] === c;
            const isMatched = matched.has(`${r}-${c}`);
            const isShaking = shaking === `${r}-${c}`;
            const cfg = GEM_CONFIG[gem.type];

            return (
              <motion.div
                key={gem.key}
                layout
                initial={{ y: -40, opacity: 0 }}
                animate={{
                  y: 0,
                  opacity: isMatched ? 0 : 1,
                  scale: isMatched ? 0 : isSelected ? 1.08 : 1,
                  x: isShaking ? [0, -6, 6, -4, 4, 0] : 0,
                }}
                transition={{
                  layout: { type: "spring", stiffness: 300, damping: 25 },
                  y: { type: "spring", stiffness: 200, damping: 20 },
                  scale: { duration: 0.2 },
                  x: isShaking ? { duration: 0.4 } : undefined,
                }}
                onPointerDown={() => handleTap(r, c)}
                className="aspect-square rounded-xl flex items-center justify-center text-lg select-none cursor-pointer"
                style={{
                  backgroundColor: cfg.bg,
                  border: isSelected ? "2.5px solid #1a7a44" : "2.5px solid transparent",
                  boxShadow: isSelected ? "0 0 0 2px rgba(26,122,68,0.3)" : "none",
                }}
              >
                {cfg.emoji}
              </motion.div>
            );
          })
        )}
      </div>

      {/* Moves progress bar */}
      <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-300 ${movesColor}`} style={{ width: `${movesPercent}%` }} />
      </div>

      {/* Game over overlay */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-20 p-6"
          >
            <p className="text-4xl mb-2">{score >= GOAL ? "🎉" : "☕"}</p>
            <p className="font-bold text-xl text-brand-text mb-1">
              {score >= GOAL ? "Цель выполнена!" : "Ходы закончились!"}
            </p>
            <p className="text-3xl font-bold text-brand-dark mb-1">{score} очков</p>
            {score >= GOAL && <p className="text-sm text-brand-mint font-bold mb-3">Отличная работа!</p>}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={restart}
              className="px-6 py-3 bg-brand-dark text-white font-bold rounded-xl text-sm"
            >
              Играть снова
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
