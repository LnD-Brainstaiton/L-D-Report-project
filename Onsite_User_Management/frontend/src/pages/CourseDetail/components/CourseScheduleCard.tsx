import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  Divider,
  Chip,
  Alert,
  Theme,
  alpha,
} from '@mui/material';
import { CalendarToday, Edit } from '@mui/icons-material';
import { convertTo12HourFormat } from '../../../utils/dateUtils';
import { Course } from '../../../types';

interface CourseScheduleCardProps {
  course: Course | null;
  onEditClick: () => void;
  theme: Theme;
}

function CourseScheduleCard({ course, onEditClick, theme }: CourseScheduleCardProps): React.ReactElement {
  return (
    <Card sx={{ mb: 3, border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2.5}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <CalendarToday color="primary" sx={{ fontSize: 24 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Course Schedule
            </Typography>
          </Box>
          <Button 
            variant="outlined" 
            size="small" 
            startIcon={<Edit />}
            onClick={onEditClick}
          >
            Edit Details
          </Button>
        </Box>
        <Divider sx={{ mb: 2.5 }} />
        
        {course?.class_schedule && course.class_schedule.length > 0 ? (
          <Box display="flex" flexWrap="wrap" gap={2}>
            {course.class_schedule.map((schedule, index) => (
              <Chip
                key={`${schedule.day}-${index}`}
                label={`${schedule.day} ${convertTo12HourFormat(schedule.start_time)} - ${convertTo12HourFormat(schedule.end_time)}`}
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 500, p: 2 }}
              />
            ))}
          </Box>
        ) : (
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            No class schedule set. Click "Edit Details" to add schedule times.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export default CourseScheduleCard;

