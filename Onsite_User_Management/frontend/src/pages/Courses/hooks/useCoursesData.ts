import { useState, useEffect } from 'react';
import { coursesAPI, lmsAPI } from '../../../services/api';
import { getCourseStatus } from '../../../utils/courseUtils';
import type { Course, AlertMessage, CourseType } from '../../../types';

interface CourseWithLMS extends Course {
  startdate?: number;
  enddate?: number;
  categoryname?: string;
  categoryid?: number;
  visible?: boolean;
  is_lms_course?: boolean;
  fullname?: string;
}

interface UseCoursesDataReturn {
  courses: CourseWithLMS[];
  allCourses: CourseWithLMS[];
  loading: boolean;
  categories: string[];
  message: AlertMessage | null;
  setMessage: React.Dispatch<React.SetStateAction<AlertMessage | null>>;
  setCourses: React.Dispatch<React.SetStateAction<CourseWithLMS[]>>;
  fetchCourses: () => Promise<void>;
}

export const useCoursesData = (courseType: CourseType, status: string): UseCoursesDataReturn => {
  const [courses, setCourses] = useState<CourseWithLMS[]>([]);
  const [allCourses, setAllCourses] = useState<CourseWithLMS[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [message, setMessage] = useState<AlertMessage | null>(null);

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, courseType]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      let allCoursesData: CourseWithLMS[] = [];

      if (courseType === 'online') {
        try {
          const lmsResponse = await lmsAPI.getCourses();
          const lmsCourses = (lmsResponse.data as { courses?: any[] }).courses || [];

          allCoursesData = lmsCourses.map((course: any) => ({
            id: course.id,
            name: course.fullname,
            fullname: course.fullname,
            batch_code: course.shortname || '',
            description: course.summary || '',
            start_date: course.startdate ? new Date(course.startdate * 1000).toISOString().split('T')[0] : '',
            end_date: course.enddate ? new Date(course.enddate * 1000).toISOString().split('T')[0] : undefined,
            startdate: course.startdate,
            enddate: course.enddate,
            categoryname: course.categoryname || 'Unknown',
            categoryid: course.categoryid,
            course_type: 'online' as const,
            seat_limit: 0,
            current_enrolled: 0,
            status: 'ongoing' as const,
            visible: course.visible === 1,
            is_lms_course: true,
          }));

          const filteredByType = allCoursesData.filter((course) => {
            const courseTypeValue = course.course_type || 'onsite';
            return courseTypeValue === courseType;
          });
          setAllCourses(filteredByType);

          let filtered = filteredByType.filter((course) => {
            return course.startdate !== null && course.startdate !== undefined;
          });

          setCourses(filtered);

          const fetchEnrollmentCounts = async () => {
            try {
              const batchSize = 3;
              for (let i = 0; i < allCoursesData.length; i += batchSize) {
                const batch = allCoursesData.slice(i, i + batchSize);
                await Promise.all(
                  batch.map(async (course) => {
                    try {
                      const enrollmentsResponse = await lmsAPI.getCourseEnrollments(course.id);
                      const count = ((enrollmentsResponse.data as { enrollments?: any[] }).enrollments || []).length;
                      setAllCourses((prev) => prev.map((c) => (c.id === course.id ? { ...c, current_enrolled: count } : c)));
                      setCourses((prev) => prev.map((c) => (c.id === course.id ? { ...c, current_enrolled: count } : c)));
                    } catch (err) {
                      console.error(`Error fetching enrollments for course ${course.id}:`, err);
                    }
                  })
                );
              }
            } catch (err) {
              console.error('Error in fetchEnrollmentCounts:', err);
            }
          };

          fetchEnrollmentCounts().catch(console.error);

          const uniqueCategories = [...new Set(allCoursesData.map((c) => c.categoryname).filter(Boolean) as string[])].sort();
          setCategories(uniqueCategories);
        } catch (lmsError) {
          console.error('Error fetching LMS courses:', lmsError);
          setMessage({ type: 'error', text: 'Error fetching online courses from LMS' });
          setLoading(false);
          return;
        }
      } else {
        const response = await coursesAPI.getAll();
        allCoursesData = response.data as CourseWithLMS[];
      }

      let filteredByType: CourseWithLMS[];
      if (courseType !== 'online') {
        filteredByType = allCoursesData.filter((course) => {
          const courseTypeValue = course.course_type || 'onsite';
          return courseTypeValue === courseType;
        });

        setAllCourses(filteredByType);
      } else {
        filteredByType = allCoursesData.filter((course) => {
          const courseTypeValue = course.course_type || 'onsite';
          return courseTypeValue === courseType;
        });
      }

      if (courseType !== 'online') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let filtered = filteredByType;

        if (status === 'all') {
          filtered = filteredByType;
        } else if (status === 'upcoming') {
          filtered = filteredByType.filter((course) => {
            const courseStatus = getCourseStatus(course as any);
            const courseStartDate = course.startdate
              ? new Date(course.startdate * 1000)
              : course.start_date
                ? new Date(course.start_date)
                : null;
            if (!courseStartDate) return false;
            courseStartDate.setHours(0, 0, 0, 0);
            return (courseStatus === 'ongoing' || courseStatus === 'planning') && courseStartDate > today;
          });
        } else {
          filtered = filteredByType.filter((course) => {
            const courseStatus = getCourseStatus(course as any);
            if (status === 'ongoing') {
              const courseStartDate = course.startdate
                ? new Date(course.startdate * 1000)
                : course.start_date
                  ? new Date(course.start_date)
                  : null;
              if (!courseStartDate) return false;
              courseStartDate.setHours(0, 0, 0, 0);
              return courseStatus === 'ongoing' && courseStartDate <= today;
            }
            return courseStatus === status;
          });
        }

        setCourses(filtered);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setMessage({ type: 'error', text: 'Error fetching courses' });
    } finally {
      setLoading(false);
    }
  };

  return {
    courses,
    allCourses,
    loading,
    categories,
    message,
    setMessage,
    setCourses,
    fetchCourses,
  };
};

