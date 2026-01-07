const express = require('express');

/**
 * @swagger
 * tags:
 *   name: Registrations
 *   description: Event registration endpoints
 */

function createRegistrationRoutes(registrationController) {
  const router = express.Router();

  /**
   * @swagger
   * /api/registrations:
   *   post:
   *     summary: Register for an event
   *     tags: [Registrations]
   *     description: Create a new registration for a participant in an event
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RegistrationInput'
   *     responses:
   *       201:
   *         description: Registration created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Registration'
   *       400:
   *         description: Bad request - Invalid input data or no available slots
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
  router.post('/', (req, res) => registrationController.register(req, res));

  /**
   * @swagger
   * /api/registrations/verify:
   *   post:
   *     summary: Verify registration with code
   *     tags: [Registrations]
   *     description: Verify a pending registration using the code sent via WhatsApp
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - eventId
   *               - participantId
   *               - verificationCode
   *             properties:
   *               eventId:
   *                 type: string
   *                 description: Event ID
   *               participantId:
   *                 type: string
   *                 description: Participant ID
   *               verificationCode:
   *                 type: string
   *                 description: 6-digit verification code sent via WhatsApp
   *     responses:
   *       200:
   *         description: Registration verified successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessMessage'
   *       400:
   *         description: Bad request - Invalid or expired code
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
  router.post('/verify', (req, res) => registrationController.verify(req, res));

  /**
   * @swagger
   * /api/registrations/{id}/cancel:
   *   post:
   *     summary: Cancel a registration
   *     tags: [Registrations]
   *     description: Cancel an existing registration for an event
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Registration ID
   *     responses:
   *       200:
   *         description: Registration cancelled successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessMessage'
   *       400:
   *         description: Bad request - Registration not found or already cancelled
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
  router.post('/:id/cancel', (req, res) => registrationController.cancel(req, res));

  return router;
}

module.exports = createRegistrationRoutes;
