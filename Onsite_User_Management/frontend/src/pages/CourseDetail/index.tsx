import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
  Typography,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useCourseDetailData } from './hooks/useCourseDetailData';
import { useEnrollments } from './hooks/useEnrollments';
import { studentsAPI } from '../../services/api';
import UserDetailsDialog from '../../components/dialogs/UserDetailsDialog';
import AssignInternalMentorDialog from '../../components/dialogs/AssignInternalMentorDialog';
import AddExternalMentorDialog from '../../components/dialogs/AddExternalMentorDialog';
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
import { Student, Enrollment, Message, ClassSchedule, MentorCost, EditingMentor, DraftMentorWithDetails } from '../../types';

interface EditCourseData {
  start_date: Date | string | null;
  end_date: Date | string | null;
  seat_limit: number | string;
  total_classes_offered: number | string;
  name?: string;
  batch_code?: string;
  prerequisite_courses?: number[];
  category?: string;
}

function CourseDetail(): React.ReactElement {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { courseId } = useParams<{ courseId: string }>();
  const courseType = (location.state as any)?.courseType || 'onsite';

  // Data hooks
  const {
    course,
    loading,
    comments,
    draftMentorsWithDetails,
    message: courseMessage,
    fetchCourse,
  } = useCourseDetailData(courseId, courseType);

  const {
    enrollments,
    loadingEnrollments,
    fetchEnrollments,
  } = useEnrollments(courseId, course, courseType);

  // Combined message state
  const [message, setMessage] = useState<Message | null>(null);

  useEffect(() => {
    if (courseMessage) {
      setMessage(courseMessage);
    }
  }, [courseMessage]);

  // Enrollment sections - different for onsite vs online courses
  const isOnlineCourse = course?.is_lms_course === true;

  // Employee filter state (for online courses)
  const [employeeFilter, setEmployeeFilter] = useState<'all' | 'active' | 'previous'>('active');

  // Dialogs state
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState<boolean>(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [withdrawalReason, setWithdrawalReason] = useState<string>('');
  const [manualEnrollDialogOpen, setManualEnrollDialogOpen] = useState<boolean>(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [importDialogOpen, setImportDialogOpen] = useState<boolean>(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState<boolean>(false);
  const [showImportPreview, setShowImportPreview] = useState<boolean>(false);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState<boolean>(false);
  const [attendanceFile, setAttendanceFile] = useState<File | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState<boolean>(false);
  const [showAttendancePreview, setShowAttendancePreview] = useState<boolean>(false);
  const [editAttendanceDialogOpen, setEditAttendanceDialogOpen] = useState<boolean>(false);
  const [selectedEnrollmentForEdit, setSelectedEnrollmentForEdit] = useState<Enrollment | null>(null);
  const [editClassesAttended, setEditClassesAttended] = useState<string>('');
  const [editScore, setEditScore] = useState<string>('');
  const [assignMentorDialogOpen, setAssignMentorDialogOpen] = useState<boolean>(false);
  const [addExternalMentorDialogOpen, setAddExternalMentorDialogOpen] = useState<boolean>(false);
  const [editMentorDialogOpen, setEditMentorDialogOpen] = useState<boolean>(false);
  const [editingMentor, setEditingMentor] = useState<EditingMentor | null>(null);
  const [editMentorHours, setEditMentorHours] = useState<string>('');
  const [editMentorAmount, setEditMentorAmount] = useState<string>('');
  const [editMentorLoading, setEditMentorLoading] = useState<boolean>(false);
  const [editCostsDialogOpen, setEditCostsDialogOpen] = useState<boolean>(false);
  const [foodCost, setFoodCost] = useState<string>('');
  const [otherCost, setOtherCost] = useState<string>('');
  const [editCostsLoading, setEditCostsLoading] = useState<boolean>(false);

  const [mentorCosts, setMentorCosts] = useState<MentorCost[]>([]);
  const [generalMentorCost, setGeneralMentorCost] = useState<string>('');
  const [userDetailsOpen, setUserDetailsOpen] = useState<boolean>(false);
  const [selectedUserEnrollment, setSelectedUserEnrollment] = useState<Enrollment | null>(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState<boolean>(false);
  const [newComment, setNewComment] = useState<string>('');
  const [editCourseDialogOpen, setEditCourseDialogOpen] = useState<boolean>(false);
  const [editCourseData, setEditCourseData] = useState<EditCourseData>({
    start_date: null,
    end_date: null,
    seat_limit: 0,
    total_classes_offered: '',
  });
  const [editClassSchedule, setEditClassSchedule] = useState<ClassSchedule[]>([]);
  const [editCourseLoading, setEditCourseLoading] = useState<boolean>(false);

  // Handler functions
  const handleWithdraw = (enrollment: Enrollment): void => {
    setSelectedEnrollment(enrollment);
    setWithdrawalReason('');
    setWithdrawDialogOpen(true);
  };

  const handleOpenManualEnroll = async (): Promise<void> => {
    setSelectedStudentId('');
    try {
      const response = await studentsAPI.getAll({ limit: 1000 });
      setStudents(response.data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error fetching students' });
    }
    setManualEnrollDialogOpen(true);
  };

  const handleMentorCostChange = (index: number, field: 'hours_taught' | 'amount_paid', value: string): void => {
    const updated = [...mentorCosts];
    updated[index] = { ...updated[index], [field]: value };
    setMentorCosts(updated);
  };

  const handleAddExternalMentor = async (assignment: any): Promise<void> => {
    try {
      await handleAssignMentor(assignment, Number(courseId!), course, setMessage, fetchCourse, () => { });
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
            onApproveCourse={() => handleApproveCourse(Number(courseId!), setMessage, fetchCourse, navigate)}
            onManualEnroll={handleOpenManualEnroll}
            onImportEnrollments={() => setImportDialogOpen(true)}
            onUploadAttendance={() => setAttendanceDialogOpen(true)}
            onGenerateReport={() => handleGenerateReport(Number(courseId!), setMessage, courseType as any)}
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
            draftMentorsWithDetails={draftMentorsWithDetails as DraftMentorWithDetails[]}
            onAssignInternal={() => setAssignMentorDialogOpen(true)}
            onAddExternal={() => setAddExternalMentorDialogOpen(true)}
            onEditMentor={(cm) => {
              setEditingMentor(cm as EditingMentor);
              setEditMentorHours(cm.hours_taught?.toString() || '0');
              setEditMentorAmount(cm.amount_paid?.toString() || '0');
              setEditMentorDialogOpen(true);
            }}
            onRemoveMentor={(courseMentorId, mentorId) => handleRemoveMentor(
              courseMentorId,
              mentorId,
              Number(courseId!),
              course,
              draftMentorsWithDetails as any,
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
            draftMentorsWithDetails={draftMentorsWithDetails as DraftMentorWithDetails[]}
            onEditClick={() => {
              handleOpenEditCosts(
                course as any,
                draftMentorsWithDetails as any,
                setFoodCost,
                setOtherCost,
                setMentorCosts,
                setEditCostsDialogOpen
              );
              setGeneralMentorCost('');
            }}
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

        {/* Employee Filter - Only for online courses */}
        {isOnlineCourse && (
          <Box sx={{ mb: 3, p: 2, backgroundColor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2, border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
            <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                Filter by Employee Status:
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                <Button
                  variant={employeeFilter === 'all' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setEmployeeFilter('all')}
                  sx={{ textTransform: 'none', minWidth: 100 }}
                >
                  All ({loadingEnrollments ? '...' : enrollments.length})
                </Button>
                <Button
                  variant={employeeFilter === 'active' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setEmployeeFilter('active')}
                  sx={{ textTransform: 'none', minWidth: 100 }}
                  color="success"
                >
                  Active ({loadingEnrollments ? '...' : enrollments.filter((e: any) => e.is_active !== false).length})
                </Button>
                <Button
                  variant={employeeFilter === 'previous' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setEmployeeFilter('previous')}
                  sx={{ textTransform: 'none', minWidth: 100 }}
                  color="warning"
                >
                  Previous ({loadingEnrollments ? '...' : enrollments.filter((e: any) => e.is_active === false).length})
                </Button>
              </Box>
            </Box>
          </Box>
        )}

        {/* Enrollment Sections */}
        <EnrollmentSections
          enrollments={employeeFilter === 'all'
            ? enrollments
            : employeeFilter === 'active'
              ? enrollments.filter((e: any) => e.is_active !== false)
              : enrollments.filter((e: any) => e.is_active === false)}
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
            setEditClassesAttended((e as any).present?.toString() || '');
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
          Number(courseId!),
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
          Number(courseId!),
          setMessage,
          setImportDialogOpen,
          setImportFile,
          fetchEnrollments,
          fetchCourse,
          setImportLoading
        )}
        onImportCSV={() => handleImportCSV(
          importFile,
          Number(courseId!),
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
          Number(courseId!),
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
          setEditScore
        )}
      />

      <AssignInternalMentorDialog
        open={assignMentorDialogOpen}
        onClose={() => setAssignMentorDialogOpen(false)}
        onAssign={async (assignment) => {
          try {
            await handleAssignMentor(assignment, Number(courseId!), course, setMessage, fetchCourse, () => { });
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
        allowSelection={true}
      />

      <EditMentorDialog
        open={editMentorDialogOpen}
        onClose={() => {
          setEditMentorDialogOpen(false);
          setEditingMentor(null);
          setEditMentorHours('');
          setEditMentorAmount('');
        }}
        editingMentor={editingMentor as any}
        editMentorHours={editMentorHours}
        setEditMentorHours={setEditMentorHours}
        editMentorAmount={editMentorAmount}
        setEditMentorAmount={setEditMentorAmount}
        editMentorLoading={editMentorLoading}
        onConfirm={() => handleEditMentor(
          editingMentor as any,
          editMentorHours,
          editMentorAmount,
          Number(courseId!),
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
        courseType={courseType}
        generalMentorCost={generalMentorCost}
        setGeneralMentorCost={setGeneralMentorCost}
        onConfirm={() => handleSaveCosts(
          foodCost,
          otherCost,
          mentorCosts,
          Number(courseId!),
          course,
          setMessage,
          setEditCostsDialogOpen,
          fetchCourse,
          setEditCostsLoading,
          generalMentorCost
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
          Number(courseId!),
          setMessage,
          setNewComment,
          setCommentDialogOpen,
          fetchCourse
        )}
      />

      <EditCourseDialog
        open={editCourseDialogOpen}
        onClose={() => setEditCourseDialogOpen(false)}
        editCourseData={editCourseData as any}
        setEditCourseData={setEditCourseData as any}
        editClassSchedule={editClassSchedule}
        setEditClassSchedule={setEditClassSchedule}
        editCourseLoading={editCourseLoading}
        message={message}
        onConfirm={() => handleUpdateCourseDetails(
          editCourseData as any,
          editClassSchedule,
          Number(courseId!),
          setMessage,
          setEditCourseDialogOpen,
          fetchCourse,
          setEditCourseLoading
        )}
      />

      <UserDetailsDialog
        open={userDetailsOpen}
        onClose={() => setUserDetailsOpen(false)}
        enrollment={selectedUserEnrollment as any}
      />
    </Box>
  );
}

export default CourseDetail;

