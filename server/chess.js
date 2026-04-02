// chess.js - Complete chess engine
// All game logic: move generation, validation, check detection, AI

const PIECE_VALUES = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 20000 };

const PIECE_SQUARE_TABLES = {
  P: [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [5, 10, 10,-20,-20, 10, 10,  5],
    [5, -5,-10,  0,  0,-10, -5,  5],
    [0,  0,  0, 20, 20,  0,  0,  0],
    [5,  5, 10, 25, 25, 10,  5,  5],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [0,  0,  0,  0,  0,  0,  0,  0],
  ],
  N: [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50],
  ],
  B: [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  5,  0,  0,  0,  0,  5,-10],
    [-10, 10, 10, 10, 10, 10, 10,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20],
  ],
  R: [
    [0,  0,  0,  5,  5,  0,  0,  0],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [5, 10, 10, 10, 10, 10, 10,  5],
    [0,  0,  0,  0,  0,  0,  0,  0],
  ],
  Q: [
    [-20,-10,-10, -5, -5,-10,-10,-20],
    [-10,  0,  5,  0,  0,  0,  0,-10],
    [-10,  5,  5,  5,  5,  5,  0,-10],
    [0,  0,  5,  5,  5,  5,  0, -5],
    [-5,  0,  5,  5,  5,  5,  0, -5],
    [-10,  0,  5,  5,  5,  5,  0,-10],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-20,-10,-10, -5, -5,-10,-10,-20],
  ],
  K: [
    [20, 30, 10,  0,  0, 10, 30, 20],
    [20, 20,  0,  0,  0,  0, 20, 20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
  ],
};

function createInitialBoard() {
  const order = ['R','N','B','Q','K','B','N','R'];
  const board = Array(8).fill(null).map(() => Array(8).fill(null));
  for (let c = 0; c < 8; c++) {
    board[0][c] = 'b' + order[c];
    board[1][c] = 'bP';
    board[6][c] = 'wP';
    board[7][c] = 'w' + order[c];
  }
  return board;
}

function createInitialState() {
  return {
    board: createInitialBoard(),
    turn: 'w',
    castlingRights: { wK: true, wQ: true, bK: true, bQ: true },
    enPassant: null,
    moveHistory: [],
    capturedByWhite: [],
    capturedByBlack: [],
    gameOver: false,
    gameResult: null,
    halfMoveClock: 0,
    fullMoveNumber: 1,
  };
}

function getPseudoMoves(board, r, c, enPassant) {
  const piece = board[r][c];
  if (!piece) return [];
  const col = piece[0], type = piece[1];
  const moves = [];

  const add = (nr, nc) => {
    if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) moves.push([nr, nc]);
  };

  const slide = (dr, dc) => {
    let nr = r + dr, nc = c + dc;
    while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
      moves.push([nr, nc]);
      if (board[nr][nc]) break;
      nr += dr; nc += dc;
    }
  };

  if (type === 'P') {
    const dir = col === 'w' ? -1 : 1;
    const startRow = col === 'w' ? 6 : 1;
    if (!board[r + dir]?.[c]) {
      add(r + dir, c);
      if (r === startRow && !board[r + 2 * dir]?.[c]) add(r + 2 * dir, c);
    }
    [-1, 1].forEach(dc => {
      const target = board[r + dir]?.[c + dc];
      const isEP = enPassant && enPassant[0] === r + dir && enPassant[1] === c + dc;
      if ((target && target[0] !== col) || isEP) add(r + dir, c + dc);
    });
  }

  if (type === 'N') {
    [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]
      .forEach(([dr,dc]) => add(r + dr, c + dc));
  }

  if (type === 'B' || type === 'Q') {
    [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([dr,dc]) => slide(dr, dc));
  }

  if (type === 'R' || type === 'Q') {
    [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc]) => slide(dr, dc));
  }

  if (type === 'K') {
    [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]
      .forEach(([dr,dc]) => add(r + dr, c + dc));
  }

  return moves.filter(([nr, nc]) => !board[nr]?.[nc] || board[nr][nc][0] !== col);
}

function findKing(board, color) {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (board[r][c] === color + 'K') return [r, c];
  return null;
}

function isSquareAttacked(board, r, c, byColor, enPassant) {
  const opp = byColor;
  for (let fr = 0; fr < 8; fr++) {
    for (let fc = 0; fc < 8; fc++) {
      if (board[fr][fc] && board[fr][fc][0] === opp) {
        const ms = getPseudoMoves(board, fr, fc, enPassant);
        if (ms.some(m => m[0] === r && m[1] === c)) return true;
      }
    }
  }
  return false;
}

function isInCheck(board, color, enPassant) {
  const king = findKing(board, color);
  if (!king) return false;
  const opp = color === 'w' ? 'b' : 'w';
  return isSquareAttacked(board, king[0], king[1], opp, enPassant);
}

