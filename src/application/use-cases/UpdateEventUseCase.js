class UpdateEventUseCase {
  constructor(eventRepository, registrationRepository) {
    this.eventRepository = eventRepository;
    this.registrationRepository = registrationRepository;
  }

  async execute(id, eventData) {
    try {
      // Validate input
      if (!id) {
        return {
          success: false,
          error: 'Event ID is required'
        };
      }

      // Check if event exists
      const existingEvent = await this.eventRepository.findById(id);
      if (!existingEvent) {
        return {
          success: false,
          error: 'Event not found'
        };
      }

      // Validate fields if provided
      if (eventData.title !== undefined && !eventData.title.trim()) {
        return {
          success: false,
          error: 'Title is required'
        };
      }

      if (eventData.description !== undefined && !eventData.description.trim()) {
        return {
          success: false,
          error: 'Description is required'
        };
      }

      if (eventData.dateTime !== undefined) {
        const eventDate = new Date(eventData.dateTime);
        if (isNaN(eventDate.getTime())) {
          return {
            success: false,
            error: 'Invalid date format'
          };
        }
      }

      if (eventData.totalSlots !== undefined && eventData.totalSlots < 1) {
        return {
          success: false,
          error: 'Total slots must be at least 1'
        };
      }

      // If updating totalSlots, validate against active participants and update availableSlots
      if (eventData.totalSlots !== undefined && eventData.totalSlots !== existingEvent.totalSlots) {
        // Get active participants count
        const activeParticipants = await this.registrationRepository.findByEventId(id);
        const activeParticipantsCount = activeParticipants.length;

        // Validate that new totalSlots is not less than active participants
        if (eventData.totalSlots < activeParticipantsCount) {
          return {
            success: false,
            error: `Cannot reduce total slots to ${eventData.totalSlots}. There are ${activeParticipantsCount} active participants. Please remove ${activeParticipantsCount - eventData.totalSlots} participant(s) first.`
          };
        }

        // Calculate new availableSlots proportionally
        const currentOccupiedSlots = existingEvent.totalSlots - existingEvent.availableSlots;
        const newAvailableSlots = eventData.totalSlots - currentOccupiedSlots;
        
        // Add availableSlots to the update data
        eventData.availableSlots = newAvailableSlots;
      }

      // Update only provided fields
      const updatedEvent = await this.eventRepository.update(id, eventData);

      return {
        success: true,
        data: updatedEvent.toJSON()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = UpdateEventUseCase;
