/**
 * Previous employees filtering utilities
 */

import { useMemo } from 'react';

/**
 * Filter previous employees based on criteria
 */
export function useFilteredEmployees(
  allUsers,
  searchQuery,
  selectedSearchUser,
  filterNeverTaken
) {
  return useMemo(() => {
    let filtered = [...allUsers];

    // Filter by never taken course if selected
    if (filterNeverTaken === 'yes') {
      filtered = filtered.filter(user => user.never_taken_course === true);
    } else if (filterNeverTaken === 'no') {
      filtered = filtered.filter(user => user.never_taken_course === false);
    }

    // Filter by search query if provided
    if (searchQuery.trim() && !selectedSearchUser) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.employee_id?.toLowerCase().includes(query)
      );
    } else if (selectedSearchUser) {
      filtered = filtered.filter(user => user.id === selectedSearchUser.id);
    }

    return filtered;
  }, [allUsers, filterNeverTaken, searchQuery, selectedSearchUser]);
}

