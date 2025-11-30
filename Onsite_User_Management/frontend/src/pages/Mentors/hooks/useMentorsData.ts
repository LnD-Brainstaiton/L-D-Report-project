import { useState, useEffect, useCallback } from 'react';
import { mentorsAPI } from '../../../services/api';
import type { Mentor, AlertMessage } from '../../../types';
import { AxiosError } from 'axios';

interface UseMentorsDataReturn {
  mentors: Mentor[];
  sbus: string[];
  loading: boolean;
  message: AlertMessage | null;
  setMessage: React.Dispatch<React.SetStateAction<AlertMessage | null>>;
  fetchMentors: () => Promise<void>;
  deleteMentor: (mentorId: number, mentorName: string) => Promise<void>;
}

export function useMentorsData(): UseMentorsDataReturn {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [sbus, setSbus] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<AlertMessage | null>(null);

  const fetchMentors = useCallback(async () => {
    setLoading(true);
    try {
      const response = await mentorsAPI.getAll('all');
      const mentorsData = response.data;
      setMentors(mentorsData);
      
      // Extract unique SBUs from mentors
      const uniqueSbus = [...new Set(
        mentorsData
          .map((m: Mentor) => m.department)
          .filter((d: string | undefined): d is string => !!d && d.trim() !== '')
      )].sort();
      setSbus(uniqueSbus);
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

  const deleteMentor = async (mentorId: number, mentorName: string) => {
    if (window.confirm(`Are you sure you want to delete ${mentorName}?`)) {
      try {
        await mentorsAPI.delete(mentorId);
        setMessage({ type: 'success', text: 'Mentor deleted successfully' });
        fetchMentors();
      } catch (error) {
        const axiosError = error as AxiosError<{ detail?: string }>;
        setMessage({
          type: 'error',
          text: axiosError.response?.data?.detail || 'Error deleting mentor',
        });
      }
    }
  };

  return {
    mentors,
    sbus,
    loading,
    message,
    setMessage,
    fetchMentors,
    deleteMentor,
  };
}

export default useMentorsData;

