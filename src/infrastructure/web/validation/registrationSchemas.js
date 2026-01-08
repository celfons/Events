const { z } = require('zod');
const { mongoIdSchema, emailSchema, phoneSchema, nonEmptyStringSchema } = require('./commonSchemas');

/**
 * Registration validation schemas
 */

// Schema for creating a new registration
const createRegistrationSchema = z.object({
  eventId: mongoIdSchema,
  name: nonEmptyStringSchema.max(200, { message: 'Name must not exceed 200 characters' }),
  email: emailSchema,
  phone: phoneSchema
});

// Schema for canceling a registration
const cancelRegistrationSchema = z.object({
  eventId: mongoIdSchema
});

// Schema for registration ID parameter
const registrationIdParamSchema = z.object({
  id: mongoIdSchema
});

module.exports = {
  createRegistrationSchema,
  cancelRegistrationSchema,
  registrationIdParamSchema
};
