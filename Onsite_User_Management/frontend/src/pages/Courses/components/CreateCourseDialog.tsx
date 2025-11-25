/**
 * CreateCourseDialog - Wrapper around the shared CourseFormDialog for creating courses
 * This maintains backward compatibility with existing code
 */

import React from 'react';
import { CourseFormDialog } from '../../../components/dialogs';
import AssignInternalMentorDialog from '../../../components/AssignInternalMentorDialog';
import AddExternalMentorDialog from '../../../components/AddExternalMentorDialog';
import { handleAssignInternalMentor, handleAddExternalMentor } from '../utils/mentorHandlers';
import { Course, ClassSchedule, Message, CourseMentorAssignment, CourseFormData, CourseType } from '../../../types';

interface CreateCourseDialogProps {
  open: boolean;
  onClose: () => void;
  formData: CourseFormData;
  setFormData: React.Dispatch<React.SetStateAction<CourseFormData>>;
  classSchedule: ClassSchedule[];
  setClassSchedule: React.Dispatch<React.SetStateAction<ClassSchedule[]>>;
  prerequisiteCourses: Course[];
  createAsDraft: boolean;
  setCreateAsDraft: React.Dispatch<React.SetStateAction<boolean>>;
  courseType: CourseType;
  onCreate: () => void;
  message: Message | null;
  setMessage: React.Dispatch<React.SetStateAction<Message | null>>;
  selectedMentors?: CourseMentorAssignment[];
  setSelectedMentors?: React.Dispatch<React.SetStateAction<CourseMentorAssignment[]>>;
  assignInternalMentorDialogOpen?: boolean;
  setAssignInternalMentorDialogOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  addExternalMentorDialogOpen?: boolean;
  setAddExternalMentorDialogOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}

const CreateCourseDialog: React.FC<CreateCourseDialogProps> = ({
  open,
  onClose,
  formData,
  setFormData,
  classSchedule,
  setClassSchedule,
  prerequisiteCourses,
  createAsDraft,
  setCreateAsDraft,
  courseType,
  onCreate,
  message,
  setMessage,
  selectedMentors = [],
  setSelectedMentors,
  assignInternalMentorDialogOpen = false,
  setAssignInternalMentorDialogOpen = () => {},
  addExternalMentorDialogOpen = false,
  setAddExternalMentorDialogOpen = () => {},
}) => {
  return (
    <>
      <CourseFormDialog
        open={open}
        onClose={onClose}
        mode="create"
        formData={formData}
        setFormData={setFormData}
        classSchedule={classSchedule}
        setClassSchedule={setClassSchedule}
        prerequisiteCourses={prerequisiteCourses}
        onSubmit={onCreate}
        setMessage={setMessage}
        createAsDraft={createAsDraft}
        setCreateAsDraft={setCreateAsDraft}
        courseType={courseType as any}
        selectedMentors={selectedMentors}
        setSelectedMentors={setSelectedMentors}
        onAssignInternalMentor={() => setAssignInternalMentorDialogOpen(true)}
        onAddExternalMentor={() => setAddExternalMentorDialogOpen(true)}
      />

      {/* Assign Internal Mentor Dialog */}
      <AssignInternalMentorDialog
        open={assignInternalMentorDialogOpen}
        onClose={() => setAssignInternalMentorDialogOpen(false)}
        onAssign={async (assignment) => {
          if (!setSelectedMentors) return;
          await handleAssignInternalMentor(assignment, setSelectedMentors, setMessage);
          setAssignInternalMentorDialogOpen(false);
        }}
        isDraft={createAsDraft}
      />

      {/* Add External Mentor Dialog */}
      <AddExternalMentorDialog
        open={addExternalMentorDialogOpen}
        onClose={() => setAddExternalMentorDialogOpen(false)}
        onAdd={async (assignment) => {
          if (!setSelectedMentors) return;
          await handleAddExternalMentor(assignment, setSelectedMentors, setMessage);
          setAddExternalMentorDialogOpen(false);
        }}
        isDraft={createAsDraft}
      />
    </>
  );
};

export default CreateCourseDialog;

