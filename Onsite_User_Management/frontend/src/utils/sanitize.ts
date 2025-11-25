import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param dirty - The potentially unsafe HTML string
 * @returns Sanitized HTML string safe for rendering
 */
export const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
};

/**
 * Sanitize plain text by stripping all HTML tags
 * @param dirty - The potentially unsafe string
 * @returns Plain text with all HTML removed
 */
export const sanitizeText = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
};

/**
 * Sanitize user input for display
 * Use this for user-generated content like names, comments, etc.
 * @param input - The user input string
 * @returns Sanitized string
 */
export const sanitizeUserInput = (input: string | null | undefined): string => {
  if (!input) return '';
  return sanitizeText(input);
};

/**
 * Create a safe HTML string for dangerouslySetInnerHTML
 * Only use when you need to render HTML content
 * @param html - The HTML string to sanitize
 * @returns Object with __html property for React
 */
export const createSafeHtml = (html: string): { __html: string } => {
  return {
    __html: sanitizeHtml(html),
  };
};

