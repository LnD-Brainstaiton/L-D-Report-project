import React from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    useTheme,
    alpha,
} from '@mui/material';
import {
    School,
    Assessment
} from '@mui/icons-material';
import { ReportType } from '../hooks/useReports';

interface ReportTypeSelectionProps {
    reportType: ReportType | null;
    onSelect: (type: ReportType) => void;
}

const ReportTypeSelection: React.FC<ReportTypeSelectionProps> = ({ reportType, onSelect }) => {
    const theme = useTheme();

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
                    onClick={() => onSelect('course')}
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
                    onClick={() => onSelect('employee')}
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
};

export default ReportTypeSelection;
