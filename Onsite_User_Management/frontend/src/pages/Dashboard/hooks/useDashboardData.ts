import { useState, useEffect } from 'react';
import { coursesAPI, enrollmentsAPI, lmsAPI } from '../../../services/api';
import { filterOnlineCourses, filterOnsiteCourses } from '../utils/courseFilters';
import { getDateRange } from '../utils/dateHelpers';
import { convertSchedulesToEvents } from '../utils/calendarHelpers';
import type { Course, CourseType, TimePeriod } from '../../../types';

// NOTE: All data is fetched from local database only.
// LMS/ERP data is synced via cron job at 12am daily.

interface CourseWithTimestamps extends Course {
  startdate?: number;
  enddate?: number;
  fullname?: string;
  categoryname?: string;
  categoryid?: number;
  visible?: boolean;
  is_lms_course?: boolean;
  current_enrolled?: number;
}

interface DashboardStats {
  activeEmployees: number;
  previousEmployees: number;
  upcomingCourses: number;
  ongoingCourses: number;
  planningCourses: number;
  completedCourses: number;
  totalEnrollments: number;
  approvedEnrollments: number;
  pendingEnrollments: number;
  withdrawnEnrollments: number;
  completedEnrollments: number;
  notEligibleEnrollments: number;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: Record<string, any>;
}

interface UseDashboardDataReturn {
  loading: boolean;
  filteredUpcomingCourses: CourseWithTimestamps[];
  filteredOngoingCourses: CourseWithTimestamps[];
  filteredPlanningCourses: CourseWithTimestamps[];
  filteredCompletedCourses: CourseWithTimestamps[];
  calendarEvents: CalendarEvent[];
  stats: DashboardStats;
}

export const useDashboardData = (
  courseType: CourseType,
  timePeriod: TimePeriod,
  selectedMonth: string,
  selectedQuarter: string,
  selectedYear: number
): UseDashboardDataReturn => {
  const [loading, setLoading] = useState(true);
  const [filteredUpcomingCourses, setFilteredUpcomingCourses] = useState<CourseWithTimestamps[]>([]);
  const [filteredOngoingCourses, setFilteredOngoingCourses] = useState<CourseWithTimestamps[]>([]);
  const [filteredPlanningCourses, setFilteredPlanningCourses] = useState<CourseWithTimestamps[]>([]);
  const [filteredCompletedCourses, setFilteredCompletedCourses] = useState<CourseWithTimestamps[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    activeEmployees: 0,
    previousEmployees: 0,
    upcomingCourses: 0,
    ongoingCourses: 0,
    planningCourses: 0,
    completedCourses: 0,
    totalEnrollments: 0,
    approvedEnrollments: 0,
    pendingEnrollments: 0,
    withdrawnEnrollments: 0,
    completedEnrollments: 0,
    notEligibleEnrollments: 0,
  });

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timePeriod, selectedMonth, selectedQuarter, selectedYear, courseType]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      let fetchedCourses: CourseWithTimestamps[] = [];

      if (courseType === 'online') {
        try {
          const lmsResponse = await lmsAPI.getCourses();
          const lmsCourses = (lmsResponse.data as { courses?: any[] }).courses || [];
          fetchedCourses = lmsCourses.map((course: any) => ({
            id: course.id,
            name: course.fullname,
            fullname: course.fullname,
            batch_code: course.shortname || '',
            description: course.summary || '',
            start_date: course.startdate
              ? new Date(course.startdate * 1000).toISOString().split('T')[0]
              : '',
            end_date: course.enddate
              ? new Date(course.enddate * 1000).toISOString().split('T')[0]
              : undefined,
            startdate: course.startdate,
            enddate: course.enddate,
            categoryname: course.categoryname || 'Unknown',
            categoryid: course.categoryid,
            course_type: 'online' as const,
            seat_limit: 0,
            current_enrolled: 0,
            status: 'ongoing' as const,
            visible: course.visible === 1,
            is_lms_course: true,
            is_mandatory: course.is_mandatory || false,
          }));
        } catch (lmsError) {
          console.error('Error fetching LMS courses:', lmsError);
          fetchedCourses = [];
        }
      } else {
        const coursesRes = await coursesAPI.getAll();
        fetchedCourses = coursesRes.data as CourseWithTimestamps[];
      }

      const filteredByType = fetchedCourses.filter((c) => {
        const courseTypeValue = c.course_type || 'onsite';
        return courseTypeValue === courseType;
      });

      const dateRange = getDateRange(timePeriod, selectedMonth, selectedQuarter, selectedYear);

      let filteredUpcoming: CourseWithTimestamps[];
      let filteredOngoing: CourseWithTimestamps[];
      let filteredPlanning: CourseWithTimestamps[];
      let filteredCompleted: CourseWithTimestamps[];

      if (courseType === 'online') {
        const filtered = filterOnlineCourses(filteredByType as any, dateRange);
        filteredUpcoming = filtered.upcoming as CourseWithTimestamps[];
        filteredOngoing = filtered.ongoing as CourseWithTimestamps[];
        filteredPlanning = filtered.planning as CourseWithTimestamps[];
        filteredCompleted = filtered.completed as CourseWithTimestamps[];
      } else {
        const filtered = filterOnsiteCourses(filteredByType as any, dateRange);
        filteredUpcoming = filtered.upcoming as CourseWithTimestamps[];
        filteredOngoing = filtered.ongoing as CourseWithTimestamps[];
        filteredPlanning = filtered.planning as CourseWithTimestamps[];
        filteredCompleted = filtered.completed as CourseWithTimestamps[];
      }

      setFilteredUpcomingCourses(filteredUpcoming);
      setFilteredOngoingCourses(filteredOngoing);
      setFilteredPlanningCourses(filteredPlanning);
      setFilteredCompletedCourses(filteredCompleted);

      // Use all fetched courses for calendar events, not just filtered by type
      // This ensures calendar shows both onsite and external courses regardless of tab
      const events = convertSchedulesToEvents(fetchedCourses as any, courseType);
      setCalendarEvents(events as CalendarEvent[]);

      const statsRes = await enrollmentsAPI.getDashboardStats();
      const statsData: any = statsRes.data;

      setStats({
        activeEmployees: 0,
        previousEmployees: statsData.previous_employees || 0,
        upcomingCourses: filteredUpcoming.length,
        ongoingCourses: filteredOngoing.length,
        planningCourses: filteredPlanning.length,
        completedCourses: filteredCompleted.length,
        totalEnrollments: statsData.total_enrollments || 0,
        approvedEnrollments: statsData.approved_enrollments || 0,
        pendingEnrollments: statsData.pending_enrollments || 0,
        withdrawnEnrollments: statsData.withdrawn_enrollments || 0,
        completedEnrollments: statsData.completed_enrollments || 0,
        notEligibleEnrollments: statsData.not_eligible_enrollments || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    filteredUpcomingCourses,
    filteredOngoingCourses,
    filteredPlanningCourses,
    filteredCompletedCourses,
    calendarEvents,
    stats,
  };
};

