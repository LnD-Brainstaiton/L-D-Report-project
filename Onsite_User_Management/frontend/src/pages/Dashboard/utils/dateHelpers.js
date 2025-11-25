/**
 * Date helpers for Dashboard
 * Re-exports from shared dateRangeUtils for backward compatibility
 */

import { 
  getDateRange, 
  formatDateRangeDisplay, 
  getCourseStartDate, 
  getCourseEndDate 
} from '../../../utils/dateRangeUtils';

// Re-export all functions for backward compatibility
export { getDateRange, getCourseStartDate, getCourseEndDate };

// Alias formatDateRangeDisplay as formatDateRange for existing code
export const formatDateRange = formatDateRangeDisplay;

