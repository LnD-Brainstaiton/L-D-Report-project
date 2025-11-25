/**
 * Experience calculation utility functions
 */

type DateInput = Date | string | null | undefined;

/**
 * Calculate total experience in years from a start date
 */
export const calculateExperience = (startDate: DateInput): string | null => {
  if (!startDate) return null;

  try {
    const start = new Date(startDate);
    const today = new Date();

    // Check if date is valid
    if (isNaN(start.getTime())) return null;

    const diffTime = Math.abs(today.getTime() - start.getTime());
    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
    return diffYears.toFixed(1);
  } catch (error) {
    console.error('Error calculating experience:', error);
    return null;
  }
};

/**
 * Calculate total experience in years from career start date
 */
export const calculateTotalExperience = (careerStartDate: DateInput): string | null => {
  return calculateExperience(careerStartDate);
};

/**
 * Calculate BS experience in years from BS joining date
 */
export const calculateBSExperience = (bsJoiningDate: DateInput): string | null => {
  return calculateExperience(bsJoiningDate);
};

/**
 * Format experience for display (adds "years" suffix)
 */
export const formatExperience = (startDate: DateInput): string => {
  const experience = calculateExperience(startDate);
  return experience ? `${experience} years` : 'N/A';
};

/**
 * Get experience in months (for more precise calculations)
 */
export const calculateExperienceInMonths = (startDate: DateInput): number | null => {
  if (!startDate) return null;

  try {
    const start = new Date(startDate);
    const today = new Date();

    if (isNaN(start.getTime())) return null;

    const months =
      (today.getFullYear() - start.getFullYear()) * 12 +
      (today.getMonth() - start.getMonth());

    return months;
  } catch (error) {
    console.error('Error calculating experience in months:', error);
    return null;
  }
};

