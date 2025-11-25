import { mentorsAPI } from '../../../services/api';

/**
 * Handle assigning an internal mentor
 */
export const handleAssignInternalMentor = async (assignment, setSelectedMentors, setMessage) => {
  try {
    const mentorResponse = await mentorsAPI.getById(assignment.mentor_id);
    const mentor = mentorResponse.data;
    const mentorName = mentor.student 
      ? `${mentor.student.name} (${mentor.student.employee_id})` 
      : mentor.name;
    
    setSelectedMentors(prev => [...prev, {
      ...assignment,
      mentor_name: mentorName,
      is_internal: true,
    }]);
    setMessage({ type: 'success', text: 'Internal mentor added successfully' });
  } catch (error) {
    console.error('Error fetching mentor details:', error);
    setSelectedMentors(prev => [...prev, {
      ...assignment,
      mentor_name: 'Internal Mentor',
      is_internal: true,
    }]);
    setMessage({ type: 'success', text: 'Internal mentor added successfully' });
  }
};

/**
 * Handle adding an external mentor
 */
export const handleAddExternalMentor = async (assignment, setSelectedMentors, setMessage) => {
  try {
    const mentorResponse = await mentorsAPI.getById(assignment.mentor_id);
    const mentor = mentorResponse.data;
    const mentorName = mentor.name || 'External Mentor';
    
    setSelectedMentors(prev => [...prev, {
      ...assignment,
      mentor_name: mentorName,
      is_internal: false,
    }]);
    setMessage({ type: 'success', text: 'External mentor added successfully' });
  } catch (error) {
    console.error('Error fetching mentor details:', error);
    setSelectedMentors(prev => [...prev, {
      ...assignment,
      mentor_name: 'External Mentor',
      is_internal: false,
    }]);
    setMessage({ type: 'success', text: 'External mentor added successfully' });
  }
};

/**
 * Handle removing a mentor from the list
 */
export const handleRemoveMentor = (index, selectedMentors, setSelectedMentors) => {
  setSelectedMentors(selectedMentors.filter((_, i) => i !== index));
};

