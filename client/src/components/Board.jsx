// components/Board.jsx
import React from 'react';
import Square from './Square';
import styles from './Board.module.css';

export default function Board({
  board,
  selectedSquare,
  legalMoves,
  lastMove,
  turn,
  flipped,
  onSquareClick,
}) {
  if (!board) return null;

  const legalSet = new Set(legalMoves.map(([r, c]) => `${r},${c}`));

  const rows = flipped
    ? Array.from({ length: 8 }, (_, i) => 7 - i)
    : Array.from({ length: 8 }, (_, i) => i);

  const cols = flipped
    ? Array.from({ length: 8 }, (_, i) => 7 - i)
    : Array.from({ length: 8 }, (_, i) => i);

  return (
    <div className={styles.boardOuter}>
      <div className={styles.board}>
        {rows.map(row =>
          cols.map(col => {
            const piece = board[row][col];
            const isSelected = selectedSquare?.[0] === row && selectedSquare?.[1] === col;
            const isLegalTarget = legalSet.has(`${row},${col}`);
            const isLastMoveFrom = lastMove?.from?.[0] === row && lastMove?.from?.[1] === col;
            const isLastMoveTo = lastMove?.to?.[0] === row && lastMove?.to?.[1] === col;
            const isCheck = piece === turn + 'K' && false;

            return (
              <Square
                key={`${row}-${col}`}
                row={row}
                col={col}
                piece={piece}
                isSelected={isSelected}
                isLastMoveFrom={isLastMoveFrom}
                isLastMoveTo={isLastMoveTo}
                isLegalTarget={isLegalTarget}
                isCheck={isCheck}
                flipped={flipped}
                onClick={() => onSquareClick(row, col)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}