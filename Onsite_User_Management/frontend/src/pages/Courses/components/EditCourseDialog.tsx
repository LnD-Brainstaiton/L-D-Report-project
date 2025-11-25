/**
 * EditCourseDialog - Wrapper around the shared CourseFormDialog for editing courses
 * This maintains backward compatibility with existing code
 */

import React from 'react';
import { CourseFormDialog } from '../../../components/dialogs';
import { Course, ClassSchedule, CourseFormData } from '../../../types';

interface EditCourseDialogProps {
  open: boolean;
  onClose: () => void;
  formData: CourseFormData;
  setFormData: React.Dispatch<React.SetStateAction<CourseFormData>>;
  classSchedule: ClassSchedule[];
  setClassSchedule: React.Dispatch<React.SetStateAction<ClassSchedule[]>>;
  prerequisiteCourses: Course[];
  onUpdate: () => void;
}

const EditCourseDialog: React.FC<EditCourseDialogProps> = ({
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

