// Data Export Utility
// Exports all dashboard data to JSON for backup purposes

import { supabase } from '../lib/supabase';

export interface ExportData {
  exportDate: string;
  exportVersion: string;
  user: {
    id: string;
    email?: string;
  };
  data: {
    businesses?: any[];
    projects?: any[];
    phases?: any[];
    tasks?: any[];
    deep_work_sessions?: any[];
    notes?: any[];
    accounts?: any[];
    balance_snapshots?: any[];
  };
  metadata: {
    recordCounts: {
      [key: string]: number;
    };
  };
}

/**
 * Exports all user data to JSON format
 * @returns {Promise<ExportData>} Complete database export
 */
export async function exportAllData(): Promise<ExportData> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Fetch all data in parallel
  const [
    businesses,
    projects,
    phases,
    tasks,
    deepWorkSessions,
    notes,
    accounts,
    balanceSnapshots,
  ] = await Promise.all([
    supabase.from('businesses').select('*').order('created_at'),
    supabase.from('projects').select('*').order('created_at'),
    supabase.from('phases').select('*').order('sequence_number'),
    supabase.from('tasks').select('*').order('created_at'),
    supabase.from('deep_work_sessions').select('*').order('start_time'),
    supabase.from('notes').select('*').order('created_at'),
    supabase.from('accounts').select('*').order('display_order'),
    supabase.from('balance_snapshots').select('*').order('snapshot_date'),
  ]);

  const exportData: ExportData = {
    exportDate: new Date().toISOString(),
    exportVersion: '1.0',
    user: {
      id: user.id,
      email: user.email,
    },
    data: {
      businesses: businesses.data || [],
      projects: projects.data || [],
      phases: phases.data || [],
      tasks: tasks.data || [],
      deep_work_sessions: deepWorkSessions.data || [],
      notes: notes.data || [],
      accounts: accounts.data || [],
      balance_snapshots: balanceSnapshots.data || [],
    },
    metadata: {
      recordCounts: {
        businesses: businesses.data?.length || 0,
        projects: projects.data?.length || 0,
        phases: phases.data?.length || 0,
        tasks: tasks.data?.length || 0,
        deep_work_sessions: deepWorkSessions.data?.length || 0,
        notes: notes.data?.length || 0,
        accounts: accounts.data?.length || 0,
        balance_snapshots: balanceSnapshots.data?.length || 0,
      },
    },
  };

  return exportData;
}

/**
 * Downloads data export as JSON file
 * @param {ExportData} data - The export data to download
 * @param {string} filename - Optional custom filename
 */
export function downloadExportAsJSON(data: ExportData, filename?: string): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `tg-dashboard-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Main export function - exports and downloads all data
 */
export async function exportAndDownload(): Promise<void> {
  try {
    const data = await exportAllData();
    downloadExportAsJSON(data);
    console.log('✅ Data exported successfully');
    return Promise.resolve();
  } catch (error) {
    console.error('❌ Export failed:', error);
    throw error;
  }
}

/**
 * Get export summary without downloading
 * Useful for displaying export info before downloading
 */
export async function getExportSummary(): Promise<{
  totalRecords: number;
  recordCounts: { [key: string]: number };
  estimatedSizeKB: number;
}> {
  const data = await exportAllData();

  const totalRecords = Object.values(data.metadata.recordCounts).reduce(
    (sum, count) => sum + count,
    0
  );

  const estimatedSizeKB = Math.round(
    JSON.stringify(data).length / 1024
  );

  return {
    totalRecords,
    recordCounts: data.metadata.recordCounts,
    estimatedSizeKB,
  };
}
