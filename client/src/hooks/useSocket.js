// hooks/useSocket.js
import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
export function useSocket(gameId, handlers) {
  const socketRef = useRef(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!gameId) return;

    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to server:', socket.id);
      handlersRef.current.onConnect?.();
    });

    socket.on('gameState', (data) => handlersRef.current.onGameState?.(data));
    socket.on('playerColor', (color) => handlersRef.current.onPlayerColor?.(color));
    socket.on('legalMoves', (data) => handlersRef.current.onLegalMoves?.(data));
    socket.on('timerTick', (timers) => handlersRef.current.onTimerTick?.(timers));
    socket.on('gamePaused', (data) => handlersRef.current.onGamePaused?.(data));
    socket.on('illegalMove', (data) => handlersRef.current.onIllegalMove?.(data));
    socket.on('playerDisconnected', (data) => handlersRef.current.onPlayerDisconnected?.(data));
    socket.on('error', (err) => handlersRef.current.onError?.(err));
    socket.on('disconnect', () => handlersRef.current.onDisconnect?.());

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [gameId]);

  const emit = useCallback((event, data) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { emit, socket: socketRef };
}