import { mentorsAPI } from '../../../services/api';
import type { AlertMessage, CourseMentorAssignment } from '../../../types';

type MentorAssignment = CourseMentorAssignment & {
  mentor_id: number;
};

type SetMessage = React.Dispatch<React.SetStateAction<AlertMessage | null>>;
type SetSelectedMentors = React.Dispatch<React.SetStateAction<MentorAssignment[]>>;

export const handleAssignInternalMentor = async (
  assignment: MentorAssignment,
  setSelectedMentors: SetSelectedMentors,
  setMessage: SetMessage
): Promise<void> => {
  try {
    const mentorResponse = await mentorsAPI.getById(assignment.mentor_id);
    const mentor = mentorResponse.data as any;
    const mentorName = mentor.student ? `${mentor.student.name} (${mentor.student.employee_id})` : mentor.name;

    setSelectedMentors((prev) => [
      ...prev,
      {
        ...assignment,
        mentor_name: mentorName,
        is_internal: true,
      },
    ]);
    setMessage({ type: 'success', text: 'Internal mentor added successfully' });
  } catch (error) {
    console.error('Error fetching mentor details:', error);
    setSelectedMentors((prev) => [
      ...prev,
      {
        ...assignment,
        mentor_name: 'Internal Mentor',
        is_internal: true,
      },
    ]);
    setMessage({ type: 'success', text: 'Internal mentor added successfully' });
  }
};

export const handleAddExternalMentor = async (
  assignment: MentorAssignment,
  setSelectedMentors: SetSelectedMentors,
  setMessage: SetMessage
): Promise<void> => {
  try {
    const mentorResponse = await mentorsAPI.getById(assignment.mentor_id);
    const mentor = mentorResponse.data as any;
    const mentorName = mentor.name || 'External Mentor';

    setSelectedMentors((prev) => [
      ...prev,
      {
        ...assignment,
        mentor_name: mentorName,
        is_internal: false,
      },
    ]);
    setMessage({ type: 'success', text: 'External mentor added successfully' });
  } catch (error) {
    console.error('Error fetching mentor details:', error);
    setSelectedMentors((prev) => [
      ...prev,
      {
        ...assignment,
        mentor_name: 'External Mentor',
        is_internal: false,
      },
    ]);
    setMessage({ type: 'success', text: 'External mentor added successfully' });
  }
};

export const handleRemoveMentor = (
  index: number,
  selectedMentors: MentorAssignment[],
  setSelectedMentors: SetSelectedMentors
): void => {
  setSelectedMentors(selectedMentors.filter((_, i) => i !== index));
};

