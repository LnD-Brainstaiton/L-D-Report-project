import { useMemo } from 'react';
import type { Student } from '../../../types';

interface StudentWithFlags extends Student {
  never_taken_course?: boolean;
}

export const useFilteredUsers = (
  allUsers: StudentWithFlags[],
  searchQuery: string,
  selectedSearchUser: StudentWithFlags | null,
  filterNeverTaken: string,
  filterMentorStatus: string,
  mentorStatuses: Record<number, boolean>
): StudentWithFlags[] => {
  return useMemo(() => {
    let filtered = [...allUsers];

    if (filterNeverTaken === 'yes') {
      filtered = filtered.filter((user) => user.never_taken_course === true);
    } else if (filterNeverTaken === 'no') {
      filtered = filtered.filter((user) => user.never_taken_course === false);
    }

    if (filterMentorStatus === 'mentor') {
      filtered = filtered.filter((user) => mentorStatuses[user.id] === true);
    } else if (filterMentorStatus === 'not_mentor') {
      filtered = filtered.filter((user) => !mentorStatuses[user.id] || mentorStatuses[user.id] === false);
    }

    if (searchQuery.trim() && !selectedSearchUser) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (user) =>
          user.name?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query) ||
          user.employee_id?.toLowerCase().includes(query)
      );
    } else if (selectedSearchUser) {
      filtered = filtered.filter((user) => user.id === selectedSearchUser.id);
    }

    return filtered;
  }, [allUsers, filterNeverTaken, filterMentorStatus, mentorStatuses, searchQuery, selectedSearchUser]);
};