function simulateMove(board, fr, fc, tr, tc, enPassant) {
  const nb = board.map(row => [...row]);
  const piece = nb[fr][fc];

  // En passant capture
  if (piece && piece[1] === 'P' && fc !== tc && !nb[tr][tc] && enPassant &&
      enPassant[0] === tr && enPassant[1] === tc) {
    nb[tr === 2 ? 3 : 4][tc] = null;
  }

  // Castling rook move
  if (piece && piece[1] === 'K' && Math.abs(tc - fc) === 2) {
    if (tc === 6) { nb[fr][5] = nb[fr][7]; nb[fr][7] = null; }
    else          { nb[fr][3] = nb[fr][0]; nb[fr][0] = null; }
  }

  nb[tr][tc] = piece;
  nb[fr][fc] = null;
  return nb;
}

function getLegalMoves(state, r, c) {
  const { board, enPassant, castlingRights, turn } = state;
  const piece = board[r][c];
  if (!piece) return [];
  const col = piece[0];

  let moves = getPseudoMoves(board, r, c, enPassant);

  // Filter moves that leave king in check
  moves = moves.filter(([tr, tc]) => {
    const nb = simulateMove(board, r, c, tr, tc, enPassant);
    return !isInCheck(nb, col, null);
  });

  // Castling
  if (piece[1] === 'K') {
    const row = col === 'w' ? 7 : 0;
    const opp = col === 'w' ? 'b' : 'w';
    if (r === row && c === 4 && !isInCheck(board, col, enPassant)) {
      // Kingside
      if (castlingRights[col + 'K'] && !board[row][5] && !board[row][6] &&
          !isSquareAttacked(board, row, 5, opp, enPassant) &&
          !isSquareAttacked(board, row, 6, opp, enPassant)) {
        moves.push([row, 6]);
      }
      // Queenside
      if (castlingRights[col + 'Q'] && !board[row][3] && !board[row][2] && !board[row][1] &&
          !isSquareAttacked(board, row, 3, opp, enPassant) &&
          !isSquareAttacked(board, row, 2, opp, enPassant)) {
        moves.push([row, 2]);
      }
    }
  }

  return moves;
}

function getAllLegalMoves(state, color) {
  const { board } = state;
  const all = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] && board[r][c][0] === color) {
        const ms = getLegalMoves(state, r, c);
        ms.forEach(to => all.push({ from: [r, c], to }));
      }
    }
  }
  return all;
}

function toAlgebraic(state, fr, fc, tr, tc, promotion) {
  const { board } = state;
  const piece = board[fr][fc];
  const files = 'abcdefgh';
  const type = piece[1];
  const capture = board[tr][tc] || (type === 'P' && fc !== tc) ? 'x' : '';

  if (type === 'K' && Math.abs(tc - fc) === 2) {
    return tc === 6 ? 'O-O' : 'O-O-O';
  }

  let prefix = type === 'P' ? (capture ? files[fc] : '') : type;
  let notation = prefix + capture + files[tc] + (8 - tr);
  if (promotion) notation += '=' + promotion;
  return notation;
}

function applyMove(state, fr, fc, tr, tc, promotion = 'Q') {
  const newState = {
    ...state,
    board: state.board.map(row => [...row]),
    castlingRights: { ...state.castlingRights },
    capturedByWhite: [...state.capturedByWhite],
    capturedByBlack: [...state.capturedByBlack],
    moveHistory: [...state.moveHistory],
  };

  const { board, turn } = newState;
  const piece = board[fr][fc];
  const cap = board[tr][tc];
  const type = piece[1];

  let notation = toAlgebraic(state, fr, fc, tr, tc, promotion);

  // Capture
  if (cap) {
    (turn === 'w' ? newState.capturedByWhite : newState.capturedByBlack).push(cap);
  }

  // En passant capture
  newState.enPassant = null;
  if (type === 'P' && fc !== tc && !cap) {
    const epRow = tr === 2 ? 3 : 4;
    const epPawn = board[epRow][tc];
    if (epPawn) {
      (turn === 'w' ? newState.capturedByWhite : newState.capturedByBlack).push(epPawn);
      board[epRow][tc] = null;
    }
  }

  // Set new en passant square
  if (type === 'P' && Math.abs(tr - fr) === 2) {
    newState.enPassant = [(fr + tr) / 2, fc];
  }

  // Update castling rights
  if (piece === 'wK') { newState.castlingRights.wK = false; newState.castlingRights.wQ = false; }
  if (piece === 'bK') { newState.castlingRights.bK = false; newState.castlingRights.bQ = false; }
  if (fr === 7 && fc === 7) newState.castlingRights.wK = false;
  if (fr === 7 && fc === 0) newState.castlingRights.wQ = false;
  if (fr === 0 && fc === 7) newState.castlingRights.bK = false;
  if (fr === 0 && fc === 0) newState.castlingRights.bQ = false;

  // Castling rook
  if (type === 'K' && Math.abs(tc - fc) === 2) {
    if (tc === 6) { board[fr][5] = board[fr][7]; board[fr][7] = null; }
    else          { board[fr][3] = board[fr][0]; board[fr][0] = null; }
  }

  board[tr][tc] = piece;
  board[fr][fc] = null;

  // Promotion
  if (type === 'P' && (tr === 0 || tr === 7)) {
    board[tr][tc] = turn + promotion;
  }

  newState.turn = turn === 'w' ? 'b' : 'w';

  // Check / Checkmate / Stalemate
  const opp = newState.turn;
  const inCheck = isInCheck(board, opp, newState.enPassant);
  const noMoves = getAllLegalMoves(newState, opp).length === 0;

  if (noMoves) {
    newState.gameOver = true;
    if (inCheck) {
      notation += '#';
      newState.gameResult = opp === 'w' ? 'Black wins by Checkmate!' : 'White wins by Checkmate!';
    } else {
      newState.gameResult = 'Draw by Stalemate!';
    }
  } else if (inCheck) {
    notation += '+';
  }

  newState.moveHistory.push({
    from: [fr, fc], to: [tr, tc],
    notation,
    piece,
    captured: cap || null,
    promotion: (type === 'P' && (tr === 0 || tr === 7)) ? promotion : null,
  });

  if (turn === 'b') newState.fullMoveNumber++;

  return newState;
}

