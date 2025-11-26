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
  student_exit_reason?: string | null; // Why the employee left
  is_previous_employee?: boolean; // Flag to indicate this is a previous employee
  batch_code?: string;
  completion_status?: string;
  attendance_percentage?: number;
  attendance_status?: string;
  present?: number;
  total_attendance?: number;
  course_type?: string;
  is_lms_course?: boolean;
  // SBU Head and Reporting Manager from ERP
  sbu_head_employee_id?: string | null;
  sbu_head_name?: string | null;
  reporting_manager_employee_id?: string | null;
  reporting_manager_name?: string | null;
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

interface SbuHead {
  id: number;
  employee_id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
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
  const [sbuHead, setSbuHead] = useState<SbuHead | null>(null);
  const [reportingManager, setReportingManager] = useState<{ employee_id: string; name: string } | null>(null);
  const [viewingSbuHead, setViewingSbuHead] = useState(false);
  const [viewingReportingManager, setViewingReportingManager] = useState(false);
  const [sbuHeadEnrollment, setSbuHeadEnrollment] = useState<EnrollmentWithDetails | null>(null);
  const [reportingManagerEnrollment, setReportingManagerEnrollment] = useState<EnrollmentWithDetails | null>(null);

  const [completionStats, setCompletionStats] = useState<Record<CourseType, CompletionStats>>({
    onsite: { rate: 0, completed: 0, total: 0 },
    online: { rate: 0, completed: 0, total: 0 },
    external: { rate: 0, completed: 0, total: 0 },
  });

  // Use SBU Head and Reporting Manager directly from enrollment (fetched from ERP)
  const loadSbuHeadAndReportingManager = () => {
    // SBU Head from ERP data
    if (enrollment?.sbu_head_employee_id && enrollment?.sbu_head_name) {
      setSbuHead({
        id: 0,
        employee_id: enrollment.sbu_head_employee_id,
        name: enrollment.sbu_head_name,
        email: '',
        department: enrollment.student_department || '',
        designation: 'SBU Head',
      });
    } else {
      setSbuHead(null);
    }
    
    // Reporting Manager from ERP data
    if (enrollment?.reporting_manager_employee_id && enrollment?.reporting_manager_name) {
      setReportingManager({
        employee_id: enrollment.reporting_manager_employee_id,
        name: enrollment.reporting_manager_name,
      });
    } else {
      setReportingManager(null);
    }
  };

  const handleViewSbuHead = () => {
    if (!sbuHead) return;
    
    // Create a mock enrollment for the SBU head to open their profile
    const sbuHeadEnroll: EnrollmentWithDetails = {
      id: 0,
      student_id: sbuHead.id,
      student_name: sbuHead.name,
      student_email: sbuHead.email,
      student_department: sbuHead.department,
      student_employee_id: sbuHead.employee_id,
      student_designation: sbuHead.designation,
      course_id: 0,
      approval_status: 'Approved',
      eligibility_status: 'Eligible',
    };
    
    setSbuHeadEnrollment(sbuHeadEnroll);
    setViewingSbuHead(true);
  };

