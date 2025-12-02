import React from 'react';
import {
    Box,
    Typography,
    Button,
    Grid,
    Paper,
    CircularProgress,
    Chip,
    alpha,
    useTheme,
} from '@mui/material';
import {
    Download,
    Description,
    ArrowBack,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Course } from '../../../types';
import { ReportCategory, ReportType } from '../hooks/useReports';
import { DateRangeOption } from '../../../components/DateRangeSelector';

interface DownloadSectionProps {
    reportType: ReportType | null;
    category: ReportCategory | null;
    overallReportType: ReportCategory | null;
    startDate: Date | null;
    endDate: Date | null;
    dateOption: DateRangeOption;
    selectedCourse: Course | null;
    selectedEmployee: any | null;
    isAllEmployees: boolean;
    downloadingReport: string | null;
    onDownload: (type: 'overall' | 'summary' | 'participants', ignoreDateRange?: boolean) => void;
    onBack: () => void;
    onReset: () => void;
}

const DownloadSection: React.FC<DownloadSectionProps> = ({
    reportType,
    category,
    overallReportType,
    startDate,
    endDate,
    dateOption,
    selectedCourse,
    selectedEmployee,
    isAllEmployees,
    downloadingReport,
    onDownload,
    onBack,
    onReset,
}) => {
    const theme = useTheme();

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
                                {reportType === 'employee' ? 'Employee Report' : (category === 'overall' ? `Overall ${overallReportType}` : category)}
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Date Range</Typography>
                        <Typography variant="body1" fontWeight={500}>
                            {dateOption === 'all_time' ? 'All Time' : `${startDate && format(startDate, 'MMM d, yyyy')} - ${endDate && format(endDate, 'MMM d, yyyy')}`}
                        </Typography>
                    </Grid>
                    {reportType === 'employee' && (selectedEmployee || isAllEmployees) && (
                        <Grid item xs={12}>
                            <Typography variant="caption" color="text.secondary">Selected Employee</Typography>
                            <Typography variant="body1" fontWeight={500}>
                                {isAllEmployees ? "All Employees (Master Report)" : `${selectedEmployee.name} (${selectedEmployee.employee_id})`}
                            </Typography>
                        </Grid>
                    )}
                    {reportType === 'course' && selectedCourse && (
                        <Grid item xs={12}>
                            <Typography variant="caption" color="text.secondary">Selected Course</Typography>
                            <Typography variant="body1" fontWeight={500}>
                                {selectedCourse.name} <Chip label={selectedCourse.batch_code} size="small" sx={{ ml: 1 }} />
                            </Typography>
                        </Grid>
                    )}
                </Grid>
            </Paper>

            {reportType === 'employee' ? (
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={downloadingReport === 'participants' ? <CircularProgress size={20} color="inherit" /> : <Download />}
                            onClick={() => onDownload('participants')}
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
            ) : category === 'overall' ? (
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={downloadingReport === 'overall' ? <CircularProgress size={20} color="inherit" /> : <Download />}
                            onClick={() => onDownload('overall')}
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
                            onClick={() => onDownload('overall', true)}
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
                            onClick={() => onDownload('summary')}
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
                            onClick={() => onDownload('participants')}
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
                <Button onClick={onBack} startIcon={<ArrowBack />}>
                    Back
                </Button>
                <Box sx={{ flex: 1 }} />
                <Button color="inherit" onClick={onReset}>
                    Start Over
                </Button>
            </Box>
        </Box>
    );
};

export default DownloadSection;
