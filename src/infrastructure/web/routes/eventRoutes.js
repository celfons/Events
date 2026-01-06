const express = require('express');

function createEventRoutes(eventController) {
  const router = express.Router();

  router.get('/', (req, res) => eventController.listEvents(req, res));
  router.get('/:id', (req, res) => eventController.getEventDetails(req, res));
  router.post('/', (req, res) => eventController.createEvent(req, res));
  router.put('/:id', (req, res) => eventController.updateEvent(req, res));
  router.delete('/:id', (req, res) => eventController.deleteEvent(req, res));
  router.get('/:id/participants', (req, res) => eventController.getEventParticipants(req, res));

  return router;
}

module.exports = createEventRoutes;
