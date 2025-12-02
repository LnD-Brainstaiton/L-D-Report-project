import React from 'react';
import {
    Box,
    Typography,
    Divider,
    Tabs,
    Tab,
    CircularProgress,
    Card,
    CardContent,
    Chip,
    Tooltip,
    Button,
    useTheme,
    alpha,
} from '@mui/material';
import { Star, OpenInNew } from '@mui/icons-material';
import { EnrollmentWithDetails, OnlineCourseEnrollment, CourseType } from '../../../types';
import { formatDateForDisplay } from '../../../utils/dateUtils';
import { StatusChip, GradientCard } from '../../common';

interface CourseHistoryProps {
    courseType: CourseType;
    setCourseType: (type: CourseType) => void;
    loading: boolean;
    enrollments: (EnrollmentWithDetails | OnlineCourseEnrollment)[];
}

const CourseHistory: React.FC<CourseHistoryProps> = ({
    courseType,
    setCourseType,
    loading,
    enrollments,
}) => {
    const theme = useTheme();

    return (
        <Box sx={{ mt: 3 }}>
            <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
                    Complete Course History
                </Typography>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tabs
                        value={courseType}
                        onChange={(_, newValue: CourseType) => setCourseType(newValue)}
                        sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.9rem' } }}
                    >
                        <Tab label="Onsite" value="onsite" />
                        <Tab label="Online" value="online" />
                        <Tab label="External" value="external" />
                    </Tabs>
                </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {loading ? (
                <Box display="flex" justifyContent="center" p={2}>
                    <CircularProgress size={24} />
                </Box>
            ) : (
                enrollments.length > 0 ? (
                    <Box display="flex" flexDirection="column" gap={2}>
                        {enrollments.map((enroll: any) => {
                            const isCompleted = enroll.completion_status === 'Completed';
                            const isFailed = enroll.completion_status === 'Failed';
                            const isInProgress = enroll.completion_status === 'In Progress';
                            const variant = isCompleted ? 'success' : isFailed ? 'error' : isInProgress ? 'warning' : 'default';

                            return (
                                <GradientCard
                                    key={enroll.id}
                                    cardColor={variant as any}
                                    sx={{ boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.1)}` }}
                                >
                                    <CardContent>
                                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                                            <Box>
                                                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                        {enroll.course_name}
                                                    </Typography>
                                                    {enroll.is_mandatory && (
                                                        <Tooltip title="Mandatory Course">
                                                            <Chip
                                                                icon={<Star sx={{ fontSize: 14 }} />}
                                                                label="Mandatory"
                                                                size="small"
                                                                sx={{
                                                                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                                                                    color: '#92400e',
                                                                    fontWeight: 600,
                                                                    fontSize: '0.7rem',
                                                                    height: 22,
                                                                    '& .MuiChip-icon': { color: '#f59e0b' },
                                                                }}
                                                            />
                                                        </Tooltip>
                                                    )}
                                                </Box>
                                                <Typography variant="body2" color="text.secondary">
                                                    Batch: {enroll.batch_code}
                                                </Typography>
                                            </Box>
                                            <StatusChip status={enroll.completion_status} />
                                        </Box>

                                        <Box display="flex" gap={3} mt={2} flexWrap="wrap">
                                            {!enroll.is_lms_course && (
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary" display="block">Approval Status</Typography>
                                                    <StatusChip status={enroll.approval_status} sx={{ mt: 0.5 }} />
                                                </Box>
                                            )}

                                            {enroll.is_lms_course && (
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary" display="block">Progress</Typography>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontWeight: 600,
                                                            mt: 0.5,
                                                            color: (enroll.progress || 0) >= 100 ? theme.palette.success.main :
                                                                (enroll.progress || 0) >= 50 ? theme.palette.warning.main : theme.palette.error.main
                                                        }}
                                                    >
                                                        {(enroll.progress || 0).toFixed(1)}%
                                                    </Typography>
                                                </Box>
                                            )}



                                            {enroll.is_lms_course && (
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary" display="block">Completed On</Typography>
                                                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                                                        {enroll.completion_date
                                                            ? new Date(enroll.completion_date).toLocaleString('en-US', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })
                                                            : 'N/A'}
                                                    </Typography>
                                                </Box>
                                            )}

                                            {enroll.is_lms_course && enroll.date_assigned && (
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary" display="block">Enrollment Date</Typography>
                                                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                                                        {typeof enroll.date_assigned === 'number'
                                                            ? new Date(enroll.date_assigned * 1000).toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })
                                                            : formatDateForDisplay(enroll.date_assigned)}
                                                    </Typography>
                                                </Box>
                                            )}

                                            {enroll.is_lms_course && enroll.lastaccess && (
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary" display="block">Last Access</Typography>
                                                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                                                        {typeof enroll.lastaccess === 'number'
                                                            ? new Date(enroll.lastaccess * 1000).toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })
                                                            : formatDateForDisplay(enroll.lastaccess)}
                                                    </Typography>
                                                </Box>
                                            )}

                                            {enroll.is_lms_course && (
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary" display="block">LMS Link</Typography>
                                                    <Button
                                                        size="small"
                                                        startIcon={<OpenInNew sx={{ fontSize: 14 }} />}
                                                        href={`https://lms.elearning23.com/course/view.php?id=${enroll.course_id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        sx={{
                                                            textTransform: 'none',
                                                            fontSize: '0.75rem',
                                                            p: 0.5,
                                                            mt: 0.5,
                                                            minWidth: 'auto',
                                                            color: theme.palette.info.main,
                                                        }}
                                                    >
                                                        Open
                                                    </Button>
                                                </Box>
                                            )}

                                            {enroll.course_end_date && (
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary" display="block">End Date</Typography>
                                                    <Typography variant="body2" sx={{ mt: 0.5 }}>{formatDateForDisplay(enroll.course_end_date)}</Typography>
                                                </Box>
                                            )}




                                        </Box>
                                    </CardContent>
                                </GradientCard>
                            );
                        })}
                    </Box>
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        {courseType === 'external'
                            ? 'External course history will be available soon.'
                            : 'No course history available for this type.'}
                    </Typography>
                )
            )}
        </Box>
    );
};

export default CourseHistory;
