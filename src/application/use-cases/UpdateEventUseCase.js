class UpdateEventUseCase {
  constructor(eventRepository, registrationRepository) {
    this.eventRepository = eventRepository;
    this.registrationRepository = registrationRepository;
  }

  async execute(id, eventData, userId) {
    try {
      // Validate input
      if (!id) {
        return {
          success: false,
          error: 'Event ID is required'
        };
      }

      if (!userId) {
        return {
          success: false,
          error: 'User ID is required'
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

      // Check ownership
      if (existingEvent.createdBy !== userId) {
        return {
          success: false,
          error: 'You do not have permission to update this event'
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

      // Prevent manual availableSlots update when totalSlots is being updated
      if (eventData.totalSlots !== undefined && eventData.availableSlots !== undefined) {
        return {
          success: false,
          error: 'Cannot manually set availableSlots when updating totalSlots. availableSlots will be calculated automatically.'
        };
      }

      // Prepare update data (avoid mutating input parameter)
      const updateData = { ...eventData };

      // If updating totalSlots, validate against active participants and update availableSlots
      if (updateData.totalSlots !== undefined && updateData.totalSlots !== existingEvent.totalSlots) {
        // Get active participants count
        const activeParticipants = await this.registrationRepository.findByEventId(id);
        const activeParticipantsCount = activeParticipants.length;

        // Validate that new totalSlots is not less than active participants
        if (updateData.totalSlots < activeParticipantsCount) {
          return {
            success: false,
            error: `Cannot reduce total slots to ${updateData.totalSlots}. There are ${activeParticipantsCount} active participants. Please remove ${activeParticipantsCount - updateData.totalSlots} participant(s) first.`
          };
        }

        // Calculate new availableSlots based on active participants
        // Using activeParticipantsCount ensures consistency with actual registrations
        const newAvailableSlots = updateData.totalSlots - activeParticipantsCount;

        // Add availableSlots to the update data
        updateData.availableSlots = newAvailableSlots;
      }

      // Update only provided fields
      const updatedEvent = await this.eventRepository.update(id, updateData);

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
