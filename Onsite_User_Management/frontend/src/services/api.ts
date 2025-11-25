import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type {
  Course,
  CourseCreate,
  CourseUpdate,
  CourseCostUpdate,
  CourseMentorCreate,
  CourseMentor,
  CourseComment,
  CourseCommentCreate,
  CourseDraft,
  CourseDraftCreate,
  Student,
  StudentWithCourses,
  Enrollment,
  EnrollmentCreate,
  EnrollmentApprovalPayload,
  Mentor,
  MentorCreate,
  MentorStats,
  DashboardStats,
  OnlineCourse,
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 second timeout for large reports
});

// Initialize token from localStorage if available
const token = localStorage.getItem('token');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Request interceptor for adding auth tokens
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ============================================================================
// AUTH API
// ============================================================================

interface LoginResponse {
  access_token: string;
  token_type: string;
}

interface UserResponse {
  id: number;
  email: string;
  name: string;
  role: string;
}

export const authAPI = {
  login: (email: string, password: string): Promise<AxiosResponse<LoginResponse>> =>
    api.post('/auth/login', { email, password }),
  getMe: (): Promise<AxiosResponse<UserResponse>> => api.get('/auth/me'),
};

// ============================================================================
// ENROLLMENTS API
// ============================================================================

interface EnrollmentParams {
  course_id?: number | string;
  student_id?: number | string;
  approval_status?: string;
  skip?: number;
  limit?: number;
}

interface BulkApproveData {
  enrollment_ids: number[];
}

export const enrollmentsAPI = {
  getAll: (params?: EnrollmentParams): Promise<AxiosResponse<Enrollment[]>> =>
    api.get('/enrollments', { params }),
  getEligible: (params?: EnrollmentParams): Promise<AxiosResponse<Enrollment[]>> =>
    api.get('/enrollments/eligible', { params }),
  getById: (id: number): Promise<AxiosResponse<Enrollment>> =>
    api.get(`/enrollments/${id}`),
  create: (data: EnrollmentCreate): Promise<AxiosResponse<Enrollment>> =>
    api.post('/enrollments', data),
  approve: (data: EnrollmentApprovalPayload, approvedBy: string): Promise<AxiosResponse<Enrollment>> =>
    api.post('/enrollments/approve', data, { params: { approved_by: approvedBy } }),
  bulkApprove: (data: BulkApproveData, approvedBy: string): Promise<AxiosResponse<Enrollment[]>> =>
    api.post('/enrollments/approve/bulk', data, { params: { approved_by: approvedBy } }),
  withdraw: (id: number, reason: string, withdrawnBy: string): Promise<AxiosResponse<Enrollment>> =>
    api.post(`/enrollments/${id}/withdraw`, null, {
      params: { withdrawal_reason: reason, withdrawn_by: withdrawnBy },
    }),
  reapprove: (id: number, approvedBy: string): Promise<AxiosResponse<Enrollment>> =>
    api.post(`/enrollments/${id}/reapprove`, null, { params: { approved_by: approvedBy } }),
  getDashboardStats: (): Promise<AxiosResponse<DashboardStats>> =>
    api.get('/enrollments/dashboard/stats'),
};

// ============================================================================
// COURSES API
// ============================================================================

interface CourseParams {
  status?: string;
  course_type?: string;
  skip?: number;
  limit?: number;
}

