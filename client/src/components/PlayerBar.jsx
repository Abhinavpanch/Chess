// components/PlayerBar.jsx
import React from 'react';
import { PIECE_UNICODE, formatTime, getCapturedDisplay, getMaterialScore } from '../utils/chess';
import styles from './PlayerBar.module.css';

export default function PlayerBar({ color, name, captured = [], timer, isActive, isBottom }) {
  const display = getCapturedDisplay(captured);
  const score = getMaterialScore(captured);
  const low = timer < 30;
  const urgent = timer < 10;

  return (
    <div className={`${styles.bar} ${isBottom ? styles.bottom : styles.top}`}>
      <div className={`${styles.avatar} ${color === 'w' ? styles.white : styles.black}`}>
        {color === 'w' ? '♔' : '♚'}
      </div>
      <div className={styles.info}>
        <span className={styles.name}>{name}</span>
        {display.length > 0 && (
          <div className={styles.captured}>
            {display.map(({ unicode, count }, i) => (
              <span key={i} className={styles.capturedPiece}>
                {unicode}{count > 1 ? <sup>{count}</sup> : null}
              </span>
            ))}
            {score > 0 && <span className={styles.score}>+{score}</span>}
          </div>
        )}
      </div>
      <div className={`${styles.timer} ${isActive ? styles.timerActive : ''} ${low ? styles.low : ''} ${urgent ? styles.urgent : ''}`}>
        {formatTime(timer)}
      </div>
    </div>
  );
}
