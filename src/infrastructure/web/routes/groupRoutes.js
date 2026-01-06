const express = require('express');
const { isAuthenticated } = require('../middleware/authMiddleware');

function createGroupRoutes(groupController) {
  const router = express.Router();

  /**
   * @swagger
   * /api/groups:
   *   get:
   *     summary: List all groups
   *     tags: [Groups]
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
   *         description: List of groups
   *       401:
   *         description: Not authenticated
   */
  router.get('/', isAuthenticated, (req, res) => groupController.list(req, res));

  /**
   * @swagger
   * /api/groups:
   *   post:
   *     summary: Create new group
   *     tags: [Groups]
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *             properties:
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *               permissions:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       201:
   *         description: Group created
   *       400:
   *         description: Invalid input
   */
  router.post('/', isAuthenticated, (req, res) => groupController.create(req, res));

  /**
   * @swagger
   * /api/groups/{id}:
   *   put:
   *     summary: Update group
   *     tags: [Groups]
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
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *               permissions:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       200:
   *         description: Group updated
   *       404:
   *         description: Group not found
   */
  router.put('/:id', isAuthenticated, (req, res) => groupController.update(req, res));

  /**
   * @swagger
   * /api/groups/{id}:
   *   delete:
   *     summary: Delete group
   *     tags: [Groups]
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
   *         description: Group deleted
   *       404:
   *         description: Group not found
   */
  router.delete('/:id', isAuthenticated, (req, res) => groupController.delete(req, res));

  return router;
}

module.exports = createGroupRoutes;
