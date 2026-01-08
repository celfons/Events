const { z } = require('zod');

// Event validation schemas
const eventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title is too long'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description is too long'),
  dateTime: z.string().datetime('Invalid date format'),
  totalSlots: z.number().int().positive('Total slots must be positive'),
  local: z
    .string()
    .min(3, 'Location must be at least 3 characters')
    .max(500, 'Location is too long'),
  isActive: z.boolean().optional(),
});

const updateEventSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title is too long')
    .optional(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description is too long')
    .optional(),
  dateTime: z.string().datetime('Invalid date format').optional(),
  totalSlots: z.number().int().positive('Total slots must be positive').optional(),
  local: z
    .string()
    .min(3, 'Location must be at least 3 characters')
    .max(500, 'Location is too long')
    .optional(),
  isActive: z.boolean().optional(),
});

const eventIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid event ID format'),
});

module.exports = {
  eventSchema,
  updateEventSchema,
  eventIdSchema,
};
