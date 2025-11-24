import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  CircularProgress,
  Card,
  CardContent,
  Alert,
  useTheme,
  alpha,
  Grid,
  MenuItem,
  Autocomplete,
  Divider,
  List,
  ListItem,
  ListItemText,
  InputAdornment,
  Collapse,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  PersonAdd,
  UploadFile,
  CheckCircle,
  Cancel,
  PersonRemove,
  Refresh,
  Add,
  Remove,
  AttachMoney,
  Restaurant,
  Receipt,
  Calculate,
  School,
  CalendarToday,
  People,
  Event,
  Person,
  AccountBalance,
  AccessTime,
  TrendingUp,
  Download,
  Visibility,
  ExpandMore,
  ExpandLess,
  Comment,
} from '@mui/icons-material';
import {
  coursesAPI,
  enrollmentsAPI,
  importsAPI,
  completionsAPI,
  studentsAPI,
  mentorsAPI,
  lmsAPI,
} from '../services/api';
import UserDetailsDialog from '../components/UserDetailsDialog';
import AssignInternalMentorDialog from '../components/AssignInternalMentorDialog';
import AddExternalMentorDialog from '../components/AddExternalMentorDialog';
import { formatDateTimeForDisplay, formatDateForAPI, formatDateForDisplay, formatDateRangeWithFromTo, convertTo12HourFormat } from '../utils/dateUtils';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

