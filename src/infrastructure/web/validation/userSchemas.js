const { z } = require('zod');

// User validation schemas
const updateUserSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long')
    .optional(),
  email: z.string().email('Invalid email format').optional(),
  role: z.enum(['user', 'admin', 'superadmin']).optional(),
});

const userIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),
});

module.exports = {
  updateUserSchema,
  userIdSchema,
};
