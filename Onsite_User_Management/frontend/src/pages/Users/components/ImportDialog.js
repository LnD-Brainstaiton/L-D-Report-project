import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Collapse,
  IconButton,
  useTheme,
  alpha,
} from '@mui/material';
import { UploadFile, Visibility, ExpandMore, ExpandLess, Download } from '@mui/icons-material';

const ImportDialog = ({
  open,
  onClose,
  importFile,
  setImportFile,
  importLoading,
  importResults,
  showPreview,
  setShowPreview,
  previewData,
  onImportExcel,
  onImportCSV,
}) => {
  const theme = useTheme();

  const handleFileChange = (event) => {
    setImportFile(event.target.files[0]);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.2)}`,
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 600 }}>Import Employees from File</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} mt={1}>
          <Typography variant="body2" color="text.secondary">
            Upload an Excel (.xlsx) or CSV file to import employees. The file should contain columns: Employee ID, Name, Email, Department, Designation, Career Start Date, BS Joining Date.
          </Typography>
          
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
              onClick={() => setShowPreview(!showPreview)}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Visibility fontSize="small" />
                Preview Expected Format
              </Typography>
              <IconButton size="small">
                {showPreview ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
            
            <Collapse in={showPreview}>
              <Box mt={1} sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end', borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Download />}
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = '/employee_data_101_200.xlsx';
                      link.download = 'employee_data_101_200.xlsx';
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
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>career_start_date</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>bs_join_date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {previewData.map((row, index) => (
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
                          <TableCell sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{row.career_start_date || 'N/A'}</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{row.bs_join_date || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box sx={{ p: 1, backgroundColor: alpha(theme.palette.info.main, 0.05), borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Date format: DD-MM-YYYY (e.g., 11-01-2021)
                  </Typography>
                </Box>
              </Box>
            </Collapse>
          </Box>

          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="import-file-input"
          />
          <label htmlFor="import-file-input">
            <Button
              variant="outlined"
              component="span"
              fullWidth
              startIcon={<UploadFile />}
              sx={{ mb: 2 }}
            >
              {importFile ? importFile.name : 'Select File'}
            </Button>
          </label>

          {importLoading && (
            <Box display="flex" alignItems="center" gap={2}>
              <CircularProgress size={20} />
              <Typography variant="body2">Processing file...</Typography>
            </Box>
          )}

          {importResults && (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Import Results:
              </Typography>
              <Typography variant="body2">
                Total: {importResults.total} | Created: {importResults.created} | Updated: {importResults.updated}
              </Typography>
              {importResults.errors && importResults.errors.length > 0 && (
                <Box mt={1}>
                  <Typography variant="caption" color="error" sx={{ fontWeight: 600 }}>
                    Errors ({importResults.errors.length}):
                  </Typography>
                  {importResults.errors.slice(0, 5).map((error, index) => (
                    <Typography key={index} variant="caption" display="block" color="error">
                      {error.error || error}
                    </Typography>
                  ))}
                  {importResults.errors.length > 5 && (
                    <Typography variant="caption" color="error">
                      ... and {importResults.errors.length - 5} more errors
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          onClick={onImportExcel}
          variant="contained"
          disabled={!importFile || importLoading}
          startIcon={importLoading ? <CircularProgress size={20} /> : null}
        >
          Upload Excel
        </Button>
        <Button
          onClick={onImportCSV}
          variant="contained"
          disabled={!importFile || importLoading}
          startIcon={importLoading ? <CircularProgress size={20} /> : null}
        >
          Upload CSV
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportDialog;

