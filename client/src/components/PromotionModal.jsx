// components/PromotionModal.jsx
import React from 'react';
import { PIECE_UNICODE } from '../utils/chess';
import styles from './PromotionModal.module.css';

const PROMOTION_PIECES = ['Q', 'R', 'B', 'N'];

export default function PromotionModal({ color, onSelect }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3 className={styles.title}>Promote Pawn</h3>
        <div className={styles.choices}>
          {PROMOTION_PIECES.map(piece => (
            <button
              key={piece}
              className={styles.choice}
              onClick={() => onSelect(piece)}
              title={piece === 'Q' ? 'Queen' : piece === 'R' ? 'Rook' : piece === 'B' ? 'Bishop' : 'Knight'}
            >
              <span className={styles.pieceIcon}>{PIECE_UNICODE[color + piece]}</span>
              <span className={styles.pieceName}>
                {piece === 'Q' ? 'Queen' : piece === 'R' ? 'Rook' : piece === 'B' ? 'Bishop' : 'Knight'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
