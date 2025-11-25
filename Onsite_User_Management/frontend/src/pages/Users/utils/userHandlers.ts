import { studentsAPI } from '../../../services/api';
import { formatDateForAPI, generateTimestampFilename } from '../../../utils/dateUtils';
import type { AlertMessage } from '../../../types';
import { AxiosError } from 'axios';

interface NewStudent {
  employee_id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  experience_years: number;
  career_start_date: Date | null;
  bs_joining_date: Date | null;
}

interface StudentToRemove {
  id: number;
  name: string;
}

interface ImportResults {
  total: number;
  created: number;
  updated: number;
  errors?: Array<{ error?: string } | string>;
}

type SetMessage = React.Dispatch<React.SetStateAction<AlertMessage | null>>;

export const handleCreateStudent = async (
  newStudent: NewStudent,
  setMessage: SetMessage,
  setCreateDialogOpen: (open: boolean) => void,
  setNewStudent: (student: NewStudent) => void,
  fetchUsers: () => Promise<void>
): Promise<void> => {
  try {
    const studentData = {
      ...newStudent,
      career_start_date: formatDateForAPI(newStudent.career_start_date),
      bs_joining_date: formatDateForAPI(newStudent.bs_joining_date),
    };
    await studentsAPI.create(studentData);
    setMessage({ type: 'success', text: 'Student created successfully' });
    setCreateDialogOpen(false);
    setNewStudent({
      employee_id: '',
      name: '',
      email: '',
      department: 'IT',
      designation: '',
      experience_years: 0,
      career_start_date: null,
      bs_joining_date: null,
    });
    await fetchUsers();
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    setMessage({ type: 'error', text: axiosError.response?.data?.detail || 'Error creating student' });
  }
};

export const handleRemoveEmployee = async (
  selectedUserToRemove: StudentToRemove | null,
  setMessage: SetMessage,
  setRemoveDialogOpen: (open: boolean) => void,
  setSelectedUserToRemove: (user: StudentToRemove | null) => void,
  fetchUsers: () => Promise<void>
): Promise<void> => {
  if (!selectedUserToRemove) return;

  try {
    await studentsAPI.remove(selectedUserToRemove.id);
    setMessage({ type: 'success', text: `Employee ${selectedUserToRemove.name} removed successfully` });
    setRemoveDialogOpen(false);
    setSelectedUserToRemove(null);
    await fetchUsers();
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    setMessage({ type: 'error', text: axiosError.response?.data?.detail || 'Error removing employee' });
  }
};

export const handleImportExcel = async (
  importFile: File | null,
  setMessage: SetMessage,
  setImportLoading: (loading: boolean) => void,
  setImportResults: (results: ImportResults | null) => void,
  setImportFile: (file: File | null) => void,
  fetchUsers: () => Promise<void>
): Promise<void> => {
  if (!importFile) {
    setMessage({ type: 'error', text: 'Please select a file' });
    return;
  }

  setImportLoading(true);
  setMessage(null);
  try {
    const response = await studentsAPI.importExcel(importFile);
    const responseData: any = response.data;
    setImportResults(responseData.results || responseData);
    setMessage({ type: 'success', text: responseData.message || 'Import completed successfully' });
    setImportFile(null);
    await fetchUsers();
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    setMessage({ type: 'error', text: axiosError.response?.data?.detail || 'Error uploading file' });
  } finally {
    setImportLoading(false);
  }
};

export const handleImportCSV = async (
  importFile: File | null,
  setMessage: SetMessage,
  setImportLoading: (loading: boolean) => void,
  setImportResults: (results: ImportResults | null) => void,
  setImportFile: (file: File | null) => void,
  fetchUsers: () => Promise<void>
): Promise<void> => {
  if (!importFile) {
    setMessage({ type: 'error', text: 'Please select a file' });
    return;
  }

  setImportLoading(true);
  setMessage(null);
  try {
    const response = await studentsAPI.importCSV(importFile);
    const responseData: any = response.data;
    setImportResults(responseData.results || responseData);
    setMessage({ type: 'success', text: responseData.message || 'Import completed successfully' });
    setImportFile(null);
    await fetchUsers();
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    setMessage({ type: 'error', text: axiosError.response?.data?.detail || 'Error uploading file' });
  } finally {
    setImportLoading(false);
  }
};

export const handleGenerateOverallReport = async (setMessage: SetMessage): Promise<void> => {
  try {
    setMessage(null);
    const response = await studentsAPI.generateOverallReport();

    if (response.data instanceof Blob) {
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', generateTimestampFilename('training_history_report', '.xlsx'));
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'Report generated successfully' });
    } else {
      const blob = new Blob([response.data as BlobPart], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', generateTimestampFilename('training_history_report', '.xlsx'));
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'Report generated successfully' });
    }
  } catch (error) {
    console.error('Error generating report:', error);
    let errorMessage = 'Error generating report';
    const axiosError = error as AxiosError<any>;
    if (axiosError.response) {
      if (axiosError.response.data instanceof Blob) {
        try {
          const text = await axiosError.response.data.text();
          try {
            const json = JSON.parse(text);
            errorMessage = json.detail || errorMessage;
          } catch {
            errorMessage = text || errorMessage;
          }
        } catch {
          errorMessage = 'Error generating report: Invalid response format';
        }
      } else if (axiosError.response.data?.detail) {
        errorMessage = axiosError.response.data.detail;
      } else if (typeof axiosError.response.data === 'string') {
        errorMessage = axiosError.response.data;
      } else if (axiosError.response.status) {
        errorMessage = `Error generating report: ${axiosError.response.status} ${axiosError.response.statusText || ''}`;
      }
    } else if (axiosError.message) {
      errorMessage = axiosError.message;
    }
    setMessage({ type: 'error', text: errorMessage });
  }
};

