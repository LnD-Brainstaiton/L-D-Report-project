import React from 'react';
import {
    Box,
    Typography,
    Button,
    Divider,
    Autocomplete,
    TextField,
} from '@mui/material';

interface EmployeeSelectionProps {
    allEmployees: any[];
    selectedEmployee: any | null;
    isAllEmployees: boolean;
    loading: boolean;
    onEmployeeChange: (employee: any | null) => void;
    onAllEmployeesChange: (isAll: boolean) => void;
    onNext: () => void;
    onBack: () => void;
}

const EmployeeSelection: React.FC<EmployeeSelectionProps> = ({
    allEmployees,
    selectedEmployee,
    isAllEmployees,
    loading,
    onEmployeeChange,
    onAllEmployeesChange,
    onNext,
    onBack,
}) => {
    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', py: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
                Select Employee
            </Typography>

            <Box sx={{ mb: 3 }}>
                <Button
                    variant={isAllEmployees ? "contained" : "outlined"}
                    onClick={() => {
                        onAllEmployeesChange(!isAllEmployees);
                        onEmployeeChange(null);
                    }}
                    fullWidth
                    sx={{ mb: 2 }}
                >
                    {isAllEmployees ? "Selected: All Employees (Master Report)" : "Select All Employees (Master Report)"}
                </Button>
            </Box>

            <Divider sx={{ my: 2 }}>OR</Divider>

            <Autocomplete
                options={allEmployees}
                getOptionLabel={(option) => `${option.name} (${option.employee_id})`}
                value={selectedEmployee}
                onChange={(_, newValue) => {
                    onEmployeeChange(newValue);
                    onAllEmployeesChange(false);
                }}
                disabled={isAllEmployees}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Search Employee"
                        placeholder="Type to search by name or ID..."
                    />
                )}
                loading={loading}
                sx={{ mb: 4 }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button onClick={onBack}>Back</Button>
                <Button variant="contained" onClick={onNext} disabled={!selectedEmployee && !isAllEmployees}>
                    Continue
                </Button>
            </Box>
        </Box>
    );
};

export default EmployeeSelection;
