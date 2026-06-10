import { ApiError } from '../utils/apiError.js';

/* Validates req[property] against a Joi schema and replaces it with the
   sanitized value. Throws a 400 with a readable message on failure. */
export const validate = (schema, property = 'body') => (req, _res, next) => {
  const { error, value } = schema.validate(req[property], {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const message = error.details.map((detail) => detail.message).join(', ');
    return next(ApiError.badRequest(message));
  }

  req[property] = value;
  return next();
};
