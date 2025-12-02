import React from 'react';
import {
    Box,
    Typography,
    Stepper,
    Step,
    StepLabel,
    StepContent,
    Paper,
    Button,
    useTheme,
} from '@mui/material';
import { useReports, ReportType } from './hooks/useReports';
import ReportTypeSelection from './components/ReportTypeSelection';
import CategorySelection from './components/CategorySelection';
import EmployeeSelection from './components/EmployeeSelection';
import CourseSelection from './components/CourseSelection';
import DownloadSection from './components/DownloadSection';
import DateRangeSelector from '../../components/DateRangeSelector';

const getSteps = (reportType: ReportType | null) => {
    const steps = [
        {
            label: 'Select Report Type',
            description: 'Choose between Course Reports or Employee Reports.',
        },
        {
            label: reportType === 'employee' ? 'Select Employee' : 'Select Category',
            description: 'Choose the specific category or employee.',
        },
    ];

    if (reportType !== 'employee') {
        steps.push({
            label: 'Select Course / Details',
            description: 'Search and select the specific course or verify details.',
        });
    }

    steps.push({
        label: 'Select Date Range',
        description: 'Filter the report data by a specific time period.',
    });

    steps.push({
        label: 'Download Report',
        description: 'Review your selection and download the report.',
    });

    return steps;
};

const Reports: React.FC = () => {
    const theme = useTheme();
    const {
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
    } = useReports();

    const steps = getSteps(reportType);

    const renderStepContent = (step: number) => {
        switch (step) {
            case 0:
                return (
                    <ReportTypeSelection
                        reportType={reportType}
                        onSelect={(type) => {
                            setReportType(type);
                            setTimeout(() => setActiveStep((prev) => prev + 1), 300);
                        }}
                    />
                );
            case 1:
                if (reportType === 'course') {
                    return (
                        <CategorySelection
                            category={category}
                            overallReportType={overallReportType}
                            onSelect={(cat) => {
                                setCategory(cat);
                                setTimeout(() => setActiveStep((prev) => prev + 1), 300);
                            }}
                        />
                    );
                } else if (reportType === 'employee') {
                    return (
                        <EmployeeSelection
                            allEmployees={allEmployees}
                            selectedEmployee={selectedEmployee}
                            isAllEmployees={isAllEmployees}
                            loading={loading}
                            onEmployeeChange={setSelectedEmployee}
                            onAllEmployeesChange={setIsAllEmployees}
                            onNext={handleNext}
                            onBack={handleBack}
                        />
                    );
                }
                return null;
            case 2:
                if (reportType === 'employee') {
                    return (
                        <Box sx={{ maxWidth: 600, mx: 'auto', py: 2 }}>
                            <DateRangeSelector onChange={handleDateRangeChange} initialOption={dateOption} />
                            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                <Button onClick={handleBack}>Back</Button>
                                <Button variant="contained" onClick={handleNext} disabled={dateOption !== 'all_time' && (!startDate || !endDate)}>
                                    Continue
                                </Button>
                            </Box>
                        </Box>
                    );
                }
                return (
                    <CourseSelection
                        category={category}
                        allCourses={allCourses}
                        selectedCourse={selectedCourse}
                        loading={loading}
                        onCourseChange={setSelectedCourse}
                        onOverallReportTypeSelect={(type) => {
                            setOverallReportType(type);
                            setActiveStep((prev) => prev + 1);
                        }}
                        onNext={handleNext}
                        onBack={handleBack}
                    />
                );
            case 3:
                if (reportType === 'employee') {
                    return (
                        <DownloadSection
                            reportType={reportType}
                            category={category}
                            overallReportType={overallReportType}
                            startDate={startDate}
                            endDate={endDate}
                            dateOption={dateOption}
                            selectedCourse={selectedCourse}
                            selectedEmployee={selectedEmployee}
                            isAllEmployees={isAllEmployees}
                            downloadingReport={downloadingReport}
                            onDownload={handleDownloadReport}
                            onBack={handleBack}
                            onReset={handleReset}
                        />
                    );
                }
                return (
                    <Box sx={{ maxWidth: 600, mx: 'auto', py: 2 }}>
                        <DateRangeSelector onChange={handleDateRangeChange} initialOption={dateOption} />
                        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                            <Button onClick={handleBack}>Back</Button>
                            <Button variant="contained" onClick={handleNext} disabled={dateOption !== 'all_time' && (!startDate || !endDate)}>
                                Continue
                            </Button>
                        </Box>
                    </Box>
                );
            case 4:
                return (
                    <DownloadSection
                        reportType={reportType}
                        category={category}
                        overallReportType={overallReportType}
                        startDate={startDate}
                        endDate={endDate}
                        dateOption={dateOption}
                        selectedCourse={selectedCourse}
                        selectedEmployee={selectedEmployee}
                        isAllEmployees={isAllEmployees}
                        downloadingReport={downloadingReport}
                        onDownload={handleDownloadReport}
                        onBack={handleBack}
                        onReset={handleReset}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box mb={4}>
                <Typography
                    variant="h4"
                    gutterBottom
                    sx={{
                        fontWeight: 700,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.info.main} 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}
                >
                    Reports Center
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontSize: '0.95rem' }}>
                    Generate and download detailed training reports
                </Typography>
            </Box>

            <Paper sx={{ p: 3, minHeight: 400 }}>
                <Stepper activeStep={activeStep} orientation="vertical">
                    {steps.map((step, index) => (
                        <Step key={step.label}>
                            <StepLabel>
                                <Typography variant="subtitle1" fontWeight={600}>
                                    {step.label}
                                </Typography>
                            </StepLabel>
                            <StepContent>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    {step.description}
                                </Typography>
                                {renderStepContent(index)}
                            </StepContent>
                        </Step>
                    ))}
                </Stepper>
                {activeStep === steps.length && (
                    <Paper square elevation={0} sx={{ p: 3 }}>
                        <Typography>All steps completed - you&apos;re finished</Typography>
                        <Button onClick={handleReset} sx={{ mt: 1, mr: 1 }}>
                            Reset
                        </Button>
                    </Paper>
                )}
            </Paper>
        </Box>
    );
};

export default Reports;
