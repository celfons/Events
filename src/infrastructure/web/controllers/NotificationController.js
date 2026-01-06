class NotificationController {
  constructor(sendEventRemindersUseCase) {
    this.sendEventRemindersUseCase = sendEventRemindersUseCase;
  }

  async sendEventReminders(req, res) {
    try {
      const { hoursAhead } = req.query;
      
      const params = {};
      if (hoursAhead) {
        const parsedHours = parseInt(hoursAhead, 10);
        if (isNaN(parsedHours) || parsedHours < 0) {
          return res.status(400).json({ 
            error: 'Invalid hoursAhead parameter. Must be a positive number.' 
          });
        }
        params.hoursAhead = parsedHours;
      }

      const result = await this.sendEventRemindersUseCase.execute(params);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in sendEventReminders:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = NotificationController;
