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
  Chip,
  IconButton,
  Collapse,
  useTheme,
  alpha,
} from '@mui/material';
import { Visibility, ExpandMore, ExpandLess, UploadFile, Download } from '@mui/icons-material';

const enrollmentPreviewData = [
  { employee_id: 'EMP143', name: 'Casey Smith', email: 'casey.smith143@company.com', department: 'Operations', designation: 'Engineer', course_name: 'Advanced Data Analytics', batch_code: 'ADA2025A' },
  { employee_id: 'EMP102', name: 'Morgan Williams', email: 'morgan.williams102@company.com', department: 'Marketing', designation: 'Engineer', course_name: 'Advanced Data Analytics', batch_code: 'ADA2025A' },
  { employee_id: 'EMP144', name: 'Reese Williams', email: 'reese.williams144@company.com', department: 'Operations', designation: 'Manager', course_name: 'Advanced Data Analytics', batch_code: 'ADA2025A' },
  { employee_id: 'EMP145', name: 'Alex Johnson', email: 'alex.johnson145@company.com', department: 'IT', designation: 'Coordinator', course_name: 'Advanced Data Analytics', batch_code: 'ADA2025A' },
];

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  importFile: File | null;
  setImportFile: React.Dispatch<React.SetStateAction<File | null>>;
  importLoading: boolean;
  onImportExcel: () => void;
  onImportCSV: () => void;
  showImportPreview: boolean;
  setShowImportPreview: React.Dispatch<React.SetStateAction<boolean>>;
}

function ImportDialog({
  open,
  onClose,
  importFile,
  setImportFile,
  importLoading,
  onImportExcel,
  onImportCSV,
  showImportPreview,
  setShowImportPreview,
}: ImportDialogProps): React.ReactElement {
  const theme = useTheme();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    if (event.target.files && event.target.files[0]) {
      setImportFile(event.target.files[0]);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Import Enrollments</DialogTitle>
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
            onClick={() => setShowImportPreview(!showImportPreview)}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Visibility fontSize="small" />
              Preview Expected Format
            </Typography>
            <IconButton size="small">
              {showImportPreview ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
          
          <Collapse in={showImportPreview}>
            <Box mt={1} sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, borderRadius: 2, overflow: 'hidden' }}>
              <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end', borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Download />}
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = '/ADA2025A_registration.xlsx';
                    link.download = 'enrollment_template.xlsx';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  sx={{ textTransform: 'none' }}
                >
                  Download Template
                </Button>
              </Box>
              <TableContainer sx={{ maxHeight: 400, overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 1000 }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>employee_id</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>name</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>email</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>department</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>designation</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>course_name</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>batch_code</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {enrollmentPreviewData.map((row, index) => (
                      <TableRow 
                        key={index}
                        sx={{ 
                          '&:nth-of-type(odd)': { backgroundColor: alpha(theme.palette.primary.main, 0.02) }
                        }}
                      >
                        <TableCell sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{row.employee_id}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{row.name}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{row.email}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                          <Chip label={row.department} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{row.designation}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{row.course_name}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{row.batch_code}</TableCell>
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
          {importFile && (
            <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
              Selected: <strong>{importFile.name}</strong>
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onImportCSV} variant="outlined" disabled={!importFile || importLoading}>
          Upload CSV
        </Button>
        <Button onClick={onImportExcel} variant="contained" disabled={!importFile || importLoading}>
          Upload Excel
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ImportDialog;

