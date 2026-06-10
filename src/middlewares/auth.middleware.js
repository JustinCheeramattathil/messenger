import { catchAsync } from '../utils/catchAsync.js';
import { ApiError } from '../utils/apiError.js';
import { verifyToken, TokenType } from '../utils/token.js';
import { User } from '../models/user.model.js';

export const authenticate = catchAsync(async (req, _res, next) => {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw ApiError.unauthorized('Authentication token is required');
  }

  let decoded;
  try {
    decoded = verifyToken(token, TokenType.ACCESS);
  } catch (error) {
    throw ApiError.unauthorized('Invalid or expired token');
  }

  const user = await User.findById(decoded.sub);
  if (!user) {
    throw ApiError.unauthorized('User no longer exists');
  }

  req.user = user;
  return next();
});
