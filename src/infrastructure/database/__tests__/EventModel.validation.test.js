const EventModel = require('../EventModel');

describe('EventModel - availableSlots Validation', () => {
  describe('Document creation validation', () => {
    it('should allow creation when availableSlots <= totalSlots', () => {
      const event = new EventModel({
        title: 'Test Event',
        description: 'Test Description',
        dateTime: new Date(),
        totalSlots: 50,
        availableSlots: 45,
        eventCode: 'ABC12'
      });

      const validationError = event.validateSync();
      expect(validationError).toBeUndefined();
    });

    it('should allow creation when availableSlots equals totalSlots', () => {
      const event = new EventModel({
        title: 'Test Event',
        description: 'Test Description',
        dateTime: new Date(),
        totalSlots: 50,
        availableSlots: 50,
        eventCode: 'XYZ99'
      });

      const validationError = event.validateSync();
      expect(validationError).toBeUndefined();
    });

    it('should reject creation when availableSlots > totalSlots', () => {
      const event = new EventModel({
        title: 'Test Event',
        description: 'Test Description',
        dateTime: new Date(),
        totalSlots: 50,
        availableSlots: 55
      });

      const validationError = event.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.availableSlots).toBeDefined();
      expect(validationError.errors.availableSlots.message).toBe('Available slots cannot exceed total slots');
    });
  });

  describe('Update validation with mock Query', () => {
    it('should validate correctly when both totalSlots and availableSlots are updated together', () => {
      // Simulate the validator being called in Query context
      const mockQuery = {
        constructor: { name: 'Query' },
        getUpdate: jest.fn().mockReturnValue({
          totalSlots: 100,
          availableSlots: 98
        })
      };

      // Get the validator function
      const availableSlotsPath = EventModel.schema.path('availableSlots');
      const validator = availableSlotsPath.validators.find(
        v => v.message === 'Available slots cannot exceed total slots'
      );

      // Call validator in Query context
      const result = validator.validator.call(mockQuery, 98);
      expect(result).toBe(true);
    });

    it('should validate correctly when increasing totalSlots', () => {
      // This is the main bug scenario: increasing totalSlots from 50 to 100
      const mockQuery = {
        constructor: { name: 'Query' },
        getUpdate: jest.fn().mockReturnValue({
          totalSlots: 100,
          availableSlots: 95
        })
      };

      const availableSlotsPath = EventModel.schema.path('availableSlots');
      const validator = availableSlotsPath.validators.find(
        v => v.message === 'Available slots cannot exceed total slots'
      );

      const result = validator.validator.call(mockQuery, 95);
      expect(result).toBe(true);
    });

    it('should reject when availableSlots exceeds new totalSlots in update', () => {
      const mockQuery = {
        constructor: { name: 'Query' },
        getUpdate: jest.fn().mockReturnValue({
          totalSlots: 50,
          availableSlots: 60
        })
      };

      const availableSlotsPath = EventModel.schema.path('availableSlots');
      const validator = availableSlotsPath.validators.find(
        v => v.message === 'Available slots cannot exceed total slots'
      );

      const result = validator.validator.call(mockQuery, 60);
      expect(result).toBe(false);
    });

    it('should skip validation when only availableSlots is updated (no totalSlots)', () => {
      // When only updating availableSlots without totalSlots, we can't validate
      // in the Query context, so we skip validation
      const mockQuery = {
        constructor: { name: 'Query' },
        getUpdate: jest.fn().mockReturnValue({
          availableSlots: 45
        })
      };

      const availableSlotsPath = EventModel.schema.path('availableSlots');
      const validator = availableSlotsPath.validators.find(
        v => v.message === 'Available slots cannot exceed total slots'
      );

      const result = validator.validator.call(mockQuery, 45);
      expect(result).toBe(true); // Should return true to skip validation
    });

    it('should handle $set updates correctly', () => {
      // Mongoose might use $set in the update object
      const mockQuery = {
        constructor: { name: 'Query' },
        getUpdate: jest.fn().mockReturnValue({
          $set: {
            totalSlots: 100,
            availableSlots: 98
          }
        })
      };

      const availableSlotsPath = EventModel.schema.path('availableSlots');
      const validator = availableSlotsPath.validators.find(
        v => v.message === 'Available slots cannot exceed total slots'
      );

      const result = validator.validator.call(mockQuery, 98);
      expect(result).toBe(true);
    });
  });

  describe('Document context validation', () => {
    it('should validate correctly on document instance', () => {
      const event = new EventModel({
        title: 'Test Event',
        description: 'Test Description',
        dateTime: new Date(),
        totalSlots: 50,
        availableSlots: 45
      });

      // Manually test the validator on the document
      const availableSlotsPath = EventModel.schema.path('availableSlots');
      const validator = availableSlotsPath.validators.find(
        v => v.message === 'Available slots cannot exceed total slots'
      );

      const result = validator.validator.call(event, 45);
      expect(result).toBe(true);
    });

    it('should reject when availableSlots > totalSlots on document', () => {
      const event = new EventModel({
        title: 'Test Event',
        description: 'Test Description',
        dateTime: new Date(),
        totalSlots: 50,
        availableSlots: 50
      });

      const availableSlotsPath = EventModel.schema.path('availableSlots');
      const validator = availableSlotsPath.validators.find(
        v => v.message === 'Available slots cannot exceed total slots'
      );

      const result = validator.validator.call(event, 55);
      expect(result).toBe(false);
    });
  });
});
