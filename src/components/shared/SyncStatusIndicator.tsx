import type { FC } from 'react';
import { RefreshCw, Check, AlertCircle, Info } from 'lucide-react';

interface SyncStatusIndicatorProps {
  status: 'idle' | 'syncing' | 'success' | 'error';
  message?: string;
  onRetry?: () => void;
}

/**
 * SyncStatusIndicator - Shows current sync status with appropriate icon and styling
 * Used in TaskCard and global header to indicate sync progress
 */
export const SyncStatusIndicator: FC<SyncStatusIndicatorProps> = ({
  status,
  message,
  onRetry,
}) => {
  if (status === 'idle') return null;

  return (
    <div className="flex items-center gap-2">
      {status === 'syncing' && (
        <>
          <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
          <span className="text-xs text-blue-400">
            {message || 'Syncing...'}
          </span>
        </>
      )}

      {status === 'success' && (
        <>
          <Check className="w-4 h-4 text-green-400" />
          <span className="text-xs text-green-400">
            {message || 'Synced'}
          </span>
        </>
      )}

      {status === 'error' && (
        <>
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-xs text-red-400">
            {message || 'Sync failed'}
          </span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs text-red-400 underline hover:text-red-300 transition-colors"
            >
              Retry
            </button>
          )}
        </>
      )}
    </div>
  );
};

interface GlobalSyncStatusProps {
  isSyncing: boolean;
  lastSyncTime?: Date;
  onRefresh: () => void;
}

/**
 * GlobalSyncStatus - Shows global sync status in header with manual refresh button
 */
export const GlobalSyncStatus: FC<GlobalSyncStatusProps> = ({
  isSyncing,
  lastSyncTime,
  onRefresh,
}) => {
  const getTimeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="flex items-center gap-3 text-xs text-gray-400">
      {isSyncing ? (
        <>
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Syncing...</span>
        </>
      ) : (
        <>
          {lastSyncTime && (
            <div className="flex items-center gap-1">
              <Info className="w-3 h-3" />
              <span>Last synced {getTimeAgo(lastSyncTime)}</span>
            </div>
          )}
          <button
            onClick={onRefresh}
            disabled={isSyncing}
            className="flex items-center gap-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh all tasks"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Refresh</span>
          </button>
        </>
      )}
    </div>
  );
};
