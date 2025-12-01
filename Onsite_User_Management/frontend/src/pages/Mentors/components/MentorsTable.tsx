import React from 'react';
import {
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  IconButton,
  Box,
  Button,
  alpha,
} from '@mui/material';
import { Visibility, PersonRemove } from '@mui/icons-material';
import type { Mentor } from '../../../types';

interface MentorsTableProps {
  mentors: Mentor[];
  onViewDetails: (mentor: Mentor) => void;
  onViewStats: (mentorId: number) => void;
  onRemove: (mentor: Mentor) => void;
}

const MentorsTable: React.FC<MentorsTableProps> = ({ mentors, onViewDetails, onViewStats, onRemove }) => {
  return (
    <Card
      sx={{
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(30, 64, 175, 0.1)',
        overflow: 'hidden',
        background: '#ffffff',
      }}
    >
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow
              sx={{
                background: 'linear-gradient(135deg, rgba(30, 64, 175, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)',
              }}
            >
              <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem' }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem' }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem' }}>SBU</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem' }}>Course History</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem' }} align="center">Remove</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mentors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">No mentors found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              mentors.map((mentor) => (
                <TableRow
                  key={mentor.id}
                  sx={{
                    borderBottom: '1px solid rgba(30, 64, 175, 0.08)',
                    '&:hover': {
                      background: 'linear-gradient(90deg, rgba(30, 64, 175, 0.03) 0%, rgba(5, 150, 105, 0.03) 100%)',
                    },
                  }}
                >
                  <TableCell>
                    {mentor.student?.employee_id ? (
                      <Typography
                        sx={{
                          cursor: 'pointer',
                          color: '#1e40af',
                          fontWeight: 600,
                          textDecoration: 'underline',
                          '&:hover': { color: '#1e3a8a' },
                        }}
                        onClick={() => onViewDetails(mentor)}
                      >
                        {mentor.student.employee_id}
                      </Typography>
                    ) : (
                      <Typography sx={{ color: '#64748b' }}>
                        {mentor.external_id ? mentor.external_id : mentor.id}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography
                      sx={{
                        cursor: mentor.is_internal ? 'pointer' : 'default',
                        fontWeight: 500,
                        color: '#1e3a8a',
                        textDecoration: mentor.is_internal ? 'underline' : 'none',
                        '&:hover': mentor.is_internal ? { color: '#1e40af' } : {},
                      }}
                      onClick={() => mentor.is_internal && onViewDetails(mentor)}
                    >
                      {mentor.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={mentor.is_internal ? 'Internal' : 'External'}
                      size="small"
                      sx={{
                        background: mentor.is_internal
                          ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
                          : 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
                        color: mentor.is_internal ? '#1e40af' : '#be185d',
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: '#64748b' }}>{mentor.email || '-'}</TableCell>
                  <TableCell>
                    {mentor.department ? (
                      <Chip
                        label={mentor.department}
                        size="small"
                        sx={{
                          background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                          color: '#047857',
                          fontWeight: 600,
                        }}
                      />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {mentor.course_count && mentor.course_count > 0 ? (
                      <IconButton
                        size="small"
                        onClick={() => onViewStats(mentor.id)}
                        title="View Course History"
                        sx={{ color: '#1e40af' }}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    ) : (
                      <Chip
                        label="No Course History"
                        size="small"
                        sx={{
                          background: alpha('#fbbf24', 0.1),
                          color: '#92400e',
                          fontWeight: 500,
                          border: `1px solid ${alpha('#fbbf24', 0.3)}`,
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<PersonRemove sx={{ fontSize: '1rem' }} />}
                      onClick={() => onRemove(mentor)}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        py: 0.5,
                        px: 1.5,
                        borderRadius: '6px',
                      }}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};

export default MentorsTable;

