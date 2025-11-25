import { getCourseStatus } from '../../../utils/courseUtils';
import { convertTo12HourFormat } from '../../../utils/dateUtils';
import { getCourseStartDate } from './courseFilters';

/**
 * Generate unique color for each course based on course ID
 */
export const generateCourseColor = (courseId) => {
  const hash = courseId.toString().split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  const hue = Math.abs(hash) % 360;
  const saturation = 70;
  const lightness = 45;
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

/**
 * Convert course schedules to FullCalendar events
 */
export const convertSchedulesToEvents = (courses, courseType) => {
  const events = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Only process ongoing courses for calendar events (onsite only)
  const ongoingCoursesForCalendar = courseType === 'onsite' ? courses.filter(c => {
    const courseStatus = getCourseStatus(c);
    if (courseStatus !== 'ongoing') return false;
    const courseStartDate = getCourseStartDate(c);
    if (!courseStartDate) return false;
    courseStartDate.setHours(0, 0, 0, 0);
    return courseStartDate <= today;
  }) : [];
  
  ongoingCoursesForCalendar.forEach(course => {
    const eventColor = generateCourseColor(course.id);
    
    if (course.class_schedule && Array.isArray(course.class_schedule)) {
      course.class_schedule.forEach((schedule, scheduleIndex) => {
        const dayMap = {
          'Sunday': 0,
          'Monday': 1,
          'Tuesday': 2,
          'Wednesday': 3,
          'Thursday': 4,
          'Friday': 5,
          'Saturday': 6
        };
        
        const dayOfWeek = dayMap[schedule.day];
        if (dayOfWeek !== undefined && schedule.start_time && schedule.end_time) {
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - startDate.getDay());
          
          for (let week = 0; week < 12; week++) {
            const eventDate = new Date(startDate);
            eventDate.setDate(eventDate.getDate() + (week * 7) + dayOfWeek);
            
            const courseStart = new Date(course.start_date);
            const courseEnd = course.end_date ? new Date(course.end_date) : null;
            
            if (eventDate >= courseStart && (!courseEnd || eventDate <= courseEnd)) {
              const [startHour, startMin] = schedule.start_time.split(':').map(Number);
              const [endHour, endMin] = schedule.end_time.split(':').map(Number);
              
              const eventStart = new Date(eventDate);
              eventStart.setHours(startHour, startMin, 0, 0);
              
              const eventEnd = new Date(eventDate);
              eventEnd.setHours(endHour, endMin, 0, 0);
              
              const eventId = `course-${course.id}-${schedule.day}-${scheduleIndex}-${week}-${schedule.start_time.replace(':', '')}`;
              
              const title = course.class_schedule.filter(s => s.day === schedule.day).length > 1
                ? `${course.name} (${course.batch_code}) - ${convertTo12HourFormat(schedule.start_time)}`
                : `${course.name} (${course.batch_code})`;
              
              events.push({
                id: eventId,
                title: title,
                start: eventStart.toISOString(),
                end: eventEnd.toISOString(),
                backgroundColor: eventColor,
                borderColor: eventColor,
                textColor: '#ffffff',
                extendedProps: {
                  courseId: course.id,
                  courseName: course.name,
                  batchCode: course.batch_code,
                  time: `${convertTo12HourFormat(schedule.start_time)} - ${convertTo12HourFormat(schedule.end_time)}`,
                  day: schedule.day,
                  scheduleIndex: scheduleIndex,
                },
              });
            }
          }
        }
      });
    }
  });
  
  return events;
};

