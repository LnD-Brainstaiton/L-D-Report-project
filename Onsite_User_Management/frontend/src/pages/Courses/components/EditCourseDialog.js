/**
 * EditCourseDialog - Wrapper around the shared CourseFormDialog for editing courses
 * This maintains backward compatibility with existing code
 */

import React from 'react';
import { CourseFormDialog } from '../../../components/dialogs';

const EditCourseDialog = ({
  open,
  onClose,
  formData,
  setFormData,
  classSchedule,
  setClassSchedule,
  prerequisiteCourses,
  onUpdate,
}) => {
  return (
    <CourseFormDialog
      open={open}
      onClose={onClose}
      mode="edit"
      formData={formData}
      setFormData={setFormData}
      classSchedule={classSchedule}
      setClassSchedule={setClassSchedule}
      prerequisiteCourses={prerequisiteCourses}
      onSubmit={onUpdate}
    />
  );
};

export default EditCourseDialog;

