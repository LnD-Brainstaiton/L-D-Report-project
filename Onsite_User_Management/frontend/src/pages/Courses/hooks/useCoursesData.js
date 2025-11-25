import { useState, useEffect } from 'react';
import { coursesAPI, lmsAPI } from '../../../services/api';
import { getCourseStatus } from '../../../utils/courseUtils';

export const useCoursesData = (courseType, status) => {
  const [courses, setCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, [status, courseType]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      let allCoursesData = [];
      
      // If online courses, fetch from LMS API
      if (courseType === 'online') {
        try {
          const lmsResponse = await lmsAPI.getCourses();
          const lmsCourses = lmsResponse.data.courses || [];
          
          // Map LMS courses to our course format
          allCoursesData = lmsCourses.map(course => ({
            id: course.id,
            name: course.fullname,
            fullname: course.fullname,
            batch_code: course.shortname || '',
            description: course.summary || '',
            start_date: course.startdate ? new Date(course.startdate * 1000).toISOString().split('T')[0] : null,
            end_date: course.enddate ? new Date(course.enddate * 1000).toISOString().split('T')[0] : null,
            startdate: course.startdate, // Unix timestamp
            enddate: course.enddate, // Unix timestamp
            categoryname: course.categoryname || 'Unknown',
            categoryid: course.categoryid,
            course_type: 'online',
            seat_limit: 0,
            current_enrolled: 0, // Will be updated in background
            status: 'ongoing', // Default status for LMS courses
            visible: course.visible === 1,
            is_lms_course: true, // Flag to identify LMS courses
          }));
          
          // Set courses immediately so list loads fast
          const filteredByType = allCoursesData.filter(course => {
            const courseTypeValue = course.course_type || 'onsite';
            return courseTypeValue === courseType;
          });
          setAllCourses(filteredByType);
          
          // For online courses, show all courses (no status filtering - handled in Dashboard)
          // Filter out courses without startdate
          let filtered = filteredByType.filter(course => {
            return course.startdate !== null && course.startdate !== undefined;
          });
          
          setCourses(filtered);
          
          // Fetch enrollment counts in background (after list is displayed)
          const fetchEnrollmentCounts = async () => {
            try {
              const batchSize = 3; // Smaller batches to avoid timeouts
              for (let i = 0; i < allCoursesData.length; i += batchSize) {
                const batch = allCoursesData.slice(i, i + batchSize);
                await Promise.all(
                  batch.map(async (course) => {
                    try {
                      const enrollmentsResponse = await lmsAPI.getCourseEnrollments(course.id);
                      const count = (enrollmentsResponse.data.enrollments || []).length;
                      // Update both allCourses and courses state
                      setAllCourses(prev => prev.map(c => 
                        c.id === course.id ? { ...c, current_enrolled: count } : c
                      ));
                      setCourses(prev => prev.map(c => 
                        c.id === course.id ? { ...c, current_enrolled: count } : c
                      ));
                    } catch (err) {
                      // Silently handle errors - keep 0
                      console.error(`Error fetching enrollments for course ${course.id}:`, err.message || err);
                    }
                  })
                );
              }
            } catch (err) {
              console.error('Error in fetchEnrollmentCounts:', err);
            }
          };
          
          // Start fetching counts in background (don't await)
          fetchEnrollmentCounts().catch(err => {
            console.error('Error fetching enrollment counts in background:', err);
          });
          
          // Extract unique categories for filter
          const uniqueCategories = [...new Set(allCoursesData.map(c => c.categoryname).filter(Boolean))].sort();
          setCategories(uniqueCategories);
        } catch (lmsError) {
          console.error('Error fetching LMS courses:', lmsError);
          setMessage({ type: 'error', text: 'Error fetching online courses from LMS' });
          setLoading(false);
          return;
        }
      } else {
        // For onsite courses, fetch from our API
        const response = await coursesAPI.getAll();
        allCoursesData = response.data;
      }
      
      // For onsite courses, set all courses (online courses are already set above)
      let filteredByType;
      if (courseType !== 'online') {
        // First filter by course type (default to onsite if course_type is not set)
        filteredByType = allCoursesData.filter(course => {
          const courseTypeValue = course.course_type || 'onsite';
          return courseTypeValue === courseType;
        });
        
        setAllCourses(filteredByType);
      } else {
        // For online courses, filteredByType is already set above
        filteredByType = allCoursesData.filter(course => {
          const courseTypeValue = course.course_type || 'onsite';
          return courseTypeValue === courseType;
        });
      }
      
      // Then filter by status (only for onsite courses, online courses already filtered above)
      if (courseType !== 'online') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let filtered = filteredByType;
        
        if (status === 'all') {
          // Show all courses of this type
          filtered = filteredByType;
        } else if (status === 'upcoming') {
          // Upcoming: courses with status 'ongoing' or 'planning' but start_date > today
          filtered = filteredByType.filter(course => {
            const courseStatus = getCourseStatus(course);
            const courseStartDate = course.startdate 
              ? new Date(course.startdate * 1000) 
              : (course.start_date ? new Date(course.start_date) : null);
            if (!courseStartDate) return false;
            courseStartDate.setHours(0, 0, 0, 0);
            return (courseStatus === 'ongoing' || courseStatus === 'planning') && courseStartDate > today;
          });
        } else {
          // Filter by status (planning, ongoing, completed)
          filtered = filteredByType.filter(course => {
            const courseStatus = getCourseStatus(course);
            // For ongoing, exclude upcoming courses
            if (status === 'ongoing') {
              const courseStartDate = course.startdate 
                ? new Date(course.startdate * 1000) 
                : (course.start_date ? new Date(course.start_date) : null);
              if (!courseStartDate) return false;
              courseStartDate.setHours(0, 0, 0, 0);
              return courseStatus === 'ongoing' && courseStartDate <= today;
            }
            return courseStatus === status;
          });
        }
        
        setCourses(filtered);
      }
      // For online courses, courses are already set above
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

