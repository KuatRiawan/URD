import { AppError } from '../utils/http.js';

export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true
    });
    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message.replace(/["]/g, '')
      }));
      return next(new AppError(400, 'VALIDATION_ERROR', details[0].message, details));
    }
    req[source] = value;
    return next();
  };
}

