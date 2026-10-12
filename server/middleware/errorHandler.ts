/**
 * Error Handling Middleware for tRPC
 * Wraps procedures to catch and standardize errors
 */

import { TRPCError } from '@trpc/server';

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

/**
 * Wrap a procedure handler with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  handler: T
): T {
  return (async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('[Procedure Error]', error);

      if (error instanceof TRPCError) {
        throw error;
      }

      if (error instanceof Error) {
        // Check for specific error types
        if (error.message.includes('not found')) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: error.message,
          });
        }

        if (error.message.includes('already')) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: error.message,
          });
        }

        if (error.message.includes('unauthorized') || error.message.includes('forbidden')) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: error.message,
          });
        }

        // Generic error
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        });
      }

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
      });
    }
  }) as T;
}

/**
 * Validate input and throw TRPC error if invalid
 */
export function validateInput<T>(
  data: T,
  schema: { parse: (data: any) => T }
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof Error) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Validation error: ${error.message}`,
      });
    }
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Validation failed',
    });
  }
}

/**
 * Handle database errors
 */
export function handleDbError(error: unknown): TRPCError {
  console.error('[Database Error]', error);

  if (error instanceof Error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return new TRPCError({
        code: 'CONFLICT',
        message: 'This record already exists',
      });
    }

    if (error.message.includes('FOREIGN KEY constraint failed')) {
      return new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid reference to related record',
      });
    }

    if (error.message.includes('no such table')) {
      return new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Database schema error',
      });
    }
  }

  return new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Database operation failed',
  });
}
