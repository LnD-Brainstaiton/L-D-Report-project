/**
 * Get display mentors (combines official and draft mentors)
 */
export const getDisplayMentors = (course, draftMentorsWithDetails) => {
  if (course?.status === 'draft') {
    // For draft courses, show draft mentors (if any exist)
    if (draftMentorsWithDetails.length > 0) {
      return draftMentorsWithDetails.map((dm, index) => ({
        id: `draft-${dm.mentor_id}-${index}`, // Unique ID for draft assignments
        mentor_id: dm.mentor_id,
        mentor: dm.mentor,
        hours_taught: dm.hours_taught,
        amount_paid: dm.amount_paid,
        is_draft: true,
      }));
    } else {
      // No draft mentors yet
      return [];
    }
  } else {
    // For approved/ongoing courses, show official mentors
    return course?.mentors || [];
  }
};

/**
 * Calculate total mentor cost
 */
export const calculateTotalMentorCost = (course, draftMentorsWithDetails) => {
  let total = 0;
  // Add official mentor costs
  if (course?.mentors) {
    total += course.mentors.reduce((sum, cm) => sum + parseFloat(cm.amount_paid || 0), 0);
  }
  // Add draft mentor costs if course is in draft status
  if (course?.status === 'draft' && draftMentorsWithDetails.length > 0) {
    total += draftMentorsWithDetails.reduce((sum, dm) => sum + parseFloat(dm.amount_paid || 0), 0);
  }
  return total;
};

/**
 * Calculate total training cost
 */
export const calculateTotalTrainingCost = (course, draftMentorsWithDetails) => {
  const mentorCost = calculateTotalMentorCost(course, draftMentorsWithDetails);
  // For draft courses, use draft costs if available
  const foodCost = (course?.status === 'draft' && course?.draft?.food_cost !== null && course?.draft?.food_cost !== undefined)
    ? parseFloat(course.draft.food_cost)
    : parseFloat(course?.food_cost || 0);
  const otherCost = (course?.status === 'draft' && course?.draft?.other_cost !== null && course?.draft?.other_cost !== undefined)
    ? parseFloat(course.draft.other_cost)
    : parseFloat(course?.other_cost || 0);
  return mentorCost + foodCost + otherCost;
};

