/**
 * Reusable Alert Message Component
 * Displays success/error/info alerts with consistent styling
 */

import React from 'react';
import { Alert, alpha, useTheme, AlertColor } from '@mui/material';
import type { Message } from '../../types';

interface AlertMessageProps {
  message: Message | null;
  onClose: () => void;
}

const AlertMessage: React.FC<AlertMessageProps> = ({ message, onClose }) => {
  const theme = useTheme();

  if (!message) return null;

  const getSeverityColor = (type: AlertColor): string => {
    switch (type) {
      case 'success':
        return theme.palette.success.main;
      case 'error':
        return theme.palette.error.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'info':
      default:
        return theme.palette.info.main;
    }
  };

  return (
    <Alert
      severity={message.type}
      onClose={onClose}
      sx={{
        mb: 3,
        borderRadius: '8px',
        border: 'none',
        boxShadow: `0 4px 12px ${alpha(getSeverityColor(message.type), 0.15)}`,
      }}
    >
      {message.text}
    </Alert>
  );
};

export default AlertMessage;

