import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  Divider,
  Theme,
  alpha,
} from '@mui/material';
import { AccountBalance, Edit, Person, Restaurant, Receipt, Calculate } from '@mui/icons-material';
import { calculateTotalMentorCost, calculateTotalTrainingCost } from '../utils/costCalculators';
import { Course, DraftMentorAssignment, Mentor } from '../../../types';

interface DraftMentorWithDetails extends DraftMentorAssignment {
  mentor: Mentor | null;
  is_draft: boolean;
}

interface CostBreakdownCardProps {
  course: Course | null;
  draftMentorsWithDetails: DraftMentorWithDetails[];
  onEditClick: () => void;
  theme: Theme;
}

function CostBreakdownCard({
  course,
  draftMentorsWithDetails,
  onEditClick,
  theme,
}: CostBreakdownCardProps): React.ReactElement {
  const totalMentorCost = calculateTotalMentorCost(course as any, draftMentorsWithDetails as any);
  const totalTrainingCost = calculateTotalTrainingCost(course as any, draftMentorsWithDetails as any);
  
  const foodCost = (course?.status === 'draft' && course?.draft?.food_cost !== null && course?.draft?.food_cost !== undefined)
    ? parseFloat(String(course.draft.food_cost))
    : parseFloat(String(course?.food_cost || 0));
  const otherCost = (course?.status === 'draft' && course?.draft?.other_cost !== null && course?.draft?.other_cost !== undefined)
    ? parseFloat(String(course.draft.other_cost))
    : parseFloat(String(course?.other_cost || 0));

  return (
    <Card sx={{ mb: 3, border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2.5} flexWrap="wrap" gap={2}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <AccountBalance color="primary" sx={{ fontSize: 24 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Course Costs Breakdown
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Edit />}
            onClick={onEditClick}
          >
            Edit Costs
          </Button>
        </Box>
        <Divider sx={{ mb: 2.5 }} />
        
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 0 }}>
            {/* Total Mentor Costs */}
            <Box
              sx={{
                p: 2.5,
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box display="flex" alignItems="center" gap={2}>
                <Person color="primary" sx={{ fontSize: 24 }} />
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  Total Mentor Costs
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                Tk {totalMentorCost.toFixed(2)}
              </Typography>
            </Box>
            
            {/* Food Cost */}
            <Box
              sx={{
                p: 2.5,
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box display="flex" alignItems="center" gap={2}>
                <Restaurant color="success" sx={{ fontSize: 24 }} />
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  Food Cost
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                Tk {foodCost.toFixed(2)}
              </Typography>
            </Box>
            
            {/* Other Cost */}
            <Box
              sx={{
                p: 2.5,
                borderBottom: `2px solid ${theme.palette.primary.main}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box display="flex" alignItems="center" gap={2}>
                <Receipt color="info" sx={{ fontSize: 24 }} />
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  Other Cost
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'info.main' }}>
                Tk {otherCost.toFixed(2)}
              </Typography>
            </Box>
            
            {/* Total Training Cost - Final Sum */}
            <Box
              sx={{
                p: 3,
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box display="flex" alignItems="center" gap={2}>
                <Calculate color="primary" sx={{ fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  Total Training Cost
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                Tk {totalTrainingCost.toFixed(2)}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}

export default CostBreakdownCard;

