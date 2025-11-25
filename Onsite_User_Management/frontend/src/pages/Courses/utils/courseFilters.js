import { useMemo } from 'react';
import { getCourseStatus } from '../../../utils/courseUtils';
import { getDateRange, getCourseStartDate, getCourseEndDate } from '../../../utils/dateRangeUtils';

// Re-export getDateRange for backward compatibility
export { getDateRange } from '../../../utils/dateRangeUtils';

/**
 * Filter courses based on various criteria
 */
export const useFilteredCourses = (
  allCourses,
  courseType,
  status,
  searchQuery,
  selectedSearchCourse,
  timePeriod,
  selectedMonth,
  selectedQuarter,
  selectedYear,
  selectedDepartment,
  selectedCategory
) => {
  return useMemo(() => {
    let filtered = [...allCourses];

    // Filter by search query
    if (searchQuery.trim() && !selectedSearchCourse) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(course =>
        course.name?.toLowerCase().includes(query) ||
        course.batch_code?.toLowerCase().includes(query) ||
        course.description?.toLowerCase().includes(query)
      );
    } else if (selectedSearchCourse) {
      filtered = filtered.filter(course => course.id === selectedSearchCourse.id);
    }

    // Filter by department (for onsite courses)
    if (selectedDepartment && courseType === 'onsite') {
      // This would need to be implemented based on how department is stored
      // For now, we'll skip this filter
    }

    // Filter by category (for online courses)
    if (selectedCategory && courseType === 'online') {
      filtered = filtered.filter(course => course.categoryname === selectedCategory);
    }

    // Filter by status
    if (status !== 'all' && courseType === 'onsite') {
      filtered = filtered.filter(course => {
        const courseStatus = getCourseStatus(course);
        return courseStatus === status;
      });
    } else if (status !== 'all' && courseType === 'online') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(course => {
        const courseStartDate = getCourseStartDate(course);
        const courseEndDate = getCourseEndDate(course);
        
        if (!courseStartDate) return false;
        const normalizedStart = new Date(courseStartDate);
        normalizedStart.setHours(0, 0, 0, 0);
        const normalizedEnd = courseEndDate ? new Date(courseEndDate) : null;
        if (normalizedEnd) {
          normalizedEnd.setHours(0, 0, 0, 0);
        }
        
        if (status === 'upcoming') {
          return normalizedStart > today;
        } else if (status === 'ongoing') {
          return normalizedStart <= today && (!normalizedEnd || normalizedEnd >= today);
        } else if (status === 'completed') {
          return normalizedEnd && normalizedEnd < today;
        }
        return true;
      });
    }

    // Filter by time period
    const dateRange = getDateRange(timePeriod, selectedMonth, selectedQuarter, selectedYear);
    if (dateRange) {
      const { start: periodStart, end: periodEnd } = dateRange;
      filtered = filtered.filter(course => {
        const courseStartDate = getCourseStartDate(course);
        if (!courseStartDate) return false;
        const normalizedDate = new Date(courseStartDate);
        normalizedDate.setHours(0, 0, 0, 0);
        return normalizedDate >= periodStart && normalizedDate <= periodEnd;
      });
    }

    return filtered;
  }, [
    allCourses,
    courseType,
    status,
    searchQuery,
    selectedSearchCourse,
    timePeriod,
    selectedMonth,
    selectedQuarter,
    selectedYear,
    selectedDepartment,
    selectedCategory,
  ]);
};

