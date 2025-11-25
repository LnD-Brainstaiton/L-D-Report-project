/**
 * Date formatting and manipulation utility functions
 */

type DateInput = Date | string | null | undefined;

interface DateFormatOptions extends Intl.DateTimeFormatOptions {
  day?: 'numeric' | '2-digit';
  month?: 'numeric' | '2-digit' | 'narrow' | 'short' | 'long';
  year?: 'numeric' | '2-digit';
  hour?: 'numeric' | '2-digit';
  minute?: 'numeric' | '2-digit';
  hour12?: boolean;
}

/**
 * Convert a Date object to ISO date string (YYYY-MM-DD) for API submission
 */
export const formatDateForAPI = (date: DateInput): string | null => {
  if (!date) return null;
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error formatting date for API:', error);
    return null;
  }
};

/**
 * Format a date for display using day month year format (e.g., "15 Jan 2024")
 */
export const formatDateForDisplay = (date: DateInput, options: DateFormatOptions = {}): string => {
  if (!date) return 'N/A';
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return 'N/A';

    const defaultOptions: DateFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    };

    // Use 'en-GB' locale which naturally uses day/month/year format
    return dateObj.toLocaleDateString('en-GB', { ...defaultOptions, ...options });
  } catch (error) {
    console.error('Error formatting date for display:', error);
    return 'N/A';
  }
};

/**
 * Format a datetime for display using day month year format with time
 */
export const formatDateTimeForDisplay = (date: DateInput, options: DateFormatOptions = {}): string => {
  if (!date) return 'N/A';
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return 'N/A';

    const defaultOptions: DateFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };

    return dateObj.toLocaleString('en-GB', { ...defaultOptions, ...options });
  } catch (error) {
    console.error('Error formatting datetime for display:', error);
    return 'N/A';
  }
};

/**
 * Format a date range for display
 */
export const formatDateRange = (startDate: DateInput, endDate: DateInput): string => {
  if (!startDate || !endDate) return 'N/A';

  const startStr = formatDateForDisplay(startDate, { month: 'short', year: 'numeric' });
  const endStr = formatDateForDisplay(endDate, { month: 'short', year: 'numeric' });

  if (startStr === endStr) {
    return startStr;
  }
  return `${startStr} - ${endStr}`;
};

/**
 * Format a date range with "from X to Y" format
 */
export const formatDateRangeWithFromTo = (startDate: DateInput, endDate?: DateInput): string => {
  if (!startDate) return 'N/A';

  const startStr = formatDateForDisplay(startDate);

  if (!endDate) {
    return `from ${startStr}`;
  }

  const endStr = formatDateForDisplay(endDate);
  return `from ${startStr} to ${endStr}`;
};

/**
 * Convert 24-hour time format (HH:MM) to 12-hour format (h:MM AM/PM)
 */
export const convertTo12HourFormat = (time24: string | null | undefined): string => {
  if (!time24) return '';

  try {
    const [hours, minutes] = time24.split(':');
    const hour24 = parseInt(hours, 10);
    const mins = minutes || '00';

    if (isNaN(hour24)) return time24;

    if (hour24 === 0) {
      return `12:${mins} AM`;
    } else if (hour24 < 12) {
      return `${hour24}:${mins} AM`;
    } else if (hour24 === 12) {
      return `12:${mins} PM`;
    } else {
      return `${hour24 - 12}:${mins} PM`;
    }
  } catch (error) {
    console.error('Error converting time format:', error);
    return time24;
  }
};

/**
 * Generate a safe filename with timestamp
 */
export const generateTimestampFilename = (prefix: string, extension: string = '.xlsx'): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `${prefix}_${timestamp}${extension}`;
};

