import React from 'react';
import { Card, CardContent, Box, Typography, Chip, useTheme, alpha } from '@mui/material';
import { formatDateForDisplay } from '../../../utils/dateUtils';

interface EnrollmentData {
  id: number | string;
  course_name: string;
  batch_code: string;
  course_type?: string; // 'onsite', 'online', 'external'
  completion_status: string;
  approval_status: string;
  progress?: number; // For online courses
  score?: number | null;
  attendance_percentage?: number | null;
  attendance_status?: string | null;
  present?: number | null;
  total_attendance?: number | null;
  course_start_date?: string | null;
  course_end_date?: string | null;
  lastaccess?: string | null; // For online courses
}

interface CourseHistoryCardProps {
  enrollment: EnrollmentData;
}

const CourseHistoryCard: React.FC<CourseHistoryCardProps> = ({ enrollment }) => {
  const theme = useTheme();
  // Handle both onsite and online course statuses
  const completionStatus = enrollment.completion_status?.toUpperCase() || '';
  const isCompleted = completionStatus === 'COMPLETED' || (enrollment.course_type === 'online' && (enrollment.progress || 0) >= 100);
  const isFailed = completionStatus === 'FAILED';
  const isInProgress = completionStatus === 'IN_PROGRESS' || (enrollment.course_type === 'online' && (enrollment.progress || 0) > 0 && (enrollment.progress || 0) < 100);
  const isNotStarted = completionStatus === 'NOT_STARTED' || (enrollment.course_type === 'online' && (enrollment.progress || 0) === 0);
  
  const statusColor: 'success' | 'error' | 'warning' | 'default' = isCompleted
    ? 'success'
    : isFailed
      ? 'error'
      : isInProgress
        ? 'warning'
        : 'default';
  
  const displayStatus = enrollment.course_type === 'online' 
    ? (isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Not Started')
    : enrollment.completion_status || 'Unknown';

  const getApprovalColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    if (status === 'Approved') return 'success';
    if (status === 'Pending') return 'warning';
    if (status === 'Withdrawn') return 'error';
    return 'default';
  };

  return (
    <Card
      sx={{
        borderLeft: `4px solid ${
          isCompleted
            ? theme.palette.success.main
            : isFailed
              ? theme.palette.error.main
              : isInProgress
                ? theme.palette.warning.main
                : theme.palette.grey[400]
        }`,
        backgroundColor: isCompleted
          ? alpha(theme.palette.success.main, 0.05)
          : isFailed
            ? alpha(theme.palette.error.main, 0.05)
            : alpha(theme.palette.primary.main, 0.02),
        borderRadius: 2,
        boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.1)}`,
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              {enrollment.course_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Batch: {enrollment.batch_code}
            </Typography>
            {enrollment.course_type && (
              <Chip 
                label={enrollment.course_type.toUpperCase()} 
                size="small" 
                sx={{ 
                  mt: 0.5, 
                  fontSize: '0.7rem', 
                  height: '20px',
                  backgroundColor: enrollment.course_type === 'online' ? alpha(theme.palette.info.main, 0.1) : alpha(theme.palette.primary.main, 0.1),
                  color: enrollment.course_type === 'online' ? theme.palette.info.main : theme.palette.primary.main,
                }} 
              />
            )}
          </Box>
          <Chip label={displayStatus} color={statusColor} size="small" sx={{ fontWeight: 600 }} />
        </Box>

        <Box display="flex" gap={3} mt={2} flexWrap="wrap">
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Approval Status
            </Typography>
            <Chip
              label={enrollment.approval_status}
              color={getApprovalColor(enrollment.approval_status)}
              size="small"
              sx={{ mt: 0.5 }}
            />
          </Box>

          {enrollment.course_type === 'online' && enrollment.progress !== null && enrollment.progress !== undefined && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Progress
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
                {enrollment.progress.toFixed(1)}%
              </Typography>
            </Box>
          )}

          {enrollment.score !== null && enrollment.score !== undefined && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Score
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
                {enrollment.score.toFixed(1)}
              </Typography>
            </Box>
          )}

          {enrollment.attendance_percentage !== null && enrollment.attendance_percentage !== undefined && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Attendance
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  mt: 0.5,
                  color:
                    enrollment.attendance_percentage >= 80
                      ? theme.palette.success.main
                      : enrollment.attendance_percentage >= 50
                        ? theme.palette.warning.main
                        : theme.palette.error.main,
                }}
              >
                {enrollment.attendance_percentage.toFixed(1)}%
              </Typography>
            </Box>
          )}

          {enrollment.attendance_status && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Attendance Details
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
                {enrollment.attendance_status}
              </Typography>
            </Box>
          )}

          {enrollment.present !== null && enrollment.total_attendance !== null && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Sessions
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
                {enrollment.present} / {enrollment.total_attendance}
              </Typography>
            </Box>
          )}

          {enrollment.course_start_date && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Start Date
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {formatDateForDisplay(enrollment.course_start_date)}
              </Typography>
            </Box>
          )}

          {enrollment.course_end_date && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Completion Date
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {formatDateForDisplay(enrollment.course_end_date)}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default CourseHistoryCard;

