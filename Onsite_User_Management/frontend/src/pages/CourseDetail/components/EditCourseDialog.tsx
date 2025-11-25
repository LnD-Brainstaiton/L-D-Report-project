/**
 * EditCourseDialog - Course detail page version
 * Uses the shared CourseFormDialog component
 */

import React from 'react';
import { CourseFormDialog } from '../../../components/dialogs';
import { ClassSchedule, Message, CourseFormData } from '../../../types';

interface EditCourseDialogProps {
  open: boolean;
  onClose: () => void;
  editCourseData: CourseFormData;
  setEditCourseData: React.Dispatch<React.SetStateAction<CourseFormData>>;
  editClassSchedule: ClassSchedule[];
  setEditClassSchedule: React.Dispatch<React.SetStateAction<ClassSchedule[]>>;
  editCourseLoading: boolean;
  message: Message | null;
  onConfirm: () => void;
}

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
}: EditCourseDialogProps): React.ReactElement {
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

