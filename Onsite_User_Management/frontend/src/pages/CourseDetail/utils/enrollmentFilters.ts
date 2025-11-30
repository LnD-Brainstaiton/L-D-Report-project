import type { Enrollment } from '../../../types';

interface EnrollmentWithLMS extends Enrollment {
  is_lms_enrollment?: boolean;
  progress?: number;
}

interface StatusObject {
  value?: string;
}

export const normalizeStatus = (status: string | StatusObject | null | undefined): string | null => {
  if (!status) return null;
  if (typeof status === 'string') return status;
  if ((status as StatusObject).value) return (status as StatusObject).value!;
  return String(status);
};

interface OnlineEnrollmentFilters {
  completed: EnrollmentWithLMS[];
  inProgress: EnrollmentWithLMS[];
  notStarted: EnrollmentWithLMS[];
}

export const filterOnlineEnrollments = (enrollments: EnrollmentWithLMS[]): OnlineEnrollmentFilters => {
  const completed = enrollments.filter(
    (e) => e.is_lms_enrollment && ((e.progress !== undefined && e.progress >= 100) || e.completion_status === 'Completed')
  );

  const inProgress = enrollments.filter(
    (e) =>
      e.is_lms_enrollment &&
      e.progress !== undefined &&
      e.progress > 0 &&
      e.progress < 100 &&
      e.completion_status === 'In Progress'
  );

  const notStarted = enrollments.filter(
    (e) =>
      e.is_lms_enrollment &&
      (e.progress === 0 || e.completion_status === 'Not Started') &&
      !((e.progress !== undefined && e.progress >= 100) || e.completion_status === 'Completed') &&
      !(e.progress !== undefined && e.progress > 0 && e.progress < 100 && e.completion_status === 'In Progress')
  );

  return { completed, inProgress, notStarted };
};

interface OnsiteEnrollmentFilters {
  completed: EnrollmentWithLMS[];
  approved: EnrollmentWithLMS[];
  eligiblePending: EnrollmentWithLMS[];
  notEligible: EnrollmentWithLMS[];
  rejected: EnrollmentWithLMS[];
  withdrawn: EnrollmentWithLMS[];
}

export const filterOnsiteEnrollments = (enrollments: EnrollmentWithLMS[]): OnsiteEnrollmentFilters => {
  const completed = enrollments.filter((e) => {
    if (e.is_lms_enrollment) return false;
    const approvalStatus = normalizeStatus(e.approval_status);
    const completionStatus = normalizeStatus(e.completion_status);
    return approvalStatus === 'Approved' && completionStatus === 'Completed';
  });

  const approved = enrollments.filter((e) => {
    if (e.is_lms_enrollment) return false;
    const approvalStatus = normalizeStatus(e.approval_status);
    const completionStatus = normalizeStatus(e.completion_status);
    return approvalStatus === 'Approved' && completionStatus !== 'Completed';
  });

  const eligiblePending = enrollments.filter((e) => {
    if (e.is_lms_enrollment) return false;
    const approvalStatus = normalizeStatus(e.approval_status);
    const eligibilityStatus = normalizeStatus(e.eligibility_status);
    return approvalStatus === 'Pending' && eligibilityStatus === 'Eligible';
  });

  const notEligible = enrollments.filter((e) => {
    if (e.is_lms_enrollment) return false;
    const approvalStatus = normalizeStatus(e.approval_status);
    const eligibilityStatus = normalizeStatus(e.eligibility_status);
    return (
      approvalStatus !== 'Approved' &&
      approvalStatus !== 'Rejected' &&
      approvalStatus !== 'Withdrawn' &&
      (eligibilityStatus === 'Ineligible (Missing Prerequisite)' ||
        eligibilityStatus === 'Ineligible (Already Taken)' ||
        eligibilityStatus === 'Ineligible (Annual Limit)')
    );
  });

  const rejected = enrollments.filter((e) => {
    if (e.is_lms_enrollment) return false;
    const approvalStatus = normalizeStatus(e.approval_status);
    return approvalStatus === 'Rejected';
  });

  const withdrawn = enrollments.filter((e) => {
    if (e.is_lms_enrollment) return false;
    const approvalStatus = normalizeStatus(e.approval_status);
    return approvalStatus === 'Withdrawn';
  });

  return { completed, approved, eligiblePending, notEligible, rejected, withdrawn };
};

