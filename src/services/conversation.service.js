import mongoose from 'mongoose';
import { Conversation } from '../models/conversation.model.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/apiError.js';

const populateConversation = (query) =>
  query
    .populate('participants', 'name email avatarUrl isOnline lastSeen')
    .populate({
      path: 'lastMessage',
      populate: { path: 'sender', select: 'name avatarUrl' },
    });

/* Returns the existing 1:1 conversation between the two users, creating it on
   first contact so the client never has to special-case an empty thread. */
export const findOrCreateOneToOne = async (userId, participantId) => {
  if (userId === participantId) {
    throw ApiError.badRequest('You cannot start a conversation with yourself');
  }

  const participant = await User.findById(participantId);
  if (!participant) {
    throw ApiError.notFound('Participant not found');
  }

  let conversation = await Conversation.findOne({
    participants: { $all: [userId, participantId], $size: 2 },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [userId, participantId],
    });
  }

  return populateConversation(Conversation.findById(conversation.id));
};

export const listConversationsForUser = (userId) =>
  populateConversation(
    Conversation.find({ participants: userId }).sort({ lastMessageAt: -1, updatedAt: -1 }),
  );

export const getConversationForUser = async (conversationId, userId) => {
  if (!mongoose.isValidObjectId(conversationId)) {
    throw ApiError.badRequest('Invalid conversation id');
  }

  const conversation = await populateConversation(Conversation.findById(conversationId));
  if (!conversation) {
    throw ApiError.notFound('Conversation not found');
  }

  const isMember = conversation.participants.some((p) => p.id === userId);
  if (!isMember) {
    throw ApiError.forbidden('You are not a member of this conversation');
  }

  return conversation;
};
