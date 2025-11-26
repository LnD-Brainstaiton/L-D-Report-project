import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  Card,
  CardContent,
  Alert,
  useTheme,
  alpha,
  MenuItem,
  InputAdornment,
  Autocomplete,
  TextField,
} from '@mui/material';
import { Add, Delete, Edit, Search, Star, StarBorder } from '@mui/icons-material';
import AssignInternalMentorDialog from '../../components/AssignInternalMentorDialog';
import AddExternalMentorDialog from '../../components/AddExternalMentorDialog';
import { formatDateForDisplay } from '../../utils/dateUtils';
import CreateCourseDialog from './components/CreateCourseDialog';
import EditCourseDialog from './components/EditCourseDialog';
import { useCoursesData } from './hooks/useCoursesData';
import { usePrerequisiteCourses } from './hooks/usePrerequisiteCourses';
import { useFilteredCourses } from './utils/courseFilters';
import { handleCreateCourseWithMentors, handleApproveCourse, handleGenerateReport, resetForm } from './utils/courseFormHandlers';
import { handleUpdateCourse, handleDeleteCourse } from './utils/courseHandlers';
import { handleAssignInternalMentor, handleAddExternalMentor, handleRemoveMentor } from './utils/mentorHandlers';
import { Course, ClassSchedule, Message, CourseMentorAssignment, CourseFormData, CourseType } from '../../types';

interface CoursesProps {
  courseType?: CourseType;
  status?: string;
}

