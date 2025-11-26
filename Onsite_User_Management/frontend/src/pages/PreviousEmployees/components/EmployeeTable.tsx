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
  Collapse,
  Button,
  alpha,
  useTheme,
} from '@mui/material';
import { Visibility, PersonAdd } from '@mui/icons-material';
import { formatDateForDisplay } from '../../../utils/dateUtils';
import type { Student, Enrollment } from '../../../types';

interface StudentWithEnrollments extends Omit<Student, 'enrollments'> {
  never_taken_course?: boolean;
  enrollments?: EnrollmentWithCourse[];
}

interface EnrollmentWithCourse extends Omit<Enrollment, 'course'> {
  course?: {
    name?: string;
    batch_code?: string;
  };
  status?: string;
  completion_rate?: number;
}

interface EmployeeTableProps {
  users: StudentWithEnrollments[];
  expandedUser: number | null;
  onToggleExpand: (userId: number) => void;
  onRestore: (user: StudentWithEnrollments) => void;
}

const EmployeeTable: React.FC<EmployeeTableProps> = ({ users, expandedUser, onToggleExpand, onRestore }) => {
  const theme = useTheme();

  const getStatusColor = (status?: string): 'success' | 'info' | 'error' | 'default' => {
    if (status === 'Completed') return 'success';
    if (status === 'In Progress') return 'info';
    if (status === 'Withdrawn') return 'error';
    return 'default';
  };

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
              <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem' }}>Department</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem' }} align="center">
                Course History
              </TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem' }} align="center">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <React.Fragment key={user.id}>
                <TableRow
                  sx={{
                    borderBottom: '1px solid rgba(30, 64, 175, 0.08)',
                    '&:hover': {
                      background: 'linear-gradient(90deg, rgba(30, 64, 175, 0.03) 0%, rgba(5, 150, 105, 0.03) 100%)',
                    },
                    backgroundColor: user.never_taken_course ? alpha('#f59e0b', 0.03) : 'transparent',
                  }}
                >
                  <TableCell sx={{ color: '#1e40af', fontWeight: 600 }}>{user.employee_id}</TableCell>
                  <TableCell sx={{ fontWeight: 500, color: '#1e3a8a' }}>{user.name}</TableCell>
                  <TableCell sx={{ color: '#64748b' }}>{user.email}</TableCell>
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
                  <TableCell align="center">
                    {user.enrollments && user.enrollments.length > 0 ? (
                      <IconButton
                        size="small"
                        onClick={() => onToggleExpand(user.id)}
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
                <TableRow>
                  <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                    <Collapse in={expandedUser === user.id} timeout="auto" unmountOnExit>
                      <Box sx={{ margin: 2 }}>
                        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                          Course History
                        </Typography>
                        {user.enrollments && user.enrollments.length > 0 ? (
                          <Box display="flex" flexDirection="column" gap={2}>
                            {user.enrollments
                              .slice()
                              .sort((a: any, b: any) => {
                                // Sort by completion status priority, then by course name
                                const statusPriority = (status: string) => {
                                  if (status === 'COMPLETED' || status === 'Completed') return 1;
                                  if (status === 'IN_PROGRESS' || status === 'In Progress') return 2;
                                  if (status === 'NOT_STARTED' || status === 'Not Started') return 3;
                                  return 4;
                                };
                                const priorityA = statusPriority(a.completion_status || a.status || '');
                                const priorityB = statusPriority(b.completion_status || b.status || '');
                                if (priorityA !== priorityB) return priorityA - priorityB;
                                return (a.course_name || a.course?.name || '').localeCompare(b.course_name || b.course?.name || '');
                              })
                              .map((enrollment: any) => {
                                const courseName = enrollment.course_name || enrollment.course?.name || 'Unknown Course';
                                const batchCode = enrollment.batch_code || enrollment.course?.batch_code || 'N/A';
                                const courseType = enrollment.course_type || 'onsite';
                                const completionStatus = enrollment.completion_status || enrollment.status || 'Unknown';
                                
                                return (
                                  <Card
                                    key={enrollment.id || enrollment.course?.id}
                                    sx={{
                                      p: 2,
                                      backgroundColor: alpha(theme.palette.primary.main, 0.02),
                                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                                    }}
                                  >
                                    <Box display="flex" justifyContent="space-between" alignItems="start">
                                      <Box>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                          {courseName}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                          Batch: {batchCode}
                                        </Typography>
                                        {courseType && (
                                          <Chip 
                                            label={courseType.toUpperCase()} 
                                            size="small" 
                                            sx={{ 
                                              mt: 0.5, 
                                              fontSize: '0.7rem', 
                                              height: '20px',
                                              backgroundColor: courseType === 'online' ? alpha(theme.palette.info.main, 0.1) : alpha(theme.palette.primary.main, 0.1),
                                              color: courseType === 'online' ? theme.palette.info.main : theme.palette.primary.main,
                                            }} 
                                          />
                                        )}
                                        {enrollment.course_start_date && (
                                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                            Start Date: {formatDateForDisplay(enrollment.course_start_date)}
                                          </Typography>
                                        )}
                                        {enrollment.course_end_date && (
                                          <Typography variant="body2" color="text.secondary">
                                            Completion Date: {formatDateForDisplay(enrollment.course_end_date)}
                                          </Typography>
                                        )}
                                      </Box>
                                      <Box display="flex" flexDirection="column" alignItems="flex-end" gap={1}>
                                        <Chip
                                          label={completionStatus}
                                          color={getStatusColor(completionStatus)}
                                          size="small"
                                        />
                                        {courseType === 'online' && enrollment.progress !== null && enrollment.progress !== undefined && (
                                          <Typography variant="body2" color="text.secondary">
                                            Progress: {enrollment.progress.toFixed(1)}%
                                          </Typography>
                                        )}
                                        {enrollment.score !== null && enrollment.score !== undefined && (
                                          <Typography variant="body2" color="text.secondary">
                                            Score: {enrollment.score}
                                          </Typography>
                                        )}
                                      </Box>
                                    </Box>
                                  </Card>
                                );
                              })}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No course history available
                          </Typography>
                        )}
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};

export default EmployeeTable;

