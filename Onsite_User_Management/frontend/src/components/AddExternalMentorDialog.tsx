import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  Autocomplete,
  Box,
  Tab,
  Tabs,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { mentorsAPI, coursesAPI } from '../services/api';
import { Mentor, Course } from '../types';

interface ExternalMentorData {
  name: string;
  email: string;
  company: string;
  expertise: string;
  hours_taught: string;
  amount_paid: string;
}

interface MentorAssignment {
  mentor_id: number;
  hours_taught: number;
  amount_paid: number;
  course_id?: number;
}

interface AddExternalMentorDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (assignment: MentorAssignment) => Promise<void>;
  isDraft?: boolean;
  showCourseSelection?: boolean;
  allowSelection?: boolean;
}

const initialFormState: ExternalMentorData = {
  name: '',
  email: '',
  company: '',
  expertise: '',
  hours_taught: '',
  amount_paid: '',
};

const AddExternalMentorDialog: React.FC<AddExternalMentorDialogProps> = ({
  open,
  onClose,
  onAdd,
  isDraft = false,
  showCourseSelection = false,
  allowSelection = true,
}) => {
  const [mode, setMode] = useState<'create' | 'select'>('create');
  const [externalMentorData, setExternalMentorData] = useState<ExternalMentorData>(initialFormState);
  const [loading, setLoading] = useState(false);
  const [existingMentors, setExistingMentors] = useState<Mentor[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | ''>('');
  const [fetchingData, setFetchingData] = useState(false);

  useEffect(() => {
    if (open) {
      setExternalMentorData(initialFormState);
      setSelectedMentor(null);
      setSelectedCourseId('');
      setMode('create');
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    setFetchingData(true);
    try {
      // Fetch existing external mentors if selection is allowed
      if (allowSelection) {
        const mentorsResponse = await mentorsAPI.getAll('external');
        setExistingMentors(mentorsResponse.data);
      }

      // Fetch courses if selection is shown
      if (showCourseSelection) {
        const coursesResponse = await coursesAPI.getAll({ limit: 1000 });
        // Filter for onsite and external courses only (not online)
        const relevantCourses = coursesResponse.data.filter(
          c => c.course_type === 'onsite' || c.course_type === 'external'
        );
        setCourses(relevantCourses);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setFetchingData(false);
    }
  };

  const handleMentorSelect = (mentor: Mentor | null) => {
    setSelectedMentor(mentor);
    if (mentor) {
      setExternalMentorData({
        ...externalMentorData,
        name: mentor.name,
        email: mentor.email || '',
        company: mentor.company || '',
        expertise: mentor.specialty || '',
      });
    } else {
      setExternalMentorData(initialFormState);
    }
  };

  const handleAdd = async () => {
    if (mode === 'create' && !externalMentorData.name?.trim()) return;
    if (mode === 'select' && !selectedMentor) return;
    if (!externalMentorData.hours_taught || parseFloat(externalMentorData.hours_taught) < 0) return;
    if (!externalMentorData.amount_paid || parseFloat(externalMentorData.amount_paid) < 0) return;

    setLoading(true);
    try {
      let mentorId: number;

      if (mode === 'select' && selectedMentor) {
        mentorId = selectedMentor.id;
      } else {
        // Create new mentor
        const payload: Record<string, any> = {
          is_internal: false,
          name: externalMentorData.name.trim(),
          student_id: null,
        };

        if (externalMentorData.email?.trim()) {
          payload.email = externalMentorData.email.trim();
        }
        if (externalMentorData.company?.trim()) {
          payload.company = externalMentorData.company.trim();
        }
        if (externalMentorData.expertise?.trim()) {
          payload.specialty = externalMentorData.expertise.trim();
        }

        const response = await mentorsAPI.createExternal(payload as any);
        mentorId = response.data.id;
      }

      const hoursTaught = parseFloat(externalMentorData.hours_taught) || 0;
      const amountPaid = parseFloat(externalMentorData.amount_paid) || 0;

      await onAdd({
        mentor_id: mentorId,
        hours_taught: hoursTaught,
        amount_paid: amountPaid,
        course_id: selectedCourseId ? Number(selectedCourseId) : undefined,
      });

      setExternalMentorData(initialFormState);
      onClose();
    } catch (error) {
      console.error('Error adding/assigning external mentor:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setExternalMentorData(initialFormState);
    onClose();
  };

  const isValid =
    ((mode === 'create' && externalMentorData.name?.trim()) || (mode === 'select' && selectedMentor)) &&
    externalMentorData.hours_taught &&
    parseFloat(externalMentorData.hours_taught) >= 0 &&
    externalMentorData.amount_paid &&
    parseFloat(externalMentorData.amount_paid) >= 0;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {mode === 'create' ? 'Add External Mentor' : 'Assign External Mentor'}
      </DialogTitle>
      <DialogContent>
        {allowSelection && (
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={mode} onChange={(_, newValue) => setMode(newValue)} aria-label="mentor mode tabs">
              <Tab label="Create New" value="create" />
              <Tab label="Select Existing" value="select" />
            </Tabs>
          </Box>
        )}

        {fetchingData ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <>
            {mode === 'select' && (
              <Autocomplete
                options={existingMentors}
                getOptionLabel={(option) => `${option.name} (${option.company || 'No Company'})`}
                value={selectedMentor}
                onChange={(_, newValue) => handleMentorSelect(newValue)}
                renderInput={(params) => (
                  <TextField {...params} label="Select Mentor" fullWidth required sx={{ mt: 2 }} />
                )}
                sx={{ mb: 2 }}
              />
            )}

            <TextField
              label="Name"
              fullWidth
              required={mode === 'create'}
              disabled={mode === 'select'}
              value={externalMentorData.name}
              onChange={(e) => setExternalMentorData({ ...externalMentorData, name: e.target.value })}
              sx={{ mt: 2 }}
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              disabled={mode === 'select'}
              value={externalMentorData.email}
              onChange={(e) => setExternalMentorData({ ...externalMentorData, email: e.target.value })}
              sx={{ mt: 2 }}
            />
            <TextField
              label="Company"
              fullWidth
              disabled={mode === 'select'}
              value={externalMentorData.company}
              onChange={(e) => setExternalMentorData({ ...externalMentorData, company: e.target.value })}
              sx={{ mt: 2 }}
            />
            <TextField
              label="Expertise"
              fullWidth
              disabled={mode === 'select'}
              value={externalMentorData.expertise}
              onChange={(e) => setExternalMentorData({ ...externalMentorData, expertise: e.target.value })}
              sx={{ mt: 2 }}
              placeholder="e.g., Python, Machine Learning, Project Management"
            />

            {showCourseSelection && (
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Assign to Course (Optional)</InputLabel>
                <Select
                  value={selectedCourseId}
                  label="Assign to Course (Optional)"
                  onChange={(e) => setSelectedCourseId(e.target.value as number)}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {courses.map((course) => (
                    <MenuItem key={course.id} value={course.id}>
                      {course.name} ({course.batch_code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <TextField
              label="Hours Taught"
              type="number"
              fullWidth
              required
              value={externalMentorData.hours_taught}
              onChange={(e) => setExternalMentorData({ ...externalMentorData, hours_taught: e.target.value })}
              sx={{ mt: 2 }}
              inputProps={{ min: 0, step: 0.01 }}
            />
            <TextField
              label="Amount Paid"
              type="number"
              fullWidth
              required
              value={externalMentorData.amount_paid}
              onChange={(e) => setExternalMentorData({ ...externalMentorData, amount_paid: e.target.value })}
              sx={{ mt: 2 }}
              InputProps={{
                startAdornment: <InputAdornment position="start">Tk</InputAdornment>,
              }}
              inputProps={{ min: 0, step: 0.01 }}
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} sx={{ textTransform: 'uppercase' }}>
          Cancel
        </Button>
        <Button
          onClick={handleAdd}
          variant="contained"
          disabled={loading || !isValid}
          sx={{ textTransform: 'uppercase' }}
        >
          {loading ? <CircularProgress size={20} /> : (mode === 'create' ? 'Create & Assign' : 'Assign')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddExternalMentorDialog;

