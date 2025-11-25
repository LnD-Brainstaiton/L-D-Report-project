import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  useTheme,
  alpha,
} from '@mui/material';
import OnlineEnrollmentTable from './OnlineEnrollmentTable';
import EnrollmentTable from './EnrollmentTable';
import { filterOnlineEnrollments, filterOnsiteEnrollments } from '../utils/enrollmentFilters';

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
}) {
  if (loadingEnrollments) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (isOnlineCourse) {
    const { completed, inProgress, notStarted } = filterOnlineEnrollments(enrollments);

    return (
      <>
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
    );
  }

  // Onsite course enrollments
  const { approved, eligiblePending, notEligible, rejected, withdrawn } = filterOnsiteEnrollments(enrollments);

  return (
    <>
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
  );
}

export default EnrollmentSections;

