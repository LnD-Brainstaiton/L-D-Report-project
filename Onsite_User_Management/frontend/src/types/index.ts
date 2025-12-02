/**
 * Core type definitions for the L&D Management Application
 */

// ============================================================================
// ENUMS
// ============================================================================

export type CourseStatus = string;

export type CourseType = 'onsite' | 'online' | 'external';

export type ApprovalStatus = string;

export type EligibilityStatus = 'eligible' | 'ineligible' | 'pending' | string;

export type TimePeriod = 'all' | 'month' | 'quarter' | 'year';

// ============================================================================
// BASE INTERFACES
// ============================================================================

export interface BaseEntity {
  id: number;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// STUDENT / USER
// ============================================================================

export interface Student extends BaseEntity {
  employee_id: string;
  name: string;
  email: string;
  department: string;
  designation?: string;
  experience_years?: number;
  career_start_date?: string | null;
  bs_joining_date?: string | null;
  exit_date?: string | null; // Leaving date for previous employees
  total_experience?: number | null; // From ERP
  is_active: boolean;
  is_mentor?: boolean;
  never_taken_course?: boolean;
  enrollments?: Enrollment[];
  [key: string]: any;
}

export interface StudentWithCourses extends Student {
  enrollments?: Enrollment[];
  online_courses?: OnlineCourse[];
  total_courses?: number;
  completed_courses?: number;
}

// ============================================================================
// COURSE
// ============================================================================

export interface ClassSchedule {
  day: string;
  start_time: string;
  end_time: string;
}

export type ClassScheduleEntry = ClassSchedule;

export interface Course extends BaseEntity {
  name?: string;
  fullname?: string;
  batch_code?: string;
  description?: string;
  start_date?: string | null;
  end_date?: string | null;
  startdate?: number;
  enddate?: number;
  seat_limit?: number | null;
  status: CourseStatus | string;
  course_type?: CourseType | string;
  total_classes_offered?: number;
  prerequisite_course_id?: number;
  prerequisite_course?: Course;
  class_schedule?: ClassSchedule[];
  // Cost fields
  venue_cost?: number;
  food_cost?: number;
  material_cost?: number;
  other_costs?: number;
  other_cost?: number;
  total_cost?: number;
  cost_per_head?: number;
  // Computed fields
  enrolled_count?: number;
  completed_count?: number;
  completion_rate?: number;
  mentors?: CourseMentor[];
  categoryname?: string;
  categoryid?: number;
  current_enrolled?: number;
  visible?: boolean;
  is_lms_course?: boolean;
  is_mandatory?: boolean;  // Mandatory course flag from LMS
  comments?: Comment[];
  draft?: {
    mentor_assignments?: CourseMentorAssignment[];
    food_cost?: number | string | null;
    other_cost?: number | string | null;
    [key: string]: any;
  } | null;
  [key: string]: any;
}

export interface CourseCreate {
  name?: string;
  batch_code?: string;
  description?: string;
  start_date?: string | null;
  end_date?: string | null;
  seat_limit?: number | null;
  status?: CourseStatus | string;
  course_type?: CourseType | string;
  total_classes_offered?: number | null;
  prerequisite_course_id?: number | null;
  class_schedule?: ClassSchedule[] | null;
  location?: string; // For external courses
  cost?: number; // For external courses
}

export interface CourseUpdate extends Partial<CourseCreate> {
  venue_cost?: number;
  food_cost?: number;
  material_cost?: number;
  other_costs?: number;
}

export interface CourseCostUpdate {
  venue_cost?: number;
  food_cost?: number;
  material_cost?: number;
  other_costs?: number;
  other_cost?: number;
}

// ============================================================================
// ENROLLMENT
// ============================================================================

export interface Enrollment extends BaseEntity {
  course_id: number;
  student_id: number;
  approval_status: ApprovalStatus;
  eligibility_status?: EligibilityStatus;
  eligibility_reason?: string;
  rejection_reason?: string;
  attendance_status?: string;
  approved_by?: string;
  approved_at?: string;
  withdrawn_by?: string;
  withdrawn_at?: string;
  withdrawal_reason?: string;
  is_completed?: boolean;
  completion_date?: string;
  score?: number;
  classes_attended?: number;
  attendance_percentage?: number;
  completion_status?: string;
  progress?: number;
  date_assigned?: number;
  lastaccess?: number;
  // Joined fields
  student_name?: string;
  student_email?: string;
  student_employee_id?: string;
  student_department?: string;
  student_designation?: string;
  student_experience_years?: number;
  student_career_start_date?: string | null;
  student_bs_joining_date?: string | null;
  course_name?: string;
  course_description?: string;
  batch_code?: string;
  course_batch_code?: string;
  course_start_date?: string;
  course_end_date?: string;
  course?: Course;
  student?: Student;
  // LMS flag
  is_lms_enrollment?: boolean;
  [key: string]: any;
}

export interface EnrollmentCreate {
  course_id?: number;
  student_id?: number;
  approval_status?: ApprovalStatus;
  enrollment_id?: number;
  approved?: boolean;
  rejection_reason?: string;
}

export interface EnrollmentApprovalPayload {
  enrollment_id: number;
  approved: boolean;
  rejection_reason?: string;
}

// ============================================================================
// MENTOR
// ============================================================================

export interface Mentor extends BaseEntity {
  name: string;
  email?: string;
  is_internal: boolean;
  student_id?: number;
  student?: Student;
  designation?: string;
  department?: string;
  company?: string;
  specialty?: string;
  external_id?: number;
  course_count?: number;
}

export interface MentorCreate {
  name: string;
  email?: string;
  is_internal: boolean;
  student_id?: number;
  designation?: string;
  department?: string;
  company?: string;
  specialty?: string;
}

export interface MentorStats {
  total_courses_mentored: number;
  total_hours_overall: number;
  total_amount_overall: number;
  per_course_stats: MentorCourseStats[];
}

export interface MentorCourseStats {
  course_id: number;
  course_name: string;
  batch_code: string;
  start_date?: string;
  end_date?: string;
  hours_taught: number;
  amount_paid: number;
  participants_count: number;
  completion_ratio: number;
}

// ============================================================================
// COURSE MENTOR (Assignment)
// ============================================================================

export interface CourseMentor extends BaseEntity {
  course_id: number;
  mentor_id: number;
  hours_taught: number;
  amount_paid: number;
  mentor?: Mentor;
  mentor_name?: string;
  is_internal?: boolean;
}

export interface CourseMentorCreate {
  mentor_id: number;
  hours_taught?: number;
  amount_paid?: number;
}

export interface CourseMentorAssignment {
  mentor_id: number;
  mentor_name?: string;
  is_internal?: boolean;
  hours_taught?: number | string;
  amount_paid?: number | string;
  // For external mentor creation
  email?: string;
  designation?: string;
  company?: string;
  specialty?: string;
  mentor?: Mentor | null;
  id?: number | string;
  is_draft?: boolean;
}

export type DraftMentorAssignment = CourseMentorAssignment;
export type MentorAssignment = CourseMentorAssignment;

// ============================================================================
// COURSE COMMENT
// ============================================================================

export interface CourseComment extends BaseEntity {
  course_id: number;
  comment_text: string;
  comment?: string; // Alias for comment_text for backward compatibility
  created_by: string;
}

export type Comment = CourseComment;

export interface CourseCommentCreate {
  comment_text: string;
  created_by: string;
}

// ============================================================================
// COURSE DRAFT
// ============================================================================

export interface CourseDraft extends BaseEntity {
  course_id: number;
  mentor_assignments?: CourseMentorAssignment[];
  food_cost?: number | null;
  other_cost?: number | null;
  additional_data?: Record<string, unknown>;
  [key: string]: any;
}

export interface CourseDraftCreate {
  mentor_assignments?: CourseMentorAssignment[];
  food_cost?: number | null;
  other_cost?: number | null;
  additional_data?: Record<string, unknown>;
}

// ============================================================================
// ONLINE COURSE (LMS)
// ============================================================================

export interface OnlineCourse {
  id: number | string;
  course_id: number | string;
  course_name: string;
  status: string;
  progress?: number;
  completion_date?: string;
  enrolled_date?: string;
  score?: number;
  time_spent?: number;
  is_external?: boolean;
  is_mandatory?: boolean;  // Mandatory course flag from LMS
}

// ============================================================================
// DASHBOARD STATS
// ============================================================================

export interface DashboardStats {
  total_courses: number;
  total_students: number;
  total_enrollments: number;
  completion_rate: number;
  courses_by_status: Record<CourseStatus, number>;
  enrollments_by_month: { month: string; count: number }[];
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export interface Message {
  type: 'success' | 'error' | 'warning' | 'info';
  text: string;
}

export type AlertMessage = Message;

export interface FilterState {
  timePeriod: 'all' | 'month' | 'quarter' | 'year';
  selectedMonth: string;
  selectedQuarter: string;
  selectedYear: number;
  searchQuery: string;
}

export interface DateRange {
  start: Date;
  end: Date;
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface CourseFormData {
  name?: string;
  batch_code?: string;
  description?: string;
  start_date: Date | null;
  end_date: Date | null;
  seat_limit?: number;
  total_classes_offered?: string | number | null;
  prerequisite_course_id?: number | null;
  location?: string; // For external courses
  cost?: number | string; // For external courses
}

export interface StudentFormData {
  employee_id: string;
  name: string;
  email: string;
  department: string;
  designation?: string;
  career_start_date?: Date | null;
  bs_joining_date?: Date | null;
}

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

export interface DialogProps {
  open: boolean;
  onClose: () => void;
}

export interface TableColumn<T> {
  id: keyof T | string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'center' | 'right';
  format?: (value: T[keyof T]) => string | React.ReactNode;
}

// ============================================================================
// MENTOR MANAGEMENT TYPES
// ============================================================================

export interface EditingMentor {
  id?: number | string;
  mentor_id?: number;
  mentor?: { id: number } | Mentor | null;
  hours_taught?: number | string;
  amount_paid?: number | string;
  is_draft?: boolean;
}

export interface MentorCost {
  id: number | string;
  mentor_id: number;
  mentor_name: string;
  hours_taught: string;
  amount_paid: string;
}

export interface DraftMentorWithDetails extends DraftMentorAssignment {
  mentor: Mentor | null;
  is_draft: boolean;
}

// ============================================================================
// USER DETAILS & STATS
// ============================================================================

export interface EnrollmentWithDetails extends Enrollment {
  student_career_start_date?: string | null;
  student_bs_joining_date?: string | null;
  student_total_experience?: number | null; // From ERP
  student_exit_date?: string | null; // Leaving date for previous employees
  student_exit_reason?: string | null; // Why the employee left
  is_previous_employee?: boolean; // Flag to indicate this is a previous employee
  batch_code?: string;
  completion_status?: string;
  attendance_percentage?: number;
  attendance_status?: string;
  present?: number;
  total_attendance?: number;
  course_type?: string;
  is_lms_course?: boolean;
  // SBU Head and Reporting Manager from ERP
  sbu_head_employee_id?: string | null;
  sbu_head_name?: string | null;
  reporting_manager_employee_id?: string | null;
  reporting_manager_name?: string | null;
}

export interface OnlineCourseEnrollment {
  id: string;
  course_id: number | string;
  course_name: string;
  batch_code: string;
  course_type: string;
  completion_status: string;
  progress: number;
  course_end_date: string | null;
  date_assigned: number | null;
  lastaccess: number | null;
  is_lms_course: boolean;
  is_mandatory: boolean;
  score?: number | null;
  completion_date?: string | null;
}

export interface CompletionStats {
  rate: number;
  completed: number;
  total: number;
}

export interface SbuHead {
  id: number;
  employee_id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
}

