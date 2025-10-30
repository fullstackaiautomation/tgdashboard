import { supabase } from '../lib/supabase';
import { formatErrorForLogging } from './errorMessages';

interface ErrorLogEntry {
  task_id?: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE' | 'QUERY' | 'SYNC';
  error_code?: string;
  error_message: string;
  stack_trace?: string;
  metadata?: Record<string, any>;
}

/**
 * Log errors to console in development, and to database in production
 */
export async function logError(entry: ErrorLogEntry, error?: any): Promise<void> {
  const isDevelopment = import.meta.env.DEV;

  // Always log to console in development
  if (isDevelopment) {
    console.group(`🚨 Error: ${entry.operation}`);
    console.error('Operation:', entry.operation);
    if (entry.task_id) console.error('Task ID:', entry.task_id);
    console.error('Message:', entry.error_message);
    if (entry.error_code) console.error('Code:', entry.error_code);
    if (error) {
      console.error('Full Error:', formatErrorForLogging(error));
    }
    if (entry.metadata) {
      console.error('Metadata:', entry.metadata);
    }
    console.groupEnd();
  }

  // In production, also log to database
  if (!isDevelopment) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await supabase.from('error_logs').insert({
          user_id: user.id,
          task_id: entry.task_id || null,
          operation: entry.operation,
          error_code: entry.error_code || null,
          error_message: entry.error_message,
          stack_trace: entry.stack_trace || (error?.stack || null),
          metadata: entry.metadata || null,
        });
      }
    } catch (logError) {
      // Fail silently - don't want error logging to break the app
      console.error('Failed to log error to database:', logError);
    }
  }
}

/**
 * Log sync errors specifically
 */
export async function logSyncError(
  taskId: string | undefined,
  operation: ErrorLogEntry['operation'],
  error: any
): Promise<void> {
  await logError({
    task_id: taskId,
    operation,
    error_code: error?.code || error?.status?.toString(),
    error_message: error?.message || 'Unknown sync error',
    stack_trace: error?.stack,
    metadata: {
      url: error?.url,
      statusText: error?.statusText,
    },
  }, error);
}
