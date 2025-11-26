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
  Button,
  alpha,
} from '@mui/material';
import { PersonAdd } from '@mui/icons-material';
import { formatDateForDisplay } from '../../../utils/dateUtils';
import type { Student } from '../../../types';

interface StudentWithEnrollments extends Student {
  never_taken_course?: boolean;
  enrollments?: any[];
}

interface EmployeeTableProps {
  users: StudentWithEnrollments[];
  onRestore: (user: StudentWithEnrollments) => void;
  onViewDetails?: (user: StudentWithEnrollments) => void;
}

const EmployeeTable: React.FC<EmployeeTableProps> = ({ users: rawUsers, onRestore, onViewDetails }) => {
  // Deduplicate by employee_id (case-insensitive)
  const users = rawUsers.reduce((acc: StudentWithEnrollments[], user) => {
    const normalizedId = user.employee_id?.toLowerCase();
    if (!acc.some(u => u.employee_id?.toLowerCase() === normalizedId)) {
      acc.push(user);
    }
    return acc;
  }, []);
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
        <Table sx={{ tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow
              sx={{
                background: 'linear-gradient(135deg, rgba(30, 64, 175, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)',
              }}
            >
              <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', width: 80 }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', width: 150 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', width: 200 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', width: 100 }}>SBU</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', width: 180 }}>Designation</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#b91c1c', fontSize: '0.9rem', width: 110 }}>Leaving Date</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', width: 120 }} align="center">Course History</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', width: 100 }} align="center">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user.id}
                sx={{
                  borderBottom: '1px solid rgba(30, 64, 175, 0.08)',
                  '&:hover': {
                    background: 'linear-gradient(90deg, rgba(30, 64, 175, 0.03) 0%, rgba(5, 150, 105, 0.03) 100%)',
                  },
                  backgroundColor: user.never_taken_course ? alpha('#f59e0b', 0.03) : 'transparent',
                }}
              >
                <TableCell>
                  <Typography
                    component="span"
                    onClick={() => onViewDetails?.(user)}
                    sx={{
                      color: '#1e40af',
                      fontWeight: 600,
                      cursor: 'pointer',
                      '&:hover': {
                        textDecoration: 'underline',
                        color: '#1e3a8a',
                      },
                    }}
                  >
                    {user.employee_id?.toUpperCase()}
                  </Typography>
                </TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#1e3a8a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</TableCell>
                <TableCell sx={{ color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={user.email}>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    label={user.department}
                    size="small"
                    sx={{
                      background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                      color: '#1e40af',
                      fontWeight: 600,
                    }}
                  />
                </TableCell>
                <TableCell>
                  {user.designation ? (
                    <Chip 
                      label={user.designation} 
                      size="small" 
                      sx={{ background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)', color: '#6d28d9', fontWeight: 600 }} 
                    />
                  ) : (
                    <Chip label="N/A" size="small" sx={{ background: '#f1f5f9', color: '#94a3b8', fontWeight: 500 }} />
                  )}
                </TableCell>
                <TableCell>
                  {user.exit_date ? (
                    <Typography variant="body2" sx={{ color: '#991b1b', fontWeight: 500 }}>
                      {formatDateForDisplay(user.exit_date)}
                    </Typography>
                  ) : (
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      N/A
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="center">
                  {user.enrollments && user.enrollments.length > 0 ? (
                    <Chip 
                      label={`${user.enrollments.length} courses`} 
                      size="small" 
                      sx={{ background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', color: '#047857', fontWeight: 600 }} 
                    />
                  ) : (
                    <Chip label="No History" size="small" sx={{ background: alpha('#fbbf24', 0.1), color: '#92400e', fontWeight: 500, border: `1px solid ${alpha('#fbbf24', 0.3)}` }} />
                  )}
                </TableCell>
                <TableCell align="center">
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<PersonAdd />}
                    sx={{
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      borderRadius: '6px',
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      px: 2,
                    }}
                    onClick={() => onRestore(user)}
                  >
                    Restore
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};

export default EmployeeTable;
