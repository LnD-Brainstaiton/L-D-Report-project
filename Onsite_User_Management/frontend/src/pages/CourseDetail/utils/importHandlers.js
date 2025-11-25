import { importsAPI } from '../../../services/api';

/**
 * Handle Excel import
 */
export const handleImportExcel = async (
  importFile,
  courseId,
  setMessage,
  setImportDialogOpen,
  setImportFile,
  fetchEnrollments,
  fetchCourse,
  setImportLoading
) => {
  if (!importFile) {
    setMessage({ type: 'error', text: 'Please select a file' });
    return;
  }
  setImportLoading(true);
  try {
    await importsAPI.uploadExcel(importFile, courseId);
    setMessage({ type: 'success', text: 'Enrollments imported successfully' });
    setImportDialogOpen(false);
    setImportFile(null);
    await fetchEnrollments();
    await fetchCourse();
  } catch (error) {
    setMessage({ type: 'error', text: error.response?.data?.detail || 'Error importing file' });
  } finally {
    setImportLoading(false);
  }
};

/**
 * Handle CSV import
 */
export const handleImportCSV = async (
  importFile,
  courseId,
  setMessage,
  setImportDialogOpen,
  setImportFile,
  fetchEnrollments,
  fetchCourse,
  setImportLoading
) => {
  if (!importFile) {
    setMessage({ type: 'error', text: 'Please select a file' });
    return;
  }
  setImportLoading(true);
  try {
    await importsAPI.uploadCSV(importFile, courseId);
    setMessage({ type: 'success', text: 'Enrollments imported successfully' });
    setImportDialogOpen(false);
    setImportFile(null);
    await fetchEnrollments();
    await fetchCourse();
  } catch (error) {
    setMessage({ type: 'error', text: error.response?.data?.detail || 'Error importing file' });
  } finally {
    setImportLoading(false);
  }
};

