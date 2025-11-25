import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  InputAdornment,
} from '@mui/material';

function EditMentorDialog({
  open,
  onClose,
  editingMentor,
  editMentorHours,
  setEditMentorHours,
  editMentorAmount,
  setEditMentorAmount,
  editMentorLoading,
  onConfirm,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Mentor Hours & Payment</DialogTitle>
      <DialogContent>
        {editingMentor && (
          <>
            <Typography variant="body1" sx={{ mt: 2, mb: 2, fontWeight: 500 }}>
              Mentor: {editingMentor.mentor?.name || 'Unknown'}
            </Typography>
            <TextField
              label="Hours Taught"
              type="number"
              fullWidth
              required
              value={editMentorHours}
              onChange={(e) => setEditMentorHours(e.target.value)}
              sx={{ mt: 2 }}
              InputProps={{
                inputProps: { min: 0, step: 0.01 },
              }}
            />
            <TextField
              label="Amount Paid"
              type="number"
              fullWidth
              required
              value={editMentorAmount}
              onChange={(e) => setEditMentorAmount(e.target.value)}
              sx={{ mt: 2 }}
              InputProps={{
                startAdornment: <InputAdornment position="start">Tk</InputAdornment>,
                inputProps: { min: 0, step: 0.01 },
              }}
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} variant="contained" disabled={editMentorLoading}>
          Update
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default EditMentorDialog;

