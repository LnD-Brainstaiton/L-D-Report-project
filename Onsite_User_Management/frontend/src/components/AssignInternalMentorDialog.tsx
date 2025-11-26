import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  InputAdornment,
  CircularProgress,
  Typography,
  Box,
} from '@mui/material';
import { studentsAPI, mentorsAPI, coursesAPI } from '../services/api';
import type { Student, Mentor, Course } from '../types';

interface MentorAssignment {
  mentor_id: number;
  course_id?: number;
  hours_taught: number;
  amount_paid: number;
}

interface AssignInternalMentorDialogProps {
  open: boolean;
  onClose: () => void;
  onAssign: (assignment: MentorAssignment) => Promise<void>;
  isDraft?: boolean;
  showCourseSelection?: boolean; // Show course dropdown (for Mentors page), hide when inside a course
}

const AssignInternalMentorDialog: React.FC<AssignInternalMentorDialogProps> = ({
  open,
  onClose,
  onAssign,
  isDraft = false,
  showCourseSelection = false,
}) => {
  const [employees, setEmployees] = useState<Student[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [existingMentors, setExistingMentors] = useState<Mentor[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [mentorHours, setMentorHours] = useState('');
  const [mentorAmount, setMentorAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchEmployees();
      fetchExistingMentors();
      if (showCourseSelection) {
        fetchCourses();
      }
      setSelectedEmployeeId('');
      setSelectedCourseId(null);
      setMentorHours('');
      setMentorAmount('');
    }
  }, [open, showCourseSelection]);

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const response = await studentsAPI.getAll();
      setEmployees(response.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const fetchExistingMentors = async () => {
    try {
      const response = await mentorsAPI.getAll('internal');
      setExistingMentors(response.data || []);
    } catch (error) {
      console.error('Error fetching existing mentors:', error);
    }
  };

  const fetchCourses = async () => {
    setLoadingCourses(true);
    try {
      const response = await coursesAPI.getAll();
      // Filter to only show Planning/Draft and Ongoing onsite courses (case-insensitive)
      const onsiteCourses = (response.data || []).filter((course: Course) => {
        const status = (course.status || '').toLowerCase();
        return status === 'planning' || status === 'ongoing' || status === 'draft';
      });
      setCourses(onsiteCourses);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedEmployeeId || !mentorHours || !mentorAmount) {
      return;
    }

    setLoading(true);
    try {
      const employeeId = parseInt(selectedEmployeeId);

      let mentorId: number;
      const existingMentor = existingMentors.find((m) => m.student_id === employeeId);

      if (existingMentor) {
        mentorId = existingMentor.id;
      } else {
        const mentorResponse = await mentorsAPI.createInternal(employeeId);
        mentorId = mentorResponse.data.id;
        setExistingMentors([...existingMentors, mentorResponse.data]);
      }

      await onAssign({
        mentor_id: mentorId,
        course_id: selectedCourseId || undefined,
        hours_taught: parseFloat(mentorHours),
        amount_paid: parseFloat(mentorAmount),
      });

      setSelectedEmployeeId('');
      setSelectedCourseId(null);
      setMentorHours('');
      setMentorAmount('');
      onClose();
    } catch (error) {
      console.error('Error assigning mentor:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedEmployeeId('');
    setSelectedCourseId(null);
    setMentorHours('');
    setMentorAmount('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Assign Internal Mentor</DialogTitle>
      <DialogContent>
        <Autocomplete
          options={employees}
          getOptionLabel={(option) => {
            const isAlreadyMentor = existingMentors.some((m) => m.student_id === option.id);
            return `${option.name} (${option.employee_id})${isAlreadyMentor ? ' - Already a Mentor' : ''}`;
          }}
          value={employees.find((e) => e.id.toString() === selectedEmployeeId) || null}
          onChange={(_, newValue) => setSelectedEmployeeId(newValue?.id.toString() || '')}
          loading={loadingEmployees}
          renderInput={(params) => <TextField {...params} label="Select Employee" sx={{ mt: 2 }} />}
        />
        {showCourseSelection && (
          <Autocomplete
            options={courses}
            getOptionLabel={(option) => `${option.name} (${option.batch_code}) - ${option.status}`}
            value={courses.find((c) => c.id === selectedCourseId) || null}
            onChange={(_, newValue) => setSelectedCourseId(newValue?.id || null)}
            loading={loadingCourses}
            renderInput={(params) => (
              <TextField 
                {...params} 
                label="Select Course (Optional)" 
                sx={{ mt: 2 }}
                helperText="Onsite courses in Draft or Ongoing status"
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props} key={option.id}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {option.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.batch_code} • {option.status}
                  </Typography>
                </Box>
              </Box>
            )}
          />
        )}
        <TextField
          label="Hours Taught"
          type="number"
          fullWidth
          value={mentorHours}
          onChange={(e) => setMentorHours(e.target.value)}
          sx={{ mt: 2 }}
          inputProps={{ min: 0, step: 0.1 }}
        />
        <TextField
          label="Amount Paid"
          type="number"
          fullWidth
          value={mentorAmount}
          onChange={(e) => setMentorAmount(e.target.value)}
          sx={{ mt: 2 }}
          InputProps={{
            startAdornment: <InputAdornment position="start">Tk</InputAdornment>,
          }}
          inputProps={{ min: 0, step: 0.01 }}
        />
        {isDraft && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Note: This assignment will be saved to draft.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} sx={{ textTransform: 'uppercase' }}>
          Cancel
        </Button>
        <Button
          onClick={handleAssign}
          variant="contained"
          disabled={loading || !selectedEmployeeId || !mentorHours || !mentorAmount}
          sx={{ textTransform: 'uppercase' }}
        >
          {loading ? <CircularProgress size={20} /> : 'Assign'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignInternalMentorDialog;

