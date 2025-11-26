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
  Tooltip,
} from '@mui/material';
import { Star } from '@mui/icons-material';
import { studentsAPI } from '../services/api';
import { formatExperience } from '../utils/experienceUtils';
import { formatDateForDisplay } from '../utils/dateUtils';
import type { Enrollment, CourseType } from '../types';


interface EnrollmentWithDetails extends Enrollment {
  student_career_start_date?: string | null;
  student_bs_joining_date?: string | null;
  student_total_experience?: number | null; // From ERP
  student_exit_date?: string | null; // Leaving date for previous employees
  is_previous_employee?: boolean; // Flag to indicate this is a previous employee
  batch_code?: string;
  completion_status?: string;
  attendance_percentage?: number;
  attendance_status?: string;
  present?: number;
  total_attendance?: number;
  course_type?: string;
  is_lms_course?: boolean;
}

interface OnlineCourseEnrollment {
  id: string;
  course_id: number | string;
  course_name: string;
  batch_code: string;
  course_type: string;
  completion_status: string;
  progress: number;
  course_end_date: string | null;
  date_assigned: number | null;
  lastaccess: number | null;
  is_lms_course: boolean;
  is_mandatory: boolean;
}

interface CompletionStats {
  rate: number;
  completed: number;
  total: number;
}

interface UserDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  enrollment: EnrollmentWithDetails | null;
  onViewCourseDetails?: (courseId: number) => void;
  onApprove?: (enrollmentId: number) => void;
  onReject?: (enrollmentId: number) => void;
  onReapprove?: (enrollmentId: number) => void;
}

