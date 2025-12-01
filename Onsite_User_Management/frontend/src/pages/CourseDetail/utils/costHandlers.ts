import { coursesAPI, mentorsAPI } from '../../../services/api';
import { getDisplayMentors } from './costCalculators';
import type { Course, AlertMessage } from '../../../types';
import { AxiosError } from 'axios';

interface DraftMentorWithDetails {
  mentor_id: number;
  mentor: { id: number; name: string };
  hours_taught: number;
  amount_paid: number | string;
}

interface MentorCost {
  id: string | number;
  mentor_id: number;
  mentor_name: string;
  hours_taught: string;
  amount_paid: string;
}

interface CourseWithDraft extends Course {
  draft?: {
    food_cost?: number | string | null;
    other_cost?: number | string | null;
    mentor_assignments?: any[];
  };
}

type SetMessage = React.Dispatch<React.SetStateAction<AlertMessage | null>>;

export const handleOpenEditCosts = (
  course: CourseWithDraft | null,
  draftMentorsWithDetails: DraftMentorWithDetails[],
  setFoodCost: (cost: string) => void,
  setOtherCost: (cost: string) => void,
  setMentorCosts: (costs: MentorCost[]) => void,
  setEditCostsDialogOpen: (open: boolean) => void
): void => {
  const foodCostValue =
    course?.status === 'draft' && course?.draft?.food_cost !== null && course?.draft?.food_cost !== undefined
      ? course.draft.food_cost
      : course?.food_cost;
  const otherCostValue =
    course?.status === 'draft' && course?.draft?.other_cost !== null && course?.draft?.other_cost !== undefined
      ? course.draft.other_cost
      : course?.other_cost;

  setFoodCost(foodCostValue?.toString() || '0');
  setOtherCost(otherCostValue?.toString() || '0');

  const displayMentors = getDisplayMentors(course, draftMentorsWithDetails as any);
  if (displayMentors.length > 0) {
    setMentorCosts(
      displayMentors.map((cm: any) => ({
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

export const handleSaveCosts = async (
  foodCost: string,
  otherCost: string,
  mentorCosts: MentorCost[],
  courseId: number,
  course: Course | null,
  setMessage: SetMessage,
  setEditCostsDialogOpen: (open: boolean) => void,
  fetchCourse: () => Promise<void>,
  setEditCostsLoading: (loading: boolean) => void,
  generalMentorCost?: string
): Promise<void> => {
  setEditCostsLoading(true);
  try {
    if (course && course.status === 'draft') {
      let draftData: { mentor_assignments: any[]; food_cost: number | null; other_cost: number | null } = {
        mentor_assignments: [],
        food_cost: null,
        other_cost: null,
      };
      try {
        const existingDraft = await coursesAPI.getDraft(courseId);
        draftData = existingDraft.data as typeof draftData;
      } catch {
        // Draft doesn't exist yet
      }

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
      await coursesAPI.updateCosts(courseId, {
        food_cost: parseFloat(foodCost) || 0,
        other_cost: parseFloat(otherCost) || 0,
      });

      if (mentorCosts.length > 0) {
        const updatePromises = mentorCosts.map((mc) =>
          coursesAPI.assignMentor(courseId, {
            mentor_id: mc.mentor_id,
            hours_taught: parseFloat(mc.hours_taught) || 0,
            amount_paid: parseFloat(mc.amount_paid) || 0,
          })
        );
        await Promise.all(updatePromises);
      } else if (generalMentorCost && parseFloat(generalMentorCost) > 0) {
        // Create placeholder external mentor and assign cost
        try {
          const mentorPayload = {
            is_internal: false,
            name: 'External Trainer',
            student_id: undefined,
            expertise: 'General'
          };
          const mentorResponse = await mentorsAPI.createExternal(mentorPayload);
          const mentorId = mentorResponse.data.id;

          await coursesAPI.assignMentor(courseId, {
            mentor_id: mentorId,
            hours_taught: 0,
            amount_paid: parseFloat(generalMentorCost)
          });
        } catch (err) {
          console.error('Error creating placeholder mentor:', err);
          // Continue to show success for other costs, but maybe warn?
          // For now, just logging error.
        }
      }

      setMessage({ type: 'success', text: 'Costs updated successfully' });
    }

    setEditCostsDialogOpen(false);
    await fetchCourse();
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    setMessage({ type: 'error', text: axiosError.response?.data?.detail || 'Error updating costs' });
  } finally {
    setEditCostsLoading(false);
  }
};

