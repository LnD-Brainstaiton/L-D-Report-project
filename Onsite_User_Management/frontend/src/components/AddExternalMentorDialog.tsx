import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import { mentorsAPI } from '../services/api';

interface ExternalMentorData {
  name: string;
  email: string;
  company: string;
  designation: string;
  specialty: string;
  hours_taught: string;
  amount_paid: string;
}

interface MentorAssignment {
  mentor_id: number;
  hours_taught: number;
  amount_paid: number;
}

interface AddExternalMentorDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (assignment: MentorAssignment) => Promise<void>;
  isDraft?: boolean;
}

const initialFormState: ExternalMentorData = {
  name: '',
  email: '',
  company: '',
  designation: '',
  specialty: '',
  hours_taught: '',
  amount_paid: '',
};

const AddExternalMentorDialog: React.FC<AddExternalMentorDialogProps> = ({
  open,
  onClose,
  onAdd,
  isDraft = false,
}) => {
  const [externalMentorData, setExternalMentorData] = useState<ExternalMentorData>(initialFormState);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setExternalMentorData(initialFormState);
    }
  }, [open]);

  const handleAdd = async () => {
    if (!externalMentorData.name?.trim()) return;
    if (!externalMentorData.hours_taught || parseFloat(externalMentorData.hours_taught) < 0) return;
    if (!externalMentorData.amount_paid || parseFloat(externalMentorData.amount_paid) < 0) return;

    setLoading(true);
    try {
      const payload: Record<string, any> = {
        is_internal: false,
        name: externalMentorData.name.trim(),
        student_id: null,
      };

      if (externalMentorData.email?.trim()) {
        payload.email = externalMentorData.email.trim();
      }
      if (externalMentorData.company?.trim()) {
        payload.company = externalMentorData.company.trim();
      }
      if (externalMentorData.designation?.trim()) {
        payload.designation = externalMentorData.designation.trim();
      }
      if (externalMentorData.specialty?.trim()) {
        payload.specialty = externalMentorData.specialty.trim();
      }

      const response = await mentorsAPI.createExternal(payload as any);
      const mentorId = response.data.id;
      const hoursTaught = parseFloat(externalMentorData.hours_taught) || 0;
      const amountPaid = parseFloat(externalMentorData.amount_paid) || 0;

      await onAdd({
        mentor_id: mentorId,
        hours_taught: hoursTaught,
        amount_paid: amountPaid,
      });

      setExternalMentorData(initialFormState);
      onClose();
    } catch (error) {
      console.error('Error adding external mentor:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setExternalMentorData(initialFormState);
    onClose();
  };

  const isValid =
    externalMentorData.name?.trim() &&
    externalMentorData.hours_taught &&
    parseFloat(externalMentorData.hours_taught) >= 0 &&
    externalMentorData.amount_paid &&
    parseFloat(externalMentorData.amount_paid) >= 0;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add External Mentor</DialogTitle>
      <DialogContent>
        <TextField
          label="Name"
          fullWidth
          required
          value={externalMentorData.name}
          onChange={(e) => setExternalMentorData({ ...externalMentorData, name: e.target.value })}
          sx={{ mt: 2 }}
        />
        <TextField
          label="Email"
          type="email"
          fullWidth
          value={externalMentorData.email}
          onChange={(e) => setExternalMentorData({ ...externalMentorData, email: e.target.value })}
          sx={{ mt: 2 }}
        />
        <TextField
          label="Company"
          fullWidth
          value={externalMentorData.company}
          onChange={(e) => setExternalMentorData({ ...externalMentorData, company: e.target.value })}
          sx={{ mt: 2 }}
        />
        <TextField
          label="Designation"
          fullWidth
          value={externalMentorData.designation}
          onChange={(e) => setExternalMentorData({ ...externalMentorData, designation: e.target.value })}
          sx={{ mt: 2 }}
        />
        <TextField
          label="Specialty"
          fullWidth
          value={externalMentorData.specialty}
          onChange={(e) => setExternalMentorData({ ...externalMentorData, specialty: e.target.value })}
          sx={{ mt: 2 }}
        />
        <TextField
          label="Hours Taught"
          type="number"
          fullWidth
          required
          value={externalMentorData.hours_taught}
          onChange={(e) => setExternalMentorData({ ...externalMentorData, hours_taught: e.target.value })}
          sx={{ mt: 2 }}
          inputProps={{ min: 0, step: 0.01 }}
        />
        <TextField
          label="Amount Paid"
          type="number"
          fullWidth
          required
          value={externalMentorData.amount_paid}
          onChange={(e) => setExternalMentorData({ ...externalMentorData, amount_paid: e.target.value })}
          sx={{ mt: 2 }}
          InputProps={{
            startAdornment: <InputAdornment position="start">Tk</InputAdornment>,
          }}
          inputProps={{ min: 0, step: 0.01 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} sx={{ textTransform: 'uppercase' }}>
          Cancel
        </Button>
        <Button
          onClick={handleAdd}
          variant="contained"
          disabled={loading || !isValid}
          sx={{ textTransform: 'uppercase' }}
        >
          {loading ? <CircularProgress size={20} /> : 'Create & Assign'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddExternalMentorDialog;

