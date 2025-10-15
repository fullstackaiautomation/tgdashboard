import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { syncLogger } from '../utils/syncLogger';

export const useRealtimeSync = (userId: string | null | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    // Subscribe to tasks table changes
    const tasksChannel = supabase
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
        console.log('[Real-time] Tasks subscription status:', status);

        if (status === 'SUBSCRIBED') {
          syncLogger.logSuccess('INSERT', 'system', { message: 'Tasks real-time subscription active' });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          syncLogger.logError('SYNC_ERROR', null, `Tasks subscription status: ${status}`, { status });
        }
      });

    // Subscribe to deep_work_sessions table changes (Story 4.1)
    const deepWorkChannel = supabase
      .channel('deep-work-sessions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deep_work_sessions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[Real-time] Deep Work Sessions change detected:', payload);

          try {
            const newRecord = payload.new as any;
            const oldRecord = payload.old as any;
            const sessionId = newRecord?.id || oldRecord?.id || null;
            const operation = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';

            // Log the sync event
            syncLogger.logSuccess(operation, sessionId, {
              table: payload.table,
              eventType: payload.eventType,
            });

            // Invalidate deep work sessions queries
            queryClient.invalidateQueries({ queryKey: ['deep-work-sessions'] });

            // Invalidate time allocation queries (critical for real-time updates)
            queryClient.invalidateQueries({ queryKey: ['time-allocation'] });

            // If it's a completed session, update analytics
            if (operation === 'UPDATE' && newRecord?.status === 'completed') {
              // Invalidate affected date range queries
              const sessionDate = new Date(newRecord.start_time);
              queryClient.invalidateQueries({
                queryKey: ['time-allocation', 'daily'],
              });
              queryClient.invalidateQueries({
                queryKey: ['time-allocation', 'weekly'],
              });
              queryClient.invalidateQueries({
                queryKey: ['time-allocation', 'monthly'],
              });
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
            console.error('[Real-time] Deep Work sync error:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('[Real-time] Deep Work subscription status:', status);

        if (status === 'SUBSCRIBED') {
          syncLogger.logSuccess('INSERT', 'system', {
            message: 'Deep Work Sessions real-time subscription active',
          });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          syncLogger.logError('SYNC_ERROR', null, `Deep Work subscription status: ${status}`, {
            status,
          });
        }
      });

    // Subscribe to task_time_blocks table changes (Story 6.3 - Epic 6)
    const timeBlocksChannel = supabase
      .channel('task-time-blocks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_time_blocks',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[Real-time] Task Time Blocks change detected:', payload);

          try {
            const newRecord = payload.new as any;
            const oldRecord = payload.old as any;
            const blockId = newRecord?.id || oldRecord?.id || null;
            const operation = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';

            // Log the sync event
            syncLogger.logSuccess(operation, blockId, {
              table: payload.table,
              eventType: payload.eventType,
            });

            // Invalidate calendar queries for Master Calendar
            queryClient.invalidateQueries({ queryKey: ['calendar-view'] });
            queryClient.invalidateQueries({ queryKey: ['weekly-calendar-summary'] });

            // Invalidate daily schedule queries for Daily Schedule Panel
            queryClient.invalidateQueries({ queryKey: ['daily-schedule'] });

            // Invalidate specific time block if update or delete
            if (payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
              if (blockId) {
                queryClient.invalidateQueries({ queryKey: ['time-block', blockId] });
              }
            }

            // If the time block is associated with a task, invalidate task queries
            const taskId = newRecord?.task_id || oldRecord?.task_id;
            if (taskId) {
              queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
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
            console.error('[Real-time] Task Time Blocks sync error:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('[Real-time] Task Time Blocks subscription status:', status);

        if (status === 'SUBSCRIBED') {
          syncLogger.logSuccess('INSERT', 'system', {
            message: 'Task Time Blocks real-time subscription active',
          });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          syncLogger.logError('SYNC_ERROR', null, `Task Time Blocks subscription status: ${status}`, {
            status,
          });
        }
      });

    // Cleanup on unmount
    return () => {
      console.log('[Real-time] Unsubscribing from all channels');
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(deepWorkChannel);
      supabase.removeChannel(timeBlocksChannel);
    };
  }, [userId, queryClient]);
};
