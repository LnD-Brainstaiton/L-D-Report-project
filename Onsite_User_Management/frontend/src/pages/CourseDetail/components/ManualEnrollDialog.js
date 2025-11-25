import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Autocomplete,
  TextField,
} from '@mui/material';

function ManualEnrollDialog({
  open,
  onClose,
  students,
  selectedStudentId,
  setSelectedStudentId,
  onConfirm,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Manual Enrollment</DialogTitle>
      <DialogContent>
        <Autocomplete
          options={students}
          getOptionLabel={(option) => `${option.name} (${option.employee_id})`}
          value={students.find(s => s.id.toString() === selectedStudentId) || null}
          onChange={(event, newValue) => setSelectedStudentId(newValue?.id.toString() || '')}
          renderInput={(params) => (
            <TextField {...params} label="Select Student" placeholder="Search by name or employee ID" />
          )}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} variant="contained" disabled={!selectedStudentId}>
          Enroll
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ManualEnrollDialog;

