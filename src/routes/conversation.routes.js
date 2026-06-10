import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createConversationSchema,
  sendMessageSchema,
} from '../validations/message.validation.js';
import {
  createConversation,
  listConversations,
  getConversation,
} from '../controllers/conversation.controller.js';
import { getMessages, postMessage } from '../controllers/message.controller.js';

const router = Router();

router.use(authenticate);

router.route('/')
  .get(listConversations)
  .post(validate(createConversationSchema), createConversation);

router.get('/:id', getConversation);

router.route('/:id/messages')
  .get(getMessages)
  .post(validate(sendMessageSchema), postMessage);

export default router;
