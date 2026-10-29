import { AppError } from '../utils/http.js';

export function notFound(_req, _res, next) {
  next(new AppError(404, 'NOT_FOUND', 'Endpoint tidak ditemukan.'));
}

