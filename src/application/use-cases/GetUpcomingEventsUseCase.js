class GetUpcomingEventsUseCase {
  constructor(eventRepository) {
    this.eventRepository = eventRepository;
  }

  async execute() {
    try {
      // Get current time
      const now = new Date();
      
      // Get time one hour from now
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

      // Find all events
      const allEvents = await this.eventRepository.findAll();

      // Filter events that will occur in the next hour
      const upcomingEvents = allEvents.filter(event => {
        const eventDate = new Date(event.dateTime);
        return eventDate >= now && eventDate <= oneHourLater && event.isActive;
      });

      // Return events with all their participants
      const eventsWithParticipants = upcomingEvents.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        dateTime: event.dateTime,
        local: event.local,
        participants: event.participants
      }));

      return {
        success: true,
        data: eventsWithParticipants
      };
    } catch (error) {
      console.error('Error getting upcoming events:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = GetUpcomingEventsUseCase;
