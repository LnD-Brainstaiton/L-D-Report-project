import { coursesAPI } from '../../../services/api';
import { formatDateForAPI } from '../../../utils/dateUtils';

/**
 * Reset form data to initial state
 */
export const resetForm = (setFormData, setClassSchedule, setSelectedMentors, setCreateAsDraft) => {
  setFormData({
    name: '',
    batch_code: '',
    description: '',
    start_date: null,
    end_date: null,
    seat_limit: 0,
    total_classes_offered: '',
    prerequisite_course_id: null,
  });
  setClassSchedule([]);
  setSelectedMentors([]);
  setCreateAsDraft(true);
};

/**
 * Handle course creation with mentor assignments
 */
export const handleCreateCourseWithMentors = async (
  formData,
  classSchedule,
  selectedMentors,
  createAsDraft,
  courseType,
  setMessage,
  resetFormFn,
  fetchCourses
) => {
  try {
    // Validate that end date is not before start date
    if (formData.end_date && formData.start_date && formData.end_date < formData.start_date) {
      setMessage({ type: 'error', text: 'End date cannot be before start date' });
      return;
    }
    
    // Determine course status based on checkbox
    const courseStatus = createAsDraft ? 'draft' : 'ongoing';
    
    // Create the course first
    const response = await coursesAPI.create({
      ...formData,
      start_date: formatDateForAPI(formData.start_date),
      end_date: formatDateForAPI(formData.end_date),
      total_classes_offered: formData.total_classes_offered ? parseInt(formData.total_classes_offered) : null,
      prerequisite_course_id: formData.prerequisite_course_id || null,
      status: courseStatus,
      class_schedule: classSchedule.length > 0 ? classSchedule : null,
      course_type: courseType,
    });
    
    const courseId = response.data.id;
    
    // Handle mentor assignments based on course status
    if (selectedMentors.length > 0) {
      const mentorAssignments = selectedMentors
        .filter(mentor => mentor.mentor_id && mentor.hours_taught !== undefined && mentor.amount_paid !== undefined)
        .map(mentor => ({
          mentor_id: mentor.mentor_id,
          hours_taught: parseFloat(mentor.hours_taught) || 0,
          amount_paid: parseFloat(mentor.amount_paid) || 0,
        }));
        
      if (mentorAssignments.length > 0) {
        if (createAsDraft) {
          // Save mentors to draft for planning courses
          try {
            await coursesAPI.saveDraft(courseId, {
              mentor_assignments: mentorAssignments,
            });
          } catch (error) {
            console.error('Error saving mentor assignments to draft:', error);
            // Continue even if draft save fails
          }
        } else {
          // Assign mentors directly for ongoing courses
          for (const assignment of mentorAssignments) {
            try {
              await coursesAPI.assignMentor(courseId, assignment);
            } catch (error) {
              console.error('Error assigning mentor:', error);
              // Continue with other mentors even if one fails
            }
          }
        }
      }
    }
    
    resetFormFn();
    await fetchCourses();
    setMessage({ 
      type: 'success', 
      text: `Course created successfully as ${createAsDraft ? 'Planning (Draft)' : 'Ongoing'}` 
    });
  } catch (error) {
    console.error('Error creating course:', error);
    setMessage({ type: 'error', text: error.response?.data?.detail || 'Error creating course' });
  }
};

/**
 * Handle course approval
 */
export const handleApproveCourse = async (courseId, setMessage, fetchCourses) => {
  if (!window.confirm('Are you sure you want to approve this course? This will move it from Planning to Ongoing Courses and make all draft changes permanent.')) {
    return;
  }

  try {
    await coursesAPI.approveCourse(courseId, 'Admin');
    setMessage({ type: 'success', text: 'Course approved and moved to ongoing courses!' });
    await fetchCourses();
  } catch (error) {
    setMessage({ type: 'error', text: error.response?.data?.detail || 'Error approving course' });
  }
};

/**
 * Handle course report generation
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

