// utils/chess.js - Client-side chess helpers
import React from 'react';

// Unicode kept only for captured pieces sidebar display
export const PIECE_UNICODE = {
  wP: '♙', wR: '♖', wN: '♘', wB: '♗', wQ: '♕', wK: '♔',
  bP: '♟', bR: '♜', bN: '♞', bB: '♝', bQ: '♛', bK: '♚',
};

// High-quality chess piece SVG paths (Staunton-inspired, 100x100 viewBox)
const SVG_PATHS = {
  P: `
    <ellipse cx="50" cy="85" rx="24" ry="6.5"/>
    <rect x="36" y="79" width="28" height="7" rx="3.5"/>
    <ellipse cx="50" cy="77" rx="14" ry="4"/>
    <rect x="40" y="60" width="20" height="18" rx="5"/>
    <ellipse cx="50" cy="59" rx="10" ry="4.5"/>
    <circle cx="50" cy="48" r="13"/>
    <circle cx="50" cy="48" r="8" fill-opacity="0.15"/>
  `,

  N: `
    <ellipse cx="50" cy="85" rx="26" ry="6.5"/>
    <rect x="30" y="79" width="40" height="8" rx="4"/>
    <path d="M 34,79 C 32,65 28,54 30,44 C 32,34 40,24 50,20
             C 46,26 44,32 46,36 C 38,38 36,46 40,52
             C 36,54 34,60 38,64 C 44,58 52,56 58,52
             C 66,48 70,40 68,32 C 72,36 74,44 70,54
             C 78,58 78,70 74,78 L 34,79 Z"/>
    <circle cx="43" cy="30" r="3.5"/>
    <path d="M 46,36 C 44,32 46,26 50,20 C 54,24 56,30 54,36 Z" fill-opacity="0.3"/>
  `,

  B: `
    <ellipse cx="50" cy="85" rx="26" ry="6.5"/>
    <rect x="30" y="79" width="40" height="8" rx="4"/>
    <ellipse cx="50" cy="77" rx="16" ry="4.5"/>
    <path d="M 36,77 C 34,65 38,54 44,46 C 40,42 38,36 40,30
             C 42,22 50,18 58,22 C 64,26 64,34 60,40
             C 66,48 68,62 66,77 Z"/>
    <circle cx="50" cy="28" r="10"/>
    <circle cx="50" cy="28" r="5" fill-opacity="0.2"/>
    <ellipse cx="50" cy="20" rx="4" ry="5"/>
    <circle cx="50" cy="15" r="3.5"/>
  `,

  R: `
    <ellipse cx="50" cy="85" rx="26" ry="6.5"/>
    <rect x="28" y="79" width="44" height="8" rx="4"/>
    <rect x="32" y="38" width="36" height="42" rx="3"/>
    <ellipse cx="50" cy="38" rx="18" ry="5"/>
    <rect x="26" y="20" width="48" height="20" rx="3"/>
    <rect x="26" y="20" width="12" height="20" rx="3"/>
    <rect x="44" y="20" width="12" height="20" rx="3"/>
    <rect x="62" y="20" width="12" height="20" rx="3"/>
    <rect x="38" y="20" width="6" height="20"/>
    <rect x="56" y="20" width="6" height="20"/>
  `,

  Q: `
    <ellipse cx="50" cy="85" rx="28" ry="6.5"/>
    <rect x="28" y="79" width="44" height="8" rx="4"/>
    <path d="M 22,79 C 20,66 22,56 28,48 C 22,44 18,36 22,28
             C 24,22 32,18 50,18 C 68,18 76,22 78,28
             C 82,36 78,44 72,48 C 78,56 80,66 78,79 Z"/>
    <circle cx="50" cy="18" r="9"/>
    <circle cx="28" cy="26" r="7"/>
    <circle cx="72" cy="26" r="7"/>
    <circle cx="18" cy="44" r="7"/>
    <circle cx="82" cy="44" r="7"/>
    <ellipse cx="50" cy="18" rx="5" ry="5" fill-opacity="0.25"/>
    <ellipse cx="50" cy="60" rx="18" ry="8" fill-opacity="0.1"/>
  `,

  K: `
    <ellipse cx="50" cy="85" rx="28" ry="6.5"/>
    <rect x="28" y="79" width="44" height="8" rx="4"/>
    <path d="M 22,79 C 20,66 24,54 30,46 C 24,42 22,34 26,26
             C 30,18 40,14 50,14 C 60,14 70,18 74,26
             C 78,34 76,42 70,46 C 76,54 80,66 78,79 Z"/>
    <rect x="46" y="4" width="8" height="24" rx="4"/>
    <rect x="38" y="10" width="24" height="8" rx="4"/>
    <ellipse cx="50" cy="60" rx="18" ry="8" fill-opacity="0.12"/>
    <ellipse cx="50" cy="26" rx="12" ry="7" fill-opacity="0.18"/>
  `,
};

// React SVG component — Staunton-style with gradients & inner highlights
export function PieceSVG({ piece }) {
  if (!piece) return null;
  const isWhite = piece[0] === 'w';
  const type = piece[1];
  const id = `grad-${piece}-${Math.random().toString(36).slice(2,6)}`;

  const fill         = isWhite ? `url(#${id})` : `url(#${id})`;
  const stroke       = isWhite ? '#2c1f0e' : '#e8dcc8';
  const strokeW      = 2.2;
  const gradStart    = isWhite ? '#ffffff' : '#4a4a4a';
  const gradMid      = isWhite ? '#e8dcc8' : '#282828';
  const gradEnd      = isWhite ? '#c8b896' : '#111111';
  const shineOpacity = isWhite ? 0.6 : 0.25;

  return React.createElement('svg', {
    viewBox: '0 0 100 100',
    style: {
      width: '84%',
      height: '84%',
      display: 'block',
      pointerEvents: 'none',
      overflow: 'visible',
      filter: isWhite
        ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
        : 'drop-shadow(0 2px 4px rgba(0,0,0,0.7))',
    },
  },
    // Defs: radial gradient + shine
    React.createElement('defs', null,
      React.createElement('radialGradient', {
        id,
        cx: '38%', cy: '30%',
        r: '65%',
        fx: '35%', fy: '25%',
      },
        React.createElement('stop', { offset: '0%',   stopColor: gradStart }),
        React.createElement('stop', { offset: '50%',  stopColor: gradMid   }),
        React.createElement('stop', { offset: '100%', stopColor: gradEnd   }),
      )
    ),
    // Main piece shape
    React.createElement('g', {
      fill,
      stroke,
      strokeWidth: strokeW,
      strokeLinejoin: 'round',
      strokeLinecap:  'round',
      dangerouslySetInnerHTML: { __html: SVG_PATHS[type] || '' },
    }),
    // Shine highlight ellipse (top-left)
    React.createElement('ellipse', {
      cx: 40, cy: 34,
      rx: 10, ry: 6,
      fill: 'white',
      fillOpacity: shineOpacity,
      stroke: 'none',
      transform: 'rotate(-30 40 34)',
      style: { pointerEvents: 'none' },
    })
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
  pieces.forEach(p => {
    counts[p] = (counts[p] || 0) + 1;
  });
  return Object.entries(counts).map(([piece, count]) => ({
    unicode: PIECE_UNICODE[piece],
    count,
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