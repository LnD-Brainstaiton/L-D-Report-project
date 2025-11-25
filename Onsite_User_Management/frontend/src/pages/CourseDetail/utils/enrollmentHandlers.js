import { enrollmentsAPI } from '../../../services/api';

/**
 * Handle enrollment approval
 */
export const handleApprove = async (enrollmentId, setMessage, fetchEnrollments, fetchCourse) => {
  try {
    await enrollmentsAPI.approve({ enrollment_id: enrollmentId, approved: true }, 'Admin');
    setMessage({ type: 'success', text: 'Enrollment approved successfully' });
    await fetchEnrollments();
    await fetchCourse();
  } catch (error) {
    setMessage({ type: 'error', text: error.response?.data?.detail || 'Error approving enrollment' });
  }
};

/**
 * Handle enrollment rejection
 */
export const handleReject = async (enrollmentId, setMessage, fetchEnrollments) => {
  try {
    await enrollmentsAPI.approve(
      { enrollment_id: enrollmentId, approved: false, rejection_reason: 'Rejected by admin' },
      'Admin'
    );
    setMessage({ type: 'success', text: 'Enrollment rejected' });
    await fetchEnrollments();
  } catch (error) {
    setMessage({ type: 'error', text: error.response?.data?.detail || 'Error rejecting enrollment' });
  }
};

/**
 * Handle enrollment withdrawal
 */
export const handleWithdrawConfirm = async (
  selectedEnrollment,
  withdrawalReason,
  setMessage,
  setWithdrawDialogOpen,
  setSelectedEnrollment,
  setWithdrawalReason,
  fetchEnrollments,
  fetchCourse
) => {
  if (!withdrawalReason.trim()) {
    setMessage({ type: 'error', text: 'Please provide a reason for withdrawal' });
    return;
  }
  try {
    await enrollmentsAPI.withdraw(selectedEnrollment.id, withdrawalReason, 'Admin');
    setMessage({ type: 'success', text: 'Student withdrawn successfully' });
    setWithdrawDialogOpen(false);
    setSelectedEnrollment(null);
    setWithdrawalReason('');
    await fetchEnrollments();
    await fetchCourse();
  } catch (error) {
    setMessage({ type: 'error', text: error.response?.data?.detail || 'Error withdrawing student' });
  }
};

/**
 * Handle enrollment reapproval
 */
export const handleReapprove = async (enrollmentId, setMessage, fetchEnrollments, fetchCourse) => {
  try {
    await enrollmentsAPI.reapprove(enrollmentId, 'Admin');
    setMessage({ type: 'success', text: 'Student reapproved successfully' });
    await fetchEnrollments();
    await fetchCourse();
  } catch (error) {
    setMessage({ type: 'error', text: error.response?.data?.detail || 'Error reapproving student' });
  }
};

/**
 * Handle manual enrollment
 */
export const handleManualEnrollConfirm = async (
  selectedStudentId,
  courseId,
  setMessage,
  setManualEnrollDialogOpen,
  setSelectedStudentId,
  fetchEnrollments,
  fetchCourse
) => {
  if (!selectedStudentId) {
    setMessage({ type: 'error', text: 'Please select a student' });
    return;
  }
  try {
    await enrollmentsAPI.create({
      student_id: parseInt(selectedStudentId),
      course_id: parseInt(courseId),
    });
    setMessage({ type: 'success', text: 'Student enrolled successfully' });
    setManualEnrollDialogOpen(false);
    setSelectedStudentId('');
    await fetchEnrollments();
    await fetchCourse();
  } catch (error) {
    setMessage({ type: 'error', text: error.response?.data?.detail || 'Error enrolling student' });
  }
};

