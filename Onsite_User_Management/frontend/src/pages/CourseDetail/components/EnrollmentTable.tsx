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
          <TableRow>
            <TableCell>Employee ID</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Department</TableCell>
            {showEligibilityReason && <TableCell>Eligibility Reason</TableCell>}
            <TableCell>Status</TableCell>
            <TableCell>Score</TableCell>
            <TableCell>Attendance</TableCell>
            {showActions && <TableCell>{actionsHeaderText}</TableCell>}
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
                  '&:hover': onViewDetails ? {
                    textDecoration: 'underline',
                    color: theme.palette.primary.dark
                  } : {}
                }}
                onClick={onViewDetails ? () => onViewDetails(enrollment) : undefined}
              >
                {enrollment.student_employee_id}
              </TableCell>
              <TableCell>{enrollment.student_name}</TableCell>
              <TableCell>{enrollment.student_email}</TableCell>
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

