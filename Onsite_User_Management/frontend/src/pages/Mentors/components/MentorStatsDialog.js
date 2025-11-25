/**
 * Dialog for displaying mentor statistics
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
} from '@mui/material';
import { formatDateForDisplay } from '../../../utils/dateUtils';

function MentorStatsDialog({
  open,
  onClose,
  mentor,
  stats,
  loading,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Mentor Statistics: {mentor?.name}
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : stats ? (
          <Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Total Courses Mentored
                    </Typography>
                    <Typography variant="h4">
                      {stats.total_courses_mentored || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Total Hours
                    </Typography>
                    <Typography variant="h4">
                      {stats.total_hours_overall || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Total Amount Paid
                    </Typography>
                    <Typography variant="h4" sx={{ color: 'success.main' }}>
                      tk {(stats.total_amount_overall || 0).toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Course Details
            </Typography>

            {stats.per_course_stats && stats.per_course_stats.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Course Name</TableCell>
                      <TableCell>Batch Code</TableCell>
                      <TableCell>Start Date</TableCell>
                      <TableCell>End Date</TableCell>
                      <TableCell>Hours</TableCell>
                      <TableCell>Amount Paid</TableCell>
                      <TableCell>Participants</TableCell>
                      <TableCell>Completion Ratio</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.per_course_stats.map((course, index) => (
                      <TableRow key={index}>
                        <TableCell>{course.course_name}</TableCell>
                        <TableCell>{course.batch_code}</TableCell>
                        <TableCell>{course.start_date ? formatDateForDisplay(course.start_date) : '-'}</TableCell>
                        <TableCell>{course.end_date ? formatDateForDisplay(course.end_date) : '-'}</TableCell>
                        <TableCell>{course.hours_taught}</TableCell>
                        <TableCell>tk {parseFloat(course.amount_paid).toFixed(2)}</TableCell>
                        <TableCell>{course.participants_count}</TableCell>
                        <TableCell>
                          <Chip
                            label={`${(course.completion_ratio * 100).toFixed(0)}%`}
                            size="small"
                            color={course.completion_ratio >= 0.8 ? 'success' : course.completion_ratio >= 0.6 ? 'warning' : 'error'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary" align="center" py={2}>
                No course assignments yet
              </Typography>
            )}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No statistics available
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default MentorStatsDialog;

