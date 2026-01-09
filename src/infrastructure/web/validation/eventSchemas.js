const { z } = require('zod');
const { mongoIdSchema, dateTimeSchema, nonEmptyStringSchema } = require('./commonSchemas');

/**
 * Event validation schemas
 */

// Schema for creating a new event
const createEventSchema = z.object({
  title: nonEmptyStringSchema.max(200, { message: 'Title must not exceed 200 characters' }),
  description: nonEmptyStringSchema,
  dateTime: dateTimeSchema,
  totalSlots: z.number().int().positive({ message: 'Total slots must be a positive integer' }),
  local: z.string().min(1).max(500, { message: 'Location must not exceed 500 characters' }).optional()
});

// Schema for updating an event (all fields optional)
const updateEventSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().min(1).optional(),
    dateTime: dateTimeSchema.optional(),
    totalSlots: z.number().int().positive().optional(),
    local: z.string().min(1).max(500).optional(),
    isActive: z.boolean().optional()
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update'
  });

// Schema for event ID parameter
const eventIdParamSchema = z.object({
  id: mongoIdSchema
});

module.exports = {
  createEventSchema,
  updateEventSchema,
  eventIdParamSchema
};
