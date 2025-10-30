/**
 * Error message mapping for user-friendly error displays
 * Maps database/API error codes to human-readable messages
 */

export interface ErrorDetails {
  title: string;
  message: string;
  action?: string;
}

/**
 * Map Supabase/PostgreSQL error codes to user-friendly messages
 */
export function getErrorMessage(error: any): ErrorDetails {
  // Extract error code from Supabase error
  const code = error?.code || error?.error_code || error?.status;
  const message = error?.message || '';

  // PostgreSQL error codes
  switch (code) {
    case '23505': // Unique violation
      return {
        title: 'Duplicate Entry',
        message: 'This task already exists.',
        action: 'Try editing the existing task instead.',
      };

    case '23503': // Foreign key violation
      return {
        title: 'Invalid Reference',
        message: 'Cannot link to non-existent project or business.',
        action: 'Please select a valid project from the list.',
      };

    case '42501': // Insufficient privilege
      return {
        title: 'Permission Denied',
        message: 'You don\'t have permission to perform this action.',
        action: 'Please refresh the page and log in again.',
      };

    case '23502': // Not null violation
      return {
        title: 'Missing Required Field',
        message: 'Please fill in all required fields.',
        action: 'Check that task name and other required fields are filled.',
      };

    case '22P02': // Invalid text representation
      return {
        title: 'Invalid Data Format',
        message: 'The data format is incorrect.',
        action: 'Please check your input and try again.',
      };

    case 'PGRST116': // No rows returned
      return {
        title: 'Not Found',
        message: 'Task not found. It may have been deleted.',
        action: 'Refresh the page to see the latest tasks.',
      };

    case '401': // Unauthorized
      return {
        title: 'Session Expired',
        message: 'Your session has expired.',
        action: 'Please log in again.',
      };

    case '403': // Forbidden
      return {
        title: 'Access Denied',
        message: 'You don\'t have access to this resource.',
        action: 'Contact support if you believe this is an error.',
      };

    case '404': // Not found
      return {
        title: 'Not Found',
        message: 'The requested resource was not found.',
        action: 'It may have been deleted or moved.',
      };

    case '500': // Internal server error
      return {
        title: 'Server Error',
        message: 'Something went wrong on our end.',
        action: 'Please try again in a few moments.',
      };
  }

  // Check for network errors
  if (error instanceof TypeError && message.includes('fetch')) {
    return {
      title: 'Network Error',
      message: 'Unable to connect to the server.',
      action: 'Check your internet connection and try again.',
    };
  }

  // Check for timeout errors
  if (message.toLowerCase().includes('timeout')) {
    return {
      title: 'Request Timeout',
      message: 'The request took too long to complete.',
      action: 'Please try again.',
    };
  }

  // Generic fallback
  return {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred.',
    action: 'Please try again or contact support if the problem persists.',
  };
}

/**
 * Format error for logging (includes full details for developers)
 */
export function formatErrorForLogging(error: any): string {
  return JSON.stringify({
    code: error?.code || error?.error_code,
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
    stack: error?.stack,
    timestamp: new Date().toISOString(),
  }, null, 2);
}
