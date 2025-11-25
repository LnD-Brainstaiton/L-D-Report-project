import { useState, useEffect } from 'react';
import { studentsAPI } from '../../../services/api';

export const useUsersData = (selectedDepartment, filterNeverTaken) => {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [mentorStatuses, setMentorStatuses] = useState({});
  const [updatingMentorStatus, setUpdatingMentorStatus] = useState({});
  const [departments, setDepartments] = useState([]);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchMentorStatuses();
    fetchDepartments();
  }, [selectedDepartment, filterNeverTaken]);

  const fetchDepartments = async () => {
    try {
      const response = await studentsAPI.getDepartments({ is_active: true });
      setDepartments(response.data.departments || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchMentorStatuses = async () => {
    try {
      // Fetch all users and check which ones have mentor tags
      const response = await studentsAPI.getAll({ is_active: true });
      const users = response.data || [];
      const statusMap = {};
      users.forEach(user => {
        if (user.is_mentor) {
          statusMap[user.id] = true;
        }
      });
      setMentorStatuses(statusMap);
    } catch (error) {
      console.error('Error fetching mentor statuses:', error);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = { is_active: true };
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
      setEmployeeCount(fetchedUsers.length);
    } catch (error) {
      console.error('Error fetching users:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Error fetching users';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const toggleMentorStatus = async (userId) => {
    const isCurrentlyMentor = mentorStatuses[userId] || false;
    setUpdatingMentorStatus(prev => ({ ...prev, [userId]: true }));
    
    try {
      if (isCurrentlyMentor) {
        await studentsAPI.removeMentorTag(userId);
        setMentorStatuses(prev => ({ ...prev, [userId]: false }));
        setMessage({ type: 'success', text: 'Mentor tag removed successfully' });
      } else {
        await studentsAPI.tagAsMentor(userId);
        setMentorStatuses(prev => ({ ...prev, [userId]: true }));
        setMessage({ type: 'success', text: 'User tagged as mentor successfully' });
      }
      await fetchMentorStatuses();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Error updating mentor tag' });
    } finally {
      setUpdatingMentorStatus(prev => ({ ...prev, [userId]: false }));
    }
  };

  return {
    allUsers,
    loading,
    employeeCount,
    mentorStatuses,
    updatingMentorStatus,
    departments,
    message,
    setMessage,
    setAllUsers,
    fetchUsers,
    toggleMentorStatus,
  };
};

