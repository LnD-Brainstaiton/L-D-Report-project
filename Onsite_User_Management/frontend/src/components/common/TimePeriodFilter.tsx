/**
 * Reusable Time Period Filter Component
 * Used across Dashboard, Courses pages for filtering by month/quarter/year
 */

import React from 'react';
import {
  Box,
  TextField,
  MenuItem,
  Button,
  Chip,
} from '@mui/material';
import { CalendarToday } from '@mui/icons-material';
import { formatDateRangeDisplay } from '../../utils/dateRangeUtils';
import type { TimePeriod } from '../../types';


interface MonthOption {
  value: string;
  label: string;
}

interface QuarterOption {
  value: string;
  label: string;
}

const MONTHS: MonthOption[] = [
  { value: '0', label: 'January' },
  { value: '1', label: 'February' },
  { value: '2', label: 'March' },
  { value: '3', label: 'April' },
  { value: '4', label: 'May' },
  { value: '5', label: 'June' },
  { value: '6', label: 'July' },
  { value: '7', label: 'August' },
  { value: '8', label: 'September' },
  { value: '9', label: 'October' },
  { value: '10', label: 'November' },
  { value: '11', label: 'December' },
];

const QUARTERS: QuarterOption[] = [
  { value: '1', label: 'Q1 (Jan-Mar)' },
  { value: '2', label: 'Q2 (Apr-Jun)' },
  { value: '3', label: 'Q3 (Jul-Sep)' },
  { value: '4', label: 'Q4 (Oct-Dec)' },
];

interface TimePeriodFilterProps {
  timePeriod: TimePeriod;
  onTimePeriodChange: (value: TimePeriod) => void;
  selectedMonth: string;
  onMonthChange: (value: string) => void;
  selectedQuarter: string;
  onQuarterChange: (value: string) => void;
  selectedYear: number;
  onYearChange: (value: number) => void;
  showChip?: boolean;
  showClearButton?: boolean;
  onClear?: () => void;
}

const TimePeriodFilter: React.FC<TimePeriodFilterProps> = ({
  timePeriod,
  onTimePeriodChange,
  selectedMonth,
  onMonthChange,
  selectedQuarter,
  onQuarterChange,
  selectedYear,
  onYearChange,
  showChip = true,
  showClearButton = true,
  onClear,
}) => {
  const handleTimePeriodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value as TimePeriod;
    onTimePeriodChange(value);
    if (value === 'all') {
      onMonthChange('');
      onQuarterChange('');
    }
  };

  const handleClear = () => {
    onTimePeriodChange('all');
    onMonthChange('');
    onQuarterChange('');
    onYearChange(new Date().getFullYear());
    if (onClear) onClear();
  };

  const dateRangeFormatted = formatDateRangeDisplay(
    timePeriod,
    selectedMonth,
    selectedQuarter,
    selectedYear
  );

  return (
    <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
      <TextField
        select
        label="Time Period"
        value={timePeriod}
        onChange={handleTimePeriodChange}
        sx={{ minWidth: 150 }}
        size="small"
      >
        <MenuItem value="all">All Time</MenuItem>
        <MenuItem value="month">Month</MenuItem>
        <MenuItem value="quarter">Quarter</MenuItem>
        <MenuItem value="year">Year</MenuItem>
      </TextField>

      {timePeriod === 'month' && (
        <>
          <TextField
            select
            label="Month"
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            sx={{ minWidth: 150 }}
            size="small"
          >
            {MONTHS.map((month) => (
              <MenuItem key={month.value} value={month.value}>
                {month.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            type="number"
            label="Year"
            value={selectedYear}
            onChange={(e) => onYearChange(parseInt(e.target.value))}
            inputProps={{ min: 2000, max: 2100 }}
            sx={{ minWidth: 100 }}
            size="small"
          />
        </>
      )}

      {timePeriod === 'quarter' && (
        <>
          <TextField
            select
            label="Quarter"
            value={selectedQuarter}
            onChange={(e) => onQuarterChange(e.target.value)}
            sx={{ minWidth: 120 }}
            size="small"
          >
            {QUARTERS.map((quarter) => (
              <MenuItem key={quarter.value} value={quarter.value}>
                {quarter.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            type="number"
            label="Year"
            value={selectedYear}
            onChange={(e) => onYearChange(parseInt(e.target.value))}
            inputProps={{ min: 2000, max: 2100 }}
            sx={{ minWidth: 100 }}
            size="small"
          />
        </>
      )}

      {timePeriod === 'year' && (
        <TextField
          type="number"
          label="Year"
          value={selectedYear}
          onChange={(e) => onYearChange(parseInt(e.target.value))}
          inputProps={{ min: 2000, max: 2100 }}
          sx={{ minWidth: 100 }}
          size="small"
        />
      )}

      {showChip && timePeriod !== 'all' && (
        <Chip
          icon={<CalendarToday />}
          label={dateRangeFormatted}
          color="primary"
          variant="outlined"
        />
      )}

      {showClearButton && timePeriod !== 'all' && (
        <Button
          variant="text"
          size="small"
          onClick={handleClear}
          sx={{ color: '#64748b', fontWeight: 500 }}
        >
          Clear
        </Button>
      )}
    </Box>
  );
};

export default TimePeriodFilter;

