const express = require('express');
const { validate } = require('../middleware/validation');
const {
  registrationSchema,
  cancelRegistrationSchema,
  registrationIdSchema,
} = require('../validation/registrationSchemas');

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
  router.post('/', validate(registrationSchema, 'body'), (req, res) =>
    registrationController.register(req, res)
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
    validate(registrationIdSchema, 'params'),
    validate(cancelRegistrationSchema, 'body'),
    (req, res, next) => registrationController.cancel(req, res, next)
  );

  return router;
}

module.exports = createRegistrationRoutes;
