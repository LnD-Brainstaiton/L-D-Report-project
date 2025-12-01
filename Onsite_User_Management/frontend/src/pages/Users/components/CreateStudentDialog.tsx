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
  useTheme,
  alpha,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface NewStudent {
  employee_id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  experience_years: number;
  career_start_date: Date | null;
  bs_joining_date: Date | null;
}

interface CreateStudentDialogProps {
  open: boolean;
  onClose: () => void;
  newStudent: NewStudent;
  setNewStudent: (student: NewStudent) => void;
  departments: string[];
  onCreate: () => void;
}

const CreateStudentDialog: React.FC<CreateStudentDialogProps> = ({
  open,
  onClose,
  newStudent,
  setNewStudent,
  departments,
  onCreate,
}) => {
  const theme = useTheme();
  const [error, setError] = React.useState('');

  const handleCreate = () => {
    if (!newStudent.name || !newStudent.email || !newStudent.department) {
      setError('Please fill in all required fields');
      return;
    }

    // Basic email validation
    if (!newStudent.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    onCreate();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.2)}`,
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 600 }}>Add New Employee</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} mt={1}>
          <TextField
            label="Employee ID"
            value={newStudent.employee_id}
            onChange={(e) => setNewStudent({ ...newStudent, employee_id: e.target.value })}
            fullWidth
            helperText="Leave blank for auto-generated ID (External)"
          />
          <TextField
            label="Name"
            value={newStudent.name}
            onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
            fullWidth
            required
            error={!!error && !newStudent.name}
          />
          <TextField
            label="Email"
            type="email"
            value={newStudent.email}
            onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
            fullWidth
            required
            error={!!error && (!newStudent.email || !newStudent.email.includes('@'))}
            helperText={!!error && (!newStudent.email || !newStudent.email.includes('@')) ? error : ''}
          />
          <TextField
            select
            label="Department"
            value={newStudent.department}
            onChange={(e) => setNewStudent({ ...newStudent, department: e.target.value })}
            fullWidth
            required
            error={!!error && !newStudent.department}
            helperText={!!error && !newStudent.department ? error : ''}
          >
            {departments.map((dept) => (
              <MenuItem key={dept} value={dept}>
                {dept}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Designation"
            value={newStudent.designation}
            onChange={(e) => setNewStudent({ ...newStudent, designation: e.target.value })}
            fullWidth
          />
          <TextField
            label="Experience (Years)"
            type="number"
            value={newStudent.experience_years}
            onChange={(e) => setNewStudent({ ...newStudent, experience_years: parseInt(e.target.value) || 0 })}
            fullWidth
          />
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Career Start Date"
              value={newStudent.career_start_date}
              onChange={(date) => setNewStudent({ ...newStudent, career_start_date: date })}
              format="dd/MM/yy"
              slotProps={{ textField: { fullWidth: true, placeholder: 'DD/MM/YY' } }}
            />
            <Box sx={{ mt: 2 }}>
              <DatePicker
                label="BS Joining Date"
                value={newStudent.bs_joining_date}
                onChange={(date) => setNewStudent({ ...newStudent, bs_joining_date: date })}
                format="dd/MM/yy"
                slotProps={{ textField: { fullWidth: true, placeholder: 'DD/MM/YY' } }}
              />
            </Box>
          </LocalizationProvider>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleCreate} variant="contained">
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateStudentDialog;

