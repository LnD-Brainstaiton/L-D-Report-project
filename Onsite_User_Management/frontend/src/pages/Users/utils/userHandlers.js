import { studentsAPI } from '../../../services/api';
import { formatDateForAPI, generateTimestampFilename } from '../../../utils/dateUtils';

/**
 * Create a new student/employee
 */
export const handleCreateStudent = async (newStudent, setMessage, setCreateDialogOpen, setNewStudent, fetchUsers) => {
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
    setMessage({ type: 'error', text: error.response?.data?.detail || 'Error creating student' });
  }
};

/**
 * Remove an employee
 */
export const handleRemoveEmployee = async (selectedUserToRemove, setMessage, setRemoveDialogOpen, setSelectedUserToRemove, fetchUsers) => {
  if (!selectedUserToRemove) return;
  
  try {
    await studentsAPI.remove(selectedUserToRemove.id);
    setMessage({ type: 'success', text: `Employee ${selectedUserToRemove.name} removed successfully` });
    setRemoveDialogOpen(false);
    setSelectedUserToRemove(null);
    await fetchUsers();
  } catch (error) {
    setMessage({ type: 'error', text: error.response?.data?.detail || 'Error removing employee' });
  }
};

/**
 * Import employees from Excel file
 */
export const handleImportExcel = async (importFile, setMessage, setImportLoading, setImportResults, setImportFile, fetchUsers) => {
  if (!importFile) {
    setMessage({ type: 'error', text: 'Please select a file' });
    return;
  }

  setImportLoading(true);
  setMessage(null);
  try {
    const response = await studentsAPI.importExcel(importFile);
    setImportResults(response.data.results);
    setMessage({ type: 'success', text: response.data.message });
    setImportFile(null);
    await fetchUsers();
  } catch (error) {
    setMessage({ type: 'error', text: error.response?.data?.detail || 'Error uploading file' });
  } finally {
    setImportLoading(false);
  }
};

/**
 * Import employees from CSV file
 */
export const handleImportCSV = async (importFile, setMessage, setImportLoading, setImportResults, setImportFile, fetchUsers) => {
  if (!importFile) {
    setMessage({ type: 'error', text: 'Please select a file' });
    return;
  }

  setImportLoading(true);
  setMessage(null);
  try {
    const response = await studentsAPI.importCSV(importFile);
    setImportResults(response.data.results);
    setMessage({ type: 'success', text: response.data.message });
    setImportFile(null);
    await fetchUsers();
  } catch (error) {
    setMessage({ type: 'error', text: error.response?.data?.detail || 'Error uploading file' });
  } finally {
    setImportLoading(false);
  }
};

/**
 * Generate overall training report
 */
export const handleGenerateOverallReport = async (setMessage) => {
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
      const blob = new Blob([response.data], {
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
    if (error.response) {
      if (error.response.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          try {
            const json = JSON.parse(text);
            errorMessage = json.detail || errorMessage;
          } catch {
            errorMessage = text || errorMessage;
          }
        } catch (blobError) {
          errorMessage = 'Error generating report: Invalid response format';
        }
      } else if (error.response.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (typeof error.response.data === 'string') {
        errorMessage = error.response.data;
      } else if (error.response.status) {
        errorMessage = `Error generating report: ${error.response.status} ${error.response.statusText || ''}`;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    setMessage({ type: 'error', text: errorMessage });
  }
};

