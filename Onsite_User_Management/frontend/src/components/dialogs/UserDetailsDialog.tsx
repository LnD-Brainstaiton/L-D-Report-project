import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
} from '@mui/material';
import { EnrollmentWithDetails, CourseType, OnlineCourseEnrollment } from '../../types';
import { useStudentDetails } from '../../hooks/useStudentDetails';
import UserInfoSection from './UserDetails/UserInfoSection';
import StatsCard from './UserDetails/StatsCard';
import CourseHistory from './UserDetails/CourseHistory';
import { StatusChip } from '../common';

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
  const [courseType, setCourseType] = useState<CourseType>('onsite');
  const [viewingSbuHead, setViewingSbuHead] = useState(false);
  const [viewingReportingManager, setViewingReportingManager] = useState(false);
  const [sbuHeadEnrollment, setSbuHeadEnrollment] = useState<EnrollmentWithDetails | null>(null);
  const [reportingManagerEnrollment, setReportingManagerEnrollment] = useState<EnrollmentWithDetails | null>(null);

  const {
    studentEnrollments,
    onlineCourses,
    loadingEnrollments,
    completionStats,
    sbuHead,
    reportingManager,
    fetchStudentByEmployeeId
  } = useStudentDetails({ enrollment, open });

  if (!enrollment) return null;

  const handleViewSbuHead = async () => {
    if (!sbuHead) return;
    const sbuHeadEnroll = await fetchStudentByEmployeeId(sbuHead.employee_id);
    if (sbuHeadEnroll) {
      setSbuHeadEnrollment(sbuHeadEnroll);
      setViewingSbuHead(true);
    }
  };

  const handleViewReportingManager = async () => {
    if (!reportingManager) return;
    const rmEnroll = await fetchStudentByEmployeeId(reportingManager.employee_id);
    if (rmEnroll) {
      setReportingManagerEnrollment(rmEnroll);
      setViewingReportingManager(true);
    }
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
          <StatusChip status="Previous Employee" />
        )}
      </DialogTitle>
      <DialogContent>
        <UserInfoSection
          enrollment={enrollment}
          sbuHead={sbuHead}
          reportingManager={reportingManager}
          onViewSbuHead={handleViewSbuHead}
          onViewReportingManager={handleViewReportingManager}
        />

        <Grid item xs={12} sx={{ mt: 2 }}>
          <StatsCard courseType={courseType} stats={completionStats[courseType]} />
        </Grid>

        <CourseHistory
          courseType={courseType}
          setCourseType={setCourseType}
          loading={loadingEnrollments}
          enrollments={getDisplayEnrollments()}
        />
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

