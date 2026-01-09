const express = require('express');
const validate = require('../middleware/validate');
const asyncHandler = require('../middleware/asyncHandler');
const { optionalAuth } = require('../middleware/auth');
const { createRegistrationSchema, cancelRegistrationSchema, registrationIdParamSchema } = require('../validation');

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
   *               $ref: '#/components/schemas/RegistrationResponse'
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
  router.post(
    '/',
    optionalAuth,
    validate({ body: createRegistrationSchema }),
    asyncHandler((req, res) => registrationController.register(req, res))
  );

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
  router.post(
    '/:id/cancel',
    validate({ params: registrationIdParamSchema, body: cancelRegistrationSchema }),
    asyncHandler((req, res) => registrationController.cancel(req, res))
  );

  /**
   * @swagger
   * /api/registrations/{id}/confirm:
   *   post:
   *     summary: Confirm a registration with verification code
   *     tags: [Registrations]
   *     description: Confirm a pending registration by validating the verification code
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Participant ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - eventId
   *               - verificationCode
   *             properties:
   *               eventId:
   *                 type: string
   *               verificationCode:
   *                 type: string
   *     responses:
   *       200:
   *         description: Registration confirmed successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessMessage'
   *       400:
   *         description: Bad request - Invalid code or registration not found
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
    '/:id/confirm',
    asyncHandler((req, res) => registrationController.confirm(req, res))
  );

  return router;
}

module.exports = createRegistrationRoutes;
