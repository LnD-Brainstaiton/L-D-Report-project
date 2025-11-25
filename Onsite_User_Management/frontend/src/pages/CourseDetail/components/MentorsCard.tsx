import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Theme,
  alpha,
} from '@mui/material';
import { Person, Add, Edit, Remove, AccessTime } from '@mui/icons-material';
import { getDisplayMentors } from '../utils/costCalculators';
import { Course, DraftMentorAssignment, Mentor, DraftMentorWithDetails } from '../../../types';

interface DisplayMentor {
  id?: number | string;
  mentor?: Mentor | null;
  mentor_id?: number;
  is_draft?: boolean;
  hours_taught?: number;
  amount_paid?: number | string;
  mentor_name?: string;
  is_internal?: boolean;
}

interface MentorsCardProps {
  course: Course | null;
  draftMentorsWithDetails: DraftMentorWithDetails[];
  onAssignInternal: () => void;
  onAddExternal: () => void;
  onEditMentor: (mentor: DisplayMentor) => void;
  onRemoveMentor: (id: number | string, mentorId: number) => void;
  theme: Theme;
}

function MentorsCard({
  course,
  draftMentorsWithDetails,
  onAssignInternal,
  onAddExternal,
  onEditMentor,
  onRemoveMentor,
  theme,
}: MentorsCardProps): React.ReactElement {
  const displayMentors = getDisplayMentors(course as any, draftMentorsWithDetails as any);

  return (
    <Card sx={{ mb: 3, border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2.5} flexWrap="wrap" gap={2}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Person color="primary" sx={{ fontSize: 24 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Assigned Mentors
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Button 
              variant="outlined" 
              size="small" 
              startIcon={<Add />}
              onClick={onAssignInternal}
            >
              Assign Internal
            </Button>
            <Button 
              variant="outlined" 
              size="small" 
              startIcon={<Add />}
              onClick={onAddExternal}
            >
              Add External
            </Button>
          </Box>
        </Box>
        <Divider sx={{ mb: 2.5 }} />
        
        {displayMentors.length > 0 ? (
          <TableContainer
            sx={{
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                  <TableCell sx={{ fontWeight: 600 }}>Mentor Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Hours Taught</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Amount Paid</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayMentors.map((cm) => (
                  <TableRow 
                    key={cm.id || `draft-${cm.mentor_id}`}
                    sx={{
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.03),
                      },
                      ...(cm.is_draft && {
                        backgroundColor: alpha(theme.palette.warning.main, 0.05),
                        borderLeft: `3px solid ${theme.palette.warning.main}`,
                      }),
                    }}
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Person fontSize="small" color="action" />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {cm.mentor?.name || 'Unknown'}
                        </Typography>
                        {cm.is_draft && (
                          <Chip 
                            label="Draft" 
                            size="small" 
                            color="warning"
                            sx={{ height: 20, fontSize: '0.65rem' }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={cm.mentor?.is_internal ? 'Internal' : 'External'}
                        size="small"
                        color={cm.mentor?.is_internal ? 'primary' : 'secondary'}
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <AccessTime fontSize="small" color="action" />
                        <Typography variant="body2">{cm.hours_taught}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Tk {parseFloat(String(cm.amount_paid || 0)).toFixed(2)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" gap={0.5} justifyContent="center">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => onEditMentor(cm as DisplayMentor)}
                          sx={{
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            },
                          }}
                          title="Edit hours and payment"
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => onRemoveMentor(cm.id || `draft-${cm.mentor_id}`, cm.mentor_id!)}
                          sx={{
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.error.main, 0.1),
                            },
                          }}
                          title={cm.is_draft ? "Remove from draft" : "Remove mentor"}
                        >
                          <Remove fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box
            sx={{
              p: 3,
              textAlign: 'center',
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.grey[500], 0.05),
              border: `1px dashed ${alpha(theme.palette.grey[500], 0.3)}`,
            }}
          >
            <Person sx={{ fontSize: 48, color: 'text.secondary', mb: 1, opacity: 0.5 }} />
            <Typography variant="body2" color="text.secondary">
              No mentors assigned yet
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default MentorsCard;

