const { z } = require('zod');
const { emailSchema, passwordSchema } = require('./commonSchemas');

/**
 * Authentication validation schemas
 */

// Schema for login
const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema
});

module.exports = {
  loginSchema
};
