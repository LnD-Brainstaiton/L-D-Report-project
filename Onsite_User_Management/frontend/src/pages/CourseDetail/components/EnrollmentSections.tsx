import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Theme,
  alpha,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
} from '@mui/material';
import { Search, FilterList, Clear } from '@mui/icons-material';
import OnlineEnrollmentTable from './OnlineEnrollmentTable';
import EnrollmentTable from './EnrollmentTable';
import { filterOnlineEnrollments, filterOnsiteEnrollments } from '../utils/enrollmentFilters';
import { Enrollment } from '../../../types';

interface EnrollmentSectionsProps {
  enrollments: Enrollment[];
  loadingEnrollments: boolean;
  isOnlineCourse: boolean;
  onViewDetails?: (enrollment: Enrollment) => void;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
  onWithdraw?: (enrollment: Enrollment) => void;
  onReapprove?: (id: number) => void;
  onEditAttendance?: (enrollment: Enrollment) => void;
  theme: Theme;
}

function EnrollmentSections({
  enrollments,
  loadingEnrollments,
  isOnlineCourse,
  onViewDetails,
  onApprove,
  onReject,
  onWithdraw,
  onReapprove,
  onEditAttendance,
  theme,
}: EnrollmentSectionsProps): React.ReactElement {
  // Search and filter state
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in_progress' | 'not_started'>('all');

  // Filter enrollments based on search and status
  const filteredEnrollments = useMemo(() => {
    let filtered = [...enrollments];
    
    // Apply employee search filter
    if (employeeSearch.trim()) {
      const searchLower = employeeSearch.toLowerCase().trim();
      filtered = filtered.filter((enrollment) => {
        const name = enrollment.student_name?.toLowerCase() || '';
        const email = enrollment.student_email?.toLowerCase() || '';
        const employeeId = enrollment.student_employee_id?.toLowerCase() || '';
        return name.includes(searchLower) || email.includes(searchLower) || employeeId.includes(searchLower);
      });
    }
    
    return filtered;
  }, [enrollments, employeeSearch]);

  // Apply status filter for online courses
  const getFilteredOnlineEnrollments = useMemo(() => {
    if (!isOnlineCourse) return { completed: [], inProgress: [], notStarted: [] };
    
    const { completed, inProgress, notStarted } = filterOnlineEnrollments(filteredEnrollments);
    
    if (statusFilter === 'completed') {
      return { completed, inProgress: [], notStarted: [] };
    } else if (statusFilter === 'in_progress') {
      return { completed: [], inProgress, notStarted: [] };
    } else if (statusFilter === 'not_started') {
      return { completed: [], inProgress: [], notStarted };
    }
    
    return { completed, inProgress, notStarted };
  }, [filteredEnrollments, isOnlineCourse, statusFilter]);

  const clearFilters = () => {
    setEmployeeSearch('');
    setStatusFilter('all');
  };

  const hasActiveFilters = employeeSearch.trim() || statusFilter !== 'all';

  if (loadingEnrollments) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (isOnlineCourse) {
    const { completed, inProgress, notStarted } = getFilteredOnlineEnrollments;

    return (
      <>
        {/* Search and Filter Section */}
        <Card sx={{ mb: 3, p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterList /> Search & Filter Enrollments
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            {/* Employee Search */}
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name, email, or employee ID..."
              value={employeeSearch}
              onChange={(e) => setEmployeeSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                maxWidth: { md: 400 },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />
            
            {/* Status Filter */}
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Completion Status</InputLabel>
              <Select
                value={statusFilter}
                label="Completion Status"
                onChange={(e) => setStatusFilter(e.target.value as any)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="completed">
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip size="small" label="Completed" color="success" sx={{ height: 20 }} />
                  </Box>
                </MenuItem>
                <MenuItem value="in_progress">
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip size="small" label="In Progress" color="warning" sx={{ height: 20 }} />
                  </Box>
                </MenuItem>
                <MenuItem value="not_started">
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip size="small" label="Not Started" sx={{ height: 20, bgcolor: 'grey.300' }} />
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
            
            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Chip
                label="Clear Filters"
                onDelete={clearFilters}
                deleteIcon={<Clear />}
                color="primary"
                variant="outlined"
                sx={{ cursor: 'pointer' }}
              />
            )}
          </Stack>
          
          {/* Results Summary */}
          <Box mt={2} display="flex" gap={2} flexWrap="wrap">
            <Typography variant="body2" color="text.secondary">
              Showing: {completed.length + inProgress.length + notStarted.length} of {enrollments.length} enrollments
            </Typography>
            {hasActiveFilters && (
              <Typography variant="body2" color="primary.main" sx={{ fontWeight: 500 }}>
                {employeeSearch && `Search: "${employeeSearch}"`}
                {employeeSearch && statusFilter !== 'all' && ' • '}
                {statusFilter !== 'all' && `Status: ${statusFilter.replace('_', ' ')}`}
              </Typography>
            )}
          </Box>
        </Card>

        {/* Completed Students */}
        {completed.length > 0 && (
          <Card sx={{ 
            mb: 3,
            borderLeft: `4px solid ${theme.palette.success.main}`,
            backgroundColor: alpha(theme.palette.success.main, 0.05),
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: theme.palette.success.main }}>
                Completed ({completed.length})
              </Typography>
              <OnlineEnrollmentTable 
                enrollments={completed}
                onViewDetails={onViewDetails}
              />
            </CardContent>
          </Card>
        )}

        {/* In Progress Students */}
        {inProgress.length > 0 && (
          <Card sx={{ 
            mb: 3,
            borderLeft: `4px solid ${theme.palette.warning.main}`,
            backgroundColor: alpha(theme.palette.warning.main, 0.05),
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: theme.palette.warning.main }}>
                In Progress ({inProgress.length})
              </Typography>
              <OnlineEnrollmentTable 
                enrollments={inProgress}
                onViewDetails={onViewDetails}
              />
            </CardContent>
          </Card>
        )}

        {/* Not Started Students */}
        {notStarted.length > 0 && (
          <Card sx={{ 
            mb: 3,
            borderLeft: `4px solid ${theme.palette.grey[500]}`,
            backgroundColor: alpha(theme.palette.grey[500], 0.05),
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: theme.palette.grey[700] }}>
                Not Started ({notStarted.length})
              </Typography>
              <OnlineEnrollmentTable 
                enrollments={notStarted}
                onViewDetails={onViewDetails}
              />
            </CardContent>
          </Card>
        )}

        {completed.length === 0 && inProgress.length === 0 && notStarted.length === 0 && (
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" align="center" py={3}>
                {hasActiveFilters 
                  ? 'No students match your search criteria. Try adjusting the filters.'
                  : 'No students enrolled in this online course yet.'}
              </Typography>
            </CardContent>
          </Card>
        )}
      </>
    );
  }

  // Onsite course enrollments - apply employee search filter
  const { approved, eligiblePending, notEligible, rejected, withdrawn } = filterOnsiteEnrollments(filteredEnrollments);

  return (
    <>
      {/* Search Section for Onsite Courses */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterList /> Search Enrollments
        </Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          {/* Employee Search */}
          <TextField
            fullWidth
            size="small"
            placeholder="Search by name, email, or employee ID..."
            value={employeeSearch}
            onChange={(e) => setEmployeeSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              maxWidth: { md: 400 },
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
          
          {/* Clear Filters Button */}
          {employeeSearch.trim() && (
            <Chip
              label="Clear Search"
              onDelete={() => setEmployeeSearch('')}
              deleteIcon={<Clear />}
              color="primary"
              variant="outlined"
              sx={{ cursor: 'pointer' }}
            />
          )}
        </Stack>
        
        {/* Results Summary */}
        {employeeSearch.trim() && (
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              Showing: {approved.length + eligiblePending.length + notEligible.length + rejected.length + withdrawn.length} of {enrollments.length} enrollments
            </Typography>
            <Typography variant="body2" color="primary.main" sx={{ fontWeight: 500 }}>
              Search: "{employeeSearch}"
            </Typography>
          </Box>
        )}
      </Card>

      {/* Approved/Enrolled Students */}
      {approved.length > 0 && (
        <Card sx={{ 
          mb: 3,
          borderLeft: `4px solid ${theme.palette.primary.main}`,
          backgroundColor: alpha(theme.palette.primary.main, 0.02),
        }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: theme.palette.primary.main }}>
              Approved/Enrolled Students ({approved.length})
            </Typography>
            <EnrollmentTable
              enrollments={approved}
              onViewDetails={onViewDetails}
              onEditAttendance={onEditAttendance}
              onWithdraw={onWithdraw}
              showActions={true}
            />
          </CardContent>
        </Card>
      )}

      {/* Eligible Pending */}
      {eligiblePending.length > 0 && (
        <Card sx={{ 
          mb: 3,
          borderLeft: `4px solid ${theme.palette.success.main}`,
          backgroundColor: alpha(theme.palette.success.main, 0.02),
        }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: theme.palette.success.main }}>
              Eligible Enrollments (Pending) ({eligiblePending.length})
            </Typography>
            <EnrollmentTable
              enrollments={eligiblePending}
              onViewDetails={onViewDetails}
              onApprove={onApprove}
              onReject={onReject}
              showActions={true}
            />
          </CardContent>
        </Card>
      )}

      {/* Not Eligible */}
      {notEligible.length > 0 && (
        <Card sx={{ 
          mb: 3,
          borderLeft: `4px solid ${theme.palette.error.main}`,
          backgroundColor: alpha(theme.palette.error.main, 0.02),
        }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: theme.palette.error.main }}>
              Not Eligible Enrollments ({notEligible.length})
            </Typography>
            <EnrollmentTable
              enrollments={notEligible}
              onViewDetails={onViewDetails}
              onApprove={onApprove}
              onReject={onReject}
              showEligibilityReason={true}
              showActions={true}
            />
          </CardContent>
        </Card>
      )}

      {/* Rejected */}
      {rejected.length > 0 && (
        <Card sx={{ 
          mb: 3,
          borderLeft: `4px solid ${theme.palette.error.main}`,
          backgroundColor: alpha(theme.palette.error.main, 0.02),
        }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: theme.palette.error.main }}>
              Rejected Enrollments ({rejected.length})
            </Typography>
            <EnrollmentTable
              enrollments={rejected}
              onViewDetails={onViewDetails}
              onReapprove={onReapprove}
              showActions={true}
              actionsHeaderText="Add"
            />
          </CardContent>
        </Card>
      )}

      {/* Withdrawn */}
      {withdrawn.length > 0 && (
        <Card sx={{ 
          mb: 3,
          borderLeft: `4px solid ${theme.palette.warning.main}`,
          backgroundColor: alpha(theme.palette.warning.main, 0.02),
        }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: theme.palette.warning.main }}>
              Withdrawn Students ({withdrawn.length})
            </Typography>
            <EnrollmentTable
              enrollments={withdrawn}
              onViewDetails={onViewDetails}
              onReapprove={onReapprove}
              showActions={true}
              actionsHeaderText="Add"
            />
          </CardContent>
        </Card>
      )}

      {approved.length === 0 && eligiblePending.length === 0 && notEligible.length === 0 && rejected.length === 0 && withdrawn.length === 0 && (
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary" align="center" py={3}>
              {employeeSearch.trim() 
                ? 'No students match your search criteria. Try adjusting the search.'
                : 'No enrollments yet. Use "Import Enrollments" or "Manual Enrollment" to add students.'}
            </Typography>
          </CardContent>
        </Card>
      )}
    </>
  );
}

export default EnrollmentSections;

