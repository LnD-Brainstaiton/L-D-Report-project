/**
 * Date range utility functions - Consolidated from multiple locations
 * Used by Dashboard, Courses, and other pages for time period filtering
 */

import { formatDateRange as formatDateRangeBase } from './dateUtils';

/**
 * Get date range based on time period selection
 * @param {string} timePeriod - 'all', 'month', 'quarter', or 'year'
 * @param {string} selectedMonth - Month index (0-11) as string
 * @param {string} selectedQuarter - Quarter (1-4) as string
 * @param {number} selectedYear - Year number
 * @returns {Object|null} - { start: Date, end: Date } or null if no range
 */
export const getDateRange = (timePeriod, selectedMonth, selectedQuarter, selectedYear) => {
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
        // Q1: Jan-Mar (0-2), Q2: Apr-Jun (3-5), Q3: Jul-Sep (6-8), Q4: Oct-Dec (9-11)
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
 * @param {string} timePeriod - 'all', 'month', 'quarter', or 'year'
 * @param {string} selectedMonth - Month index (0-11) as string
 * @param {string} selectedQuarter - Quarter (1-4) as string
 * @param {number} selectedYear - Year number
 * @param {Object} dateRange - Optional pre-calculated date range
 * @returns {string} - Formatted date range string
 */
export const formatDateRangeDisplay = (timePeriod, selectedMonth, selectedQuarter, selectedYear, dateRange = null) => {
  if (timePeriod === 'all') return 'All Time';
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  if (timePeriod === 'month' && selectedMonth !== '') {
    return `${monthNames[parseInt(selectedMonth)]} ${selectedYear}`;
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
 * @param {Object} course - Course object
 * @returns {Date|null} - Date object or null
 */
export const getCourseStartDate = (course) => {
  if (course.startdate) {
    return new Date(course.startdate * 1000);
  }
  return course.start_date ? new Date(course.start_date) : null;
};

/**
 * Get course end date (handles both Unix timestamp and date string)
 * @param {Object} course - Course object
 * @returns {Date|null} - Date object or null
 */
export const getCourseEndDate = (course) => {
  if (course.enddate) {
    return new Date(course.enddate * 1000);
  }
  return course.end_date ? new Date(course.end_date) : null;
};

/**
 * Check if a course falls within a date range
 * @param {Object} course - Course object
 * @param {Object} dateRange - { start: Date, end: Date }
 * @returns {boolean}
 */
export const isCourseInDateRange = (course, dateRange) => {
  if (!dateRange) return true;
  
  const courseStartDate = getCourseStartDate(course);
  if (!courseStartDate) return false;
  
  const normalizedDate = new Date(courseStartDate);
  normalizedDate.setHours(0, 0, 0, 0);
  
  return normalizedDate >= dateRange.start && normalizedDate <= dateRange.end;
};

