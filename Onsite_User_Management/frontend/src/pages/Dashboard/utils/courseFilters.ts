import { getCourseStatus } from '../../../utils/courseUtils';
import { getCourseStartDate, getCourseEndDate } from '../../../utils/dateRangeUtils';
import type { Course, DateRange } from '../../../types';

// Re-export for backward compatibility
export { getCourseStartDate };

interface CourseWithTimestamps extends Course {
  enddate?: number;
  startdate?: number;
}

interface FilterResult {
  upcoming: CourseWithTimestamps[];
  ongoing: CourseWithTimestamps[];
  planning: CourseWithTimestamps[];
  completed: CourseWithTimestamps[];
}

/**
 * Filter courses by status for online courses
 */
export const filterOnlineCourses = (
  courses: CourseWithTimestamps[],
  dateRange: DateRange | null = null
): FilterResult => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let upcoming = courses.filter((c) => {
    const courseStartDate = getCourseStartDate(c);
    if (!courseStartDate) return false;
    courseStartDate.setHours(0, 0, 0, 0);
    return courseStartDate > today;
  });

  let ongoing = courses.filter((c) => {
    const courseStartDate = getCourseStartDate(c);
    const courseEndDate = c.enddate
      ? new Date(c.enddate * 1000)
      : c.end_date
        ? new Date(c.end_date)
        : null;
    if (!courseStartDate) return false;
    courseStartDate.setHours(0, 0, 0, 0);
    if (courseEndDate) {
      courseEndDate.setHours(0, 0, 0, 0);
    }
    return courseStartDate <= today && (!courseEndDate || courseEndDate >= today);
  });

  let completed = courses.filter((c) => {
    const courseEndDate = c.enddate
      ? new Date(c.enddate * 1000)
      : c.end_date
        ? new Date(c.end_date)
        : null;
    if (!courseEndDate) return false;
    courseEndDate.setHours(0, 0, 0, 0);
    return courseEndDate < today;
  });

  if (dateRange) {
    const { start: periodStart, end: periodEnd } = dateRange;

    upcoming = courses.filter((c) => {
      const courseStartDate = getCourseStartDate(c);
      if (!courseStartDate) return false;
      courseStartDate.setHours(0, 0, 0, 0);
      return courseStartDate > today && courseStartDate >= periodStart && courseStartDate <= periodEnd;
    });

    ongoing = courses.filter((c) => {
      const courseStartDate = getCourseStartDate(c);
      const courseEndDate = c.enddate
        ? new Date(c.enddate * 1000)
        : c.end_date
          ? new Date(c.end_date)
          : null;
      if (!courseStartDate) return false;
      courseStartDate.setHours(0, 0, 0, 0);
      if (courseEndDate) {
        courseEndDate.setHours(0, 0, 0, 0);
      }
      const isOngoing = courseStartDate <= today && (!courseEndDate || courseEndDate >= today);
      if (!isOngoing) return false;
      const startsBeforePeriodEnd = courseStartDate <= periodEnd;
      const endsAfterPeriodStart = !courseEndDate || courseEndDate >= periodStart;
      return startsBeforePeriodEnd && endsAfterPeriodStart;
    });

    completed = courses.filter((c) => {
      const courseEndDate = c.enddate
        ? new Date(c.enddate * 1000)
        : c.end_date
          ? new Date(c.end_date)
          : null;
      if (!courseEndDate) return false;
      courseEndDate.setHours(0, 0, 0, 0);
      return courseEndDate < today && courseEndDate >= periodStart && courseEndDate <= periodEnd;
    });
  }

  return { upcoming, ongoing, planning: [], completed };
};

/**
 * Filter courses by status for onsite courses
 */
