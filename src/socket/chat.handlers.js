import { Conversation } from '../models/conversation.model.js';
import { User } from '../models/user.model.js';
import { createMessage, markConversationRead } from '../services/message.service.js';
import { conversationRoom } from './rooms.js';
import { logger } from '../utils/logger.js';

export const SocketEvents = {
  JOIN: 'conversation:join',
  LEAVE: 'conversation:leave',
  MESSAGE_SEND: 'message:send',
  MESSAGE_NEW: 'message:new',
  MESSAGE_READ: 'message:read',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  TYPING: 'typing',
  PRESENCE: 'presence:update',
};

export const registerChatHandlers = (io, socket) => {
  const user = socket.user;

  const userConversationIds = async () => {
    const conversations = await Conversation.find({ participants: user.id }).select('_id');
    return conversations.map((c) => c.id);
  };

  // Join a room per conversation so messages reach the user even before they
  // open a specific thread.
  const joinConversations = async () => {
    const ids = await userConversationIds();
    ids.forEach((id) => socket.join(conversationRoom(id)));
  };

  const broadcastPresence = async (isOnline) => {
    const lastSeen = new Date();
    await User.findByIdAndUpdate(user.id, { isOnline, lastSeen });
    const ids = await userConversationIds();
    ids.forEach((id) =>
      socket.to(conversationRoom(id)).emit(SocketEvents.PRESENCE, {
        userId: user.id,
        isOnline,
        lastSeen,
      }),
    );
  };

  joinConversations().catch((e) => logger.error(`joinConversations: ${e.message}`));
  broadcastPresence(true).catch((e) => logger.error(`presence: ${e.message}`));

  socket.on(SocketEvents.JOIN, ({ conversationId } = {}) => {
    if (conversationId) socket.join(conversationRoom(conversationId));
  });

  socket.on(SocketEvents.LEAVE, ({ conversationId } = {}) => {
    if (conversationId) socket.leave(conversationRoom(conversationId));
  });

  socket.on(SocketEvents.MESSAGE_SEND, async (payload = {}, ack) => {
    try {
      const { conversationId, text } = payload;
      const message = await createMessage({ conversationId, senderId: user.id, text });
      io.to(conversationRoom(conversationId)).emit(SocketEvents.MESSAGE_NEW, message);
      if (typeof ack === 'function') ack({ status: 'ok', message });
    } catch (error) {
      logger.error(`message:send failed: ${error.message}`);
      if (typeof ack === 'function') ack({ status: 'error', message: error.message });
    }
  });

  socket.on(SocketEvents.TYPING_START, ({ conversationId } = {}) => {
    if (!conversationId) return;
    socket.to(conversationRoom(conversationId)).emit(SocketEvents.TYPING, {
      conversationId,
      userId: user.id,
      isTyping: true,
    });
  });

  socket.on(SocketEvents.TYPING_STOP, ({ conversationId } = {}) => {
    if (!conversationId) return;
    socket.to(conversationRoom(conversationId)).emit(SocketEvents.TYPING, {
      conversationId,
      userId: user.id,
      isTyping: false,
    });
  });

  socket.on(SocketEvents.MESSAGE_READ, async ({ conversationId } = {}) => {
    if (!conversationId) return;
    try {
      await markConversationRead({ conversationId, userId: user.id });
      socket.to(conversationRoom(conversationId)).emit(SocketEvents.MESSAGE_READ, {
        conversationId,
        userId: user.id,
      });
    } catch (error) {
      logger.error(`message:read failed: ${error.message}`);
    }
  });

  socket.on('disconnect', () => {
    broadcastPresence(false).catch((e) => logger.error(`presence: ${e.message}`));
  });
};
