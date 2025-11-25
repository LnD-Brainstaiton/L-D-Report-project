import { useState, useEffect } from 'react';
import { coursesAPI } from '../../../services/api';
import { getCourseStatus } from '../../../utils/courseUtils';

export const usePrerequisiteCourses = (open, editDialogOpen) => {
  const [prerequisiteCourses, setPrerequisiteCourses] = useState([]);

  useEffect(() => {
    if (open || editDialogOpen) {
      fetchPrerequisiteCourses();
    }
  }, [open, editDialogOpen]);

  const fetchPrerequisiteCourses = async () => {
    try {
      const response = await coursesAPI.getAll();
      // Only show ongoing and planning courses as prerequisites
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const available = response.data.filter(course => {
        const courseStatus = getCourseStatus(course);
        return courseStatus === 'ongoing' || courseStatus === 'planning';
      });
      setPrerequisiteCourses(available);
    } catch (error) {
      console.error('Error fetching prerequisite courses:', error);
    }
  };

  return { prerequisiteCourses };
};

