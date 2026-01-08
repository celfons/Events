const { z } = require('zod');
const { mongoIdSchema, emailSchema, passwordSchema, nonEmptyStringSchema } = require('./commonSchemas');

/**
 * User validation schemas
 */

// Schema for creating a new user
const createUserSchema = z.object({
  username: nonEmptyStringSchema.max(100, { message: 'Username must not exceed 100 characters' }),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(['user', 'superuser']).optional().default('user')
});

// Schema for updating a user (all fields optional)
const updateUserSchema = z
  .object({
    username: z.string().min(1).max(100).optional(),
    email: emailSchema.optional(),
    password: passwordSchema.optional(),
    role: z.enum(['user', 'superuser']).optional()
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update'
  });

// Schema for user ID parameter
const userIdParamSchema = z.object({
  id: mongoIdSchema
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema
};