export const filterOnsiteCourses = (
  courses: CourseWithTimestamps[],
  dateRange: DateRange | null = null
): FilterResult => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let upcoming = courses.filter((c) => {
    const courseStatus = getCourseStatus(c as any);
    const courseStartDate = getCourseStartDate(c);
    if (!courseStartDate) return false;
    courseStartDate.setHours(0, 0, 0, 0);
    return (courseStatus === 'ongoing' || courseStatus === 'planning') && courseStartDate > today;
  });

  let ongoing = courses.filter((c) => {
    const courseStatus = getCourseStatus(c as any);
    if (courseStatus !== 'ongoing') return false;
    const courseStartDate = getCourseStartDate(c);
    if (!courseStartDate) return false;
    courseStartDate.setHours(0, 0, 0, 0);
    return courseStartDate <= today;
  });

  const planning = courses.filter((c) => {
    const courseStatus = getCourseStatus(c as any);
    if (courseStatus === 'ongoing') {
      const courseStartDate = getCourseStartDate(c);
      if (!courseStartDate) return false;
      courseStartDate.setHours(0, 0, 0, 0);
      if (courseStartDate > today) return false;
    }
    return courseStatus === 'planning';
  });

  const completed = courses.filter((c) => getCourseStatus(c as any) === 'completed');

  if (dateRange) {
    const { start: periodStart, end: periodEnd } = dateRange;

    upcoming = courses.filter((c) => {
      const courseStatus = getCourseStatus(c as any);
      const courseStartDate = getCourseStartDate(c);
      if (!courseStartDate) return false;
      courseStartDate.setHours(0, 0, 0, 0);
      const isUpcoming = (courseStatus === 'ongoing' || courseStatus === 'planning') && courseStartDate > today;
      if (!isUpcoming) return false;
      return courseStartDate >= periodStart && courseStartDate <= periodEnd;
    });

    ongoing = courses.filter((c) => {
      const courseStatusStr = c.status ? String(c.status).toLowerCase() : '';
      const isOngoingStatus = courseStatusStr === 'ongoing';

      if (isOngoingStatus) {
        const courseStartDate = getCourseStartDate(c);
        if (!courseStartDate) return false;
        courseStartDate.setHours(0, 0, 0, 0);
        const courseEndDate = c.enddate
          ? new Date(c.enddate * 1000)
          : c.end_date
            ? new Date(c.end_date)
            : null;
        if (courseEndDate) {
          courseEndDate.setHours(0, 0, 0, 0);
        }

        if (courseEndDate && courseEndDate >= periodStart && courseEndDate <= periodEnd) {
          return true;
        }

        const startedByPeriodEnd = courseStartDate <= periodEnd;
        return startedByPeriodEnd;
      }

      const courseStartDate = getCourseStartDate(c);
      if (!courseStartDate) return false;
      courseStartDate.setHours(0, 0, 0, 0);
      const courseEndDate = c.enddate
        ? new Date(c.enddate * 1000)
        : c.end_date
          ? new Date(c.end_date)
          : null;
      if (courseEndDate) {
        courseEndDate.setHours(0, 0, 0, 0);
      }

      if (courseStatusStr === 'draft' || courseStatusStr === 'completed') {
        return false;
      }

      if (courseEndDate && courseEndDate >= periodStart && courseEndDate <= periodEnd) {
        return false;
      }

      const startedByPeriodEnd = courseStartDate <= periodEnd;
      const endsAfterPeriod = courseEndDate ? courseEndDate > periodEnd : true;
      const noEndDate = !courseEndDate;

      if (!startedByPeriodEnd) {
        return false;
      }

      return endsAfterPeriod || noEndDate;
    });

    const filteredCompleted = courses.filter((c) => {
      const courseStatusStr = c.status ? String(c.status).toLowerCase() : '';
      const isCompletedStatus = courseStatusStr === 'completed';

      const courseEndDate = c.enddate
        ? new Date(c.enddate * 1000)
        : c.end_date
          ? new Date(c.end_date)
          : null;
      if (!courseEndDate && !isCompletedStatus) {
        return false;
      }

      if (courseEndDate) {
        courseEndDate.setHours(0, 0, 0, 0);
        if (isCompletedStatus) {
          return courseEndDate >= periodStart && courseEndDate <= periodEnd;
        }
        return courseEndDate >= periodStart && courseEndDate <= periodEnd;
      }

      return isCompletedStatus;
    });

    const filteredPlanning = courses.filter((c) => {
      const courseStatusStr = c.status ? String(c.status).toLowerCase() : '';

      if (courseStatusStr === 'ongoing' || courseStatusStr === 'completed') {
        return false;
      }

      if (courseStatusStr === 'draft') {
        return true;
      }

      const courseStartDate = getCourseStartDate(c);
      if (!courseStartDate) return false;
      courseStartDate.setHours(0, 0, 0, 0);
      const courseEndDate = c.enddate
        ? new Date(c.enddate * 1000)
        : c.end_date
          ? new Date(c.end_date)
          : null;
      if (courseEndDate) {
        courseEndDate.setHours(0, 0, 0, 0);
      }

      if (courseEndDate && courseEndDate >= periodStart && courseEndDate <= periodEnd) {
        return false;
      }

      const startedByPeriodEnd = courseStartDate <= periodEnd;
      const endsAfterPeriod = courseEndDate ? courseEndDate > periodEnd : true;
      const noEndDate = !courseEndDate;
      if (startedByPeriodEnd && (endsAfterPeriod || noEndDate)) {
        return false;
      }

      if (courseStartDate > periodEnd) {
        return true;
      }

      if (courseStartDate >= periodStart && courseStartDate <= periodEnd) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return courseStartDate > today;
      }

      return false;
    });

    return { upcoming, ongoing, planning: filteredPlanning, completed: filteredCompleted };
  }

  return { upcoming, ongoing, planning, completed };
};

