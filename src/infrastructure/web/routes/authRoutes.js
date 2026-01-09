const express = require('express');
const validate = require('../middleware/validate');
const asyncHandler = require('../middleware/asyncHandler');
const { loginSchema } = require('../validation');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication endpoints
 */

function createAuthRoutes(authController) {
  const router = express.Router();

  // Note: User registration has been removed from public auth endpoints
  // User creation is now only available to superusers via /api/users endpoint

  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     summary: Login user
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: admin@example.com
   *               password:
   *                 type: string
   *                 format: password
   *                 example: senha123
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LoginSuccessResponse'
   *       401:
   *         description: Invalid credentials
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.post(
    '/login',
    validate({ body: loginSchema }),
    asyncHandler((req, res) => authController.login(req, res))
  );

  return router;
}

module.exports = createAuthRoutes;
