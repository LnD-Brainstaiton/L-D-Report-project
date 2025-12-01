import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  useTheme,
  alpha,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Autocomplete,
  TextField,
  Divider,
  Chip,
} from '@mui/material';
import {
  Description,
  Download,
  ArrowForward,
  ArrowBack,
  CheckCircle,
  School,
  Computer,
  Public,
  Assessment
} from '@mui/icons-material';
import { coursesAPI, studentsAPI, lmsAPI } from '../services/api';
import { formatDateForDisplay } from '../utils/dateUtils';
import type { Course } from '../types';
import DateRangeSelector, { DateRangeOption } from '../components/DateRangeSelector';
import { format } from 'date-fns';

type ReportCategory = 'overall' | 'onsite' | 'online' | 'external';
type ReportType = 'course' | 'employee';

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

  const steps = getSteps(reportType);

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
        // Use overallReportType if available (new flow), otherwise fall back to category (shouldn't happen in new flow but good for safety)
        const targetCategory = overallReportType || category;

        if (targetCategory === 'online') {
          response = await lmsAPI.generateOverallReport(formattedStartDate, formattedEndDate);
          filename = `online_overall_report_${new Date().toISOString().split('T')[0]}.xlsx`;
        } else if (targetCategory === 'onsite' || targetCategory === 'external') {
          response = await coursesAPI.generateOverallReport(targetCategory, formattedStartDate, formattedEndDate);
          filename = `${targetCategory}_overall_report_${new Date().toISOString().split('T')[0]}.xlsx`;
        } else {
          // This path might be unreachable now if we force selection, but keeping as fallback
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

  const getFilteredCourses = () => {
    // We now fetch filtered courses directly, so just return allCourses
    return allCourses;
  };

  const renderCategoryCard = (
    value: ReportCategory,
    title: string,
    description: string,
    icon: React.ReactNode,
    color: string,
    onClick?: () => void
  ) => (
    <Grid item xs={12} sm={6}>
      <Card
        sx={{
          cursor: 'pointer',
          border: (category === value || overallReportType === value) ? `2px solid ${color}` : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          backgroundColor: (category === value || overallReportType === value) ? alpha(color, 0.04) : 'background.paper',
          transition: 'all 0.2s',
          height: '100%',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[4],
            borderColor: color,
          },
        }}
        onClick={onClick || (() => {
          setCategory(value);
          // Auto-advance
          setTimeout(() => {
            setActiveStep((prev) => prev + 1);
          }, 300);
        })}
      >
        <CardContent sx={{ textAlign: 'center', py: 3 }}>
          <Box sx={{ color: color, mb: 2 }}>{icon}</Box>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  );

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Card
                sx={{
                  cursor: 'pointer',
                  border: reportType === 'course' ? `2px solid ${theme.palette.primary.main}` : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  backgroundColor: reportType === 'course' ? alpha(theme.palette.primary.main, 0.04) : 'background.paper',
                  transition: 'all 0.2s',
                  height: '100%',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[4],
                    borderColor: theme.palette.primary.main,
                  },
                }}
                onClick={() => {
                  setReportType('course');
                  setTimeout(() => setActiveStep((prev) => prev + 1), 300);
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Box sx={{ color: theme.palette.primary.main, mb: 2 }}><School sx={{ fontSize: 40 }} /></Box>
                  <Typography variant="h6" gutterBottom>Course Reports</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Generate reports for specific courses or categories (Onsite, Online, External).
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card
                sx={{
                  cursor: 'pointer',
                  border: reportType === 'employee' ? `2px solid ${theme.palette.secondary.main}` : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  backgroundColor: reportType === 'employee' ? alpha(theme.palette.secondary.main, 0.04) : 'background.paper',
                  transition: 'all 0.2s',
                  height: '100%',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[4],
                    borderColor: theme.palette.secondary.main,
                  },
                }}
                onClick={() => {
                  setReportType('employee');
                  setTimeout(() => setActiveStep((prev) => prev + 1), 300);
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Box sx={{ color: theme.palette.secondary.main, mb: 2 }}><Assessment sx={{ fontSize: 40 }} /></Box>
                  <Typography variant="h6" gutterBottom>Employee Reports</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Generate comprehensive training history for individual employees or all staff.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );
      case 1:
        if (reportType === 'course') {
          return (
            <Grid container spacing={2}>
              {renderCategoryCard(
                'onsite',
                'Onsite Courses',
                'Physical classroom training sessions',
                <School sx={{ fontSize: 40 }} />,
                theme.palette.primary.main
              )}
              {renderCategoryCard(
                'online',
                'Online Courses',
                'E-learning and virtual courses',
                <Computer sx={{ fontSize: 40 }} />,
                theme.palette.info.main
              )}
              {renderCategoryCard(
                'external',
                'External Courses',
                'Training by external providers',
                <Public sx={{ fontSize: 40 }} />,
                theme.palette.success.main
              )}
              {renderCategoryCard(
                'overall',
                'Overall Report',
                'Complete training history across all types',
                <Assessment sx={{ fontSize: 40 }} />,
                theme.palette.warning.main
              )}
            </Grid>
          );
        } else if (reportType === 'employee') {
          return (
            <Box sx={{ maxWidth: 600, mx: 'auto', py: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Select Employee
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Button
                  variant={isAllEmployees ? "contained" : "outlined"}
                  onClick={() => {
                    setIsAllEmployees(!isAllEmployees);
                    setSelectedEmployee(null);
                  }}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  {isAllEmployees ? "Selected: All Employees (Master Report)" : "Select All Employees (Master Report)"}
                </Button>
              </Box>

              <Divider sx={{ my: 2 }}>OR</Divider>

              <Autocomplete
                options={allEmployees}
                getOptionLabel={(option) => `${option.name} (${option.employee_id})`}
                value={selectedEmployee}
                onChange={(_, newValue) => {
                  setSelectedEmployee(newValue);
                  setIsAllEmployees(false);
                }}
                disabled={isAllEmployees}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search Employee"
                    placeholder="Type to search by name or ID..."
                  />
                )}
                loading={loading}
                sx={{ mb: 4 }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button onClick={handleBack}>Back</Button>
                <Button variant="contained" onClick={handleNext} disabled={!selectedEmployee && !isAllEmployees}>
                  Continue
                </Button>
              </Box>
            </Box>
          );
        }
        return null;
      case 2:
        if (reportType === 'employee') {
          // Render Date Range for Employee
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
        // Course Mode: Select Course or Overall Type
        if (category === 'overall') {
          return (
            <Box sx={{ maxWidth: 800, mx: 'auto', py: 2 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ mb: 3, textAlign: 'center' }}>
                Select Overall Report Type
              </Typography>
              <Grid container spacing={2}>
                {renderCategoryCard(
                  'onsite',
                  'Overall Onsite Report',
                  'Consolidated report for all onsite courses',
                  <School sx={{ fontSize: 40 }} />,
                  theme.palette.primary.main,
                  () => {
                    setOverallReportType('onsite');
                    setActiveStep((prev) => prev + 1);
                  }
                )}
                {renderCategoryCard(
                  'online',
                  'Overall Online Report',
                  'Consolidated report for all online courses',
                  <Computer sx={{ fontSize: 40 }} />,
                  theme.palette.info.main,
                  () => {
                    setOverallReportType('online');
                    setActiveStep((prev) => prev + 1);
                  }
                )}
                {renderCategoryCard(
                  'external',
                  'Overall External Report',
                  'Consolidated report for all external courses',
                  <Public sx={{ fontSize: 40 }} />,
                  theme.palette.success.main,
                  () => {
                    setOverallReportType('external');
                    setActiveStep((prev) => prev + 1);
                  }
                )}
              </Grid>
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-start' }}>
                <Button onClick={handleBack} startIcon={<ArrowBack />}>
                  Back
                </Button>
              </Box>
            </Box>
          );
        }
        return (
          <Box sx={{ maxWidth: 600, mx: 'auto', py: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Select {category ? category.charAt(0).toUpperCase() + category.slice(1) : ''} Course
            </Typography>
            <Autocomplete
              options={getFilteredCourses()}
              getOptionLabel={(option) => `${option.name} (${option.batch_code})`}
              value={selectedCourse}
              onChange={(_, newValue) => setSelectedCourse(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search Course"
                  placeholder="Type to search by name or batch code..."
                  helperText={`${getFilteredCourses().length} courses available`}
                />
              )}
              noOptionsText="No courses found for this category"
              loading={loading}
              sx={{ mb: 4 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button onClick={handleBack}>Back</Button>
              <Button variant="contained" onClick={handleNext} disabled={!selectedCourse}>
                Continue
              </Button>
            </Box>
          </Box>
        );
      case 3:
        if (reportType === 'employee') {
          // Render Download for Employee
          return (
            <Box sx={{ maxWidth: 600, mx: 'auto', py: 2 }}>
              <Paper variant="outlined" sx={{ p: 3, mb: 3, backgroundColor: alpha(theme.palette.background.default, 0.5) }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Selected Filters
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Report Type</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" fontWeight={500} sx={{ textTransform: 'capitalize' }}>
                        Employee Report
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Date Range</Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {dateOption === 'all_time' ? 'All Time' : `${startDate && format(startDate, 'MMM d, yyyy')} - ${endDate && format(endDate, 'MMM d, yyyy')}`}
                    </Typography>
                  </Grid>
                  {(selectedEmployee || isAllEmployees) && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">Selected Employee</Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {isAllEmployees ? "All Employees (Master Report)" : `${selectedEmployee.name} (${selectedEmployee.employee_id})`}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={downloadingReport === 'participants' ? <CircularProgress size={20} color="inherit" /> : <Download />}
                    onClick={() => handleDownloadReport('participants')}
                    disabled={!!downloadingReport}
                    fullWidth
                    sx={{ py: 1.5 }}
                  >
                    {downloadingReport === 'participants' ? 'Downloading...' : 'Download Employee Report'}
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                    Full training history (Onsite, Online, External)
                  </Typography>
                </Grid>
              </Grid>

              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-start' }}>
                <Button onClick={handleBack} startIcon={<ArrowBack />}>
                  Back
                </Button>
                <Box sx={{ flex: 1 }} />
                <Button color="inherit" onClick={handleReset}>
                  Start Over
                </Button>
              </Box>
            </Box>
          );
        }
        // Course Mode: Date Range
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
        // Course Mode: Download
        return (
          <Box sx={{ maxWidth: 600, mx: 'auto', py: 2 }}>
            <Paper variant="outlined" sx={{ p: 3, mb: 3, backgroundColor: alpha(theme.palette.background.default, 0.5) }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Selected Filters
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Report Type</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1" fontWeight={500} sx={{ textTransform: 'capitalize' }}>
                      {category === 'overall' ? `Overall ${overallReportType}` : category}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Date Range</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {dateOption === 'all_time' ? 'All Time' : `${startDate && format(startDate, 'MMM d, yyyy')} - ${endDate && format(endDate, 'MMM d, yyyy')}`}
                  </Typography>
                </Grid>
                {selectedCourse && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Selected Course</Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {selectedCourse.name} <Chip label={selectedCourse.batch_code} size="small" sx={{ ml: 1 }} />
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>

            {category === 'overall' ? (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={downloadingReport === 'overall' ? <CircularProgress size={20} color="inherit" /> : <Download />}
                    onClick={() => handleDownloadReport('overall')}
                    disabled={!!downloadingReport}
                    fullWidth
                    sx={{ py: 1.5 }}
                  >
                    {downloadingReport === 'overall' ? 'Downloading...' : `Download ${overallReportType ? overallReportType.charAt(0).toUpperCase() + overallReportType.slice(1) : ''} Report`}
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                    Filtered by selected date range
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={downloadingReport === 'overall_all' ? <CircularProgress size={20} color="inherit" /> : <Download />}
                    onClick={() => handleDownloadReport('overall', true)}
                    disabled={!!downloadingReport}
                    fullWidth
                    sx={{ py: 1.5 }}
                  >
                    {downloadingReport === 'overall_all' ? 'Downloading...' : `Download All (No Date Range)`}
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                    Complete history for this category
                  </Typography>
                </Grid>
              </Grid>
            ) : (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={downloadingReport === 'summary' ? <CircularProgress size={20} color="inherit" /> : <Description />}
                    onClick={() => handleDownloadReport('summary')}
                    disabled={!!downloadingReport}
                    fullWidth
                    sx={{ py: 1.5, height: '100%' }}
                  >
                    {downloadingReport === 'summary' ? 'Downloading...' : 'Download Course Report'}
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                    Summary, stats, and totals
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={downloadingReport === 'participants' ? <CircularProgress size={20} color="inherit" /> : <Download />}
                    onClick={() => handleDownloadReport('participants')}
                    disabled={!!downloadingReport}
                    fullWidth
                    sx={{ py: 1.5, height: '100%' }}
                  >
                    {downloadingReport === 'participants' ? 'Downloading...' : 'Download Participant Details'}
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                    Detailed list of all employees
                  </Typography>
                </Grid>
              </Grid>
            )}

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-start' }}>
              <Button onClick={handleBack} startIcon={<ArrowBack />}>
                Back
              </Button>
              <Box sx={{ flex: 1 }} />
              <Button color="inherit" onClick={handleReset}>
                Start Over
              </Button>
            </Box>
          </Box>
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

