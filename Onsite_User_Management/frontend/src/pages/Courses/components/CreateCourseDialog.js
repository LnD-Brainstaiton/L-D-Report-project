/**
 * CreateCourseDialog - Wrapper around the shared CourseFormDialog for creating courses
 * This maintains backward compatibility with existing code
 */

import React from 'react';
import { CourseFormDialog } from '../../../components/dialogs';
import AssignInternalMentorDialog from '../../../components/AssignInternalMentorDialog';
import AddExternalMentorDialog from '../../../components/AddExternalMentorDialog';
import { handleAssignInternalMentor, handleAddExternalMentor } from '../utils/mentorHandlers';

const CreateCourseDialog = ({
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
  selectedMentors,
  setSelectedMentors,
  assignInternalMentorDialogOpen,
  setAssignInternalMentorDialogOpen,
  addExternalMentorDialogOpen,
  setAddExternalMentorDialogOpen,
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
        courseType={courseType}
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
          await handleAddExternalMentor(assignment, setSelectedMentors, setMessage);
          setAddExternalMentorDialogOpen(false);
        }}
        isDraft={createAsDraft}
      />
    </>
  );
};

export default CreateCourseDialog;
