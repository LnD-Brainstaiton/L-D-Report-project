import { useMemo } from 'react';
import type { Student } from '../../../types';

interface StudentWithCourseFlag extends Student {
  never_taken_course?: boolean;
}

export function useFilteredEmployees(
  allUsers: StudentWithCourseFlag[],
  searchQuery: string,
  selectedSearchUser: StudentWithCourseFlag | null,
  filterNeverTaken: string
): StudentWithCourseFlag[] {
  return useMemo(() => {
    let filtered = [...allUsers];

    if (filterNeverTaken === 'yes') {
      filtered = filtered.filter((user) => user.never_taken_course === true);
    } else if (filterNeverTaken === 'no') {
      filtered = filtered.filter((user) => user.never_taken_course === false);
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
  }, [allUsers, filterNeverTaken, searchQuery, selectedSearchUser]);
}

