const Event = require('../../domain/entities/Event');

/**
 * Generates a random 5-character alphanumeric code
 * @returns {string} 5-character uppercase alphanumeric code
 */
function generateEventCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

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

      // Generate a unique event code
      let eventCode;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isUnique && attempts < maxAttempts) {
        eventCode = generateEventCode();
        // Check if code already exists
        const existingEvent = await this.eventRepository.findByEventCode(eventCode);
        if (!existingEvent) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        return {
          success: false,
          error: 'Failed to generate unique event code. Please try again.'
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
        isActive: true,
        eventCode: eventCode
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
