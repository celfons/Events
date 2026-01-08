const express = require('express');
const validate = require('../middleware/validate');
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
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 token:
   *                   type: string
   *                 user:
   *                   type: object
   *       401:
   *         description: Invalid credentials
   */
  router.post('/login', validate({ body: loginSchema }), (req, res) => authController.login(req, res));

  return router;
}

module.exports = createAuthRoutes;
