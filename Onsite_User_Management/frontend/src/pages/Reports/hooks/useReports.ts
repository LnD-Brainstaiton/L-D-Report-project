import { useState, useEffect } from 'react';
import { coursesAPI, studentsAPI, lmsAPI } from '../../../services/api';
import { format } from 'date-fns';
import type { Course } from '../../../types';
import { DateRangeOption } from '../../../components/DateRangeSelector';

export type ReportCategory = 'overall' | 'onsite' | 'online' | 'external';
export type ReportType = 'course' | 'employee';

export const useReports = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [reportType, setReportType] = useState<ReportType | null>(null);
    const [category, setCategory] = useState<ReportCategory | null>(null);
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [dateOption, setDateOption] = useState<DateRangeOption>('month');
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
    const [isAllEmployees, setIsAllEmployees] = useState(false);
    const [overallReportType, setOverallReportType] = useState<ReportCategory | null>(null);
    const [loading, setLoading] = useState(false);
    const [allCourses, setAllCourses] = useState<Course[]>([]);
    const [allEmployees, setAllEmployees] = useState<any[]>([]);
    const [downloadingReport, setDownloadingReport] = useState<string | null>(null);

    // Fetch courses when category changes
    useEffect(() => {
        if (category && category !== 'overall' && reportType === 'course') {
            fetchCourses(category);
        }
    }, [category, reportType]);

    // Fetch employees when report type is employee
    useEffect(() => {
        if (reportType === 'employee') {
            fetchEmployees();
        }
    }, [reportType]);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const response = await studentsAPI.getAll({ is_active: true });
            setAllEmployees(response.data);
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCourses = async (selectedCategory: ReportCategory) => {
        setLoading(true);
        setAllCourses([]); // Clear previous courses
        try {
            if (selectedCategory === 'online') {
                const response = await lmsAPI.getCourses();
                // Map LMS courses to Course interface
                const mappedCourses: Course[] = response.data.courses.map((lmsCourse: any) => ({
                    id: lmsCourse.id,
                    name: lmsCourse.fullname, // Map fullname to name
                    batch_code: lmsCourse.shortname || 'N/A', // Map shortname to batch_code
                    course_type: 'online',
                    status: 'ongoing', // Default status
                    ...lmsCourse
                }));
                setAllCourses(mappedCourses);
            } else {
                const response = await coursesAPI.getAll({ course_type: selectedCategory });
                setAllCourses(response.data);
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        if (activeStep === 1 && category === 'overall' && reportType === 'course') {
            setCategory(null);
            setOverallReportType(null);
        }
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleReset = () => {
        setActiveStep(0);
        setReportType(null);
        setCategory(null);
        setOverallReportType(null);
        setSelectedCourse(null);
        setSelectedEmployee(null);
        setIsAllEmployees(false);
        setAllCourses([]);
    };

    const handleDateRangeChange = (start: Date | null, end: Date | null, option: DateRangeOption) => {
        setStartDate(start);
        setEndDate(end);
        setDateOption(option);
    };

    const handleDownloadReport = async (type: 'overall' | 'summary' | 'participants', ignoreDateRange: boolean = false) => {
        const reportKey = ignoreDateRange ? `${type}_all` : type;
        setDownloadingReport(reportKey);
        try {
            let response;
            let filename: string = 'report.xlsx';

            const formattedStartDate = (startDate && !ignoreDateRange) ? format(startDate, 'yyyy-MM-dd') : undefined;
            const formattedEndDate = (endDate && !ignoreDateRange) ? format(endDate, 'yyyy-MM-dd') : undefined;

            if (reportType === 'employee') {
                if (isAllEmployees) {
                    response = await studentsAPI.generateOverallReport(formattedStartDate, formattedEndDate);
                    filename = `all_employees_report_${new Date().toISOString().split('T')[0]}.xlsx`;
                } else if (selectedEmployee) {
                    response = await studentsAPI.generateStudentReport(selectedEmployee.id, formattedStartDate, formattedEndDate);
                    filename = `employee_report_${selectedEmployee.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
                }
            } else if (type === 'overall') {
                // Use overallReportType if available (new flow), otherwise fall back to category
                const targetCategory = overallReportType || category;

                if (targetCategory === 'online') {
                    response = await lmsAPI.generateOverallReport(formattedStartDate, formattedEndDate);
                    filename = `online_overall_report_${new Date().toISOString().split('T')[0]}.xlsx`;
                } else if (targetCategory === 'onsite' || targetCategory === 'external') {
                    response = await coursesAPI.generateOverallReport(targetCategory, formattedStartDate, formattedEndDate);
                    filename = `${targetCategory}_overall_report_${new Date().toISOString().split('T')[0]}.xlsx`;
                } else {
                    response = await studentsAPI.generateOverallReport(formattedStartDate, formattedEndDate);
                    filename = `overall_training_report_${new Date().toISOString().split('T')[0]}.xlsx`;
                }
            } else if (selectedCourse) {
                if (category === 'online') {
                    // Use LMS API for online courses
                    if (type === 'summary') {
                        response = await lmsAPI.generateSummaryReport(selectedCourse.id);
                        filename = `online_course_summary_${selectedCourse.id}.xlsx`;
                    } else if (type === 'participants') {
                        response = await lmsAPI.generateReport(selectedCourse.id, formattedStartDate, formattedEndDate);
                        filename = `online_participant_details_${selectedCourse.id}.xlsx`;
                    }
                } else {
                    // Use Standard Courses API for onsite/external
                    if (type === 'summary') {
                        response = await coursesAPI.generateSummaryReport(selectedCourse.id);
                        filename = `course_summary_${selectedCourse.id}.xlsx`;
                    } else if (type === 'participants') {
                        response = await coursesAPI.generateReport(selectedCourse.id, formattedStartDate, formattedEndDate);
                        filename = `participant_details_${selectedCourse.id}.xlsx`;
                    }
                }
            }

            if (response) {
                const contentDisposition = response.headers['content-disposition'];
                if (contentDisposition) {
                    const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
                    if (filenameMatch) {
                        filename = filenameMatch[1];
                    }
                }

                const blob = new Blob([response.data], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Error downloading report:', error);
            alert('Error downloading report. Please try again.');
        } finally {
            setDownloadingReport(null);
        }
    };

    return {
        activeStep,
        setActiveStep,
        reportType,
        setReportType,
        category,
        setCategory,
        startDate,
        endDate,
        dateOption,
        selectedCourse,
        setSelectedCourse,
        selectedEmployee,
        setSelectedEmployee,
        isAllEmployees,
        setIsAllEmployees,
        overallReportType,
        setOverallReportType,
        loading,
        allCourses,
        allEmployees,
        downloadingReport,
        handleNext,
        handleBack,
        handleReset,
        handleDateRangeChange,
        handleDownloadReport,
    };
};
