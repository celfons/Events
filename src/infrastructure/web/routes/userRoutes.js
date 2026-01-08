const express = require('express');
const { authenticateToken, requireSuperuser } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { createUserSchema, updateUserSchema, userIdSchema } = require('../validation/userSchemas');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints (superuser only)
 */

function createUserRoutes(userController) {
  const router = express.Router();

  // All user management routes require authentication and superuser role
  router.use(authenticateToken);
  router.use(requireSuperuser);

  /**
   * @swagger
   * /api/users:
   *   get:
   *     summary: List all users
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of users
   *       401:
   *         description: Not authenticated
   *       403:
   *         description: Not authorized (superuser only)
   */
  router.get('/', (req, res, next) => userController.listUsers(req, res, next));

  /**
   * @swagger
   * /api/users:
   *   post:
   *     summary: Create a new user (superuser only)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - username
   *               - email
   *               - password
   *             properties:
   *               username:
   *                 type: string
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *               role:
   *                 type: string
   *                 enum: [user, superuser]
   *     responses:
   *       201:
   *         description: User created successfully
   *       400:
   *         description: Bad request - validation error
   *       401:
   *         description: Not authenticated
   *       403:
   *         description: Not authorized (superuser only)
   */
  router.post('/', validate(createUserSchema, 'body'), (req, res, next) =>
    userController.createUser(req, res, next)
  );

  /**
   * @swagger
   * /api/users/{id}:
   *   put:
   *     summary: Update a user
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               username:
   *                 type: string
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *                 description: Optional new password (minimum 6 characters)
   *               role:
   *                 type: string
   *                 enum: [user, superuser]
   *     responses:
   *       200:
   *         description: User updated successfully
   *       401:
   *         description: Not authenticated
   *       403:
   *         description: Not authorized (superuser only)
   */
  router.put(
    '/:id',
    validate(userIdSchema, 'params'),
    validate(updateUserSchema, 'body'),
    (req, res, next) => userController.updateUser(req, res, next)
  );

  /**
   * @swagger
   * /api/users/{id}:
   *   delete:
   *     summary: Delete a user
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: User deleted successfully
   *       401:
   *         description: Not authenticated
   *       403:
   *         description: Not authorized (superuser only)
   */
  router.delete('/:id', validate(userIdSchema, 'params'), (req, res, next) =>
    userController.deleteUser(req, res, next)
  );

  return router;
}

module.exports = createUserRoutes;
