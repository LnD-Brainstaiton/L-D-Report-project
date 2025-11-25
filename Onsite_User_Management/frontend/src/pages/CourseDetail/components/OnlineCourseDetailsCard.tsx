import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Theme,
  alpha,
} from '@mui/material';
import { Course } from '../../../types';

interface OnlineCourseDetailsCardProps {
  course: Course;
  theme: Theme;
}

function OnlineCourseDetailsCard({ course, theme }: OnlineCourseDetailsCardProps): React.ReactElement {
  return (
    <Card
      sx={{
        mb: 3,
        border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
        backgroundColor: alpha(theme.palette.info.main, 0.03),
      }}
    >
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: theme.palette.info.main }}>
          Online Course Details
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
              Full Name
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {course.fullname || course.name}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
              Category
            </Typography>
            <Chip
              label={course.categoryname || 'Unknown'}
              size="small"
              sx={{
                background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                color: '#1e40af',
                fontWeight: 600,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
              Start Date
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {course.startdate 
                ? new Date(course.startdate * 1000).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'Not set'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
              End Date
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {course.enddate 
                ? new Date(course.enddate * 1000).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'Not set'}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

export default OnlineCourseDetailsCard;

