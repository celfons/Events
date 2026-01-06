class EventController {
  constructor(listEventsUseCase, getEventDetailsUseCase, createEventUseCase, updateEventUseCase, deleteEventUseCase, getEventParticipantsUseCase, listMyEventsUseCase) {
    this.listEventsUseCase = listEventsUseCase;
    this.getEventDetailsUseCase = getEventDetailsUseCase;
    this.createEventUseCase = createEventUseCase;
    this.updateEventUseCase = updateEventUseCase;
    this.deleteEventUseCase = deleteEventUseCase;
    this.getEventParticipantsUseCase = getEventParticipantsUseCase;
    this.listMyEventsUseCase = listMyEventsUseCase;
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

  async listMyEvents(req, res) {
    try {
      const userId = req.session.userId;
      const result = await this.listMyEventsUseCase.execute(userId);
      
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
      const userId = req.session.userId;
      const result = await this.createEventUseCase.execute(req.body, userId);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.status(201).json(result.data);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateEvent(req, res) {
    try {
      const { id } = req.params;
      const userId = req.session.userId;
      const result = await this.updateEventUseCase.execute(id, req.body, userId);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.status(200).json(result.data);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteEvent(req, res) {
    try {
      const { id } = req.params;
      const userId = req.session.userId;
      const result = await this.deleteEventUseCase.execute(id, userId);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.status(200).json(result.data);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getEventParticipants(req, res) {
    try {
      const { id } = req.params;
      const result = await this.getEventParticipantsUseCase.execute(id);
      
      if (!result.success) {
        return res.status(404).json({ error: result.error });
      }

      return res.status(200).json(result.data);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = EventController;
