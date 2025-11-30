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
  Link,
} from '@mui/material';
import { Enrollment } from '../../../types';

interface OnlineEnrollmentTableProps {
  enrollments: Enrollment[];
  onViewDetails?: (enrollment: Enrollment) => void;
}

function OnlineEnrollmentTable({ enrollments, onViewDetails }: OnlineEnrollmentTableProps): React.ReactElement {
  const theme = useTheme();

  // Determine row color based on completion status
  const getRowBackgroundColor = (enrollment: Enrollment): string => {
    const progress = enrollment.progress || 0;
    if (progress >= 100 || enrollment.completion_status === 'Completed') {
      return alpha(theme.palette.success.main, 0.08); // Green for completed
    } else if (progress > 0 && progress < 100) {
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
            <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', width: 100 }}>Employee ID</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', width: 180 }}>Name</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', width: 220 }}>Email</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', width: 120 }}>SBU</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', width: 180 }}>PM Name</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', width: 220 }}>PM Email</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', width: 120 }}>Date Assigned</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', width: 150 }}>Last Access</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', width: 100 }} align="right">Progress</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {enrollments.map((enrollment) => {
            const progress = enrollment.progress || 0;
            const enrollmentAny = enrollment as any;
            return (
              <TableRow
                key={enrollment.id}
                sx={{
                  backgroundColor: getRowBackgroundColor(enrollment),
                  borderBottom: '1px solid rgba(30, 64, 175, 0.08)',
                  '&:hover': {
                    backgroundColor: (() => {
                      if (progress >= 100 || enrollment.completion_status === 'Completed') {
                        return alpha(theme.palette.success.main, 0.12);
                      } else if (progress > 0 && progress < 100) {
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
                    whiteSpace: 'nowrap',
                    '&:hover': onViewDetails ? {
                      color: theme.palette.primary.main,
                      textDecoration: 'underline'
                    } : {}
                  }}
                  onClick={onViewDetails ? () => onViewDetails(enrollment) : undefined}
                >
                  {enrollment.student_employee_id}
                </TableCell>
                <TableCell sx={{ color: '#475569', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }} title={enrollment.student_name}>
                  {enrollment.student_name}
                </TableCell>
                <TableCell sx={{ color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220, fontSize: '0.75rem' }} title={enrollment.student_email || 'N/A'}>
                  {enrollment.student_email ? (
                    <Link href={`mailto:${enrollment.student_email}`} color="inherit" underline="hover">
                      {enrollment.student_email}
                    </Link>
                  ) : 'N/A'}
                </TableCell>
                <TableCell sx={{ maxWidth: 120, fontSize: '0.65rem' }}>
                  <Chip
                    label={enrollmentAny.sbu_name || enrollment.student_department || 'N/A'}
                    size="small"
                    sx={{ maxWidth: '100%' }}
                  />
                </TableCell>
                <TableCell sx={{ color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180, fontSize: '0.58rem' }} title={enrollmentAny.reporting_manager_name || 'N/A'}>
                  {enrollmentAny.reporting_manager_name || 'N/A'}
                </TableCell>
                <TableCell sx={{ color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220, fontSize: '0.65rem' }} title={enrollmentAny.reporting_manager_email || 'N/A'}>
                  {enrollmentAny.reporting_manager_email ? (
                    <Link href={`mailto:${enrollmentAny.reporting_manager_email}`} color="inherit" underline="hover">
                      {enrollmentAny.reporting_manager_email}
                    </Link>
                  ) : 'N/A'}
                </TableCell>
                <TableCell sx={{ color: '#64748b', fontSize: '0.65rem' }}>
                  {enrollment.date_assigned
                    ? new Date((enrollment.date_assigned as number) * 1000).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })
                    : 'N/A'}
                </TableCell>
                <TableCell sx={{ color: '#64748b', fontSize: '0.65rem' }}>
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
                    label={`${progress.toFixed(1)}%`}
                    size="small"
                    sx={{
                      background: progress >= 100
                        ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
                        : progress > 0
                          ? 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)'
                          : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                      color: progress >= 100
                        ? '#047857'
                        : progress > 0
                          ? '#c2410c'
                          : '#475569',
                      fontWeight: 600,
                    }}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default OnlineEnrollmentTable;

