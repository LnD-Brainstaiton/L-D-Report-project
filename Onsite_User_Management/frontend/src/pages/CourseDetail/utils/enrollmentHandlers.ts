import { enrollmentsAPI } from '../../../services/api';
import type { AlertMessage, Enrollment } from '../../../types';
import { AxiosError } from 'axios';

type SetMessage = React.Dispatch<React.SetStateAction<AlertMessage | null>>;

export const handleApprove = async (
  enrollmentId: number,
  setMessage: SetMessage,
  fetchEnrollments: () => Promise<void>,
  fetchCourse: () => Promise<void>
): Promise<void> => {
  try {
    await enrollmentsAPI.approve({ enrollment_id: enrollmentId, approved: true }, 'Admin');
    setMessage({ type: 'success', text: 'Enrollment approved successfully' });
    await fetchEnrollments();
    await fetchCourse();
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    setMessage({ type: 'error', text: axiosError.response?.data?.detail || 'Error approving enrollment' });
  }
};

export const handleReject = async (
  enrollmentId: number,
  setMessage: SetMessage,
  fetchEnrollments: () => Promise<void>
): Promise<void> => {
  try {
    await enrollmentsAPI.approve(
      { enrollment_id: enrollmentId, approved: false, rejection_reason: 'Rejected by admin' },
      'Admin'
    );
    setMessage({ type: 'success', text: 'Enrollment rejected' });
    await fetchEnrollments();
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    setMessage({ type: 'error', text: axiosError.response?.data?.detail || 'Error rejecting enrollment' });
  }
};

export const handleWithdrawConfirm = async (
  selectedEnrollment: Enrollment | null,
  withdrawalReason: string,
  setMessage: SetMessage,
  setWithdrawDialogOpen: (open: boolean) => void,
  setSelectedEnrollment: (enrollment: Enrollment | null) => void,
  setWithdrawalReason: (reason: string) => void,
  fetchEnrollments: () => Promise<void>,
  fetchCourse: () => Promise<void>
): Promise<void> => {
  if (!withdrawalReason.trim()) {
    setMessage({ type: 'error', text: 'Please provide a reason for withdrawal' });
    return;
  }
  if (!selectedEnrollment) return;

  try {
    await enrollmentsAPI.withdraw(selectedEnrollment.id, withdrawalReason, 'Admin');
    setMessage({ type: 'success', text: 'Student withdrawn successfully' });
    setWithdrawDialogOpen(false);
    setSelectedEnrollment(null);
    setWithdrawalReason('');
    await fetchEnrollments();
    await fetchCourse();
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    setMessage({ type: 'error', text: axiosError.response?.data?.detail || 'Error withdrawing student' });
  }
};

export const handleReapprove = async (
  enrollmentId: number,
  setMessage: SetMessage,
  fetchEnrollments: () => Promise<void>,
  fetchCourse: () => Promise<void>
): Promise<void> => {
  try {
    await enrollmentsAPI.reapprove(enrollmentId, 'Admin');
    setMessage({ type: 'success', text: 'Student reapproved successfully' });
    await fetchEnrollments();
    await fetchCourse();
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    setMessage({ type: 'error', text: axiosError.response?.data?.detail || 'Error reapproving student' });
  }
};

export const handleManualEnrollConfirm = async (
  selectedStudentId: string,
  courseId: number | string,
  setMessage: SetMessage,
  setManualEnrollDialogOpen: (open: boolean) => void,
  setSelectedStudentId: (id: string) => void,
  fetchEnrollments: () => Promise<void>,
  fetchCourse: () => Promise<void>
): Promise<void> => {
  if (!selectedStudentId) {
    setMessage({ type: 'error', text: 'Please select a student' });
    return;
  }
  try {
    await enrollmentsAPI.create({
      student_id: parseInt(selectedStudentId),
      course_id: parseInt(String(courseId)),
    });
    setMessage({ type: 'success', text: 'Student enrolled successfully' });
    setManualEnrollDialogOpen(false);
    setSelectedStudentId('');
    await fetchEnrollments();
    await fetchCourse();
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    setMessage({ type: 'error', text: axiosError.response?.data?.detail || 'Error enrolling student' });
  }
};

