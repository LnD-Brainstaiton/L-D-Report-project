import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Menu,
    MenuItem,
    TextField,
    Typography,
    Grid,
    ToggleButton,
    ToggleButtonGroup,
    useTheme,
    alpha,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, format } from 'date-fns';

export type DateRangeOption = 'week' | 'month' | 'quarter' | 'custom' | 'all_time';

interface DateRangeSelectorProps {
    onChange: (startDate: Date | null, endDate: Date | null, option: DateRangeOption) => void;
    initialOption?: DateRangeOption;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ onChange, initialOption = 'month' }) => {
    const theme = useTheme();
    const [selectedOption, setSelectedOption] = useState<DateRangeOption>(initialOption);
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);

    useEffect(() => {
        handleOptionChange(null, initialOption);
    }, []);

    const handleOptionChange = (event: React.MouseEvent<HTMLElement> | null, newOption: DateRangeOption | null) => {
        if (!newOption) return;

        setSelectedOption(newOption);

        const now = new Date();
        let newStart: Date | null = null;
        let newEnd: Date | null = null;

        switch (newOption) {
            case 'week':
                newStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday start
                newEnd = endOfWeek(now, { weekStartsOn: 1 });
                break;
            case 'month':
                newStart = startOfMonth(now);
                newEnd = endOfMonth(now);
                break;
            case 'quarter':
                newStart = startOfQuarter(now);
                newEnd = endOfQuarter(now);
                break;
            case 'custom':
                // Keep existing custom dates or default to today
                newStart = startDate || now;
                newEnd = endDate || now;
                break;
            case 'all_time':
                newStart = null;
                newEnd = null;
                break;
        }

        setStartDate(newStart);
        setEndDate(newEnd);
        onChange(newStart, newEnd, newOption);
    };

    const handleCustomDateChange = (type: 'start' | 'end', date: Date | null) => {
        if (type === 'start') {
            setStartDate(date);
            onChange(date, endDate, 'custom');
        } else {
            setEndDate(date);
            onChange(startDate, date, 'custom');
        }
    };

    return (
        <Box>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
                Select Date Range
            </Typography>

            <ToggleButtonGroup
                value={selectedOption}
                exclusive
                onChange={handleOptionChange}
                aria-label="date range"
                size="small"
                sx={{ mb: 3, width: '100%' }}
            >
                <ToggleButton value="week" aria-label="this week" sx={{ flex: 1 }}>
                    This Week
                </ToggleButton>
                <ToggleButton value="month" aria-label="this month" sx={{ flex: 1 }}>
                    This Month
                </ToggleButton>
                <ToggleButton value="quarter" aria-label="this quarter" sx={{ flex: 1 }}>
                    This Quarter
                </ToggleButton>
                <ToggleButton value="all_time" aria-label="all time" sx={{ flex: 1 }}>
                    All Time
                </ToggleButton>
                <ToggleButton value="custom" aria-label="custom range" sx={{ flex: 1 }}>
                    Custom
                </ToggleButton>
            </ToggleButtonGroup>

            {selectedOption === 'custom' && (
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <DatePicker
                                label="Start Date"
                                value={startDate}
                                onChange={(newValue) => handleCustomDateChange('start', newValue)}
                                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <DatePicker
                                label="End Date"
                                value={endDate}
                                onChange={(newValue) => handleCustomDateChange('end', newValue)}
                                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            />
                        </Grid>
                    </Grid>
                </LocalizationProvider>
            )}

            {selectedOption !== 'custom' && startDate && endDate && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                    {format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}
                </Typography>
            )}
        </Box>
    );
};

export default DateRangeSelector;
