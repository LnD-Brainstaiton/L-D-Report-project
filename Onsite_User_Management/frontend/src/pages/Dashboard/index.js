import React, { useState } from 'react';
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
  Tabs,
  Tab,
} from '@mui/material';
import {
  CheckCircle,
  PlayCircle,
  Event,
  CalendarToday,
  Schedule,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import StatCard from './components/StatCard';
import { useDashboardData } from './hooks/useDashboardData';
import { formatDateRange } from './utils/dateHelpers';

function Dashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [courseType, setCourseType] = useState('onsite');
  const [timePeriod, setTimePeriod] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [displayCounts, setDisplayCounts] = useState({
    upcoming: 10,
    ongoing: 10,
    planning: 10,
    completed: 10,
  });

  const {
    loading,
    filteredUpcomingCourses,
    filteredOngoingCourses,
    filteredPlanningCourses,
    filteredCompletedCourses,
    calendarEvents,
    stats,
  } = useDashboardData(courseType, timePeriod, selectedMonth, selectedQuarter, selectedYear);

  const dateRangeFormatted = formatDateRange(
    timePeriod,
    selectedMonth,
    selectedQuarter,
    selectedYear
  );

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
              label={dateRangeFormatted}
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
                subtitle={timePeriod !== 'all' ? dateRangeFormatted : 'Scheduled'}
                courses={filteredPlanningCourses}
                statusKey="planning"
                displayCounts={displayCounts}
                setDisplayCounts={setDisplayCounts}
                timePeriod={timePeriod}
                selectedMonth={selectedMonth}
                selectedQuarter={selectedQuarter}
                selectedYear={selectedYear}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Upcoming Courses"
                value={stats.upcomingCourses}
                icon={<Schedule sx={{ fontSize: 32, color: theme.palette.secondary.main }} />}
                color={theme.palette.secondary.main}
                onClick={() => navigate('/courses/onsite/upcoming')}
                subtitle={timePeriod !== 'all' ? dateRangeFormatted : 'Scheduled to start'}
                courses={filteredUpcomingCourses}
                statusKey="upcoming"
                displayCounts={displayCounts}
                setDisplayCounts={setDisplayCounts}
                timePeriod={timePeriod}
                selectedMonth={selectedMonth}
                selectedQuarter={selectedQuarter}
                selectedYear={selectedYear}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Ongoing Courses"
                value={stats.ongoingCourses}
                icon={<PlayCircle sx={{ fontSize: 32, color: theme.palette.success.main }} />}
                color={theme.palette.success.main}
                onClick={() => navigate('/courses/onsite/ongoing')}
                subtitle={timePeriod !== 'all' ? dateRangeFormatted : 'In progress'}
                courses={filteredOngoingCourses}
                statusKey="ongoing"
                displayCounts={displayCounts}
                setDisplayCounts={setDisplayCounts}
                timePeriod={timePeriod}
                selectedMonth={selectedMonth}
                selectedQuarter={selectedQuarter}
                selectedYear={selectedYear}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Completed Courses"
                value={stats.completedCourses}
                icon={<CheckCircle sx={{ fontSize: 32, color: theme.palette.warning.main }} />}
                color={theme.palette.warning.main}
                onClick={() => navigate('/courses/onsite/completed')}
                subtitle={timePeriod !== 'all' ? dateRangeFormatted : 'Finished'}
                courses={filteredCompletedCourses}
                statusKey="completed"
                displayCounts={displayCounts}
                setDisplayCounts={setDisplayCounts}
                timePeriod={timePeriod}
                selectedMonth={selectedMonth}
                selectedQuarter={selectedQuarter}
                selectedYear={selectedYear}
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
                subtitle={timePeriod !== 'all' ? dateRangeFormatted : 'Scheduled to start'}
                courses={filteredUpcomingCourses}
                statusKey="upcoming"
                displayCounts={displayCounts}
                setDisplayCounts={setDisplayCounts}
                timePeriod={timePeriod}
                selectedMonth={selectedMonth}
                selectedQuarter={selectedQuarter}
                selectedYear={selectedYear}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={6}>
              <StatCard
                title="Ongoing Courses"
                value={stats.ongoingCourses}
                icon={<PlayCircle sx={{ fontSize: 32, color: theme.palette.success.main }} />}
                color={theme.palette.success.main}
                onClick={() => navigate(`/courses/${courseType}`, { state: { courseType } })}
                subtitle={timePeriod !== 'all' ? dateRangeFormatted : 'In progress'}
                courses={filteredOngoingCourses}
                statusKey="ongoing"
                displayCounts={displayCounts}
                setDisplayCounts={setDisplayCounts}
                timePeriod={timePeriod}
                selectedMonth={selectedMonth}
                selectedQuarter={selectedQuarter}
                selectedYear={selectedYear}
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

