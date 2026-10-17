/**
 * Utility function to export an array of objects to a CSV file.
 * @param data Array of objects to export
 * @param filename Desired filename (e.g., 'inventory.csv')
 */
export const exportToCSV = <T extends object>(data: T[], filename: string): void => {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Extract headers from the first object
  const headers = Object.keys(data[0]) as (keyof T)[];
  
  // Create CSV rows
  const csvRows = [
    // Header row
    headers.join(','),
    // Data rows
    ...data.map(row => {
      return headers.map(header => {
        const val = row[header];
        // Handle strings with commas, quotes, or newlines
        const escaped = ('' + val).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',');
    })
  ];

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
