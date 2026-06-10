import mongoose from 'mongoose';
import { Message } from '../models/message.model.js';
import { Conversation } from '../models/conversation.model.js';
import { ApiError } from '../utils/apiError.js';

const assertMembership = (conversation, userId) => {
  const isMember = conversation.participants.some((p) => p.toString() === userId.toString());
  if (!isMember) {
    throw ApiError.forbidden('You are not a member of this conversation');
  }
};

/* Persists a message and keeps the conversation's denormalized snapshot in
   sync. Used by both the REST controller and the socket handler so the write
   path is identical regardless of transport. */
export const createMessage = async ({ conversationId, senderId, text }) => {
  if (!mongoose.isValidObjectId(conversationId)) {
    throw ApiError.badRequest('Invalid conversation id');
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw ApiError.notFound('Conversation not found');
  }
  assertMembership(conversation, senderId);

  const message = await Message.create({
    conversation: conversationId,
    sender: senderId,
    text,
    readBy: [senderId],
  });

  conversation.lastMessage = message.id;
  conversation.lastMessageAt = message.createdAt;
  await conversation.save();

  return message.populate('sender', 'name avatarUrl');
};

export const listMessages = async ({ conversationId, userId, before, limit = 30 }) => {
  if (!mongoose.isValidObjectId(conversationId)) {
    throw ApiError.badRequest('Invalid conversation id');
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw ApiError.notFound('Conversation not found');
  }
  assertMembership(conversation, userId);

  const filter = { conversation: conversationId };
  if (before) {
    filter.createdAt = { $lt: new Date(before) };
  }

  const messages = await Message.find(filter)
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit) || 30, 100))
    .populate('sender', 'name avatarUrl');

  // Return in chronological order for easy rendering on the client.
  return messages.reverse();
};

export const markConversationRead = async ({ conversationId, userId }) => {
  await Message.updateMany(
    { conversation: conversationId, readBy: { $ne: userId } },
    { $addToSet: { readBy: userId } },
  );
};
