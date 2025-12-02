import React from 'react';
import { Chip, ChipProps } from '@mui/material';
import { CheckCircle, Cancel, AccessTime, PlayCircleFilled, School, Warning } from '@mui/icons-material';

export type StatusType =
    | 'Completed'
    | 'Failed'
    | 'In Progress'
    | 'Not Started'
    | 'Approved'
    | 'Pending'
    | 'Rejected'
    | 'Withdrawn'
    | 'Eligible'
    | 'Not Eligible'
    | 'Previous Employee'
    | 'Active'
    | 'Inactive'
    | string;

interface StatusChipProps extends Omit<ChipProps, 'color'> {
    status: StatusType;
    showIcon?: boolean;
}

const getStatusConfig = (status: string) => {
    const normalizedStatus = status?.toLowerCase() || '';

    switch (normalizedStatus) {
        case 'completed':
        case 'approved':
        case 'eligible':
        case 'active':
            return {
                color: '#059669', // success
                bg: '#d1fae5',
                gradient: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                icon: <CheckCircle sx={{ fontSize: 16 }} />,
            };
        case 'failed':
        case 'rejected':
        case 'not eligible':
        case 'inactive':
            return {
                color: '#dc2626', // error
                bg: '#fee2e2',
                gradient: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                icon: <Cancel sx={{ fontSize: 16 }} />,
            };
        case 'in progress':
            return {
                color: '#2563eb', // primary/info
                bg: '#dbeafe',
                gradient: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                icon: <PlayCircleFilled sx={{ fontSize: 16 }} />,
            };
        case 'pending':
        case 'not started':
            return {
                color: '#d97706', // warning
                bg: '#fef3c7',
                gradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                icon: <AccessTime sx={{ fontSize: 16 }} />,
            };
        case 'withdrawn':
            return {
                color: '#4b5563', // grey
                bg: '#f3f4f6',
                gradient: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                icon: <Warning sx={{ fontSize: 16 }} />,
            };
        case 'previous employee':
            return {
                color: '#991b1b', // dark red
                bg: '#fee2e2',
                gradient: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                icon: <School sx={{ fontSize: 16 }} />,
            };
        default:
            return {
                color: '#4b5563',
                bg: '#f3f4f6',
                gradient: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                icon: null,
            };
    }
};

const StatusChip: React.FC<StatusChipProps> = ({ status, showIcon = true, sx, ...props }) => {
    const config = getStatusConfig(status);

    return (
        <Chip
            label={status}
            size="small"
            icon={showIcon && config.icon ? config.icon : undefined}
            sx={{
                background: config.gradient,
                color: config.color,
                fontWeight: 600,
                border: 'none',
                '& .MuiChip-icon': {
                    color: config.color,
                },
                ...sx,
            }}
            {...props}
        />
    );
};

export default StatusChip;
