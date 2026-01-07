const EventRepository = require('../../domain/repositories/EventRepository');
const EventModel = require('./EventModel');
const Event = require('../../domain/entities/Event');
const Registration = require('../../domain/entities/Registration');
const mongoose = require('mongoose');

class MongoEventRepository extends EventRepository {
  async create(event) {
    const eventModel = new EventModel({
      title: event.title,
      description: event.description,
      dateTime: event.dateTime,
      totalSlots: event.totalSlots,
      availableSlots: event.availableSlots !== undefined ? event.availableSlots : event.totalSlots,
      participants: [],
      userId: event.userId,
      local: event.local,
      isActive: event.isActive !== undefined ? event.isActive : true
    });
    
    const savedEvent = await eventModel.save();
    return this._toDomain(savedEvent);
  }

  async findById(id) {
    const eventModel = await EventModel.findById(id);
    if (!eventModel) return null;
    return this._toDomain(eventModel);
  }

  async findAll() {
    const events = await EventModel.find({ isActive: true }).sort({ dateTime: -1 });
    return events.map(event => this._toDomain(event));
  }

  async findByUserId(userId) {
    const events = await EventModel.find({ userId }).sort({ dateTime: -1 });
    return events.map(event => this._toDomain(event));
  }

  async update(id, eventData) {
    const updatedEvent = await EventModel.findByIdAndUpdate(
      id,
      eventData,
      { new: true, runValidators: true }
    );
    if (!updatedEvent) return null;
    return this._toDomain(updatedEvent);
  }

  async delete(id) {
    const result = await EventModel.findByIdAndDelete(id);
    return !!result;
  }

  async decrementAvailableSlots(id) {
    const updatedEvent = await EventModel.findOneAndUpdate(
      { _id: id, availableSlots: { $gt: 0 } },
      { $inc: { availableSlots: -1 } },
      { new: true, runValidators: true }
    );
    if (!updatedEvent) return null;
    return this._toDomain(updatedEvent);
  }

  async incrementAvailableSlots(id) {
    const updatedEvent = await EventModel.findOneAndUpdate(
      { _id: id, $expr: { $lt: ['$availableSlots', '$totalSlots'] } },
      { $inc: { availableSlots: 1 } },
      { new: true, runValidators: true }
    );
    if (!updatedEvent) return null;
    return this._toDomain(updatedEvent);
  }

  async addParticipant(eventId, participantData) {
    // Add participant and decrement available slots atomically
    // Ensure no active participant with the same email already exists
    const updatedEvent = await EventModel.findOneAndUpdate(
      { 
        _id: eventId,
        availableSlots: { $gt: 0 },
        participants: { 
          $not: { 
            $elemMatch: { 
              email: participantData.email.toLowerCase(), 
              status: 'active' 
            } 
          } 
        }
      },
      { 
        $push: { participants: participantData },
        $inc: { availableSlots: -1 }
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedEvent) return null;
    
    // Find the newly added participant
    const participant = updatedEvent.participants[updatedEvent.participants.length - 1];
    return new Registration({
      id: participant._id.toString(),
      eventId: eventId,
      name: participant.name,
      email: participant.email,
      phone: participant.phone,
      registeredAt: participant.registeredAt,
      status: participant.status
    });
  }

  async findParticipantByEmail(eventId, email) {
    const event = await EventModel.findOne(
      { 
        _id: eventId,
        'participants.email': email.toLowerCase(),
        'participants.status': { $in: ['active', 'pending'] }
      },
      { 'participants.$': 1 }
    );
    
    if (!event || !event.participants || event.participants.length === 0) {
      return null;
    }
    
    const participant = event.participants[0];
    return new Registration({
      id: participant._id.toString(),
      eventId: eventId,
      name: participant.name,
      email: participant.email,
      phone: participant.phone,
      registeredAt: participant.registeredAt,
      status: participant.status,
      verificationCode: participant.verificationCode,
      verified: participant.verified,
      verifiedAt: participant.verifiedAt
    });
  }

  async findParticipantByPhone(eventId, phone) {
    const event = await EventModel.findOne(
      { 
        _id: eventId,
        'participants.phone': phone,
        'participants.status': { $in: ['active', 'pending'] }
      },
      { 'participants.$': 1 }
    );
    
    if (!event || !event.participants || event.participants.length === 0) {
      return null;
    }
    
    const participant = event.participants[0];
    return new Registration({
      id: participant._id.toString(),
      eventId: eventId,
      name: participant.name,
      email: participant.email,
      phone: participant.phone,
      registeredAt: participant.registeredAt,
      status: participant.status,
      verificationCode: participant.verificationCode,
      verified: participant.verified,
      verifiedAt: participant.verifiedAt
    });
  }

  async cancelParticipant(eventId, participantId) {
    // Cancel participant and increment available slots atomically
    const updatedEvent = await EventModel.findOneAndUpdate(
      { 
        _id: eventId,
        'participants._id': participantId,
        'participants.status': 'active',
        $expr: { $lt: ['$availableSlots', '$totalSlots'] }
      },
      { 
        $set: { 'participants.$.status': 'cancelled' },
        $inc: { availableSlots: 1 }
      },
      { new: true, runValidators: true }
    );
    
    return !!updatedEvent;
  }

  async getParticipants(eventId) {
    const event = await EventModel.findById(eventId);
    if (!event) return null;
    
    return event.participants
      .filter(p => p.status === 'active')
      .map(participant => new Registration({
        id: participant._id.toString(),
        eventId: eventId,
        name: participant.name,
        email: participant.email,
        phone: participant.phone,
        registeredAt: participant.registeredAt,
        status: participant.status
      }));
  }

  async removeParticipant(eventId, participantId) {
    const updatedEvent = await EventModel.findOneAndUpdate(
      { _id: eventId },
      { $pull: { participants: { _id: participantId } } },
      { new: true }
    );
    return !!updatedEvent;
  }

  async verifyParticipant(eventId, participantId) {
    const updatedEvent = await EventModel.findOneAndUpdate(
      { 
        _id: eventId,
        'participants._id': participantId,
        'participants.status': 'pending'
      },
      { 
        $set: { 
          'participants.$.status': 'active',
          'participants.$.verified': true,
          'participants.$.verifiedAt': new Date()
        }
      },
      { new: true }
    );
    return !!updatedEvent;
  }

  _toDomain(eventModel) {
    return new Event({
      id: eventModel._id.toString(),
      title: eventModel.title,
      description: eventModel.description,
      dateTime: eventModel.dateTime,
      totalSlots: eventModel.totalSlots,
      availableSlots: eventModel.availableSlots,
      participants: eventModel.participants ? eventModel.participants.map(p => ({
        id: p._id.toString(),
        name: p.name,
        email: p.email,
        phone: p.phone,
        registeredAt: p.registeredAt,
        status: p.status,
        verificationCode: p.verificationCode,
        verified: p.verified,
        verifiedAt: p.verifiedAt
      })) : [],
      createdAt: eventModel.createdAt,
      userId: eventModel.userId ? eventModel.userId.toString() : null,
      local: eventModel.local,
      isActive: eventModel.isActive !== undefined ? eventModel.isActive : true
    });
  }
}

module.exports = MongoEventRepository;
