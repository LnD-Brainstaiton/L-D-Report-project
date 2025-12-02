import React from 'react';
import {
    Box,
    Typography,
    Button,
    Autocomplete,
    TextField,
    Grid,
    Card,
    CardContent,
    useTheme,
    alpha,
} from '@mui/material';
import {
    School,
    Computer,
    Public,
    ArrowBack,
} from '@mui/icons-material';
import { Course } from '../../../types';
import { ReportCategory } from '../hooks/useReports';

interface CourseSelectionProps {
    category: ReportCategory | null;
    allCourses: Course[];
    selectedCourse: Course | null;
    loading: boolean;
    onCourseChange: (course: Course | null) => void;
    onOverallReportTypeSelect: (type: ReportCategory) => void;
    onNext: () => void;
    onBack: () => void;
}

const CourseSelection: React.FC<CourseSelectionProps> = ({
    category,
    allCourses,
    selectedCourse,
    loading,
    onCourseChange,
    onOverallReportTypeSelect,
    onNext,
    onBack,
}) => {
    const theme = useTheme();

    const renderCategoryCard = (
        value: ReportCategory,
        title: string,
        description: string,
        icon: React.ReactNode,
        color: string,
        onClick: () => void
    ) => (
        <Grid item xs={12} sm={6} key={value}>
            <Card
                sx={{
                    cursor: 'pointer',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    backgroundColor: 'background.paper',
                    transition: 'all 0.2s',
                    height: '100%',
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[4],
                        borderColor: color,
                    },
                }}
                onClick={onClick}
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
                        () => onOverallReportTypeSelect('onsite')
                    )}
                    {renderCategoryCard(
                        'online',
                        'Overall Online Report',
                        'Consolidated report for all online courses',
                        <Computer sx={{ fontSize: 40 }} />,
                        theme.palette.info.main,
                        () => onOverallReportTypeSelect('online')
                    )}
                    {renderCategoryCard(
                        'external',
                        'Overall External Report',
                        'Consolidated report for all external courses',
                        <Public sx={{ fontSize: 40 }} />,
                        theme.palette.success.main,
                        () => onOverallReportTypeSelect('external')
                    )}
                </Grid>
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-start' }}>
                    <Button onClick={onBack} startIcon={<ArrowBack />}>
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
                options={allCourses}
                getOptionLabel={(option) => `${option.name} (${option.batch_code})`}
                value={selectedCourse}
                onChange={(_, newValue) => onCourseChange(newValue)}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Search Course"
                        placeholder="Type to search by name or batch code..."
                        helperText={`${allCourses.length} courses available`}
                    />
                )}
                noOptionsText="No courses found for this category"
                loading={loading}
                sx={{ mb: 4 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button onClick={onBack}>Back</Button>
                <Button variant="contained" onClick={onNext} disabled={!selectedCourse}>
                    Continue
                </Button>
            </Box>
        </Box>
    );
};

export default CourseSelection;
