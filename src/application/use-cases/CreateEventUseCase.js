const Event = require('../../domain/entities/Event');

class CreateEventUseCase {
  constructor(eventRepository) {
    this.eventRepository = eventRepository;
  }

  async execute(eventData, userId = null) {
    try {
      // Validate input data
      if (!eventData.title || !eventData.description || !eventData.dateTime || !eventData.totalSlots) {
        return {
          success: false,
          error: 'Missing required fields: title, description, dateTime, totalSlots'
        };
      }

      if (eventData.totalSlots < 1) {
        return {
          success: false,
          error: 'Total slots must be at least 1'
        };
      }

      const event = new Event({
        title: eventData.title,
        description: eventData.description,
        dateTime: new Date(eventData.dateTime),
        totalSlots: parseInt(eventData.totalSlots),
        availableSlots: parseInt(eventData.totalSlots),
        userId: userId,
        local: eventData.local,
        isActive: true
      });

      const createdEvent = await this.eventRepository.create(event);

      return {
        success: true,
        data: createdEvent.toJSON()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = CreateEventUseCase;
