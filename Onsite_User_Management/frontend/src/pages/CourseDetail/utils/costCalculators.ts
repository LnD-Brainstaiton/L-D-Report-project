import type { Course, Mentor } from '../../../types';

interface DraftMentorWithDetails {
  mentor_id: number;
  mentor: Mentor;
  hours_taught: number;
  amount_paid: number | string;
}

interface CourseMentor {
  id: number | string;
  mentor_id: number;
  mentor: Mentor;
  hours_taught: number;
  amount_paid: number | string;
  is_draft?: boolean;
}

interface CourseWithDraft extends Course {
  draft?: {
    food_cost?: number | string | null;
    other_cost?: number | string | null;
  };
}

export const getDisplayMentors = (
  course: CourseWithDraft | null,
  draftMentorsWithDetails: DraftMentorWithDetails[]
): CourseMentor[] => {
  if (course?.status === 'draft') {
    if (draftMentorsWithDetails.length > 0) {
      return draftMentorsWithDetails.map((dm, index) => ({
        id: `draft-${dm.mentor_id}-${index}`,
        mentor_id: dm.mentor_id,
        mentor: dm.mentor,
        hours_taught: dm.hours_taught,
        amount_paid: dm.amount_paid,
        is_draft: true,
      }));
    }
    return [];
  }
  return (course?.mentors as CourseMentor[]) || [];
};

export const calculateTotalMentorCost = (
  course: CourseWithDraft | null,
  draftMentorsWithDetails: DraftMentorWithDetails[]
): number => {
  let total = 0;
  if (course?.mentors) {
    total += (course.mentors as CourseMentor[]).reduce(
      (sum, cm) => sum + parseFloat(String(cm.amount_paid || 0)),
      0
    );
  }
  if (course?.status === 'draft' && draftMentorsWithDetails.length > 0) {
    total += draftMentorsWithDetails.reduce(
      (sum, dm) => sum + parseFloat(String(dm.amount_paid || 0)),
      0
    );
  }
  return total;
};

export const calculateTotalTrainingCost = (
  course: CourseWithDraft | null,
  draftMentorsWithDetails: DraftMentorWithDetails[]
): number => {
  const mentorCost = calculateTotalMentorCost(course, draftMentorsWithDetails);
  const foodCost =
    course?.status === 'draft' && course?.draft?.food_cost !== null && course?.draft?.food_cost !== undefined
      ? parseFloat(String(course.draft.food_cost))
      : parseFloat(String(course?.food_cost || 0));
  const otherCost =
    course?.status === 'draft' && course?.draft?.other_cost !== null && course?.draft?.other_cost !== undefined
      ? parseFloat(String(course.draft.other_cost))
      : parseFloat(String(course?.other_cost || 0));
  return mentorCost + foodCost + otherCost;
};

