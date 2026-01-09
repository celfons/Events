const Registration = require('../Registration');

describe('Registration Entity', () => {
  describe('Constructor', () => {
    it('should create a registration with all properties', () => {
      const registrationData = {
        id: '456',
        eventId: '123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '(11) 98765-4321',
        registeredAt: new Date('2024-01-01'),
        status: 'confirmed'
      };

      const registration = new Registration(registrationData);

      expect(registration.id).toBe('456');
      expect(registration.eventId).toBe('123');
      expect(registration.name).toBe('John Doe');
      expect(registration.email).toBe('john@example.com');
      expect(registration.phone).toBe('(11) 98765-4321');
      expect(registration.registeredAt).toEqual(new Date('2024-01-01'));
      expect(registration.status).toBe('confirmed');
    });

    it('should set status to "pending" when not provided', () => {
      const registration = new Registration({
        eventId: '123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '(11) 98765-4321'
      });

      expect(registration.status).toBe('pending');
    });

    it('should set registeredAt to current date when not provided', () => {
      const beforeCreation = new Date();
      const registration = new Registration({
        eventId: '123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '(11) 98765-4321'
      });
      const afterCreation = new Date();

      expect(registration.registeredAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(registration.registeredAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });
  });

  describe('cancel', () => {
    it('should change status to "cancelled"', () => {
      const registration = new Registration({
        eventId: '123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '(11) 98765-4321',
        status: 'confirmed'
      });

      registration.cancel();

      expect(registration.status).toBe('cancelled');
    });

    it('should throw error when trying to cancel already cancelled registration', () => {
      const registration = new Registration({
        eventId: '123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '(11) 98765-4321',
        status: 'cancelled'
      });

      expect(() => registration.cancel()).toThrow('Registration is already cancelled');
    });
  });

  describe('isActive', () => {
    it('should return true when status is "confirmed"', () => {
      const registration = new Registration({
        eventId: '123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '(11) 98765-4321',
        status: 'confirmed'
      });

      expect(registration.isActive()).toBe(true);
    });

    it('should return true when status is "pending"', () => {
      const registration = new Registration({
        eventId: '123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '(11) 98765-4321',
        status: 'pending'
      });

      expect(registration.isActive()).toBe(true);
    });

    it('should return false when status is "cancelled"', () => {
      const registration = new Registration({
        eventId: '123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '(11) 98765-4321',
        status: 'cancelled'
      });

      expect(registration.isActive()).toBe(false);
    });
  });

  describe('isConfirmed', () => {
    it('should return true when status is "confirmed"', () => {
      const registration = new Registration({
        eventId: '123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '(11) 98765-4321',
        status: 'confirmed'
      });

      expect(registration.isConfirmed()).toBe(true);
    });

    it('should return false when status is "pending"', () => {
      const registration = new Registration({
        eventId: '123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '(11) 98765-4321',
        status: 'pending'
      });

      expect(registration.isConfirmed()).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should return registration data as plain object', () => {
      const registrationData = {
        id: '456',
        eventId: '123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '(11) 98765-4321',
        registeredAt: new Date('2024-01-01'),
        status: 'confirmed'
      };

      const registration = new Registration(registrationData);
      const json = registration.toJSON();

      expect(json).toEqual({
        id: '456',
        eventId: '123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '(11) 98765-4321',
        registeredAt: new Date('2024-01-01'),
        status: 'confirmed'
      });
    });
  });
});
