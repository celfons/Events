/**
 * Mock implementations for repositories when MongoDB is not available
 * These are used in integration tests when neither in-memory nor external MongoDB is available
 */
const bcrypt = require('bcryptjs');
const User = require('../../domain/entities/User');
const Event = require('../../domain/entities/Event');
const Registration = require('../../domain/entities/Registration');

/**
 * Generate a MongoDB-style ObjectId (24 hex characters)
 */
function generateObjectId() {
  const timestamp = Math.floor(Date.now() / 1000)
    .toString(16)
    .padStart(8, '0');
  const randomBytes = Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, '0')
  ).join('');
  return timestamp + randomBytes.substring(0, 16);
}

class MockUserRepository {
  constructor() {
    this.users = new Map();
  }

  async create(userData) {
    const id = generateObjectId();

    // Hash password if provided (simulate Mongoose pre-save hook)
    let hashedPassword = userData.password;
    if (userData.password && !userData.password.startsWith('$2a$')) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(userData.password, salt);
    }

    const user = new User({
      id,
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      role: userData.role || 'user',
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      createdAt: new Date(),
    });

    this.users.set(id, user);
    return user;
  }

  async findById(id) {
    return this.users.get(id) || null;
  }

  async findByEmail(email) {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async findModelByEmail(email) {
    // Find user in our mock store
    for (const user of this.users.values()) {
      if (user.email === email) {
        // Store password in closure to avoid `this` binding issues
        const storedPassword = user.password;

        // Return a mock model object that mimics Mongoose model
        return {
          _id: user.id,
          username: user.username,
          email: user.email,
          password: user.password,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          // Mock comparePassword method
          comparePassword: async function (candidatePassword) {
            return await bcrypt.compare(candidatePassword, storedPassword);
          },
        };
      }
    }
    return null;
  }

  async findByUsername(username) {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return null;
  }

  async update(id, userData) {
    const user = this.users.get(id);
    if (!user) {
      return null;
    }

    // Hash password if being updated
    let hashedPassword = userData.password;
    if (userData.password && !userData.password.startsWith('$2a$')) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(userData.password, salt);
    }

    const updated = new User({
      id: user.id,
      username: userData.username !== undefined ? userData.username : user.username,
      email: userData.email !== undefined ? userData.email : user.email,
      password: hashedPassword || user.password,
      role: userData.role !== undefined ? userData.role : user.role,
      isActive: userData.isActive !== undefined ? userData.isActive : user.isActive,
      createdAt: user.createdAt,
    });

    this.users.set(id, updated);
    return updated;
  }

  async delete(id) {
    return this.users.delete(id);
  }

  async findAll() {
    return Array.from(this.users.values());
  }

  clear() {
    this.users.clear();
  }
}

class MockEventRepository {
  constructor() {
    this.events = new Map();
  }

  async create(eventData) {
    const id = generateObjectId();
    const event = new Event({
      id,
      title: eventData.title,
      description: eventData.description,
      dateTime: eventData.dateTime,
      local: eventData.local,
      totalSlots: eventData.totalSlots,
      availableSlots:
        eventData.availableSlots !== undefined ? eventData.availableSlots : eventData.totalSlots,
      organizerId: eventData.organizerId || eventData.createdBy,
      createdBy: eventData.createdBy || eventData.organizerId,
      participants: eventData.participants || [],
      createdAt: new Date(),
    });

    // Store a plain object with participants array for internal use
    const storedEvent = {
      ...event,
      participants: eventData.participants || [],
    };

    this.events.set(id, storedEvent);
    return event;
  }

  async findById(id) {
    const storedEvent = this.events.get(id);
    if (!storedEvent) {
      return null;
    }

    return new Event({
      id: storedEvent.id,
      title: storedEvent.title,
      description: storedEvent.description,
      dateTime: storedEvent.dateTime,
      local: storedEvent.local,
      totalSlots: storedEvent.totalSlots,
      availableSlots: storedEvent.availableSlots,
      organizerId: storedEvent.organizerId,
      createdBy: storedEvent.createdBy,
      participants: storedEvent.participants,
      createdAt: storedEvent.createdAt,
    });
  }

  async findAll() {
    const events = [];
    for (const storedEvent of this.events.values()) {
      events.push(
        new Event({
          id: storedEvent.id,
          title: storedEvent.title,
          description: storedEvent.description,
          dateTime: storedEvent.dateTime,
          local: storedEvent.local,
          totalSlots: storedEvent.totalSlots,
          availableSlots: storedEvent.availableSlots,
          organizerId: storedEvent.organizerId,
          createdBy: storedEvent.createdBy,
          participants: storedEvent.participants,
          createdAt: storedEvent.createdAt,
        })
      );
    }
    return events;
  }

  async update(id, eventData) {
    const storedEvent = this.events.get(id);
    if (!storedEvent) {
      return null;
    }

    const updated = {
      ...storedEvent,
      ...eventData,
      id: storedEvent.id,
      participants: storedEvent.participants,
    };

    this.events.set(id, updated);

    return new Event({
      id: updated.id,
      title: updated.title,
      description: updated.description,
      dateTime: updated.dateTime,
      local: updated.local,
      totalSlots: updated.totalSlots,
      availableSlots: updated.availableSlots,
      organizerId: updated.organizerId,
      createdBy: updated.createdBy,
      participants: updated.participants,
      createdAt: updated.createdAt,
    });
  }