export const coursesAPI = {
  getAll: (params?: CourseParams): Promise<AxiosResponse<Course[]>> =>
    api.get('/courses/', { params }),
  getById: (id: number | string): Promise<AxiosResponse<Course>> =>
    api.get(`/courses/${id}`),
  create: (data: CourseCreate): Promise<AxiosResponse<Course>> =>
    api.post('/courses', data),
  update: (id: number | string, data: CourseUpdate): Promise<AxiosResponse<Course>> =>
    api.put(`/courses/${id}`, data),
  delete: (id: number | string): Promise<AxiosResponse<void>> =>
    api.delete(`/courses/${id}`),
  remove: (id: number | string): Promise<AxiosResponse<void>> =>
    api.delete(`/courses/${id}`),
  generateReport: (id: number | string): Promise<AxiosResponse<Blob>> =>
    api.get(`/courses/${id}/report`, { responseType: 'blob' }),
  updateCosts: (id: number | string, data: CourseCostUpdate): Promise<AxiosResponse<Course>> =>
    api.put(`/courses/${id}/costs`, data),
  assignMentor: (id: number | string, data: CourseMentorCreate): Promise<AxiosResponse<CourseMentor>> =>
    api.post(`/courses/${id}/mentors`, data),
  removeCourseMentor: (courseId: number | string, courseMentorId: number | string): Promise<AxiosResponse<void>> =>
    api.delete(`/courses/${courseId}/mentors/${courseMentorId}`),
  // Comment endpoints
  addComment: (courseId: number | string, data: CourseCommentCreate): Promise<AxiosResponse<CourseComment>> =>
    api.post(`/courses/${courseId}/comments`, data),
  getComments: (courseId: number | string): Promise<AxiosResponse<CourseComment[]>> =>
    api.get(`/courses/${courseId}/comments`),
  // Draft endpoints
  saveDraft: (courseId: number | string, data: CourseDraftCreate): Promise<AxiosResponse<CourseDraft>> =>
    api.post(`/courses/${courseId}/draft`, data),
  updateDraft: (courseId: number | string, data: CourseDraftCreate): Promise<AxiosResponse<CourseDraft>> =>
    api.put(`/courses/${courseId}/draft`, data),
  getDraft: (courseId: number | string): Promise<AxiosResponse<CourseDraft>> =>
    api.get(`/courses/${courseId}/draft`),
  // Approval endpoint
  approveCourse: (courseId: number | string, approvedBy: string): Promise<AxiosResponse<Course>> =>
    api.post(`/courses/${courseId}/approve`, null, { params: { approved_by: approvedBy } }),
};

// ============================================================================
// LMS API
// ============================================================================

interface LMSCourse {
  id: number | string;
  name?: string;
  fullname?: string;
  shortname?: string;
  summary?: string;
  description?: string;
  startdate?: number;
  enddate?: number;
  categoryname?: string;
  categoryid?: number;
  visible?: number;
  enrollment_count?: number;
  [key: string]: any;
}

interface LMSEnrollment {
  user_id: string;
  user_name: string;
  user_email: string;
  status: string;
  progress?: number;
  completion_date?: string;
}

export const lmsAPI = {
  getCourses: (includeEnrollmentCounts = false): Promise<AxiosResponse<LMSCourse[]>> =>
    api.get('/lms/courses', { params: { include_enrollment_counts: includeEnrollmentCounts } }),
  getCourseEnrollments: (courseId: number | string): Promise<AxiosResponse<LMSEnrollment[]>> =>
    api.get(`/lms/courses/${courseId}/enrollments`),
  getUserCourses: (userId: string): Promise<AxiosResponse<OnlineCourse[]>> =>
    api.get(`/lms/users/${userId}/courses`),
};

// ============================================================================
// STUDENTS API
// ============================================================================

interface StudentParams {
  department?: string;
  is_active?: boolean;
  skip?: number;
  limit?: number;
}

interface StudentEnrollmentsResponse {
  enrollments: Enrollment[];
  stats?: {
    total: number;
    completed: number;
    completion_rate: number;
  };
}

interface DepartmentsResponse {
  departments: string[];
}

interface StudentCountResponse {
  count: number;
}

