const { EventResponse, EventDetailsResponse } = require('../EventResponse');

describe('EventResponse', () => {
  describe('EventResponse DTO', () => {
    it('should create an EventResponse from an event entity', () => {
      const event = {
        id: '123',
        title: 'Test Event',
        description: 'Test Description',
        dateTime: new Date('2024-12-01T10:00:00Z'),
        totalSlots: 100,
        availableSlots: 50,
        local: 'Test Location',
        userId: 'user123',
        isActive: true,
        createdAt: new Date('2024-11-01T10:00:00Z'),
        eventCode: 'EVENT123'
      };

      const response = new EventResponse(event);

      expect(response.id).toBe('123');
      expect(response.title).toBe('Test Event');
      expect(response.description).toBe('Test Description');
      expect(response.totalSlots).toBe(100);
      expect(response.availableSlots).toBe(50);
      expect(response.local).toBe('Test Location');
      expect(response.userId).toBe('user123');
      expect(response.isActive).toBe(true);
      expect(response.eventCode).toBe('EVENT123');
    });

    it('should create multiple EventResponses from an array of events', () => {
      const events = [
        { id: '1', title: 'Event 1', availableSlots: 10, totalSlots: 50 },
        { id: '2', title: 'Event 2', availableSlots: 20, totalSlots: 100 }
      ];

      const responses = EventResponse.fromEntities(events);

      expect(responses).toHaveLength(2);
      expect(responses[0].id).toBe('1');
      expect(responses[1].id).toBe('2');
    });
  });

  describe('EventDetailsResponse DTO', () => {
    it('should use explicitly passed participantsCount', () => {
      const event = {
        id: '123',
        title: 'Test Event',
        availableSlots: 50,
        totalSlots: 100,
        participantsCount: 5,
        participants: [
          { id: '1', status: 'confirmed' },
          { id: '2', status: 'confirmed' },
          { id: '3', status: 'pending' }
        ]
      };

      const response = new EventDetailsResponse(event);

      expect(response.participantsCount).toBe(5);
    });

    it('should count only confirmed participants when participantsCount is not provided', () => {
      const event = {
        id: '123',
        title: 'Test Event',
        availableSlots: 47,
        totalSlots: 50,
        participants: [
          { id: '1', status: 'confirmed' },
          { id: '2', status: 'confirmed' },
          { id: '3', status: 'pending' },
          { id: '4', status: 'cancelled' }
        ]
      };

      const response = new EventDetailsResponse(event);

      // Should only count confirmed participants (2), not all (4)
      expect(response.participantsCount).toBe(2);
    });

    it('should return 0 when participants array is empty', () => {
      const event = {
        id: '123',
        title: 'Test Event',
        availableSlots: 100,
        totalSlots: 100,
        participants: []
      };

      const response = new EventDetailsResponse(event);

      expect(response.participantsCount).toBe(0);
    });

    it('should return 0 when participants is undefined', () => {
      const event = {
        id: '123',
        title: 'Test Event',
        availableSlots: 100,
        totalSlots: 100
      };

      const response = new EventDetailsResponse(event);

      expect(response.participantsCount).toBe(0);
    });

    it('should count only confirmed participants when all participants are confirmed', () => {
      const event = {
        id: '123',
        title: 'Test Event',
        availableSlots: 47,
        totalSlots: 50,
        participants: [
          { id: '1', status: 'confirmed' },
          { id: '2', status: 'confirmed' },
          { id: '3', status: 'confirmed' }
        ]
      };

      const response = new EventDetailsResponse(event);

      expect(response.participantsCount).toBe(3);
    });

    it('should return 0 when no participants are confirmed', () => {
      const event = {
        id: '123',
        title: 'Test Event',
        availableSlots: 50,
        totalSlots: 50,
        participants: [
          { id: '1', status: 'pending' },
          { id: '2', status: 'cancelled' },
          { id: '3', status: 'pending' }
        ]
      };

      const response = new EventDetailsResponse(event);

      expect(response.participantsCount).toBe(0);
    });
  });
});