const UserDetailsDialog: React.FC<UserDetailsDialogProps> = ({
  open,
  onClose,
  enrollment,
  onApprove,
  onReject,
  onReapprove,
}) => {
  const theme = useTheme();
  const [courseType, setCourseType] = useState<CourseType>('onsite');
  const [studentEnrollments, setStudentEnrollments] = useState<EnrollmentWithDetails[]>([]);
  const [onlineCourses, setOnlineCourses] = useState<OnlineCourseEnrollment[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);

  const [completionStats, setCompletionStats] = useState<Record<CourseType, CompletionStats>>({
    onsite: { rate: 0, completed: 0, total: 0 },
    online: { rate: 0, completed: 0, total: 0 },
    external: { rate: 0, completed: 0, total: 0 },
  });

  const fetchStudentEnrollments = async () => {
    if (!enrollment?.student_id) return;

    setLoadingEnrollments(true);
    try {
      const response = await studentsAPI.getEnrollments(enrollment.student_id);
      const data = response.data as any;

      // Get onsite enrollments
      let onsiteEnrollments: EnrollmentWithDetails[] = [];
      if (Array.isArray(data)) {
        onsiteEnrollments = data || [];
      } else {
        onsiteEnrollments = data.enrollments || [];
      }
      setStudentEnrollments(onsiteEnrollments);

      // Get online courses from the same response (no separate LMS API call needed)
      const onlineCoursesList = data.online_courses || [];
      const mappedOnlineCourses: OnlineCourseEnrollment[] = onlineCoursesList.map((course: any) => ({
        id: course.id,
        course_id: course.course_id,
        course_name: course.course_name,
        batch_code: course.batch_code || '',
        course_type: 'online',
        completion_status: course.completion_status,
        progress: course.progress || 0,
        course_end_date: course.course_end_date,
        date_assigned: course.course_start_date,
        lastaccess: course.lastaccess,
        is_lms_course: true,
        is_mandatory: course.is_mandatory || false,
      }));
      // Sort mandatory courses first
      mappedOnlineCourses.sort((a, b) => {
        if (a.is_mandatory && !b.is_mandatory) return -1;
        if (!a.is_mandatory && b.is_mandatory) return 1;
        return 0;
      });
      setOnlineCourses(mappedOnlineCourses);

      // Use stats from backend if available, otherwise calculate
      if (data.onsite_stats && data.online_stats) {
        setCompletionStats({
          onsite: { 
            rate: data.onsite_stats.rate, 
            completed: data.onsite_stats.completed, 
            total: data.onsite_stats.total 
          },
          online: { 
            rate: data.online_stats.rate, 
            completed: data.online_stats.completed, 
            total: data.online_stats.total 
          },
          external: { rate: 0, completed: 0, total: 0 },
        });
      } else {
        // Fallback calculation
        const onlineCompleted = mappedOnlineCourses.filter((c) => c.completion_status === 'Completed').length;
        const onlineTotal = mappedOnlineCourses.length;
        const onlineRate = onlineTotal > 0 ? (onlineCompleted / onlineTotal) * 100 : 0;

        const onsiteRelevant = onsiteEnrollments
          .filter(
            (e) =>
              e.approval_status === 'Withdrawn' ||
              (e.approval_status === 'Approved' && ['Completed', 'Failed'].includes(e.completion_status || ''))
          )
          .filter((e) => e.approval_status !== 'Rejected');

        const onsiteTotal = onsiteRelevant.length;
        const onsiteCompleted = onsiteRelevant.filter((e) => e.completion_status === 'Completed').length;
        const onsiteRate = onsiteTotal > 0 ? (onsiteCompleted / onsiteTotal) * 100 : 0;

        setCompletionStats({
          onsite: { rate: onsiteRate, completed: onsiteCompleted, total: onsiteTotal },
          online: { rate: onlineRate, completed: onlineCompleted, total: onlineTotal },
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

  const getCompletionRateColor = (rate: number): string => {
    if (rate >= 75) return theme.palette.success.main;
    if (rate >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getDisplayEnrollments = (): (EnrollmentWithDetails | OnlineCourseEnrollment)[] => {
    if (courseType === 'onsite') return studentEnrollments;
    if (courseType === 'online') return onlineCourses;
    return [];
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ fontWeight: 600, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: 2 }}>
        Complete User Profile - {enrollment.student_name}
        {enrollment.is_previous_employee && (
          <Chip 
            label="Previous Employee" 
            size="small" 
            sx={{ 
              background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
              color: '#991b1b',
              fontWeight: 600,
            }} 
          />
        )}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              {enrollment.is_previous_employee ? 'Employee Information' : 'Student Information'}
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">Employee ID</Typography>
            <Typography variant="body1" gutterBottom>{enrollment.student_employee_id || 'N/A'}</Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">Name</Typography>
            <Typography variant="body1" gutterBottom>{enrollment.student_name}</Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">Email</Typography>
            <Typography variant="body1" gutterBottom>{enrollment.student_email}</Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">Department</Typography>
            <Typography variant="body1" gutterBottom>
              <Chip label={enrollment.student_department} size="small" />
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">Designation</Typography>
            <Typography variant="body1" gutterBottom>{enrollment.student_designation || 'N/A'}</Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">Total Experience</Typography>
            <Typography variant="body1" gutterBottom>
              {enrollment.student_total_experience 
                ? `${enrollment.student_total_experience} years` 
                : formatExperience(enrollment.student_career_start_date)}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">BS Experience</Typography>
            <Typography variant="body1" gutterBottom>{formatExperience(enrollment.student_bs_joining_date)}</Typography>
          </Grid>

          {enrollment.student_career_start_date && (
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Career Start Date</Typography>
              <Typography variant="body1" gutterBottom>{formatDateForDisplay(enrollment.student_career_start_date)}</Typography>
            </Grid>
          )}

          {enrollment.student_bs_joining_date && (
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">BS Joining Date</Typography>
              <Typography variant="body1" gutterBottom>{formatDateForDisplay(enrollment.student_bs_joining_date)}</Typography>
            </Grid>
          )}

          {enrollment.is_previous_employee && enrollment.student_exit_date && (
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary" sx={{ color: '#b91c1c', fontWeight: 600 }}>
                Leaving Date
              </Typography>
              <Typography variant="body1" gutterBottom sx={{ color: '#991b1b', fontWeight: 500 }}>
                {formatDateForDisplay(enrollment.student_exit_date)}
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
                    sx={{ fontWeight: 600, color: getCompletionRateColor(completionStats[courseType]?.rate || 0) }}
                  >
                    {(completionStats[courseType]?.rate || 0).toFixed(1)}%
                  </Typography>
                </Box>
                <Box textAlign="right">
                  <Typography variant="body2" color="text.secondary" gutterBottom>Courses Completed</Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, color: getCompletionRateColor(completionStats[courseType]?.rate || 0) }}
                  >
                    {completionStats[courseType]?.completed || 0} / {completionStats[courseType]?.total || 0}
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>

          <Grid item xs={12} sx={{ mt: 3 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
                Complete Course History
              </Typography>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs
                  value={courseType}
                  onChange={(_, newValue: CourseType) => setCourseType(newValue)}
                  sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.9rem' } }}
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
            ) : (
              (() => {
                const displayEnrollments = getDisplayEnrollments();
                return displayEnrollments.length > 0 ? (
                  <Box display="flex" flexDirection="column" gap={2}>
                    {displayEnrollments.map((enroll: any) => {
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
                                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    {enroll.course_name}
                                  </Typography>
                                  {enroll.is_mandatory && (
                                    <Tooltip title="Mandatory Course">
                                      <Chip
                                        icon={<Star sx={{ fontSize: 14 }} />}
                                        label="Mandatory"
                                        size="small"
                                        sx={{
                                          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                                          color: '#92400e',
                                          fontWeight: 600,
                                          fontSize: '0.7rem',
                                          height: 22,
                                          '& .MuiChip-icon': { color: '#f59e0b' },
                                        }}
                                      />
                                    </Tooltip>
                                  )}
                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                  Batch: {enroll.batch_code}
                                </Typography>
                              </Box>
                              <Chip
                                label={enroll.completion_status}
                                color={statusColor as any}
                                size="small"
                                sx={{ fontWeight: 600 }}
                              />
                            </Box>

                            <Box display="flex" gap={3} mt={2} flexWrap="wrap">
                              {!enroll.is_lms_course && (
                                <Box>
                                  <Typography variant="caption" color="text.secondary" display="block">Approval Status</Typography>
                                  <Chip
                                    label={enroll.approval_status}
                                    color={
                                      enroll.approval_status === 'Approved' ? 'success' :
                                      enroll.approval_status === 'Pending' ? 'warning' :
                                      enroll.approval_status === 'Withdrawn' || enroll.approval_status === 'Rejected' ? 'error' : 'default'
                                    }
                                    size="small"
                                    sx={{ mt: 0.5 }}
                                  />
                                </Box>
                              )}

                              {enroll.is_lms_course && enroll.progress !== null && (
                                <Box>
                                  <Typography variant="caption" color="text.secondary" display="block">Progress</Typography>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontWeight: 600,
                                      mt: 0.5,
                                      color: enroll.progress >= 100 ? theme.palette.success.main :
                                             enroll.progress >= 50 ? theme.palette.warning.main : theme.palette.error.main
                                    }}
                                  >
                                    {enroll.progress.toFixed(1)}%
                                  </Typography>
                                </Box>
                              )}

                              {enroll.course_end_date && (
                                <Box>
                                  <Typography variant="caption" color="text.secondary" display="block">End Date</Typography>
                                  <Typography variant="body2" sx={{ mt: 0.5 }}>{formatDateForDisplay(enroll.course_end_date)}</Typography>
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
              })()
            )}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {enrollment.approval_status === 'Pending' && enrollment.eligibility_status === 'Eligible' && onApprove && onReject && (
          <>
            <Button color="success" variant="contained" onClick={() => { onApprove(enrollment.id); onClose(); }}>Approve</Button>
            <Button color="error" variant="outlined" onClick={() => { onReject(enrollment.id); onClose(); }}>Reject</Button>
          </>
        )}
        {enrollment.approval_status === 'Withdrawn' && onReapprove && (
          <Button color="primary" variant="contained" onClick={() => { onReapprove(enrollment.id); onClose(); }}>Reapprove</Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default UserDetailsDialog;

