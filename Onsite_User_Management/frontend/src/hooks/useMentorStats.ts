import { useState, useEffect } from 'react';
import { mentorsAPI } from '../services/api';
import { Mentor, MentorStats } from '../types';

export const useMentorStats = (mentor: Mentor | null, open: boolean) => {
    const [mentorStats, setMentorStats] = useState<MentorStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(false);

    useEffect(() => {
        const fetchMentorStats = async () => {
            if (!mentor?.id) return;

            setLoadingStats(true);
            try {
                const response = await mentorsAPI.getStats(mentor.id);
                setMentorStats(response.data);
            } catch (error) {
                console.error('Error fetching mentor stats:', error);
                setMentorStats(null);
            } finally {
                setLoadingStats(false);
            }
        };

        if (open && mentor?.id) {
            fetchMentorStats();
        } else {
            setMentorStats(null);
        }
    }, [open, mentor?.id]);

    return { mentorStats, loadingStats };
};
