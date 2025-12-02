import React from 'react';
import { Card, CardProps, alpha, useTheme } from '@mui/material';

interface GradientCardProps extends Omit<CardProps, 'variant'> {
    cardColor?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
    gradient?: boolean;
    variant?: CardProps['variant'];
}

const GradientCard: React.FC<GradientCardProps> = ({
    children,
    cardColor = 'default',
    gradient = false,
    sx,
    ...props
}) => {
    const theme = useTheme();

    const getStyles = () => {
        if (!gradient && cardColor === 'default') return {};

        let color = theme.palette.primary.main;
        if (cardColor === 'success') color = theme.palette.success.main;
        if (cardColor === 'warning') color = theme.palette.warning.main;
        if (cardColor === 'error') color = theme.palette.error.main;
        if (cardColor === 'info') color = theme.palette.info.main;

        if (gradient) {
            return {
                background: `linear-gradient(135deg, ${alpha(color, 0.05)} 0%, ${alpha(color, 0.02)} 100%)`,
                border: `1px solid ${alpha(color, 0.1)}`,
            };
        }

        return {
            borderLeft: `4px solid ${color}`,
            background: alpha(color, 0.02),
        };
    };

    return (
        <Card
            sx={{
                ...getStyles(),
                ...sx,
            }}
            {...props}
        >
            {children}
        </Card>
    );
};

export default GradientCard;
