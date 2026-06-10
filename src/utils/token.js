import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const TokenType = {
  ACCESS: 'access',
  REFRESH: 'refresh',
};

const sign = (payload, secret, expiresIn) =>
  jwt.sign(payload, secret, { expiresIn });

export const generateAuthTokens = (user) => {
  const payload = { sub: user.id, type: TokenType.ACCESS };
  const accessToken = sign(payload, env.jwt.accessSecret, env.jwt.accessExpiresIn);
  const refreshToken = sign(
    { sub: user.id, type: TokenType.REFRESH },
    env.jwt.refreshSecret,
    env.jwt.refreshExpiresIn,
  );

  return {
    accessToken,
    refreshToken,
  };
};

export const verifyToken = (token, type) => {
  const secret =
    type === TokenType.REFRESH ? env.jwt.refreshSecret : env.jwt.accessSecret;
  const decoded = jwt.verify(token, secret);
  if (decoded.type !== type) {
    throw new Error('Invalid token type');
  }
  return decoded;
};
