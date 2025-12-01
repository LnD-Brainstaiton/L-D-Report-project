import { getCourseStatus } from '../../../utils/courseUtils';
import { convertTo12HourFormat } from '../../../utils/dateUtils';
import { getCourseStartDate } from './courseFilters';
import type { Course, ClassSchedule } from '../../../types';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    courseId: number;
    courseName: string;
    batchCode: string;
    time: string;
    day: string;
    scheduleIndex: number;
    courseType?: string;
  };
}

interface CourseWithSchedule extends Course {
  class_schedule?: ClassSchedule[];
}

const DAY_MAP: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

/**
 * Generate unique color for each course based on course ID
 */
export const generateCourseColor = (courseId: number): string => {
  const hash = courseId
    .toString()
    .split('')
    .reduce((acc, char) => {
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
export const convertSchedulesToEvents = (
  courses: CourseWithSchedule[],
  _courseType: string // Unused now as we process all passed courses
): CalendarEvent[] => {
  const events: CalendarEvent[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Process both onsite and external courses that are ongoing
  const ongoingCoursesForCalendar = courses.filter((c) => {
    const courseStatus = getCourseStatus(c as any);
    if (courseStatus !== 'ongoing') return false;

    // Only process onsite and external courses
    if (c.course_type !== 'onsite' && c.course_type !== 'external') return false;

    const courseStartDate = getCourseStartDate(c);
    if (!courseStartDate) return false;
    courseStartDate.setHours(0, 0, 0, 0);
    return courseStartDate <= today;
  });

  ongoingCoursesForCalendar.forEach((course) => {
    // Use different base colors for onsite vs external
    // Onsite: Blue/Green hues (default logic)
    // External: Orange/Red hues
    const isExternal = course.course_type === 'external';
    const eventColor = isExternal
      ? `hsl(${Math.abs(generateCourseColor(course.id).split(',')[0].split('(')[1] as any) % 60 + 10}, 80%, 55%)` // Orange/Red range
      : generateCourseColor(course.id);

    const typeTag = isExternal ? '[External]' : '[Onsite]';

    if (course.class_schedule && Array.isArray(course.class_schedule)) {
      course.class_schedule.forEach((schedule, scheduleIndex) => {
        const dayOfWeek = DAY_MAP[schedule.day];
        if (dayOfWeek !== undefined && schedule.start_time && schedule.end_time) {
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - startDate.getDay());

          for (let week = 0; week < 12; week++) {
            const eventDate = new Date(startDate);
            eventDate.setDate(eventDate.getDate() + week * 7 + dayOfWeek);

            if (!course.start_date) return;
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

              const title =
                course.class_schedule!.filter((s) => s.day === schedule.day).length > 1
                  ? `${typeTag} ${course.name} (${course.batch_code}) - ${convertTo12HourFormat(schedule.start_time)}`
                  : `${typeTag} ${course.name} (${course.batch_code})`;

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
                  courseName: course.name || 'Untitled Course',
                  batchCode: course.batch_code || '',
                  time: `${convertTo12HourFormat(schedule.start_time)} - ${convertTo12HourFormat(schedule.end_time)}`,
                  day: schedule.day,
                  scheduleIndex: scheduleIndex,
                  courseType: course.course_type,
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

