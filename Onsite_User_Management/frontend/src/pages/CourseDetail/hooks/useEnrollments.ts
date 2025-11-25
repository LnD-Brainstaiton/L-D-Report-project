import { useState, useEffect } from 'react';
import { enrollmentsAPI, lmsAPI } from '../../../services/api';
import { Course, Enrollment, Message, ApprovalStatus } from '../../../types';

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
      // Use courseType to determine which API to use - completely separate systems
      if (courseType === 'online') {
        // Fetch enrollments from LMS API
        const lmsResponse = await lmsAPI.getCourseEnrollments(courseId!);
        const lmsEnrollments = Array.isArray(lmsResponse.data) ? lmsResponse.data : [];
        
        // Map enrollments - we'll fetch progress in batches to avoid timeouts
        // First, map all enrollments with basic info
        const mappedEnrollments: Enrollment[] = lmsEnrollments.map((user: any) => ({
          id: user.id,
          student_id: user.id,
          course_id: parseInt(courseId!),
          approval_status: 'approved' as ApprovalStatus,
          student_name: user.fullname,
          student_email: user.email,
          student_employee_id: user.employee_id || user.username,
          student_department: user.department || 'Unknown',
          progress: 0, // Will be updated below
          completion_status: 'Not Started', // Will be updated below
          // Date assigned: use firstaccess (when user first accessed the course) or course startdate
          date_assigned: user.firstaccess || (course as any).startdate || null,
          // Last access: prefer lastcourseaccess (last access to this specific course) over lastaccess
          lastaccess: user.lastcourseaccess || user.lastaccess || null,
          is_lms_enrollment: true,
        }));
        
        // Set enrollments immediately so users are visible
        setEnrollments(mappedEnrollments);
        
        // Then fetch progress for each user in smaller batches (3 at a time)
        const batchSize = 3;
        for (let i = 0; i < mappedEnrollments.length; i += batchSize) {
          const batch = mappedEnrollments.slice(i, i + batchSize);
          await Promise.all(
            batch.map(async (enrollment) => {
              try {
                const userCoursesResponse = await lmsAPI.getUserCourses(enrollment.student_employee_id!);
                const userCourses = Array.isArray(userCoursesResponse.data) ? userCoursesResponse.data : [];
                const userCourse = userCourses.find((c: any) => c.id === parseInt(courseId!));
                
                const progress = userCourse?.progress || 0;
                const completionStatus = progress >= 100 ? 'Completed' : (progress > 0 ? 'In Progress' : 'Not Started');
                
                // Update the enrollment in the state
                setEnrollments(prev => prev.map(e => 
                  e.id === enrollment.id 
                    ? { ...e, progress, completion_status: completionStatus }
                    : e
                ));
              } catch (err) {
                // Keep default values (0 progress, Not Started)
              }
            })
          );
        }
      } else {
        // Onsite course - fetch from regular API only (local database)
        const response = await enrollmentsAPI.getAll({ course_id: courseId! });
        // Explicitly mark all enrollments as NOT LMS enrollments
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

