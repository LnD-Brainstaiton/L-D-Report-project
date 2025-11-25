import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useCourseDetailData } from './hooks/useCourseDetailData';
import { useEnrollments } from './hooks/useEnrollments';
import { studentsAPI } from '../../services/api';
import UserDetailsDialog from '../../components/UserDetailsDialog';
import AssignInternalMentorDialog from '../../components/AssignInternalMentorDialog';
import AddExternalMentorDialog from '../../components/AddExternalMentorDialog';
import CourseHeaderCard from './components/CourseHeaderCard';
import OnlineCourseDetailsCard from './components/OnlineCourseDetailsCard';
import StatCards from './components/StatCards';
import ActionButtonsCard from './components/ActionButtonsCard';
import CourseScheduleCard from './components/CourseScheduleCard';
import MentorsCard from './components/MentorsCard';
import CostBreakdownCard from './components/CostBreakdownCard';
import CommentsCard from './components/CommentsCard';
import EnrollmentSections from './components/EnrollmentSections';
import WithdrawDialog from './components/WithdrawDialog';
import ManualEnrollDialog from './components/ManualEnrollDialog';
import ImportDialog from './components/ImportDialog';
import AttendanceDialog from './components/AttendanceDialog';
import EditAttendanceDialog from './components/EditAttendanceDialog';
import EditMentorDialog from './components/EditMentorDialog';
import EditCostsDialog from './components/EditCostsDialog';
import CommentDialog from './components/CommentDialog';
import EditCourseDialog from './components/EditCourseDialog';
import { handleApprove, handleReject, handleWithdrawConfirm, handleReapprove, handleManualEnrollConfirm } from './utils/enrollmentHandlers';
import { handleImportExcel, handleImportCSV } from './utils/importHandlers';
import { handleUploadAttendance, handleEditAttendance } from './utils/attendanceHandlers';
import { handleAssignMentor, handleEditMentor, handleRemoveMentor } from './utils/mentorHandlers';
import { handleOpenEditCosts, handleSaveCosts } from './utils/costHandlers';
import { handleApproveCourse, handleGenerateReport, handleAddComment, handleUpdateCourseDetails } from './utils/courseHandlers';

