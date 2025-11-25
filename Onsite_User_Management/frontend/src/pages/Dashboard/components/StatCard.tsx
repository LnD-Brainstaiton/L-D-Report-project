import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  alpha,
} from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatDateForDisplay } from '../../../utils/dateUtils';
import { getDateRange } from '../utils/dateHelpers';
import type { Course, TimePeriod } from '../../../types';

type StatusKey = 'upcoming' | 'ongoing' | 'planning' | 'completed';

interface CourseWithTimestamps extends Course {
  startdate?: number;
  course_type?: string;
}

interface DisplayCounts {
  upcoming: number;
  ongoing: number;
  planning: number;
  completed: number;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
  subtitle?: string;
  courses?: CourseWithTimestamps[];
  statusKey: StatusKey;
  displayCounts: DisplayCounts;
  setDisplayCounts: React.Dispatch<React.SetStateAction<DisplayCounts>>;
  timePeriod: TimePeriod;
  selectedMonth: string;
  selectedQuarter: string;
  selectedYear: number;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color,
  onClick,
  subtitle,
  courses = [],
  statusKey,
  displayCounts,
  setDisplayCounts,
  timePeriod,
  selectedMonth,
  selectedQuarter,
  selectedYear,
}) => {
  const navigate = useNavigate();
  const dateRange = getDateRange(timePeriod, selectedMonth, selectedQuarter, selectedYear);
  const showCourses = dateRange !== null && courses.length > 0;
  const displayCount = displayCounts[statusKey] || 10;
  const remainingCount = courses.length - displayCount;

  const handleLoadMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDisplayCounts((prev) => ({
      ...prev,
      [statusKey]: Math.min(prev[statusKey] + 20, courses.length),
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
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: 'block', fontSize: '0.8rem' }}
              >
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
                        {course.batch_code} •{' '}
                        {formatDateForDisplay(
                          course.startdate
                            ? new Date(course.startdate * 1000)
                            : course.start_date
                              ? new Date(course.start_date)
                              : new Date()
                        )}
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

export default StatCard;

