import { coursesAPI } from '../../../services/api';
import { formatDateForAPI } from '../../../utils/dateUtils';
import type { AlertMessage, ClassScheduleEntry, CourseFormData, CourseMentorAssignment, CourseType } from '../../../types';
import { AxiosError } from 'axios';

type SetMessage = React.Dispatch<React.SetStateAction<AlertMessage | null>>;

export const handleCreateCourse = async (
  formData: CourseFormData,
  classSchedule: ClassScheduleEntry[],
  selectedMentors: CourseMentorAssignment[],
  createAsDraft: boolean,
  courseType: CourseType,
  setMessage: SetMessage,
  setOpen: (open: boolean) => void,
  resetForm: () => void,
  fetchCourses: () => Promise<void>
): Promise<void> => {
  try {
    const courseData = {
      name: formData.name,
      batch_code: formData.batch_code,
      description: formData.description || '',
      start_date: formatDateForAPI(formData.start_date) || undefined,
      end_date: formatDateForAPI(formData.end_date) || undefined,
      seat_limit: formData.seat_limit ?? 0,
      total_classes_offered: parseInt(String(formData.total_classes_offered)) || 0,
      prerequisite_course_id: formData.prerequisite_course_id,
      class_schedule: classSchedule,
      course_type: courseType,
      status: createAsDraft ? 'draft' : 'ongoing',
      mentors: selectedMentors.map((m) => ({
        mentor_id: m.mentor_id,
        hours_taught: m.hours_taught,
        amount_paid: m.amount_paid,
        is_internal: m.is_internal,
      })),
    };

    await coursesAPI.create(courseData);
    setMessage({ type: 'success', text: 'Course created successfully' });
    setOpen(false);
    resetForm();
    await fetchCourses();
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    setMessage({ type: 'error', text: axiosError.response?.data?.detail || 'Error creating course' });
  }
};

export const handleUpdateCourse = async (
  courseId: number,
  formData: CourseFormData,
  classSchedule: ClassScheduleEntry[],
  selectedMentors: CourseMentorAssignment[],
  setMessage: SetMessage,
  setEditDialogOpen: (open: boolean) => void,
  resetForm: () => void,
  fetchCourses: () => Promise<void>
): Promise<void> => {
  try {
    const courseData = {
      name: formData.name,
      batch_code: formData.batch_code,
      description: formData.description || '',
      start_date: formatDateForAPI(formData.start_date) || undefined,
      end_date: formatDateForAPI(formData.end_date) || undefined,
      seat_limit: formData.seat_limit ?? 0,
      total_classes_offered: parseInt(String(formData.total_classes_offered)) || 0,
      prerequisite_course_id: formData.prerequisite_course_id,
      class_schedule: classSchedule,
      mentors: selectedMentors.map((m) => ({
        mentor_id: m.mentor_id,
        hours_taught: m.hours_taught,
        amount_paid: m.amount_paid,
        is_internal: m.is_internal,
      })),
    };

    await coursesAPI.update(courseId, courseData);
    setMessage({ type: 'success', text: 'Course updated successfully' });
    setEditDialogOpen(false);
    resetForm();
    await fetchCourses();
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    setMessage({ type: 'error', text: axiosError.response?.data?.detail || 'Error updating course' });
  }
};

export const handleDeleteCourse = async (
  courseId: number,
  setMessage: SetMessage,
  fetchCourses: () => Promise<void>
): Promise<void> => {
  try {
    await coursesAPI.remove(courseId);
    setMessage({ type: 'success', text: 'Course deleted successfully' });
    await fetchCourses();
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    setMessage({ type: 'error', text: axiosError.response?.data?.detail || 'Error deleting course' });
  }
};

