import { useState, useEffect, useCallback } from 'react';
import { studentsAPI } from '../../../services/api';
import type { Student, AlertMessage } from '../../../types';
import { AxiosError } from 'axios';

interface UsePreviousEmployeesDataReturn {
  allUsers: Student[];
  loading: boolean;
  message: AlertMessage | null;
  setMessage: React.Dispatch<React.SetStateAction<AlertMessage | null>>;
  departments: string[];
  fetchUsers: () => Promise<void>;
  restoreEmployee: (user: Student) => Promise<boolean>;
}

export function usePreviousEmployeesData(
  selectedDepartment: string,
  filterNeverTaken: string
): UsePreviousEmployeesDataReturn {
  const [allUsers, setAllUsers] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<AlertMessage | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await studentsAPI.getDepartments({ is_active: false });
      setDepartments((response.data as { departments?: string[] }).departments || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { is_active: false };
      if (selectedDepartment) params.department = selectedDepartment;
      const response = await studentsAPI.getAllWithCourses(params);
      let fetchedUsers = response.data as Student[];

      fetchedUsers.sort((a, b) => {
        const numA = parseInt(a.employee_id.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.employee_id.replace(/\D/g, '')) || 0;
        return numA - numB;
      });

      setAllUsers(fetchedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage({ type: 'error', text: 'Error fetching users' });
    } finally {
      setLoading(false);
    }
  }, [selectedDepartment]);

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, [fetchUsers, fetchDepartments]);

  const restoreEmployee = async (user: Student): Promise<boolean> => {
    try {
      await studentsAPI.restore(user.id);
      setMessage({ type: 'success', text: `Employee ${user.name} restored successfully` });
      await fetchUsers();
      return true;
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string }>;
      setMessage({ type: 'error', text: axiosError.response?.data?.detail || 'Error restoring employee' });
      return false;
    }
  };

  return {
    allUsers,
    loading,
    message,
    setMessage,
    departments,
    fetchUsers,
    restoreEmployee,
  };
}

export default usePreviousEmployeesData;

