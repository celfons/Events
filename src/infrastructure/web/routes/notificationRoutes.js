const express = require('express');

function createNotificationRoutes(notificationController) {
  const router = express.Router();

  router.post('/send-event-reminders', (req, res) => 
    notificationController.sendEventReminders(req, res)
  );

  return router;
}

module.exports = createNotificationRoutes;
