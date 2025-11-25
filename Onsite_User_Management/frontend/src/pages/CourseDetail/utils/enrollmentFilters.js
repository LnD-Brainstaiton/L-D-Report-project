/**
 * Helper function to normalize enum values (handle both string and enum object)
 */
export const normalizeStatus = (status) => {
  if (!status) return null;
  if (typeof status === 'string') return status;
  if (status.value) return status.value; // Enum object with .value
  return String(status);
};

/**
 * Filter enrollments for online courses by completion status
 */
export const filterOnlineEnrollments = (enrollments) => {
  const completed = enrollments.filter(e => 
    e.is_lms_enrollment && (e.progress >= 100 || e.completion_status === 'Completed')
  );
  
  const inProgress = enrollments.filter(e => 
    e.is_lms_enrollment && e.progress > 0 && e.progress < 100 && e.completion_status === 'In Progress'
  );
  
  const notStarted = enrollments.filter(e => 
    e.is_lms_enrollment && (e.progress === 0 || e.completion_status === 'Not Started') && 
    !(e.progress >= 100 || e.completion_status === 'Completed') &&
    !(e.progress > 0 && e.progress < 100 && e.completion_status === 'In Progress')
  );
  
  return { completed, inProgress, notStarted };
};

/**
 * Filter enrollments for onsite courses by approval/eligibility status
 */
export const filterOnsiteEnrollments = (enrollments) => {
  const approved = enrollments.filter(e => {
    if (e.is_lms_enrollment) return false;
    const approvalStatus = normalizeStatus(e.approval_status);
    return approvalStatus === 'Approved';
  });
  
  const eligiblePending = enrollments.filter(e => {
    if (e.is_lms_enrollment) return false;
    const approvalStatus = normalizeStatus(e.approval_status);
    const eligibilityStatus = normalizeStatus(e.eligibility_status);
    return approvalStatus === 'Pending' && eligibilityStatus === 'Eligible';
  });
  
  const notEligible = enrollments.filter(e => {
    if (e.is_lms_enrollment) return false;
    const approvalStatus = normalizeStatus(e.approval_status);
    const eligibilityStatus = normalizeStatus(e.eligibility_status);
    return approvalStatus !== 'Approved' && 
           approvalStatus !== 'Rejected' &&
           approvalStatus !== 'Withdrawn' &&
           (eligibilityStatus === 'Ineligible (Missing Prerequisite)' ||
            eligibilityStatus === 'Ineligible (Already Taken)' ||
            eligibilityStatus === 'Ineligible (Annual Limit)');
  });
  
  const rejected = enrollments.filter(e => {
    if (e.is_lms_enrollment) return false;
    const approvalStatus = normalizeStatus(e.approval_status);
    return approvalStatus === 'Rejected';
  });
  
  const withdrawn = enrollments.filter(e => {
    if (e.is_lms_enrollment) return false;
    const approvalStatus = normalizeStatus(e.approval_status);
    return approvalStatus === 'Withdrawn';
  });
  
  return { approved, eligiblePending, notEligible, rejected, withdrawn };
};

