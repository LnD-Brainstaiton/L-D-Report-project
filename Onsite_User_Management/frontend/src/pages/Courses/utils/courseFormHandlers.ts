import { coursesAPI } from '../../../services/api';
import { formatDateForAPI } from '../../../utils/dateUtils';
import type { AlertMessage, ClassScheduleEntry, CourseFormData, CourseMentorAssignment, CourseType } from '../../../types';
import { AxiosError } from 'axios';

type SetMessage = React.Dispatch<React.SetStateAction<AlertMessage | null>>;

type SetCourseFormState =
  | React.Dispatch<React.SetStateAction<CourseFormData>>
  | ((data: CourseFormData) => void);

type SetMentorState =
  | React.Dispatch<React.SetStateAction<CourseMentorAssignment[]>>
  | ((mentors: CourseMentorAssignment[]) => void);

export const resetForm = (
  setFormData: SetCourseFormState,
  setClassSchedule: (schedule: ClassScheduleEntry[]) => void,
  setSelectedMentors: SetMentorState,
  setCreateAsDraft: (draft: boolean) => void
): void => {
  const nextFormState: CourseFormData = {
    name: '',
    batch_code: '',
    description: '',
    start_date: null,
    end_date: null,
    seat_limit: 0,
    total_classes_offered: '',
    prerequisite_course_id: null,
  };

  if (typeof setFormData === 'function') {
    setFormData(nextFormState);
  }
  setClassSchedule([]);
  if (typeof setSelectedMentors === 'function') {
    setSelectedMentors([]);
  }
  setCreateAsDraft(true);
};

export const handleCreateCourseWithMentors = async (
  formData: CourseFormData,
  classSchedule: ClassScheduleEntry[],
  selectedMentors: CourseMentorAssignment[],
  createAsDraft: boolean,
  courseType: CourseType,
  setMessage: SetMessage,
  resetFormFn: () => void,
  fetchCourses: () => Promise<void>
): Promise<void> => {
  try {
    if (formData.end_date && formData.start_date && formData.end_date < formData.start_date) {
      setMessage({ type: 'error', text: 'End date cannot be before start date' });
      return;
    }

    const courseStatus = createAsDraft ? 'draft' : 'ongoing';

    const response = await coursesAPI.create({
      ...formData,
      start_date: formatDateForAPI(formData.start_date),
      end_date: formatDateForAPI(formData.end_date),
      total_classes_offered: formData.total_classes_offered ? parseInt(String(formData.total_classes_offered)) : null,
      prerequisite_course_id: formData.prerequisite_course_id || null,
      status: courseStatus,
      class_schedule: classSchedule.length > 0 ? classSchedule : null,
      course_type: courseType,
    });

    const courseId = (response.data as { id: number }).id;

    if (selectedMentors.length > 0) {
      const mentorAssignments = selectedMentors
        .filter((mentor) => mentor.mentor_id && mentor.hours_taught !== undefined && mentor.amount_paid !== undefined)
        .map((mentor) => ({
          mentor_id: mentor.mentor_id,
          hours_taught: parseFloat(String(mentor.hours_taught)) || 0,
          amount_paid: parseFloat(String(mentor.amount_paid)) || 0,
        }));

      if (mentorAssignments.length > 0) {
        if (createAsDraft) {
          try {
            await coursesAPI.saveDraft(courseId, {
              mentor_assignments: mentorAssignments,
            });
          } catch (error) {
            console.error('Error saving mentor assignments to draft:', error);
          }
        } else {
          for (const assignment of mentorAssignments) {
            try {
              await coursesAPI.assignMentor(courseId, assignment);
            } catch (error) {
              console.error('Error assigning mentor:', error);
            }
          }
        }
      }
    }

    resetFormFn();
    await fetchCourses();
    setMessage({
      type: 'success',
      text: `Course created successfully as ${createAsDraft ? 'Planning (Draft)' : 'Ongoing'}`,
    });
  } catch (error) {
    console.error('Error creating course:', error);
    const axiosError = error as AxiosError<{ detail?: string }>;
    setMessage({ type: 'error', text: axiosError.response?.data?.detail || 'Error creating course' });
  }
};

export const handleApproveCourse = async (
  courseId: number,
  setMessage: SetMessage,
  fetchCourses: () => Promise<void>
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
    await fetchCourses();
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