  async delete(id) {
    return this.events.delete(id);
  }

  async findByOrganizer(userId) {
    const events = [];
    for (const storedEvent of this.events.values()) {
      if (storedEvent.organizerId === userId || storedEvent.createdBy === userId) {
        events.push(
          new Event({
            id: storedEvent.id,
            title: storedEvent.title,
            description: storedEvent.description,
            dateTime: storedEvent.dateTime,
            local: storedEvent.local,
            totalSlots: storedEvent.totalSlots,
            availableSlots: storedEvent.availableSlots,
            organizerId: storedEvent.organizerId,
            createdBy: storedEvent.createdBy,
            participants: storedEvent.participants,
            createdAt: storedEvent.createdAt,
          })
        );
      }
    }
    return events;
  }

  async decrementAvailableSlots(id) {
    const storedEvent = this.events.get(id);
    if (!storedEvent || storedEvent.availableSlots <= 0) {
      return null;
    }
    storedEvent.availableSlots--;

    return new Event({
      id: storedEvent.id,
      title: storedEvent.title,
      description: storedEvent.description,
      dateTime: storedEvent.dateTime,
      local: storedEvent.local,
      totalSlots: storedEvent.totalSlots,
      availableSlots: storedEvent.availableSlots,
      organizerId: storedEvent.organizerId,
      createdBy: storedEvent.createdBy,
      participants: storedEvent.participants,
      createdAt: storedEvent.createdAt,
    });
  }

  async incrementAvailableSlots(id) {
    const storedEvent = this.events.get(id);
    if (!storedEvent || storedEvent.availableSlots >= storedEvent.totalSlots) {
      return null;
    }
    storedEvent.availableSlots++;

    return new Event({
      id: storedEvent.id,
      title: storedEvent.title,
      description: storedEvent.description,
      dateTime: storedEvent.dateTime,
      local: storedEvent.local,
      totalSlots: storedEvent.totalSlots,
      availableSlots: storedEvent.availableSlots,
      organizerId: storedEvent.organizerId,
      createdBy: storedEvent.createdBy,
      participants: storedEvent.participants,
      createdAt: storedEvent.createdAt,
    });
  }

  async addParticipant(eventId, participantData) {
    const storedEvent = this.events.get(eventId);
    if (!storedEvent || storedEvent.availableSlots <= 0) {
      return null;
    }

    // Check for duplicate participant
    const existingParticipant = storedEvent.participants.find(
      (p) => p.email.toLowerCase() === participantData.email.toLowerCase() && p.status === 'active'
    );
    if (existingParticipant) {
      return null;
    }

    const participant = {
      _id: generateObjectId(),
      ...participantData,
      registeredAt: new Date(),
      status: 'active',
    };

    storedEvent.participants.push(participant);
    storedEvent.availableSlots--;

    return new Registration({
      id: participant._id,
      eventId,
      name: participantData.name,
      email: participantData.email,
      phone: participantData.phone,
      registeredAt: participant.registeredAt,
      status: participant.status,
    });
  }

  async removeParticipant(eventId, participantId) {
    const storedEvent = this.events.get(eventId);
    if (!storedEvent) {
      return null;
    }

    const participantIndex = storedEvent.participants.findIndex(
      (p) => p._id === participantId && p.status === 'active'
    );

    if (participantIndex === -1) {
      return null;
    }

    storedEvent.participants[participantIndex].status = 'cancelled';
    storedEvent.availableSlots++;

    return new Event({
      id: storedEvent.id,
      title: storedEvent.title,
      description: storedEvent.description,
      dateTime: storedEvent.dateTime,
      local: storedEvent.local,
      totalSlots: storedEvent.totalSlots,
      availableSlots: storedEvent.availableSlots,
      organizerId: storedEvent.organizerId,
      createdBy: storedEvent.createdBy,
      participants: storedEvent.participants,
      createdAt: storedEvent.createdAt,
    });
  }

  async findParticipantByEmail(eventId, email) {
    const storedEvent = this.events.get(eventId);
    if (!storedEvent) {
      return null;
    }

    return (
      storedEvent.participants.find(
        (p) => p.email.toLowerCase() === email.toLowerCase() && p.status === 'active'
      ) || null
    );
  }

  async findParticipantByPhone(eventId, phone) {
    const storedEvent = this.events.get(eventId);
    if (!storedEvent) {
      return null;
    }

    return storedEvent.participants.find((p) => p.phone === phone && p.status === 'active') || null;
  }

  async getParticipants(eventId) {
    const storedEvent = this.events.get(eventId);
    if (!storedEvent) {
      return null;
    }

    return storedEvent.participants.filter((p) => p.status === 'active');
  }

  clear() {
    this.events.clear();
  }
}

// Singleton instances
let mockUserRepository = null;
let mockEventRepository = null;

function getMockUserRepository() {
  if (!mockUserRepository) {
    mockUserRepository = new MockUserRepository();
  }
  return mockUserRepository;
}

function getMockEventRepository() {
  if (!mockEventRepository) {
    mockEventRepository = new MockEventRepository();
  }
  return mockEventRepository;
}

function clearMockRepositories() {
  if (mockUserRepository) {
    mockUserRepository.clear();
  }
  if (mockEventRepository) {
    mockEventRepository.clear();
  }
}

module.exports = {
  MockUserRepository,
  MockEventRepository,
  getMockUserRepository,
  getMockEventRepository,
  clearMockRepositories,
};
