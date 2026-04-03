// App.jsx
import React, { useState, useEffect } from 'react';
import Board from './components/Board';
import PlayerBar from './components/PlayerBar';
import Sidebar from './components/Sidebar';
import PromotionModal from './components/PromotionModal';
import GameResult from './components/GameResult';
import Notification from './components/Notification';
import { useGame } from './hooks/useGame';
import styles from './App.module.css';

export default function App() {
  const {
    gameData,
    gameId,
    playerColor,
    selectedSquare,
    legalMoves,
    pendingPromotion,
    mode,
    difficulty,
    aiSide,
    paused,
    humanSide,
    notification,
    joinInput,
    setJoinInput,
    joining,
    selectSquare,
    confirmPromotion,
    newGame,
    undoMove,
    joinGame,
    togglePause,
    createGame,
    setModeAndRestart,
    setDifficultyAndRestart,
    setAiSideAndRestart,
  } = useGame();

  const [flipped, setFlipped] = useState(false);

  // Auto-create a game on mount
  useEffect(() => {
    createGame('local', 'medium');
  }, []);

  // Flip board when playing as black online
  useEffect(() => {
    if (mode === 'online' && playerColor === 'b') setFlipped(true);
  }, [mode, playerColor]);

  const state = gameData?.state;
  const timers = gameData?.timers || { w: 600, b: 600 };

  // Determine player names based on who the AI plays
  const whiteName = mode === 'ai' ? (aiSide === 'b' ? 'You (White)' : 'AI (White)') : 'White';
  const blackName = mode === 'ai' ? (aiSide === 'b' ? 'AI (Black)' : 'You (Black)') : 'Black';

  // Auto-flip board when playing as black in AI mode
  useEffect(() => {
    if (mode === 'ai' && aiSide === 'w') setFlipped(true);
    else if (mode === 'ai' && aiSide === 'b') setFlipped(false);
  }, [mode, aiSide]);

  // Last move for highlighting
  const lastMove = state?.moveHistory?.[state.moveHistory.length - 1] || null;

  // Is king in check?
  const inCheckColor = (() => {
    if (!lastMove) return null;
    const n = lastMove.notation;
    if (n?.includes('#')) return null;
    if (n?.includes('+')) return state?.turn;
    return null;
  })();

  // Build board with check highlight injected into Board
  const boardWithCheck = state?.board || null;

  const topColor = flipped ? 'w' : 'b';
  const bottomColor = flipped ? 'b' : 'w';

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>♛</span>
          <span className={styles.logoText}>Chess</span>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.gameArea}>
          {/* Top player */}
          <PlayerBar
            color={topColor}
            name={topColor === 'w' ? whiteName : blackName}
            captured={topColor === 'w' ? state?.capturedByWhite || [] : state?.capturedByBlack || []}
            timer={timers[topColor]}
            isActive={state?.turn === topColor && !state?.gameOver}
            isBottom={false}
          />

          {/* Board */}
          <div className={styles.boardWrapper}>
            <Board
              board={boardWithCheck}
              selectedSquare={selectedSquare}
              legalMoves={legalMoves}
              lastMove={lastMove}
              turn={state?.turn}
              inCheckColor={inCheckColor}
              flipped={flipped}
              onSquareClick={selectSquare}
            />
            {paused && !state?.gameOver && (
              <div className={styles.pauseOverlay}>
                <div className={styles.pauseCard}>
                  <span className={styles.pauseBigIcon}>⏸</span>
                  <p className={styles.pauseText}>Game Paused</p>
                  <button className={styles.pauseResumeBtn} onClick={togglePause}>
                    ▶ Resume
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom player */}
          <PlayerBar
            color={bottomColor}
            name={bottomColor === 'w' ? whiteName : blackName}
            captured={bottomColor === 'w' ? state?.capturedByWhite || [] : state?.capturedByBlack || []}
            timer={timers[bottomColor]}
            isActive={state?.turn === bottomColor && !state?.gameOver}
            isBottom={true}
          />
        </div>

        {/* Sidebar */}
        <Sidebar
          gameData={gameData}
          mode={mode}
          difficulty={difficulty}
          aiSide={aiSide}
          paused={paused}
          gameId={gameId}
          joinInput={joinInput}
          setJoinInput={setJoinInput}
          joining={joining}
          onNewGame={newGame}
          onUndo={undoMove}
          onFlip={() => setFlipped(f => !f)}
          onTogglePause={togglePause}
          onSetMode={setModeAndRestart}
          onSetDifficulty={setDifficultyAndRestart}
          onSetAiSide={setAiSideAndRestart}
          onJoinGame={joinGame}
        />
      </main>

      {/* Promotion modal */}
      {pendingPromotion && (
        <PromotionModal
          color={state?.turn}
          onSelect={confirmPromotion}
        />
      )}

      {/* Game result overlay */}
      {state?.gameOver && (
        <GameResult
          result={state.gameResult}
          onNewGame={newGame}
        />
      )}

      {/* Notifications */}
      <Notification notification={notification} />
    </div>
  );
}