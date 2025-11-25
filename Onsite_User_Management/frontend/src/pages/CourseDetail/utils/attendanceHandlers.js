import { completionsAPI } from '../../../services/api';

/**
 * Handle attendance upload
 */
export const handleUploadAttendance = async (
  attendanceFile,
  courseId,
  setMessage,
  setAttendanceDialogOpen,
  setAttendanceFile,
  fetchEnrollments,
  setAttendanceLoading
) => {
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
    setMessage({ type: 'error', text: error.response?.data?.detail || 'Error uploading file' });
  } finally {
    setAttendanceLoading(false);
  }
};

/**
 * Handle edit attendance
 */
export const handleEditAttendance = async (
  selectedEnrollmentForEdit,
  editClassesAttended,
  editScore,
  course,
  setMessage,
  setEditAttendanceDialogOpen,
  setSelectedEnrollmentForEdit,
  setEditClassesAttended,
  setEditScore,
  fetchEnrollments
) => {
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
    await completionsAPI.updateEnrollmentAttendance(
      selectedEnrollmentForEdit.id,
      classesAttended,
      score
    );
    setMessage({ type: 'success', text: 'Attendance and score updated successfully' });
    setEditAttendanceDialogOpen(false);
    setSelectedEnrollmentForEdit(null);
    setEditClassesAttended('');
    setEditScore('');
    await fetchEnrollments();
  } catch (error) {
    setMessage({ type: 'error', text: error.response?.data?.detail || 'Error updating attendance' });
  }
};

