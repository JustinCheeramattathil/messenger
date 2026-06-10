import { verifyToken, TokenType } from '../utils/token.js';
import { User } from '../models/user.model.js';

/* Socket.IO handshake authentication. The client passes the access token via
   `auth: { token }`; we resolve it to a user and attach it to the socket. */
export const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication token is required'));
    }

    const decoded = verifyToken(token, TokenType.ACCESS);
    const user = await User.findById(decoded.sub);
    if (!user) {
      return next(new Error('User no longer exists'));
    }

    socket.user = user;
    return next();
  } catch (error) {
    return next(new Error('Invalid or expired token'));
  }
};
