import { coursesAPI } from '../../../services/api';
import type { Course, Mentor, AlertMessage, CourseMentorAssignment } from '../../../types';
import { AxiosError } from 'axios';

type MentorAssignment = CourseMentorAssignment & {
  mentor_id: number;
};

interface DraftMentorWithDetails {
  id?: string | number;
  mentor_id: number;
  mentor: Mentor;
  hours_taught: number;
  amount_paid: number | string;
}

interface EditingMentor {
  id?: number | string;
  mentor_id?: number;
  mentor?: { id: number } | null;
  hours_taught?: number | string;
  amount_paid?: number | string;
  is_draft?: boolean;
}

type SetMessage = React.Dispatch<React.SetStateAction<AlertMessage | null>>;

export const handleAssignMentor = async (
  assignment: MentorAssignment,
  courseId: number,
  course: Course | null,
  setMessage: SetMessage,
  fetchCourse: () => Promise<void>,
  setAssignMentorLoading: (loading: boolean) => void
): Promise<void> => {
  setAssignMentorLoading(true);
  try {
    if (course && course.status === 'draft') {
      let draftData: { mentor_assignments: MentorAssignment[] } = { mentor_assignments: [] };
      try {
        const existingDraft = await coursesAPI.getDraft(courseId);
        draftData = existingDraft.data as { mentor_assignments: MentorAssignment[] };
      } catch {
        // Draft doesn't exist yet
      }

      const updatedAssignments = (draftData.mentor_assignments || []).filter(
        (ma) => ma.mentor_id !== assignment.mentor_id
      );
      updatedAssignments.push(assignment);

      await coursesAPI.saveDraft(courseId, {
        ...draftData,
        mentor_assignments: updatedAssignments,
      });

      setMessage({ type: 'success', text: 'Mentor assignment saved to draft (temporary)' });
    } else {
      await coursesAPI.assignMentor(courseId, {
        mentor_id: assignment.mentor_id,
        hours_taught: typeof assignment.hours_taught === 'string' ? parseFloat(assignment.hours_taught) : assignment.hours_taught,
        amount_paid: typeof assignment.amount_paid === 'string' ? parseFloat(assignment.amount_paid) : assignment.amount_paid,
      });
      setMessage({ type: 'success', text: 'Mentor assigned successfully' });
    }

    await fetchCourse();
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    setMessage({ type: 'error', text: axiosError.response?.data?.detail || 'Error assigning mentor' });
    throw error;
  } finally {
    setAssignMentorLoading(false);
  }
};

export const handleEditMentor = async (
  editingMentor: EditingMentor | null,
  editMentorHours: string,
  editMentorAmount: string,
  courseId: number,
  course: Course | null,
  setMessage: SetMessage,
  setEditMentorDialogOpen: (open: boolean) => void,
  setEditingMentor: (mentor: EditingMentor | null) => void,
  setEditMentorHours: (hours: string) => void,
  setEditMentorAmount: (amount: string) => void,
  fetchCourse: () => Promise<void>,
  setEditMentorLoading: (loading: boolean) => void
): Promise<void> => {
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

    if (course && course.status === 'draft') {
      let draftData: { mentor_assignments: MentorAssignment[]; food_cost?: number | null; other_cost?: number | null } = {
        mentor_assignments: [],
        food_cost: null,
        other_cost: null,
      };
      try {
        const existingDraft = await coursesAPI.getDraft(courseId);
        draftData = existingDraft.data as typeof draftData;
      } catch {
        setMessage({ type: 'error', text: 'Draft not found' });
        return;
      }

      if (!draftData.mentor_assignments || !Array.isArray(draftData.mentor_assignments)) {
        draftData.mentor_assignments = [];
      }

      const updatedAssignments = draftData.mentor_assignments.map((ma) => {
        if (ma.mentor_id === mentorId) {
          return { ...ma, hours_taught: hoursTaught, amount_paid: amountPaid };
        }
        return ma;
      });

      const mentorExists = updatedAssignments.some((ma) => ma.mentor_id === mentorId);
      if (!mentorExists && mentorId) {
        updatedAssignments.push({ mentor_id: mentorId, hours_taught: hoursTaught, amount_paid: amountPaid });
      }

      const draftPayload: any = { mentor_assignments: updatedAssignments };
      if (draftData.food_cost !== null && draftData.food_cost !== undefined) {
        draftPayload.food_cost = draftData.food_cost;
      }
      if (draftData.other_cost !== null && draftData.other_cost !== undefined) {
        draftPayload.other_cost = draftData.other_cost;
      }

      await coursesAPI.saveDraft(courseId, draftPayload);
      setMessage({ type: 'success', text: 'Mentor hours and payment updated in draft' });
    } else {
      if (editingMentor.id && mentorId) {
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
    const axiosError = error as AxiosError<{ detail?: string }>;
    setMessage({ type: 'error', text: axiosError.response?.data?.detail || 'Error updating mentor' });
  } finally {
    setEditMentorLoading(false);
  }
};

export const handleRemoveMentor = async (
  courseMentorId: number | string,
  mentorId: number | undefined,
  courseId: number,
  course: Course | null,
  draftMentorsWithDetails: DraftMentorWithDetails[],
  setMessage: SetMessage,
  fetchCourse: () => Promise<void>
): Promise<void> => {
  if (!window.confirm('Are you sure you want to remove this mentor from the course?')) {
    return;
  }
  try {
    if (course && course.status === 'draft') {
      let draftData: { mentor_assignments: MentorAssignment[] } = { mentor_assignments: [] };
      try {
        const existingDraft = await coursesAPI.getDraft(courseId);
        draftData = existingDraft.data as { mentor_assignments: MentorAssignment[] };
      } catch {
        setMessage({ type: 'error', text: 'Draft not found' });
        return;
      }

      let mentorIdToRemove = mentorId;
      if (!mentorIdToRemove && courseMentorId) {
        const draftMentor = draftMentorsWithDetails.find(
          (dm) => dm.id === courseMentorId || `draft-${dm.mentor_id}` === courseMentorId
        );
        if (draftMentor) {
          mentorIdToRemove = draftMentor.mentor_id;
        }
      }

      if (!mentorIdToRemove) {
        setMessage({ type: 'error', text: 'Could not find mentor to remove' });
        return;
      }

      const updatedAssignments = (draftData.mentor_assignments || []).filter(
        (ma) => ma.mentor_id !== mentorIdToRemove
      );

      await coursesAPI.saveDraft(courseId, {
        ...draftData,
        mentor_assignments: updatedAssignments,
      });

      setMessage({ type: 'success', text: 'Mentor removed from draft' });
    } else {
      await coursesAPI.removeCourseMentor(courseId, courseMentorId as number);
      setMessage({ type: 'success', text: 'Mentor removed successfully' });
    }

    await fetchCourse();
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    setMessage({ type: 'error', text: axiosError.response?.data?.detail || 'Error removing mentor' });
  }
};

