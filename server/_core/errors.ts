/**
 * Standardized Error Handling
 * Provides consistent error codes and messages across the app
 */

export enum ErrorCode {
  // Validation errors (400)
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_FIELD = 'MISSING_FIELD',
  INVALID_EMAIL = 'INVALID_EMAIL',
  INVALID_PHONE = 'INVALID_PHONE',
  
  // Authentication errors (401)
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  // Authorization errors (403)
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Not found errors (404)
  NOT_FOUND = 'NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  DELIVERY_NOT_FOUND = 'DELIVERY_NOT_FOUND',
  COURIER_NOT_FOUND = 'COURIER_NOT_FOUND',
  
  // Conflict errors (409)
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  DELIVERY_ALREADY_ASSIGNED = 'DELIVERY_ALREADY_ASSIGNED',
  COURIER_ALREADY_ACCEPTED = 'COURIER_ALREADY_ACCEPTED',
  
  // Rate limit errors (429)
  RATE_LIMITED = 'RATE_LIMITED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  
  // Server errors (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public statusCode: number = 400,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Create a validation error
 */
export function validationError(message: string, details?: Record<string, any>): AppError {
  return new AppError(ErrorCode.INVALID_INPUT, message, 400, details);
}

/**
 * Create a not found error
 */
export function notFoundError(resource: string): AppError {
  return new AppError(
    ErrorCode.NOT_FOUND,
    `${resource} not found`,
    404
  );
}

/**
 * Create an authorization error
 */
export function forbiddenError(message: string = 'Access denied'): AppError {
  return new AppError(ErrorCode.FORBIDDEN, message, 403);
}

/**
 * Create a conflict error
 */
export function conflictError(message: string): AppError {
  return new AppError(ErrorCode.ALREADY_EXISTS, message, 409);
}

/**
 * Create a rate limit error
 */
export function rateLimitError(): AppError {
  return new AppError(
    ErrorCode.RATE_LIMITED,
    'Too many requests. Please try again later.',
    429
  );
}

/**
 * Create an internal server error
 */
export function internalError(message: string = 'Internal server error'): AppError {
  return new AppError(ErrorCode.INTERNAL_ERROR, message, 500);
}

/**
 * Handle and log errors
 */
export function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    console.error('[Error]', error.message, error.stack);
    return new AppError(
      ErrorCode.INTERNAL_ERROR,
      'An unexpected error occurred',
      500
    );
  }

  console.error('[Error]', error);
  return new AppError(
    ErrorCode.INTERNAL_ERROR,
    'An unexpected error occurred',
    500
  );
}

/**
 * Convert AppError to response format
 */
export function errorToResponse(error: AppError) {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      ...(error.details && { details: error.details }),
    },
  };
}
