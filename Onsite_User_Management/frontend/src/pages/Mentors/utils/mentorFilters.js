/**
 * Mentor filtering utilities
 */

import { useMemo } from 'react';

/**
 * Filter mentors based on various criteria
 */
export function useFilteredMentors(
  mentors,
  selectedType,
  selectedDepartment,
  searchQuery,
  selectedSearchMentor,
  filterNoCourseHistory
) {
  return useMemo(() => {
    let filtered = [...mentors];

    // Filter by type
    if (selectedType === 'internal') {
      filtered = filtered.filter(m => m.is_internal === true);
    } else if (selectedType === 'external') {
      filtered = filtered.filter(m => m.is_internal === false);
    }

    // Filter by Department
    if (selectedDepartment) {
      filtered = filtered.filter(m => m.department === selectedDepartment);
    }

    // Filter by course history
    if (filterNoCourseHistory) {
      filtered = filtered.filter(m => !m.course_count || m.course_count === 0);
    }

    // Filter by search query
    if (searchQuery.trim() && !selectedSearchMentor) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(mentor =>
        mentor.name?.toLowerCase().includes(query) ||
        mentor.email?.toLowerCase().includes(query) ||
        mentor.designation?.toLowerCase().includes(query) ||
        mentor.department?.toLowerCase().includes(query) ||
        mentor.student?.employee_id?.toLowerCase().includes(query) ||
        mentor.student?.name?.toLowerCase().includes(query)
      );
    } else if (selectedSearchMentor) {
      filtered = filtered.filter(m => m.id === selectedSearchMentor.id);
    }

    return filtered;
  }, [mentors, selectedType, selectedDepartment, searchQuery, selectedSearchMentor, filterNoCourseHistory]);
}