export const studentsAPI = {
  getAll: (params?: StudentParams): Promise<AxiosResponse<Student[]>> =>
    api.get('/students', { params }),
  getById: (id: number): Promise<AxiosResponse<Student>> =>
    api.get(`/students/${id}`),
  create: (data: Partial<Student>): Promise<AxiosResponse<Student>> =>
    api.post('/students', data),
  getEnrollments: (id: number): Promise<AxiosResponse<StudentEnrollmentsResponse | Enrollment[]>> =>
    api.get(`/students/${id}/enrollments`),
  getAllWithCourses: (params?: StudentParams): Promise<AxiosResponse<StudentWithCourses[]>> =>
    api.get('/students/all/with-courses', { params }),
  getCount: (params?: StudentParams): Promise<AxiosResponse<StudentCountResponse>> =>
    api.get('/students/count', { params }),
  getDepartments: (params?: { is_active?: boolean }): Promise<AxiosResponse<DepartmentsResponse>> =>
    api.get('/students/departments', { params }),
  remove: (id: number): Promise<AxiosResponse<Student>> =>
    api.post(`/students/${id}/remove`),
  restore: (id: number): Promise<AxiosResponse<Student>> =>
    api.post(`/students/${id}/restore`),
  generateOverallReport: (): Promise<AxiosResponse<Blob>> =>
    api.get('/students/report/overall', { responseType: 'blob' }),
  tagAsMentor: (id: number): Promise<AxiosResponse<Mentor>> =>
    api.post(`/students/${id}/mentor-tag`),
  removeMentorTag: (id: number): Promise<AxiosResponse<void>> =>
    api.delete(`/students/${id}/mentor-tag`),
  importExcel: (file: File): Promise<AxiosResponse<{ imported: number; errors: string[] }>> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/students/import/excel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  importCSV: (file: File): Promise<AxiosResponse<{ imported: number; errors: string[] }>> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/students/import/csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ============================================================================
// MENTORS API
// ============================================================================

type MentorType = 'all' | 'internal' | 'external';

export const mentorsAPI = {
  getAll: (type: MentorType = 'all'): Promise<AxiosResponse<Mentor[]>> =>
    api.get('/mentors', { params: { type } }),
  createExternal: (data: MentorCreate): Promise<AxiosResponse<Mentor>> =>
    api.post('/mentors', data),
  createInternal: (studentId: number): Promise<AxiosResponse<Mentor>> =>
    api.post(`/mentors/internal/${studentId}`),
  getById: (id: number): Promise<AxiosResponse<Mentor>> =>
    api.get(`/mentors/${id}`),
  update: (id: number, data: Partial<MentorCreate>): Promise<AxiosResponse<Mentor>> =>
    api.put(`/mentors/${id}`, data),
  getStats: (id: number): Promise<AxiosResponse<MentorStats>> =>
    api.get(`/mentors/${id}/stats`),
  delete: (id: number): Promise<AxiosResponse<void>> =>
    api.delete(`/mentors/${id}`),
};

// ============================================================================
// IMPORTS API
// ============================================================================

interface ImportResponse {
  imported: number;
  errors: string[];
  warnings?: string[];
}

interface SyncStatus {
  last_sync: string;
  status: string;
}

export const importsAPI = {
  uploadExcel: (file: File, courseId: number | string): Promise<AxiosResponse<ImportResponse>> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/imports/excel?course_id=${courseId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadCSV: (file: File, courseId: number | string): Promise<AxiosResponse<ImportResponse>> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/imports/csv?course_id=${courseId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getSyncStatus: (): Promise<AxiosResponse<SyncStatus>> =>
    api.get('/imports/sync-status'),
};

// ============================================================================
// COMPLETIONS API
// ============================================================================

interface CompletionUpdate {
  is_completed: boolean;
  score?: number;
  completion_date?: string;
}

interface BulkCompletionUpdate {
  enrollment_ids: number[];
  is_completed: boolean;
  score?: number;
}

export const completionsAPI = {
  upload: (file: File, courseId: number | string): Promise<AxiosResponse<ImportResponse>> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/completions/upload?course_id=${courseId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadAttendance: (file: File, courseId: number | string): Promise<AxiosResponse<ImportResponse>> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/completions/attendance/upload?course_id=${courseId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  bulkUpdate: (data: BulkCompletionUpdate): Promise<AxiosResponse<Enrollment[]>> =>
    api.post('/completions/bulk', data),
  update: (id: number, data: CompletionUpdate): Promise<AxiosResponse<Enrollment>> =>
    api.put(`/completions/${id}`, data),
  updateEnrollmentAttendance: (
    enrollmentId: number,
    classesAttended: number,
    score?: number
  ): Promise<AxiosResponse<Enrollment>> => {
    return api.put(`/completions/enrollment/${enrollmentId}`, null, {
      params: {
        classes_attended: classesAttended,
        score: score,
      },
    });
  },
};

