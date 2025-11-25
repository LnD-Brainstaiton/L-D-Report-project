import { useMemo } from 'react';

/**
 * Filter users based on search query, department, and other filters
 */
export const useFilteredUsers = (allUsers, searchQuery, selectedSearchUser, filterNeverTaken, filterMentorStatus, mentorStatuses) => {
  return useMemo(() => {
    let filtered = [...allUsers];
    
    // Filter by never taken course if selected
    if (filterNeverTaken === 'yes') {
      filtered = filtered.filter(user => user.never_taken_course === true);
    } else if (filterNeverTaken === 'no') {
      filtered = filtered.filter(user => user.never_taken_course === false);
    }
    
    // Filter by mentor status
    if (filterMentorStatus === 'mentor') {
      filtered = filtered.filter(user => mentorStatuses[user.id] === true);
    } else if (filterMentorStatus === 'not_mentor') {
      filtered = filtered.filter(user => !mentorStatuses[user.id] || mentorStatuses[user.id] === false);
    }
    
    // Filter by search query if provided (only if not using autocomplete selection)
    if (searchQuery.trim() && !selectedSearchUser) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.employee_id?.toLowerCase().includes(query)
      );
    } else if (selectedSearchUser) {
      // If a user is selected from autocomplete, show only that user
      filtered = filtered.filter(user => user.id === selectedSearchUser.id);
    }
    
    return filtered;
  }, [allUsers, filterNeverTaken, filterMentorStatus, mentorStatuses, searchQuery, selectedSearchUser]);
};

