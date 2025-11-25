import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';

interface CommentDialogProps {
  open: boolean;
  onClose: () => void;
  newComment: string;
  setNewComment: React.Dispatch<React.SetStateAction<string>>;
  onConfirm: () => void;
}

function CommentDialog({
  open,
  onClose,
  newComment,
  setNewComment,
  onConfirm,
}: CommentDialogProps): React.ReactElement {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Comment/Update</DialogTitle>
      <DialogContent>
        <TextField
          label="Comment"
          multiline
          rows={4}
          fullWidth
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          sx={{ mt: 2 }}
          placeholder="Add a comment or update about this course..."
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} variant="contained">
          Add Comment
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CommentDialog;

