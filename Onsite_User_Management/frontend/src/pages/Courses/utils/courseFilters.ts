import { useMemo } from 'react';
import { getCourseStatus } from '../../../utils/courseUtils';
import { getDateRange, getCourseStartDate, getCourseEndDate } from '../../../utils/dateRangeUtils';
import type { Course, CourseType, TimePeriod } from '../../../types';

export { getDateRange } from '../../../utils/dateRangeUtils';

interface CourseWithCategory extends Course {
  categoryname?: string;
  is_mandatory?: boolean;
}

export const useFilteredCourses = (
  allCourses: CourseWithCategory[],
  courseType: CourseType,
  status: string,
  searchQuery: string,
  selectedSearchCourse: CourseWithCategory | null,
  timePeriod: TimePeriod,
  selectedMonth: string,
  selectedQuarter: string,
  selectedYear: number,
  selectedDepartment: string,
  selectedCategory: string,
  mandatoryFilter: string = '' // 'mandatory', 'optional', or '' for all
): CourseWithCategory[] => {
  return useMemo(() => {
    let filtered = [...allCourses];

    if (searchQuery.trim() && !selectedSearchCourse) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (course) =>
          course.name?.toLowerCase().includes(query) ||
          course.batch_code?.toLowerCase().includes(query) ||
          course.description?.toLowerCase().includes(query)
      );
    } else if (selectedSearchCourse) {
      filtered = filtered.filter((course) => course.id === selectedSearchCourse.id);
    }

    if (selectedCategory && courseType === 'online') {
      filtered = filtered.filter((course) => course.categoryname === selectedCategory);
    }

    // Filter by mandatory status for online courses
    if (mandatoryFilter && courseType === 'online') {
      if (mandatoryFilter === 'mandatory') {
        filtered = filtered.filter((course) => course.is_mandatory === true);
      } else if (mandatoryFilter === 'optional') {
        filtered = filtered.filter((course) => course.is_mandatory !== true);
      }
    }

    // Sort mandatory courses first for online courses
    if (courseType === 'online') {
      filtered.sort((a, b) => {
        // Mandatory courses first
        if (a.is_mandatory && !b.is_mandatory) return -1;
        if (!a.is_mandatory && b.is_mandatory) return 1;
        return 0;
      });
    }

    if (status !== 'all' && courseType === 'onsite') {
      filtered = filtered.filter((course) => {
        const courseStatus = getCourseStatus(course as any);
        return courseStatus === status;
      });
    } else if (status !== 'all' && courseType === 'online') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      filtered = filtered.filter((course) => {
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

    const dateRange = getDateRange(timePeriod, selectedMonth, selectedQuarter, selectedYear);
    if (dateRange) {
      const { start: periodStart, end: periodEnd } = dateRange;
      filtered = filtered.filter((course) => {
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
    selectedCategory,
    mandatoryFilter,
  ]);
};

