// components/MoveList.jsx
import React, { useEffect, useRef } from 'react';
import styles from './MoveList.module.css';

export default function MoveList({ moveHistory = [] }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [moveHistory.length]);

  const pairs = [];
  for (let i = 0; i < moveHistory.length; i += 2) {
    pairs.push({
      num: Math.floor(i / 2) + 1,
      white: moveHistory[i],
      black: moveHistory[i + 1] || null,
    });
  }

  return (
    <div className={styles.container}>
      {pairs.length === 0 ? (
        <p className={styles.empty}>No moves yet</p>
      ) : (
        <div className={styles.list}>
          {pairs.map(({ num, white, black }) => (
            <div key={num} className={styles.row}>
              <span className={styles.num}>{num}.</span>
              <span className={`${styles.move} ${styles.whiteMove}`}>{white?.notation}</span>
              <span className={`${styles.move} ${styles.blackMove}`}>{black?.notation || ''}</span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
