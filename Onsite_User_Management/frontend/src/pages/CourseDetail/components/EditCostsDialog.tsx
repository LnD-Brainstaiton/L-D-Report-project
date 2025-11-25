import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Card,
  Divider,
  InputAdornment,
} from '@mui/material';

interface MentorCost {
  id: number | string;
  mentor_id: number;
  mentor_name: string;
  hours_taught: number | string;
  amount_paid: number | string;
}

interface EditCostsDialogProps {
  open: boolean;
  onClose: () => void;
  foodCost: string;
  setFoodCost: React.Dispatch<React.SetStateAction<string>>;
  otherCost: string;
  setOtherCost: React.Dispatch<React.SetStateAction<string>>;
  mentorCosts: MentorCost[];
  handleMentorCostChange: (index: number, field: 'hours_taught' | 'amount_paid', value: string) => void;
  editCostsLoading: boolean;
  onConfirm: () => void;
}

function EditCostsDialog({
  open,
  onClose,
  foodCost,
  setFoodCost,
  otherCost,
  setOtherCost,
  mentorCosts,
  handleMentorCostChange,
  editCostsLoading,
  onConfirm,
}: EditCostsDialogProps): React.ReactElement {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Course Costs</DialogTitle>
      <DialogContent>
        <Typography variant="h6" sx={{ fontWeight: 600, mt: 1, mb: 2 }}>
          Course Costs
        </Typography>
        <TextField
          label="Food Cost"
          type="number"
          fullWidth
          value={foodCost}
          onChange={(e) => setFoodCost(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: <InputAdornment position="start">Tk</InputAdornment>,
          }}
          inputProps={{ min: 0, step: 0.01 }}
        />
        <TextField
          label="Other Cost"
          type="number"
          fullWidth
          value={otherCost}
          onChange={(e) => setOtherCost(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: <InputAdornment position="start">Tk</InputAdornment>,
          }}
          inputProps={{ min: 0, step: 0.01 }}
        />

        <Divider sx={{ my: 3 }} />

        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Mentor Costs
          </Typography>
        </Box>
        
        {mentorCosts.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            No mentors assigned. Use "Assign Internal Mentor" or "Add External Mentor" buttons to add mentors.
          </Typography>
        ) : (
          <Box display="flex" flexDirection="column" gap={2} sx={{ mb: 2 }}>
            {mentorCosts.map((mc, index) => (
              <Card key={mc.id} variant="outlined" sx={{ p: 2 }}>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {mc.mentor_name}
                    </Typography>
                  </Box>
                  <Box display="flex" gap={2}>
                    <TextField
                      label="Hours Taught"
                      type="number"
                      fullWidth
                      value={mc.hours_taught}
                      onChange={(e) => handleMentorCostChange(index, 'hours_taught', e.target.value)}
                      size="small"
                      inputProps={{ min: 0, step: 0.1 }}
                    />
                    <TextField
                      label="Amount Paid"
                      type="number"
                      fullWidth
                      value={mc.amount_paid}
                      onChange={(e) => handleMentorCostChange(index, 'amount_paid', e.target.value)}
                      size="small"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">Tk</InputAdornment>,
                      }}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </Box>
                </Box>
              </Card>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} variant="contained" disabled={editCostsLoading}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default EditCostsDialog;

