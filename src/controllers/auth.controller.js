import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { User } from '../models/user.model.js';
import { generateAuthTokens, verifyToken, TokenType } from '../utils/token.js';

export const register = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;

  if (await User.isEmailTaken(email)) {
    throw ApiError.conflict('Email already in use');
  }

  const user = await User.create({ name, email, password });
  const tokens = generateAuthTokens(user);

  sendSuccess(res, {
    statusCode: 201,
    message: 'Account created',
    data: { user: user.toJSON(), tokens },
  });
});

export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Incorrect email or password');
  }

  const tokens = generateAuthTokens(user);

  sendSuccess(res, {
    message: 'Logged in',
    data: { user: user.toJSON(), tokens },
  });
});

export const refreshTokens = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;

  let decoded;
  try {
    decoded = verifyToken(refreshToken, TokenType.REFRESH);
  } catch (error) {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findById(decoded.sub);
  if (!user) {
    throw ApiError.unauthorized('User no longer exists');
  }

  const tokens = generateAuthTokens(user);
  sendSuccess(res, { message: 'Tokens refreshed', data: { tokens } });
});

export const me = catchAsync(async (req, res) => {
  sendSuccess(res, { message: 'Current user', data: { user: req.user.toJSON() } });
});
