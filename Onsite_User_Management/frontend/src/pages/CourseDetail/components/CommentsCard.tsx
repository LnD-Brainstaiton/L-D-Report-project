import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Theme,
  alpha,
} from '@mui/material';
import { Comment as CommentIcon, Add } from '@mui/icons-material';
import { formatDateTimeForDisplay } from '../../../utils/dateUtils';
import { Comment } from '../../../types';

interface CommentsCardProps {
  comments: Comment[];
  onAddComment: () => void;
  theme: Theme;
}

function CommentsCard({ comments, onAddComment, theme }: CommentsCardProps): React.ReactElement {
  return (
    <Card sx={{ mb: 3, border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2.5}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <CommentIcon color="primary" sx={{ fontSize: 24 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Comment/Update History
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Add />}
            onClick={onAddComment}
          >
            Add Comment
          </Button>
        </Box>
        <Divider sx={{ mb: 2.5 }} />
        {comments.length > 0 ? (
          <List>
            {comments.map((comment) => (
              <ListItem
                key={comment.id}
                sx={{
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  py: 2,
                }}
              >
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {comment.created_by}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDateTimeForDisplay(comment.created_at)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {comment.comment_text}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            No comments yet. Add the first comment to track updates.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default CommentsCard;

