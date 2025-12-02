import React from 'react';
import { Card, Box, Typography, useTheme, alpha } from '@mui/material';
import { CompletionStats, CourseType } from '../../../types';

interface StatsCardProps {
    courseType: CourseType;
    stats: CompletionStats;
}

const StatsCard: React.FC<StatsCardProps> = ({ courseType, stats }) => {
    const theme = useTheme();

    const getCompletionRateColor = (rate: number): string => {
        if (rate >= 75) return theme.palette.success.main;
        if (rate >= 60) return theme.palette.warning.main;
        return theme.palette.error.main;
    };

    return (
        <Card
            sx={{
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                borderRadius: 2,
                p: 2,
            }}
        >
            <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        {courseType === 'onsite' ? 'Onsite' : courseType === 'online' ? 'Online' : 'External'} Completion Rate
                    </Typography>
                    <Typography
                        variant="h5"
                        sx={{ fontWeight: 600, color: getCompletionRateColor(stats.rate || 0) }}
                    >
                        {(stats.rate || 0).toFixed(1)}%
                    </Typography>
                </Box>
                <Box textAlign="right">
                    <Typography variant="body2" color="text.secondary" gutterBottom>Courses Completed</Typography>
                    <Typography
                        variant="h6"
                        sx={{ fontWeight: 600, color: getCompletionRateColor(stats.rate || 0) }}
                    >
                        {stats.completed || 0} / {stats.total || 0}
                    </Typography>
                </Box>
            </Box>
        </Card>
    );
};

export default StatsCard;
