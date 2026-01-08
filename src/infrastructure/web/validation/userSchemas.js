const { z } = require('zod');

// User validation schemas
const createUserSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username is too long'),
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password is too long'),
  role: z.enum(['user', 'superuser']).optional(),
});

const updateUserSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username is too long')
    .optional(),
  email: z.string().email('Invalid email format').optional(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password is too long')
    .optional(),
  role: z.enum(['user', 'superuser']).optional(),
});

const userIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  userIdSchema,
};
