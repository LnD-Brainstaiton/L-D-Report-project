/**
 * Hook for managing previous employees data
 */

import { useState, useEffect, useCallback } from 'react';
import { studentsAPI } from '../../../services/api';

export function usePreviousEmployeesData(selectedDepartment, filterNeverTaken) {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [departments, setDepartments] = useState([]);

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await studentsAPI.getDepartments({ is_active: false });
      setDepartments(response.data.departments || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { is_active: false };
      if (selectedDepartment) params.department = selectedDepartment;
      const response = await studentsAPI.getAllWithCourses(params);
      let fetchedUsers = response.data;

      // Sort by employee_id (ascending)
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

  const restoreEmployee = async (user) => {
    try {
      await studentsAPI.restore(user.id);
      setMessage({ type: 'success', text: `Employee ${user.name} restored successfully` });
      await fetchUsers();
      return true;
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Error restoring employee' });
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

