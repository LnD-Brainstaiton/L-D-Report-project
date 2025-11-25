import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';

function EditAttendanceDialog({
  open,
  onClose,
  selectedEnrollmentForEdit,
  editClassesAttended,
  setEditClassesAttended,
  editScore,
  setEditScore,
  course,
  onConfirm,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Attendance & Score</DialogTitle>
      <DialogContent>
        <TextField
          label="Classes Attended"
          type="number"
          fullWidth
          value={editClassesAttended}
          onChange={(e) => setEditClassesAttended(e.target.value)}
          sx={{ mt: 2 }}
          inputProps={{ min: 0, max: course?.total_classes_offered }}
        />
        <TextField
          label="Score"
          type="number"
          fullWidth
          value={editScore}
          onChange={(e) => setEditScore(e.target.value)}
          sx={{ mt: 2 }}
          inputProps={{ min: 0, max: 100, step: 0.1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} variant="contained">
          Update
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default EditAttendanceDialog;

