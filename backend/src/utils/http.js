export class AppError extends Error {
  constructor(status, code, message, details = undefined) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function parsePagination(queryObj = {}, defaultLimit = 20, maxLimit = 100) {
  const page = Math.max(1, Number.parseInt(queryObj.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number.parseInt(queryObj.limit, 10) || defaultLimit));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

