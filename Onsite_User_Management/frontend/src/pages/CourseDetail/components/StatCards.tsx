import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  Theme,
  alpha,
} from '@mui/material';
import { People, Event, CalendarToday, AccessTime } from '@mui/icons-material';
import { formatDateRangeWithFromTo } from '../../../utils/dateUtils';
import { Course, Enrollment } from '../../../types';

interface StatCardsProps {
  course: Course | null;
  isOnlineCourse: boolean;
  loadingEnrollments: boolean;
  enrollments: Enrollment[];
  theme: Theme;
}

function StatCards({ course, isOnlineCourse, loadingEnrollments, enrollments, theme }: StatCardsProps): React.ReactElement {
  if (isOnlineCourse) {
    // Calculate active vs previous employee counts
    const activeCount = enrollments.filter((e: any) => e.is_active !== false).length;
    const previousCount = enrollments.filter((e: any) => e.is_active === false).length;
    const totalCount = enrollments.length;
    
    // Calculate completion stats
    const completedCount = enrollments.filter((e: any) => e.completed || e.completion_status === 'Completed').length;
    const inProgressCount = enrollments.filter((e: any) => 
      !e.completed && e.completion_status !== 'Completed' && (e.progress || 0) > 0
    ).length;
    const notStartedCount = enrollments.filter((e: any) => 
      !e.completed && e.completion_status !== 'Completed' && (e.progress || 0) === 0
    ).length;
    
    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
              backgroundColor: alpha(theme.palette.primary.main, 0.05),
              height: '100%',
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <People sx={{ fontSize: 20, color: theme.palette.primary.main }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Total Enrolled
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 0.5 }}>
                {loadingEnrollments ? '...' : totalCount}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                Active: {loadingEnrollments ? '...' : activeCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Previous: {loadingEnrollments ? '...' : previousCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`,
              backgroundColor: alpha(theme.palette.success.main, 0.05),
              height: '100%',
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Event sx={{ fontSize: 20, color: theme.palette.success.main }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Completed
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.success.main, mb: 0.5 }}>
                {loadingEnrollments ? '...' : completedCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {totalCount > 0 ? `${Math.round((completedCount / totalCount) * 100)}% completion rate` : 'No enrollments'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              border: `1px solid ${alpha(theme.palette.warning.main, 0.15)}`,
              backgroundColor: alpha(theme.palette.warning.main, 0.05),
              height: '100%',
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <CalendarToday sx={{ fontSize: 20, color: theme.palette.warning.main }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  In Progress
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.warning.main, mb: 0.5 }}>
                {loadingEnrollments ? '...' : inProgressCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Students actively learning
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
              backgroundColor: alpha(theme.palette.info.main, 0.05),
              height: '100%',
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <AccessTime sx={{ fontSize: 20, color: theme.palette.info.main }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Not Started
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.info.main, mb: 0.5 }}>
                {loadingEnrollments ? '...' : notStartedCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Enrolled but not started
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card
          sx={{
            border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
            height: '100%',
          }}
        >
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <People sx={{ fontSize: 20, color: theme.palette.primary.main }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Enrollment
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 0.5 }}>
              {course?.current_enrolled}/{course?.seat_limit}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {course?.seat_limit ? `${Math.min(100, Math.round(((course.current_enrolled || 0) / course.seat_limit) * 100))}% filled` : 'No limit set'}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card
          sx={{
            border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`,
            backgroundColor: alpha(theme.palette.success.main, 0.05),
            height: '100%',
          }}
        >
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Event sx={{ fontSize: 20, color: theme.palette.success.main }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Classes
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.success.main, mb: 0.5 }}>
              {course?.total_classes_offered || 'N/A'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total sessions planned
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card
          sx={{
            border: `1px solid ${alpha(theme.palette.warning.main, 0.15)}`,
            backgroundColor: alpha(theme.palette.warning.main, 0.05),
            height: '100%',
          }}
        >
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <CalendarToday sx={{ fontSize: 20, color: theme.palette.warning.main }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Status
              </Typography>
            </Box>
            <Chip
              label={course?.status?.toUpperCase()}
              size="small"
              color={
                course?.status === 'completed'
                  ? 'success'
                  : course?.status === 'ongoing'
                  ? 'primary'
                  : 'warning'
              }
              sx={{ fontWeight: 600 }}
            />
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card
          sx={{
            border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
            backgroundColor: alpha(theme.palette.info.main, 0.05),
            height: '100%',
          }}
        >
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <AccessTime sx={{ fontSize: 20, color: theme.palette.info.main }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Duration
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.info.main, mb: 0.5, fontSize: '0.95rem' }}>
              {formatDateRangeWithFromTo(course?.start_date || null, course?.end_date || null)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default StatCards;

