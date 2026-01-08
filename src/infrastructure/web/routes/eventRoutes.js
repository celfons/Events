const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createEventSchema, updateEventSchema, eventIdParamSchema } = require('../validation');

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
   *               $ref: '#/components/schemas/EventListResponse'
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
   * /api/events/my-events:
   *   get:
   *     summary: List events for the authenticated user
   *     tags: [Events]
   *     security:
   *       - bearerAuth: []
   *     description: Retrieve a list of events created by the authenticated user
   *     responses:
   *       200:
   *         description: List of user events retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/EventListResponse'
   *       401:
   *         description: Unauthorized - Authentication required
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
  router.get('/my-events', authenticateToken, (req, res) => eventController.listUserEvents(req, res));

  /**
   * @swagger
   * /api/events:
   *   post:
   *     summary: Create a new event
   *     tags: [Events]
   *     security:
   *       - bearerAuth: []
   *     description: Create a new event with the provided details (authentication required)
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
   *               $ref: '#/components/schemas/EventResponse'
   *       400:
   *         description: Bad request - Invalid input data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Unauthorized - Authentication required
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
  router.post('/', authenticateToken, validate({ body: createEventSchema }), (req, res) =>
    eventController.createEvent(req, res)
  );

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
   *               $ref: '#/components/schemas/RegistrationListResponse'
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
  router.get('/:id/participants', validate({ params: eventIdParamSchema }), (req, res) =>
    eventController.getEventParticipants(req, res)
  );

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
   *               $ref: '#/components/schemas/EventDetailsResponse'
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
  router.get('/:id', validate({ params: eventIdParamSchema }), (req, res) => eventController.getEventDetails(req, res));

  /**
   * @swagger
   * /api/events/{id}:
   *   put:
   *     summary: Update an event
   *     tags: [Events]
   *     security:
   *       - bearerAuth: []
   *     description: Update the details of an existing event (only owner can update)
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
   *               $ref: '#/components/schemas/EventResponse'
   *       400:
   *         description: Bad request - Invalid input data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Unauthorized - Authentication required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Forbidden - Not the event owner
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
  router.put('/:id', authenticateToken, validate({ params: eventIdParamSchema, body: updateEventSchema }), (req, res) =>
    eventController.updateEvent(req, res)
  );

  /**
   * @swagger
   * /api/events/{id}:
   *   delete:
   *     summary: Delete an event
   *     tags: [Events]
   *     security:
   *       - bearerAuth: []
   *     description: Remove an event from the system (only owner can delete)
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
   *       401:
   *         description: Unauthorized - Authentication required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Forbidden - Not the event owner
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
  router.delete('/:id', authenticateToken, validate({ params: eventIdParamSchema }), (req, res) =>
    eventController.deleteEvent(req, res)
  );

  return router;
}

module.exports = createEventRoutes;
