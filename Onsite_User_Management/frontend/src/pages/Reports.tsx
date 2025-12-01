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

const steps = [
  {
    label: 'Select Report Category',
    description: 'Choose the type of report you want to generate.',
  },
  {
    label: 'Select Course',
    description: 'Search and select the specific course.',
  },
  {
    label: 'Select Date Range',
    description: 'Filter the report data by a specific time period.',
  },
  {
    label: 'Download Report',
    description: 'Review your selection and download the report.',
  },
];

const Reports: React.FC = () => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [dateOption, setDateOption] = useState<DateRangeOption>('month');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const [overallReportType, setOverallReportType] = useState<ReportCategory | null>(null);

  const [loading, setLoading] = useState(false);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null);

  // Fetch courses when category changes
  useEffect(() => {
    if (category && category !== 'overall') {
      fetchCourses(category);
    }
  }, [category]);

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
    // Skip course selection if category is 'overall'
    if (activeStep === 0 && category === 'overall') {
      setActiveStep(1); // Go to Sub-category selection (which is now Step 1 for overall)
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep === 1 && category === 'overall') {
      setActiveStep(0); // Jump back to Category
      setCategory(null);
      setOverallReportType(null);
    } else if (activeStep === 2 && category === 'overall') {
      setActiveStep(1); // Jump back to Sub-category
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep - 1);
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setCategory(null);
    setOverallReportType(null);
    setSelectedCourse(null);
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

      if (type === 'overall') {
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
            setActiveStep(1); // Always go to Step 1 (Sub-category for Overall, Course Selection for others)
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
      case 1:
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
                    setActiveStep(2);
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
                    setActiveStep(2);
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
                    setActiveStep(2);
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
      case 2:
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
      case 3:
        return (
          <Box sx={{ maxWidth: 600, mx: 'auto', py: 2 }}>
            <Paper variant="outlined" sx={{ p: 3, mb: 3, backgroundColor: alpha(theme.palette.background.default, 0.5) }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Selected Filters
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Report Category</Typography>
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