function Courses({ courseType = 'onsite', status = 'all' }: CoursesProps): React.ReactElement {
  const theme = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSearchCourse, setSelectedSearchCourse] = useState<Course | null>(null);
  const [timePeriod, setTimePeriod] = useState<'all' | 'month' | 'quarter' | 'year'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [mandatoryFilter, setMandatoryFilter] = useState<string>(''); // 'mandatory', 'optional', or '' for all
  const [formData, setFormData] = useState<CourseFormData>({
    name: '',
    batch_code: '',
    description: '',
    start_date: null,
    end_date: null,
    seat_limit: 0,
    total_classes_offered: '',
    prerequisite_course_id: null,
  });
  const [classSchedule, setClassSchedule] = useState<ClassSchedule[]>([]);
  const [selectedMentors, setSelectedMentors] = useState<CourseMentorAssignment[]>([]);
  const [assignInternalMentorDialogOpen, setAssignInternalMentorDialogOpen] = useState<boolean>(false);
  const [addExternalMentorDialogOpen, setAddExternalMentorDialogOpen] = useState<boolean>(false);
  const [createAsDraft, setCreateAsDraft] = useState<boolean>(true);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const {
    courses,
    allCourses,
    loading,
    categories,
    message,
    setMessage,
    fetchCourses,
  } = useCoursesData(courseType, status);

  const { prerequisiteCourses } = usePrerequisiteCourses(open, editDialogOpen);

  const filteredCourses = useFilteredCourses(
    allCourses,
    (courseType || 'onsite') as CourseType,
    status,
    searchQuery,
    selectedSearchCourse,
    timePeriod,
    selectedMonth,
    selectedQuarter,
    selectedYear,
    '',
    selectedCategory,
    mandatoryFilter
  );

  const handleOpen = (): void => {
    resetForm(setFormData, setClassSchedule, setSelectedMentors, setCreateAsDraft);
    setOpen(true);
  };

  const handleClose = (): void => {
    setOpen(false);
    resetForm(setFormData, setClassSchedule, setSelectedMentors, setCreateAsDraft);
  };

  const handleSubmit = async (): Promise<void> => {
    await handleCreateCourseWithMentors(
      formData,
      classSchedule,
      selectedMentors,
      createAsDraft,
      courseType,
      setMessage,
      () => resetForm(setFormData, setClassSchedule, setSelectedMentors, setCreateAsDraft),
      fetchCourses
    );
    handleClose();
  };

  const handleEdit = (course: Course): void => {
    setEditingCourse(course);
    setFormData({
      name: course.name || '',
      batch_code: course.batch_code || '',
      description: course.description || '',
      start_date: course.start_date ? new Date(course.start_date) : null,
      end_date: course.end_date ? new Date(course.end_date) : null,
      seat_limit: course.seat_limit || 0,
      total_classes_offered: course.total_classes_offered || '',
      prerequisite_course_id: course.prerequisite_course_id || null,
    });
    setClassSchedule(course.class_schedule || []);
    setSelectedMentors([]);
    setEditDialogOpen(true);
  };

  const handleEditClose = (): void => {
    setEditDialogOpen(false);
    setEditingCourse(null);
    resetForm(setFormData, setClassSchedule, setSelectedMentors, setCreateAsDraft);
  };

  const handleEditSubmit = async (): Promise<void> => {
    if (!editingCourse) return;
    await handleUpdateCourse(
      editingCourse.id,
      formData,
      classSchedule,
      selectedMentors,
      setMessage,
      setEditDialogOpen,
      () => resetForm(setFormData, setClassSchedule, setSelectedMentors, setCreateAsDraft),
      fetchCourses
    );
    handleEditClose();
  };

  const handleDelete = async (id: number): Promise<void> => {
    if (window.confirm('Are you sure you want to PERMANENTLY DELETE this course? This will completely remove it from the database and cannot be undone. All course data will be lost forever.')) {
      await handleDeleteCourse(id, setMessage, fetchCourses);
    }
  };

  const handleViewDetails = (courseId: number): void => {
    navigate(`/courses/${courseId}`, { state: { courseType } });
  };

  const handleApprove = async (courseId: number): Promise<void> => {
    await handleApproveCourse(courseId, setMessage, fetchCourses);
  };

  const handleGenerate = async (courseId: number): Promise<void> => {
    await handleGenerateReport(courseId, setMessage);
  };

  const handleInternalMentorAssign = async (assignment: any): Promise<void> => {
    await handleAssignInternalMentor(assignment, setSelectedMentors, setMessage);
    setAssignInternalMentorDialogOpen(false);
  };

  const handleExternalMentorAdd = async (assignment: any): Promise<void> => {
    await handleAddExternalMentor(assignment, setSelectedMentors, setMessage);
    setAddExternalMentorDialogOpen(false);
  };

  const handleMentorRemove = (index: number): void => {
    handleRemoveMentor(index, selectedMentors, setSelectedMentors);
  };

  return (
    <Box sx={{ minHeight: '100vh', background: `linear-gradient(135deg, ${alpha('#1e40af', 0.03)} 0%, ${alpha('#059669', 0.03)} 100%)` }}>
      {/* Header */}
      <Box sx={{ mb: 4, pt: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 700,
                color: '#1e40af',
                mb: 1,
                letterSpacing: '-0.02em',
              }}
            >
              {status === 'all' ? ` All ${courseType.charAt(0).toUpperCase() + courseType.slice(1)} Courses` :
               status === 'upcoming' ? ` Upcoming ${courseType.charAt(0).toUpperCase() + courseType.slice(1)} Courses` :
               status === 'ongoing' ? ` Ongoing ${courseType.charAt(0).toUpperCase() + courseType.slice(1)} Courses` :
               status === 'planning' ? ` Planning ${courseType.charAt(0).toUpperCase() + courseType.slice(1)} Courses` :
               ` Completed ${courseType.charAt(0).toUpperCase() + courseType.slice(1)} Courses`}
            </Typography>
            <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.95rem' }}>
                {status === 'all' ? `All ${courseType} courses` :
                 status === 'upcoming' ? `${courseType.charAt(0).toUpperCase() + courseType.slice(1)} courses scheduled to start soon` :
                 status === 'ongoing' ? `${courseType.charAt(0).toUpperCase() + courseType.slice(1)} courses currently in progress` :
                 status === 'planning' ? `${courseType.charAt(0).toUpperCase() + courseType.slice(1)} courses scheduled for the future` :
                 `${courseType.charAt(0).toUpperCase() + courseType.slice(1)} courses that have been completed`}
              </Typography>
              <Chip
                label={`Total: ${filteredCourses.length} ${filteredCourses.length === 1 ? 'course' : 'courses'}`}
                sx={{
                  background: 'linear-gradient(135deg, rgba(30, 64, 175, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
                  color: '#1e40af',
                  fontWeight: 600,
                  border: '1px solid rgba(30, 64, 175, 0.2)',
                }}
              />
            </Box>
          </Box>
          <Box display="flex" gap={2}>
            {status === 'planning' && courseType === 'onsite' && (
              <Button 
                variant="contained" 
                startIcon={<Add />} 
                onClick={handleOpen}
                sx={{
                  background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  boxShadow: '0 4px 12px rgba(30, 64, 175, 0.25)',
                  '&:hover': {
                    boxShadow: '0 6px 20px rgba(30, 64, 175, 0.35)',
                  },
                }}
              >
                Add New Course
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {message && (
        <Alert 
          severity={message.type}
          onClose={() => setMessage(null)}
          sx={{ 
            mb: 3,
            borderRadius: '8px',
            border: 'none',
            boxShadow: `0 4px 12px ${alpha(theme.palette[message.type === 'success' ? 'success' : 'error'].main, 0.15)}`,
          }} 
        >
          {message.text}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress sx={{ color: '#1e40af' }} />
        </Box>
      ) : (
        <>
          {/* Filter card */}
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
                  options={allCourses}
                  getOptionLabel={(option) => option ? `${option.name} (${option.batch_code})` : ''}
                  value={selectedSearchCourse}
                  onChange={(event, newValue) => {
                    setSelectedSearchCourse(newValue);
                    if (newValue) setSearchQuery(newValue.name || '');
                    else setSearchQuery('');
                  }}
                  onInputChange={(event, newInputValue) => {
                    setSearchQuery(newInputValue);
                    if (!newInputValue) setSelectedSearchCourse(null);
                  }}
                  inputValue={searchQuery}
                  filterOptions={(options, { inputValue }) => {
                    if (!inputValue) return [];
                    const searchLower = inputValue.toLowerCase();
                    return options.filter((course) =>
                      course.name?.toLowerCase().includes(searchLower) ||
                      course.batch_code?.toLowerCase().includes(searchLower)
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search Courses"
                      placeholder="Search by name or batch code..."
                      size="small"
                      sx={{ minWidth: 280, flex: 1 }}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <Search sx={{ color: '#94a3b8', fontSize: '1.2rem' }} />
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  renderOption={(props, course) => (
                    <Box component="li" {...props} key={course.id}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {course.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {course.batch_code} {course.start_date && `• ${course.start_date}`}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  noOptionsText="No courses found"
                  clearOnEscape
                  clearOnBlur={false}
                />
                <TextField
                  select
                  label="Time Period"
                  value={timePeriod}
                  onChange={(e) => {
                    setTimePeriod(e.target.value as 'all' | 'month' | 'quarter' | 'year');
                    if (e.target.value === 'all') {
                      setSelectedMonth('');
                      setSelectedQuarter('');
                    }
                  }}
                  sx={{ minWidth: 150 }}
                  size="small"
                >
                  <MenuItem value="all">All Time</MenuItem>
                  <MenuItem value="month">Month</MenuItem>
                  <MenuItem value="quarter">Quarter</MenuItem>
                  <MenuItem value="year">Year</MenuItem>
                </TextField>
                {timePeriod === 'month' && (
                  <>
                    <TextField
                      select
                      label="Month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      sx={{ minWidth: 150 }}
                      size="small"
                    >
                      <MenuItem value="0">January</MenuItem>
                      <MenuItem value="1">February</MenuItem>
                      <MenuItem value="2">March</MenuItem>
                      <MenuItem value="3">April</MenuItem>
                      <MenuItem value="4">May</MenuItem>
                      <MenuItem value="5">June</MenuItem>
                      <MenuItem value="6">July</MenuItem>
                      <MenuItem value="7">August</MenuItem>
                      <MenuItem value="8">September</MenuItem>
                      <MenuItem value="9">October</MenuItem>
                      <MenuItem value="10">November</MenuItem>
                      <MenuItem value="11">December</MenuItem>
                    </TextField>
                    <TextField
                      type="number"
                      label="Year"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      inputProps={{ min: 2000, max: 2100 }}
                      sx={{ minWidth: 100 }}
                      size="small"
                    />
                  </>
                )}
                {timePeriod === 'quarter' && (
                  <>
                    <TextField
                      select
                      label="Quarter"
                      value={selectedQuarter}
                      onChange={(e) => setSelectedQuarter(e.target.value)}
                      sx={{ minWidth: 120 }}
                      size="small"
                    >
                      <MenuItem value="1">Q1 (Jan-Mar)</MenuItem>
                      <MenuItem value="2">Q2 (Apr-Jun)</MenuItem>
                      <MenuItem value="3">Q3 (Jul-Sep)</MenuItem>
                      <MenuItem value="4">Q4 (Oct-Dec)</MenuItem>
                    </TextField>
                    <TextField
                      type="number"
                      label="Year"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      inputProps={{ min: 2000, max: 2100 }}
                      sx={{ minWidth: 100 }}
                      size="small"
                    />
                  </>
                )}
                {timePeriod === 'year' && (
                  <TextField
                    type="number"
                    label="Year"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    inputProps={{ min: 2000, max: 2100 }}
                    sx={{ minWidth: 100 }}
                    size="small"
                  />
                )}
                {courseType === 'online' && categories.length > 0 && (
                  <TextField
                    select
                    label="Category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    size="small"
                    sx={{ minWidth: 180 }}
                  >
                    <MenuItem value="">
                      <em>All Categories</em>
                    </MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
                {courseType === 'online' && (
                  <TextField
                    select
                    label="Mandatory"
                    value={mandatoryFilter}
                    onChange={(e) => setMandatoryFilter(e.target.value)}
                    size="small"
                    sx={{ minWidth: 160 }}
                  >
                    <MenuItem value="">
                      <em>All Courses</em>
                    </MenuItem>
                    <MenuItem value="mandatory">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Star sx={{ fontSize: 16, color: '#f59e0b' }} />
                        Mandatory
                      </Box>
                    </MenuItem>
                    <MenuItem value="optional">
                      <Box display="flex" alignItems="center" gap={1}>
                        <StarBorder sx={{ fontSize: 16, color: '#94a3b8' }} />
                        Optional
                      </Box>
                    </MenuItem>
                  </TextField>
                )}
                {(timePeriod !== 'all' || searchQuery || selectedCategory || mandatoryFilter) && (
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => {
                      setTimePeriod('all');
                      setSelectedMonth('');
                      setSelectedQuarter('');
                      setSelectedYear(new Date().getFullYear());
                      setSearchQuery('');
                      setSelectedSearchCourse(null);
                      setSelectedCategory('');
                      setMandatoryFilter('');
                    }}
                    sx={{ color: '#64748b', fontWeight: 500 }}
                  >
                    Clear
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Courses Table */}
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
                  <TableRow sx={{ background: 'linear-gradient(135deg, rgba(30, 64, 175, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)' }}>
                    <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', width: courseType === 'online' ? '22%' : '20%' }}>Course Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', width: courseType === 'online' ? '12%' : '12%' }}>Batch Code</TableCell>
                    {courseType === 'online' && (
                      <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', width: '10%' }} align="center">Type</TableCell>
                    )}
                    <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', width: courseType === 'online' ? '11%' : '12%' }}>Start Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', width: courseType === 'online' ? '11%' : '12%' }}>End Date</TableCell>
                    {courseType === 'online' && (
                      <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', width: '14%' }}>Category</TableCell>
                    )}
                    {courseType === 'online' && (
                      <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', width: '10%' }} align="right">Total Assigned</TableCell>
                    )}
                    {courseType !== 'online' && (
                      <>
                        <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', width: '10%' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', width: '10%' }} align="right">Enrolled</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', width: '12%' }} align="center">Actions</TableCell>
                      </>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCourses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={courseType === 'online' ? 7 : 8} align="center" sx={{ py: 6 }}>
                        <Typography color="text.secondary" sx={{ fontSize: '0.95rem' }}>
                          No courses found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCourses.map((course) => (
                      <TableRow
                        key={course.id}
                        sx={{
                          borderBottom: '1px solid rgba(30, 64, 175, 0.08)',
                          '&:hover': {
                            background: 'linear-gradient(90deg, rgba(30, 64, 175, 0.03) 0%, rgba(5, 150, 105, 0.03) 100%)',
                          },
                          cursor: courseType === 'online' ? 'pointer' : 'default',
                          transition: 'all 0.2s ease',
                        }}
                        onClick={courseType === 'online' ? () => handleViewDetails(course.id) : undefined}
                      >
                        <TableCell 
                          sx={{ fontWeight: 500, color: '#1e3a8a' }}
                          onClick={courseType !== 'online' ? () => handleViewDetails(course.id) : undefined}
                          style={{ cursor: courseType !== 'online' ? 'pointer' : 'default' }}
                        >
                          {course.name || course.fullname}
                        </TableCell>
                        <TableCell sx={{ color: '#475569' }}>{course.batch_code || '-'}</TableCell>
                        {courseType === 'online' && (
                          <TableCell align="center">
                            {course.is_mandatory ? (
                              <Chip
                                icon={<Star sx={{ fontSize: 14 }} />}
                                label="Mandatory"
                                size="small"
                                sx={{
                                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                                  color: '#92400e',
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  '& .MuiChip-icon': { color: '#f59e0b' },
                                }}
                              />
                            ) : (
                              <Chip
                                label="Optional"
                                size="small"
                                sx={{
                                  background: '#f1f5f9',
                                  color: '#64748b',
                                  fontWeight: 500,
                                  fontSize: '0.75rem',
                                }}
                              />
                            )}
                          </TableCell>
                        )}
                        <TableCell sx={{ color: '#64748b' }}>
                          {course.startdate 
                            ? new Date(course.startdate * 1000).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })
                            : course.start_date 
                            ? formatDateForDisplay(course.start_date)
                            : 'Not set'}
                        </TableCell>
                        <TableCell sx={{ color: '#64748b' }}>
                          {course.enddate 
                            ? new Date(course.enddate * 1000).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })
                            : course.end_date 
                            ? formatDateForDisplay(course.end_date)
                            : 'Not set'}
                        </TableCell>
                        {courseType === 'online' && (
                          <TableCell sx={{ color: '#475569' }}>
                            <Chip
                              label={course.categoryname || 'Unknown'}
                              size="small"
                              sx={{
                                background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                                color: '#1e40af',
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>
                        )}
                        {courseType === 'online' && (
                          <TableCell align="right" sx={{ color: '#475569', fontWeight: 600 }}>
                            {course.current_enrolled || '-'}
                          </TableCell>
                        )}
                        {courseType !== 'online' && (
                          <>
                            <TableCell>
                              <Chip
                                label={course.status?.toUpperCase() || 'DRAFT'}
                                size="small"
                                color={
                                  course.status === 'completed'
                                    ? 'success'
                                    : course.status === 'ongoing'
                                    ? 'primary'
                                    : 'warning'
                                }
                                sx={{ fontWeight: 600 }}
                              />
                            </TableCell>
                            <TableCell align="right" sx={{ color: '#475569', fontWeight: 600 }}>
                              {course.current_enrolled || 0}/{course.seat_limit || '∞'}
                            </TableCell>
                            <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                              <Box display="flex" gap={1} justifyContent="center">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleEdit(course)}
                                  sx={{
                                    '&:hover': {
                                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                    },
                                  }}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete "${course.name}"?`)) {
                                      handleDelete(course.id);
                                    }
                                  }}
                                  sx={{
                                    '&:hover': {
                                      backgroundColor: alpha(theme.palette.error.main, 0.1),
                                    },
                                  }}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Box>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </>
      )}

      {/* Create Course Dialog */}
      <CreateCourseDialog
        open={open}
        onClose={handleClose}
        formData={formData}
        setFormData={setFormData as any}
        classSchedule={classSchedule}
        setClassSchedule={setClassSchedule}
        prerequisiteCourses={prerequisiteCourses}
        createAsDraft={createAsDraft}
        setCreateAsDraft={setCreateAsDraft}
        courseType={courseType}
        onCreate={handleSubmit}
        message={message}
        setMessage={setMessage}
      />

      {/* Edit Course Dialog */}
      <EditCourseDialog
        open={editDialogOpen}
        onClose={handleEditClose}
        formData={formData}
        setFormData={setFormData as any}
        classSchedule={classSchedule}
        setClassSchedule={setClassSchedule}
        prerequisiteCourses={prerequisiteCourses.filter(c => c.id !== editingCourse?.id)}
        onUpdate={handleEditSubmit}
      />

      {/* Assign Internal Mentor Dialog */}
      <AssignInternalMentorDialog
        open={assignInternalMentorDialogOpen}
        onClose={() => setAssignInternalMentorDialogOpen(false)}
        onAssign={handleInternalMentorAssign}
        isDraft={createAsDraft}
      />

      {/* Add External Mentor Dialog */}
      <AddExternalMentorDialog
        open={addExternalMentorDialogOpen}
        onClose={() => setAddExternalMentorDialogOpen(false)}
        onAdd={handleExternalMentorAdd}
        isDraft={createAsDraft}
      />
    </Box>
  );
}

export default Courses;

