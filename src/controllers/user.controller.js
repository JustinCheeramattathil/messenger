import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { User } from '../models/user.model.js';

/* Lists users other than the caller — used to start new conversations.
   Supports an optional ?search= term against name/email. */
export const listUsers = catchAsync(async (req, res) => {
  const { search } = req.query;

  const filter = { _id: { $ne: req.user.id } };
  if (search) {
    const term = new RegExp(search.trim(), 'i');
    filter.$or = [{ name: term }, { email: term }];
  }

  const users = await User.find(filter).sort({ name: 1 }).limit(50);
  sendSuccess(res, { message: 'Users', data: { users: users.map((u) => u.toJSON()) } });
});

export const getUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  sendSuccess(res, { message: 'User', data: { user: user.toJSON() } });
});
