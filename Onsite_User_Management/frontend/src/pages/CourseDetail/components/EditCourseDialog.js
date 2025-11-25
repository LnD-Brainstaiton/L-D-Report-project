/**
 * EditCourseDialog - Course detail page version
 * Uses the shared CourseFormDialog component
 */

import React from 'react';
import { CourseFormDialog } from '../../../components/dialogs';

function EditCourseDialog({
  open,
  onClose,
  editCourseData,
  setEditCourseData,
  editClassSchedule,
  setEditClassSchedule,
  editCourseLoading,
  message,
  onConfirm,
}) {
  return (
    <CourseFormDialog
      open={open}
      onClose={onClose}
      mode="edit"
      formData={editCourseData}
      setFormData={setEditCourseData}
      classSchedule={editClassSchedule}
      setClassSchedule={setEditClassSchedule}
      onSubmit={onConfirm}
      loading={editCourseLoading}
    />
  );
}

export default EditCourseDialog;

