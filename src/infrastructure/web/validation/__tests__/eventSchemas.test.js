const { createEventSchema, updateEventSchema, eventIdParamSchema } = require('../eventSchemas');

describe('Event Validation Schemas', () => {
  describe('createEventSchema', () => {
    it('should validate a valid event creation request', () => {
      const validData = {
        title: 'Tech Conference 2024',
        description: 'Annual technology conference',
        dateTime: new Date('2024-12-31T10:00:00Z'),
        totalSlots: 100,
        local: 'Convention Center'
      };

      const result = createEventSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate with ISO 8601 datetime string', () => {
      const validData = {
        title: 'Tech Conference 2024',
        description: 'Annual technology conference',
        dateTime: '2024-12-31T10:00:00Z',
        totalSlots: 100,
        local: 'Convention Center'
      };

      const result = createEventSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail validation with missing required fields', () => {
      const invalidData = {
        title: 'Tech Conference 2024',
        description: 'Annual technology conference'
        // missing dateTime, totalSlots, local
      };

      const result = createEventSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error.issues.length).toBeGreaterThan(0);
    });

    it('should fail validation with empty title', () => {
      const invalidData = {
        title: '',
        description: 'Annual technology conference',
        dateTime: '2024-12-31T10:00:00Z',
        totalSlots: 100,
        local: 'Convention Center'
      };

      const result = createEventSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should fail validation with negative totalSlots', () => {
      const invalidData = {
        title: 'Tech Conference 2024',
        description: 'Annual technology conference',
        dateTime: '2024-12-31T10:00:00Z',
        totalSlots: -10,
        local: 'Convention Center'
      };

      const result = createEventSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should fail validation with zero totalSlots', () => {
      const invalidData = {
        title: 'Tech Conference 2024',
        description: 'Annual technology conference',
        dateTime: '2024-12-31T10:00:00Z',
        totalSlots: 0,
        local: 'Convention Center'
      };

      const result = createEventSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should fail validation with non-integer totalSlots', () => {
      const invalidData = {
        title: 'Tech Conference 2024',
        description: 'Annual technology conference',
        dateTime: '2024-12-31T10:00:00Z',
        totalSlots: 10.5,
        local: 'Convention Center'
      };

      const result = createEventSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should fail validation with title exceeding 200 characters', () => {
      const invalidData = {
        title: 'a'.repeat(201),
        description: 'Annual technology conference',
        dateTime: '2024-12-31T10:00:00Z',
        totalSlots: 100,
        local: 'Convention Center'
      };

      const result = createEventSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should fail validation with local exceeding 500 characters', () => {
      const invalidData = {
        title: 'Tech Conference 2024',
        description: 'Annual technology conference',
        dateTime: '2024-12-31T10:00:00Z',
        totalSlots: 100,
        local: 'a'.repeat(501)
      };

      const result = createEventSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('updateEventSchema', () => {
    it('should validate with all optional fields provided', () => {
      const validData = {
        title: 'Updated Tech Conference',
        description: 'Updated description',
        dateTime: '2024-12-31T10:00:00Z',
        totalSlots: 150,
        local: 'New Location'
      };

      const result = updateEventSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate with only one field provided', () => {
      const validData = {
        title: 'Updated Tech Conference'
      };

      const result = updateEventSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate with partial fields', () => {
      const validData = {
        title: 'Updated Title',
        totalSlots: 200
      };

      const result = updateEventSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate with isActive field', () => {
      const validData = {
        isActive: false
      };

      const result = updateEventSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate with isActive true', () => {
      const validData = {
        isActive: true
      };

      const result = updateEventSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail validation with non-boolean isActive', () => {
      const invalidData = {
        isActive: 'yes'
      };

      const result = updateEventSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should fail validation with empty object', () => {
      const invalidData = {};

      const result = updateEventSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should fail validation with invalid field values', () => {
      const invalidData = {
        title: '', // empty string not allowed
        totalSlots: -10 // negative not allowed
      };

      const result = updateEventSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('eventIdParamSchema', () => {
    it('should validate a valid MongoDB ObjectId', () => {
      const validData = {
        id: '507f1f77bcf86cd799439011'
      };

      const result = eventIdParamSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail validation with invalid ObjectId format', () => {
      const invalidData = {
        id: 'invalid-id'
      };

      const result = eventIdParamSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should fail validation with ObjectId of wrong length', () => {
      const invalidData = {
        id: '507f1f77bcf86cd799' // too short
      };

      const result = eventIdParamSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should fail validation with non-hex characters', () => {
      const invalidData = {
        id: '507f1f77bcf86cd799439zyx'
      };

      const result = eventIdParamSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
