/**
 * Unified Course Form Dialog Component
 * Used for both creating and editing courses
 * Consolidates CreateCourseDialog and EditCourseDialog into a single component
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
  Divider,
  IconButton,
  Card,
  Chip,
  useTheme,
  alpha,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { Add, Delete, PersonAdd } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ClassScheduleForm from '../common/ClassScheduleForm';

/**
 * CourseFormDialog - Unified dialog for creating and editing courses
 * 
 * @param {boolean} open - Whether dialog is open
 * @param {Function} onClose - Callback when dialog closes
 * @param {string} mode - 'create' or 'edit'
 * @param {Object} formData - Course form data
 * @param {Function} setFormData - Update form data
 * @param {Array} classSchedule - Class schedule array
 * @param {Function} setClassSchedule - Update class schedule
 * @param {Array} prerequisiteCourses - Available prerequisite courses
 * @param {Function} onSubmit - Callback when form is submitted
 * @param {boolean} loading - Whether form is submitting
 * @param {Function} setMessage - Set error/success message
 * 
 * For create mode only:
 * @param {boolean} createAsDraft - Whether to create as draft
 * @param {Function} setCreateAsDraft - Toggle draft mode
 * @param {string} courseType - 'onsite' or 'online'
 * @param {Array} selectedMentors - Selected mentors for the course
 * @param {Function} setSelectedMentors - Update selected mentors
 * @param {Function} onAssignInternalMentor - Open internal mentor dialog
 * @param {Function} onAddExternalMentor - Open external mentor dialog
 */
function CourseFormDialog({
  open,
  onClose,
  mode = 'create',
  formData,
  setFormData,
  classSchedule,
  setClassSchedule,
  prerequisiteCourses = [],
  onSubmit,
  loading = false,
  setMessage,
  // Create mode specific props
  createAsDraft = true,
  setCreateAsDraft,
  courseType = 'onsite',
  selectedMentors = [],
  setSelectedMentors,
  onAssignInternalMentor,
  onAddExternalMentor,
}) {
  const theme = useTheme();
  const isCreate = mode === 'create';
  const title = isCreate ? 'Create New Course' : 'Edit Course';
  const submitLabel = isCreate ? 'Create' : 'Update';

  const handleRemoveMentor = (index) => {
    if (setSelectedMentors) {
      setSelectedMentors(selectedMentors.filter((_, i) => i !== index));
    }
  };

  const isFormValid = () => {
    if (!formData.start_date || formData.seat_limit <= 0) return false;
    if (isCreate && (!formData.name || !formData.batch_code)) return false;
    return true;
  };

  const handleDateValidation = (newEndDate) => {
    if (newEndDate && formData.start_date && newEndDate < formData.start_date) {
      if (setMessage) {
        setMessage({ type: 'error', text: 'End date cannot be before start date' });
      }
      return false;
    }
    return true;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>{title}</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} mt={1}>
          {/* Basic Info - Only show name/batch_code for create mode or if formData includes them */}
          {(isCreate || formData.name !== undefined) && (
            <>
              <TextField
                label="Course Name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Batch Code"
                value={formData.batch_code || ''}
                onChange={(e) => setFormData({ ...formData, batch_code: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                fullWidth
                multiline
                rows={3}
              />
            </>
          )}

          {/* Date Pickers */}
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Start Date"
              value={formData.start_date}
              onChange={(newValue) => {
                setFormData({ ...formData, start_date: newValue });
                // Clear end date if it's before new start date
                if (formData.end_date && newValue && formData.end_date < newValue) {
                  setFormData((prev) => ({ ...prev, end_date: null }));
                }
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                },
              }}
            />
            <DatePicker
              label="End Date"
              value={formData.end_date}
              onChange={(newValue) => {
                if (handleDateValidation(newValue)) {
                  setFormData({ ...formData, end_date: newValue });
                }
              }}
              minDate={formData.start_date || undefined}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error:
                    formData.end_date &&
                    formData.start_date &&
                    formData.end_date < formData.start_date,
                  helperText:
                    formData.end_date &&
                    formData.start_date &&
                    formData.end_date < formData.start_date
                      ? 'End date cannot be before start date'
                      : '',
                },
              }}
            />
          </LocalizationProvider>

          {/* Seat Limit */}
          <TextField
            label="Seat Limit"
            type="number"
            value={formData.seat_limit}
            onChange={(e) =>
              setFormData({ ...formData, seat_limit: parseInt(e.target.value) || 0 })
            }
            fullWidth
            required
            inputProps={{ min: 0 }}
          />

          {/* Total Classes */}
          <TextField
            label="Total Classes Offered"
            type="number"
            value={formData.total_classes_offered || ''}
            onChange={(e) =>
              setFormData({ ...formData, total_classes_offered: e.target.value })
            }
            fullWidth
            helperText="Used for calculating attendance percentage"
            inputProps={{ min: 0 }}
          />

          {/* Prerequisite Course */}
          {(isCreate || formData.prerequisite_course_id !== undefined) && (
            <TextField
              select
              label="Prerequisite Course"
              value={formData.prerequisite_course_id || ''}
              onChange={(e) =>
                setFormData({ ...formData, prerequisite_course_id: e.target.value || null })
              }
              fullWidth
            >
              <MenuItem value="">None</MenuItem>
              {prerequisiteCourses.map((course) => (
                <MenuItem key={course.id} value={course.id}>
                  {course.name} ({course.batch_code})
                </MenuItem>
              ))}
            </TextField>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Class Schedule */}
          <ClassScheduleForm
            schedule={classSchedule}
            onChange={setClassSchedule}
          />

          {/* Create Mode: Draft Checkbox and Mentors */}
          {isCreate && courseType === 'onsite' && (
            <>
              <Divider sx={{ my: 2 }} />

              {/* Draft Checkbox */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={createAsDraft}
                      onChange={(e) => setCreateAsDraft && setCreateAsDraft(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        Create as Draft
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {createAsDraft
                          ? 'Course will be created in planning stage.'
                          : 'Course will be created directly as ongoing.'}
                      </Typography>
                    </Box>
                  }
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Mentor Assignment */}
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Assign Mentors
                  </Typography>
                  <Box display="flex" gap={1}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<PersonAdd />}
                      onClick={onAssignInternalMentor}
                    >
                      Assign Internal
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Add />}
                      onClick={onAddExternalMentor}
                    >
                      Add External
                    </Button>
                  </Box>
                </Box>

                {selectedMentors.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    No mentors assigned. Click "Assign Internal" or "Add External" to assign
                    mentors to this course.
                  </Typography>
                ) : (
                  <Box display="flex" flexDirection="column" gap={1}>
                    {selectedMentors.map((mentor, index) => (
                      <Card key={index} variant="outlined" sx={{ p: 1.5 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {mentor.mentor_name || `Mentor ${index + 1}`}
                              {mentor.is_internal ? (
                                <Chip label="Internal" size="small" sx={{ ml: 1 }} color="primary" />
                              ) : (
                                <Chip label="External" size="small" sx={{ ml: 1 }} color="secondary" />
                              )}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Hours: {mentor.hours_taught || 0} | Amount: Tk {mentor.amount_paid || 0}
                            </Typography>
                          </Box>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveMentor(index)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </Card>
                    ))}
                  </Box>
                )}
              </Box>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={onSubmit}
          variant="contained"
          disabled={loading || !isFormValid()}
        >
          {submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CourseFormDialog;

