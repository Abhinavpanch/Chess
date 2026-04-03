// server/index.js - Express + Socket.io chess server

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
// const path = require('path');
const { v4: uuidv4 } = require('uuid');
const {
  createInitialState,
  getLegalMoves,
  applyMove,
  isInCheck,
  getBestMove,
} = require('./chess');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Serve built client in production
// if (process.env.NODE_ENV === 'production') {
//   app.use(express.static(path.join(__dirname, '../client/dist')));
//   app.get('*', (req, res) =>
//     res.sendFile(path.join(__dirname, '../client/dist/index.html'))
//   );
// }

// ─── In-memory game store ───────────────────────────────────────────────────
// games: { [gameId]: { state, players: {w, b}, mode, difficulty, timers, timerInterval } }
const games = {};

// ─── REST API ───────────────────────────────────────────────────────────────

// Create a new game (returns gameId)
app.post('/api/games', (req, res) => {
  const { mode = 'pvp', difficulty = 'medium', aiSide = 'b' } = req.body;
  const gameId = uuidv4();
  games[gameId] = {
    state: createInitialState(),
    players: { w: null, b: null },
    mode,
    difficulty,
    aiSide,
    paused: false,
    timers: { w: 600, b: 600 },
    timerInterval: null,
    lastActivity: Date.now(),
  };
  res.json({ gameId });
});

// Get game state
app.get('/api/games/:gameId', (req, res) => {
  const game = games[req.params.gameId];
  if (!game) return res.status(404).json({ error: 'Game not found' });
  res.json(publicState(game));
});

// ─── Socket.io ──────────────────────────────────────────────────────────────

function publicState(game) {
  return {
    state: game.state,
    timers: game.timers,
    mode: game.mode,
    difficulty: game.difficulty,
    paused: game.paused || false,
    aiSide: game.aiSide || 'b',
    players: {
      w: game.players.w ? 'connected' : 'waiting',
      b: game.players.b ? 'connected' : 'waiting',
    },
  };
}

