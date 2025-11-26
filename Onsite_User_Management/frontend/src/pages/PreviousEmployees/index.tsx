import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  TextField,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  InputAdornment,
  Autocomplete,
  alpha,
  Chip,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import UserDetailsDialog from '../../components/UserDetailsDialog';
import { AlertMessage } from '../../components/common';
import { usePreviousEmployeesData } from './hooks/usePreviousEmployeesData';
import { useFilteredEmployees } from './utils/employeeFilters';
import EmployeeTable from './components/EmployeeTable';
import type { Student } from '../../types';

interface StudentWithEnrollments extends Student {
  never_taken_course?: boolean;
  enrollments?: any[];
}

const PreviousEmployees: React.FC = () => {
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [filterNeverTaken, setFilterNeverTaken] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSearchUser, setSelectedSearchUser] = useState<StudentWithEnrollments | null>(null);

  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedUserToRestore, setSelectedUserToRestore] = useState<StudentWithEnrollments | null>(null);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const { allUsers, loading, message, setMessage, departments, restoreEmployee } = usePreviousEmployeesData(
    selectedDepartment,
    filterNeverTaken
  );

  const users = useFilteredEmployees(allUsers as StudentWithEnrollments[], searchQuery, selectedSearchUser, filterNeverTaken);

  const [employeeCount, setEmployeeCount] = useState(0);

  useEffect(() => {
    setEmployeeCount(users.length);
  }, [users]);

  const handleRestoreEmployee = (user: StudentWithEnrollments) => {
    setSelectedUserToRestore(user);
    setRestoreDialogOpen(true);
  };

  const confirmRestoreEmployee = async () => {
    if (!selectedUserToRestore) return;
    const success = await restoreEmployee(selectedUserToRestore);
    if (success) {
      setRestoreDialogOpen(false);
      setSelectedUserToRestore(null);
    }
  };

  const handleClearFilters = () => {
    setSelectedDepartment('');
    setFilterNeverTaken('');
    setSearchQuery('');
    setSelectedSearchUser(null);
  };

  const handleViewDetails = (user: StudentWithEnrollments) => {
    // Create an enrollment-like object for UserDetailsDialog
    const enrollmentData = {
      id: user.id,
      student_id: user.id,
      student_name: user.name,
      student_email: user.email,
      student_department: user.department,
      student_employee_id: user.employee_id,
      student_designation: user.designation,
      student_career_start_date: user.career_start_date,
      student_bs_joining_date: user.bs_joining_date,
      student_total_experience: user.total_experience,
      student_exit_date: user.exit_date, // Leaving date for previous employees
      is_previous_employee: true, // Flag to indicate this is a previous employee
    };
    setSelectedUser(enrollmentData);
    setUserDetailsOpen(true);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${alpha('#1e40af', 0.03)} 0%, ${alpha('#059669', 0.03)} 100%)`,
      }}
    >
      <Box sx={{ mb: 4, pt: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Box display="flex" alignItems="center" gap={2} mb={1}>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#1e40af', letterSpacing: '-0.02em' }}>
                Previous Employees
              </Typography>
              <Chip
                label={`${employeeCount} inactive`}
                sx={{
                  background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                  color: '#991b1b',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.95rem' }}>
              View and manage previously removed employees
            </Typography>
          </Box>
        </Box>
      </Box>

      <AlertMessage message={message} onClose={() => setMessage(null)} />

      <Card
        sx={{
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(30, 64, 175, 0.1)',
          mb: 3,
          background: '#ffffff',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" gap={2} flexWrap="wrap" alignItems="flex-end">
            <Autocomplete
              options={allUsers as StudentWithEnrollments[]}
              getOptionLabel={(option) => (option ? `${option.name} (${option.employee_id})` : '')}
              value={selectedSearchUser}
              onChange={(_, newValue) => {
                setSelectedSearchUser(newValue);
                if (newValue) setSearchQuery(newValue.name || '');
                else setSearchQuery('');
              }}
              onInputChange={(_, newInputValue) => {
                setSearchQuery(newInputValue);
                if (!newInputValue) setSelectedSearchUser(null);
              }}
              inputValue={searchQuery}
              filterOptions={(options, { inputValue }) => {
                if (!inputValue) return [];
                const searchLower = inputValue.toLowerCase();
                return options.filter(
                  (user) =>
                    user.name?.toLowerCase().includes(searchLower) ||
                    user.email?.toLowerCase().includes(searchLower) ||
                    user.employee_id?.toLowerCase().includes(searchLower)
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search"
                  placeholder="Name, email, or ID..."
                  size="small"
                  sx={{ minWidth: 280, flex: 1 }}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <Search sx={{ color: '#94a3b8' }} />
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                />
              )}
              noOptionsText="No employees found"
            />
            <TextField
              select
              label="SBU"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              sx={{ minWidth: 140 }}
              size="small"
            >
              <MenuItem value="">All SBUs</MenuItem>
              {departments.map((dept) => (
                <MenuItem key={dept} value={dept}>
                  {dept}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Course History"
              value={filterNeverTaken}
              onChange={(e) => setFilterNeverTaken(e.target.value)}
              sx={{ minWidth: 160 }}
              size="small"
            >
              <MenuItem value="">All Employees</MenuItem>
              <MenuItem value="yes">No Course History</MenuItem>
            </TextField>
            {(selectedDepartment || filterNeverTaken || searchQuery) && (
              <Button variant="text" size="small" onClick={handleClearFilters} sx={{ color: '#64748b', fontWeight: 500 }}>
                Clear
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      <EmployeeTable
        users={users as any}
        onRestore={handleRestoreEmployee as any}
        onViewDetails={handleViewDetails as any}
      />

      <Dialog
        open={restoreDialogOpen}
        onClose={() => {
          setRestoreDialogOpen(false);
          setSelectedUserToRestore(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Restore Employee</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 1 }}>
            Are you sure you want to restore <strong>{selectedUserToRestore?.name}</strong> (
            {selectedUserToRestore?.employee_id})?
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            The employee will be moved back to the "Employees" tab. All course history and enrollments will be preserved.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setRestoreDialogOpen(false);
              setSelectedUserToRestore(null);
            }}
          >
            Cancel
          </Button>
          <Button onClick={confirmRestoreEmployee} variant="contained" color="primary">
            Restore
          </Button>
        </DialogActions>
      </Dialog>

      <UserDetailsDialog
        open={userDetailsOpen}
        onClose={() => {
          setUserDetailsOpen(false);
          setSelectedUser(null);
        }}
        enrollment={selectedUser}
      />
    </Box>
  );
};

export default PreviousEmployees;

