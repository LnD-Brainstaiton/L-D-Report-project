import { useState, useEffect, useCallback } from 'react';
import { studentsAPI } from '../services/api';
import { sortOnlineCourses } from '../utils/courseUtils';
import {
    EnrollmentWithDetails,
    OnlineCourseEnrollment,
    CompletionStats,
    SbuHead,
    CourseType
} from '../types';

interface UseStudentDetailsProps {
    enrollment: EnrollmentWithDetails | null;
    open: boolean;
}

interface UseStudentDetailsReturn {
    studentEnrollments: EnrollmentWithDetails[];
    onlineCourses: OnlineCourseEnrollment[];
    loadingEnrollments: boolean;
    completionStats: Record<CourseType, CompletionStats>;
    sbuHead: SbuHead | null;
    reportingManager: { employee_id: string; name: string } | null;
    fetchStudentByEmployeeId: (employeeId: string) => Promise<EnrollmentWithDetails | null>;
}

export const useStudentDetails = ({ enrollment, open }: UseStudentDetailsProps): UseStudentDetailsReturn => {
    const [studentEnrollments, setStudentEnrollments] = useState<EnrollmentWithDetails[]>([]);
    const [onlineCourses, setOnlineCourses] = useState<OnlineCourseEnrollment[]>([]);
    const [loadingEnrollments, setLoadingEnrollments] = useState(false);
    const [sbuHead, setSbuHead] = useState<SbuHead | null>(null);
    const [reportingManager, setReportingManager] = useState<{ employee_id: string; name: string } | null>(null);
    const [completionStats, setCompletionStats] = useState<Record<CourseType, CompletionStats>>({
        onsite: { rate: 0, completed: 0, total: 0 },
        online: { rate: 0, completed: 0, total: 0 },
        external: { rate: 0, completed: 0, total: 0 },
    });

    const loadSbuHeadAndReportingManager = useCallback(() => {
        if (enrollment?.sbu_head_employee_id && enrollment?.sbu_head_name) {
            setSbuHead({
                id: 0,
                employee_id: enrollment.sbu_head_employee_id,
                name: enrollment.sbu_head_name,
                email: '',
                department: enrollment.student_department || '',
                designation: 'SBU Head',
            });
        } else {
            setSbuHead(null);
        }

        if (enrollment?.reporting_manager_employee_id && enrollment?.reporting_manager_name) {
            setReportingManager({
                employee_id: enrollment.reporting_manager_employee_id,
                name: enrollment.reporting_manager_name,
            });
        } else {
            setReportingManager(null);
        }
    }, [enrollment]);

    const fetchStudentEnrollments = useCallback(async () => {
        if (!enrollment?.student_id) return;

        setLoadingEnrollments(true);
        try {
            const response = await studentsAPI.getEnrollments(enrollment.student_id);
            const data = response.data as any;

            let onsiteEnrollments: EnrollmentWithDetails[] = [];
            if (Array.isArray(data)) {
                onsiteEnrollments = data || [];
            } else {
                onsiteEnrollments = data.enrollments || [];
            }
            setStudentEnrollments(onsiteEnrollments);

            const onlineCoursesList = data.online_courses || [];
            const mappedOnlineCourses: OnlineCourseEnrollment[] = onlineCoursesList.map((course: any) => ({
                id: course.id,
                course_id: course.course_id,
                course_name: course.course_name,
                batch_code: course.batch_code || '',
                course_type: 'online',
                completion_status: course.completion_status,
                progress: course.progress ?? 0,
                course_end_date: course.course_end_date,
                date_assigned: course.date_assigned,
                lastaccess: course.lastaccess,
                is_lms_course: true,
                is_mandatory: course.is_mandatory === true || course.is_mandatory === 1,
                score: course.score,
                completion_date: course.completion_date,
            }));

            const sortedOnlineCourses = sortOnlineCourses(mappedOnlineCourses);
            setOnlineCourses(sortedOnlineCourses);

            if (data.onsite_stats && data.online_stats) {
                setCompletionStats({
                    onsite: {
                        rate: data.onsite_stats.rate,
                        completed: data.onsite_stats.completed,
                        total: data.onsite_stats.total
                    },
                    online: {
                        rate: data.online_stats.rate,
                        completed: data.online_stats.completed,
                        total: data.online_stats.total
                    },
                    external: { rate: 0, completed: 0, total: 0 },
                });
            } else {
                const onlineCompleted = mappedOnlineCourses.filter((c) => c.completion_status === 'Completed').length;
                const onlineTotal = mappedOnlineCourses.length;
                const onlineRate = onlineTotal > 0 ? (onlineCompleted / onlineTotal) * 100 : 0;

                const onsiteRelevant = onsiteEnrollments
                    .filter(
                        (e) =>
                            e.approval_status === 'Withdrawn' ||
                            (e.approval_status === 'Approved' && ['Completed', 'Failed'].includes(e.completion_status || ''))
                    )
                    .filter((e) => e.approval_status !== 'Rejected');

                const onsiteTotal = onsiteRelevant.length;
                const onsiteCompleted = onsiteRelevant.filter((e) => e.completion_status === 'Completed').length;
                const onsiteRate = onsiteTotal > 0 ? (onsiteCompleted / onsiteTotal) * 100 : 0;

                setCompletionStats({
                    onsite: { rate: onsiteRate, completed: onsiteCompleted, total: onsiteTotal },
                    online: { rate: onlineRate, completed: onlineCompleted, total: onlineTotal },
                    external: { rate: 0, completed: 0, total: 0 },
                });
            }
        } catch (error) {
            console.error('useStudentDetails: Error fetching student enrollments:', error);
            setStudentEnrollments([]);
            setOnlineCourses([]);
            setCompletionStats({
                onsite: { rate: 0, completed: 0, total: 0 },
                online: { rate: 0, completed: 0, total: 0 },
                external: { rate: 0, completed: 0, total: 0 },
            });
        } finally {
            setLoadingEnrollments(false);
        }
    }, [enrollment?.student_id]);

    const fetchStudentByEmployeeId = async (employeeId: string): Promise<EnrollmentWithDetails | null> => {
        try {
            const response = await studentsAPI.getAllWithCourses({});
            const students = response.data as any[];

            const student = students.find(
                (s) => s.employee_id?.toUpperCase() === employeeId.toUpperCase()
            );

            if (!student) {
                console.error(`Student with employee_id ${employeeId} not found`);
                return null;
            }

            return {
                id: 0,
                student_id: student.id,
                student_name: student.name,
                student_email: student.email || '',
                student_department: student.department || '',
                student_employee_id: student.employee_id,
                student_designation: student.designation || '',
                student_experience_years: student.experience_years || 0,
                student_career_start_date: student.career_start_date || null,
                student_bs_joining_date: student.bs_joining_date || null,
                student_total_experience: student.total_experience || null,
                course_id: 0,
                approval_status: 'Approved',
                eligibility_status: 'Eligible',
                sbu_head_employee_id: student.sbu_head_employee_id || null,
                sbu_head_name: student.sbu_head_name || null,
                reporting_manager_employee_id: student.reporting_manager_employee_id || null,
                reporting_manager_name: student.reporting_manager_name || null,
                is_previous_employee: !student.is_active || false,
                student_exit_date: student.exit_date || null,
                student_exit_reason: student.exit_reason || null,
            };
        } catch (error) {
            console.error('Error fetching student by employee_id:', error);
            return null;
        }
    };

    useEffect(() => {
        if (open && enrollment?.student_id) {
            fetchStudentEnrollments();
            loadSbuHeadAndReportingManager();
        } else {
            setStudentEnrollments([]);
            setSbuHead(null);
            setReportingManager(null);
        }
    }, [open, enrollment?.student_id, enrollment?.sbu_head_employee_id, enrollment?.reporting_manager_employee_id, fetchStudentEnrollments, loadSbuHeadAndReportingManager]);

    return {
        studentEnrollments,
        onlineCourses,
        loadingEnrollments,
        completionStats,
        sbuHead,
        reportingManager,
        fetchStudentByEmployeeId
    };
};
