import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';

interface WithdrawDialogProps {
  open: boolean;
  onClose: () => void;
  withdrawalReason: string;
  setWithdrawalReason: React.Dispatch<React.SetStateAction<string>>;
  onConfirm: () => void;
}

function WithdrawDialog({
  open,
  onClose,
  withdrawalReason,
  setWithdrawalReason,
  onConfirm,
}: WithdrawDialogProps): React.ReactElement {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Withdraw Student</DialogTitle>
      <DialogContent>
        <TextField
          label="Withdrawal Reason"
          fullWidth
          multiline
          rows={3}
          value={withdrawalReason}
          onChange={(e) => setWithdrawalReason(e.target.value)}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} variant="contained" color="error">
          Withdraw
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default WithdrawDialog;

