import { coursesAPI } from '../../../services/api';
import { formatDateForAPI } from '../../../utils/dateUtils';

/**
 * Handle course approval
 */
export const handleApproveCourse = async (courseId, setMessage, fetchCourse, navigate) => {
  // Simple confirmation popup
  if (!window.confirm('Are you sure you want to approve this course? This will move it from Planning to Ongoing Courses and make all draft changes permanent.')) {
    return;
  }
  
  try {
    // Use "Admin" as default approved_by value
    await coursesAPI.approveCourse(courseId, 'Admin');
    setMessage({ type: 'success', text: 'Course approved and moved to ongoing courses!' });
    await fetchCourse();
    // Navigate to ongoing courses after a short delay
    setTimeout(() => {
      navigate('/courses/ongoing');
    }, 1500);
  } catch (error) {
    setMessage({ type: 'error', text: error.response?.data?.detail || 'Error approving course' });
  }
};

/**
 * Handle generating course report
 */
export const handleGenerateReport = async (courseId, setMessage) => {
  try {
    const response = await coursesAPI.generateReport(courseId);
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const contentDisposition = response.headers['content-disposition'];
    let filename = `course_report_${courseId}.xlsx`;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    setMessage({ type: 'success', text: 'Report generated and downloaded successfully' });
  } catch (error) {
    setMessage({ type: 'error', text: error.response?.data?.detail || 'Error generating report' });
  }
};

/**
 * Handle adding a comment
 */
export const handleAddComment = async (
  newComment,
  courseId,
  setMessage,
  setNewComment,
  setCommentDialogOpen,
  fetchCourse
) => {
  if (!newComment.trim()) {
    setMessage({ type: 'error', text: 'Comment cannot be empty' });
    return;
  }
  try {
    await coursesAPI.addComment(courseId, {
      comment: newComment.trim(),
      created_by: 'Admin', // TODO: Get from auth context
    });
    setMessage({ type: 'success', text: 'Comment added successfully' });
    setNewComment('');
    setCommentDialogOpen(false);
    await fetchCourse();
  } catch (error) {
    setMessage({ type: 'error', text: error.response?.data?.detail || 'Error adding comment' });
  }
};

/**
 * Handle updating course details
 */
export const handleUpdateCourseDetails = async (
  editCourseData,
  editClassSchedule,
  courseId,
  setMessage,
  setEditCourseDialogOpen,
  fetchCourse,
  setEditCourseLoading
) => {
  if (!editCourseData.start_date || editCourseData.seat_limit <= 0) {
    setMessage({ type: 'error', text: 'Please fill in all required fields' });
    return;
  }
  
  // Validate that end date is not before start date
  if (editCourseData.end_date && editCourseData.start_date && editCourseData.end_date < editCourseData.start_date) {
    setMessage({ type: 'error', text: 'End date cannot be before start date' });
    return;
  }
  
  setEditCourseLoading(true);
  try {
    await coursesAPI.update(courseId, {
      start_date: formatDateForAPI(editCourseData.start_date),
      end_date: formatDateForAPI(editCourseData.end_date),
      seat_limit: editCourseData.seat_limit,
      total_classes_offered: editCourseData.total_classes_offered ? parseInt(editCourseData.total_classes_offered) : null,
      class_schedule: editClassSchedule.length > 0 ? editClassSchedule : null,
    });
    
    setMessage({ type: 'success', text: 'Course details updated successfully' });
    setEditCourseDialogOpen(false);
    await fetchCourse();
  } catch (error) {
    console.error('Error updating course:', error);
    setMessage({ type: 'error', text: error.response?.data?.detail || 'Error updating course details' });
  } finally {
    setEditCourseLoading(false);
  }
};

