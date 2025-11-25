import { completionsAPI } from '../../../services/api';
import type { AlertMessage, Enrollment } from '../../../types';
import { AxiosError } from 'axios';

type SetMessage = React.Dispatch<React.SetStateAction<AlertMessage | null>>;

export const handleUploadAttendance = async (
  attendanceFile: File | null,
  courseId: number,
  setMessage: SetMessage,
  setAttendanceDialogOpen: (open: boolean) => void,
  setAttendanceFile: (file: File | null) => void,
  fetchEnrollments: () => Promise<void>,
  setAttendanceLoading: (loading: boolean) => void
): Promise<void> => {
  if (!attendanceFile) {
    setMessage({ type: 'error', text: 'Please select a file' });
    return;
  }
  setAttendanceLoading(true);
  try {
    await completionsAPI.uploadAttendance(attendanceFile, courseId);
    setMessage({ type: 'success', text: 'Attendance and scores uploaded successfully' });
    setAttendanceDialogOpen(false);
    setAttendanceFile(null);
    await fetchEnrollments();
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    setMessage({ type: 'error', text: axiosError.response?.data?.detail || 'Error uploading file' });
  } finally {
    setAttendanceLoading(false);
  }
};

export const handleEditAttendance = async (
  selectedEnrollmentForEdit: Enrollment | null,
  editClassesAttended: string,
  editScore: string,
  course: any,
  setMessage: SetMessage,
  setEditAttendanceDialogOpen: (open: boolean) => void,
  setSelectedEnrollmentForEdit: (enrollment: Enrollment | null) => void,
  setEditClassesAttended: (value: string) => void,
  setEditScore: (value: string) => void
): Promise<void> => {
  if (!selectedEnrollmentForEdit) return;
  const classesAttended = parseInt(editClassesAttended);
  const score = parseFloat(editScore);
  if (isNaN(classesAttended) || classesAttended < 0) {
    setMessage({ type: 'error', text: 'Please enter a valid number of classes attended' });
    return;
  }
  if (isNaN(score) || score < 0 || score > 100) {
    setMessage({ type: 'error', text: 'Please enter a valid score between 0 and 100' });
    return;
  }
  try {
    await completionsAPI.updateEnrollmentAttendance(selectedEnrollmentForEdit.id, classesAttended, score);
    setMessage({ type: 'success', text: 'Attendance and score updated successfully' });
    setEditAttendanceDialogOpen(false);
    setSelectedEnrollmentForEdit(null);
    setEditClassesAttended('');
    setEditScore('');
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    setMessage({ type: 'error', text: axiosError.response?.data?.detail || 'Error updating attendance' });
  }
};

