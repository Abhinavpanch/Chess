// components/Sidebar.jsx
import React from 'react';
import MoveList from './MoveList';
import styles from './Sidebar.module.css';

export default function Sidebar({
  gameData,
  mode,
  difficulty,
  aiSide,
  paused,
  onNewGame,
  onUndo,
  onFlip,
  onTogglePause,
  onSetMode,
  onSetDifficulty,
  onSetAiSide,
  gameId,
}) {
  const state = gameData?.state;
  const moveHistory = state?.moveHistory || [];

  const statusText = () => {
    if (!state) return 'Loading...';
    if (paused) return 'Game Paused';
    if (state.gameOver) return state.gameResult;
    const t = state.turn === 'w' ? 'White' : 'Black';
    return `${t}'s turn`;
  };

  const statusClass = () => {
    if (!state) return '';
    if (paused) return styles.pausedStatus;
    if (state.gameOver) {
      if (state.gameResult?.includes('Stalemate')) return styles.draw;
      return styles.gameOver;
    }
    return state.turn === 'w' ? styles.whiteTurn : styles.blackTurn;
  };

  const lastMove = moveHistory[moveHistory.length - 1];
  const inCheck = lastMove?.notation?.includes('+') && !lastMove?.notation?.includes('#');
  const canPause = state && !state.gameOver;

  return (
    <div className={styles.sidebar}>
      {/* Status */}
      <div className={`${styles.panel} ${styles.statusPanel}`}>
        <div className={`${styles.statusBadge} ${statusClass()}`}>
          {paused && <span className={styles.pauseIcon}>⏸</span>}
          {state?.gameOver && !paused && <span className={styles.gameOverIcon}>⚑</span>}
          {inCheck && !state?.gameOver && !paused && <span className={styles.checkIcon}>⚠</span>}
          {statusText()}
        </div>
        {gameId && (
          <div className={styles.gameId}>
            <span className={styles.gameIdLabel}>Room ID</span>
            <code className={styles.gameIdCode}>{gameId.slice(0, 8).toUpperCase()}</code>
          </div>
        )}
      </div>

      {/* Mode selector */}
      <div className={styles.panel}>
        <p className={styles.panelLabel}>Mode</p>
        <div className={styles.segmented}>
          {['local', 'ai', 'online'].map(m => (
            <button
              key={m}
              className={`${styles.segBtn} ${mode === m ? styles.segActive : ''}`}
              onClick={() => onSetMode(m)}
            >
              {m === 'local' ? '2 Players' : m === 'ai' ? 'vs AI' : 'Online'}
            </button>
          ))}
        </div>

        {mode === 'ai' && (
          <>
            {/* Difficulty */}
            <p className={styles.subLabel}>Difficulty</p>
            <div className={styles.diffRow}>
              {['easy', 'medium', 'hard'].map(d => (
                <button
                  key={d}
                  className={`${styles.diffBtn} ${difficulty === d ? styles.diffActive : ''}`}
                  onClick={() => onSetDifficulty(d)}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>

            {/* Play as */}
            <p className={styles.subLabel}>Play as</p>
            <div className={styles.sideRow}>
              <button
                className={`${styles.sideBtn} ${aiSide === 'b' ? styles.sideBtnActive : ''}`}
                onClick={() => onSetAiSide('b')}
                title="You play White, AI plays Black"
              >
                <span className={styles.sidePiece} style={{ color: '#f5f0e8', textShadow: '0 0 2px #000, 0 0 2px #000' }}>♔</span>
                White
              </button>
              <button
                className={`${styles.sideBtn} ${aiSide === 'w' ? styles.sideBtnActive : ''}`}
                onClick={() => onSetAiSide('w')}
                title="You play Black, AI plays White"
              >
                <span className={styles.sidePiece} style={{ color: '#1a1a1a', textShadow: '0 0 2px #fff, 0 0 2px #fff' }}>♚</span>
                Black
              </button>
            </div>
          </>
        )}
      </div>

      {/* Move history */}
      <div className={styles.panel} style={{ flex: 1 }}>
        <p className={styles.panelLabel}>Moves</p>
        <MoveList moveHistory={moveHistory} />
      </div>

      {/* Actions */}
      <div className={styles.panel}>
        <div className={styles.actions}>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={onNewGame}>
            New Game
          </button>

          {/* Pause / Resume */}
          {canPause && (
            <button
              className={`${styles.btn} ${paused ? styles.btnResume : styles.btnPause}`}
              onClick={onTogglePause}
            >
              {paused ? '▶  Resume' : '⏸  Pause'}
            </button>
          )}

          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={onFlip}>
            Flip Board
          </button>
          {mode !== 'online' && (
            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={onUndo}>
              Undo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}