function CourseDetail() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);
  const [message, setMessage] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [draftMentorsWithDetails, setDraftMentorsWithDetails] = useState([]);
  
  // Enrollment sections - different for onsite vs online courses
  const isOnlineCourse = course?.is_lms_course;
  
  // For online courses: group by completion status
  const completedOnline = enrollments.filter(e => 
    e.is_lms_enrollment && (e.progress >= 100 || e.completion_status === 'Completed')
  );
  const inProgressOnline = enrollments.filter(e => 
    e.is_lms_enrollment && e.progress > 0 && e.progress < 100 && e.completion_status === 'In Progress'
  );
  const notStartedOnline = enrollments.filter(e => 
    e.is_lms_enrollment && (e.progress === 0 || e.completion_status === 'Not Started') && 
    !(e.progress >= 100 || e.completion_status === 'Completed') &&
    !(e.progress > 0 && e.progress < 100 && e.completion_status === 'In Progress')
  );
  
  // For onsite courses: group by approval status
  const approvedEnrollments = enrollments.filter(e => !e.is_lms_enrollment && e.approval_status === 'Approved');
  const eligiblePending = enrollments.filter(e => 
    !e.is_lms_enrollment && e.approval_status === 'Pending' && e.eligibility_status === 'Eligible'
  );
  const notEligible = enrollments.filter(e => 
    !e.is_lms_enrollment &&
    e.approval_status !== 'Approved' && 
    e.approval_status !== 'Rejected' &&
    (e.eligibility_status === 'Ineligible (Missing Prerequisite)' ||
     e.eligibility_status === 'Ineligible (Already Taken)' ||
     e.eligibility_status === 'Ineligible (Annual Limit)')
  );
  const rejected = enrollments.filter(e => !e.is_lms_enrollment && e.approval_status === 'Rejected');
  const withdrawn = enrollments.filter(e => !e.is_lms_enrollment && e.approval_status === 'Withdrawn');
  
  // Dialogs
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [withdrawalReason, setWithdrawalReason] = useState('');
  const [manualEnrollDialogOpen, setManualEnrollDialogOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [showImportPreview, setShowImportPreview] = useState(false);
  
  // Preview data for enrollment import format (matches ADA2025A_registration.xlsx structure)
  const enrollmentPreviewData = [
    { employee_id: 'EMP143', name: 'Casey Smith', email: 'casey.smith143@company.com', department: 'Operations', designation: 'Engineer', course_name: 'Advanced Data Analytics', batch_code: 'ADA2025A' },
    { employee_id: 'EMP102', name: 'Morgan Williams', email: 'morgan.williams102@company.com', department: 'Marketing', designation: 'Engineer', course_name: 'Advanced Data Analytics', batch_code: 'ADA2025A' },
    { employee_id: 'EMP144', name: 'Reese Williams', email: 'reese.williams144@company.com', department: 'Operations', designation: 'Manager', course_name: 'Advanced Data Analytics', batch_code: 'ADA2025A' },
    { employee_id: 'EMP145', name: 'Alex Johnson', email: 'alex.johnson145@company.com', department: 'IT', designation: 'Coordinator', course_name: 'Advanced Data Analytics', batch_code: 'ADA2025A' },
  ];
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [attendanceFile, setAttendanceFile] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [showAttendancePreview, setShowAttendancePreview] = useState(false);
  
  // Preview data for attendance upload format
  const attendancePreviewData = [
    { name: 'John Doe', email: 'john.doe@company.com', total_classes_attended: 8, score: 85.5 },
    { name: 'Jane Smith', email: 'jane.smith@company.com', total_classes_attended: 9, score: 92.0 },
    { name: 'Bob Wilson', email: 'bob.wilson@company.com', total_classes_attended: 7, score: 78.5 },
    { name: 'Alice Brown', email: 'alice.brown@company.com', total_classes_attended: 10, score: 95.0 },
  ];
  const [editAttendanceDialogOpen, setEditAttendanceDialogOpen] = useState(false);
  const [selectedEnrollmentForEdit, setSelectedEnrollmentForEdit] = useState(null);
  const [editClassesAttended, setEditClassesAttended] = useState('');
  const [editScore, setEditScore] = useState('');
  
  // Mentor management
  const [assignMentorDialogOpen, setAssignMentorDialogOpen] = useState(false);
  const [assignMentorLoading, setAssignMentorLoading] = useState(false);
  const [addExternalMentorDialogOpen, setAddExternalMentorDialogOpen] = useState(false);
  
  // Edit mentor dialog
  const [editMentorDialogOpen, setEditMentorDialogOpen] = useState(false);
  const [editingMentor, setEditingMentor] = useState(null);
  const [editMentorHours, setEditMentorHours] = useState('');
  const [editMentorAmount, setEditMentorAmount] = useState('');
  const [editMentorLoading, setEditMentorLoading] = useState(false);
  
  // Cost management
  const [editCostsDialogOpen, setEditCostsDialogOpen] = useState(false);
  const [foodCost, setFoodCost] = useState('');
  const [otherCost, setOtherCost] = useState('');
  const [editCostsLoading, setEditCostsLoading] = useState(false);
  const [mentorCosts, setMentorCosts] = useState([]);
  
  // User details
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const [selectedUserEnrollment, setSelectedUserEnrollment] = useState(null);
  
  // Edit course details
  const [editCourseDialogOpen, setEditCourseDialogOpen] = useState(false);
  const [editCourseData, setEditCourseData] = useState({
    start_date: null,
    end_date: null,
    seat_limit: 0,
    total_classes_offered: '',
  });
  const [editClassSchedule, setEditClassSchedule] = useState([]);
  const [editCourseLoading, setEditCourseLoading] = useState(false);

  useEffect(() => {
    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  useEffect(() => {
    if (course && courseId) {
      fetchEnrollments();
    }
  }, [course, courseId]);

  const fetchCourse = async () => {
    setLoading(true);
    try {
      // Check if this is an LMS course by trying to fetch from LMS first
      let courseData = null;
      let isLmsCourse = false;
      
      try {
        const lmsResponse = await lmsAPI.getCourses();
        const lmsCourses = lmsResponse.data.courses || [];
        const lmsCourse = lmsCourses.find(c => c.id === parseInt(courseId));
        
        if (lmsCourse) {
          // This is an LMS course
          isLmsCourse = true;
          courseData = {
            id: lmsCourse.id,
            name: lmsCourse.fullname,
            fullname: lmsCourse.fullname,
            batch_code: lmsCourse.shortname || '',
            description: lmsCourse.summary || '',
            start_date: lmsCourse.startdate ? new Date(lmsCourse.startdate * 1000).toISOString().split('T')[0] : null,
            end_date: lmsCourse.enddate ? new Date(lmsCourse.enddate * 1000).toISOString().split('T')[0] : null,
            startdate: lmsCourse.startdate, // Unix timestamp
            enddate: lmsCourse.enddate, // Unix timestamp
            categoryname: lmsCourse.categoryname || 'Unknown',
            categoryid: lmsCourse.categoryid,
            course_type: 'online',
            seat_limit: 0,
            current_enrolled: 0,
            status: 'ongoing',
            visible: lmsCourse.visible === 1,
            is_lms_course: true,
          };
        }
      } catch (lmsError) {
        // Not an LMS course or error fetching, try regular API
        console.log('Not an LMS course or error fetching from LMS, trying regular API');
      }
      
      // If not found in LMS, fetch from regular API
      if (!courseData) {
        const response = await coursesAPI.getById(courseId);
        courseData = response.data;
      }
      
      setCourse(courseData);
      
      // Set comments if available (only for onsite courses, not LMS courses)
      if (courseData.is_lms_course) {
        // LMS courses don't have comments in local database
        setComments([]);
      } else if (courseData.comments) {
        setComments(courseData.comments);
      } else {
        // Fetch comments separately if not included (only for onsite courses)
        try {
          const commentsResponse = await coursesAPI.getComments(courseId);
          setComments(commentsResponse.data);
        } catch (err) {
          // Silently handle 404 for courses without comments endpoint
          if (err.response?.status !== 404) {
            console.error('Error fetching comments:', err);
          }
          setComments([]);
        }
      }
      
      // If course is in draft status, fetch draft data and mentor details (only for onsite courses)
      if (!courseData.is_lms_course && courseData.status === 'draft') {
        try {
          // Try to get draft data
          let draftMentorAssignments = [];
          if (courseData.draft && courseData.draft.mentor_assignments) {
            draftMentorAssignments = courseData.draft.mentor_assignments;
          } else {
            // Try fetching draft separately if not included
            try {
              const draftResponse = await coursesAPI.getDraft(courseId);
              if (draftResponse.data && draftResponse.data.mentor_assignments) {
                draftMentorAssignments = draftResponse.data.mentor_assignments;
              }
            } catch (draftErr) {
              // No draft exists yet
              console.log('No draft found for this course');
            }
          }
          
          if (draftMentorAssignments.length > 0) {
            const mentorIds = draftMentorAssignments.map(ma => ma.mentor_id);
            const mentorsResponse = await mentorsAPI.getAll('all');
            const mentorsMap = {};
            mentorsResponse.data.forEach(m => {
              mentorsMap[m.id] = m;
            });
            
            // Combine draft assignments with mentor details
            const draftMentors = draftMentorAssignments.map(ma => ({
              ...ma,
              mentor: mentorsMap[ma.mentor_id] || null,
              is_draft: true, // Flag to indicate this is a draft assignment
            }));
            
            setDraftMentorsWithDetails(draftMentors);
          } else {
            setDraftMentorsWithDetails([]);
          }
        } catch (err) {
          console.error('Error fetching draft mentor details:', err);
          setDraftMentorsWithDetails([]);
        }
      } else {
        setDraftMentorsWithDetails([]);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      setMessage({ type: 'error', text: 'Error fetching course details' });
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    setLoadingEnrollments(true);
    try {
      // Check if this is an LMS course
      if (course && course.is_lms_course) {
        // Fetch enrollments from LMS API
        const lmsResponse = await lmsAPI.getCourseEnrollments(courseId);
        const lmsEnrollments = lmsResponse.data.enrollments || [];
        
        // Map enrollments - we'll fetch progress in batches to avoid timeouts
        // First, map all enrollments with basic info
        const mappedEnrollments = lmsEnrollments.map((user) => ({
          id: user.id,
          student_id: user.id,
          course_id: parseInt(courseId),
          student_name: user.fullname,
          student_email: user.email,
          student_employee_id: user.employee_id || user.username,
          student_department: user.department || 'Unknown',
          progress: 0, // Will be updated below
          completion_status: 'Not Started', // Will be updated below
          // Date assigned: use firstaccess (when user first accessed the course) or course startdate
          date_assigned: user.firstaccess || course.startdate || null,
          // Last access: prefer lastcourseaccess (last access to this specific course) over lastaccess
          lastaccess: user.lastcourseaccess || user.lastaccess || null,
          is_lms_enrollment: true,
        }));
        
        // Set enrollments immediately so users are visible
        setEnrollments(mappedEnrollments);
        
        // Then fetch progress for each user in smaller batches (3 at a time)
        const batchSize = 3;
        for (let i = 0; i < mappedEnrollments.length; i += batchSize) {
          const batch = mappedEnrollments.slice(i, i + batchSize);
          await Promise.all(
            batch.map(async (enrollment) => {
              try {
                const userCoursesResponse = await lmsAPI.getUserCourses(enrollment.student_employee_id);
                const userCourses = userCoursesResponse.data.courses || [];
                const userCourse = userCourses.find(c => c.id === parseInt(courseId));
                
                const progress = userCourse?.progress || 0;
                const completionStatus = progress >= 100 ? 'Completed' : (progress > 0 ? 'In Progress' : 'Not Started');
                
                // Update the enrollment in the state
                setEnrollments(prev => prev.map(e => 
                  e.id === enrollment.id 
                    ? { ...e, progress, completion_status: completionStatus }
                    : e
                ));
              } catch (err) {
                console.error(`Error fetching progress for user ${enrollment.student_employee_id}:`, err);
                // Keep default values (0 progress, Not Started)
              }
            })
          );
        }
      } else {
        // Fetch enrollments from regular API for onsite courses
        const response = await enrollmentsAPI.getAll({ course_id: courseId });
        setEnrollments(response.data);
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      setMessage({ type: 'error', text: 'Error fetching enrollments' });
    } finally {
      setLoadingEnrollments(false);
    }
  };


  const handleApprove = async (enrollmentId) => {
    try {
      await enrollmentsAPI.approve({ enrollment_id: enrollmentId, approved: true }, 'Admin');
      setMessage({ type: 'success', text: 'Enrollment approved successfully' });
      fetchEnrollments();
      fetchCourse();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Error approving enrollment' });
    }
  };

  const handleReject = async (enrollmentId) => {
    try {
      await enrollmentsAPI.approve(
        { enrollment_id: enrollmentId, approved: false, rejection_reason: 'Rejected by admin' },
        'Admin'
      );
      setMessage({ type: 'success', text: 'Enrollment rejected' });
      fetchEnrollments();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Error rejecting enrollment' });
    }
  };

  const handleWithdraw = (enrollment) => {
    setSelectedEnrollment(enrollment);
    setWithdrawalReason('');
    setWithdrawDialogOpen(true);
  };

  const handleWithdrawConfirm = async () => {
    if (!withdrawalReason.trim()) {
      setMessage({ type: 'error', text: 'Please provide a reason for withdrawal' });
      return;
    }
    try {
      await enrollmentsAPI.withdraw(selectedEnrollment.id, withdrawalReason, 'Admin');
      setMessage({ type: 'success', text: 'Student withdrawn successfully' });
      setWithdrawDialogOpen(false);
      setSelectedEnrollment(null);
      setWithdrawalReason('');
      fetchEnrollments();
      fetchCourse();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Error withdrawing student' });
    }
  };

  const handleReapprove = async (enrollmentId) => {
    try {
      await enrollmentsAPI.reapprove(enrollmentId, 'Admin');
      setMessage({ type: 'success', text: 'Student reapproved successfully' });
      fetchEnrollments();
      fetchCourse();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Error reapproving student' });
    }
  };

  const handleOpenManualEnroll = async () => {
    setSelectedStudentId('');
    try {
      const response = await studentsAPI.getAll({ limit: 1000 });
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
      setMessage({ type: 'error', text: 'Error fetching students' });
    }
    setManualEnrollDialogOpen(true);
  };

  const handleManualEnrollConfirm = async () => {
    if (!selectedStudentId) {
      setMessage({ type: 'error', text: 'Please select a student' });
      return;
    }
    try {
      await enrollmentsAPI.create({
        student_id: parseInt(selectedStudentId),
        course_id: parseInt(courseId),
      });
      setMessage({ type: 'success', text: 'Student enrolled successfully' });
      setManualEnrollDialogOpen(false);
      setSelectedStudentId('');
      fetchEnrollments();
      fetchCourse();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Error enrolling student' });
    }
  };

  const handleImportFileChange = (event) => {
    setImportFile(event.target.files[0]);
  };

  const handleImportExcel = async () => {
    if (!importFile) {
      setMessage({ type: 'error', text: 'Please select a file' });
      return;
    }
    setImportLoading(true);
    try {
      const response = await importsAPI.uploadExcel(importFile, courseId);
      setMessage({ type: 'success', text: 'Enrollments imported successfully' });
      setImportDialogOpen(false);
      setImportFile(null);
      fetchEnrollments();
      fetchCourse();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Error importing file' });
    } finally {
      setImportLoading(false);
    }
  };

  const handleImportCSV = async () => {
    if (!importFile) {
      setMessage({ type: 'error', text: 'Please select a file' });
      return;
    }
    setImportLoading(true);
    try {
      const response = await importsAPI.uploadCSV(importFile, courseId);
      setMessage({ type: 'success', text: 'Enrollments imported successfully' });
      setImportDialogOpen(false);
      setImportFile(null);
      fetchEnrollments();
      fetchCourse();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Error importing file' });
    } finally {
      setImportLoading(false);
    }
  };

  const handleAttendanceFileChange = (event) => {
    setAttendanceFile(event.target.files[0]);
  };

  const handleUploadAttendance = async () => {
    if (!attendanceFile) {
      setMessage({ type: 'error', text: 'Please select a file' });
      return;
    }
    setAttendanceLoading(true);
    try {
      await completionsAPI.uploadAttendance(attendanceFile, courseId);
      setMessage({ type: 'success', text: 'Attendance and scores uploaded successfully' });
      setAttendanceDialogOpen(false);
      setAttendanceFile(null);
      fetchEnrollments();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Error uploading file' });
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleEditAttendance = async () => {
    if (!selectedEnrollmentForEdit) return;
    const classesAttended = parseInt(editClassesAttended);
    const score = parseFloat(editScore);
    if (isNaN(classesAttended) || classesAttended < 0) {
      setMessage({ type: 'error', text: 'Please enter a valid number of classes attended' });
      return;
    }
    if (isNaN(score) || score < 0 || score > 100) {
      setMessage({ type: 'error', text: 'Please enter a valid score between 0 and 100' });
      return;
    }
    try {
      await completionsAPI.updateEnrollmentAttendance(
        selectedEnrollmentForEdit.id,
        classesAttended,
        score
      );
      setMessage({ type: 'success', text: 'Attendance and score updated successfully' });
      setEditAttendanceDialogOpen(false);
      setSelectedEnrollmentForEdit(null);
      setEditClassesAttended('');
      setEditScore('');
      fetchEnrollments();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Error updating attendance' });
    }
  };

  const handleOpenAssignMentor = () => {
    setAssignMentorDialogOpen(true);
  };

  const handleAssignMentor = async (assignment) => {
    setAssignMentorLoading(true);
    try {
      // If course is in draft status, save to draft instead of directly assigning
      if (course && course.status === 'draft') {
        // Get existing draft or create new one
        let draftData = { mentor_assignments: [] };
        try {
          const existingDraft = await coursesAPI.getDraft(courseId);
          draftData = existingDraft.data;
        } catch (err) {
          // Draft doesn't exist yet, will create new one
        }
        
        // Remove existing assignment for this mentor if any
        const updatedAssignments = (draftData.mentor_assignments || []).filter(
          ma => ma.mentor_id !== assignment.mentor_id
        );
        updatedAssignments.push(assignment);
        
        // Save draft
        await coursesAPI.saveDraft(courseId, {
          ...draftData,
          mentor_assignments: updatedAssignments,
        });
        
        setMessage({ type: 'success', text: 'Mentor assignment saved to draft (temporary)' });
      } else {
        // Course is approved/ongoing, assign directly
        await coursesAPI.assignMentor(courseId, assignment);
        setMessage({ type: 'success', text: 'Mentor assigned successfully' });
      }
      
      fetchCourse();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Error assigning mentor' });
      throw error; // Re-throw so dialog can handle it
    } finally {
      setAssignMentorLoading(false);
    }
  };

  const handleEditMentor = async () => {
    if (!editMentorHours || parseFloat(editMentorHours) < 0) {
      setMessage({ type: 'error', text: 'Hours taught is required and must be >= 0' });
      return;
    }
    if (!editMentorAmount || parseFloat(editMentorAmount) < 0) {
      setMessage({ type: 'error', text: 'Amount paid is required and must be >= 0' });
      return;
    }
    
    if (!editingMentor) {
      setMessage({ type: 'error', text: 'No mentor selected' });
      return;
    }
    
    setEditMentorLoading(true);
    try {
      const mentorId = editingMentor.mentor_id || editingMentor.mentor?.id;
      const hoursTaught = parseFloat(editMentorHours) || 0;
      const amountPaid = parseFloat(editMentorAmount) || 0;
      
      // If course is in draft status, update draft
      if (course && course.status === 'draft') {
        // Get existing draft
        let draftData = { mentor_assignments: [], food_cost: null, other_cost: null };
        try {
          const existingDraft = await coursesAPI.getDraft(courseId);
          draftData = existingDraft.data;
        } catch (err) {
          setMessage({ type: 'error', text: 'Draft not found' });
          return;
        }
        
        // Ensure mentor_assignments is an array
        if (!draftData.mentor_assignments || !Array.isArray(draftData.mentor_assignments)) {
          draftData.mentor_assignments = [];
        }
        
        // Update mentor assignment in draft
        const updatedAssignments = draftData.mentor_assignments.map(ma => {
          if (ma.mentor_id === mentorId) {
            return {
              ...ma,
              hours_taught: hoursTaught,
              amount_paid: amountPaid,
            };
          }
          return ma;
        });
        
        // If mentor not found in draft, add it
        const mentorExists = updatedAssignments.some(ma => ma.mentor_id === mentorId);
        if (!mentorExists) {
          updatedAssignments.push({
            mentor_id: mentorId,
            hours_taught: hoursTaught,
            amount_paid: amountPaid,
          });
        }
        
        // Save updated draft
        const draftPayload = {
          mentor_assignments: updatedAssignments,
        };
        if (draftData.food_cost !== null && draftData.food_cost !== undefined) {
          draftPayload.food_cost = draftData.food_cost;
        }
        if (draftData.other_cost !== null && draftData.other_cost !== undefined) {
          draftPayload.other_cost = draftData.other_cost;
        }
        
        await coursesAPI.saveDraft(courseId, draftPayload);
        setMessage({ type: 'success', text: 'Mentor hours and payment updated in draft' });
      } else {
        // Course is approved/ongoing, update official assignment
        if (editingMentor.id) {
          // Update existing assignment
          await coursesAPI.assignMentor(courseId, {
            mentor_id: mentorId,
            hours_taught: hoursTaught,
            amount_paid: amountPaid,
          });
          setMessage({ type: 'success', text: 'Mentor hours and payment updated successfully' });
        } else {
          setMessage({ type: 'error', text: 'Cannot update: mentor assignment not found' });
        }
      }
      
      setEditMentorDialogOpen(false);
      setEditingMentor(null);
      setEditMentorHours('');
      setEditMentorAmount('');
      fetchCourse();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Error updating mentor' });
    } finally {
      setEditMentorLoading(false);
    }
  };

  const handleRemoveMentor = async (courseMentorId, mentorId = null) => {
    if (window.confirm('Are you sure you want to remove this mentor from the course?')) {
      try {
        // If course is in draft status, remove from draft instead
        if (course && course.status === 'draft') {
          // Get existing draft
          let draftData = { mentor_assignments: [] };
          try {
            const existingDraft = await coursesAPI.getDraft(courseId);
            draftData = existingDraft.data;
          } catch (err) {
            setMessage({ type: 'error', text: 'Draft not found' });
            return;
          }
          
          // Find the mentor_id from the draft assignment
          let mentorIdToRemove = mentorId;
          if (!mentorIdToRemove && courseMentorId) {
            // Try to find mentor_id from draft mentors
            const draftMentor = draftMentorsWithDetails.find(dm => dm.id === courseMentorId || `draft-${dm.mentor_id}` === courseMentorId);
            if (draftMentor) {
              mentorIdToRemove = draftMentor.mentor_id;
            }
          }
          
          if (!mentorIdToRemove) {
            setMessage({ type: 'error', text: 'Could not find mentor to remove' });
            return;
          }
          
          // Remove mentor assignment from draft
          const updatedAssignments = (draftData.mentor_assignments || []).filter(
            ma => ma.mentor_id !== mentorIdToRemove
          );
          
          // Save updated draft
          await coursesAPI.saveDraft(courseId, {
            ...draftData,
            mentor_assignments: updatedAssignments,
          });
          
          setMessage({ type: 'success', text: 'Mentor removed from draft' });
        } else {
          // Course is approved/ongoing, remove from official assignments
          await coursesAPI.removeCourseMentor(courseId, courseMentorId);
          setMessage({ type: 'success', text: 'Mentor removed successfully' });
        }
        
        fetchCourse();
      } catch (error) {
        setMessage({ type: 'error', text: error.response?.data?.detail || 'Error removing mentor' });
      }
    }
  };

  const handleAddExternalMentor = async (assignment) => {
    try {
      // If course is in draft status, save to draft instead of directly assigning
      if (course && course.status === 'draft') {
        // Get existing draft or create new one
        let draftData = { mentor_assignments: [], food_cost: null, other_cost: null };
        try {
          const existingDraft = await coursesAPI.getDraft(courseId);
          draftData = existingDraft.data;
        } catch (err) {
          // Draft doesn't exist yet, will create new one
        }
        
        // Ensure mentor_assignments is an array
        if (!draftData.mentor_assignments || !Array.isArray(draftData.mentor_assignments)) {
          draftData.mentor_assignments = [];
        }
        
        // Remove existing assignment for this mentor if any
        const updatedAssignments = draftData.mentor_assignments.filter(
          ma => ma.mentor_id !== assignment.mentor_id
        );
        updatedAssignments.push(assignment);
        
        // Save draft - only include fields that exist
        const draftPayload = {
          mentor_assignments: updatedAssignments,
        };
        if (draftData.food_cost !== null && draftData.food_cost !== undefined) {
          draftPayload.food_cost = draftData.food_cost;
        }
        if (draftData.other_cost !== null && draftData.other_cost !== undefined) {
          draftPayload.other_cost = draftData.other_cost;
        }
        
        await coursesAPI.saveDraft(courseId, draftPayload);
        
        setMessage({ type: 'success', text: 'External mentor created and saved to draft (temporary)' });
      } else {
        // Course is approved/ongoing, assign directly
        await coursesAPI.assignMentor(courseId, assignment);
        setMessage({ type: 'success', text: 'External mentor created and assigned successfully' });
      }
      
      fetchCourse();
    } catch (error) {
      console.error('Error creating external mentor:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Error creating external mentor';
      setMessage({ type: 'error', text: errorMessage });
      throw error; // Re-throw so dialog can handle it
    }
  };

  const handleOpenEditCosts = () => {
    // For draft courses, use draft costs; otherwise use official costs
    const foodCostValue = (course?.status === 'draft' && course?.draft?.food_cost !== null && course?.draft?.food_cost !== undefined)
      ? course.draft.food_cost
      : course?.food_cost;
    const otherCostValue = (course?.status === 'draft' && course?.draft?.other_cost !== null && course?.draft?.other_cost !== undefined)
      ? course.draft.other_cost
      : course?.other_cost;
    
    setFoodCost(foodCostValue?.toString() || '0');
    setOtherCost(otherCostValue?.toString() || '0');
    
    // Initialize mentor costs from course mentors or draft mentors
    const displayMentors = getDisplayMentors();
    if (displayMentors.length > 0) {
      setMentorCosts(
        displayMentors.map((cm) => ({
          id: cm.id || `draft-${cm.mentor_id}`,
          mentor_id: cm.mentor?.id || cm.mentor_id,
          mentor_name: cm.mentor?.name || 'Unknown',
          hours_taught: cm.hours_taught?.toString() || '0',
          amount_paid: cm.amount_paid?.toString() || '0',
        }))
      );
    } else {
      setMentorCosts([]);
    }
    setEditCostsDialogOpen(true);
  };

  const handleSaveCosts = async () => {
    setEditCostsLoading(true);
    try {
      // If course is in draft status, save to draft instead
      if (course && course.status === 'draft') {
        // Get existing draft or create new one
        let draftData = { mentor_assignments: [], food_cost: null, other_cost: null };
        try {
          const existingDraft = await coursesAPI.getDraft(courseId);
          draftData = existingDraft.data;
        } catch (err) {
          // Draft doesn't exist yet, will create new one
        }
        
        // Update costs and mentor assignments in draft
        const updatedDraft = {
          ...draftData,
          food_cost: parseFloat(foodCost) || 0,
          other_cost: parseFloat(otherCost) || 0,
          mentor_assignments: mentorCosts.map((mc) => ({
            mentor_id: mc.mentor_id,
            hours_taught: parseFloat(mc.hours_taught) || 0,
            amount_paid: parseFloat(mc.amount_paid) || 0,
          })),
        };
        
        await coursesAPI.saveDraft(courseId, updatedDraft);
        setMessage({ type: 'success', text: 'Costs saved to draft (temporary)' });
      } else {
        // Course is approved/ongoing, update directly
        await coursesAPI.updateCosts(courseId, {
          food_cost: parseFloat(foodCost) || 0,
          other_cost: parseFloat(otherCost) || 0,
        });
        
        // Update mentor costs
        if (mentorCosts.length > 0) {
          const updatePromises = mentorCosts.map((mc) =>
            coursesAPI.assignMentor(courseId, {
              mentor_id: mc.mentor_id,
              hours_taught: parseFloat(mc.hours_taught) || 0,
              amount_paid: parseFloat(mc.amount_paid) || 0,
            })
          );
          await Promise.all(updatePromises);
        }
        
        setMessage({ type: 'success', text: 'Costs updated successfully' });
      }
      
      setEditCostsDialogOpen(false);
      fetchCourse();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Error updating costs' });
    } finally {
      setEditCostsLoading(false);
    }
  };

  const handleMentorCostChange = (index, field, value) => {
    const updated = [...mentorCosts];
    updated[index] = { ...updated[index], [field]: value };
    setMentorCosts(updated);
  };

  // Comment handlers
  const handleAddComment = async () => {
    if (!newComment.trim()) {
      setMessage({ type: 'error', text: 'Comment cannot be empty' });
      return;
    }
    try {
      await coursesAPI.addComment(courseId, {
        comment: newComment.trim(),
        created_by: 'Admin', // TODO: Get from auth context
      });
      setMessage({ type: 'success', text: 'Comment added successfully' });
      setNewComment('');
      setCommentDialogOpen(false);
      fetchCourse();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Error adding comment' });
    }
  };

  // Approval handler
  const handleApproveCourse = async () => {
    // Simple confirmation popup
    if (!window.confirm('Are you sure you want to approve this course? This will move it from Planning to Ongoing Courses and make all draft changes permanent.')) {
      return;
    }
    
    try {
      // Use "Admin" as default approved_by value
      await coursesAPI.approveCourse(courseId, 'Admin');
      setMessage({ type: 'success', text: 'Course approved and moved to ongoing courses!' });
      fetchCourse();
      // Navigate to ongoing courses after a short delay
      setTimeout(() => {
        navigate('/courses/ongoing');
      }, 1500);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Error approving course' });
    }
  };

  const handleGenerateReport = async () => {
    try {
      const response = await coursesAPI.generateReport(courseId);
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const contentDisposition = response.headers['content-disposition'];
      let filename = `course_report_${courseId}.xlsx`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'Report generated and downloaded successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Error generating report' });
    }
  };

  // Get mentors to display (combine official and draft for draft courses)
  const getDisplayMentors = () => {
    if (course?.status === 'draft') {
      // For draft courses, show draft mentors (if any exist)
      if (draftMentorsWithDetails.length > 0) {
        return draftMentorsWithDetails.map((dm, index) => ({
          id: `draft-${dm.mentor_id}-${index}`, // Unique ID for draft assignments
          mentor_id: dm.mentor_id,
          mentor: dm.mentor,
          hours_taught: dm.hours_taught,
          amount_paid: dm.amount_paid,
          is_draft: true,
        }));
      } else {
        // No draft mentors yet
        return [];
      }
    } else {
      // For approved/ongoing courses, show official mentors
      return course?.mentors || [];
    }
  };

  const calculateTotalMentorCost = () => {
    let total = 0;
    // Add official mentor costs
    if (course?.mentors) {
      total += course.mentors.reduce((sum, cm) => sum + parseFloat(cm.amount_paid || 0), 0);
    }
    // Add draft mentor costs if course is in draft status
    if (course?.status === 'draft' && draftMentorsWithDetails.length > 0) {
      total += draftMentorsWithDetails.reduce((sum, dm) => sum + parseFloat(dm.amount_paid || 0), 0);
    }
    return total;
  };

  const calculateTotalTrainingCost = () => {
    const mentorCost = calculateTotalMentorCost();
    // For draft courses, use draft costs if available
    const foodCost = (course?.status === 'draft' && course?.draft?.food_cost !== null && course?.draft?.food_cost !== undefined)
      ? parseFloat(course.draft.food_cost)
      : parseFloat(course?.food_cost || 0);
    const otherCost = (course?.status === 'draft' && course?.draft?.other_cost !== null && course?.draft?.other_cost !== undefined)
      ? parseFloat(course.draft.other_cost)
      : parseFloat(course?.other_cost || 0);
    return mentorCost + foodCost + otherCost;
  };

  const formatCurrency = (value) => {
    const numericValue = Number(value || 0);
    if (Number.isNaN(numericValue)) {
      return '0';
    }
    return numericValue.toLocaleString('en-US', { minimumFractionDigits: 0 });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!course) {
    return (
      <Box>
        <Alert severity="error">Course not found</Alert>
        <Button onClick={() => navigate('/courses')} startIcon={<ArrowBack />}>
          Back to Courses
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/courses')}
        sx={{
          mb: 3,
          textTransform: 'none',
          fontSize: '1rem',
          color: theme.palette.primary.main,
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
          },
        }}
      >
        Back to Courses
      </Button>

      {message && (
        <Alert 
          severity={message.type}
          onClose={() => setMessage(null)}
          sx={{ 
            mb: 3,
            borderRadius: '8px',
            border: 'none',
          }} 
        >
          {message.text}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      ) : (
        <Box>
          {/* Header Card with Gradient */}
          <Card
            sx={{
              mb: 3,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.info.main} 100%)`,
              color: 'white',
              boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={2} mb={1.5}>
                <School sx={{ fontSize: 40 }} />
                <Box flexGrow={1}>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {course?.name || course?.fullname}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.95, fontSize: '1rem' }}>
                    Batch Code: {course?.batch_code}
                  </Typography>
                </Box>
              </Box>
              {course?.description && (
                <Typography variant="body2" sx={{ mt: 2, opacity: 0.9, fontStyle: 'italic', fontSize: '0.95rem' }}>
                  {course.description}
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* LMS Course Details Card (for online courses) */}
          {course?.is_lms_course && (
            <Card
              sx={{
                mb: 3,
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                backgroundColor: alpha(theme.palette.info.main, 0.03),
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: theme.palette.info.main }}>
                  Online Course Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Full Name
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {course.fullname || course.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Category
                    </Typography>
                    <Chip
                      label={course.categoryname || 'Unknown'}
                      size="small"
                      sx={{
                        background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                        color: '#1e40af',
                        fontWeight: 600,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Start Date
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {course.startdate 
                        ? new Date(course.startdate * 1000).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Not set'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                      End Date
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {course.enddate 
                        ? new Date(course.enddate * 1000).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Not set'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Stat Cards */}
          {isOnlineCourse ? (
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={4}>
                <Card
                  sx={{
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    height: '100%',
                  }}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <People sx={{ fontSize: 20, color: theme.palette.primary.main }} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Total Assigned
                      </Typography>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 0.5 }}>
                      {loadingEnrollments ? '...' : enrollments.length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Students enrolled in this course
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  height: '100%',
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <People sx={{ fontSize: 20, color: theme.palette.primary.main }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Enrollment
                    </Typography>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 0.5 }}>
                    {course?.current_enrolled}/{course?.seat_limit}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {course?.seat_limit ? `${Math.min(100, Math.round((course.current_enrolled / course.seat_limit) * 100))}% filled` : 'No limit set'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`,
                  backgroundColor: alpha(theme.palette.success.main, 0.05),
                  height: '100%',
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Event sx={{ fontSize: 20, color: theme.palette.success.main }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Classes
                    </Typography>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.success.main, mb: 0.5 }}>
                    {course?.total_classes_offered || 'N/A'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total sessions planned
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.15)}`,
                  backgroundColor: alpha(theme.palette.warning.main, 0.05),
                  height: '100%',
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <CalendarToday sx={{ fontSize: 20, color: theme.palette.warning.main }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Status
                    </Typography>
                  </Box>
                  <Chip
                    label={course?.status?.toUpperCase()}
                    color={
                      course?.status === 'completed'
                        ? 'success'
                        : course?.status === 'ongoing'
                        ? 'primary'
                        : 'warning'
                    }
                    sx={{ fontWeight: 600 }}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
                  backgroundColor: alpha(theme.palette.info.main, 0.05),
                  height: '100%',
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <AccessTime sx={{ fontSize: 20, color: theme.palette.info.main }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Duration
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.info.main, mb: 0.5, fontSize: '0.95rem' }}>
                    {formatDateRangeWithFromTo(course?.start_date, course?.end_date)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          )}

          {/* Action Buttons - Only for onsite courses */}
          {!isOnlineCourse && (
          <Card sx={{ mb: 3, border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
            <CardContent>
              <Box display="flex" gap={2} flexWrap="wrap">
                {course?.status === 'draft' && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircle />}
                    onClick={handleApproveCourse}
                    sx={{ fontWeight: 600 }}
                  >
                    Approve Course
                  </Button>
                )}
                <Button
                  variant="contained"
                  startIcon={<PersonAdd />}
                  onClick={handleOpenManualEnroll}
                  sx={{
                    background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    boxShadow: '0 4px 12px rgba(30, 64, 175, 0.25)',
                  }}
                >
                  Manual Enrollment
                </Button>
                <Button
                  variant="contained"
                  startIcon={<UploadFile />}
                  onClick={() => setImportDialogOpen(true)}
                  sx={{
                    background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    boxShadow: '0 4px 12px rgba(30, 64, 175, 0.25)',
                  }}
                >
                  Import Enrollments
                </Button>
                <Button
                  variant="contained"
                  startIcon={<UploadFile />}
                  onClick={() => setAttendanceDialogOpen(true)}
                  sx={{
                    background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    boxShadow: '0 4px 12px rgba(30, 64, 175, 0.25)',
                  }}
                >
                  Upload Attendance & Scores
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Download />}
                  onClick={handleGenerateReport}
                  sx={{
                    background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    boxShadow: '0 4px 12px rgba(30, 64, 175, 0.25)',
                  }}
                >
                  Generate Report
                </Button>
              </Box>
            </CardContent>
          </Card>
          )}

          {/* Course Schedule Card - Only for onsite courses */}
          {!isOnlineCourse && (
          <Card sx={{ mb: 3, border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2.5}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <CalendarToday color="primary" sx={{ fontSize: 24 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Course Schedule
                  </Typography>
                </Box>
                <Button 
                  variant="outlined" 
                  size="small" 
                  startIcon={<Edit />}
                  onClick={() => {
                    setEditCourseData({
                      start_date: course.start_date ? new Date(course.start_date) : null,
                      end_date: course.end_date ? new Date(course.end_date) : null,
                      seat_limit: course.seat_limit || 0,
                      total_classes_offered: course.total_classes_offered || '',
                    });
                    setEditClassSchedule(course.class_schedule || []);
                    setEditCourseDialogOpen(true);
                  }}
                >
                  Edit Details
                </Button>
              </Box>
              <Divider sx={{ mb: 2.5 }} />
              
              {course?.class_schedule && course.class_schedule.length > 0 ? (
                <Box display="flex" flexWrap="wrap" gap={2}>
                  {course.class_schedule.map((schedule, index) => (
                    <Chip
                      key={`${schedule.day}-${index}`}
                      label={`${schedule.day} ${convertTo12HourFormat(schedule.start_time)} - ${convertTo12HourFormat(schedule.end_time)}`}
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 500, p: 2 }}
                    />
                  ))}
                </Box>
              ) : (
                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                  No class schedule set. Click "Edit Details" to add schedule times.
                </Alert>
              )}
            </CardContent>
          </Card>
          )}

          {/* Assigned Mentors Card - Only for onsite courses */}
          {!isOnlineCourse && (
          <Card sx={{ mb: 3, border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2.5} flexWrap="wrap" gap={2}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Person color="primary" sx={{ fontSize: 24 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Assigned Mentors
                  </Typography>
                </Box>
                <Box display="flex" gap={1}>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    startIcon={<Add />}
                    onClick={handleOpenAssignMentor}
                  >
                    Assign Internal
                  </Button>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    startIcon={<Add />}
                    onClick={() => setAddExternalMentorDialogOpen(true)}
                  >
                    Add External
                  </Button>
                </Box>
              </Box>
              <Divider sx={{ mb: 2.5 }} />
              
            {(() => {
              const displayMentors = getDisplayMentors();
              return displayMentors.length > 0 ? (
                <TableContainer
                  sx={{
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                        <TableCell sx={{ fontWeight: 600 }}>Mentor Name</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Hours Taught</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Amount Paid</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {displayMentors.map((cm) => (
                        <TableRow 
                          key={cm.id || `draft-${cm.mentor_id}`}
                          sx={{
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.03),
                            },
                            ...(cm.is_draft && {
                              backgroundColor: alpha(theme.palette.warning.main, 0.05),
                              borderLeft: `3px solid ${theme.palette.warning.main}`,
                            }),
                          }}
                        >
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Person fontSize="small" color="action" />
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {cm.mentor?.name || 'Unknown'}
                              </Typography>
                              {cm.is_draft && (
                                <Chip 
                                  label="Draft" 
                                  size="small" 
                                  color="warning"
                                  sx={{ height: 20, fontSize: '0.65rem' }}
                                />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={cm.mentor?.is_internal ? 'Internal' : 'External'}
                              size="small"
                              color={cm.mentor?.is_internal ? 'primary' : 'secondary'}
                              sx={{ fontWeight: 500 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <AccessTime fontSize="small" color="action" />
                              <Typography variant="body2">{cm.hours_taught}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                Tk {parseFloat(cm.amount_paid || 0).toFixed(2)}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Box display="flex" gap={0.5} justifyContent="center">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => {
                                  setEditingMentor(cm);
                                  setEditMentorHours(cm.hours_taught?.toString() || '0');
                                  setEditMentorAmount(cm.amount_paid?.toString() || '0');
                                  setEditMentorDialogOpen(true);
                                }}
                                sx={{
                                  '&:hover': {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                  },
                                }}
                                title="Edit hours and payment"
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveMentor(cm.id || `draft-${cm.mentor_id}`, cm.mentor_id)}
                                sx={{
                                  '&:hover': {
                                    backgroundColor: alpha(theme.palette.error.main, 0.1),
                                  },
                                }}
                                title={cm.is_draft ? "Remove from draft" : "Remove mentor"}
                              >
                                <Remove fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.grey[500], 0.05),
                    border: `1px dashed ${alpha(theme.palette.grey[500], 0.3)}`,
                  }}
                >
                  <Person sx={{ fontSize: 48, color: 'text.secondary', mb: 1, opacity: 0.5 }} />
                  <Typography variant="body2" color="text.secondary">
                    No mentors assigned yet
                  </Typography>
                </Box>
              );
            })()}
            </CardContent>
          </Card>
          )}

          {/* Course Costs Section - Only for onsite courses */}
          {!isOnlineCourse && (
          <Card sx={{ mb: 3, border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2.5} flexWrap="wrap" gap={2}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <AccountBalance color="primary" sx={{ fontSize: 24 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Course Costs Breakdown
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Edit />}
                  onClick={handleOpenEditCosts}
                >
                  Edit Costs
                </Button>
              </Box>
              <Divider sx={{ mb: 2.5 }} />
              
              {/* Accounting Books Layout - Stacked vertically */}
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: 0 }}>
                  {/* Total Mentor Costs */}
                  <Box
                    sx={{
                      p: 2.5,
                      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={2}>
                      <Person color="primary" sx={{ fontSize: 24 }} />
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        Total Mentor Costs
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      Tk {calculateTotalMentorCost().toFixed(2)}
                    </Typography>
                  </Box>
                  
                  {/* Food Cost */}
                  <Box
                    sx={{
                      p: 2.5,
                      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={2}>
                      <Restaurant color="success" sx={{ fontSize: 24 }} />
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        Food Cost
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                      Tk {parseFloat((course?.status === 'draft' && course?.draft?.food_cost !== null && course?.draft?.food_cost !== undefined) 
                        ? course.draft.food_cost 
                        : (course?.food_cost || 0)).toFixed(2)}
                    </Typography>
                  </Box>
                  
                  {/* Other Cost */}
                  <Box
                    sx={{
                      p: 2.5,
                      borderBottom: `2px solid ${theme.palette.primary.main}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={2}>
                      <Receipt color="info" sx={{ fontSize: 24 }} />
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        Other Cost
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'info.main' }}>
                      Tk {parseFloat((course?.status === 'draft' && course?.draft?.other_cost !== null && course?.draft?.other_cost !== undefined) 
                        ? course.draft.other_cost 
                        : (course?.other_cost || 0)).toFixed(2)}
                    </Typography>
                  </Box>
                  
                  {/* Total Training Cost - Final Sum */}
                  <Box
                    sx={{
                      p: 3,
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={2}>
                      <Calculate color="primary" sx={{ fontSize: 28 }} />
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        Total Training Cost
                      </Typography>
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      Tk {calculateTotalTrainingCost().toFixed(2)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
          )}

          {/* Comment History Section - Only for onsite courses */}
          {!isOnlineCourse && (
          <Card sx={{ mb: 3, border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2.5}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Comment color="primary" sx={{ fontSize: 24 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Comment/Update History
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Add />}
                  onClick={() => setCommentDialogOpen(true)}
                >
                  Add Comment
                </Button>
              </Box>
              <Divider sx={{ mb: 2.5 }} />
              {comments.length > 0 ? (
                <List>
                  {comments.map((comment) => (
                    <ListItem
                      key={comment.id}
                      sx={{
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        py: 2,
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {comment.created_by}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDateTimeForDisplay(comment.created_at)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {comment.comment}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No comments yet. Add the first comment to track updates.
                </Typography>
              )}
            </CardContent>
          </Card>
          )}

          {/* Enrollment Sections */}
          {loadingEnrollments ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Online Course Enrollment Sections */}
              {isOnlineCourse ? (
                <>
                  {/* Completed Students */}
                  {completedOnline.length > 0 && (
                    <Card sx={{ 
                      mb: 3,
                      borderLeft: `4px solid ${theme.palette.success.main}`,
                      backgroundColor: alpha(theme.palette.success.main, 0.05),
                    }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: theme.palette.success.main }}>
                          Completed ({completedOnline.length})
                        </Typography>
                        <OnlineEnrollmentTable enrollments={completedOnline} />
                      </CardContent>
                    </Card>
                  )}

                  {/* In Progress Students */}
                  {inProgressOnline.length > 0 && (
                    <Card sx={{ 
                      mb: 3,
                      borderLeft: `4px solid ${theme.palette.warning.main}`,
                      backgroundColor: alpha(theme.palette.warning.main, 0.05),
                    }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: theme.palette.warning.main }}>
                          In Progress ({inProgressOnline.length})
                        </Typography>
                        <OnlineEnrollmentTable enrollments={inProgressOnline} />
                      </CardContent>
                    </Card>
                  )}

                  {/* Not Started Students */}
                  {notStartedOnline.length > 0 && (
                    <Card sx={{ 
                      mb: 3,
                      borderLeft: `4px solid ${theme.palette.grey[500]}`,
                      backgroundColor: alpha(theme.palette.grey[500], 0.05),
                    }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: theme.palette.grey[700] }}>
                          Not Started ({notStartedOnline.length})
                        </Typography>
                        <OnlineEnrollmentTable enrollments={notStartedOnline} />
                      </CardContent>
                    </Card>
                  )}

                  {enrollments.length === 0 && (
                    <Card>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary" align="center" py={3}>
                          No students enrolled in this online course yet.
                        </Typography>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <>
              {/* Approved/Enrolled Students */}
              {approvedEnrollments.length > 0 && (
                <Card sx={{ 
                  mb: 3,
                  borderLeft: `4px solid ${theme.palette.primary.main}`,
                  backgroundColor: alpha(theme.palette.primary.main, 0.02),
                }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: theme.palette.primary.main }}>
                      Approved/Enrolled Students ({approvedEnrollments.length})
                    </Typography>
                    <EnrollmentTable
                      enrollments={approvedEnrollments}
                      onViewDetails={(e) => {
                        setSelectedUserEnrollment(e);
                        setUserDetailsOpen(true);
                      }}
                      onEditAttendance={(e) => {
                        setSelectedEnrollmentForEdit(e);
                        setEditClassesAttended(e.present?.toString() || '');
                        setEditScore(e.score?.toString() || '');
                        setEditAttendanceDialogOpen(true);
                      }}
                      onWithdraw={handleWithdraw}
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
                      onApprove={handleApprove}
                      onReject={handleReject}
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
                      onApprove={handleApprove}
                      onReject={handleReject}
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
                      onViewDetails={(e) => {
                        setSelectedUserEnrollment(e);
                        setUserDetailsOpen(true);
                      }}
                      onReapprove={handleReapprove}
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
                      onReapprove={handleReapprove}
                      showActions={true}
                      actionsHeaderText="Add"
                    />
                  </CardContent>
                </Card>
              )}

              {enrollments.length === 0 && (
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" align="center" py={3}>
                      No enrollments yet. Use "Import Enrollments" or "Manual Enrollment" to add students.
                    </Typography>
                  </CardContent>
                </Card>
              )}
                </>
              )}
            </>
          )}
        </Box>
      )}

      {/* Dialogs */}
      {/* Withdraw Dialog */}
      <Dialog open={withdrawDialogOpen} onClose={() => setWithdrawDialogOpen(false)}>
        <DialogTitle>Withdraw Student</DialogTitle>
        <DialogContent>
          <TextField
            label="Withdrawal Reason"
            fullWidth
            multiline
            rows={3}
            value={withdrawalReason}
            onChange={(e) => setWithdrawalReason(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWithdrawDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleWithdrawConfirm} variant="contained" color="error">
            Withdraw
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manual Enrollment Dialog */}
      <Dialog open={manualEnrollDialogOpen} onClose={() => setManualEnrollDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Manual Enrollment</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={students}
            getOptionLabel={(option) => `${option.name} (${option.employee_id})`}
            value={students.find(s => s.id.toString() === selectedStudentId) || null}
            onChange={(event, newValue) => setSelectedStudentId(newValue?.id.toString() || '')}
            renderInput={(params) => (
              <TextField {...params} label="Select Student" placeholder="Search by name or employee ID" />
            )}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManualEnrollDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleManualEnrollConfirm} variant="contained" disabled={!selectedStudentId}>
            Enroll
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Import Enrollments</DialogTitle>
        <DialogContent>
          {/* Preview Section */}
          <Box>
            <Box 
              display="flex" 
              alignItems="center" 
              justifyContent="space-between"
              sx={{ 
                cursor: 'pointer',
                p: 1,
                borderRadius: 1,
                '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.05) }
              }}
              onClick={() => setShowImportPreview(!showImportPreview)}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Visibility fontSize="small" />
                Preview Expected Format
              </Typography>
              <IconButton size="small">
                {showImportPreview ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
            
            <Collapse in={showImportPreview}>
              <Box mt={1} sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end', borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Download />}
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = '/ADA2025A_registration.xlsx';
                      link.download = 'enrollment_template.xlsx';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    sx={{ textTransform: 'none' }}
                  >
                    Download Template
                  </Button>
                </Box>
                <TableContainer sx={{ maxHeight: 400, overflowX: 'auto' }}>
                  <Table size="small" sx={{ minWidth: 1000 }}>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>employee_id</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>name</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>email</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>department</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>designation</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>course_name</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>batch_code</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {enrollmentPreviewData.map((row, index) => (
                        <TableRow 
                          key={index}
                          sx={{ 
                            '&:nth-of-type(odd)': { backgroundColor: alpha(theme.palette.primary.main, 0.02) }
                          }}
                        >
                          <TableCell sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{row.employee_id}</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{row.name}</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{row.email}</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                            <Chip label={row.department} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{row.designation}</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{row.course_name}</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{row.batch_code}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box sx={{ p: 1, backgroundColor: alpha(theme.palette.info.main, 0.05), borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                   
                  </Typography>
                </Box>
              </Box>
            </Collapse>
          </Box>
          
          <Box sx={{ mt: 3 }}>
            <Button variant="outlined" component="label" startIcon={<UploadFile />} fullWidth>
              Select File
              <input type="file" hidden accept=".xlsx,.xls,.csv" onChange={handleImportFileChange} />
            </Button>
            {importFile && (
              <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                Selected: <strong>{importFile.name}</strong>
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setImportDialogOpen(false);
            setImportFile(null);
            setShowImportPreview(false);
          }}>Cancel</Button>
          <Button onClick={handleImportCSV} variant="outlined" disabled={!importFile || importLoading}>
            Upload CSV
          </Button>
          <Button onClick={handleImportExcel} variant="contained" disabled={!importFile || importLoading}>
            Upload Excel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Attendance Dialog */}
      <Dialog open={attendanceDialogOpen} onClose={() => setAttendanceDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Upload Attendance & Scores</DialogTitle>
        <DialogContent>
          {/* Preview Section */}
          <Box>
            <Box 
              display="flex" 
              alignItems="center" 
              justifyContent="space-between"
              sx={{ 
                cursor: 'pointer',
                p: 1,
                borderRadius: 1,
                '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.05) }
              }}
              onClick={() => setShowAttendancePreview(!showAttendancePreview)}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Visibility fontSize="small" />
                Preview Expected Format
              </Typography>
              <IconButton size="small">
                {showAttendancePreview ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
            
            <Collapse in={showAttendancePreview}>
              <Box mt={1} sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end', borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Download />}
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = '/ADA2025A_completion.xlsx';
                      link.download = 'attendance_template.xlsx';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    sx={{ textTransform: 'none' }}
                  >
                    Download Template
                  </Button>
                </Box>
                <TableContainer>
                  <Table size="small" sx={{ minWidth: 650 }}>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>name</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>email</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>total_classes_attended</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>score</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {attendancePreviewData.map((row, index) => (
                        <TableRow 
                          key={index}
                          sx={{ 
                            '&:nth-of-type(odd)': { backgroundColor: alpha(theme.palette.primary.main, 0.02) }
                          }}
                        >
                          <TableCell sx={{ fontSize: '0.75rem' }}>{row.name}</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>{row.email}</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>{row.total_classes_attended}</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>{row.score}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box sx={{ p: 1, backgroundColor: alpha(theme.palette.info.main, 0.05), borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                   
                  </Typography>
                </Box>
              </Box>
            </Collapse>
          </Box>
          
          <Box sx={{ mt: 3 }}>
            <Button variant="outlined" component="label" startIcon={<UploadFile />} fullWidth>
              Select File
              <input type="file" hidden accept=".xlsx,.xls,.csv" onChange={handleAttendanceFileChange} />
            </Button>
            {attendanceFile && (
              <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                Selected: <strong>{attendanceFile.name}</strong>
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setAttendanceDialogOpen(false);
            setAttendanceFile(null);
            setShowAttendancePreview(false);
          }}>Cancel</Button>
          <Button onClick={handleUploadAttendance} variant="contained" disabled={!attendanceFile || attendanceLoading}>
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Attendance Dialog */}
      <Dialog open={editAttendanceDialogOpen} onClose={() => setEditAttendanceDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Attendance & Score</DialogTitle>
        <DialogContent>
          <TextField
            label="Classes Attended"
            type="number"
            fullWidth
            value={editClassesAttended}
            onChange={(e) => setEditClassesAttended(e.target.value)}
            sx={{ mt: 2 }}
            inputProps={{ min: 0, max: course.total_classes_offered }}
          />
          <TextField
            label="Score"
            type="number"
            fullWidth
            value={editScore}
            onChange={(e) => setEditScore(e.target.value)}
            sx={{ mt: 2 }}
            inputProps={{ min: 0, max: 100, step: 0.1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditAttendanceDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditAttendance} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Internal Mentor Dialog */}
      <AssignInternalMentorDialog
        open={assignMentorDialogOpen}
        onClose={() => setAssignMentorDialogOpen(false)}
        onAssign={handleAssignMentor}
        isDraft={course?.status === 'draft'}
      />

      {/* Add External Mentor Dialog */}
      <AddExternalMentorDialog
        open={addExternalMentorDialogOpen}
        onClose={() => setAddExternalMentorDialogOpen(false)}
        onAdd={handleAddExternalMentor}
        isDraft={course?.status === 'draft'}
      />

      {/* Edit Mentor Dialog */}
      <Dialog open={editMentorDialogOpen} onClose={() => {
        setEditMentorDialogOpen(false);
        setEditingMentor(null);
        setEditMentorHours('');
        setEditMentorAmount('');
      }} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Mentor Hours & Payment</DialogTitle>
        <DialogContent>
          {editingMentor && (
            <>
              <Typography variant="body1" sx={{ mt: 2, mb: 2, fontWeight: 500 }}>
                Mentor: {editingMentor.mentor?.name || 'Unknown'}
              </Typography>
              <TextField
                label="Hours Taught"
                type="number"
                fullWidth
                required
                value={editMentorHours}
                onChange={(e) => setEditMentorHours(e.target.value)}
                sx={{ mt: 2 }}
                InputProps={{
                  inputProps: { min: 0, step: 0.01 },
                }}
              />
              <TextField
                label="Amount Paid"
                type="number"
                fullWidth
                required
                value={editMentorAmount}
                onChange={(e) => setEditMentorAmount(e.target.value)}
                sx={{ mt: 2 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">Tk</InputAdornment>,
                  inputProps: { min: 0, step: 0.01 },
                }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setEditMentorDialogOpen(false);
            setEditingMentor(null);
            setEditMentorHours('');
            setEditMentorAmount('');
          }}>Cancel</Button>
          <Button onClick={handleEditMentor} variant="contained" disabled={editMentorLoading}>
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Costs Dialog */}
      <Dialog open={editCostsDialogOpen} onClose={() => setEditCostsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Course Costs</DialogTitle>
        <DialogContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mt: 1, mb: 2 }}>
            Course Costs
          </Typography>
          <TextField
            label="Food Cost"
            type="number"
            fullWidth
            value={foodCost}
            onChange={(e) => setFoodCost(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: <InputAdornment position="start">Tk</InputAdornment>,
            }}
            inputProps={{ min: 0, step: 0.01 }}
          />
          <TextField
            label="Other Cost"
            type="number"
            fullWidth
            value={otherCost}
            onChange={(e) => setOtherCost(e.target.value)}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: <InputAdornment position="start">Tk</InputAdornment>,
            }}
            inputProps={{ min: 0, step: 0.01 }}
          />

          <Divider sx={{ my: 3 }} />

          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Mentor Costs
            </Typography>
          </Box>
          
          {mentorCosts.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              No mentors assigned. Use "Assign Internal Mentor" or "Add External Mentor" buttons to add mentors.
            </Typography>
          ) : (
            <Box display="flex" flexDirection="column" gap={2} sx={{ mb: 2 }}>
              {mentorCosts.map((mc, index) => (
                <Card key={mc.id} variant="outlined" sx={{ p: 2 }}>
                  <Box display="flex" flexDirection="column" gap={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {mc.mentor_name}
                      </Typography>
                    </Box>
                    <Box display="flex" gap={2}>
                      <TextField
                        label="Hours Taught"
                        type="number"
                        fullWidth
                        value={mc.hours_taught}
                        onChange={(e) => handleMentorCostChange(index, 'hours_taught', e.target.value)}
                        size="small"
                        inputProps={{ min: 0, step: 0.1 }}
                      />
                      <TextField
                        label="Amount Paid"
                        type="number"
                        fullWidth
                        value={mc.amount_paid}
                        onChange={(e) => handleMentorCostChange(index, 'amount_paid', e.target.value)}
                        size="small"
                        InputProps={{
                          startAdornment: <InputAdornment position="start">Tk</InputAdornment>,
                        }}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </Box>
                  </Box>
                </Card>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditCostsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveCosts} variant="contained" disabled={editCostsLoading}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Details Dialog */}
      <UserDetailsDialog
        open={userDetailsOpen}
        onClose={() => setUserDetailsOpen(false)}
        enrollment={selectedUserEnrollment}
      />

      {/* Comment Dialog */}
      <Dialog open={commentDialogOpen} onClose={() => setCommentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Comment/Update</DialogTitle>
        <DialogContent>
          <TextField
            label="Comment"
            multiline
            rows={4}
            fullWidth
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            sx={{ mt: 2 }}
            placeholder="Add a comment or update about this course..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setCommentDialogOpen(false);
            setNewComment('');
          }}>
            Cancel
          </Button>
          <Button onClick={handleAddComment} variant="contained">
            Add Comment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Course Details Dialog */}
      <Dialog open={editCourseDialogOpen} onClose={() => setEditCourseDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Course Details</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={editCourseData.start_date}
                onChange={(newValue) => {
                  setEditCourseData({ ...editCourseData, start_date: newValue });
                  // If end date is before new start date, clear it
                  if (editCourseData.end_date && newValue && editCourseData.end_date < newValue) {
                    setEditCourseData(prev => ({ ...prev, end_date: null }));
                  }
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                  },
                }}
              />
              <DatePicker
                label="End Date"
                value={editCourseData.end_date}
                onChange={(newValue) => {
                  // Validate that end date is not before start date
                  if (newValue && editCourseData.start_date && newValue < editCourseData.start_date) {
                    setMessage({ type: 'error', text: 'End date cannot be before start date' });
                    return;
                  }
                  setEditCourseData({ ...editCourseData, end_date: newValue });
                }}
                minDate={editCourseData.start_date || undefined}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: editCourseData.end_date && editCourseData.start_date && editCourseData.end_date < editCourseData.start_date,
                    helperText: editCourseData.end_date && editCourseData.start_date && editCourseData.end_date < editCourseData.start_date 
                      ? 'End date cannot be before start date' 
                      : '',
                  },
                }}
              />
            </LocalizationProvider>
            <TextField
              label="Seat Limit"
              type="number"
              value={editCourseData.seat_limit}
              onChange={(e) => setEditCourseData({ ...editCourseData, seat_limit: parseInt(e.target.value) || 0 })}
              fullWidth
              required
              inputProps={{ min: 0 }}
            />
            <TextField
              label="Total Classes Offered"
              type="number"
              value={editCourseData.total_classes_offered}
              onChange={(e) => setEditCourseData({ ...editCourseData, total_classes_offered: e.target.value })}
              fullWidth
              helperText="Used for calculating attendance percentage"
              inputProps={{ min: 0 }}
            />
            
            <Divider sx={{ my: 2 }} />
            
            {/* Class Schedule Section */}
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <AccessTime color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Class Schedule
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Add />}
                  onClick={() => setEditClassSchedule([...editClassSchedule, { day: '', start_time: '', end_time: '' }])}
                >
                  Add Schedule
                </Button>
              </Box>
              
              {editClassSchedule.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  No schedule added. Click "Add Schedule" to specify class days and times.
                </Typography>
              ) : (
                <Box display="flex" flexDirection="column" gap={2}>
                  {editClassSchedule.map((schedule, index) => (
                    <Card key={index} variant="outlined" sx={{ p: 2 }}>
                      <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
                        <TextField
                          select
                          label="Day"
                          value={schedule.day}
                          onChange={(e) => {
                            const updated = [...editClassSchedule];
                            updated[index].day = e.target.value;
                            setEditClassSchedule(updated);
                          }}
                          sx={{ minWidth: 150 }}
                          required
                        >
                          <MenuItem value="Monday">Monday</MenuItem>
                          <MenuItem value="Tuesday">Tuesday</MenuItem>
                          <MenuItem value="Wednesday">Wednesday</MenuItem>
                          <MenuItem value="Thursday">Thursday</MenuItem>
                          <MenuItem value="Friday">Friday</MenuItem>
                          <MenuItem value="Saturday">Saturday</MenuItem>
                          <MenuItem value="Sunday">Sunday</MenuItem>
                        </TextField>
                        <TextField
                          label="Start Time"
                          type="time"
                          value={schedule.start_time}
                          onChange={(e) => {
                            const updated = [...editClassSchedule];
                            updated[index].start_time = e.target.value;
                            setEditClassSchedule(updated);
                          }}
                          InputLabelProps={{ shrink: true }}
                          sx={{ minWidth: 150 }}
                          required
                        />
                        <TextField
                          label="End Time"
                          type="time"
                          value={schedule.end_time}
                          onChange={(e) => {
                            const updated = [...editClassSchedule];
                            updated[index].end_time = e.target.value;
                            setEditClassSchedule(updated);
                          }}
                          InputLabelProps={{ shrink: true }}
                          sx={{ minWidth: 150 }}
                          required
                        />
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setEditClassSchedule(editClassSchedule.filter((_, i) => i !== index))}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditCourseDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={async () => {
              if (!editCourseData.start_date || editCourseData.seat_limit <= 0) {
                setMessage({ type: 'error', text: 'Please fill in all required fields' });
                return;
              }
              
              // Validate that end date is not before start date
              if (editCourseData.end_date && editCourseData.start_date && editCourseData.end_date < editCourseData.start_date) {
                setMessage({ type: 'error', text: 'End date cannot be before start date' });
                return;
              }
              
              setEditCourseLoading(true);
              try {
                await coursesAPI.update(courseId, {
                  start_date: formatDateForAPI(editCourseData.start_date),
                  end_date: formatDateForAPI(editCourseData.end_date),
                  seat_limit: editCourseData.seat_limit,
                  total_classes_offered: editCourseData.total_classes_offered ? parseInt(editCourseData.total_classes_offered) : null,
                  class_schedule: editClassSchedule.length > 0 ? editClassSchedule : null,
                });
                
                setMessage({ type: 'success', text: 'Course details updated successfully' });
                setEditCourseDialogOpen(false);
                fetchCourse();
              } catch (error) {
                console.error('Error updating course:', error);
                setMessage({ type: 'error', text: error.response?.data?.detail || 'Error updating course details' });
              } finally {
                setEditCourseLoading(false);
              }
            }}
            variant="contained"
            disabled={editCourseLoading || !editCourseData.start_date || editCourseData.seat_limit <= 0}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}

// Online Enrollment Table Component
function OnlineEnrollmentTable({ enrollments }) {
  const theme = useTheme();
  
  // Determine row color based on completion status
  const getRowBackgroundColor = (enrollment) => {
    if (enrollment.progress >= 100 || enrollment.completion_status === 'Completed') {
      return alpha(theme.palette.success.main, 0.08); // Green for completed
    } else if (enrollment.progress > 0 && enrollment.progress < 100) {
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
            <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem' }}>Employee ID</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem' }}>Name</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem' }}>Date Assigned</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem' }}>Last Access</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem' }} align="right">Progress</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {enrollments.map((enrollment) => (
            <TableRow
              key={enrollment.id}
              sx={{
                backgroundColor: getRowBackgroundColor(enrollment),
                borderBottom: '1px solid rgba(30, 64, 175, 0.08)',
                '&:hover': {
                  backgroundColor: (() => {
                    if (enrollment.progress >= 100 || enrollment.completion_status === 'Completed') {
                      return alpha(theme.palette.success.main, 0.12);
                    } else if (enrollment.progress > 0 && enrollment.progress < 100) {
                      return alpha(theme.palette.warning.main, 0.12);
                    } else {
                      return alpha(theme.palette.grey[500], 0.08);
                    }
                  })(),
                },
              }}
            >
              <TableCell sx={{ fontWeight: 500, color: '#1e3a8a' }}>{enrollment.student_employee_id}</TableCell>
              <TableCell sx={{ color: '#475569', fontWeight: 500 }}>{enrollment.student_name}</TableCell>
              <TableCell sx={{ color: '#64748b' }}>
                {enrollment.date_assigned 
                  ? new Date(enrollment.date_assigned * 1000).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })
                  : 'N/A'}
              </TableCell>
              <TableCell sx={{ color: '#64748b' }}>
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
                  label={`${(enrollment.progress || 0).toFixed(1)}%`}
                  size="small"
                  sx={{
                    background: enrollment.progress >= 100 
                      ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
                      : enrollment.progress > 0
                      ? 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)'
                      : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                    color: enrollment.progress >= 100 
                      ? '#047857' 
                      : enrollment.progress > 0
                      ? '#c2410c'
                      : '#475569',
                    fontWeight: 600,
                  }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// Enrollment Table Component (for onsite courses)
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
}) {
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
              <TableCell>{enrollment.student_employee_id}</TableCell>
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

export default CourseDetail;

