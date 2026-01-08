const { z } = require('zod');

// Registration validation schemas
const registrationSchema = z.object({
  eventId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid event ID format'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  email: z.string().email('Invalid email format'),
  // More flexible phone validation - accepts various formats with optional country code
  phone: z
    .string()
    .min(8, 'Phone number is too short')
    .max(20, 'Phone number is too long')
    .regex(
      /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
      'Invalid phone format'
    ),
});

const cancelRegistrationSchema = z.object({
  eventId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid event ID format'),
});

const registrationIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid registration ID format'),
});

module.exports = {
  registrationSchema,
  cancelRegistrationSchema,
  registrationIdSchema,
};
