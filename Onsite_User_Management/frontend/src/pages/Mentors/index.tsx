import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  alpha,
  Button,
  TextField,
  MenuItem,
  InputAdornment,
  Autocomplete,
} from '@mui/material';
import { Add, Search } from '@mui/icons-material';
import { mentorsAPI, studentsAPI, coursesAPI } from '../../services/api';
import MentorDetailsDialog from '../../components/MentorDetailsDialog';
import AssignInternalMentorDialog from '../../components/AssignInternalMentorDialog';
import AddExternalMentorDialog from '../../components/AddExternalMentorDialog';
import { AlertMessage } from '../../components/common';
import { useMentorsData } from './hooks/useMentorsData';
import { useFilteredMentors } from './utils/mentorFilters';
import MentorStatsDialog from './components/MentorStatsDialog';
import MentorsTable from './components/MentorsTable';
import type { Mentor, MentorStats } from '../../types';
import { AxiosError } from 'axios';

const Mentors: React.FC = () => {
  // Filter state
  const [selectedType, setSelectedType] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSearchMentor, setSelectedSearchMentor] = useState<Mentor | null>(null);
  const [filterNoCourseHistory, setFilterNoCourseHistory] = useState(false);

  // Dialog state
  const [mentorDetailsOpen, setMentorDetailsOpen] = useState(false);
  const [selectedMentorForDetails, setSelectedMentorForDetails] = useState<Mentor | null>(null);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [mentorStats, setMentorStats] = useState<MentorStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [addInternalMentorDialogOpen, setAddInternalMentorDialogOpen] = useState(false);
  const [addExternalMentorDialogOpen, setAddExternalMentorDialogOpen] = useState(false);

  // Data hooks
  const { mentors, sbus, loading, message, setMessage, fetchMentors, deleteMentor } = useMentorsData();

  const filteredMentors = useFilteredMentors(
    mentors,
    selectedType,
    selectedDepartment,
    searchQuery,
    selectedSearchMentor,
    filterNoCourseHistory
  );

  const handleViewDetails = (mentor: Mentor) => {
    setSelectedMentorForDetails(mentor);
    setMentorDetailsOpen(true);
  };

  const handleViewStats = async (mentorId: number) => {
    setLoadingStats(true);
    setStatsDialogOpen(true);
    try {
      const response = await mentorsAPI.getStats(mentorId);
      setMentorStats(response.data);
      setSelectedMentor(mentors.find((m) => m.id === mentorId) || null);
    } catch (error) {
      console.error('Error fetching mentor stats:', error);
      setMessage({ type: 'error', text: 'Error fetching mentor statistics' });
    } finally {
      setLoadingStats(false);
    }
  };

  const handleAssignInternalMentor = async (assignment: { mentor_id: number; course_id?: number; hours_taught: number; amount_paid: number }) => {
    try {
      // If a course is selected, assign the mentor to the course
      if (assignment.course_id) {
        await coursesAPI.assignMentor(assignment.course_id, {
          mentor_id: assignment.mentor_id,
          hours_taught: assignment.hours_taught,
          amount_paid: assignment.amount_paid,
        });
        setMessage({ type: 'success', text: 'Internal mentor created and assigned to course successfully' });
      } else {
        setMessage({ type: 'success', text: 'Internal mentor created successfully' });
      }
      setAddInternalMentorDialogOpen(false);
      fetchMentors();
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string }>;
      setMessage({
        type: 'error',
        text: axiosError.response?.data?.detail || 'Error creating internal mentor',
      });
      throw error;
    }
  };

  const handleAddExternalMentor = async (assignment: { mentor_id: number; hours_taught: number; amount_paid: number; course_id?: number }) => {
    try {
      // If a course is selected, assign the mentor to the course
      if (assignment.course_id) {
        await coursesAPI.assignMentor(assignment.course_id, {
          mentor_id: assignment.mentor_id,
          hours_taught: assignment.hours_taught,
          amount_paid: assignment.amount_paid,
        });
        setMessage({ type: 'success', text: 'External mentor created/selected and assigned to course successfully' });
      } else {
        setMessage({ type: 'success', text: 'External mentor created successfully' });
      }
      setAddExternalMentorDialogOpen(false);
      fetchMentors();
    } catch (error) {
      console.error('Error creating/assigning external mentor:', error);
      const axiosError = error as AxiosError<{ detail?: string }>;
      const errorMessage = axiosError.response?.data?.detail || axiosError.message || 'Error creating/assigning external mentor';
      setMessage({ type: 'error', text: errorMessage });
      throw error;
    }
  };

  const handleRemoveMentor = async (mentor: Mentor) => {
    const confirmMessage = mentor.is_internal
      ? `Are you sure you want to remove ${mentor.name} as a mentor? This will remove their mentor status.`
      : `Are you sure you want to delete ${mentor.name}?`;

    if (window.confirm(confirmMessage)) {
      try {
        if (mentor.is_internal && mentor.student_id) {
          // For internal mentors, use the remove mentor tag endpoint
          await studentsAPI.removeMentorTag(mentor.student_id);
          setMessage({ type: 'success', text: 'Mentor status removed successfully' });
        } else {
          // For external mentors, delete the mentor record
          await mentorsAPI.delete(mentor.id);
          setMessage({ type: 'success', text: 'Mentor deleted successfully' });
        }
        fetchMentors();
      } catch (error) {
        const axiosError = error as AxiosError<{ detail?: string }>;
        setMessage({
          type: 'error',
          text: axiosError.response?.data?.detail || 'Error removing mentor',
        });
      }
    }
  };

  const handleClearFilters = () => {
    setSelectedType('');
    setSelectedDepartment('');
    setSearchQuery('');
    setSelectedSearchMentor(null);
    setFilterNoCourseHistory(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${alpha('#1e40af', 0.03)} 0%, ${alpha('#059669', 0.03)} 100%)`,
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 4, pt: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#1e40af', mb: 1, letterSpacing: '-0.02em' }}>
              Mentors
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.95rem' }}>
              Manage internal and external mentors
            </Typography>
          </Box>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => setAddInternalMentorDialogOpen(true)}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                color: '#1e40af',
                borderColor: '#1e40af',
                '&:hover': { background: alpha('#1e40af', 0.05) },
              }}
            >
              Add Internal
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setAddExternalMentorDialogOpen(true)}
              sx={{
                background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                boxShadow: '0 4px 12px rgba(30, 64, 175, 0.25)',
              }}
            >
              Add External
            </Button>
          </Box>
        </Box>
      </Box>

      <AlertMessage message={message} onClose={() => setMessage(null)} />

      {/* Filter section */}
      <Card
        sx={{
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(30, 64, 175, 0.1)',
          mb: 3,
          background: '#ffffff',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" gap={2} flexWrap="wrap" alignItems="flex-end">
            <Autocomplete
              options={mentors}
              getOptionLabel={(option) => (option ? `${option.name}${option.email ? ` - ${option.email}` : ''}` : '')}
              value={selectedSearchMentor}
              onChange={(_, newValue) => {
                setSelectedSearchMentor(newValue);
                if (newValue) setSearchQuery(newValue.name || '');
                else setSearchQuery('');
              }}
              onInputChange={(_, newInputValue) => {
                setSearchQuery(newInputValue);
                if (!newInputValue) setSelectedSearchMentor(null);
              }}
              inputValue={searchQuery}
              filterOptions={(options, { inputValue }) => {
                if (!inputValue) return [];
                const searchLower = inputValue.toLowerCase();
                return options.filter(
                  (mentor) =>
                    mentor.name?.toLowerCase().includes(searchLower) ||
                    mentor.email?.toLowerCase().includes(searchLower)
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search"
                  placeholder="Name or email..."
                  size="small"
                  sx={{ minWidth: 280, flex: 1 }}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <Search sx={{ color: '#94a3b8' }} />
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                />
              )}
              noOptionsText="No mentors found"
            />
            <TextField
              select
              label="Type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              sx={{ minWidth: 140 }}
              size="small"
            >
              <MenuItem value="">All Mentors</MenuItem>
              <MenuItem value="internal">Internal</MenuItem>
              <MenuItem value="external">External</MenuItem>
            </TextField>
            <TextField
              select
              label="SBU"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              sx={{ minWidth: 160 }}
              size="small"
            >
              <MenuItem value="">All SBUs</MenuItem>
              {sbus.map((sbu) => (
                <MenuItem key={sbu} value={sbu}>{sbu}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Course History"
              value={filterNoCourseHistory ? 'no_history' : ''}
              onChange={(e) => setFilterNoCourseHistory(e.target.value === 'no_history')}
              sx={{ minWidth: 160 }}
              size="small"
            >
              <MenuItem value="">All Mentors</MenuItem>
              <MenuItem value="no_history">No Course History</MenuItem>
            </TextField>
            {(selectedType || selectedDepartment || searchQuery || filterNoCourseHistory) && (
              <Button variant="text" size="small" onClick={handleClearFilters} sx={{ color: '#64748b', fontWeight: 500 }}>
                Clear
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress sx={{ color: '#1e40af' }} />
        </Box>
      ) : (
        <MentorsTable
          mentors={filteredMentors}
          onViewDetails={handleViewDetails}
          onViewStats={handleViewStats}
          onRemove={handleRemoveMentor}
        />
      )}

      {/* Dialogs */}
      <MentorDetailsDialog
        open={mentorDetailsOpen}
        onClose={() => {
          setMentorDetailsOpen(false);
          setSelectedMentorForDetails(null);
        }}
        mentor={selectedMentorForDetails}
      />

      <MentorStatsDialog
        open={statsDialogOpen}
        onClose={() => setStatsDialogOpen(false)}
        mentor={selectedMentor}
        stats={mentorStats}
        loading={loadingStats}
      />

      <AssignInternalMentorDialog
        open={addInternalMentorDialogOpen}
        onClose={() => setAddInternalMentorDialogOpen(false)}
        onAssign={handleAssignInternalMentor}
        isDraft={false}
        showCourseSelection={true}
      />

      <AddExternalMentorDialog
        open={addExternalMentorDialogOpen}
        onClose={() => setAddExternalMentorDialogOpen(false)}
        onAdd={handleAddExternalMentor}
        isDraft={false}
        showCourseSelection={true}
        allowSelection={true}
      />
    </Box>
  );
};

export default Mentors;

