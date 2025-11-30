import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Theme,
  alpha,
  Box,
  Button,
} from '@mui/material';
import { Star, OpenInNew } from '@mui/icons-material';
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
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.info.main }}>
            Online Course Details
          </Typography>
          {course.is_mandatory && (
            <Chip
              icon={<Star sx={{ fontSize: 16 }} />}
              label="Mandatory Course"
              size="small"
              sx={{
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                color: '#92400e',
                fontWeight: 600,
                '& .MuiChip-icon': { color: '#f59e0b' },
              }}
            />
          )}
        </Box>
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
              Course Type
            </Typography>
            <Chip
              label={course.is_mandatory ? 'Mandatory' : 'Optional'}
              size="small"
              sx={{
                background: course.is_mandatory 
                  ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                  : '#f1f5f9',
                color: course.is_mandatory ? '#92400e' : '#64748b',
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
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
              Open in LMS
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<OpenInNew />}
              href={`https://lms.elearning23.com/course/view.php?id=${course.lms_course_id || course.id}`}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderColor: theme.palette.info.main,
                color: theme.palette.info.main,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.info.main, 0.1),
                  borderColor: theme.palette.info.main,
                },
              }}
            >
              View on LMS Website
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

export default OnlineCourseDetailsCard;