// ─── AI (Minimax + Alpha-Beta) ──────────────────────────────────────────────

function evaluateBoard(board) {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      const col = p[0], type = p[1];
      const val = PIECE_VALUES[type] || 0;
      const pst = PIECE_SQUARE_TABLES[type];
      const posBonus = pst ? (col === 'w' ? pst[r][c] : pst[7 - r][c]) : 0;
      score += (col === 'w' ? 1 : -1) * (val + posBonus);
    }
  }
  return score;
}

function applyMoveQuick(state, fr, fc, tr, tc) {
  const board = state.board.map(row => [...row]);
  const piece = board[fr][fc];
  const type = piece ? piece[1] : null;
  let enPassant = null;

  if (type === 'P' && fc !== tc && !board[tr][tc] && state.enPassant &&
      state.enPassant[0] === tr && state.enPassant[1] === tc) {
    board[tr === 2 ? 3 : 4][tc] = null;
  }

  if (type === 'P' && Math.abs(tr - fr) === 2) enPassant = [(fr + tr) / 2, fc];

  const cr = { ...state.castlingRights };
  if (piece === 'wK') { cr.wK = false; cr.wQ = false; }
  if (piece === 'bK') { cr.bK = false; cr.bQ = false; }
  if (fr === 7 && fc === 7) cr.wK = false;
  if (fr === 7 && fc === 0) cr.wQ = false;
  if (fr === 0 && fc === 7) cr.bK = false;
  if (fr === 0 && fc === 0) cr.bQ = false;

  if (type === 'K' && Math.abs(tc - fc) === 2) {
    if (tc === 6) { board[fr][5] = board[fr][7]; board[fr][7] = null; }
    else          { board[fr][3] = board[fr][0]; board[fr][0] = null; }
  }

  board[tr][tc] = piece;
  board[fr][fc] = null;
  if (type === 'P' && (tr === 0 || tr === 7)) board[tr][tc] = piece[0] + 'Q';

  return {
    ...state,
    board,
    turn: state.turn === 'w' ? 'b' : 'w',
    enPassant,
    castlingRights: cr,
    moveHistory: state.moveHistory, // don't clone for perf
    capturedByWhite: state.capturedByWhite,
    capturedByBlack: state.capturedByBlack,
  };
}

function minimax(state, depth, alpha, beta, maximizing) {
  if (depth === 0) return evaluateBoard(state.board);

  const color = maximizing ? 'w' : 'b';
  const moves = getAllLegalMoves(state, color);

  if (moves.length === 0) {
    if (isInCheck(state.board, color, state.enPassant)) {
      return maximizing ? -99999 : 99999;
    }
    return 0;
  }

  if (maximizing) {
    let best = -Infinity;
    for (const { from: [fr, fc], to: [tr, tc] } of moves) {
      const next = applyMoveQuick(state, fr, fc, tr, tc);
      const score = minimax(next, depth - 1, alpha, beta, false);
      best = Math.max(best, score);
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const { from: [fr, fc], to: [tr, tc] } of moves) {
      const next = applyMoveQuick(state, fr, fc, tr, tc);
      const score = minimax(next, depth - 1, alpha, beta, true);
      best = Math.min(best, score);
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

function getBestMove(state, depth = 2) {
  const color = state.turn;
  const moves = getAllLegalMoves(state, color);
  if (moves.length === 0) return null;

  const maximizing = color === 'w';
  let best = null;
  let bestScore = maximizing ? -Infinity : Infinity;

  for (const move of moves) {
    const { from: [fr, fc], to: [tr, tc] } = move;
    const next = applyMoveQuick(state, fr, fc, tr, tc);
    const score = minimax(next, depth - 1, -Infinity, Infinity, !maximizing);
    if (maximizing ? score > bestScore : score < bestScore) {
      bestScore = score;
      best = move;
    }
  }
  return best;
}

module.exports = {
  createInitialState,
  getLegalMoves,
  getAllLegalMoves,
  applyMove,
  isInCheck,
  getBestMove,
};
