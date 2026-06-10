/* Wraps an async route handler and forwards rejections to the error middleware. */
export const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
