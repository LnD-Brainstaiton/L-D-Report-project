import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  useTheme,
  alpha,
  Chip,
  TextField,
  MenuItem,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Tabs,
  Tab,
} from '@mui/material';
import {
  People,
  CheckCircle,
  ArrowForward,
  PlayCircle,
  Event,
  CalendarToday,
  Schedule,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { coursesAPI, enrollmentsAPI, lmsAPI } from '../services/api';
import { getCourseStatus } from '../utils/courseUtils';
import { formatDateRange as formatDateRangeUtil, formatDateForDisplay, convertTo12HourFormat } from '../utils/dateUtils';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

function Dashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courseType, setCourseType] = useState('onsite'); // 'onsite', 'online', 'external'
  const [status, setStatus] = useState('upcoming'); // For online/external: 'upcoming' or 'ongoing'. For onsite: 'upcoming', 'ongoing', 'planning', 'completed'
  const [timePeriod, setTimePeriod] = useState('all'); // 'all', 'year', 'month', 'quarter'
  const [selectedMonth, setSelectedMonth] = useState(''); // Selected month (0-11) for month filter
  const [selectedQuarter, setSelectedQuarter] = useState(''); // Selected quarter (1-4) for quarter filter
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // Selected year
  const [filteredUpcomingCourses, setFilteredUpcomingCourses] = useState([]);
  const [filteredOngoingCourses, setFilteredOngoingCourses] = useState([]);
  const [filteredPlanningCourses, setFilteredPlanningCourses] = useState([]);
  const [filteredCompletedCourses, setFilteredCompletedCourses] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  // Track how many courses to display in each stat card
  const [displayCounts, setDisplayCounts] = useState({
    upcoming: 10,
    ongoing: 10,
    planning: 10,
    completed: 10,
  });
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
    // Reset status when course type changes
    if (courseType === 'onsite') {
      setStatus('planning'); // Default for onsite - changed to planning
    } else {
      setStatus('upcoming'); // Default for online/external
    }
  }, [courseType]);

  useEffect(() => {
    fetchDashboardData();
  }, [timePeriod, selectedMonth, selectedQuarter, selectedYear, courseType, status]);


  const getDateRange = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (timePeriod) {
      case 'month':
        if (selectedMonth !== '' && selectedYear) {
          const monthIndex = parseInt(selectedMonth);
          const monthStart = new Date(selectedYear, monthIndex, 1);
          // Get last day of the month
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

  const formatDateRange = () => {
    const dateRange = getDateRange();
    if (!dateRange) return 'All Time';
    
    if (timePeriod === 'month' && selectedMonth !== '') {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
      return `${monthNames[parseInt(selectedMonth)]} ${selectedYear}`;
    }
    
    if (timePeriod === 'quarter' && selectedQuarter !== '') {
      return `Q${selectedQuarter} ${selectedYear}`;
    }
    
    if (timePeriod === 'year') {
      return `${selectedYear}`;
    }
    
    return formatDateRangeUtil(dateRange.start, dateRange.end);
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      let fetchedCourses = [];
      
      // Fetch courses based on course type
      if (courseType === 'online') {
        // Fetch from LMS API
        try {
          const lmsResponse = await lmsAPI.getCourses();
          const lmsCourses = lmsResponse.data.courses || [];
          // Map LMS courses to our course format
          fetchedCourses = lmsCourses.map(course => ({
            id: course.id,
            name: course.fullname,
            fullname: course.fullname,
            batch_code: course.shortname || '',
            description: course.summary || '',
            start_date: course.startdate ? new Date(course.startdate * 1000).toISOString().split('T')[0] : null,
            end_date: course.enddate ? new Date(course.enddate * 1000).toISOString().split('T')[0] : null,
            startdate: course.startdate, // Unix timestamp
            enddate: course.enddate, // Unix timestamp
            categoryname: course.categoryname || 'Unknown',
            categoryid: course.categoryid,
            course_type: 'online',
            seat_limit: 0,
            current_enrolled: 0,
            status: 'ongoing', // Default status for LMS courses
            visible: course.visible === 1,
            is_lms_course: true,
          }));
        } catch (lmsError) {
          console.error('Error fetching LMS courses:', lmsError);
          fetchedCourses = [];
        }
      } else {
        // Fetch from regular API for onsite and external
        const coursesRes = await coursesAPI.getAll();
        fetchedCourses = coursesRes.data;
      }

      // Filter by course type
      const filteredByType = fetchedCourses.filter(c => {
        const courseTypeValue = c.course_type || 'onsite';
        return courseTypeValue === courseType;
      });

      // Get today's date for upcoming logic
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Helper function to get course start date (handles both Unix timestamp and date string)
      const getCourseStartDate = (course) => {
        if (course.startdate) {
          return new Date(course.startdate * 1000);
        }
        return course.start_date ? new Date(course.start_date) : null;
      };

      // Categorize courses - different logic for online vs onsite
      let upcomingCourses = [];
      let ongoingCourses = [];
      
      if (courseType === 'online') {
        // For online courses: use date-based logic only
        upcomingCourses = filteredByType.filter(c => {
          const courseStartDate = getCourseStartDate(c);
          if (!courseStartDate) return false;
          courseStartDate.setHours(0, 0, 0, 0);
          return courseStartDate > today;
        });
        
        ongoingCourses = filteredByType.filter(c => {
          const courseStartDate = getCourseStartDate(c);
          const courseEndDate = c.enddate ? new Date(c.enddate * 1000) : (c.end_date ? new Date(c.end_date) : null);
          if (!courseStartDate) return false;
          courseStartDate.setHours(0, 0, 0, 0);
          if (courseEndDate) {
            courseEndDate.setHours(0, 0, 0, 0);
          }
          // Ongoing: started and not ended (or no end date)
          return courseStartDate <= today && (!courseEndDate || courseEndDate >= today);
        });
      } else {
        // For onsite courses: use status-based logic
        upcomingCourses = filteredByType.filter(c => {
          const courseStatus = getCourseStatus(c);
          const courseStartDate = getCourseStartDate(c);
          if (!courseStartDate) return false;
          courseStartDate.setHours(0, 0, 0, 0);
          return (courseStatus === 'ongoing' || courseStatus === 'planning') && courseStartDate > today;
        });

        ongoingCourses = filteredByType.filter(c => {
          const courseStatus = getCourseStatus(c);
          if (courseStatus !== 'ongoing') return false;
          const courseStartDate = getCourseStartDate(c);
          if (!courseStartDate) return false;
          courseStartDate.setHours(0, 0, 0, 0);
          return courseStartDate <= today;
        });
      }

      const planningCourses = filteredByType.filter(c => {
        const courseStatus = getCourseStatus(c);
        if (courseStatus === 'ongoing') {
          // Exclude ongoing courses that are upcoming
          const courseStartDate = getCourseStartDate(c);
          if (!courseStartDate) return false;
          courseStartDate.setHours(0, 0, 0, 0);
          if (courseStartDate > today) return false;
        }
        return courseStatus === 'planning';
      });

      const completedCourses = filteredByType.filter(c => getCourseStatus(c) === 'completed');

      // Filter courses by time period if needed
      const dateRange = getDateRange();
      let filteredUpcoming = upcomingCourses;
      let filteredOngoing = ongoingCourses;
      let filteredPlanning = planningCourses;
      let filteredCompleted = completedCourses;

      if (dateRange) {
        const periodStart = dateRange.start;
        const periodEnd = dateRange.end;
        
        if (courseType === 'online') {
          // For online courses: use date-based filtering only
          filteredUpcoming = filteredByType.filter(c => {
            const courseStartDate = getCourseStartDate(c);
            if (!courseStartDate) return false;
            courseStartDate.setHours(0, 0, 0, 0);
            // Upcoming: start date is in the future and within the period
            return courseStartDate > today && courseStartDate >= periodStart && courseStartDate <= periodEnd;
          });
          
          filteredOngoing = filteredByType.filter(c => {
            const courseStartDate = getCourseStartDate(c);
            const courseEndDate = c.enddate ? new Date(c.enddate * 1000) : (c.end_date ? new Date(c.end_date) : null);
            if (!courseStartDate) return false;
            courseStartDate.setHours(0, 0, 0, 0);
            if (courseEndDate) {
              courseEndDate.setHours(0, 0, 0, 0);
            }
            // Ongoing: started and not ended (or no end date), and active during the period
            const isOngoing = courseStartDate <= today && (!courseEndDate || courseEndDate >= today);
            if (!isOngoing) return false;
            // Check if course is active during the period
            const startsBeforePeriodEnd = courseStartDate <= periodEnd;
            const endsAfterPeriodStart = !courseEndDate || courseEndDate >= periodStart;
            return startsBeforePeriodEnd && endsAfterPeriodStart;
          });
        } else {
          // For onsite courses: use status-based filtering
          // Filter upcoming courses
          filteredUpcoming = filteredByType.filter(c => {
            const courseStatus = getCourseStatus(c);
            const courseStartDate = getCourseStartDate(c);
            if (!courseStartDate) return false;
            courseStartDate.setHours(0, 0, 0, 0);
            const isUpcoming = (courseStatus === 'ongoing' || courseStatus === 'planning') && courseStartDate > today;
            if (!isUpcoming) return false;
            // Check if start date is within the period
            return courseStartDate >= periodStart && courseStartDate <= periodEnd;
          });
        
          // Re-filter all courses based on period logic, but respect status field first
          filteredOngoing = filteredByType.filter(c => {
          // First check the status field - if it's 'ongoing', include it if dates match
          const statusStr = c.status ? String(c.status).toLowerCase() : '';
          const isOngoingStatus = statusStr === 'ongoing';
          
          // If course has status 'ongoing', check if it's active during the period
          if (isOngoingStatus) {
            const courseStartDate = getCourseStartDate(c);
            if (!courseStartDate) return false;
            courseStartDate.setHours(0, 0, 0, 0);
            const courseEndDate = c.enddate ? new Date(c.enddate * 1000) : (c.end_date ? new Date(c.end_date) : null);
            if (courseEndDate) {
              courseEndDate.setHours(0, 0, 0, 0);
            }
            
            // If course has an end date within the period, it might be completed, not ongoing
            if (courseEndDate && courseEndDate >= periodStart && courseEndDate <= periodEnd) {
              // But if status is explicitly 'ongoing', still include it
              return true;
            }
            
            // Course must have started by the end of the period
            const startedByPeriodEnd = courseStartDate <= periodEnd;
            if (!startedByPeriodEnd) {
              return false;
            }
            
            return true;
          }
          
          // For courses without explicit 'ongoing' status, use date-based logic
          const courseStartDate = getCourseStartDate(c);
          if (!courseStartDate) return false;
          courseStartDate.setHours(0, 0, 0, 0);
          const courseEndDate = c.enddate ? new Date(c.enddate * 1000) : (c.end_date ? new Date(c.end_date) : null);
          if (courseEndDate) {
            courseEndDate.setHours(0, 0, 0, 0);
          }
          
          // Exclude draft/completed courses
          if (statusStr === 'draft' || statusStr === 'completed') {
            return false;
          }
          
          // If course has an end date within the period, it's completed, not ongoing
          if (courseEndDate && courseEndDate >= periodStart && courseEndDate <= periodEnd) {
            return false;
          }
          
          // Ongoing: Course is active during the period
          const startedByPeriodEnd = courseStartDate <= periodEnd;
          const endsAfterPeriod = courseEndDate ? courseEndDate > periodEnd : true;
          const noEndDate = !courseEndDate;
          
          // Course must have started by the end of the period
          if (!startedByPeriodEnd) {
            return false;
          }
          
          // If it has an end date, it must end after the period
          // If no end date, it's ongoing
          return endsAfterPeriod || noEndDate;
        });
        
          // Completed: Course ended within the period
          filteredCompleted = filteredByType.filter(c => {
          // First check the status field - if it's 'completed', include it if dates match
          const statusStr = c.status ? String(c.status).toLowerCase() : '';
          const isCompletedStatus = statusStr === 'completed';
          
          const courseEndDate = c.enddate ? new Date(c.enddate * 1000) : (c.end_date ? new Date(c.end_date) : null);
          if (!courseEndDate && !isCompletedStatus) {
            return false;
          }
          
          if (courseEndDate) {
            courseEndDate.setHours(0, 0, 0, 0);
            // If status is 'completed', include if end date is in period
            if (isCompletedStatus) {
              return courseEndDate >= periodStart && courseEndDate <= periodEnd;
            }
            // Otherwise use date-based logic
            return courseEndDate >= periodStart && courseEndDate <= periodEnd;
          }
          
          // If status is 'completed' but no end date, include it
          return isCompletedStatus;
        });
        
          // Planning: Everything that is not completed and not ongoing (and not upcoming)
          // - Courses with draft status
          // - OR courses that haven't started yet (start date is after the period)
          filteredPlanning = filteredByType.filter(c => {
          const statusStr = c.status ? String(c.status).toLowerCase() : '';
          
          // Exclude courses with explicit 'ongoing' or 'completed' status
          if (statusStr === 'ongoing' || statusStr === 'completed') {
            return false;
          }
          
          // Include draft courses
          if (statusStr === 'draft') {
            return true;
          }
          
          // For courses without explicit status, use date-based logic
          const courseStartDate = getCourseStartDate(c);
          if (!courseStartDate) return false;
          courseStartDate.setHours(0, 0, 0, 0);
          const courseEndDate = c.enddate ? new Date(c.enddate * 1000) : (c.end_date ? new Date(c.end_date) : null);
          if (courseEndDate) {
            courseEndDate.setHours(0, 0, 0, 0);
          }
          
          // If it's completed in this period, it's not planning
          if (courseEndDate && courseEndDate >= periodStart && courseEndDate <= periodEnd) {
            return false;
          }
          
          // If it's ongoing in this period, it's not planning
          const startedByPeriodEnd = courseStartDate <= periodEnd;
          const endsAfterPeriod = courseEndDate ? courseEndDate > periodEnd : true;
          const noEndDate = !courseEndDate;
          if (startedByPeriodEnd && (endsAfterPeriod || noEndDate)) {
            return false;
          }
          
          // If course starts after the period, it's planning
          if (courseStartDate > periodEnd) {
            return true;
          }
          
          // If course starts within the period but hasn't started yet (future date), it's planning
          if (courseStartDate >= periodStart && courseStartDate <= periodEnd) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return courseStartDate > today;
          }
          
          return false;
        });
        }
      }

      // Store filtered courses for display
      setFilteredUpcomingCourses(filteredUpcoming);
      setFilteredOngoingCourses(filteredOngoing);
      setFilteredPlanningCourses(filteredPlanning);
      setFilteredCompletedCourses(filteredCompleted);

      // Convert class schedules to FullCalendar events (only for ongoing courses)
      const events = [];
      
      // Generate unique color for each course based on course ID
      const generateCourseColor = (courseId) => {
        // Use a hash function to generate consistent colors per course
        const hash = courseId.toString().split('').reduce((acc, char) => {
          return char.charCodeAt(0) + ((acc << 5) - acc);
        }, 0);
        
        // Generate hue based on course ID (0-360)
        const hue = Math.abs(hash) % 360;
        
        // Use consistent saturation and lightness for ongoing courses
        const saturation = 70;
        const lightness = 45;
        
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      };

      // Only process ongoing courses (not upcoming) for calendar events (onsite only)
      const ongoingCoursesForCalendar = courseType === 'onsite' ? filteredByType.filter(c => {
        const courseStatus = getCourseStatus(c);
        if (courseStatus !== 'ongoing') return false;
        const courseStartDate = getCourseStartDate(c);
        if (!courseStartDate) return false;
        courseStartDate.setHours(0, 0, 0, 0);
        return courseStartDate <= today;
      }) : [];
      
      ongoingCoursesForCalendar.forEach(course => {
        // Generate unique color for this course
        const eventColor = generateCourseColor(course.id);
        
        if (course.class_schedule && Array.isArray(course.class_schedule)) {
          // Handle multiple schedules for the same course
          course.class_schedule.forEach((schedule, scheduleIndex) => {
            // Create recurring events for FullCalendar
            // Map day names to FullCalendar day numbers (0=Sunday, 1=Monday, etc.)
            const dayMap = {
              'Sunday': 0,
              'Monday': 1,
              'Tuesday': 2,
              'Wednesday': 3,
              'Thursday': 4,
              'Friday': 5,
              'Saturday': 6
            };
            
            const dayOfWeek = dayMap[schedule.day];
            if (dayOfWeek !== undefined && schedule.start_time && schedule.end_time) {
              // Create events for the next 12 weeks
              const startDate = new Date();
              startDate.setDate(startDate.getDate() - startDate.getDay()); // Start of current week
              
              for (let week = 0; week < 12; week++) {
                const eventDate = new Date(startDate);
                eventDate.setDate(eventDate.getDate() + (week * 7) + dayOfWeek);
                
                // Only create events if course is within date range
                const courseStart = new Date(course.start_date);
                const courseEnd = course.end_date ? new Date(course.end_date) : null;
                
                if (eventDate >= courseStart && (!courseEnd || eventDate <= courseEnd)) {
                  const [startHour, startMin] = schedule.start_time.split(':').map(Number);
                  const [endHour, endMin] = schedule.end_time.split(':').map(Number);
                  
                  const eventStart = new Date(eventDate);
                  eventStart.setHours(startHour, startMin, 0, 0);
                  
                  const eventEnd = new Date(eventDate);
                  eventEnd.setHours(endHour, endMin, 0, 0);
                  
                  // Create unique ID for each class instance (handles same course, same day, multiple classes)
                  // Format: course-{id}-{day}-{scheduleIndex}-{week}-{time}
                  const eventId = `course-${course.id}-${schedule.day}-${scheduleIndex}-${week}-${schedule.start_time.replace(':', '')}`;
                  
                  // Build title - include time if multiple classes on same day
                  const title = course.class_schedule.filter(s => s.day === schedule.day).length > 1
                    ? `${course.name} (${course.batch_code}) - ${convertTo12HourFormat(schedule.start_time)}`
                    : `${course.name} (${course.batch_code})`;
                  
                  events.push({
                    id: eventId,
                    title: title,
                    start: eventStart.toISOString(),
                    end: eventEnd.toISOString(),
                    backgroundColor: eventColor,
                    borderColor: eventColor,
                    textColor: '#ffffff',
                    extendedProps: {
                      courseId: course.id,
                      courseName: course.name,
                      batchCode: course.batch_code,
                      time: `${convertTo12HourFormat(schedule.start_time)} - ${convertTo12HourFormat(schedule.end_time)}`,
                      day: schedule.day,
                      scheduleIndex: scheduleIndex,
                    },
                  });
                }
              }
            }
          });
        }
      });
      
      setCalendarEvents(events);

      // Fetch dashboard statistics from backend
      const statsRes = await enrollmentsAPI.getDashboardStats();
      const statsData = statsRes.data;

      // Update stats - always show all counts, not filtered by selected status
      // The selected status only filters which courses are displayed in the stat cards
      setStats({
        activeEmployees: 0, // Removed - not needed
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

  const StatCard = ({ title, value, icon, color, onClick, subtitle, courses = [], statusKey }) => {
    const dateRange = getDateRange();
    const showCourses = dateRange !== null && courses.length > 0;
    const displayCount = displayCounts[statusKey] || 10;
    const remainingCount = courses.length - displayCount;
    
    const handleLoadMore = (e) => {
      e.stopPropagation(); // Prevent card click
      setDisplayCounts(prev => ({
        ...prev,
        [statusKey]: Math.min(prev[statusKey] + 20, courses.length), // Load 20 more at a time
      }));
    };
    
    return (
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          border: `1px solid ${alpha(color, 0.15)}`,
          background: `linear-gradient(135deg, ${alpha(color, 0.08)} 0%, ${alpha(color, 0.02)} 100%)`,
          boxShadow: `0 4px 16px ${alpha(color, 0.1)}`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: `0 8px 24px ${alpha(color, 0.15)}`,
            transform: 'translateY(-2px)',
            border: `1px solid ${alpha(color, 0.25)}`,
          },
        }}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: color, mb: 0.5 }}>
                {value}
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.95rem' }}>
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontSize: '0.8rem' }}>
                  {subtitle}
                </Typography>
              )}
            </Box>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                backgroundColor: alpha(color, 0.12),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {icon}
            </Box>
          </Box>
          {onClick && !showCourses && (
            <Box 
              display="flex" 
              alignItems="center" 
              color={color} 
              sx={{ mt: 2, cursor: 'pointer', fontSize: '0.9rem' }}
              onClick={onClick}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, mr: 0.5 }}>
                View Details
              </Typography>
              <ArrowForward fontSize="small" />
            </Box>
          )}
        </CardContent>
        {showCourses && (
          <Box sx={{ borderTop: `1px solid ${alpha(color, 0.15)}`, maxHeight: 300, overflow: 'auto' }}>
            <List dense sx={{ py: 0 }}>
              {courses.slice(0, displayCount).map((course) => (
                <ListItem key={course.id} disablePadding>
                  <ListItemButton
                    onClick={() => {
                      const courseType = course.course_type || 'onsite';
                      navigate(`/courses/${course.id}`, { state: { courseType } });
                    }}
                    sx={{
                      '&:hover': {
                        backgroundColor: alpha(color, 0.08),
                      },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {course.name}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {course.batch_code} • {formatDateForDisplay(course.startdate ? new Date(course.startdate * 1000) : (course.start_date ? new Date(course.start_date) : new Date()))}
                        </Typography>
                      }
                    />
                    <ArrowForward fontSize="small" sx={{ color: color, ml: 1 }} />
                  </ListItemButton>
                </ListItem>
              ))}
              {remainingCount > 0 && (
                <ListItem>
                  <ListItemButton
                    onClick={handleLoadMore}
                    sx={{
                      '&:hover': {
                        backgroundColor: alpha(color, 0.08),
                      },
                      justifyContent: 'center',
                    }}
                  >
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontWeight: 600,
                        color: color,
                        cursor: 'pointer',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      +{remainingCount} more courses
                    </Typography>
                  </ListItemButton>
                </ListItem>
              )}
            </List>
          </Box>
        )}
      </Card>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Box>
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              fontWeight: 700,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.info.main} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '0.95rem' }}>
            Overview of your enrollment management system
          </Typography>
        </Box>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <TextField
            select
            label="Time Period"
            value={timePeriod}
            onChange={(e) => {
              setTimePeriod(e.target.value);
              if (e.target.value === 'all') {
                setSelectedMonth('');
                setSelectedQuarter('');
              }
            }}
            sx={{ minWidth: 150 }}
            size="small"
          >
            <MenuItem value="all">All Time</MenuItem>
            <MenuItem value="month">Month</MenuItem>
            <MenuItem value="quarter">Quarter</MenuItem>
            <MenuItem value="year">Year</MenuItem>
          </TextField>
          {timePeriod === 'month' && (
            <>
              <TextField
                select
                label="Month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                sx={{ minWidth: 150 }}
                size="small"
              >
                <MenuItem value="0">January</MenuItem>
                <MenuItem value="1">February</MenuItem>
                <MenuItem value="2">March</MenuItem>
                <MenuItem value="3">April</MenuItem>
                <MenuItem value="4">May</MenuItem>
                <MenuItem value="5">June</MenuItem>
                <MenuItem value="6">July</MenuItem>
                <MenuItem value="7">August</MenuItem>
                <MenuItem value="8">September</MenuItem>
                <MenuItem value="9">October</MenuItem>
                <MenuItem value="10">November</MenuItem>
                <MenuItem value="11">December</MenuItem>
              </TextField>
              <TextField
                type="number"
                label="Year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                inputProps={{ min: 2000, max: 2100 }}
                sx={{ minWidth: 100 }}
                size="small"
              />
            </>
          )}
          {timePeriod === 'quarter' && (
            <>
              <TextField
                select
                label="Quarter"
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value)}
                sx={{ minWidth: 120 }}
                size="small"
              >
                <MenuItem value="1">Q1 (Jan-Mar)</MenuItem>
                <MenuItem value="2">Q2 (Apr-Jun)</MenuItem>
                <MenuItem value="3">Q3 (Jul-Sep)</MenuItem>
                <MenuItem value="4">Q4 (Oct-Dec)</MenuItem>
              </TextField>
              <TextField
                type="number"
                label="Year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                inputProps={{ min: 2000, max: 2100 }}
                sx={{ minWidth: 100 }}
                size="small"
              />
            </>
          )}
          {timePeriod === 'year' && (
            <TextField
              type="number"
              label="Year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              inputProps={{ min: 2000, max: 2100 }}
              sx={{ minWidth: 100 }}
              size="small"
            />
          )}
          {timePeriod !== 'all' && (
            <Chip
              icon={<CalendarToday />}
              label={formatDateRange()}
              color="primary"
              variant="outlined"
            />
          )}
        </Box>
      </Box>

      {/* Course Type Tabs */}
      <Card sx={{ mb: 3, border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={courseType}
            onChange={(e, newValue) => setCourseType(newValue)}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
                minHeight: 48,
              },
            }}
          >
            <Tab label="Onsite" value="onsite" />
            <Tab label="Online" value="online" />
            <Tab label="External" value="external" />
          </Tabs>
        </Box>
        <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          {courseType === 'onsite' ? (
            <>
              <Chip
                label="Planning"
                onClick={() => setStatus('planning')}
                color={status === 'planning' ? 'primary' : 'default'}
                variant={status === 'planning' ? 'filled' : 'outlined'}
                sx={{ cursor: 'pointer', fontWeight: status === 'planning' ? 600 : 400 }}
              />
              <Chip
                label="Upcoming"
                onClick={() => setStatus('upcoming')}
                color={status === 'upcoming' ? 'primary' : 'default'}
                variant={status === 'upcoming' ? 'filled' : 'outlined'}
                sx={{ cursor: 'pointer', fontWeight: status === 'upcoming' ? 600 : 400 }}
              />
              <Chip
                label="Ongoing"
                onClick={() => setStatus('ongoing')}
                color={status === 'ongoing' ? 'primary' : 'default'}
                variant={status === 'ongoing' ? 'filled' : 'outlined'}
                sx={{ cursor: 'pointer', fontWeight: status === 'ongoing' ? 600 : 400 }}
              />
              <Chip
                label="Completed"
                onClick={() => setStatus('completed')}
                color={status === 'completed' ? 'primary' : 'default'}
                variant={status === 'completed' ? 'filled' : 'outlined'}
                sx={{ cursor: 'pointer', fontWeight: status === 'completed' ? 600 : 400 }}
              />
            </>
          ) : (
            <>
              <Chip
                label="Upcoming"
                onClick={() => setStatus('upcoming')}
                color={status === 'upcoming' ? 'primary' : 'default'}
                variant={status === 'upcoming' ? 'filled' : 'outlined'}
                sx={{ cursor: 'pointer', fontWeight: status === 'upcoming' ? 600 : 400 }}
              />
              <Chip
                label="Ongoing"
                onClick={() => setStatus('ongoing')}
                color={status === 'ongoing' ? 'primary' : 'default'}
                variant={status === 'ongoing' ? 'filled' : 'outlined'}
                sx={{ cursor: 'pointer', fontWeight: status === 'ongoing' ? 600 : 400 }}
              />
            </>
          )}
        </Box>
      </Card>

      {/* Main Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        {courseType === 'onsite' ? (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Planning Courses"
                value={stats.planningCourses}
                icon={<Event sx={{ fontSize: 32, color: theme.palette.info.main }} />}
                color={theme.palette.info.main}
                onClick={() => navigate('/courses/onsite/planning')}
                subtitle={timePeriod !== 'all' ? formatDateRange() : 'Scheduled'}
                courses={status === 'planning' ? filteredPlanningCourses : []}
                statusKey="planning"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Upcoming Courses"
                value={stats.upcomingCourses}
                icon={<Schedule sx={{ fontSize: 32, color: theme.palette.secondary.main }} />}
                color={theme.palette.secondary.main}
                onClick={() => navigate('/courses/onsite/upcoming')}
                subtitle={timePeriod !== 'all' ? formatDateRange() : 'Scheduled to start'}
                courses={status === 'upcoming' ? filteredUpcomingCourses : []}
                statusKey="upcoming"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Ongoing Courses"
                value={stats.ongoingCourses}
                icon={<PlayCircle sx={{ fontSize: 32, color: theme.palette.success.main }} />}
                color={theme.palette.success.main}
                onClick={() => navigate('/courses/onsite/ongoing')}
                subtitle={timePeriod !== 'all' ? formatDateRange() : 'In progress'}
                courses={status === 'ongoing' ? filteredOngoingCourses : []}
                statusKey="ongoing"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Completed Courses"
                value={stats.completedCourses}
                icon={<CheckCircle sx={{ fontSize: 32, color: theme.palette.warning.main }} />}
                color={theme.palette.warning.main}
                onClick={() => navigate('/courses/onsite/completed')}
                subtitle={timePeriod !== 'all' ? formatDateRange() : 'Finished'}
                courses={status === 'completed' ? filteredCompletedCourses : []}
                statusKey="completed"
              />
            </Grid>
          </>
        ) : (
          <>
            <Grid item xs={12} sm={6} md={6}>
              <StatCard
                title="Upcoming Courses"
                value={stats.upcomingCourses}
                icon={<Schedule sx={{ fontSize: 32, color: theme.palette.secondary.main }} />}
                color={theme.palette.secondary.main}
                onClick={() => navigate(`/courses/${courseType}`, { state: { courseType } })}
                subtitle={timePeriod !== 'all' ? formatDateRange() : 'Scheduled to start'}
                courses={status === 'upcoming' ? filteredUpcomingCourses : []}
                statusKey="upcoming"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={6}>
              <StatCard
                title="Ongoing Courses"
                value={stats.ongoingCourses}
                icon={<PlayCircle sx={{ fontSize: 32, color: theme.palette.success.main }} />}
                color={theme.palette.success.main}
                onClick={() => navigate(`/courses/${courseType}`, { state: { courseType } })}
                subtitle={timePeriod !== 'all' ? formatDateRange() : 'In progress'}
                courses={status === 'ongoing' ? filteredOngoingCourses : []}
                statusKey="ongoing"
              />
            </Grid>
          </>
        )}
      </Grid>

      {/* FullCalendar - Only show for onsite courses */}
      {courseType === 'onsite' && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.04)} 0%, ${alpha(theme.palette.info.main, 0.04)} 100%)`,
                boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.08)}`,
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor: alpha(theme.palette.primary.main, 0.12),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CalendarToday sx={{ fontSize: 32, color: theme.palette.primary.main }} />
                    </Box>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                        Class Schedule Calendar
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        View scheduled classes for ongoing courses
                      </Typography>
                    </Box>
                  </Box>
                </Box>

              <Box sx={{ 
                '& .fc': { 
                  fontFamily: theme.typography.fontFamily,
                },
                '& .fc-header-toolbar': {
                  marginBottom: theme.spacing(1),
                  padding: theme.spacing(1),
                },
                '& .fc-toolbar-title': {
                  fontSize: '1.25rem !important',
                  fontWeight: 600,
                },
                '& .fc-button': {
                  backgroundColor: theme.palette.primary.main,
                  borderColor: theme.palette.primary.main,
                  padding: theme.spacing(0.5, 1),
                  fontSize: '0.875rem',
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                    borderColor: theme.palette.primary.dark,
                  },
                },
                '& .fc-button-active': {
                  backgroundColor: theme.palette.primary.dark,
                  borderColor: theme.palette.primary.dark,
                },
                '& .fc-today-button': {
                  backgroundColor: theme.palette.secondary.main,
                  borderColor: theme.palette.secondary.main,
                  '&:hover': {
                    backgroundColor: theme.palette.secondary.dark,
                    borderColor: theme.palette.secondary.dark,
                  },
                },
                '& .fc-day-today': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                },
                '& .fc-daygrid-day': {
                  minHeight: '60px !important',
                },
                '& .fc-daygrid-day-frame': {
                  minHeight: '60px !important',
                },
                '& .fc-col-header-cell': {
                  padding: theme.spacing(0.5),
                  fontSize: '0.875rem',
                },
                '& .fc-daygrid-day-number': {
                  padding: theme.spacing(0.5),
                  fontSize: '0.875rem',
                },
                '& .fc-event': {
                  fontSize: '0.75rem',
                  padding: '2px 4px',
                  marginBottom: '2px',
                  cursor: 'pointer',
                  '&:hover': {
                    opacity: 0.9,
                    transform: 'scale(1.02)',
                    transition: 'all 0.2s ease',
                  },
                },
                '& .fc-event-title': {
                  fontSize: '0.75rem',
                  fontWeight: 500,
                },
                '& .fc-event-overlap': {
                  borderLeftWidth: '4px',
                  borderLeftStyle: 'solid',
                  borderLeftColor: theme.palette.error.main,
                },
              }}>
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                  }}
                  events={calendarEvents}
                  eventClick={(info) => {
                    const courseId = info.event.extendedProps.courseId;
                    if (courseId) {
                      navigate(`/courses/${courseId}`);
                    }
                  }}
                  eventTimeFormat={{
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  }}
                  slotMinTime="09:00:00"
                  slotMaxTime="21:00:00"
                  height={350}
                  weekends={true}
                  editable={false}
                  selectable={false}
                  dayMaxEvents={2}
                  moreLinkClick="popover"
                  aspectRatio={2.2}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      )}
    </Box>
  );
}

export default Dashboard;
