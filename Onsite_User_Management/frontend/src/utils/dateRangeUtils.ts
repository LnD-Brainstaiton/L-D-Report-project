/**
 * Date range utility functions - Consolidated from multiple locations
 * Used by Dashboard, Courses, and other pages for time period filtering
 */

import { formatDateRange as formatDateRangeBase } from './dateUtils';
import type { DateRange, Course, TimePeriod } from '../types';


// Course type that might have Unix timestamps (from LMS)
interface CourseWithTimestamps {
  start_date?: string;
  end_date?: string;
  startdate?: number; // Unix timestamp from LMS
  enddate?: number; // Unix timestamp from LMS
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Get date range based on time period selection
 */
export const getDateRange = (
  timePeriod: TimePeriod,
  selectedMonth: string,
  selectedQuarter: string,
  selectedYear: number
): DateRange | null => {
  switch (timePeriod) {
    case 'month':
      if (selectedMonth !== '' && selectedYear) {
        const monthIndex = parseInt(selectedMonth);
        const monthStart = new Date(selectedYear, monthIndex, 1);
        const monthEnd = new Date(selectedYear, monthIndex + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
        return { start: monthStart, end: monthEnd };
      }
      return null;

    case 'quarter':
      if (selectedQuarter !== '' && selectedYear) {
        const quarter = parseInt(selectedQuarter);
        const quarterStartMonth = (quarter - 1) * 3;
        const quarterStart = new Date(selectedYear, quarterStartMonth, 1);
        const quarterEndMonth = quarterStartMonth + 2;
        const quarterEnd = new Date(selectedYear, quarterEndMonth + 1, 0);
        quarterEnd.setHours(23, 59, 59, 999);
        return { start: quarterStart, end: quarterEnd };
      }
      return null;

    case 'year':
      const yearStart = new Date(selectedYear, 0, 1);
      const yearEnd = new Date(selectedYear, 11, 31);
      yearEnd.setHours(23, 59, 59, 999);
      return { start: yearStart, end: yearEnd };

    default:
      return null;
  }
};

/**
 * Format date range for display in UI
 */
export const formatDateRangeDisplay = (
  timePeriod: TimePeriod,
  selectedMonth: string,
  selectedQuarter: string,
  selectedYear: number,
  dateRange: DateRange | null = null
): string => {
  if (timePeriod === 'all') return 'All Time';

  if (timePeriod === 'month' && selectedMonth !== '') {
    return `${MONTH_NAMES[parseInt(selectedMonth)]} ${selectedYear}`;
  }

  if (timePeriod === 'quarter' && selectedQuarter !== '') {
    return `Q${selectedQuarter} ${selectedYear}`;
  }

  if (timePeriod === 'year') {
    return `${selectedYear}`;
  }

  if (dateRange) {
    return formatDateRangeBase(dateRange.start, dateRange.end);
  }

  return 'All Time';
};

/**
 * Get course start date (handles both Unix timestamp and date string)
 */
export const getCourseStartDate = (course: CourseWithTimestamps | Course): Date | null => {
  const courseWithTs = course as CourseWithTimestamps;
  if (courseWithTs.startdate) {
    return new Date(courseWithTs.startdate * 1000);
  }
  return course.start_date ? new Date(course.start_date) : null;
};

/**
 * Get course end date (handles both Unix timestamp and date string)
 */
export const getCourseEndDate = (course: CourseWithTimestamps | Course): Date | null => {
  const courseWithTs = course as CourseWithTimestamps;
  if (courseWithTs.enddate) {
    return new Date(courseWithTs.enddate * 1000);
  }
  return course.end_date ? new Date(course.end_date) : null;
};

/**
 * Check if a course falls within a date range
 */
export const isCourseInDateRange = (
  course: CourseWithTimestamps | Course,
  dateRange: DateRange | null
): boolean => {
  if (!dateRange) return true;

  const courseStartDate = getCourseStartDate(course);
  if (!courseStartDate) return false;

  const normalizedDate = new Date(courseStartDate);
  normalizedDate.setHours(0, 0, 0, 0);

  return normalizedDate >= dateRange.start && normalizedDate <= dateRange.end;
};

