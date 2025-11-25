import { coursesAPI } from '../../../services/api';
import { formatDateForAPI } from '../../../utils/dateUtils';

/**
 * Create a new course
 */
export const handleCreateCourse = async (
  formData,
  classSchedule,
  selectedMentors,
  createAsDraft,
  courseType,
  setMessage,
  setOpen,
  resetForm,
  fetchCourses
) => {
  try {
    const courseData = {
      name: formData.name,
      batch_code: formData.batch_code,
      description: formData.description,
      start_date: formatDateForAPI(formData.start_date),
      end_date: formatDateForAPI(formData.end_date),
      seat_limit: formData.seat_limit,
      total_classes_offered: parseInt(formData.total_classes_offered) || 0,
      prerequisite_course_id: formData.prerequisite_course_id,
      class_schedule: classSchedule,
      course_type: courseType,
      status: createAsDraft ? 'draft' : 'ongoing',
      mentors: selectedMentors.map(m => ({
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
    setMessage({ type: 'error', text: error.response?.data?.detail || 'Error creating course' });
  }
};

/**
 * Update an existing course
 */
export const handleUpdateCourse = async (
  courseId,
  formData,
  classSchedule,
  selectedMentors,
  setMessage,
  setEditDialogOpen,
  resetForm,
  fetchCourses
) => {
  try {
    const courseData = {
      name: formData.name,
      batch_code: formData.batch_code,
      description: formData.description,
      start_date: formatDateForAPI(formData.start_date),
      end_date: formatDateForAPI(formData.end_date),
      seat_limit: formData.seat_limit,
      total_classes_offered: parseInt(formData.total_classes_offered) || 0,
      prerequisite_course_id: formData.prerequisite_course_id,
      class_schedule: classSchedule,
      mentors: selectedMentors.map(m => ({
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
    setMessage({ type: 'error', text: error.response?.data?.detail || 'Error updating course' });
  }
};

/**
 * Delete a course
 */
export const handleDeleteCourse = async (courseId, setMessage, fetchCourses) => {
  try {
    await coursesAPI.remove(courseId);
    setMessage({ type: 'success', text: 'Course deleted successfully' });
    await fetchCourses();
  } catch (error) {
    setMessage({ type: 'error', text: error.response?.data?.detail || 'Error deleting course' });
  }
};

