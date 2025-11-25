import { coursesAPI } from '../../../services/api';
import { getDisplayMentors } from './costCalculators';

/**
 * Handle opening edit costs dialog
 */
export const handleOpenEditCosts = (
  course,
  draftMentorsWithDetails,
  setFoodCost,
  setOtherCost,
  setMentorCosts,
  setEditCostsDialogOpen
) => {
  // For draft courses, use draft costs; otherwise use official costs
  const foodCostValue = (course?.status === 'draft' && course?.draft?.food_cost !== null && course?.draft?.food_cost !== undefined)
    ? course.draft.food_cost
    : course?.food_cost;
  const otherCostValue = (course?.status === 'draft' && course?.draft?.other_cost !== null && course?.draft?.other_cost !== undefined)
    ? course.draft.other_cost
    : course?.other_cost;
  
  setFoodCost(foodCostValue?.toString() || '0');
  setOtherCost(otherCostValue?.toString() || '0');
  
  // Initialize mentor costs from course mentors or draft mentors
  const displayMentors = getDisplayMentors(course, draftMentorsWithDetails);
  if (displayMentors.length > 0) {
    setMentorCosts(
      displayMentors.map((cm) => ({
        id: cm.id || `draft-${cm.mentor_id}`,
        mentor_id: cm.mentor?.id || cm.mentor_id,
        mentor_name: cm.mentor?.name || 'Unknown',
        hours_taught: cm.hours_taught?.toString() || '0',
        amount_paid: cm.amount_paid?.toString() || '0',
      }))
    );
  } else {
    setMentorCosts([]);
  }
  setEditCostsDialogOpen(true);
};

/**
 * Handle saving costs
 */
export const handleSaveCosts = async (
  foodCost,
  otherCost,
  mentorCosts,
  courseId,
  course,
  setMessage,
  setEditCostsDialogOpen,
  fetchCourse,
  setEditCostsLoading
) => {
  setEditCostsLoading(true);
  try {
    // If course is in draft status, save to draft instead
    if (course && course.status === 'draft') {
      // Get existing draft or create new one
      let draftData = { mentor_assignments: [], food_cost: null, other_cost: null };
      try {
        const existingDraft = await coursesAPI.getDraft(courseId);
        draftData = existingDraft.data;
      } catch (err) {
        // Draft doesn't exist yet, will create new one
      }
      
      // Update costs and mentor assignments in draft
      const updatedDraft = {
        ...draftData,
        food_cost: parseFloat(foodCost) || 0,
        other_cost: parseFloat(otherCost) || 0,
        mentor_assignments: mentorCosts.map((mc) => ({
          mentor_id: mc.mentor_id,
          hours_taught: parseFloat(mc.hours_taught) || 0,
          amount_paid: parseFloat(mc.amount_paid) || 0,
        })),
      };
      
      await coursesAPI.saveDraft(courseId, updatedDraft);
      setMessage({ type: 'success', text: 'Costs saved to draft (temporary)' });
    } else {
      // Course is approved/ongoing, update directly
      await coursesAPI.updateCosts(courseId, {
        food_cost: parseFloat(foodCost) || 0,
        other_cost: parseFloat(otherCost) || 0,
      });
      
      // Update mentor costs
      if (mentorCosts.length > 0) {
        const updatePromises = mentorCosts.map((mc) =>
          coursesAPI.assignMentor(courseId, {
            mentor_id: mc.mentor_id,
            hours_taught: parseFloat(mc.hours_taught) || 0,
            amount_paid: parseFloat(mc.amount_paid) || 0,
          })
        );
        await Promise.all(updatePromises);
      }
      
      setMessage({ type: 'success', text: 'Costs updated successfully' });
    }
    
    setEditCostsDialogOpen(false);
    await fetchCourse();
  } catch (error) {
    setMessage({ type: 'error', text: error.response?.data?.detail || 'Error updating costs' });
  } finally {
    setEditCostsLoading(false);
  }
};

