import { coursesAPI } from '../../../services/api';

/**
 * Handle assigning a mentor (internal or external)
 */
export const handleAssignMentor = async (
  assignment,
  courseId,
  course,
  setMessage,
  fetchCourse,
  setAssignMentorLoading
) => {
  setAssignMentorLoading(true);
  try {
    // If course is in draft status, save to draft instead of directly assigning
    if (course && course.status === 'draft') {
      // Get existing draft or create new one
      let draftData = { mentor_assignments: [] };
      try {
        const existingDraft = await coursesAPI.getDraft(courseId);
        draftData = existingDraft.data;
      } catch (err) {
        // Draft doesn't exist yet, will create new one
      }
      
      // Remove existing assignment for this mentor if any
      const updatedAssignments = (draftData.mentor_assignments || []).filter(
        ma => ma.mentor_id !== assignment.mentor_id
      );
      updatedAssignments.push(assignment);
      
      // Save draft
      await coursesAPI.saveDraft(courseId, {
        ...draftData,
        mentor_assignments: updatedAssignments,
      });
      
      setMessage({ type: 'success', text: 'Mentor assignment saved to draft (temporary)' });
    } else {
      // Course is approved/ongoing, assign directly
      await coursesAPI.assignMentor(courseId, assignment);
      setMessage({ type: 'success', text: 'Mentor assigned successfully' });
    }
    
    await fetchCourse();
  } catch (error) {
    setMessage({ type: 'error', text: error.response?.data?.detail || 'Error assigning mentor' });
    throw error; // Re-throw so dialog can handle it
  } finally {
    setAssignMentorLoading(false);
  }
};

/**
 * Handle editing mentor hours and payment
 */
export const handleEditMentor = async (
  editingMentor,
  editMentorHours,
  editMentorAmount,
  courseId,
  course,
  setMessage,
  setEditMentorDialogOpen,
  setEditingMentor,
  setEditMentorHours,
  setEditMentorAmount,
  fetchCourse,
  setEditMentorLoading
) => {
  if (!editMentorHours || parseFloat(editMentorHours) < 0) {
    setMessage({ type: 'error', text: 'Hours taught is required and must be >= 0' });
    return;
  }
  if (!editMentorAmount || parseFloat(editMentorAmount) < 0) {
    setMessage({ type: 'error', text: 'Amount paid is required and must be >= 0' });
    return;
  }
  
  if (!editingMentor) {
    setMessage({ type: 'error', text: 'No mentor selected' });
    return;
  }
  
  setEditMentorLoading(true);
  try {
    const mentorId = editingMentor.mentor_id || editingMentor.mentor?.id;
    const hoursTaught = parseFloat(editMentorHours) || 0;
    const amountPaid = parseFloat(editMentorAmount) || 0;
    
    // If course is in draft status, update draft
    if (course && course.status === 'draft') {
      // Get existing draft
      let draftData = { mentor_assignments: [], food_cost: null, other_cost: null };
      try {
        const existingDraft = await coursesAPI.getDraft(courseId);
        draftData = existingDraft.data;
      } catch (err) {
        setMessage({ type: 'error', text: 'Draft not found' });
        return;
      }
      
      // Ensure mentor_assignments is an array
      if (!draftData.mentor_assignments || !Array.isArray(draftData.mentor_assignments)) {
        draftData.mentor_assignments = [];
      }
      
      // Update mentor assignment in draft
      const updatedAssignments = draftData.mentor_assignments.map(ma => {
        if (ma.mentor_id === mentorId) {
          return {
            ...ma,
            hours_taught: hoursTaught,
            amount_paid: amountPaid,
          };
        }
        return ma;
      });
      
      // If mentor not found in draft, add it
      const mentorExists = updatedAssignments.some(ma => ma.mentor_id === mentorId);
      if (!mentorExists) {
        updatedAssignments.push({
          mentor_id: mentorId,
          hours_taught: hoursTaught,
          amount_paid: amountPaid,
        });
      }
      
      // Save updated draft
      const draftPayload = {
        mentor_assignments: updatedAssignments,
      };
      if (draftData.food_cost !== null && draftData.food_cost !== undefined) {
        draftPayload.food_cost = draftData.food_cost;
      }
      if (draftData.other_cost !== null && draftData.other_cost !== undefined) {
        draftPayload.other_cost = draftData.other_cost;
      }
      
      await coursesAPI.saveDraft(courseId, draftPayload);
      setMessage({ type: 'success', text: 'Mentor hours and payment updated in draft' });
    } else {
      // Course is approved/ongoing, update official assignment
      if (editingMentor.id) {
        // Update existing assignment
        await coursesAPI.assignMentor(courseId, {
          mentor_id: mentorId,
          hours_taught: hoursTaught,
          amount_paid: amountPaid,
        });
        setMessage({ type: 'success', text: 'Mentor hours and payment updated successfully' });
      } else {
        setMessage({ type: 'error', text: 'Cannot update: mentor assignment not found' });
      }
    }
    
    setEditMentorDialogOpen(false);
    setEditingMentor(null);
    setEditMentorHours('');
    setEditMentorAmount('');
    await fetchCourse();
  } catch (error) {
    setMessage({ type: 'error', text: error.response?.data?.detail || 'Error updating mentor' });
  } finally {
    setEditMentorLoading(false);
  }
};

/**
 * Handle removing a mentor
 */
export const handleRemoveMentor = async (
  courseMentorId,
  mentorId,
  courseId,
  course,
  draftMentorsWithDetails,
  setMessage,
  fetchCourse
) => {
  if (!window.confirm('Are you sure you want to remove this mentor from the course?')) {
    return;
  }
  try {
    // If course is in draft status, remove from draft instead
    if (course && course.status === 'draft') {
      // Get existing draft
      let draftData = { mentor_assignments: [] };
      try {
        const existingDraft = await coursesAPI.getDraft(courseId);
        draftData = existingDraft.data;
      } catch (err) {
        setMessage({ type: 'error', text: 'Draft not found' });
        return;
      }
      
      // Find the mentor_id from the draft assignment
      let mentorIdToRemove = mentorId;
      if (!mentorIdToRemove && courseMentorId) {
        // Try to find mentor_id from draft mentors
        const draftMentor = draftMentorsWithDetails.find(dm => dm.id === courseMentorId || `draft-${dm.mentor_id}` === courseMentorId);
        if (draftMentor) {
          mentorIdToRemove = draftMentor.mentor_id;
        }
      }
      
      if (!mentorIdToRemove) {
        setMessage({ type: 'error', text: 'Could not find mentor to remove' });
        return;
      }
      
      // Remove mentor assignment from draft
      const updatedAssignments = (draftData.mentor_assignments || []).filter(
        ma => ma.mentor_id !== mentorIdToRemove
      );
      
      // Save updated draft
      await coursesAPI.saveDraft(courseId, {
        ...draftData,
        mentor_assignments: updatedAssignments,
      });
      
      setMessage({ type: 'success', text: 'Mentor removed from draft' });
    } else {
      // Course is approved/ongoing, remove from official assignments
      await coursesAPI.removeCourseMentor(courseId, courseMentorId);
      setMessage({ type: 'success', text: 'Mentor removed successfully' });
    }
    
    await fetchCourse();
  } catch (error) {
    setMessage({ type: 'error', text: error.response?.data?.detail || 'Error removing mentor' });
  }
};

