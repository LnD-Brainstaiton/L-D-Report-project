import { useState, useEffect } from 'react';
import { coursesAPI, lmsAPI, mentorsAPI } from '../../../services/api';

export const useCourseDetailData = (courseId, courseType) => {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [draftMentorsWithDetails, setDraftMentorsWithDetails] = useState([]);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (courseId) {
      fetchCourse();
    }
  }, [courseId, courseType]);

  const fetchCourse = async () => {
    setLoading(true);
    try {
      let courseData = null;
      
      // Use course type to determine which API to use - completely separate systems
      if (courseType === 'online') {
        // Online course - fetch from LMS API only
        const lmsResponse = await lmsAPI.getCourses();
        const lmsCourses = lmsResponse.data.courses || [];
        const lmsCourse = lmsCourses.find(c => c.id === parseInt(courseId));
        
        if (!lmsCourse) {
          throw new Error('Online course not found in LMS');
        }
        
        courseData = {
          id: lmsCourse.id,
          name: lmsCourse.fullname,
          fullname: lmsCourse.fullname,
          batch_code: lmsCourse.shortname || '',
          description: lmsCourse.summary || '',
          start_date: lmsCourse.startdate ? new Date(lmsCourse.startdate * 1000).toISOString().split('T')[0] : null,
          end_date: lmsCourse.enddate ? new Date(lmsCourse.enddate * 1000).toISOString().split('T')[0] : null,
          startdate: lmsCourse.startdate, // Unix timestamp
          enddate: lmsCourse.enddate, // Unix timestamp
          categoryname: lmsCourse.categoryname || 'Unknown',
          categoryid: lmsCourse.categoryid,
          course_type: 'online',
          seat_limit: 0,
          current_enrolled: 0,
          status: 'ongoing',
          visible: lmsCourse.visible === 1,
          is_lms_course: true,
        };
      } else {
        // Onsite course - fetch from regular API only (local database)
        const response = await coursesAPI.getById(courseId);
        courseData = response.data;
        // Explicitly mark as NOT an LMS course (onsite course)
        courseData.is_lms_course = false;
        // Ensure course_type is set if not present
        if (!courseData.course_type) {
          courseData.course_type = 'onsite';
        }
      }
      
      setCourse(courseData);
      
      // Set comments if available (only for onsite courses, not LMS courses)
      if (courseData.is_lms_course) {
        // LMS courses don't have comments in local database
        setComments([]);
      } else if (courseData.comments) {
        setComments(courseData.comments);
      } else {
        // Fetch comments separately if not included (only for onsite courses)
        try {
          const commentsResponse = await coursesAPI.getComments(courseId);
          setComments(commentsResponse.data);
        } catch (err) {
          // Silently handle 404 for courses without comments endpoint
          if (err.response?.status !== 404) {
            console.error('Error fetching comments:', err);
          }
          setComments([]);
        }
      }
      
      // If course is in draft status, fetch draft data and mentor details (only for onsite courses)
      if (!courseData.is_lms_course && courseData.status === 'draft') {
        try {
          // Try to get draft data
          let draftMentorAssignments = [];
          if (courseData.draft && courseData.draft.mentor_assignments) {
            draftMentorAssignments = courseData.draft.mentor_assignments;
          } else {
            // Try fetching draft separately if not included
            try {
              const draftResponse = await coursesAPI.getDraft(courseId);
              if (draftResponse.data && draftResponse.data.mentor_assignments) {
                draftMentorAssignments = draftResponse.data.mentor_assignments;
              }
            } catch (draftErr) {
              // No draft exists yet - this is expected for new courses
            }
          }
          
          if (draftMentorAssignments.length > 0) {
            const mentorIds = draftMentorAssignments.map(ma => ma.mentor_id);
            const mentorsResponse = await mentorsAPI.getAll('all');
            const mentorsMap = {};
            mentorsResponse.data.forEach(m => {
              mentorsMap[m.id] = m;
            });
            
            // Combine draft assignments with mentor details
            const draftMentors = draftMentorAssignments.map(ma => ({
              ...ma,
              mentor: mentorsMap[ma.mentor_id] || null,
              is_draft: true, // Flag to indicate this is a draft assignment
            }));
            
            setDraftMentorsWithDetails(draftMentors);
          } else {
            setDraftMentorsWithDetails([]);
          }
        } catch (err) {
          console.error('Error fetching draft mentor details:', err);
          setDraftMentorsWithDetails([]);
        }
      } else {
        setDraftMentorsWithDetails([]);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      setMessage({ type: 'error', text: 'Error fetching course details' });
    } finally {
      setLoading(false);
    }
  };

  return {
    course,
    loading,
    comments,
    draftMentorsWithDetails,
    message,
    setMessage,
    setCourse,
    setComments,
    fetchCourse,
  };
};

