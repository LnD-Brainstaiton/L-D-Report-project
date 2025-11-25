import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';

function OnlineEnrollmentTable({ enrollments, onViewDetails }) {
  const theme = useTheme();
  
  // Determine row color based on completion status
  const getRowBackgroundColor = (enrollment) => {
    if (enrollment.progress >= 100 || enrollment.completion_status === 'Completed') {
      return alpha(theme.palette.success.main, 0.08); // Green for completed
    } else if (enrollment.progress > 0 && enrollment.progress < 100) {
      return alpha(theme.palette.warning.main, 0.08); // Orange for in progress
    } else {
      return alpha(theme.palette.grey[500], 0.05); // Neutral grey for not started
    }
  };
  
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ background: 'linear-gradient(135deg, rgba(30, 64, 175, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)' }}>
            <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem' }}>Employee ID</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem' }}>Name</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem' }}>Date Assigned</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem' }}>Last Access</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem' }} align="right">Progress</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {enrollments.map((enrollment) => (
            <TableRow
              key={enrollment.id}
              sx={{
                backgroundColor: getRowBackgroundColor(enrollment),
                borderBottom: '1px solid rgba(30, 64, 175, 0.08)',
                '&:hover': {
                  backgroundColor: (() => {
                    if (enrollment.progress >= 100 || enrollment.completion_status === 'Completed') {
                      return alpha(theme.palette.success.main, 0.12);
                    } else if (enrollment.progress > 0 && enrollment.progress < 100) {
                      return alpha(theme.palette.warning.main, 0.12);
                    } else {
                      return alpha(theme.palette.grey[500], 0.08);
                    }
                  })(),
                },
              }}
            >
              <TableCell 
                sx={{ 
                  fontWeight: 500, 
                  color: '#1e3a8a',
                  cursor: onViewDetails ? 'pointer' : 'default',
                  '&:hover': onViewDetails ? {
                    color: theme.palette.primary.main,
                    textDecoration: 'underline'
                  } : {}
                }}
                onClick={onViewDetails ? () => onViewDetails(enrollment) : undefined}
              >
                {enrollment.student_employee_id}
              </TableCell>
              <TableCell sx={{ color: '#475569', fontWeight: 500 }}>{enrollment.student_name}</TableCell>
              <TableCell sx={{ color: '#64748b' }}>
                {enrollment.date_assigned 
                  ? new Date(enrollment.date_assigned * 1000).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })
                  : 'N/A'}
              </TableCell>
              <TableCell sx={{ color: '#64748b' }}>
                {enrollment.lastaccess 
                  ? new Date(enrollment.lastaccess * 1000).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'Never'}
              </TableCell>
              <TableCell align="right">
                <Chip
                  label={`${(enrollment.progress || 0).toFixed(1)}%`}
                  size="small"
                  sx={{
                    background: enrollment.progress >= 100 
                      ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
                      : enrollment.progress > 0
                      ? 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)'
                      : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                    color: enrollment.progress >= 100 
                      ? '#047857' 
                      : enrollment.progress > 0
                      ? '#c2410c'
                      : '#475569',
                    fontWeight: 600,
                  }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default OnlineEnrollmentTable;

