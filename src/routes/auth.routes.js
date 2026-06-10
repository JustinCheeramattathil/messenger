import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { registerSchema, loginSchema, refreshSchema } from '../validations/auth.validation.js';
import { register, login, refreshTokens, me } from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh-tokens', validate(refreshSchema), refreshTokens);
router.get('/me', authenticate, me);

export default router;
