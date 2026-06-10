import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { socketAuth } from './socket.auth.js';
import { registerChatHandlers, SocketEvents } from './chat.handlers.js';
import { conversationRoom } from './rooms.js';
import { logger } from '../utils/logger.js';

let io = null;

const corsOrigin = env.corsOrigin === '*' ? '*' : env.corsOrigin.split(',');

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: corsOrigin, credentials: true },
  });

  io.use(socketAuth);

  io.on('connection', (socket) => {
    logger.info(`Socket connected: user=${socket.user.id} id=${socket.id}`);
    registerChatHandlers(io, socket);
    socket.on('disconnect', (reason) =>
      logger.info(`Socket disconnected: user=${socket.user.id} reason=${reason}`),
    );
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.IO has not been initialized');
  return io;
};

/* Allows the REST layer to push a message to connected sockets, keeping the
   socket and HTTP transports in sync. */
export const emitNewMessage = (conversationId, message) => {
  if (!io) return;
  io.to(conversationRoom(conversationId)).emit(SocketEvents.MESSAGE_NEW, message);
};
