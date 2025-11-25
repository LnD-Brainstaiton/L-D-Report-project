import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import { formatDateForDisplay } from '../../../utils/dateUtils';

const CourseHistoryCard = ({ enrollment }) => {
  const theme = useTheme();
  const isCompleted = enrollment.completion_status === 'Completed';
  const isFailed = enrollment.completion_status === 'Failed';
  const isInProgress = enrollment.completion_status === 'In Progress';
  const statusColor = isCompleted ? 'success' : isFailed ? 'error' : isInProgress ? 'warning' : 'default';

  return (
    <Card
      sx={{
        borderLeft: `4px solid ${
          isCompleted ? theme.palette.success.main :
          isFailed ? theme.palette.error.main :
          isInProgress ? theme.palette.warning.main :
          theme.palette.grey[400]
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
          </Box>
          <Chip
            label={enrollment.completion_status}
            color={statusColor}
            size="small"
            sx={{ fontWeight: 600 }}
          />
        </Box>
        
        <Box display="flex" gap={3} mt={2} flexWrap="wrap">
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Approval Status
            </Typography>
            <Chip
              label={enrollment.approval_status}
              color={
                enrollment.approval_status === 'Approved' ? 'success' :
                enrollment.approval_status === 'Pending' ? 'warning' :
                enrollment.approval_status === 'Withdrawn' ? 'error' : 'default'
              }
              size="small"
              sx={{ mt: 0.5 }}
            />
          </Box>
          
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
                  color: enrollment.attendance_percentage >= 80 
                    ? theme.palette.success.main 
                    : enrollment.attendance_percentage >= 50
                    ? theme.palette.warning.main
                    : theme.palette.error.main
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

