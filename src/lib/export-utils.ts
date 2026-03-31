/**
 * CSV Export Utilities for StayOnStay
 * Provides functions to convert data to CSV format and download as files
 */

export interface CSVHeader<T> {
  key: keyof T;
  label: string;
}

/**
 * Convert array of objects to CSV string
 * Handles values with commas by wrapping in quotes
 */
export function arrayToCSV<T extends Record<string, any>>(
  data: T[],
  headers: CSVHeader<T>[]
): string {
  if (data.length === 0) {
    return headers.map(h => h.label).join(',');
  }

  const headerRow = headers.map(h => h.label).join(',');
  const rows = data.map(row => 
    headers.map(h => {
      const val = row[h.key];
      let str = String(val ?? '');
      
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        str = `"${str.replace(/"/g, '""')}"`;
      }
      
      return str;
    }).join(',')
  );
  
  return [headerRow, ...rows].join('\n');
}

/**
 * Trigger browser download of CSV content
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Export array to CSV and trigger download
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  headers: CSVHeader<T>[],
  filename: string
): void {
  const csv = arrayToCSV(data, headers);
  downloadCSV(csv, filename);
}

/**
 * Format date for CSV (YYYY-MM-DD)
 */
export function formatDateForCSV(date: Date | string | null): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

/**
 * Format timestamp for CSV (YYYY-MM-DD HH:mm:ss)
 */
export function formatTimestampForCSV(timestamp: Date | string | null): string {
  if (!timestamp) return '';
  const d = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return d.toISOString().replace('T', ' ').split('.')[0];
}
