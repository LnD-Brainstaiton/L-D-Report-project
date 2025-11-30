import { useState, useEffect } from 'react';
import { coursesAPI, lmsAPI } from '../../../services/api';
import { getCourseStatus } from '../../../utils/courseUtils';
import { getCourseStartDate, getCourseEndDate } from '../../../utils/dateRangeUtils';
import type { Course, AlertMessage, CourseType } from '../../../types';

// NOTE: All data is fetched from local database only.
// LMS/ERP data is synced via cron job at 12am daily.
// The lmsAPI calls hit our backend which reads from local cache only.

interface CourseWithLMS extends Course {
  startdate?: number;
  enddate?: number;
  categoryname?: string;
  categoryid?: number;
  visible?: boolean;
  is_lms_course?: boolean;
  is_mandatory?: boolean;
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
          // Fetch courses with enrollment counts in ONE request (from local database)
          const lmsResponse = await lmsAPI.getCourses(true); // include_enrollment_counts=true
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
            current_enrolled: course.enrollment_count || 0, // Total enrollment count
            active_enrolled: course.active_enrollment_count || 0, // Active employees count
            previous_enrolled: course.previous_enrollment_count || 0, // Previous employees count
            status: 'ongoing' as const,
            visible: course.visible === 1,
            is_lms_course: true,
            is_mandatory: course.is_mandatory || false,
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

          // Enrollment counts are already included from the single API call above
          // No need for separate batch API calls

          const uniqueCategories = [...new Set(allCoursesData.map((c) => c.categoryname).filter(Boolean) as string[])].sort();
          setCategories(uniqueCategories);
        } catch (lmsError) {
          console.error('Error fetching LMS courses:', lmsError);
          setMessage({ type: 'error', text: 'Error fetching online courses' });
          setLoading(false);
          return;
        }
      } else {
        // Pass course_type to filter courses by type
        const response = await coursesAPI.getAll({ course_type: courseType });
        allCoursesData = response.data as CourseWithLMS[];
        console.log('Fetched courses:', allCoursesData.length, 'Type:', courseType);
        const englishCourse = allCoursesData.find(c => c.name?.toLowerCase().includes('english'));
        if (englishCourse) {
          console.log('Found English course in API response:', englishCourse);
        } else {
          console.log('English course NOT found in API response');
        }
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
        } else if (status === 'planning') {
          // Planning: Show draft courses (not approved yet)
          // Check both the status field directly and the computed status
          filtered = filteredByType.filter((course) => {
            const courseStatus = getCourseStatus(course as any);
            const rawStatus = course.status ? String(course.status).toLowerCase() : '';
            // Include if status is 'planning' or 'draft' (either from computed status or raw status field)
            return courseStatus === 'planning' || courseStatus === 'draft' || rawStatus === 'draft' || rawStatus === 'planning';
          });
        } else if (status === 'upcoming') {
          // Upcoming: Show approved courses (ongoing status) that haven't started yet
          // Include courses with future start dates OR no start date (user explicitly set as ongoing, treat as upcoming)
          filtered = filteredByType.filter((course) => {
            const courseStatus = getCourseStatus(course as any);
            // Only approved courses (status = 'ongoing') should appear in upcoming
            if (courseStatus !== 'ongoing') return false;

            // Use helper to get local date correctly
            const courseStartDate = getCourseStartDate(course);

            // If no start_date, include it in upcoming (user explicitly set as ongoing, treat as upcoming)
            if (!courseStartDate) return true;

            courseStartDate.setHours(0, 0, 0, 0);
            // Start date is in the future (not today, as today would be "ongoing")
            return courseStartDate > today;
          });
        } else if (status === 'ongoing') {
          // Ongoing: Show courses with status 'ongoing' that haven't ended
          // Include courses that have started OR don't have a start_date (user explicitly set as ongoing)
          filtered = filteredByType.filter((course) => {
            const courseStatus = getCourseStatus(course as any);
            // Only approved courses (status = 'ongoing') should appear in ongoing
            if (courseStatus !== 'ongoing') return false;

            // Use helper to get local date correctly
            const courseStartDate = getCourseStartDate(course);

            // Check if course has ended - if end date has passed, it should be in completed
            // Use helper to get local date correctly
            const courseEndDate = getCourseEndDate(course);

            if (courseEndDate) {
              courseEndDate.setHours(0, 0, 0, 0);
              // If end date has passed, it should be in completed, not ongoing
              if (courseEndDate < today) return false;
            }

            // If no start_date, show in ongoing (user explicitly set as ongoing)
            if (!courseStartDate) return true;

            // If start_date exists, only show if it has started (start_date <= today)
            // This prevents courses with future start dates from appearing in both upcoming and ongoing
            courseStartDate.setHours(0, 0, 0, 0);

            const isStarted = courseStartDate <= today;
            if (course.name?.toLowerCase().includes('english')) {
              console.log('Debug English Course:', {
                name: course.name,
                status: course.status,
                startDate: course.start_date,
                parsedStartDate: courseStartDate,
                today: today,
                isStarted: isStarted,
                endDate: course.end_date,
                parsedEndDate: courseEndDate
              });
            }

            return isStarted;
          });
        } else if (status === 'completed') {
          // Completed: Only show approved courses that have ended
          filtered = filteredByType.filter((course) => {
            const courseStatus = getCourseStatus(course as any);
            // Can be 'completed' status or 'ongoing' with end_date passed
            if (courseStatus === 'completed') return true;
            if (courseStatus !== 'ongoing') return false;

            // Check if end date has passed
            // Use helper to get local date correctly
            const courseEndDate = getCourseEndDate(course);

            if (!courseEndDate) return false;
            courseEndDate.setHours(0, 0, 0, 0);
            return courseEndDate < today;
          });
        } else {
          // Fallback for other statuses
          filtered = filteredByType.filter((course) => {
            const courseStatus = getCourseStatus(course as any);
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

