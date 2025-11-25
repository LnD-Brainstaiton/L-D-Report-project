/**
 * Hook for managing mentors data and state
 */

import { useState, useEffect, useCallback } from 'react';
import { mentorsAPI } from '../../../services/api';

export function useMentorsData() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const fetchMentors = useCallback(async () => {
    setLoading(true);
    try {
      const response = await mentorsAPI.getAll('all');
      setMentors(response.data);
    } catch (error) {
      console.error('Error fetching mentors:', error);
      setMessage({ type: 'error', text: 'Error fetching mentors' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMentors();
  }, [fetchMentors]);

  const deleteMentor = async (mentorId, mentorName) => {
    if (window.confirm(`Are you sure you want to delete ${mentorName}?`)) {
      try {
        await mentorsAPI.delete(mentorId);
        setMessage({ type: 'success', text: 'Mentor deleted successfully' });
        fetchMentors();
      } catch (error) {
        setMessage({ type: 'error', text: error.response?.data?.detail || 'Error deleting mentor' });
      }
    }
  };

  return {
    mentors,
    loading,
    message,
    setMessage,
    fetchMentors,
    deleteMentor,
  };
}

export default useMentorsData;

