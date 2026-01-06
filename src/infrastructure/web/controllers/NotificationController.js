class NotificationController {
  constructor(sendEventRemindersUseCase) {
    this.sendEventRemindersUseCase = sendEventRemindersUseCase;
  }

  async sendEventReminders(req, res) {
    try {
      const { hoursAhead } = req.query;
      
      const params = {};
      if (hoursAhead) {
        params.hoursAhead = parseInt(hoursAhead, 10);
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
