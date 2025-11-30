import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Box,
  Typography,
  useTheme,
  Link,
} from '@mui/material';
import { CheckCircle, Cancel, PersonRemove, Refresh, Edit } from '@mui/icons-material';
import { Enrollment } from '../../../types';

interface EnrollmentTableProps {
  enrollments: Enrollment[];
  onViewDetails?: (enrollment: Enrollment) => void;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
  onWithdraw?: (enrollment: Enrollment) => void;
  onReapprove?: (id: number) => void;
  onEditAttendance?: (enrollment: Enrollment) => void;
  showEligibilityReason?: boolean;
  showActions?: boolean;
  actionsHeaderText?: string;
}

function EnrollmentTable({
  enrollments,
  onViewDetails,
  onApprove,
  onReject,
  onWithdraw,
  onReapprove,
  onEditAttendance,
  showEligibilityReason = false,
  showActions = false,
  actionsHeaderText = 'Actions'
}: EnrollmentTableProps): React.ReactElement {
  const theme = useTheme();

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ background: 'linear-gradient(135deg, rgba(30, 64, 175, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)' }}>
            <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', width: 100 }}>Employee ID</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', width: 160 }}>Name</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', width: 200 }}>Email</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', width: 120 }}>SBU</TableCell>
            {showEligibilityReason && <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', width: 200 }}>Eligibility Reason</TableCell>}
            <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', width: 120 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', width: 80 }}>Score</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', width: 100 }}>Attendance</TableCell>
            {showActions && <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', width: 120 }}>{actionsHeaderText}</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {enrollments.map((enrollment) => (
            <TableRow key={enrollment.id}>
              <TableCell
                sx={{
                  cursor: onViewDetails ? 'pointer' : 'default',
                  color: onViewDetails ? theme.palette.primary.main : 'inherit',
                  fontWeight: onViewDetails ? 500 : 400,
                  whiteSpace: 'nowrap',
                  '&:hover': onViewDetails ? {
                    textDecoration: 'underline',
                    color: theme.palette.primary.dark
                  } : {}
                }}
                onClick={onViewDetails ? () => onViewDetails(enrollment) : undefined}
              >
                {enrollment.student_employee_id}
              </TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }} title={enrollment.student_name}>
                {enrollment.student_name}
              </TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200, fontSize: '0.65rem' }} title={enrollment.student_email}>
                {enrollment.student_email ? (
                  <Link href={`mailto:${enrollment.student_email}`} color="inherit" underline="hover" sx={{ fontSize: 'inherit' }}>
                    {enrollment.student_email}
                  </Link>
                ) : ''}
              </TableCell>
              <TableCell>
                <Chip label={enrollment.student_department} size="small" />
              </TableCell>
              {showEligibilityReason && (
                <TableCell>
                  <Typography variant="body2" color="error">
                    {enrollment.eligibility_reason || enrollment.eligibility_status}
                  </Typography>
                </TableCell>
              )}
              <TableCell>
                <Chip
                  label={enrollment.completion_status || enrollment.approval_status}
                  size="small"
                  color={
                    enrollment.completion_status === 'Completed' ? 'success' :
                      enrollment.completion_status === 'Failed' ? 'error' :
                        enrollment.approval_status === 'Approved' ? 'success' :
                          enrollment.approval_status === 'Pending' ? 'warning' :
                            'default'
                  }
                />
              </TableCell>
              <TableCell>{enrollment.score || '-'}</TableCell>
              <TableCell>
                {enrollment.attendance_percentage !== null && enrollment.attendance_percentage !== undefined
                  ? `${enrollment.attendance_percentage.toFixed(1)}%`
                  : enrollment.attendance_status || '-'}
              </TableCell>
              {showActions && (
                <TableCell>
                  <Box display="flex" gap={0.5}>
                    {onApprove && (
                      <IconButton size="small" color="success" onClick={() => onApprove(enrollment.id)}>
                        <CheckCircle fontSize="small" />
                      </IconButton>
                    )}
                    {onReject && (
                      <IconButton size="small" color="error" onClick={() => onReject(enrollment.id)}>
                        <Cancel fontSize="small" />
                      </IconButton>
                    )}
                    {onWithdraw && (
                      <IconButton size="small" color="error" onClick={() => onWithdraw(enrollment)}>
                        <PersonRemove fontSize="small" />
                      </IconButton>
                    )}
                    {onReapprove && (
                      <IconButton size="small" color="success" onClick={() => onReapprove(enrollment.id)}>
                        <Refresh fontSize="small" />
                      </IconButton>
                    )}
                    {onEditAttendance && (
                      <IconButton size="small" color="primary" onClick={() => onEditAttendance(enrollment)}>
                        <Edit fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default EnrollmentTable;