function CourseDetail() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { courseId } = useParams();
  const courseType = location.state?.courseType || 'onsite';
  
  // Data hooks
  const {
    course,
    loading,
    comments,
    draftMentorsWithDetails,
    message: courseMessage,
    setMessage: setCourseMessage,
    setCourse,
    fetchCourse,
  } = useCourseDetailData(courseId, courseType);
  
  const {
    enrollments,
    loadingEnrollments,
    setEnrollments,
    fetchEnrollments,
  } = useEnrollments(courseId, course, courseType);
  
  // Combined message state
  const [message, setMessage] = useState(null);
  
  useEffect(() => {
    if (courseMessage) {
      setMessage(courseMessage);
    }
  }, [courseMessage]);
  
  // Enrollment sections - different for onsite vs online courses
  const isOnlineCourse = course?.is_lms_course === true;
  
  // Dialogs state
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
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [attendanceFile, setAttendanceFile] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [showAttendancePreview, setShowAttendancePreview] = useState(false);
  const [editAttendanceDialogOpen, setEditAttendanceDialogOpen] = useState(false);
  const [selectedEnrollmentForEdit, setSelectedEnrollmentForEdit] = useState(null);
  const [editClassesAttended, setEditClassesAttended] = useState('');
  const [editScore, setEditScore] = useState('');
  const [assignMentorDialogOpen, setAssignMentorDialogOpen] = useState(false);
  const [assignMentorLoading, setAssignMentorLoading] = useState(false);
  const [addExternalMentorDialogOpen, setAddExternalMentorDialogOpen] = useState(false);
  const [editMentorDialogOpen, setEditMentorDialogOpen] = useState(false);
  const [editingMentor, setEditingMentor] = useState(null);
  const [editMentorHours, setEditMentorHours] = useState('');
  const [editMentorAmount, setEditMentorAmount] = useState('');
  const [editMentorLoading, setEditMentorLoading] = useState(false);
  const [editCostsDialogOpen, setEditCostsDialogOpen] = useState(false);
  const [foodCost, setFoodCost] = useState('');
  const [otherCost, setOtherCost] = useState('');
  const [editCostsLoading, setEditCostsLoading] = useState(false);
  const [mentorCosts, setMentorCosts] = useState([]);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const [selectedUserEnrollment, setSelectedUserEnrollment] = useState(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [editCourseDialogOpen, setEditCourseDialogOpen] = useState(false);
  const [editCourseData, setEditCourseData] = useState({
    start_date: null,
    end_date: null,
    seat_limit: 0,
    total_classes_offered: '',
  });
  const [editClassSchedule, setEditClassSchedule] = useState([]);
  const [editCourseLoading, setEditCourseLoading] = useState(false);

  // Handler functions
  const handleWithdraw = (enrollment) => {
    setSelectedEnrollment(enrollment);
    setWithdrawalReason('');
    setWithdrawDialogOpen(true);
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

  const handleMentorCostChange = (index, field, value) => {
    const updated = [...mentorCosts];
    updated[index] = { ...updated[index], [field]: value };
    setMentorCosts(updated);
  };

  const handleAddExternalMentor = async (assignment) => {
    try {
      await handleAssignMentor(assignment, courseId, course, setMessage, fetchCourse, setAssignMentorLoading);
      setAddExternalMentorDialogOpen(false);
    } catch (error) {
      // Error already handled in handleAssignMentor
    }
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

      <Box>
        {/* Header Card */}
        <CourseHeaderCard course={course} theme={theme} />

        {/* Online Course Details Card */}
        {course?.is_lms_course && (
          <OnlineCourseDetailsCard course={course} theme={theme} />
        )}

        {/* Stat Cards */}
        <StatCards
          course={course}
          isOnlineCourse={isOnlineCourse}
          loadingEnrollments={loadingEnrollments}
          enrollments={enrollments}
          theme={theme}
        />

        {/* Action Buttons - Only for onsite courses */}
        {!isOnlineCourse && (
          <ActionButtonsCard
            course={course}
            onApproveCourse={() => handleApproveCourse(courseId, setMessage, fetchCourse, navigate)}
            onManualEnroll={handleOpenManualEnroll}
            onImportEnrollments={() => setImportDialogOpen(true)}
            onUploadAttendance={() => setAttendanceDialogOpen(true)}
            onGenerateReport={() => handleGenerateReport(courseId, setMessage)}
            theme={theme}
          />
        )}

        {/* Course Schedule Card - Only for onsite courses */}
        {!isOnlineCourse && (
          <CourseScheduleCard
            course={course}
            onEditClick={() => {
              setEditCourseData({
                start_date: course.start_date ? new Date(course.start_date) : null,
                end_date: course.end_date ? new Date(course.end_date) : null,
                seat_limit: course.seat_limit || 0,
                total_classes_offered: course.total_classes_offered || '',
              });
              setEditClassSchedule(course.class_schedule || []);
              setEditCourseDialogOpen(true);
            }}
            theme={theme}
          />
        )}

        {/* Assigned Mentors Card - Only for onsite courses */}
        {!isOnlineCourse && (
          <MentorsCard
            course={course}
            draftMentorsWithDetails={draftMentorsWithDetails}
            onAssignInternal={() => setAssignMentorDialogOpen(true)}
            onAddExternal={() => setAddExternalMentorDialogOpen(true)}
            onEditMentor={(cm) => {
              setEditingMentor(cm);
              setEditMentorHours(cm.hours_taught?.toString() || '0');
              setEditMentorAmount(cm.amount_paid?.toString() || '0');
              setEditMentorDialogOpen(true);
            }}
            onRemoveMentor={(courseMentorId, mentorId) => handleRemoveMentor(
              courseMentorId,
              mentorId,
              courseId,
              course,
              draftMentorsWithDetails,
              setMessage,
              fetchCourse
            )}
            theme={theme}
          />
        )}

        {/* Course Costs Section - Only for onsite courses */}
        {!isOnlineCourse && (
          <CostBreakdownCard
            course={course}
            draftMentorsWithDetails={draftMentorsWithDetails}
            onEditClick={() => handleOpenEditCosts(
              course,
              draftMentorsWithDetails,
              setFoodCost,
              setOtherCost,
              setMentorCosts,
              setEditCostsDialogOpen
            )}
            theme={theme}
          />
        )}

        {/* Comment History Section - Only for onsite courses */}
        {!isOnlineCourse && (
          <CommentsCard
            comments={comments}
            onAddComment={() => setCommentDialogOpen(true)}
            theme={theme}
          />
        )}

        {/* Enrollment Sections */}
        <EnrollmentSections
          enrollments={enrollments}
          loadingEnrollments={loadingEnrollments}
          isOnlineCourse={isOnlineCourse}
          onViewDetails={(enrollment) => {
            setSelectedUserEnrollment(enrollment);
            setUserDetailsOpen(true);
          }}
          onApprove={(enrollmentId) => handleApprove(enrollmentId, setMessage, fetchEnrollments, fetchCourse)}
          onReject={(enrollmentId) => handleReject(enrollmentId, setMessage, fetchEnrollments)}
          onWithdraw={handleWithdraw}
          onReapprove={(enrollmentId) => handleReapprove(enrollmentId, setMessage, fetchEnrollments, fetchCourse)}
          onEditAttendance={(e) => {
            setSelectedEnrollmentForEdit(e);
            setEditClassesAttended(e.present?.toString() || '');
            setEditScore(e.score?.toString() || '');
            setEditAttendanceDialogOpen(true);
          }}
          theme={theme}
        />
      </Box>

      {/* Dialogs */}
      <WithdrawDialog
        open={withdrawDialogOpen}
        onClose={() => setWithdrawDialogOpen(false)}
        withdrawalReason={withdrawalReason}
        setWithdrawalReason={setWithdrawalReason}
        onConfirm={() => handleWithdrawConfirm(
          selectedEnrollment,
          withdrawalReason,
          setMessage,
          setWithdrawDialogOpen,
          setSelectedEnrollment,
          setWithdrawalReason,
          fetchEnrollments,
          fetchCourse
        )}
      />

      <ManualEnrollDialog
        open={manualEnrollDialogOpen}
        onClose={() => setManualEnrollDialogOpen(false)}
        students={students}
        selectedStudentId={selectedStudentId}
        setSelectedStudentId={setSelectedStudentId}
        onConfirm={() => handleManualEnrollConfirm(
          selectedStudentId,
          courseId,
          setMessage,
          setManualEnrollDialogOpen,
          setSelectedStudentId,
          fetchEnrollments,
          fetchCourse
        )}
      />

      <ImportDialog
        open={importDialogOpen}
        onClose={() => {
          setImportDialogOpen(false);
          setImportFile(null);
          setShowImportPreview(false);
        }}
        importFile={importFile}
        setImportFile={setImportFile}
        importLoading={importLoading}
        onImportExcel={() => handleImportExcel(
          importFile,
          courseId,
          setMessage,
          setImportDialogOpen,
          setImportFile,
          fetchEnrollments,
          fetchCourse,
          setImportLoading
        )}
        onImportCSV={() => handleImportCSV(
          importFile,
          courseId,
          setMessage,
          setImportDialogOpen,
          setImportFile,
          fetchEnrollments,
          fetchCourse,
          setImportLoading
        )}
        showImportPreview={showImportPreview}
        setShowImportPreview={setShowImportPreview}
      />

      <AttendanceDialog
        open={attendanceDialogOpen}
        onClose={() => {
          setAttendanceDialogOpen(false);
          setAttendanceFile(null);
          setShowAttendancePreview(false);
        }}
        attendanceFile={attendanceFile}
        setAttendanceFile={setAttendanceFile}
        attendanceLoading={attendanceLoading}
        onUpload={() => handleUploadAttendance(
          attendanceFile,
          courseId,
          setMessage,
          setAttendanceDialogOpen,
          setAttendanceFile,
          fetchEnrollments,
          setAttendanceLoading
        )}
        showAttendancePreview={showAttendancePreview}
        setShowAttendancePreview={setShowAttendancePreview}
      />

      <EditAttendanceDialog
        open={editAttendanceDialogOpen}
        onClose={() => setEditAttendanceDialogOpen(false)}
        selectedEnrollmentForEdit={selectedEnrollmentForEdit}
        editClassesAttended={editClassesAttended}
        setEditClassesAttended={setEditClassesAttended}
        editScore={editScore}
        setEditScore={setEditScore}
        course={course}
        onConfirm={() => handleEditAttendance(
          selectedEnrollmentForEdit,
          editClassesAttended,
          editScore,
          course,
          setMessage,
          setEditAttendanceDialogOpen,
          setSelectedEnrollmentForEdit,
          setEditClassesAttended,
          setEditScore,
          fetchEnrollments
        )}
      />

      <AssignInternalMentorDialog
        open={assignMentorDialogOpen}
        onClose={() => setAssignMentorDialogOpen(false)}
        onAssign={async (assignment) => {
          try {
            await handleAssignMentor(assignment, courseId, course, setMessage, fetchCourse, setAssignMentorLoading);
            setAssignMentorDialogOpen(false);
          } catch (error) {
            // Error already handled in handleAssignMentor
          }
        }}
        isDraft={course?.status === 'draft'}
      />

      <AddExternalMentorDialog
        open={addExternalMentorDialogOpen}
        onClose={() => setAddExternalMentorDialogOpen(false)}
        onAdd={handleAddExternalMentor}
        isDraft={course?.status === 'draft'}
      />

      <EditMentorDialog
        open={editMentorDialogOpen}
        onClose={() => {
          setEditMentorDialogOpen(false);
          setEditingMentor(null);
          setEditMentorHours('');
          setEditMentorAmount('');
        }}
        editingMentor={editingMentor}
        editMentorHours={editMentorHours}
        setEditMentorHours={setEditMentorHours}
        editMentorAmount={editMentorAmount}
        setEditMentorAmount={setEditMentorAmount}
        editMentorLoading={editMentorLoading}
        onConfirm={() => handleEditMentor(
          editingMentor,
          editMentorHours,
          editMentorAmount,
          courseId,
          course,
          setMessage,
          setEditMentorDialogOpen,
          setEditingMentor,
          setEditMentorHours,
          setEditMentorAmount,
          fetchCourse,
          setEditMentorLoading
        )}
      />

      <EditCostsDialog
        open={editCostsDialogOpen}
        onClose={() => setEditCostsDialogOpen(false)}
        foodCost={foodCost}
        setFoodCost={setFoodCost}
        otherCost={otherCost}
        setOtherCost={setOtherCost}
        mentorCosts={mentorCosts}
        handleMentorCostChange={handleMentorCostChange}
        editCostsLoading={editCostsLoading}
        onConfirm={() => handleSaveCosts(
          foodCost,
          otherCost,
          mentorCosts,
          courseId,
          course,
          setMessage,
          setEditCostsDialogOpen,
          fetchCourse,
          setEditCostsLoading
        )}
      />

      <CommentDialog
        open={commentDialogOpen}
        onClose={() => {
          setCommentDialogOpen(false);
          setNewComment('');
        }}
        newComment={newComment}
        setNewComment={setNewComment}
        onConfirm={() => handleAddComment(
          newComment,
          courseId,
          setMessage,
          setNewComment,
          setCommentDialogOpen,
          fetchCourse
        )}
      />

      <EditCourseDialog
        open={editCourseDialogOpen}
        onClose={() => setEditCourseDialogOpen(false)}
        editCourseData={editCourseData}
        setEditCourseData={setEditCourseData}
        editClassSchedule={editClassSchedule}
        setEditClassSchedule={setEditClassSchedule}
        editCourseLoading={editCourseLoading}
        message={message}
        onConfirm={() => handleUpdateCourseDetails(
          editCourseData,
          editClassSchedule,
          courseId,
          setMessage,
          setEditCourseDialogOpen,
          fetchCourse,
          setEditCourseLoading
        )}
      />

      <UserDetailsDialog
        open={userDetailsOpen}
        onClose={() => setUserDetailsOpen(false)}
        enrollment={selectedUserEnrollment}
      />
    </Box>
  );
}

export default CourseDetail;

