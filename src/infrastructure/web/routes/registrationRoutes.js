const express = require('express');

function createRegistrationRoutes(registrationController) {
  const router = express.Router();

  router.post('/', (req, res) => registrationController.register(req, res));
  router.post('/:id/cancel', (req, res) => registrationController.cancel(req, res));

  return router;
}

module.exports = createRegistrationRoutes;
