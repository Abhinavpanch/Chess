// utils/chess.js - Client-side chess helpers
import React from 'react';

// Unicode kept only for captured pieces sidebar display
export const PIECE_UNICODE = {
  wP: '♙', wR: '♖', wN: '♘', wB: '♗', wQ: '♕', wK: '♔',
  bP: '♟', bR: '♜', bN: '♞', bB: '♝', bQ: '♛', bK: '♚',
};

// Detailed Staunton-style SVG paths (100x100 viewBox)
const SVG_PATHS = {
  P: `
    <ellipse cx="50" cy="86" rx="26" ry="7"/>
    <rect x="34" y="80" width="32" height="8" rx="4"/>
    <ellipse cx="50" cy="78" rx="18" ry="5"/>
    <path d="M38,77 Q36,68 38,62 Q40,56 50,52 Q60,56 62,62 Q64,68 62,77 Z"/>
    <circle cx="50" cy="44" r="15"/>
    <ellipse cx="50" cy="44" rx="9" ry="9" fill-opacity="0.12"/>
  `,
  N: `
    <ellipse cx="50" cy="86" rx="27" ry="7"/>
    <rect x="30" y="80" width="40" height="8" rx="4"/>
    <ellipse cx="50" cy="78" rx="20" ry="5.5"/>
    <path d="M 30,78 C 28,66 26,56 28,48 C 30,38 36,30 42,26
      C 40,30 39,35 41,38 C 35,42 33,50 36,56
      C 32,58 30,64 34,68 C 40,62 48,60 55,56
      C 63,50 68,42 65,33 C 70,37 72,46 68,56
      C 74,60 76,70 72,78 Z"/>
    <circle cx="42" cy="31" r="4"/>
    <ellipse cx="44" cy="38" rx="5" ry="3" fill-opacity="0.25" transform="rotate(-20 44 38)"/>
    <path d="M54,28 C58,24 64,24 66,30 C62,28 58,30 54,28Z" fill-opacity="0.4"/>
  `,
  B: `
    <ellipse cx="50" cy="86" rx="27" ry="7"/>
    <rect x="30" y="80" width="40" height="8" rx="4"/>
    <ellipse cx="50" cy="78" rx="18" ry="5"/>
    <path d="M34,78 C32,66 36,54 42,46 C38,42 36,35 38,28
             C40,20 50,16 60,20 C66,24 67,32 63,40
             C68,48 70,63 68,78 Z"/>
    <circle cx="50" cy="24" r="11"/>
    <circle cx="50" cy="24" r="6" fill-opacity="0.18"/>
    <ellipse cx="50" cy="15" rx="4" ry="6"/>
    <circle cx="50" cy="10" r="4"/>
    <ellipse cx="44" cy="40" rx="4" ry="6" fill-opacity="0.2" transform="rotate(-30 44 40)"/>
  `,
  R: `
    <ellipse cx="50" cy="86" rx="27" ry="7"/>
    <rect x="28" y="80" width="44" height="8" rx="4"/>
    <ellipse cx="50" cy="78" rx="20" ry="5.5"/>
    <rect x="32" y="40" width="36" height="40" rx="3"/>
    <ellipse cx="50" cy="40" rx="18" ry="5"/>
    <rect x="26" y="22" width="48" height="20" rx="3"/>
    <rect x="26" y="22" width="12" height="20" rx="2"/>
    <rect x="44" y="22" width="12" height="20" rx="2"/>
    <rect x="62" y="22" width="12" height="20" rx="2"/>
    <rect x="38" y="22" width="6" height="20" fill-opacity="0.15"/>
    <rect x="56" y="22" width="6" height="20" fill-opacity="0.15"/>
    <ellipse cx="50" cy="60" rx="14" ry="4" fill-opacity="0.1"/>
  `,
  Q: `
    <ellipse cx="50" cy="86" rx="28" ry="7"/>
    <rect x="28" y="80" width="44" height="8" rx="4"/>
    <ellipse cx="50" cy="78" rx="20" ry="5.5"/>
    <path d="M 20,78 C 18,64 22,52 28,44
             C 22,40 18,32 22,24 C 25,17 34,14 50,14
             C 66,14 75,17 78,24 C 82,32 78,40 72,44
             C 78,52 82,64 80,78 Z"/>
    <circle cx="50" cy="13" r="9.5"/>
    <circle cx="26" cy="23" r="7.5"/>
    <circle cx="74" cy="23" r="7.5"/>
    <circle cx="16" cy="44" r="7.5"/>
    <circle cx="84" cy="44" r="7.5"/>
    <ellipse cx="50" cy="58" rx="20" ry="6" fill-opacity="0.1"/>
    <ellipse cx="50" cy="13" rx="5" ry="5" fill-opacity="0.2"/>
  `,
  K: `
    <ellipse cx="50" cy="86" rx="28" ry="7"/>
    <rect x="28" y="80" width="44" height="8" rx="4"/>
    <ellipse cx="50" cy="78" rx="20" ry="5.5"/>
    <path d="M 20,78 C 18,64 22,52 28,44
             C 22,40 20,32 24,24 C 28,16 38,12 50,12
             C 62,12 72,16 76,24 C 80,32 78,40 72,44
             C 78,52 82,64 80,78 Z"/>
    <rect x="46" y="2" width="8" height="26" rx="4"/>
    <rect x="37" y="9" width="26" height="8" rx="4"/>
    <ellipse cx="50" cy="58" rx="20" ry="6" fill-opacity="0.1"/>
    <ellipse cx="50" cy="26" rx="14" ry="8" fill-opacity="0.15"/>
  `,
};

