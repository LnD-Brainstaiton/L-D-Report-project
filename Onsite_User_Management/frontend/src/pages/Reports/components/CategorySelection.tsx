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
    Computer,
    Public,
    Assessment
} from '@mui/icons-material';
import { ReportCategory } from '../hooks/useReports';

interface CategorySelectionProps {
    category: ReportCategory | null;
    overallReportType: ReportCategory | null;
    onSelect: (category: ReportCategory) => void;
}

const CategorySelection: React.FC<CategorySelectionProps> = ({ category, overallReportType, onSelect }) => {
    const theme = useTheme();

    const renderCategoryCard = (
        value: ReportCategory,
        title: string,
        description: string,
        icon: React.ReactNode,
        color: string,
    ) => (
        <Grid item xs={12} sm={6} key={value}>
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
                onClick={() => onSelect(value)}
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
};

export default CategorySelection;