  const handleViewReportingManager = () => {
    if (!reportingManager) return;
    
    // Create a mock enrollment for the Reporting Manager to open their profile
    const rmEnroll: EnrollmentWithDetails = {
      id: 0,
      student_id: 0,
      student_name: reportingManager.name,
      student_email: '',
      student_department: enrollment?.student_department || '',
      student_employee_id: reportingManager.employee_id,
      student_designation: '',
      course_id: 0,
      approval_status: 'Approved',
      eligibility_status: 'Eligible',
    };
    
    setReportingManagerEnrollment(rmEnroll);
    setViewingReportingManager(true);
  };

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
        progress: course.progress ?? 0,
        course_end_date: course.course_end_date,
        date_assigned: course.course_start_date,
        lastaccess: course.lastaccess,
        is_lms_course: true,
        is_mandatory: course.is_mandatory === true || course.is_mandatory === 1,
      }));
      
      // Sort courses by priority:
      // 1. Completed + Mandatory
      // 2. Completed + Not Mandatory
      // 3. Mandatory (not completed, not failed)
      // 4. In Progress
      // 5. Failed
      // 6. Not Started
      mappedOnlineCourses.sort((a, b) => {
        const getPriority = (course: OnlineCourseEnrollment): number => {
          const isCompleted = course.completion_status === 'Completed';
          const isFailed = course.completion_status === 'Failed';
          const isInProgress = course.completion_status === 'In Progress';
          const isMandatory = course.is_mandatory;
          
          if (isCompleted && isMandatory) return 0;
          if (isCompleted && !isMandatory) return 1;
          if (isMandatory && !isCompleted && !isFailed) return 2;
          if (isInProgress) return 3;
          if (isFailed) return 4;
          return 5; // Not Started
        };
        
        return getPriority(a) - getPriority(b);
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
      loadSbuHeadAndReportingManager();
    } else {
      setStudentEnrollments([]);
      setSbuHead(null);
      setReportingManager(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, enrollment?.student_id, enrollment?.sbu_head_employee_id, enrollment?.reporting_manager_employee_id]);

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
              {enrollment.is_previous_employee ? 'Employee Information' : 'Employee Information'}
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          {/* Left Column */}
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">Name</Typography>
            <Typography variant="body1" gutterBottom>{enrollment.student_name}</Typography>
          </Grid>

          {/* Right Column */}
          {reportingManager && (
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Reporting Manager</Typography>
              <Typography variant="body1" gutterBottom>
                <Chip
                  label={`${reportingManager.name} (${reportingManager.employee_id.toUpperCase()})`}
                  size="small"
                  onClick={handleViewReportingManager}
                  sx={{
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    color: '#92400e',
                    fontWeight: 600,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #fde68a 0%, #fcd34d 100%)',
                    },
                  }}
                />
              </Typography>
            </Grid>
          )}
          {!reportingManager && (
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Reporting Manager</Typography>
              <Typography variant="body1" gutterBottom color="text.secondary">N/A</Typography>
            </Grid>
          )}

          {/* Left Column */}
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">Employee ID</Typography>
            <Typography variant="body1" gutterBottom>{enrollment.student_employee_id || 'N/A'}</Typography>
          </Grid>

          {/* Right Column - Hide SBU Head if they are the SBU Head themselves */}
          {sbuHead && sbuHead.employee_id?.toUpperCase() !== enrollment.student_employee_id?.toUpperCase() && (
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">SBU Head</Typography>
              <Typography variant="body1" gutterBottom>
                <Chip
                  label={`${sbuHead.name} (${sbuHead.employee_id.toUpperCase()})`}
                  size="small"
                  onClick={handleViewSbuHead}
                  sx={{
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                    color: '#3730a3',
                    fontWeight: 600,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #c7d2fe 0%, #a5b4fc 100%)',
                    },
                  }}
                />
              </Typography>
            </Grid>
          )}
          {(!sbuHead || sbuHead.employee_id?.toUpperCase() === enrollment.student_employee_id?.toUpperCase()) && (
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">SBU Head</Typography>
              <Typography variant="body1" gutterBottom color="text.secondary">N/A</Typography>
            </Grid>
          )}

          {/* Left Column */}
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">Email</Typography>
            <Typography variant="body1" gutterBottom>{enrollment.student_email}</Typography>
          </Grid>

          {/* Right Column */}
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">BS Joining Date</Typography>
            <Typography variant="body1" gutterBottom>
              {enrollment.student_bs_joining_date ? formatDateForDisplay(enrollment.student_bs_joining_date) : 'N/A'}
            </Typography>
          </Grid>

          {/* Left Column */}
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">Designation</Typography>
            <Typography variant="body1" gutterBottom>{enrollment.student_designation || 'N/A'}</Typography>
          </Grid>

          {/* Right Column */}
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">BS Experience</Typography>
            <Typography variant="body1" gutterBottom>{formatExperience(enrollment.student_bs_joining_date)}</Typography>
          </Grid>

          {/* Left Column */}
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">SBU</Typography>
            <Typography variant="body1" gutterBottom>
              <Chip label={enrollment.student_department} size="small" sx={{ background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', color: '#1e40af', fontWeight: 600 }} />
            </Typography>
          </Grid>

          {/* Right Column */}
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">Total Experience</Typography>
            <Typography variant="body1" gutterBottom>
              {enrollment.student_total_experience 
                ? `${enrollment.student_total_experience} years` 
                : 'N/A'}
            </Typography>
          </Grid>

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

                              {enroll.is_lms_course && (
                                <Box>
                                  <Typography variant="caption" color="text.secondary" display="block">Progress</Typography>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontWeight: 600,
                                      mt: 0.5,
                                      color: (enroll.progress || 0) >= 100 ? theme.palette.success.main :
                                             (enroll.progress || 0) >= 50 ? theme.palette.warning.main : theme.palette.error.main
                                    }}
                                  >
                                    {(enroll.progress || 0).toFixed(1)}%
                                  </Typography>
                                </Box>
                              )}

                              {enroll.is_lms_course && enroll.lastaccess && (
                                <Box>
                                  <Typography variant="caption" color="text.secondary" display="block">Last Access</Typography>
                                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                                    {formatDateForDisplay(enroll.lastaccess)}
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

      {/* Recursive dialog for viewing SBU Head profile */}
      {viewingSbuHead && sbuHeadEnrollment && (
        <UserDetailsDialog
          open={viewingSbuHead}
          onClose={() => {
            setViewingSbuHead(false);
            setSbuHeadEnrollment(null);
          }}
          enrollment={sbuHeadEnrollment}
        />
      )}

      {/* Recursive dialog for viewing Reporting Manager profile */}
      {viewingReportingManager && reportingManagerEnrollment && (
        <UserDetailsDialog
          open={viewingReportingManager}
          onClose={() => {
            setViewingReportingManager(false);
            setReportingManagerEnrollment(null);
          }}
          enrollment={reportingManagerEnrollment}
        />
      )}
    </Dialog>
  );
};

export default UserDetailsDialog;

