import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Collapse,
  useTheme,
  alpha,
} from '@mui/material';
import { Visibility, ExpandMore, ExpandLess, UploadFile, Download } from '@mui/icons-material';

const attendancePreviewData = [
  { name: 'John Doe', email: 'john.doe@company.com', total_classes_attended: 8, score: 85.5 },
  { name: 'Jane Smith', email: 'jane.smith@company.com', total_classes_attended: 9, score: 92.0 },
  { name: 'Bob Wilson', email: 'bob.wilson@company.com', total_classes_attended: 7, score: 78.5 },
  { name: 'Alice Brown', email: 'alice.brown@company.com', total_classes_attended: 10, score: 95.0 },
];

interface AttendanceDialogProps {
  open: boolean;
  onClose: () => void;
  attendanceFile: File | null;
  setAttendanceFile: React.Dispatch<React.SetStateAction<File | null>>;
  attendanceLoading: boolean;
  onUpload: () => void;
  showAttendancePreview: boolean;
  setShowAttendancePreview: React.Dispatch<React.SetStateAction<boolean>>;
}

function AttendanceDialog({
  open,
  onClose,
  attendanceFile,
  setAttendanceFile,
  attendanceLoading,
  onUpload,
  showAttendancePreview,
  setShowAttendancePreview,
}: AttendanceDialogProps): React.ReactElement {
  const theme = useTheme();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    if (event.target.files && event.target.files[0]) {
      setAttendanceFile(event.target.files[0]);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Upload Attendance & Scores</DialogTitle>
      <DialogContent>
        {/* Preview Section */}
        <Box>
          <Box 
            display="flex" 
            alignItems="center" 
            justifyContent="space-between"
            sx={{ 
              cursor: 'pointer',
              p: 1,
              borderRadius: 1,
              '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.05) }
            }}
            onClick={() => setShowAttendancePreview(!showAttendancePreview)}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Visibility fontSize="small" />
              Preview Expected Format
            </Typography>
            <IconButton size="small">
              {showAttendancePreview ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
          
          <Collapse in={showAttendancePreview}>
            <Box mt={1} sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, borderRadius: 2, overflow: 'hidden' }}>
              <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end', borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Download />}
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = '/ADA2025A_completion.xlsx';
                    link.download = 'attendance_template.xlsx';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  sx={{ textTransform: 'none' }}
                >
                  Download Template
                </Button>
              </Box>
              <TableContainer>
                <Table size="small" sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>name</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>email</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>total_classes_attended</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>score</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attendancePreviewData.map((row, index) => (
                      <TableRow 
                        key={index}
                        sx={{ 
                          '&:nth-of-type(odd)': { backgroundColor: alpha(theme.palette.primary.main, 0.02) }
                        }}
                      >
                        <TableCell sx={{ fontSize: '0.75rem' }}>{row.name}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>{row.email}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>{row.total_classes_attended}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>{row.score}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ p: 1, backgroundColor: alpha(theme.palette.info.main, 0.05), borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  
                </Typography>
              </Box>
            </Box>
          </Collapse>
        </Box>
        
        <Box sx={{ mt: 3 }}>
          <Button variant="outlined" component="label" startIcon={<UploadFile />} fullWidth>
            Select File
            <input type="file" hidden accept=".xlsx,.xls,.csv" onChange={handleFileChange} />
          </Button>
          {attendanceFile && (
            <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
              Selected: <strong>{attendanceFile.name}</strong>
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onUpload} variant="contained" disabled={!attendanceFile || attendanceLoading}>
          Upload
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AttendanceDialog;

