import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
} from '@mui/material';
import { School } from '@mui/icons-material';

function CourseHeaderCard({ course, theme }) {
  return (
    <Card
      sx={{
        mb: 3,
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.info.main} 100%)`,
        color: 'white',
        boxShadow: `0 8px 24px ${theme.palette.primary.main}15`,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" gap={2} mb={1.5}>
          <School sx={{ fontSize: 40 }} />
          <Box flexGrow={1}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              {course?.name || course?.fullname}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.95, fontSize: '1rem' }}>
              Batch Code: {course?.batch_code}
            </Typography>
          </Box>
        </Box>
        {course?.description && (
          <Typography variant="body2" sx={{ mt: 2, opacity: 0.9, fontStyle: 'italic', fontSize: '0.95rem' }}>
            {course.description}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default CourseHeaderCard;

