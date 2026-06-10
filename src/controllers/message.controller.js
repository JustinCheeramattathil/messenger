import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { createMessage, listMessages } from '../services/message.service.js';
import { emitNewMessage } from '../socket/index.js';

export const getMessages = catchAsync(async (req, res) => {
  const { before, limit } = req.query;
  const messages = await listMessages({
    conversationId: req.params.id,
    userId: req.user.id,
    before,
    limit,
  });
  sendSuccess(res, { message: 'Messages', data: { messages } });
});

export const postMessage = catchAsync(async (req, res) => {
  const message = await createMessage({
    conversationId: req.params.id,
    senderId: req.user.id,
    text: req.body.text,
  });

  // Mirror the message to any connected sockets in the conversation room.
  emitNewMessage(req.params.id, message);

  sendSuccess(res, {
    statusCode: 201,
    message: 'Message sent',
    data: { message },
  });
});
