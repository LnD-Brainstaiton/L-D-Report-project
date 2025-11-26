import { useState, useEffect } from 'react';
import { enrollmentsAPI, lmsAPI } from '../../../services/api';
import { Course, Enrollment, Message, ApprovalStatus } from '../../../types';

// NOTE: All data is fetched from local database only.
// LMS/ERP data is synced via cron job at 12am daily.
// The lmsAPI calls hit our backend which reads from local cache only.

interface UseEnrollmentsReturn {
  enrollments: Enrollment[];
  loadingEnrollments: boolean;
  setEnrollments: React.Dispatch<React.SetStateAction<Enrollment[]>>;
  fetchEnrollments: () => Promise<void>;
}

export const useEnrollments = (
  courseId: string | undefined, 
  course: Course | null, 
  courseType: string | undefined
): UseEnrollmentsReturn => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState<boolean>(true);
  const [message, setMessage] = useState<Message | null>(null);

  useEffect(() => {
    if (course && courseId) {
      fetchEnrollments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course, courseId, courseType]);

  const fetchEnrollments = async (): Promise<void> => {
    setLoadingEnrollments(true);
    try {
      if (courseType === 'online') {
        // Fetch enrollments from local database (ONE API call)
        const lmsResponse = await lmsAPI.getCourseEnrollments(courseId!);
        const responseData = lmsResponse.data as { enrollments?: any[] };
        const lmsEnrollments = responseData.enrollments || [];
        
        // Map enrollments - progress is already included from local database
        const mappedEnrollments: Enrollment[] = lmsEnrollments.map((user: any) => {
          const progress = user.progress || 0;
          const completionStatus = user.completed ? 'Completed' : (progress > 0 ? 'In Progress' : 'Not Started');
          
          return {
            id: user.id,
            student_id: user.student_id,  // Use the actual student database ID
            course_id: parseInt(courseId!),
            approval_status: 'approved' as ApprovalStatus,
            student_name: user.fullname,
            student_email: user.email,
            student_employee_id: user.employee_id || user.username,
            student_department: user.department || 'Unknown',
            student_designation: user.designation || '',
            progress: progress,
            completion_status: completionStatus,
            date_assigned: user.firstaccess || (course as any).startdate || null,
            lastaccess: user.lastaccess || null,
            is_lms_enrollment: true,
          };
        });
        
        setEnrollments(mappedEnrollments);
        // No batch API calls needed - all data comes from local database
      } else {
        // Onsite course - fetch from regular API (local database)
        const response = await enrollmentsAPI.getAll({ course_id: courseId! });
        const onsiteEnrollments: Enrollment[] = (response.data || []).map((enrollment: any) => ({
          ...enrollment,
          is_lms_enrollment: false,
        }));
        setEnrollments(onsiteEnrollments);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error fetching enrollments' });
    } finally {
      setLoadingEnrollments(false);
    }
  };

  return {
    enrollments,
    loadingEnrollments,
    setEnrollments,
    fetchEnrollments,
  };
};