function startTimer(gameId) {
  const game = games[gameId];
  if (!game) return;
  clearInterval(game.timerInterval);
  game.paused = false;
  game.timerInterval = setInterval(() => {
    if (game.state.gameOver || game.paused) return;
    const t = game.state.turn;
    game.timers[t]--;
    io.to(gameId).emit('timerTick', game.timers);
    if (game.timers[t] <= 0) {
      clearInterval(game.timerInterval);
      game.state.gameOver = true;
      game.state.gameResult = t === 'w' ? 'Black wins on time!' : 'White wins on time!';
      io.to(gameId).emit('gameState', publicState(game));
    }
  }, 1000);
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join a game room
  socket.on('joinGame', ({ gameId, preferColor }) => {
    const game = games[gameId];
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    socket.join(gameId);
    socket.gameId = gameId;

    // Assign color
    if (!game.players.w && preferColor === 'w') {
      game.players.w = socket.id;
      socket.playerColor = 'w';
    } else if (!game.players.b && preferColor === 'b') {
      game.players.b = socket.id;
      socket.playerColor = 'b';
    } else if (!game.players.w) {
      game.players.w = socket.id;
      socket.playerColor = 'w';
    } else if (!game.players.b) {
      game.players.b = socket.id;
      socket.playerColor = 'b';
    } else {
      socket.playerColor = 'spectator';
    }

    socket.emit('playerColor', socket.playerColor);
    io.to(gameId).emit('gameState', publicState(game));

    // Start timer once both players joined (or in AI/solo mode)
    if (game.mode === 'ai' || game.mode === 'local' ||
        (game.players.w && game.players.b)) {
      startTimer(gameId);
    }

    console.log(`Socket ${socket.id} joined game ${gameId} as ${socket.playerColor}`);
  });

  // Make a move
  socket.on('makeMove', ({ gameId, from, to, promotion }) => {
    const game = games[gameId];
    if (!game || game.state.gameOver) return;

    const [fr, fc] = from;
    const [tr, tc] = to;
    const { state } = game;

    // Validate it's this player's turn (for online mode)
    if (game.mode === 'online') {
      const expected = state.turn === 'w' ? game.players.w : game.players.b;
      if (socket.id !== expected) return;
    }

    // Validate move is legal
    const legal = getLegalMoves(state, fr, fc);
    const isLegal = legal.some(m => m[0] === tr && m[1] === tc);
    if (!isLegal) {
      socket.emit('illegalMove', { from, to });
      return;
    }

    // Apply the move
    game.state = applyMove(state, fr, fc, tr, tc, promotion || 'Q');
    game.lastActivity = Date.now();

    io.to(gameId).emit('gameState', publicState(game));

    // AI response — plays whichever side is configured as aiSide
    const aiSide = game.aiSide || 'b';
    if (game.mode === 'ai' && !game.state.gameOver && game.state.turn === aiSide) {
      const depthMap = { easy: 1, medium: 2, hard: 3 };
      const depth = depthMap[game.difficulty] || 2;

      setTimeout(() => {
        if (game.paused) return;
        const aiMove = getBestMove(game.state, depth);
        if (aiMove) {
          game.state = applyMove(
            game.state,
            aiMove.from[0], aiMove.from[1],
            aiMove.to[0], aiMove.to[1],
            'Q'
          );
          io.to(gameId).emit('gameState', publicState(game));
        }
      }, 400);
    }
  });

  // Request legal moves for a square
  socket.on('getLegalMoves', ({ gameId, row, col }) => {
    const game = games[gameId];
    if (!game) return;
    const moves = getLegalMoves(game.state, row, col);
    socket.emit('legalMoves', { row, col, moves });
  });

  // Reset / new game
  socket.on('newGame', ({ gameId, mode, difficulty, aiSide }) => {
    const game = games[gameId];
    if (!game) return;
    clearInterval(game.timerInterval);
    game.state = createInitialState();
    game.timers = { w: 600, b: 600 };
    game.paused = false;
    if (mode) game.mode = mode;
    if (difficulty) game.difficulty = difficulty;
    if (aiSide) game.aiSide = aiSide;
    startTimer(gameId);
    io.to(gameId).emit('gameState', publicState(game));

    // If AI plays white, make the first move immediately
    if (game.mode === 'ai' && game.aiSide === 'w') {
      const depthMap = { easy: 1, medium: 2, hard: 3 };
      const depth = depthMap[game.difficulty] || 2;
      setTimeout(() => {
        const aiMove = getBestMove(game.state, depth);
        if (aiMove) {
          game.state = applyMove(game.state, aiMove.from[0], aiMove.from[1], aiMove.to[0], aiMove.to[1], 'Q');
          io.to(gameId).emit('gameState', publicState(game));
        }
      }, 600);
    }
  });

  // Pause / Resume timer
  socket.on('pauseGame', ({ gameId }) => {
    const game = games[gameId];
    if (!game || game.state.gameOver) return;
    game.paused = true;
    io.to(gameId).emit('gamePaused', { paused: true });
  });

  socket.on('resumeGame', ({ gameId }) => {
    const game = games[gameId];
    if (!game || game.state.gameOver) return;
    game.paused = false;
    io.to(gameId).emit('gamePaused', { paused: false });
  });

  // Undo
  socket.on('undoMove', ({ gameId }) => {
    // Undo is only allowed in local/AI modes
    const game = games[gameId];
    if (!game || game.mode === 'online') return;
    const history = game.state.moveHistory;
    if (history.length === 0) return;
    // Re-create state by replaying all moves minus the last (or last 2 for AI)
    const stepsBack = game.mode === 'ai' ? 2 : 1;
    const movesToReplay = history.slice(0, Math.max(0, history.length - stepsBack));
    let newState = createInitialState();
    for (const mv of movesToReplay) {
      newState = applyMove(newState, mv.from[0], mv.from[1], mv.to[0], mv.to[1], mv.promotion || 'Q');
    }
    game.state = newState;
    io.to(gameId).emit('gameState', publicState(game));
  });

  socket.on('disconnect', () => {
    const { gameId, playerColor } = socket;
    if (gameId && games[gameId]) {
      const game = games[gameId];
      if (playerColor && game.players[playerColor] === socket.id) {
        game.players[playerColor] = null;
      }
      io.to(gameId).emit('playerDisconnected', { color: playerColor });
    }
    console.log('Client disconnected:', socket.id);
  });
});

// ─── Cleanup stale games every 30 min ───────────────────────────────────────
setInterval(() => {
  const threshold = 30 * 60 * 1000;
  Object.keys(games).forEach(id => {
    if (Date.now() - games[id].lastActivity > threshold) {
      clearInterval(games[id].timerInterval);
      delete games[id];
      console.log(`Cleaned up stale game: ${id}`);
    }
  });
}, 5 * 60 * 1000);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Chess server running on http://localhost:${PORT}`);
});