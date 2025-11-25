import { useState, useEffect } from 'react';
import { coursesAPI, enrollmentsAPI, lmsAPI } from '../../../services/api';
import { filterOnlineCourses, filterOnsiteCourses } from '../utils/courseFilters';
import { getDateRange } from '../utils/dateHelpers';
import { convertSchedulesToEvents } from '../utils/calendarHelpers';

export const useDashboardData = (courseType, timePeriod, selectedMonth, selectedQuarter, selectedYear) => {
  const [loading, setLoading] = useState(true);
  const [filteredUpcomingCourses, setFilteredUpcomingCourses] = useState([]);
  const [filteredOngoingCourses, setFilteredOngoingCourses] = useState([]);
  const [filteredPlanningCourses, setFilteredPlanningCourses] = useState([]);
  const [filteredCompletedCourses, setFilteredCompletedCourses] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [stats, setStats] = useState({
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
  }, [timePeriod, selectedMonth, selectedQuarter, selectedYear, courseType]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      let fetchedCourses = [];
      
      // Fetch courses based on course type
      if (courseType === 'online') {
        try {
          const lmsResponse = await lmsAPI.getCourses();
          const lmsCourses = lmsResponse.data.courses || [];
          fetchedCourses = lmsCourses.map(course => ({
            id: course.id,
            name: course.fullname,
            fullname: course.fullname,
            batch_code: course.shortname || '',
            description: course.summary || '',
            start_date: course.startdate ? new Date(course.startdate * 1000).toISOString().split('T')[0] : null,
            end_date: course.enddate ? new Date(course.enddate * 1000).toISOString().split('T')[0] : null,
            startdate: course.startdate,
            enddate: course.enddate,
            categoryname: course.categoryname || 'Unknown',
            categoryid: course.categoryid,
            course_type: 'online',
            seat_limit: 0,
            current_enrolled: 0,
            status: 'ongoing',
            visible: course.visible === 1,
            is_lms_course: true,
          }));
        } catch (lmsError) {
          console.error('Error fetching LMS courses:', lmsError);
          fetchedCourses = [];
        }
      } else {
        const coursesRes = await coursesAPI.getAll();
        fetchedCourses = coursesRes.data;
      }

      // Filter by course type
      const filteredByType = fetchedCourses.filter(c => {
        const courseTypeValue = c.course_type || 'onsite';
        return courseTypeValue === courseType;
      });

      // Get date range for filtering
      const dateRange = getDateRange(timePeriod, selectedMonth, selectedQuarter, selectedYear);

      // Filter courses by status
      let filteredUpcoming, filteredOngoing, filteredPlanning, filteredCompleted;
      
      if (courseType === 'online') {
        const filtered = filterOnlineCourses(filteredByType, dateRange);
        filteredUpcoming = filtered.upcoming;
        filteredOngoing = filtered.ongoing;
        filteredPlanning = [];
        filteredCompleted = [];
      } else {
        const filtered = filterOnsiteCourses(filteredByType, dateRange);
        filteredUpcoming = filtered.upcoming;
        filteredOngoing = filtered.ongoing;
        filteredPlanning = filtered.planning;
        filteredCompleted = filtered.completed;
      }

      // Store filtered courses
      setFilteredUpcomingCourses(filteredUpcoming);
      setFilteredOngoingCourses(filteredOngoing);
      setFilteredPlanningCourses(filteredPlanning);
      setFilteredCompletedCourses(filteredCompleted);

      // Convert schedules to calendar events
      const events = convertSchedulesToEvents(filteredByType, courseType);
      setCalendarEvents(events);

      // Fetch dashboard statistics
      const statsRes = await enrollmentsAPI.getDashboardStats();
      const statsData = statsRes.data;

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

