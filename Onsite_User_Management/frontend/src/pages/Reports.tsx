import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  useTheme,
  alpha,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import { Description, Download } from '@mui/icons-material';
import { coursesAPI, studentsAPI } from '../services/api';
import { formatDateForDisplay } from '../utils/dateUtils';
import type { Course } from '../types';

type ReportType = 'overall' | 'course';

const Reports: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const coursesRes = await coursesAPI.getAll();
      setAllCourses(coursesRes.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async (reportType: ReportType, courseId: number | null = null) => {
    const reportKey = courseId ? `course-${courseId}` : reportType;
    setDownloadingReport(reportKey);
    try {
      let response;
      let filename: string;

      if (reportType === 'overall') {
        response = await studentsAPI.generateOverallReport();
        filename = `training_history_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      } else if (reportType === 'course' && courseId) {
        response = await coursesAPI.generateReport(courseId);
        const contentDisposition = response.headers['content-disposition'];
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }
        if (!filename!) {
          filename = `course_report_${courseId}.xlsx`;
        }
      }

      if (response) {
        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename!;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Error downloading report. Please try again.');
    } finally {
      setDownloadingReport(null);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box mb={4}>
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
          Reports
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '0.95rem' }}>
          Download training and enrollment reports
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.04)} 0%, ${alpha(theme.palette.info.main, 0.04)} 100%)`,
              boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.08)}`,
              '&:hover': {
                boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
              },
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
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
                  <Description sx={{ fontSize: 32, color: theme.palette.primary.main }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Overall Training History Report
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Complete enrollment history for all active employees including course details, attendance, scores, and
                completion status.
              </Typography>
              <Button
                variant="contained"
                startIcon={<Download />}
                onClick={() => handleDownloadReport('overall')}
                disabled={downloadingReport === 'overall'}
                fullWidth
              >
                {downloadingReport === 'overall' ? 'Downloading...' : 'Download Overall Report'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card
            sx={{
              border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.04)} 0%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
              boxShadow: `0 4px 16px ${alpha(theme.palette.info.main, 0.08)}`,
              '&:hover': {
                boxShadow: `0 8px 24px ${alpha(theme.palette.info.main, 0.15)}`,
              },
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.info.main, 0.12),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Description sx={{ fontSize: 32, color: theme.palette.info.main }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Course-Specific Reports
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Generate individual reports for specific courses. Select a course below to download its enrollment
                report.
              </Typography>
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {allCourses.length === 0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontStyle: 'italic', textAlign: 'center', py: 2 }}
                  >
                    No courses available
                  </Typography>
                ) : (
                  <List dense>
                    {allCourses.map((course) => (
                      <ListItem key={course.id} disablePadding>
                        <ListItemButton
                          onClick={() => handleDownloadReport('course', course.id)}
                          disabled={downloadingReport === `course-${course.id}`}
                          sx={{
                            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                            borderRadius: 1,
                            mb: 1,
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.info.main, 0.08),
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
                                {course.batch_code} • {course.start_date ? formatDateForDisplay(new Date(course.start_date)) : 'N/A'}
                              </Typography>
                            }
                          />
                          {downloadingReport === `course-${course.id}` ? (
                            <CircularProgress size={20} />
                          ) : (
                            <Download fontSize="small" sx={{ color: theme.palette.info.main }} />
                          )}
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Reports;

