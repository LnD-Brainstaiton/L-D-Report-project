import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Chip,
  Divider,
  Box,
  CircularProgress,
  Card,
  CardContent,
  useTheme,
  alpha,
  Tabs,
  Tab,
} from '@mui/material';
import { studentsAPI, lmsAPI } from '../services/api';
import { formatExperience } from '../utils/experienceUtils';
import { formatDateForDisplay } from '../utils/dateUtils';

function UserDetailsDialog({ open, onClose, enrollment, onViewCourseDetails, onApprove, onReject, onReapprove }) {
  const theme = useTheme();
  const [courseType, setCourseType] = useState('onsite'); // 'onsite', 'online', 'external'
  const [studentEnrollments, setStudentEnrollments] = useState([]);
  const [onlineCourses, setOnlineCourses] = useState([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  
  // Separate completion stats for each course type
  const [completionStats, setCompletionStats] = useState({
    onsite: { rate: 0, completed: 0, total: 0 },
    online: { rate: 0, completed: 0, total: 0 },
    external: { rate: 0, completed: 0, total: 0 },
  });

  const fetchStudentEnrollments = async () => {
    if (!enrollment?.student_id) {
      return;
    }
    
    setLoadingEnrollments(true);
    try {
      // Fetch onsite enrollments
      const response = await studentsAPI.getEnrollments(enrollment.student_id);
      
      // Handle both old format (array) and new format (object with enrollments and stats)
      let onsiteEnrollments = [];
      if (Array.isArray(response.data)) {
        onsiteEnrollments = response.data || [];
      } else {
        // New format with stats
        onsiteEnrollments = response.data.enrollments || [];
      }
      
      setStudentEnrollments(onsiteEnrollments);
      
      // Fetch online courses from LMS if employee_id is available
      if (enrollment.student_employee_id) {
        try {
          // Try to find user by username (employee_id) in LMS
          // First, we need to get the LMS user ID. For now, we'll try using the employee_id as username
          // Note: This might need adjustment based on how LMS user lookup works
          const lmsResponse = await lmsAPI.getUserCourses(enrollment.student_employee_id);
          const lmsCourses = lmsResponse.data.courses || [];
          
          // Map LMS courses to enrollment format
          const mappedOnlineCourses = lmsCourses.map(course => {
            const progress = course.progress || 0;
            // If progress is 100%, status is Completed; if less than 100% and > 0, In Progress; otherwise Not Started
            const completionStatus = progress >= 100 ? 'Completed' : (progress > 0 ? 'In Progress' : 'Not Started');
            
            return {
              id: `lms_${course.id}`,
              course_id: course.id,
              course_name: course.fullname,
              batch_code: course.shortname || '',
              course_type: 'online',
              completion_status: completionStatus,
              progress: progress,
              course_end_date: course.enddate ? new Date(course.enddate * 1000).toISOString().split('T')[0] : null,
              // Date assigned: use startdate (when course was assigned/started) or timemodified as fallback
              date_assigned: course.startdate || course.timemodified || null,
              lastaccess: course.lastaccess || null,
              is_lms_course: true,
            };
          });
          
          setOnlineCourses(mappedOnlineCourses);
          
          // Calculate completion stats separately for each course type
          // Online courses
          const onlineCompleted = mappedOnlineCourses.filter(c => c.completion_status === 'Completed').length;
          const onlineTotal = mappedOnlineCourses.length;
          const onlineRate = onlineTotal > 0 ? (onlineCompleted / onlineTotal) * 100 : 0;
          
          // Onsite courses
          const onsiteRelevant = onsiteEnrollments.filter(e => 
            (e.approval_status === 'Withdrawn') ||
            (e.approval_status === 'Approved' && ['Completed', 'Failed'].includes(e.completion_status))
          ).filter(e => e.approval_status !== 'Rejected');
          
          const onsiteTotal = onsiteRelevant.length;
          const onsiteCompleted = onsiteRelevant.filter(e => e.completion_status === 'Completed').length;
          const onsiteRate = onsiteTotal > 0 ? (onsiteCompleted / onsiteTotal) * 100 : 0;
          
          // External courses (placeholder for now)
          const externalRate = 0;
          const externalCompleted = 0;
          const externalTotal = 0;
          
          setCompletionStats({
            onsite: { rate: onsiteRate, completed: onsiteCompleted, total: onsiteTotal },
            online: { rate: onlineRate, completed: onlineCompleted, total: onlineTotal },
            external: { rate: externalRate, completed: externalCompleted, total: externalTotal },
          });
        } catch (lmsError) {
          console.error('UserDetailsDialog: Error fetching LMS courses:', lmsError);
          setOnlineCourses([]);
          
          // Calculate completion stats with onsite courses only
          const onsiteRelevant = onsiteEnrollments.filter(e => 
            (e.approval_status === 'Withdrawn') ||
            (e.approval_status === 'Approved' && ['Completed', 'Failed'].includes(e.completion_status))
          ).filter(e => e.approval_status !== 'Rejected');
          const onsiteTotal = onsiteRelevant.length;
          const onsiteCompleted = onsiteRelevant.filter(e => e.completion_status === 'Completed').length;
          const onsiteRate = onsiteTotal > 0 ? (onsiteCompleted / onsiteTotal) * 100 : 0;
          
          setCompletionStats({
            onsite: { rate: onsiteRate, completed: onsiteCompleted, total: onsiteTotal },
            online: { rate: 0, completed: 0, total: 0 },
            external: { rate: 0, completed: 0, total: 0 },
          });
        }
      } else {
        // No employee_id, calculate completion rate with onsite courses only
        const onsiteRelevant = onsiteEnrollments.filter(e => 
          (e.approval_status === 'Withdrawn') ||
          (e.approval_status === 'Approved' && ['Completed', 'Failed'].includes(e.completion_status))
        ).filter(e => e.approval_status !== 'Rejected');
        const onsiteTotal = onsiteRelevant.length;
        const onsiteCompleted = onsiteRelevant.filter(e => e.completion_status === 'Completed').length;
        const onsiteRate = onsiteTotal > 0 ? (onsiteCompleted / onsiteTotal) * 100 : 0;
        
        setCompletionStats({
          onsite: { rate: onsiteRate, completed: onsiteCompleted, total: onsiteTotal },
          online: { rate: 0, completed: 0, total: 0 },
          external: { rate: 0, completed: 0, total: 0 },
        });
      }
    } catch (error) {
      console.error('UserDetailsDialog: Error fetching student enrollments:', error);
      setStudentEnrollments([]);
      setOnlineCourses([]);
      setCompletionStats({
        onsite: { rate: 0, completed: 0, total: 0 },
        online: { rate: 0, completed: 0, total: 0 },
        external: { rate: 0, completed: 0, total: 0 },
      });
    } finally {
      setLoadingEnrollments(false);
    }
  };

  useEffect(() => {
    if (open && enrollment?.student_id) {
      fetchStudentEnrollments();
    } else {
      setStudentEnrollments([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, enrollment?.student_id]);

  if (!enrollment) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
        Complete User Profile - {enrollment.student_name}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Student Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Employee ID
            </Typography>
            <Typography variant="body1" gutterBottom>
              {enrollment.student_employee_id || 'N/A'}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Name
            </Typography>
            <Typography variant="body1" gutterBottom>
              {enrollment.student_name}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Email
            </Typography>
            <Typography variant="body1" gutterBottom>
              {enrollment.student_email}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Department
            </Typography>
            <Typography variant="body1" gutterBottom>
              <Chip label={enrollment.student_department} size="small" />
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Designation
            </Typography>
            <Typography variant="body1" gutterBottom>
              {enrollment.student_designation || 'N/A'}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Total Experience
            </Typography>
            <Typography variant="body1" gutterBottom>
              {formatExperience(enrollment.student_career_start_date)}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              BS Experience
            </Typography>
            <Typography variant="body1" gutterBottom>
              {formatExperience(enrollment.student_bs_joining_date)}
            </Typography>
          </Grid>
          
          {enrollment.student_career_start_date && (
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Career Start Date
              </Typography>
              <Typography variant="body1" gutterBottom>
                {formatDateForDisplay(enrollment.student_career_start_date)}
              </Typography>
            </Grid>
          )}
          
          {enrollment.student_bs_joining_date && (
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                BS Joining Date
              </Typography>
              <Typography variant="body1" gutterBottom>
                {formatDateForDisplay(enrollment.student_bs_joining_date)}
              </Typography>
            </Grid>
          )}
          
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Card
              sx={{
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                borderRadius: 2,
                p: 2,
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {courseType === 'onsite' ? 'Onsite' : courseType === 'online' ? 'Online' : 'External'} Completion Rate
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 600,
                      color: (() => {
                        const rate = completionStats[courseType]?.rate || 0;
                        if (rate >= 75) return theme.palette.success.main;
                        if (rate >= 60) return theme.palette.warning.main;
                        return theme.palette.error.main;
                      })(),
                    }}
                  >
                    {(completionStats[courseType]?.rate || 0).toFixed(1)}%
                  </Typography>
                </Box>
                <Box textAlign="right">
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Courses Completed
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: (() => {
                        const rate = completionStats[courseType]?.rate || 0;
                        if (rate >= 75) return theme.palette.success.main;
                        if (rate >= 60) return theme.palette.warning.main;
                        return theme.palette.error.main;
                      })(),
                    }}
                  >
                    {completionStats[courseType]?.completed || 0} / {completionStats[courseType]?.total || 0}
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>
          
          <Grid item xs={12} sx={{ mt: 3 }}>
            <Box sx={{ mb: 2 }}>
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{ 
                  mb: 2,
                  fontWeight: 600,
                }}
              >
                Complete Course History
              </Typography>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs
                  value={courseType}
                  onChange={(e, newValue) => setCourseType(newValue)}
                  sx={{
                    '& .MuiTab-root': {
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                    },
                  }}
                >
                  <Tab label="Onsite" value="onsite" />
                  <Tab label="Online" value="online" />
                  <Tab label="External" value="external" />
                </Tabs>
              </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {loadingEnrollments ? (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress size={24} />
              </Box>
            ) : (() => {
              // Get enrollments based on selected course type
              let displayEnrollments = [];
              if (courseType === 'onsite') {
                displayEnrollments = studentEnrollments;
              } else if (courseType === 'online') {
                displayEnrollments = onlineCourses;
              } else if (courseType === 'external') {
                // External courses - to be implemented later
                displayEnrollments = [];
              }
              
              return displayEnrollments.length > 0 ? (
              <Box display="flex" flexDirection="column" gap={2}>
                {displayEnrollments
                  .sort((a, b) => {
                    // For online courses, use different sorting
                    if (courseType === 'online') {
                      // Priority 1: Completed
                      if (a.completion_status === 'Completed' && b.completion_status !== 'Completed') return -1;
                      if (b.completion_status === 'Completed' && a.completion_status !== 'Completed') return 1;
                      // Priority 2: In Progress
                      if (a.completion_status === 'In Progress' && b.completion_status !== 'In Progress') return -1;
                      if (b.completion_status === 'In Progress' && a.completion_status !== 'In Progress') return 1;
                      // Priority 3: Not Started
                      // If same status, sort by lastaccess (most recent first)
                      const lastAccessA = a.lastaccess ? new Date(a.lastaccess * 1000) : new Date(0);
                      const lastAccessB = b.lastaccess ? new Date(b.lastaccess * 1000) : new Date(0);
                      return lastAccessB - lastAccessA;
                    }
                    
                    // For onsite courses, use original sorting
                    // Define order: Completed (1) > Failed (2) > Approved Not Started (3) > Pending (4) > Rejected (5) > Others (6)
                    const getStatusOrder = (enrollment) => {
                      // Priority 1: Completed
                      if (enrollment.completion_status === 'Completed') return 1;
                      // Priority 2: Failed
                      if (enrollment.completion_status === 'Failed') return 2;
                      // Priority 3: Approved + Not Started
                      if (enrollment.approval_status === 'Approved' && 
                          enrollment.completion_status === 'Not Started') return 3;
                      // Priority 4: Pending
                      if (enrollment.approval_status === 'Pending') return 4;
                      // Priority 5: Rejected
                      if (enrollment.approval_status === 'Rejected') return 5;
                      // Priority 6: Others (In Progress, Withdrawn, etc.)
                      return 6;
                    };
                    
                    const orderA = getStatusOrder(a);
                    const orderB = getStatusOrder(b);
                    
                    // If same order, sort by creation date (newest first)
                    if (orderA === orderB) {
                      const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
                      const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
                      return dateB - dateA;
                    }
                    
                    return orderA - orderB;
                  })
                  .map((enroll) => {
                  const isCompleted = enroll.completion_status === 'Completed';
                  const isFailed = enroll.completion_status === 'Failed';
                  const isInProgress = enroll.completion_status === 'In Progress';
                  const statusColor = isCompleted ? 'success' : isFailed ? 'error' : isInProgress ? 'warning' : 'default';
                  
                  return (
                    <Card
                      key={enroll.id}
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
                              {enroll.course_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Batch: {enroll.batch_code}
                            </Typography>
                          </Box>
                          <Chip
                            label={enroll.completion_status}
                            color={statusColor}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </Box>
                        
                        <Box display="flex" gap={3} mt={2} flexWrap="wrap">
                          {!enroll.is_lms_course && (
                            <Box>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Approval Status
                              </Typography>
                              <Chip
                                label={enroll.approval_status}
                                color={
                                  enroll.approval_status === 'Approved' ? 'success' :
                                  enroll.approval_status === 'Pending' ? 'warning' :
                                  enroll.approval_status === 'Withdrawn' ? 'error' :
                                  enroll.approval_status === 'Rejected' ? 'error' : 'default'
                                }
                                size="small"
                                sx={{ mt: 0.5 }}
                              />
                            </Box>
                          )}
                          
                          {enroll.score !== null && enroll.score !== undefined && !enroll.is_lms_course && (
                            <Box>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Score
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
                                {enroll.score.toFixed(1)}
                              </Typography>
                            </Box>
                          )}
                          
                          {enroll.is_lms_course && enroll.progress !== null && enroll.progress !== undefined && (
                            <Box>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Progress
                              </Typography>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontWeight: 600, 
                                  mt: 0.5,
                                  color: enroll.progress >= 100 
                                    ? theme.palette.success.main 
                                    : enroll.progress >= 50
                                    ? theme.palette.warning.main
                                    : theme.palette.error.main
                                }}
                              >
                                {enroll.progress.toFixed(1)}%
                              </Typography>
                            </Box>
                          )}
                          
                          {!enroll.is_lms_course && enroll.attendance_percentage !== null && enroll.attendance_percentage !== undefined && (
                            <Box>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Attendance
                              </Typography>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontWeight: 600, 
                                  mt: 0.5,
                                  color: enroll.attendance_percentage >= 80 
                                    ? theme.palette.success.main 
                                    : enroll.attendance_percentage >= 50
                                    ? theme.palette.warning.main
                                    : theme.palette.error.main
                                }}
                              >
                                {enroll.attendance_percentage.toFixed(1)}%
                              </Typography>
                            </Box>
                          )}
                          
                          {!enroll.is_lms_course && enroll.attendance_status && (
                            <Box>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Attendance Details
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
                                {enroll.attendance_status}
                              </Typography>
                            </Box>
                          )}
                          
                          {!enroll.is_lms_course && enroll.present !== null && enroll.total_attendance !== null && (
                            <Box>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Sessions
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
                                {enroll.present} / {enroll.total_attendance}
                              </Typography>
                            </Box>
                          )}
                          
                          {!enroll.is_lms_course && enroll.course_start_date && (
                            <Box>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Start Date
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
                                {formatDateForDisplay(enroll.course_start_date)}
                              </Typography>
                            </Box>
                          )}
                          
                          {enroll.course_end_date && (
                            <Box>
                              <Typography variant="caption" color="text.secondary" display="block">
                                End Date
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
                                {formatDateForDisplay(enroll.course_end_date)}
                              </Typography>
                            </Box>
                          )}
                          
                          {!enroll.is_lms_course && enroll.completion_date && (
                            <Box>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Completion Date
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
                                {formatDateForDisplay(enroll.completion_date)}
                              </Typography>
                            </Box>
                          )}
                          
                          {enroll.is_lms_course && enroll.date_assigned && (
                            <Box>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Date Assigned
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
                                {enroll.date_assigned ? new Date(enroll.date_assigned * 1000).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                }) : 'N/A'}
                              </Typography>
                            </Box>
                          )}
                          
                          {enroll.is_lms_course && (
                            <Box>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Last Access
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
                                {enroll.lastaccess ? new Date(enroll.lastaccess * 1000).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : 'Never'}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {courseType === 'external' 
                  ? 'External course history will be available soon.'
                  : 'No course history available for this type.'}
              </Typography>
            );
            })()}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {enrollment && enrollment.approval_status === 'Pending' && enrollment.eligibility_status === 'Eligible' && onApprove && onReject && (
          <>
            <Button
              color="success"
              variant="contained"
              onClick={() => {
                onApprove(enrollment.id);
                onClose();
              }}
            >
              Approve
            </Button>
            <Button
              color="error"
              variant="outlined"
              onClick={() => {
                onReject(enrollment.id);
                onClose();
              }}
            >
              Reject
            </Button>
          </>
        )}
        {enrollment && enrollment.approval_status === 'Withdrawn' && onReapprove && (
          <Button
            color="primary"
            variant="contained"
            onClick={() => {
              onReapprove(enrollment.id);
              onClose();
            }}
          >
            Reapprove
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default UserDetailsDialog;

