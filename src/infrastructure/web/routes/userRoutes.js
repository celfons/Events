const express = require('express');
const { isAuthenticated } = require('../middleware/authMiddleware');

function createUserRoutes(userController) {
  const router = express.Router();

  /**
   * @swagger
   * /api/users:
   *   get:
   *     summary: List all users
   *     tags: [Users]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *         description: Items per page
   *     responses:
   *       200:
   *         description: List of users
   *       401:
   *         description: Not authenticated
   */
  router.get('/', isAuthenticated, (req, res) => userController.list(req, res));

  /**
   * @swagger
   * /api/users/{id}:
   *   put:
   *     summary: Update user
   *     tags: [Users]
   *     security:
   *       - sessionAuth: []
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
   *               groups:
   *                 type: array
   *                 items:
   *                   type: string
   *               isActive:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: User updated
   *       404:
   *         description: User not found
   */
  router.put('/:id', isAuthenticated, (req, res) => userController.update(req, res));

  /**
   * @swagger
   * /api/users/{id}:
   *   delete:
   *     summary: Delete user
   *     tags: [Users]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: User deleted
   *       404:
   *         description: User not found
   */
  router.delete('/:id', isAuthenticated, (req, res) => userController.delete(req, res));

  return router;
}

module.exports = createUserRoutes;
