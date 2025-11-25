/**
 * Reusable Class Schedule Form Component
 * Used in Create/Edit Course dialogs for managing weekly class schedules
 */

import React from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  IconButton,
  Card,
} from '@mui/material';
import { Add, Delete, AccessTime } from '@mui/icons-material';

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

/**
 * ClassScheduleForm - Manages an array of class schedule entries
 * @param {Array} schedule - Array of { day, start_time, end_time } objects
 * @param {Function} onChange - Callback when schedule changes
 * @param {boolean} readOnly - If true, disable editing
 */
function ClassScheduleForm({ schedule = [], onChange, readOnly = false }) {
  const handleAddSchedule = () => {
    onChange([...schedule, { day: '', start_time: '', end_time: '' }]);
  };

  const handleRemoveSchedule = (index) => {
    onChange(schedule.filter((_, i) => i !== index));
  };

  const handleUpdateSchedule = (index, field, value) => {
    const updated = [...schedule];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <AccessTime color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Class Schedule
          </Typography>
        </Box>
        {!readOnly && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<Add />}
            onClick={handleAddSchedule}
          >
            Add Schedule
          </Button>
        )}
      </Box>

      {schedule.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No schedule added. {!readOnly && 'Click "Add Schedule" to specify class days and times.'}
        </Typography>
      ) : (
        <Box display="flex" flexDirection="column" gap={2}>
          {schedule.map((entry, index) => (
            <Card key={index} variant="outlined" sx={{ p: 2 }}>
              <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
                <TextField
                  select
                  label="Day"
                  value={entry.day || ''}
                  onChange={(e) => handleUpdateSchedule(index, 'day', e.target.value)}
                  sx={{ minWidth: 150 }}
                  required
                  disabled={readOnly}
                  size="small"
                >
                  {DAYS_OF_WEEK.map((day) => (
                    <MenuItem key={day} value={day}>
                      {day}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Start Time"
                  type="time"
                  value={entry.start_time || ''}
                  onChange={(e) => handleUpdateSchedule(index, 'start_time', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 150 }}
                  required
                  disabled={readOnly}
                  size="small"
                />
                <TextField
                  label="End Time"
                  type="time"
                  value={entry.end_time || ''}
                  onChange={(e) => handleUpdateSchedule(index, 'end_time', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 150 }}
                  required
                  disabled={readOnly}
                  size="small"
                />
                {!readOnly && (
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemoveSchedule(index)}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}

export default ClassScheduleForm;

