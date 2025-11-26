import React, { useState, useEffect } from 'react';
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
  Collapse,
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
  ExpandMore,
  ExpandLess,
  PersonAdd,
  UploadFile,
  Visibility,
  PersonRemove,
  Search,
  Description,
  School,
} from '@mui/icons-material';
import UserDetailsDialog from '../../components/UserDetailsDialog';
import CreateStudentDialog from './components/CreateStudentDialog';
import ImportDialog from './components/ImportDialog';
import CourseHistoryCard from './components/CourseHistoryCard';
import { useUsersData } from './hooks/useUsersData';
import { useFilteredUsers } from './utils/userFilters';
import {
  handleCreateStudent,
  handleRemoveEmployee,
  handleImportExcel,
  handleImportCSV,
  handleGenerateOverallReport,
} from './utils/userHandlers';
import type { Student } from '../../types';

interface StudentWithEnrollments extends Student {
  enrollments?: any[];
  never_taken_course?: boolean;
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

interface ImportResults {
  total: number;
  created: number;
  updated: number;
  errors?: Array<{ error?: string } | string>;
}

const Users: React.FC = () => {
  // Expand course history by default if user has courses
  const [expandedUser, setExpandedUser] = useState<number | null>(null);
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
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResults, setImportResults] = useState<ImportResults | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [filterMentorStatus, setFilterMentorStatus] = useState('');

  const { allUsers, loading, mentorStatuses, updatingMentorStatus, departments, message, setMessage, fetchUsers, toggleMentorStatus } =
    useUsersData(selectedDepartment, filterNeverTaken);

  const users = useFilteredUsers(
    allUsers as StudentWithEnrollments[],
    searchQuery,
    selectedSearchUser,
    filterNeverTaken,
    filterMentorStatus,
    mentorStatuses
  );

  // Auto-expand course history for users with courses
  useEffect(() => {
    if (users.length > 0 && expandedUser === null) {
      const firstUserWithCourses = users.find((u: StudentWithEnrollments) => u.enrollments && u.enrollments.length > 0);
      if (firstUserWithCourses) {
        setExpandedUser(firstUserWithCourses.id);
      }
    }
  }, [users, expandedUser]);

  const handleToggleExpand = (userId: number) => {
    setExpandedUser(expandedUser === userId ? null : userId);
  };

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

  const handleImportExcelClick = async () => {
    await handleImportExcel(importFile, setMessage, setImportLoading, setImportResults, setImportFile, fetchUsers);
  };

  const handleImportCSVClick = async () => {
    await handleImportCSV(importFile, setMessage, setImportLoading, setImportResults, setImportFile, fetchUsers);
  };

  const handleCloseImport = () => {
    setImportDialogOpen(false);
    setImportFile(null);
    setImportResults(null);
  };

  const previewData = [
    { employee_id: 'EMP101', name: 'Cameron Williams', email: 'cameron.williams101@company.com', department: 'Support', designation: 'Coordinator', career_start_date: '11-01-2021', bs_join_date: '12-02-2022' },
    { employee_id: 'EMP102', name: 'Morgan Williams', email: 'morgan.williams102@company.com', department: 'Marketing', designation: 'Engineer', career_start_date: '12-01-2022', bs_join_date: '12-02-2023' },
    { employee_id: 'EMP103', name: 'Morgan Moore', email: 'morgan.moore103@company.com', department: 'Finance', designation: 'Coordinator', career_start_date: '11-01-2018', bs_join_date: '13-08-2019' },
    { employee_id: 'EMP104', name: 'Casey Miller', email: 'casey.miller104@company.com', department: 'Marketing', designation: 'Coordinator', career_start_date: '11-01-2019', bs_join_date: '13-08-2020' },
    { employee_id: 'EMP105', name: 'Alex Jones', email: 'alex.jones105@company.com', department: 'HR', designation: 'Manager', career_start_date: '15-03-2020', bs_join_date: '20-05-2021' },
  ];

