import { coursesAPI } from '../../../services/api';
import { formatDateForAPI } from '../../../utils/dateUtils';
import type { AlertMessage, ClassScheduleEntry } from '../../../types';
import { AxiosError } from 'axios';
import type { NavigateFunction } from 'react-router-dom';

type SetMessage = React.Dispatch<React.SetStateAction<AlertMessage | null>>;

export const handleApproveCourse = async (
  courseId: number,
  setMessage: SetMessage,
  fetchCourse: () => Promise<void>,
  navigate: NavigateFunction
): Promise<void> => {
  if (
    !window.confirm(
      'Are you sure you want to approve this course? This will move it from Planning to Ongoing Courses and make all draft changes permanent.'
    )
  ) {
    return;
  }

  try {
    await coursesAPI.approveCourse(courseId, 'Admin');
    setMessage({ type: 'success', text: 'Course approved and moved to ongoing courses!' });
    await fetchCourse();
    setTimeout(() => {
      navigate('/courses/ongoing');
    }, 1500);
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    setMessage({ type: 'error', text: axiosError.response?.data?.detail || 'Error approving course' });
  }
};

export const handleGenerateReport = async (courseId: number, setMessage: SetMessage): Promise<void> => {
  try {
    const response = await coursesAPI.generateReport(courseId);
    const blob = new Blob([response.data as BlobPart], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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
    const axiosError = error as AxiosError<{ detail?: string }>;
    setMessage({ type: 'error', text: axiosError.response?.data?.detail || 'Error generating report' });
  }
};

export const handleAddComment = async (
  newComment: string,
  courseId: number,
  setMessage: SetMessage,
  setNewComment: (comment: string) => void,
  setCommentDialogOpen: (open: boolean) => void,
  fetchCourse: () => Promise<void>
): Promise<void> => {
  if (!newComment.trim()) {
    setMessage({ type: 'error', text: 'Comment cannot be empty' });
    return;
  }
  try {
    await coursesAPI.addComment(courseId, {
      comment_text: newComment.trim(),
      created_by: 'Admin',
    });
    setMessage({ type: 'success', text: 'Comment added successfully' });
    setNewComment('');
    setCommentDialogOpen(false);
    await fetchCourse();
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    setMessage({ type: 'error', text: axiosError.response?.data?.detail || 'Error adding comment' });
  }
};

interface EditCourseData {
  start_date: Date | null;
  end_date: Date | null;
  seat_limit: number;
  total_classes_offered: string | number;
}

export const handleUpdateCourseDetails = async (
  editCourseData: EditCourseData,
  editClassSchedule: ClassScheduleEntry[],
  courseId: number,
  setMessage: SetMessage,
  setEditCourseDialogOpen: (open: boolean) => void,
  fetchCourse: () => Promise<void>,
  setEditCourseLoading: (loading: boolean) => void
): Promise<void> => {
  if (!editCourseData.start_date || editCourseData.seat_limit <= 0) {
    setMessage({ type: 'error', text: 'Please fill in all required fields' });
    return;
  }

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
      total_classes_offered: editCourseData.total_classes_offered
        ? parseInt(String(editCourseData.total_classes_offered))
        : null,
      class_schedule: editClassSchedule.length > 0 ? editClassSchedule : null,
    });

    setMessage({ type: 'success', text: 'Course details updated successfully' });
    setEditCourseDialogOpen(false);
    await fetchCourse();
  } catch (error) {
    console.error('Error updating course:', error);
    const axiosError = error as AxiosError<{ detail?: string }>;
    setMessage({ type: 'error', text: axiosError.response?.data?.detail || 'Error updating course details' });
  } finally {
    setEditCourseLoading(false);
  }
};

