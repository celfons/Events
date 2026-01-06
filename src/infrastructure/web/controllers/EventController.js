class EventController {
  constructor(listEventsUseCase, getEventDetailsUseCase, createEventUseCase) {
    this.listEventsUseCase = listEventsUseCase;
    this.getEventDetailsUseCase = getEventDetailsUseCase;
    this.createEventUseCase = createEventUseCase;
  }

  async listEvents(req, res) {
    try {
      const result = await this.listEventsUseCase.execute();
      
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.status(200).json(result.data);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getEventDetails(req, res) {
    try {
      const { id } = req.params;
      const result = await this.getEventDetailsUseCase.execute(id);
      
      if (!result.success) {
        return res.status(404).json({ error: result.error });
      }

      return res.status(200).json(result.data);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createEvent(req, res) {
    try {
      const result = await this.createEventUseCase.execute(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.status(201).json(result.data);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = EventController;
