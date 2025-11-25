/**
 * Course-related utility functions
 */

import type { Course, CourseStatus } from '../types';

interface CourseWithStatus {
  status?: string | CourseStatus;
  start_date?: string | null;
  end_date?: string | null;
}

/**
 * Get the status of a course based on its status field or date-based logic
 */
export const getCourseStatus = (course: CourseWithStatus): string => {
  // Use status field if available, otherwise fall back to date-based logic
  if (course.status) {
    const statusStr = String(course.status).toLowerCase();
    // Map 'draft' status to 'planning' for display
    if (statusStr === 'draft') {
      return 'planning';
    }
    // Map enum values to lowercase strings
    return statusStr;
  }

  // Fallback to date-based logic if status field is not available
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = course.start_date ? new Date(course.start_date) : null;
  if (startDate) {
    startDate.setHours(0, 0, 0, 0);
  }

  const endDate = course.end_date ? new Date(course.end_date) : null;
  if (endDate) {
    endDate.setHours(0, 0, 0, 0);
  }

  if (startDate && startDate > today) {
    return 'planning';
  } else if (endDate && endDate < today) {
    return 'completed';
  } else {
    return 'ongoing';
  }
};

/**
 * Check if a course is in planning status
 */
export const isPlanning = (course: CourseWithStatus): boolean => {
  return getCourseStatus(course) === 'planning';
};

/**
 * Check if a course is ongoing
 */
export const isOngoing = (course: CourseWithStatus): boolean => {
  return getCourseStatus(course) === 'ongoing';
};

/**
 * Check if a course is completed
 */
export const isCompleted = (course: CourseWithStatus): boolean => {
  return getCourseStatus(course) === 'completed';
};

/**
 * Get status color for Material UI chips
 */
export const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  switch (status.toLowerCase()) {
    case 'planning':
    case 'draft':
      return 'warning';
    case 'upcoming':
      return 'info';
    case 'ongoing':
      return 'primary';
    case 'completed':
      return 'success';
    default:
      return 'default';
  }
};

