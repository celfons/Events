const logger = require('../../infrastructure/logging/logger');
const { getConfirmedParticipants, sendNotificationsWithErrorHandling } = require('./helpers/notificationHelper');

class UpdateEventUseCase {
  constructor(eventRepository, messagingService = null) {
    this.eventRepository = eventRepository;
    this.messagingService = messagingService;
  }

  async execute(id, eventData, userId = null) {
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

      // Check ownership if userId is provided
      if (userId && existingEvent.userId && existingEvent.userId !== userId) {
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
          error:
            'Cannot manually set availableSlots when updating totalSlots. availableSlots will be calculated automatically.'
        };
      }

      // Prepare update data (avoid mutating input parameter)
      const updateData = { ...eventData };

      // If updating totalSlots, validate against confirmed participants and update availableSlots
      if (updateData.totalSlots !== undefined && updateData.totalSlots !== existingEvent.totalSlots) {
        // Get confirmed participants count from embedded participants
        const activeParticipantsCount = existingEvent.participants.filter(p => p.status === 'confirmed').length;

        // Validate that new totalSlots is not less than active participants
        if (updateData.totalSlots < activeParticipantsCount) {
          const participantsToRemove = activeParticipantsCount - updateData.totalSlots;
          const errorMsg =
            `Cannot reduce total slots to ${updateData.totalSlots}. ` +
            `There are ${activeParticipantsCount} active participants. ` +
            `Please remove ${participantsToRemove} participant(s) first.`;
          return {
            success: false,
            error: errorMsg
          };
        }

        // Calculate new availableSlots based on active participants
        // Using activeParticipantsCount ensures consistency with actual registrations
        const newAvailableSlots = updateData.totalSlots - activeParticipantsCount;

        // Add availableSlots to the update data
        updateData.availableSlots = newAvailableSlots;
      }

      // Track if date or location changed for notifications
      const dateChanged =
        updateData.dateTime !== undefined &&
        new Date(updateData.dateTime).getTime() !== new Date(existingEvent.dateTime).getTime();
      const locationChanged = updateData.local !== undefined && updateData.local !== existingEvent.local;

      // Update only provided fields
      const updatedEvent = await this.eventRepository.update(id, updateData);

      // Send WhatsApp notifications to confirmed participants if date or location changed
      if (this.messagingService && (dateChanged || locationChanged)) {
        const confirmedParticipants = getConfirmedParticipants(existingEvent);

        await sendNotificationsWithErrorHandling(
          confirmedParticipants,
          participant =>
            this.messagingService.sendEventUpdate({
              to: participant.phone,
              name: participant.name,
              eventTitle: existingEvent.title,
              newDate: dateChanged ? updateData.dateTime : null,
              newLocal: locationChanged ? updateData.local : null
            }),
          { eventId: id, action: 'event update' }
        );
      }

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
