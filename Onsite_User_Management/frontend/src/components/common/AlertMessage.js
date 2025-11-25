/**
 * Reusable Alert Message Component
 * Displays success/error/info alerts with consistent styling
 */

import React from 'react';
import { Alert, alpha, useTheme } from '@mui/material';

/**
 * AlertMessage - Displays alert messages with consistent styling
 * @param {Object} message - { type: 'success'|'error'|'info'|'warning', text: string }
 * @param {Function} onClose - Callback when alert is dismissed
 */
function AlertMessage({ message, onClose }) {
  const theme = useTheme();

  if (!message) return null;

  return (
    <Alert
      severity={message.type}
      onClose={onClose}
      sx={{
        mb: 3,
        borderRadius: '8px',
        border: 'none',
        boxShadow: `0 4px 12px ${alpha(
          theme.palette[message.type === 'success' ? 'success' : message.type === 'error' ? 'error' : 'info'].main,
          0.15
        )}`,
      }}
    >
      {message.text}
    </Alert>
  );
}

export default AlertMessage;

