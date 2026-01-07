class RegistrationController {
  constructor(registerForEventUseCase, cancelRegistrationUseCase, verifyRegistrationUseCase) {
    this.registerForEventUseCase = registerForEventUseCase;
    this.cancelRegistrationUseCase = cancelRegistrationUseCase;
    this.verifyRegistrationUseCase = verifyRegistrationUseCase;
  }

  async register(req, res) {
    try {
      const result = await this.registerForEventUseCase.execute(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.status(201).json({ 
        data: result.data,
        message: result.message 
      });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async verify(req, res) {
    try {
      const { eventId, participantId, verificationCode } = req.body;
      
      if (!eventId || !participantId || !verificationCode) {
        return res.status(400).json({ 
          error: 'eventId, participantId, and verificationCode are required' 
        });
      }
      
      const result = await this.verifyRegistrationUseCase.execute(
        eventId, 
        participantId, 
        verificationCode
      );
      
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.status(200).json({ message: result.message });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async cancel(req, res) {
    try {
      const { id } = req.params;
      const { eventId } = req.body;
      
      if (!eventId) {
        return res.status(400).json({ error: 'eventId is required in request body' });
      }
      
      const result = await this.cancelRegistrationUseCase.execute(eventId, id);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.status(200).json({ message: result.message });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = RegistrationController;
