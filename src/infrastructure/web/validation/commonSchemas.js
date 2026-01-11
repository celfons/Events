const { z } = require('zod');

/**
 * Common validation schemas used across different endpoints
 */

// MongoDB ObjectId validation (24 character hex string)
const mongoIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, {
  message: 'Invalid ID format'
});

// Email validation
const emailSchema = z.string().email({ message: 'Invalid email format' });

// Regex pattern for datetime-local format (YYYY-MM-DDTHH:mm)
const DATETIME_LOCAL_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

// Date/Time validation - accepts ISO 8601 strings, datetime-local format, or Date objects
// Note: datetime-local format (YYYY-MM-DDTHH:mm) is converted to ISO 8601 with UTC timezone
// This means the input time is treated as UTC, not local time. Frontend should handle timezone
// conversion if needed before sending to the API.
const dateTimeSchema = z.union([
  z.string().datetime({ message: 'Invalid datetime format. Use ISO 8601 format.' }),
  z
    .string()
    .regex(DATETIME_LOCAL_PATTERN, {
      message: 'Invalid datetime format. Use ISO 8601 or datetime-local format.'
    })
    .transform(str => {
      // Convert datetime-local format to ISO 8601 with seconds and timezone
      // This assumes the datetime-local string represents a time that should be treated as UTC
      return `${str}:00.000Z`;
    }),
  z.date()
]);

// Phone validation - flexible format
const phoneSchema = z.string().min(10, { message: 'Phone number must have at least 10 digits' });

// Password validation
const passwordSchema = z.string().min(6, { message: 'Password must be at least 6 characters' });

// Non-empty string validation
const nonEmptyStringSchema = z.string().min(1, { message: 'This field cannot be empty' });

module.exports = {
  mongoIdSchema,
  emailSchema,
  dateTimeSchema,
  phoneSchema,
  passwordSchema,
  nonEmptyStringSchema
};
