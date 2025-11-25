import { importsAPI } from '../../../services/api';
import type { AlertMessage } from '../../../types';
import { AxiosError } from 'axios';

type SetMessage = React.Dispatch<React.SetStateAction<AlertMessage | null>>;

export const handleImportExcel = async (
  importFile: File | null,
  courseId: number,
  setMessage: SetMessage,
  setImportDialogOpen: (open: boolean) => void,
  setImportFile: (file: File | null) => void,
  fetchEnrollments: () => Promise<void>,
  fetchCourse: () => Promise<void>,
  setImportLoading: (loading: boolean) => void
): Promise<void> => {
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
    const axiosError = error as AxiosError<{ detail?: string }>;
    setMessage({ type: 'error', text: axiosError.response?.data?.detail || 'Error importing file' });
  } finally {
    setImportLoading(false);
  }
};

export const handleImportCSV = async (
  importFile: File | null,
  courseId: number,
  setMessage: SetMessage,
  setImportDialogOpen: (open: boolean) => void,
  setImportFile: (file: File | null) => void,
  fetchEnrollments: () => Promise<void>,
  fetchCourse: () => Promise<void>,
  setImportLoading: (loading: boolean) => void
): Promise<void> => {
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
    const axiosError = error as AxiosError<{ detail?: string }>;
    setMessage({ type: 'error', text: axiosError.response?.data?.detail || 'Error importing file' });
  } finally {
    setImportLoading(false);
  }
};

