const Event = require('../Event');

describe('Event Entity', () => {
  describe('Constructor', () => {
    it('should create an event with all properties', () => {
      const eventData = {
        id: '123',
        title: 'Test Event',
        description: 'Test Description',
        dateTime: new Date('2024-12-31'),
        totalSlots: 50,
        availableSlots: 30,
        createdAt: new Date('2024-01-01')
      };

      const event = new Event(eventData);

      expect(event.id).toBe('123');
      expect(event.title).toBe('Test Event');
      expect(event.description).toBe('Test Description');
      expect(event.dateTime).toEqual(new Date('2024-12-31'));
      expect(event.totalSlots).toBe(50);
      expect(event.availableSlots).toBe(30);
      expect(event.createdAt).toEqual(new Date('2024-01-01'));
    });

    it('should create an event with local field', () => {
      const eventData = {
        id: '123',
        title: 'Test Event',
        description: 'Test Description',
        dateTime: new Date('2024-12-31'),
        totalSlots: 50,
        availableSlots: 30,
        createdAt: new Date('2024-01-01'),
        local: 'Main Conference Room'
      };

      const event = new Event(eventData);

      expect(event.id).toBe('123');
      expect(event.title).toBe('Test Event');
      expect(event.description).toBe('Test Description');
      expect(event.dateTime).toEqual(new Date('2024-12-31'));
      expect(event.totalSlots).toBe(50);
      expect(event.availableSlots).toBe(30);
      expect(event.createdAt).toEqual(new Date('2024-01-01'));
      expect(event.local).toBe('Main Conference Room');
    });

    it('should set availableSlots equal to totalSlots when not provided', () => {
      const eventData = {
        title: 'Test Event',
        description: 'Test Description',
        dateTime: new Date('2024-12-31'),
        totalSlots: 50
      };

      const event = new Event(eventData);

      expect(event.availableSlots).toBe(50);
    });

    it('should preserve availableSlots when explicitly set to 0', () => {
      const eventData = {
        title: 'Fully Booked Event',
        description: 'Test Description',
        dateTime: new Date('2024-12-31'),
        totalSlots: 50,
        availableSlots: 0
      };

      const event = new Event(eventData);

      expect(event.availableSlots).toBe(0);
      expect(event.totalSlots).toBe(50);
    });

    it('should set createdAt to current date when not provided', () => {
      const beforeCreation = new Date();
      const event = new Event({
        title: 'Test Event',
        description: 'Test Description',
        dateTime: new Date('2024-12-31'),
        totalSlots: 50
      });
      const afterCreation = new Date();

      expect(event.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(event.createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });
  });

  describe('hasAvailableSlots', () => {
    it('should return true when availableSlots is greater than 0', () => {
      const event = new Event({
        title: 'Test Event',
        description: 'Test Description',
        dateTime: new Date('2024-12-31'),
        totalSlots: 50,
        availableSlots: 10
      });

      expect(event.hasAvailableSlots()).toBe(true);
    });

    it('should return false when explicitly checking zero slots after decrement', () => {
      const event = new Event({
        title: 'Test Event',
        description: 'Test Description',
        dateTime: new Date('2024-12-31'),
        totalSlots: 1,
        availableSlots: 1
      });

      event.decrementSlots();

      expect(event.hasAvailableSlots()).toBe(false);
    });
  });

  describe('decrementSlots', () => {
    it('should decrease availableSlots by 1', () => {
      const event = new Event({
        title: 'Test Event',
        description: 'Test Description',
        dateTime: new Date('2024-12-31'),
        totalSlots: 50,
        availableSlots: 10
      });

      event.decrementSlots();

      expect(event.availableSlots).toBe(9);
    });

    it('should throw error when no available slots', () => {
      const event = new Event({
        title: 'Test Event',
        description: 'Test Description',
        dateTime: new Date('2024-12-31'),
        totalSlots: 1,
        availableSlots: 1
      });

      // First decrement to reach 0
      event.decrementSlots();
      expect(event.availableSlots).toBe(0);

      // Second decrement should throw
      expect(() => event.decrementSlots()).toThrow('No available slots for this event');
    });
  });

  describe('incrementSlots', () => {
    it('should increase availableSlots by 1', () => {
      const event = new Event({
        title: 'Test Event',
        description: 'Test Description',
        dateTime: new Date('2024-12-31'),
        totalSlots: 50,
        availableSlots: 30
      });

      event.incrementSlots();

      expect(event.availableSlots).toBe(31);
    });

    it('should not increment when already at total slots capacity', () => {
      const event = new Event({
        title: 'Test Event',
        description: 'Test Description',
        dateTime: new Date('2024-12-31'),
        totalSlots: 50,
        availableSlots: 50
      });

      event.incrementSlots();
      
      // Should remain at 50, not increment to 51
      expect(event.availableSlots).toBe(50);
    });

    it('should handle data inconsistency gracefully - when availableSlots equals totalSlots', () => {
      // Simulates the bug scenario: event shows full capacity but has active registrations
      const event = new Event({
        title: 'Test Event',
        description: 'Test Description',
        dateTime: new Date('2024-12-31'),
        totalSlots: 10,
        availableSlots: 10 // Data inconsistency: should be less if registrations exist
      });

      // This scenario happens when canceling a registration with data inconsistency
      // Should not throw error - silently skip increment
      expect(() => event.incrementSlots()).not.toThrow();
      expect(event.availableSlots).toBe(10);
    });
  });

  describe('toJSON', () => {
    it('should return event data as plain object', () => {
      const eventData = {
        id: '123',
        title: 'Test Event',
        description: 'Test Description',
        dateTime: new Date('2024-12-31'),
        totalSlots: 50,
        availableSlots: 30,
        createdAt: new Date('2024-01-01')
      };

      const event = new Event(eventData);
      const json = event.toJSON();

      expect(json).toEqual({
        id: '123',
        title: 'Test Event',
        description: 'Test Description',
        dateTime: new Date('2024-12-31'),
        totalSlots: 50,
        availableSlots: 30,
        participants: [],
        createdAt: new Date('2024-01-01')
      });
    });

    it('should return event data with local field', () => {
      const eventData = {
        id: '123',
        title: 'Test Event',
        description: 'Test Description',
        dateTime: new Date('2024-12-31'),
        totalSlots: 50,
        availableSlots: 30,
        createdAt: new Date('2024-01-01'),
        local: 'Conference Hall A'
      };

      const event = new Event(eventData);
      const json = event.toJSON();

      expect(json).toEqual({
        id: '123',
        title: 'Test Event',
        description: 'Test Description',
        dateTime: new Date('2024-12-31'),
        totalSlots: 50,
        availableSlots: 30,
        participants: [],
        createdAt: new Date('2024-01-01'),
        local: 'Conference Hall A'
      });
    });
  });
});
