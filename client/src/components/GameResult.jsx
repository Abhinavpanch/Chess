// components/GameResult.jsx
import React from 'react';
import styles from './GameResult.module.css';

export default function GameResult({ result, onNewGame }) {
  if (!result) return null;

  const isCheckmate = result.includes('Checkmate');
  const isDraw = result.includes('Stalemate') || result.includes('Draw');
  const isTimeout = result.includes('time');

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.icon}>
          {isCheckmate ? '♚' : isDraw ? '½' : '⏱'}
        </div>
        <h2 className={styles.title}>
          {isCheckmate ? 'Checkmate!' : isDraw ? 'Draw!' : 'Time\'s Up!'}
        </h2>
        <p className={styles.result}>{result}</p>
        <button className={styles.newGameBtn} onClick={onNewGame}>
          Play Again
        </button>
      </div>
    </div>
  );
}
