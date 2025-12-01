/**
 * Error handling utilities for database and service errors
 */

/**
 * User-friendly error messages for common database errors
 */
export interface DbErrorResult {
  userMessage: string;
  technicalMessage: string;
}

/**
 * Check if an error is a "no such table" SQLite error
 */
function isNoSuchTableError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes("no such table") || 
           error.message.includes("SQLITE_ERROR");
  }
  return false;
}

/**
 * Check if database is not available (undefined or connection error)
 */
export function isDbUnavailable(db: unknown): db is undefined {
  return db === undefined || db === null;
}

/**
 * Get user-friendly error message for database errors
 */
export function getDbErrorMessage(error: unknown): DbErrorResult {
  let technicalMessage: string;
  if (error instanceof Error) {
    technicalMessage = error.message;
  } else if (typeof error === 'object' && error !== null) {
    technicalMessage = JSON.stringify(error);
  } else {
    technicalMessage = String(error);
  }
  
  if (isNoSuchTableError(error)) {
    return {
      userMessage: "Database not initialized. Run: npm run db:generate",
      technicalMessage,
    };
  }
  
  return {
    userMessage: "Service temporarily unavailable. Please try again later.",
    technicalMessage,
  };
}

/**
 * Get user-friendly message when database connection is not available
 */
export function getDbUnavailableMessage(): string {
  return "Database not connected. If running locally, use 'npm run serve' instead of 'npm run dev'.";
}

/**
 * Log database error with context
 */
export function logDbError(context: string, error: unknown): void {
  const { technicalMessage } = getDbErrorMessage(error);
  console.error(`[${context}] Database error:`, technicalMessage);
}
