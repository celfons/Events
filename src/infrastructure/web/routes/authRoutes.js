const express = require('express');

function createAuthRoutes(authController) {
  const router = express.Router();

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
   *               - username
   *               - password
   *             properties:
   *               username:
   *                 type: string
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Login successful
   *       401:
   *         description: Invalid credentials
   */
  router.post('/login', (req, res) => authController.login(req, res));

  /**
   * @swagger
   * /api/auth/register:
   *   post:
   *     summary: Register new user
   *     tags: [Authentication]
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
   *               groups:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       201:
   *         description: User registered successfully
   *       400:
   *         description: Invalid input
   */
  router.post('/register', (req, res) => authController.register(req, res));

  /**
   * @swagger
   * /api/auth/logout:
   *   post:
   *     summary: Logout user
   *     tags: [Authentication]
   *     responses:
   *       200:
   *         description: Logout successful
   */
  router.post('/logout', (req, res) => authController.logout(req, res));

  /**
   * @swagger
   * /api/auth/me:
   *   get:
   *     summary: Get current user
   *     tags: [Authentication]
   *     responses:
   *       200:
   *         description: Current user data
   *       401:
   *         description: Not authenticated
   */
  router.get('/me', (req, res) => authController.getCurrentUser(req, res));

  return router;
}

module.exports = createAuthRoutes;
