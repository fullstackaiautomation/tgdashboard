interface SyncLog {
  timestamp: string;
  taskId: string | null;
  operation: 'INSERT' | 'UPDATE' | 'DELETE' | 'SYNC_ERROR';
  success: boolean;
  error?: string;
  details?: any;
}

class SyncLogger {
  private logs: SyncLog[] = [];
  private maxLogs = 100; // Keep last 100 logs

  log(entry: Omit<SyncLog, 'timestamp'>): void {
    const logEntry: SyncLog = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    this.logs.unshift(logEntry);

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      const emoji = logEntry.success ? '✅' : '❌';
      console.log(
        `${emoji} [Sync ${logEntry.operation}]`,
        logEntry.taskId || 'N/A',
        logEntry.error || 'Success',
        logEntry.details || ''
      );
    }
  }

  logSuccess(operation: 'INSERT' | 'UPDATE' | 'DELETE', taskId: string, details?: any): void {
    this.log({
      taskId,
      operation,
      success: true,
      details,
    });
  }

  logError(operation: 'INSERT' | 'UPDATE' | 'DELETE' | 'SYNC_ERROR', taskId: string | null, error: string, details?: any): void {
    this.log({
      taskId,
      operation,
      success: false,
      error,
      details,
    });
  }

  getLogs(): SyncLog[] {
    return [...this.logs];
  }

  getRecentErrors(limit = 10): SyncLog[] {
    return this.logs.filter(log => !log.success).slice(0, limit);
  }

  clearLogs(): void {
    this.logs = [];
  }
}

// Export singleton instance
export const syncLogger = new SyncLogger();
