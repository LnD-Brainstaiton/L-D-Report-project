import { useState, useEffect } from 'react';
import { coursesAPI } from '../../../services/api';
import { getCourseStatus } from '../../../utils/courseUtils';
import type { Course } from '../../../types';

interface UsePrerequisiteCoursesReturn {
  prerequisiteCourses: Course[];
}

export const usePrerequisiteCourses = (open: boolean, editDialogOpen: boolean): UsePrerequisiteCoursesReturn => {
  const [prerequisiteCourses, setPrerequisiteCourses] = useState<Course[]>([]);

  useEffect(() => {
    if (open || editDialogOpen) {
      fetchPrerequisiteCourses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editDialogOpen]);

  const fetchPrerequisiteCourses = async () => {
    try {
      const response = await coursesAPI.getAll();
      const available = (response.data as Course[]).filter((course) => {
        const courseStatus = getCourseStatus(course as any);
        return courseStatus === 'ongoing' || courseStatus === 'planning';
      });
      setPrerequisiteCourses(available);
    } catch (error) {
      console.error('Error fetching prerequisite courses:', error);
    }
  };

  return { prerequisiteCourses };
};

