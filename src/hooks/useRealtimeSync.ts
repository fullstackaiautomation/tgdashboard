import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { syncLogger } from '../utils/syncLogger';

export const useRealtimeSync = (userId: string | null | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    // Subscribe to tasks table changes
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[Real-time] Tasks change detected:', payload);

          try {
            const newRecord = payload.new as any;
            const oldRecord = payload.old as any;
            const taskId = newRecord?.id || oldRecord?.id || null;
            const operation = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';

            // Log the sync event
            syncLogger.logSuccess(operation, taskId, {
              table: payload.table,
              eventType: payload.eventType,
            });

            // Invalidate tasks queries to trigger refetch
            queryClient.invalidateQueries({ queryKey: ['tasks'] });

            // Also invalidate specific task queries if it's an update or delete
            if (payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
              if (taskId) {
                queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
              }
            }
          } catch (error: any) {
            // Log sync error
            const newRecord = payload.new as any;
            const oldRecord = payload.old as any;
            syncLogger.logError(
              'SYNC_ERROR',
              newRecord?.id || oldRecord?.id || null,
              error?.message || 'Unknown sync error',
              { payload, error }
            );
            console.error('[Real-time] Sync error:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('[Real-time] Subscription status:', status);

        if (status === 'SUBSCRIBED') {
          syncLogger.logSuccess('INSERT', 'system', { message: 'Real-time subscription active' });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          syncLogger.logError('SYNC_ERROR', null, `Subscription status: ${status}`, { status });
        }
      });

    // Cleanup on unmount
    return () => {
      console.log('[Real-time] Unsubscribing from tasks-changes channel');
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
};
