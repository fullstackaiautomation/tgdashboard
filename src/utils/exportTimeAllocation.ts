/**
 * Time Allocation Export Utilities
 * Story 4.1: CSV export functionality for time tracking data
 */

import { format } from 'date-fns';
import type { DeepWorkSession } from '@/types/deepWork';

interface ExportOptions {
  filename?: string;
  includeNotes?: boolean;
  includeSummary?: boolean;
}

/**
 * Export deep work sessions to CSV format
 * Useful for client invoicing and personal analysis
 */
export function exportTimeAllocationCSV(
  sessions: DeepWorkSession[],
  options: ExportOptions = {}
) {
  const {
    filename = `time-allocation-${format(new Date(), 'yyyy-MM-dd')}.csv`,
    includeNotes = true,
    includeSummary = true,
  } = options;

  // Define headers
  const headers = [
    'Date',
    'Day',
    'Business/Life Area',
    'Project',
    'Phase',
    'Task',
    'Labels',
    'Start Time',
    'End Time',
    'Duration (hours)',
    ...(includeNotes ? ['Notes'] : []),
  ];

  // Convert sessions to CSV rows
  const rows = sessions
    .filter((session) => session.status === 'completed' && session.duration_minutes)
    .map((session) => {
      const startTime = new Date(session.start_time);
      const endTime = session.end_time ? new Date(session.end_time) : null;
      const durationHours = session.duration_minutes
        ? (session.duration_minutes / 60).toFixed(2)
        : '0.00';

      const areaName =
        session.businesses?.name || session.life_areas?.name || 'Unallocated';
      const projectName = session.projects?.name || '-';
      const phaseName = session.phases?.name || '-';
      const taskName = session.tasks?.task_name || '-';
      const labels = session.labels.join(', ') || '-';

      const row = [
        format(startTime, 'yyyy-MM-dd'),
        format(startTime, 'EEEE'),
        areaName,
        projectName,
        phaseName,
        taskName,
        labels,
        format(startTime, 'HH:mm'),
        endTime ? format(endTime, 'HH:mm') : '-',
        durationHours,
        ...(includeNotes ? [session.notes || '-'] : []),
      ];

      return row;
    });

  // Calculate summary
  const totalHours = sessions
    .filter((s) => s.status === 'completed' && s.duration_minutes)
    .reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / 60;

  // Add summary row if requested
  if (includeSummary && rows.length > 0) {
    const summaryRow = new Array(headers.length).fill('');
    summaryRow[0] = 'TOTAL';
    summaryRow[headers.indexOf('Duration (hours)')] = totalHours.toFixed(2);
    rows.push(summaryRow);
  }

  // Build CSV content
  const csvContent = [
    headers.map(escapeCSVValue).join(','),
    ...rows.map((row) => row.map(escapeCSVValue).join(',')),
  ].join('\n');

  // Download file
  downloadCSV(csvContent, filename);

  return {
    totalSessions: sessions.length,
    exportedSessions: rows.length - (includeSummary ? 1 : 0),
    totalHours: totalHours.toFixed(2),
  };
}

/**
 * Export time allocation by business/life area (summary format)
 */
export function exportTimeAllocationSummaryCSV(
  timeAllocation: Array<{
    area_name: string;
    total_hours: number;
    session_count: number;
  }>,
  options: { filename?: string; dateRange?: string } = {}
) {
  const {
    filename = `time-allocation-summary-${format(new Date(), 'yyyy-MM-dd')}.csv`,
    dateRange = 'Date Range Not Specified',
  } = options;

  const headers = ['Business/Life Area', 'Total Hours', 'Session Count', '% of Total'];

  const totalHours = timeAllocation.reduce((sum, item) => sum + item.total_hours, 0);

  const rows = timeAllocation.map((item) => {
    const percentage = totalHours > 0 ? ((item.total_hours / totalHours) * 100).toFixed(1) : '0.0';
    return [
      item.area_name,
      item.total_hours.toFixed(2),
      item.session_count.toString(),
      `${percentage}%`,
    ];
  });

  // Add summary row
  rows.push(['TOTAL', totalHours.toFixed(2), '', '100.0%']);

  // Add header with date range
  const csvContent = [
    `Time Allocation Summary - ${dateRange}`,
    '',
    headers.map(escapeCSVValue).join(','),
    ...rows.map((row) => row.map(escapeCSVValue).join(',')),
  ].join('\n');

  downloadCSV(csvContent, filename);

  return {
    totalHours: totalHours.toFixed(2),
    areaCount: timeAllocation.length,
  };
}

/**
 * Export time by label (cross-cutting analysis)
 */
export function exportTimeLabelCSV(
  labelData: Array<{
    label: string;
    total_hours: number;
    session_count: number;
  }>,
  options: { filename?: string } = {}
) {
  const { filename = `time-by-label-${format(new Date(), 'yyyy-MM-dd')}.csv` } = options;

  const headers = ['Label', 'Total Hours', 'Session Count', '% of Total'];

  const totalHours = labelData.reduce((sum, item) => sum + item.total_hours, 0);

  const rows = labelData.map((item) => {
    const percentage = totalHours > 0 ? ((item.total_hours / totalHours) * 100).toFixed(1) : '0.0';
    return [
      item.label,
      item.total_hours.toFixed(2),
      item.session_count.toString(),
      `${percentage}%`,
    ];
  });

  rows.push(['TOTAL', totalHours.toFixed(2), '', '100.0%']);

  const csvContent = [
    headers.map(escapeCSVValue).join(','),
    ...rows.map((row) => row.map(escapeCSVValue).join(',')),
  ].join('\n');

  downloadCSV(csvContent, filename);

  return {
    totalHours: totalHours.toFixed(2),
    labelCount: labelData.length,
  };
}

/**
 * Escape CSV values to handle commas, quotes, and newlines
 */
function escapeCSVValue(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Trigger CSV file download in browser
 */
function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (navigator.msSaveBlob) {
    // IE 10+
    navigator.msSaveBlob(blob, filename);
  } else {
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
