class DeleteEventUseCase {
  constructor(eventRepository) {
    this.eventRepository = eventRepository;
  }

  async execute(id, userId = null) {
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
          error: 'You do not have permission to delete this event'
        };
      }

      // Delete the event
      await this.eventRepository.delete(id);

      return {
        success: true,
        data: { message: 'Event deleted successfully' }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = DeleteEventUseCase;
