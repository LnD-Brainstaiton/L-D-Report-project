import React from 'react';
import { Grid, Typography, Divider, Chip, Link } from '@mui/material';
import { EnrollmentWithDetails, SbuHead } from '../../../types';
import { formatExperience } from '../../../utils/experienceUtils';
import { formatDateForDisplay } from '../../../utils/dateUtils';

interface UserInfoSectionProps {
    enrollment: EnrollmentWithDetails;
    sbuHead: SbuHead | null;
    reportingManager: { employee_id: string; name: string } | null;
    onViewSbuHead: () => void;
    onViewReportingManager: () => void;
}

const UserInfoSection: React.FC<UserInfoSectionProps> = ({
    enrollment,
    sbuHead,
    reportingManager,
    onViewSbuHead,
    onViewReportingManager,
}) => {
    return (
        <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                    {enrollment.is_previous_employee ? 'Employee Information' : 'Employee Information'}
                </Typography>
                <Divider sx={{ mb: 2 }} />
            </Grid>

            {/* Left Column */}
            <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Name</Typography>
                <Typography variant="body1" gutterBottom>{enrollment.student_name}</Typography>
            </Grid>

            {/* Right Column */}
            {reportingManager ? (
                <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Reporting Manager</Typography>
                    <Typography variant="body1" gutterBottom>
                        <Chip
                            label={`${reportingManager.name} (${reportingManager.employee_id.toUpperCase()})`}
                            size="small"
                            onClick={onViewReportingManager}
                            sx={{
                                cursor: 'pointer',
                                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                                color: '#92400e',
                                fontWeight: 600,
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #fde68a 0%, #fcd34d 100%)',
                                },
                            }}
                        />
                    </Typography>
                </Grid>
            ) : (
                <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Reporting Manager</Typography>
                    <Typography variant="body1" gutterBottom color="text.secondary">N/A</Typography>
                </Grid>
            )}

            {/* Left Column */}
            <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Employee ID</Typography>
                <Typography variant="body1" gutterBottom>{enrollment.student_employee_id || 'N/A'}</Typography>
            </Grid>

            {/* Right Column - Hide SBU Head if they are the SBU Head themselves */}
            {sbuHead && sbuHead.employee_id?.toUpperCase() !== enrollment.student_employee_id?.toUpperCase() ? (
                <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">SBU Head</Typography>
                    <Typography variant="body1" gutterBottom>
                        <Chip
                            label={`${sbuHead.name} (${sbuHead.employee_id.toUpperCase()})`}
                            size="small"
                            onClick={onViewSbuHead}
                            sx={{
                                cursor: 'pointer',
                                background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                                color: '#3730a3',
                                fontWeight: 600,
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #c7d2fe 0%, #a5b4fc 100%)',
                                },
                            }}
                        />
                    </Typography>
                </Grid>
            ) : (
                <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">SBU Head</Typography>
                    <Typography variant="body1" gutterBottom color="text.secondary">N/A</Typography>
                </Grid>
            )}

            {/* Left Column */}
            <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Email</Typography>
                <Typography variant="body1" gutterBottom>
                    {enrollment.student_email ? (
                        <Link href={`mailto:${enrollment.student_email}`} color="inherit" underline="hover">
                            {enrollment.student_email}
                        </Link>
                    ) : 'N/A'}
                </Typography>
            </Grid>

            {/* Right Column */}
            <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">BS Joining Date</Typography>
                <Typography variant="body1" gutterBottom>
                    {enrollment.student_bs_joining_date ? formatDateForDisplay(enrollment.student_bs_joining_date) : 'N/A'}
                </Typography>
            </Grid>

            {/* Left Column */}
            <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Designation</Typography>
                <Typography variant="body1" gutterBottom>{enrollment.student_designation || 'N/A'}</Typography>
            </Grid>

            {/* Right Column */}
            <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">BS Experience</Typography>
                <Typography variant="body1" gutterBottom>{formatExperience(enrollment.student_bs_joining_date)}</Typography>
            </Grid>

            {/* Left Column */}
            <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">SBU</Typography>
                <Typography variant="body1" gutterBottom>
                    <Chip label={enrollment.student_department} size="small" sx={{ background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', color: '#1e40af', fontWeight: 600 }} />
                </Typography>
            </Grid>

            {/* Right Column */}
            <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Total Experience</Typography>
                <Typography variant="body1" gutterBottom>
                    {enrollment.student_total_experience
                        ? `${enrollment.student_total_experience} years`
                        : 'N/A'}
                </Typography>
            </Grid>

            {enrollment.is_previous_employee && enrollment.student_exit_date && (
                <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary" sx={{ color: '#b91c1c', fontWeight: 600 }}>
                        Leaving Date
                    </Typography>
                    <Typography variant="body1" gutterBottom sx={{ color: '#991b1b', fontWeight: 500 }}>
                        {formatDateForDisplay(enrollment.student_exit_date)}
                    </Typography>
                </Grid>
            )}
        </Grid>
    );
};

export default UserInfoSection;
