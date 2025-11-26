import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  TextField,
  MenuItem,
  IconButton,
  alpha,
  Button,
  Alert,
  InputAdornment,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  PersonAdd,
  PersonRemove,
  Search,
  Description,
  School,
} from '@mui/icons-material';
import UserDetailsDialog from '../../components/UserDetailsDialog';
import CreateStudentDialog from './components/CreateStudentDialog';
import { useUsersData } from './hooks/useUsersData';
import { useFilteredUsers } from './utils/userFilters';
import {
  handleCreateStudent,
  handleRemoveEmployee,
  handleGenerateOverallReport,
} from './utils/userHandlers';
import type { Student } from '../../types';

interface StudentWithEnrollments extends Student {
  enrollments?: any[];
  never_taken_course?: boolean;
  sbu_head_employee_id?: string | null;
  sbu_head_name?: string | null;
  reporting_manager_employee_id?: string | null;
  reporting_manager_name?: string | null;
  exit_reason?: string | null;
}

interface NewStudent {
  employee_id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  experience_years: number;
  career_start_date: Date | null;
  bs_joining_date: Date | null;
}

const Users: React.FC = () => {
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [filterNeverTaken, setFilterNeverTaken] = useState('');
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedUserToRemove, setSelectedUserToRemove] = useState<StudentWithEnrollments | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSearchUser, setSelectedSearchUser] = useState<StudentWithEnrollments | null>(null);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newStudent, setNewStudent] = useState<NewStudent>({
    employee_id: '',
    name: '',
    email: '',
    department: '',
    designation: '',
    experience_years: 0,
    career_start_date: null,
    bs_joining_date: null,
  });
  const [filterMentorStatus, setFilterMentorStatus] = useState('');
  const [filterDesignation, setFilterDesignation] = useState('');

  const { allUsers, loading, mentorStatuses, updatingMentorStatus, departments, designations, message, setMessage, fetchUsers, toggleMentorStatus } =
    useUsersData(selectedDepartment, filterNeverTaken);

  const filteredUsers = useFilteredUsers(
    allUsers as StudentWithEnrollments[],
    searchQuery,
    selectedSearchUser,
    filterNeverTaken,
    filterMentorStatus,
    mentorStatuses
  );

  // Apply designation filter and deduplicate by employee_id (case-insensitive)
  // Prefer the record with more completed courses or higher total courses
  const users = filteredUsers
    .filter((user) => !filterDesignation || user.designation === filterDesignation)
    .reduce((acc: StudentWithEnrollments[], user) => {
      const normalizedId = user.employee_id?.toLowerCase();
      const existingIndex = acc.findIndex(u => u.employee_id?.toLowerCase() === normalizedId);
      
      if (existingIndex === -1) {
        acc.push(user);
      } else {
        // Compare and keep the better record (more completed courses)
        const existing = acc[existingIndex];
        const existingCompleted = (existing as any).completed_courses || 0;
        const currentCompleted = (user as any).completed_courses || 0;
        
        if (currentCompleted > existingCompleted) {
          acc[existingIndex] = user;
        }
      }
      return acc;
    }, []);

  const handleViewDetails = (user: StudentWithEnrollments) => {
    const mockEnrollment = {
      student_id: user.id,
      student_name: user.name,
      student_email: user.email,
      student_department: user.department,
      student_employee_id: user.employee_id,
      student_designation: user.designation,
      student_experience_years: user.experience_years,
      student_career_start_date: user.career_start_date,
      student_bs_joining_date: user.bs_joining_date,
      student_total_experience: user.total_experience,
      // SBU Head and Reporting Manager from ERP
      sbu_head_employee_id: user.sbu_head_employee_id,
      sbu_head_name: user.sbu_head_name,
      reporting_manager_employee_id: user.reporting_manager_employee_id,
      reporting_manager_name: user.reporting_manager_name,
    };
    setSelectedUser(mockEnrollment);
    setUserDetailsOpen(true);
  };

  const handleCreate = async () => {
    await handleCreateStudent(newStudent, setMessage, setCreateDialogOpen, setNewStudent, fetchUsers);
  };

  const handleRemove = (user: StudentWithEnrollments) => {
    setSelectedUserToRemove(user);
    setRemoveDialogOpen(true);
  };

  const confirmRemove = async () => {
    await handleRemoveEmployee(selectedUserToRemove, setMessage, setRemoveDialogOpen, setSelectedUserToRemove as any, fetchUsers);
  };

  return (
    <Box sx={{ minHeight: '100vh', background: `linear-gradient(135deg, ${alpha('#1e40af', 0.03)} 0%, ${alpha('#059669', 0.03)} 100%)` }}>
      <Box sx={{ mb: 4, pt: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Box display="flex" alignItems="center" gap={2} mb={1}>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#1e40af', letterSpacing: '-0.02em' }}>
                All Employees
              </Typography>
              <Chip
                label={`${users.length} active`}
                sx={{ background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', color: '#1e40af', fontWeight: 700, fontSize: '0.85rem' }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.95rem' }}>
              Manage your workforce and track training progress
            </Typography>
          </Box>
          <Box display="flex" gap={2} flexWrap="wrap" justifyContent="flex-end">
            <Button
              variant="outlined"
              startIcon={<Description />}
              onClick={() => handleGenerateOverallReport(setMessage)}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, color: '#1e40af', borderColor: '#1e40af', '&:hover': { background: alpha('#1e40af', 0.05) } }}
            >
              Generate Report
            </Button>
            <Button
              variant="contained"
              startIcon={<PersonAdd />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{ background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)', borderRadius: '8px', textTransform: 'none', fontWeight: 600, px: 3, boxShadow: '0 4px 12px rgba(30, 64, 175, 0.25)' }}
            >
              Add Employee
            </Button>
          </Box>
        </Box>
      </Box>

      {message && (
        <Alert severity={message.type} onClose={() => setMessage(null)} sx={{ mb: 3, borderRadius: '8px', border: 'none' }}>
          {message.text}
        </Alert>
      )}

      <Card sx={{ borderRadius: '12px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)', border: '1px solid rgba(30, 64, 175, 0.1)', mb: 3, background: '#ffffff' }}>
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" gap={2} flexWrap="wrap" alignItems="flex-end">
            <Autocomplete
              options={allUsers}
              getOptionLabel={(option) => (option ? `${option.name} (${option.employee_id})` : '')}
              value={selectedSearchUser}
              onChange={(_, newValue) => {
                setSelectedSearchUser(newValue as StudentWithEnrollments | null);
                if (newValue) {
                  setSearchQuery(newValue.name || '');
                  // Auto-open details when selecting from search
                  handleViewDetails(newValue as StudentWithEnrollments);
                } else {
                  setSearchQuery('');
                }
              }}
              onInputChange={(_, newInputValue, reason) => {
                // Only update search query on user input, not on selection
                if (reason === 'input') {
                  setSearchQuery(newInputValue);
                  if (!newInputValue) setSelectedSearchUser(null);
                } else if (reason === 'clear') {
                  setSearchQuery('');
                  setSelectedSearchUser(null);
                }
              }}
              inputValue={searchQuery}
              filterOptions={(options, { inputValue }) => {
                if (!inputValue) return [];
                const searchLower = inputValue.toLowerCase();
                return options.filter((user) => user.name?.toLowerCase().includes(searchLower) || user.email?.toLowerCase().includes(searchLower) || user.employee_id?.toLowerCase().includes(searchLower));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search"
                  placeholder="Name, email, or ID..."
                  size="small"
                  sx={{ minWidth: 280, flex: 1 }}
                  InputProps={{ ...params.InputProps, startAdornment: (<><InputAdornment position="start"><Search sx={{ color: '#94a3b8' }} /></InputAdornment>{params.InputProps.startAdornment}</>) }}
                />
              )}
              noOptionsText="No employees found"
              clearOnBlur={false}
              blurOnSelect={true}
            />
            <TextField select label="SBU" value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} sx={{ minWidth: 140 }} size="small">
              <MenuItem value="">All SBUs</MenuItem>
              {departments.map((dept) => (<MenuItem key={dept} value={dept}>{dept}</MenuItem>))}
            </TextField>
            <TextField select label="Course History" value={filterNeverTaken} onChange={(e) => setFilterNeverTaken(e.target.value)} sx={{ minWidth: 160 }} size="small">
              <MenuItem value="">All Employees</MenuItem>
              <MenuItem value="yes">No Course History</MenuItem>
            </TextField>
            <TextField select label="Designation" value={filterDesignation} onChange={(e) => setFilterDesignation(e.target.value)} sx={{ minWidth: 180 }} size="small">
              <MenuItem value="">All Designations</MenuItem>
              {designations.map((desig) => (<MenuItem key={desig} value={desig}>{desig}</MenuItem>))}
            </TextField>
            <TextField select label="Mentor" value={filterMentorStatus} onChange={(e) => setFilterMentorStatus(e.target.value)} sx={{ minWidth: 140 }} size="small">
              <MenuItem value="">All</MenuItem>
              <MenuItem value="mentor">Mentors</MenuItem>
              <MenuItem value="not_mentor">Non-Mentors</MenuItem>
            </TextField>
            {(selectedDepartment || filterNeverTaken || filterMentorStatus || filterDesignation || searchQuery) && (
              <Button variant="text" size="small" onClick={() => { setSelectedDepartment(''); setFilterNeverTaken(''); setFilterMentorStatus(''); setFilterDesignation(''); setSearchQuery(''); setSelectedSearchUser(null); }} sx={{ color: '#64748b', fontWeight: 500 }}>
                Clear
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress sx={{ color: '#1e40af' }} />
        </Box>
      ) : (
        <Card sx={{ borderRadius: '12px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)', border: '1px solid rgba(30, 64, 175, 0.1)', overflow: 'hidden', background: '#ffffff' }}>
          <TableContainer>
            <Table sx={{ tableLayout: 'fixed' }}>
              <TableHead>
                <TableRow sx={{ background: 'linear-gradient(135deg, rgba(30, 64, 175, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', width: 80 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', width: 150 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', width: 200 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', width: 100 }}>SBU</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', width: 180 }}>Designation</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', width: 80 }}>Mentor</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', width: 120 }} align="center">Course History</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', width: 80 }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <React.Fragment key={user.id}>
                    <TableRow sx={{ borderBottom: '1px solid rgba(30, 64, 175, 0.08)', '&:hover': { background: 'linear-gradient(90deg, rgba(30, 64, 175, 0.03) 0%, rgba(5, 150, 105, 0.03) 100%)' }, backgroundColor: user.never_taken_course ? alpha('#f59e0b', 0.03) : 'transparent' }}>
                      <TableCell>
                        <Typography 
                          component="span"
                          onClick={() => handleViewDetails(user)}
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
                        <Chip label={user.department} size="small" sx={{ background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', color: '#1e40af', fontWeight: 600 }} />
                      </TableCell>
                      <TableCell>
                        {user.designation ? (
                          <Chip label={user.designation} size="small" sx={{ background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)', color: '#6d28d9', fontWeight: 600 }} />
                        ) : (
                          <Chip label="N/A" size="small" sx={{ background: '#f1f5f9', color: '#94a3b8', fontWeight: 500 }} />
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={<School />}
                          label={mentorStatuses[user.id] ? 'Yes' : 'No'}
                          size="small"
                          onClick={() => toggleMentorStatus(user.id)}
                          disabled={updatingMentorStatus[user.id]}
                          sx={{ cursor: 'pointer', background: mentorStatuses[user.id] ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)', color: mentorStatuses[user.id] ? '#047857' : '#6b7280', fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        {(() => {
                          const enrollments = user.enrollments || [];
                          const onsiteCount = enrollments.filter((e: any) => e.course_type === 'onsite').length;
                          const onlineCount = enrollments.filter((e: any) => e.course_type === 'online').length;
                          const externalCount = enrollments.filter((e: any) => e.course_type === 'external').length;
                          
                          if (enrollments.length === 0) {
                            return <Chip label="No History" size="small" sx={{ background: alpha('#fbbf24', 0.1), color: '#92400e', fontWeight: 500, border: `1px solid ${alpha('#fbbf24', 0.3)}` }} />;
                          }
                          
                          return (
                            <Box display="flex" gap={0.5} justifyContent="center" flexWrap="wrap">
                              <Chip label={`Ons-${onsiteCount}`} size="small" sx={{ background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', color: '#1e40af', fontWeight: 600, fontSize: '0.7rem', height: 22 }} />
                              <Chip label={`LMS-${onlineCount}`} size="small" sx={{ background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', color: '#047857', fontWeight: 600, fontSize: '0.7rem', height: 22 }} />
                              <Chip label={`Ext-${externalCount}`} size="small" sx={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', color: '#92400e', fontWeight: 600, fontSize: '0.7rem', height: 22 }} />
                            </Box>
                          );
                        })()}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" title="Remove" onClick={() => handleRemove(user)}>
                          <PersonRemove sx={{ fontSize: '1.1rem', color: '#ef4444' }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      <Dialog open={removeDialogOpen} onClose={() => { setRemoveDialogOpen(false); setSelectedUserToRemove(null); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Remove Employee</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 1 }}>
            Are you sure you want to remove <strong>{selectedUserToRemove?.name}</strong> ({selectedUserToRemove?.employee_id})?
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            The employee will be moved to "Previous Employees" tab. All course history and enrollments will be preserved.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setRemoveDialogOpen(false); setSelectedUserToRemove(null); }}>Cancel</Button>
          <Button onClick={confirmRemove} variant="contained" color="error">Remove</Button>
        </DialogActions>
      </Dialog>

      <CreateStudentDialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} newStudent={newStudent} setNewStudent={setNewStudent} departments={departments} onCreate={handleCreate} />
      <UserDetailsDialog open={userDetailsOpen} onClose={() => setUserDetailsOpen(false)} enrollment={selectedUser} />
    </Box>
  );
};

export default Users;