  const getStatusPriority = (status: string): number => {
    if (status === 'Completed') return 1;
    if (status === 'Failed') return 2;
    if (status === 'In Progress') return 3;
    return 4;
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
              variant="outlined"
              startIcon={<UploadFile />}
              onClick={() => setImportDialogOpen(true)}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, color: '#1e40af', borderColor: '#1e40af', '&:hover': { background: alpha('#1e40af', 0.05) } }}
            >
              Import
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
            />
            <TextField select label="Department" value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} sx={{ minWidth: 140 }} size="small">
              <MenuItem value="">All Departments</MenuItem>
              {departments.map((dept) => (<MenuItem key={dept} value={dept}>{dept}</MenuItem>))}
            </TextField>
            <TextField select label="Course History" value={filterNeverTaken} onChange={(e) => setFilterNeverTaken(e.target.value)} sx={{ minWidth: 160 }} size="small">
              <MenuItem value="">All Employees</MenuItem>
              <MenuItem value="yes">No Course History</MenuItem>
            </TextField>
            <TextField select label="Mentor" value={filterMentorStatus} onChange={(e) => setFilterMentorStatus(e.target.value)} sx={{ minWidth: 140 }} size="small">
              <MenuItem value="">All</MenuItem>
              <MenuItem value="mentor">Mentors</MenuItem>
              <MenuItem value="not_mentor">Non-Mentors</MenuItem>
            </TextField>
            {(selectedDepartment || filterNeverTaken || filterMentorStatus || searchQuery) && (
              <Button variant="text" size="small" onClick={() => { setSelectedDepartment(''); setFilterNeverTaken(''); setFilterMentorStatus(''); setSearchQuery(''); setSelectedSearchUser(null); }} sx={{ color: '#64748b', fontWeight: 500 }}>
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
            <Table>
              <TableHead>
                <TableRow sx={{ background: 'linear-gradient(135deg, rgba(30, 64, 175, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem' }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem' }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem' }}>Mentor</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem' }} align="center">Course History</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem' }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <React.Fragment key={user.id}>
                    <TableRow sx={{ borderBottom: '1px solid rgba(30, 64, 175, 0.08)', '&:hover': { background: 'linear-gradient(90deg, rgba(30, 64, 175, 0.03) 0%, rgba(5, 150, 105, 0.03) 100%)' }, backgroundColor: user.never_taken_course ? alpha('#f59e0b', 0.03) : 'transparent' }}>
                      <TableCell>
                        <Typography sx={{ color: '#1e40af', fontWeight: 600, cursor: 'pointer' }} onClick={() => handleViewDetails(user)}>{user.employee_id}</Typography>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500, color: '#1e3a8a' }}>{user.name}</TableCell>
                      <TableCell sx={{ color: '#64748b' }}>{user.email}</TableCell>
                      <TableCell>
                        <Chip label={user.department} size="small" sx={{ background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', color: '#1e40af', fontWeight: 600 }} />
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
                        {user.enrollments && user.enrollments.length > 0 ? (
                          <IconButton 
                            size="small" 
                            onClick={() => handleToggleExpand(user.id)} 
                            title={expandedUser === user.id ? "Hide Course History" : "View Course History"} 
                            sx={{ color: '#1e40af' }}
                          >
                            {expandedUser === user.id ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                          </IconButton>
                        ) : (
                          <Chip label="No Course History" size="small" sx={{ background: alpha('#fbbf24', 0.1), color: '#92400e', fontWeight: 500, border: `1px solid ${alpha('#fbbf24', 0.3)}` }} />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" justifyContent="center" gap={0.5}>
                          <IconButton size="small" title="View Details" onClick={() => handleViewDetails(user)}>
                            <Visibility sx={{ fontSize: '1.1rem', color: '#1e40af' }} />
                          </IconButton>
                          <IconButton size="small" title="Remove" onClick={() => handleRemove(user)}>
                            <PersonRemove sx={{ fontSize: '1.1rem', color: '#ef4444' }} />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                        <Collapse in={expandedUser === user.id} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 2 }}>
                            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>Course History</Typography>
                            {user.enrollments && user.enrollments.length > 0 ? (
                              <Box display="flex" flexDirection="column" gap={2}>
                                {user.enrollments
                                  .slice()
                                  .sort((a: any, b: any) => {
                                    const priorityA = getStatusPriority(a.completion_status);
                                    const priorityB = getStatusPriority(b.completion_status);
                                    if (priorityA !== priorityB) return priorityA - priorityB;
                                    return (a.course_name || '').localeCompare(b.course_name || '');
                                  })
                                  .map((enrollment: any) => (<CourseHistoryCard key={enrollment.id} enrollment={enrollment} />))}
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">No courses taken yet</Typography>
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
      <ImportDialog open={importDialogOpen} onClose={handleCloseImport} importFile={importFile} setImportFile={setImportFile} importLoading={importLoading} importResults={importResults} showPreview={showPreview} setShowPreview={setShowPreview} previewData={previewData} onImportExcel={handleImportExcelClick} onImportCSV={handleImportCSVClick} />
      <UserDetailsDialog open={userDetailsOpen} onClose={() => setUserDetailsOpen(false)} enrollment={selectedUser} />
    </Box>
  );
};

export default Users;

