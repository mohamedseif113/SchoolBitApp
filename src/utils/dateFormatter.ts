/**
 * Utility functions for formatting dates and ISO timestamp strings
 */

/**
 * Formats a raw date or ISO string (e.g. "2026-08-31T10:55:55.000000Z")
 * into a human-readable Arabic or English date/time string.
 */
export function formatDateTime(dateInput?: string | Date | null, isRTL: boolean = true): string {
  if (!dateInput) return '—';

  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) {
      // Fallback for non-standard string formats (e.g., "2026-08-31 10:55:55")
      if (typeof dateInput === 'string' && dateInput.includes('T')) {
        const parts = dateInput.split('T');
        const datePart = parts[0];
        const timePart = parts[1]?.substring(0, 5) || '';
        return `${datePart} ${timePart}`.trim();
      }
      return String(dateInput);
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');

    if (isRTL) {
      const ampm = hours >= 12 ? 'م' : 'ص';
      hours = hours % 12;
      hours = hours ? hours : 12; // convert 0 to 12
      const formattedHours = String(hours).padStart(2, '0');
      return `${year}-${month}-${day} ${formattedHours}:${minutes} ${ampm}`;
    } else {
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const formattedHours = String(hours).padStart(2, '0');
      return `${year}-${month}-${day} ${formattedHours}:${minutes} ${ampm}`;
    }
  } catch {
    return String(dateInput);
  }
}

/**
 * Formats a raw date input into a clean date-only string (e.g. "2026-08-31" or "31/08/2026")
 */
export function formatDateOnly(dateInput?: string | Date | null): string {
  if (!dateInput) return '—';

  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) {
      if (typeof dateInput === 'string') {
        return dateInput.split('T')[0] || dateInput;
      }
      return String(dateInput);
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch {
    return String(dateInput);
  }
}
