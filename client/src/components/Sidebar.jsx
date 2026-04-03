// components/Sidebar.jsx
import React, { useState } from 'react';
import MoveList from './MoveList';
import styles from './Sidebar.module.css';

export default function Sidebar({
  gameData,
  mode,
  difficulty,
  aiSide,
  paused,
  gameId,
  joinInput,
  setJoinInput,
  joining,
  onNewGame,
  onUndo,
  onFlip,
  onTogglePause,
  onSetMode,
  onSetDifficulty,
  onSetAiSide,
  onJoinGame,
}) {
  const [copied, setCopied] = useState(false);
  const state = gameData?.state;
  const moveHistory = state?.moveHistory || [];
  const shortId = gameId ? gameId.slice(0, 8).toUpperCase() : '';

  const copyRoomId = () => {
    navigator.clipboard.writeText(shortId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

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

        {/* Room ID with copy button */}
        {gameId && (
          <div className={styles.gameId}>
            <span className={styles.gameIdLabel}>Room ID</span>
            <div className={styles.gameIdRight}>
              <code className={styles.gameIdCode}>{shortId}</code>
              <button className={styles.copyBtn} onClick={copyRoomId} title="Copy Room ID">
                {copied ? '✓' : '⎘'}
              </button>
            </div>
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

        {/* AI options */}
        {mode === 'ai' && (
          <>
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
            <p className={styles.subLabel}>Play as</p>
            <div className={styles.sideRow}>
              <button
                className={`${styles.sideBtn} ${aiSide === 'b' ? styles.sideBtnActive : ''}`}
                onClick={() => onSetAiSide('b')}
              >
                <span className={styles.sidePiece} style={{ color: '#f5f0e8', textShadow: '0 0 2px #000, 0 0 2px #000' }}>♔</span>
                White
              </button>
              <button
                className={`${styles.sideBtn} ${aiSide === 'w' ? styles.sideBtnActive : ''}`}
                onClick={() => onSetAiSide('w')}
              >
                <span className={styles.sidePiece} style={{ color: '#1a1a1a', textShadow: '0 0 2px #fff, 0 0 2px #fff' }}>♚</span>
                Black
              </button>
            </div>
          </>
        )}

        {/* Online: Join by Room ID */}
        {mode === 'online' && (
          <>
            <p className={styles.subLabel}>Join a friend's game</p>
            <div className={styles.joinRow}>
              <input
                className={styles.joinInput}
                type="text"
                placeholder="Enter Room ID..."
                value={joinInput}
                onChange={e => setJoinInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && onJoinGame(joinInput)}
                maxLength={8}
                spellCheck={false}
              />
              <button
                className={styles.joinBtn}
                onClick={() => onJoinGame(joinInput)}
                disabled={joining || joinInput.length < 8}
              >
                {joining ? '...' : 'Join'}
              </button>
            </div>
            <p className={styles.joinHint}>
              Share your Room ID above with a friend — they paste it here to join.
            </p>
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