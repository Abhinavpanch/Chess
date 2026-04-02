// hooks/useGame.js
import { useState, useCallback } from 'react';
import { useSocket } from './useSocket';

export function useGame() {
  const [gameId, setGameId] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [playerColor, setPlayerColor] = useState('w');
  const [legalMoves, setLegalMoves] = useState([]);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [pendingPromotion, setPendingPromotion] = useState(null);
  const [mode, setMode] = useState('local');
  const [difficulty, setDifficulty] = useState('medium');
  const [aiSide, setAiSide] = useState('b');
  const [paused, setPaused] = useState(false);
  const [notification, setNotification] = useState(null);

  const notify = (msg, type = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const { emit } = useSocket(gameId, {
    onGameState: (data) => {
      setGameData(data);
      if (data.paused !== undefined) setPaused(data.paused);
    },
    onPlayerColor: (color) => setPlayerColor(color),
    onLegalMoves: ({ row, col, moves }) => {
      setSelectedSquare([row, col]);
      setLegalMoves(moves);
    },
    onTimerTick: (timers) => {
      setGameData(prev => prev ? { ...prev, timers } : prev);
    },
    onGamePaused: ({ paused: p }) => setPaused(p),
    onIllegalMove: () => {
      notify('Illegal move!', 'error');
      setSelectedSquare(null);
      setLegalMoves([]);
    },
    onPlayerDisconnected: ({ color }) => {
      notify(`${color === 'w' ? 'White' : 'Black'} player disconnected`, 'warning');
    },
    onError: (err) => notify(err.message, 'error'),
  });

  const createGame = useCallback(async (newMode, newDifficulty, newAiSide) => {
    const m = newMode ?? mode;
    const d = newDifficulty ?? difficulty;
    const s = newAiSide ?? aiSide;

    setMode(m);
    setDifficulty(d);
    setAiSide(s);
    setPaused(false);

    const res = await fetch('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: m, difficulty: d, aiSide: s }),
    });
    const { gameId: id } = await res.json();
    setGameId(id);
    setSelectedSquare(null);
    setLegalMoves([]);
    setPendingPromotion(null);

    // Player always plays opposite of AI
    const playerSide = m === 'ai' ? (s === 'b' ? 'w' : 'b') : 'w';
    setTimeout(() => {
      emit('joinGame', { gameId: id, preferColor: playerSide });
    }, 100);

    return id;
  }, [mode, difficulty, aiSide, emit]);

  const humanSide = mode === 'ai' ? (aiSide === 'b' ? 'w' : 'b') : null;

  const selectSquare = useCallback((row, col) => {
    if (!gameData || gameData.state.gameOver) return;
    if (paused) { notify('Game is paused', 'warning'); return; }
    const { state } = gameData;

    // Block clicks on AI's turn
    if (mode === 'ai' && state.turn === aiSide) return;

    if (selectedSquare) {
      const isLegal = legalMoves.some(([r, c]) => r === row && c === col);
      if (isLegal) {
        const [fr, fc] = selectedSquare;
        const piece = state.board[fr][fc];
        const isPromo = piece?.[1] === 'P' && (row === 0 || row === 7);
        if (isPromo) {
          setPendingPromotion({ from: [fr, fc], to: [row, col] });
        } else {
          emit('makeMove', { gameId, from: [fr, fc], to: [row, col] });
        }
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }
      const piece = state.board[row][col];
      if (piece && piece[0] === state.turn) {
        emit('getLegalMoves', { gameId, row, col });
        return;
      }
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    const piece = state.board[row][col];
    if (!piece || piece[0] !== state.turn) return;
    if (mode === 'online' && piece[0] !== playerColor) return;
    emit('getLegalMoves', { gameId, row, col });
  }, [gameData, selectedSquare, legalMoves, gameId, mode, playerColor, aiSide, paused, emit]);

  const confirmPromotion = useCallback((piece) => {
    if (!pendingPromotion) return;
    const { from, to } = pendingPromotion;
    emit('makeMove', { gameId, from, to, promotion: piece });
    setPendingPromotion(null);
  }, [pendingPromotion, gameId, emit]);

  const newGame = useCallback((overrides = {}) => {
    const m = overrides.mode ?? mode;
    const d = overrides.difficulty ?? difficulty;
    const s = overrides.aiSide ?? aiSide;
    setMode(m); setDifficulty(d); setAiSide(s);
    if (gameId) {
      emit('newGame', { gameId, mode: m, difficulty: d, aiSide: s });
      setSelectedSquare(null);
      setLegalMoves([]);
      setPendingPromotion(null);
      setPaused(false);
    } else {
      createGame(m, d, s);
    }
  }, [gameId, mode, difficulty, aiSide, emit, createGame]);

  const undoMove = useCallback(() => {
    emit('undoMove', { gameId });
    setSelectedSquare(null);
    setLegalMoves([]);
  }, [gameId, emit]);

  const togglePause = useCallback(() => {
    if (!gameId) return;
    if (paused) {
      emit('resumeGame', { gameId });
      setPaused(false);
    } else {
      emit('pauseGame', { gameId });
      setPaused(true);
    }
  }, [gameId, paused, emit]);

  const setModeAndRestart = useCallback((m) => createGame(m, difficulty, aiSide), [difficulty, aiSide, createGame]);
  const setDifficultyAndRestart = useCallback((d) => createGame(mode, d, aiSide), [mode, aiSide, createGame]);
  const setAiSideAndRestart = useCallback((s) => createGame(mode, difficulty, s), [mode, difficulty, createGame]);

  return {
    gameData, gameId, playerColor, selectedSquare, legalMoves,
    pendingPromotion, mode, difficulty, aiSide, paused, humanSide,
    notification, selectSquare, confirmPromotion, newGame, undoMove,
    togglePause, createGame, setModeAndRestart, setDifficultyAndRestart, setAiSideAndRestart,
  };
}