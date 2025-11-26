import { useState, useEffect } from 'react';
import { studentsAPI } from '../../../services/api';
import type { Student, AlertMessage } from '../../../types';
import { AxiosError } from 'axios';

interface StudentWithEnrollments extends Student {
  enrollments?: any[];
  never_taken_course?: boolean;
  is_mentor?: boolean;
}

interface UseUsersDataReturn {
  allUsers: StudentWithEnrollments[];
  loading: boolean;
  employeeCount: number;
  mentorStatuses: Record<number, boolean>;
  updatingMentorStatus: Record<number, boolean>;
  departments: string[];
  designations: string[];
  message: AlertMessage | null;
  setMessage: React.Dispatch<React.SetStateAction<AlertMessage | null>>;
  setAllUsers: React.Dispatch<React.SetStateAction<StudentWithEnrollments[]>>;
  fetchUsers: () => Promise<void>;
  toggleMentorStatus: (userId: number) => Promise<void>;
}

export const useUsersData = (selectedDepartment: string, filterNeverTaken: string): UseUsersDataReturn => {
  const [allUsers, setAllUsers] = useState<StudentWithEnrollments[]>([]);
  const [loading, setLoading] = useState(true);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [mentorStatuses, setMentorStatuses] = useState<Record<number, boolean>>({});
  const [updatingMentorStatus, setUpdatingMentorStatus] = useState<Record<number, boolean>>({});
  const [departments, setDepartments] = useState<string[]>([]);
  const [designations, setDesignations] = useState<string[]>([]);
  const [message, setMessage] = useState<AlertMessage | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDepartment, filterNeverTaken]);

  const fetchDepartments = async () => {
    try {
      const response = await studentsAPI.getDepartments({ is_active: true });
      setDepartments((response.data as { departments?: string[] }).departments || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { is_active: true };
      if (selectedDepartment) params.department = selectedDepartment;
      const response = await studentsAPI.getAllWithCourses(params);
      let fetchedUsers = response.data as StudentWithEnrollments[];

      fetchedUsers.sort((a, b) => {
        const numA = parseInt(a.employee_id.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.employee_id.replace(/\D/g, '')) || 0;
        return numA - numB;
      });

      // Build mentor statuses from response
      const statusMap: Record<number, boolean> = {};
      fetchedUsers.forEach((user) => {
        if (user.is_mentor) {
          statusMap[user.id] = true;
        }
      });
      setMentorStatuses(statusMap);

      // Extract unique designations
      const uniqueDesignations = [...new Set(
        fetchedUsers
          .map((user) => user.designation)
          .filter((d): d is string => !!d && d.trim() !== '')
      )].sort();
      setDesignations(uniqueDesignations);

      setAllUsers(fetchedUsers);
      setEmployeeCount(fetchedUsers.length);
    } catch (error) {
      console.error('Error fetching users:', error);
      const axiosError = error as AxiosError<{ detail?: string }>;
      const errorMessage = axiosError.response?.data?.detail || axiosError.message || 'Error fetching users';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const toggleMentorStatus = async (userId: number) => {
    const isCurrentlyMentor = mentorStatuses[userId] || false;
    setUpdatingMentorStatus((prev) => ({ ...prev, [userId]: true }));

    try {
      if (isCurrentlyMentor) {
        await studentsAPI.removeMentorTag(userId);
        setMentorStatuses((prev) => ({ ...prev, [userId]: false }));
        setMessage({ type: 'success', text: 'Mentor tag removed successfully' });
      } else {
        await studentsAPI.tagAsMentor(userId);
        setMentorStatuses((prev) => ({ ...prev, [userId]: true }));
        setMessage({ type: 'success', text: 'User tagged as mentor successfully' });
      }
      // Refresh users to get updated is_mentor from server
      await fetchUsers();
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string }>;
      setMessage({ type: 'error', text: axiosError.response?.data?.detail || 'Error updating mentor tag' });
    } finally {
      setUpdatingMentorStatus((prev) => ({ ...prev, [userId]: false }));
    }
  };

  return {
    allUsers,
    loading,
    employeeCount,
    mentorStatuses,
    updatingMentorStatus,
    departments,
    designations,
    message,
    setMessage,
    setAllUsers,
    fetchUsers,
    toggleMentorStatus,
  };
};