// Professional 3D piece renderer with dual gradients and shadow
export function PieceSVG({ piece }) {
  if (!piece) return null;
  const isWhite = piece[0] === 'w';
  const type = piece[1];
  const id = `pg-${piece}`;

  const stroke = isWhite ? '#1a1208' : '#c8b890';
  const strokeW = 2.2;

  // Main radial gradient colours
  const [g0, g1, g2] = isWhite
    ? ['#ffffff', '#e8d8b8', '#b89860']
    : ['#686868', '#2a2a2a', '#080808'];

  // Shadow overlay colours
  const [s0, s1] = isWhite
    ? ['rgba(0,0,0,0)', 'rgba(0,0,0,0.22)']
    : ['rgba(0,0,0,0)', 'rgba(0,0,0,0.60)'];

  return React.createElement('svg', {
    viewBox: '0 0 100 100',
    style: {
      width: '90%', height: '90%',
      display: 'block',
      pointerEvents: 'none',
      overflow: 'visible',
      filter: isWhite
        ? 'drop-shadow(1px 3px 6px rgba(0,0,0,0.6))'
        : 'drop-shadow(1px 3px 6px rgba(0,0,0,0.9))',
    },
  },
    React.createElement('defs', null,
      React.createElement('radialGradient', { id, cx: '33%', cy: '22%', r: '72%', fx: '28%', fy: '18%' },
        React.createElement('stop', { offset: '0%',   stopColor: g0 }),
        React.createElement('stop', { offset: '50%',  stopColor: g1 }),
        React.createElement('stop', { offset: '100%', stopColor: g2 }),
      ),
      React.createElement('linearGradient', { id: id+'s', x1:'0%', y1:'0%', x2:'100%', y2:'100%' },
        React.createElement('stop', { offset: '0%',   stopColor: s0 }),
        React.createElement('stop', { offset: '100%', stopColor: s1 }),
      ),
    ),
    React.createElement('g', {
      fill: `url(#${id})`, stroke, strokeWidth: strokeW,
      strokeLinejoin: 'round', strokeLinecap: 'round',
      dangerouslySetInnerHTML: { __html: SVG_PATHS[type] || '' },
    }),
    React.createElement('g', {
      fill: `url(#${id}s)`, stroke: 'none',
      dangerouslySetInnerHTML: { __html: SVG_PATHS[type] || '' },
    }),
    React.createElement('ellipse', {
      cx: 37, cy: 30, rx: 12, ry: 6,
      fill: 'white', fillOpacity: isWhite ? 0.5 : 0.15,
      stroke: 'none', transform: 'rotate(-35 37 30)',
    }),
  );
}

export const PIECE_NAMES = {
  P: 'Pawn', N: 'Knight', B: 'Bishop', R: 'Rook', Q: 'Queen', K: 'King',
};

export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
export const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

export function squareToNotation(row, col) {
  return FILES[col] + RANKS[row];
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function getMaterialScore(captured) {
  const values = { P: 1, N: 3, B: 3, R: 5, Q: 9 };
  return captured.reduce((sum, p) => sum + (values[p[1]] || 0), 0);
}

export function getCapturedDisplay(pieces) {
  const counts = {};
  pieces.forEach(p => { counts[p] = (counts[p] || 0) + 1; });
  return Object.entries(counts).map(([piece, count]) => ({
    unicode: PIECE_UNICODE[piece], count,
  }));
}

export function isLightSquare(row, col) {
  return (row + col) % 2 === 0;
}

export function getSquareColor(row, col, isSelected, isLastMove, isLegalMove, hasCapture, isCheck) {
  if (isCheck) return 'sq-check';
  if (isSelected) return 'sq-selected';
  if (isLastMove) return 'sq-last';
  if (hasCapture) return 'sq-capture';
  return isLightSquare(row, col) ? 'sq-light' : 'sq-dark';
}