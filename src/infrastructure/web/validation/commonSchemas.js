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

// Date/Time validation - accepts ISO 8601 strings or Date objects
const dateTimeSchema = z.union([
  z.string().datetime({ message: 'Invalid datetime format. Use ISO 8601 format.' }),
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
