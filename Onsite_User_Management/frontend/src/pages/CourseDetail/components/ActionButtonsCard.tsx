import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Button,
  Theme,
  alpha,
} from '@mui/material';
import {
  CheckCircle,
  PersonAdd,
  UploadFile,
  Download,
} from '@mui/icons-material';
import { Course } from '../../../types';

interface ActionButtonsCardProps {
  course: Course | null;
  onApproveCourse: () => void;
  onManualEnroll: () => void;
  onImportEnrollments: () => void;
  onUploadAttendance: () => void;
  onGenerateReport: () => void;
  theme: Theme;
}

function ActionButtonsCard({
  course,
  onApproveCourse,
  onManualEnroll,
  onImportEnrollments,
  onUploadAttendance,
  onGenerateReport,
  theme,
}: ActionButtonsCardProps): React.ReactElement {
  return (
    <Card sx={{ mb: 3, border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
      <CardContent>
        <Box display="flex" gap={2} flexWrap="wrap">
          {course?.status === 'draft' && (
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              onClick={onApproveCourse}
              sx={{ fontWeight: 600 }}
            >
              Approve Course
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={onManualEnroll}
            sx={{
              background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
              fontWeight: 600,
              textTransform: 'uppercase',
              boxShadow: '0 4px 12px rgba(30, 64, 175, 0.25)',
            }}
          >
            Manual Enrollment
          </Button>
          <Button
            variant="contained"
            startIcon={<UploadFile />}
            onClick={onImportEnrollments}
            sx={{
              background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
              fontWeight: 600,
              textTransform: 'uppercase',
              boxShadow: '0 4px 12px rgba(30, 64, 175, 0.25)',
            }}
          >
            Import Enrollments
          </Button>
          <Button
            variant="contained"
            startIcon={<UploadFile />}
            onClick={onUploadAttendance}
            sx={{
              background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
              fontWeight: 600,
              textTransform: 'uppercase',
              boxShadow: '0 4px 12px rgba(30, 64, 175, 0.25)',
            }}
          >
            Upload Attendance & Scores
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={onGenerateReport}
            sx={{
              background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
              fontWeight: 600,
              textTransform: 'uppercase',
              boxShadow: '0 4px 12px rgba(30, 64, 175, 0.25)',
            }}
          >
            Generate Report
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

export default ActionButtonsCard;

