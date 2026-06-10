import Joi from 'joi';

export const createConversationSchema = Joi.object({
  participantId: Joi.string().hex().length(24).required(),
});

export const sendMessageSchema = Joi.object({
  text: Joi.string().trim().min(1).max(4000).required(),
});
