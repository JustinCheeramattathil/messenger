import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import {
  findOrCreateOneToOne,
  listConversationsForUser,
  getConversationForUser,
} from '../services/conversation.service.js';

export const createConversation = catchAsync(async (req, res) => {
  const conversation = await findOrCreateOneToOne(req.user.id, req.body.participantId);
  sendSuccess(res, {
    statusCode: 201,
    message: 'Conversation ready',
    data: { conversation },
  });
});

export const listConversations = catchAsync(async (req, res) => {
  const conversations = await listConversationsForUser(req.user.id);
  sendSuccess(res, { message: 'Conversations', data: { conversations } });
});

export const getConversation = catchAsync(async (req, res) => {
  const conversation = await getConversationForUser(req.params.id, req.user.id);
  sendSuccess(res, { message: 'Conversation', data: { conversation } });
});
