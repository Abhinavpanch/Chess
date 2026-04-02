// components/Square.jsx
import React from 'react';
import { PieceSVG, isLightSquare, FILES, RANKS } from '../utils/chess';
import styles from './Square.module.css';

export default function Square({
  row, col,
  piece,
  isSelected,
  isLastMoveFrom,
  isLastMoveTo,
  isLegalTarget,
  isCheck,
  flipped,
  onClick,
}) {
  const light = isLightSquare(row, col);
  const hasCapture = isLegalTarget && !!piece;
  const showHint = isLegalTarget && !piece;
  const showFile = flipped ? row === 0 : row === 7;
  const showRank = flipped ? col === 7 : col === 0;

  let cls = `${styles.square} ${light ? styles.light : styles.dark}`;
  if (isSelected)     cls += ` ${styles.selected}`;
  else if (isLastMoveFrom || isLastMoveTo) cls += ` ${styles.lastMove}`;
  if (isCheck)        cls += ` ${styles.check}`;
  if (hasCapture)     cls += ` ${styles.captureRing}`;

  return (
    <div className={cls} onClick={onClick} data-square={`${FILES[col]}${RANKS[row]}`}>
      {showRank && (
        <span className={`${styles.coordRank} ${light ? styles.coordOnLight : styles.coordOnDark}`}>
          {RANKS[row]}
        </span>
      )}
      {showFile && (
        <span className={`${styles.coordFile} ${light ? styles.coordOnLight : styles.coordOnDark}`}>
          {FILES[col]}
        </span>
      )}
      {piece && (
        <div className={styles.pieceWrapper}>
          <PieceSVG piece={piece} />
        </div>
      )}
      {showHint && <div className={styles.moveHint} />}
      {hasCapture && <div className={styles.captureHint} />}
    </div>
  );
}