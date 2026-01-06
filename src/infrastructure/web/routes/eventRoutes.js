const express = require('express');

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Event management endpoints
 */

function createEventRoutes(eventController) {
  const router = express.Router();

  /**
   * @swagger
   * /api/events:
   *   get:
   *     summary: List all events
   *     tags: [Events]
   *     description: Retrieve a list of all events in the system
   *     responses:
   *       200:
   *         description: List of events retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Event'
   *       400:
   *         description: Bad request
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
  router.get('/', (req, res) => eventController.listEvents(req, res));

  /**
   * @swagger
   * /api/events:
   *   post:
   *     summary: Create a new event
   *     tags: [Events]
   *     description: Create a new event with the provided details
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/EventInput'
   *     responses:
   *       201:
   *         description: Event created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Event'
   *       400:
   *         description: Bad request - Invalid input data
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
  router.post('/', (req, res) => eventController.createEvent(req, res));

  /**
   * @swagger
   * /api/events/{id}/participants:
   *   get:
   *     summary: Get event participants
   *     tags: [Events]
   *     description: Retrieve the list of participants registered for a specific event
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Event ID
   *     responses:
   *       200:
   *         description: List of participants retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Registration'
   *       404:
   *         description: Event not found
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
  router.get('/:id/participants', (req, res) => eventController.getEventParticipants(req, res));

  /**
   * @swagger
   * /api/events/{id}:
   *   get:
   *     summary: Get event details
   *     tags: [Events]
   *     description: Retrieve detailed information about a specific event
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Event ID
   *     responses:
   *       200:
   *         description: Event details retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Event'
   *       404:
   *         description: Event not found
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
  router.get('/:id', (req, res) => eventController.getEventDetails(req, res));

  /**
   * @swagger
   * /api/events/{id}:
   *   put:
   *     summary: Update an event
   *     tags: [Events]
   *     description: Update the details of an existing event
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Event ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/EventInput'
   *     responses:
   *       200:
   *         description: Event updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Event'
   *       400:
   *         description: Bad request - Invalid input data
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
  router.put('/:id', (req, res) => eventController.updateEvent(req, res));

  /**
   * @swagger
   * /api/events/{id}:
   *   delete:
   *     summary: Delete an event
   *     tags: [Events]
   *     description: Remove an event from the system
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Event ID
   *     responses:
   *       200:
   *         description: Event deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessMessage'
   *       400:
   *         description: Bad request
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
  router.delete('/:id', (req, res) => eventController.deleteEvent(req, res));

  return router;
}

module.exports = createEventRoutes;
