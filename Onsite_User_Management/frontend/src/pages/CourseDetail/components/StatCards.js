import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import { People, Event, CalendarToday, AccessTime } from '@mui/icons-material';
import { formatDateRangeWithFromTo } from '../../../utils/dateUtils';

function StatCards({ course, isOnlineCourse, loadingEnrollments, enrollments, theme }) {
  if (isOnlineCourse) {
    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
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
                  Total Assigned
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 0.5 }}>
                {loadingEnrollments ? '...' : enrollments.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Students enrolled in this course
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
              {course?.seat_limit ? `${Math.min(100, Math.round((course.current_enrolled / course.seat_limit) * 100))}% filled` : 'No limit set'}
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
              {formatDateRangeWithFromTo(course?.start_date, course?.end_date)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default StatCards;

