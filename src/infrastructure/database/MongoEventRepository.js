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
    const updatedEvent = await EventModel.findByIdAndUpdate(id, eventData, { new: true, runValidators: true });
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
    // Add participant - only decrement slots if status is 'confirmed'
    // Ensure no confirmed participant or pending participant with non-expired code exists with same email
    const now = new Date(); // Store current date to avoid multiple Date() calls
    const updateQuery = {
      $push: { participants: participantData }
    };

    // Only decrement slots if participant is confirmed
    if (participantData.status === 'confirmed') {
      updateQuery.$inc = { availableSlots: -1 };
    }

    // Build the query conditions
    // Only block if there's a confirmed registration OR a pending registration with non-expired code
    const queryConditions = {
      _id: eventId,
      participants: {
        $not: {
          $elemMatch: {
            email: participantData.email.toLowerCase(),
            $or: [
              { status: 'confirmed' },
              {
                status: 'pending',
                verificationCodeExpiresAt: { $gt: now }
              }
            ]
          }
        }
      }
    };

    // For pending registrations, check that total non-expired pending+confirmed is less than totalSlots
    // For confirmed registrations, check that availableSlots > 0
    if (participantData.status === 'pending') {
      // Use aggregation to check if there's space (non-expired pending + confirmed < totalSlots)
      queryConditions.$expr = {
        $lt: [
          {
            $size: {
              $filter: {
                input: '$participants',
                as: 'p',
                cond: {
                  $or: [
                    { $eq: ['$$p.status', 'confirmed'] },
                    {
                      $and: [{ $eq: ['$$p.status', 'pending'] }, { $gt: ['$$p.verificationCodeExpiresAt', now] }]
                    }
                  ]
                }
              }
            }
          },
          '$totalSlots'
        ]
      };
    } else if (participantData.status === 'confirmed') {
      queryConditions.availableSlots = { $gt: 0 };
    }

    const updatedEvent = await EventModel.findOneAndUpdate(queryConditions, updateQuery, {
      new: true,
      runValidators: true
    });

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
    // Find participants with matching email that are either:
    // 1. Confirmed (always check these)
    // 2. Pending with non-expired verification code (ignore expired pending)
    const now = new Date(); // Store current date to avoid multiple Date() calls
    const normalizedEmail = email.toLowerCase(); // Normalize email once

    const event = await EventModel.findOne({
      _id: eventId,
      participants: {
        $elemMatch: {
          email: normalizedEmail,
          $or: [
            { status: 'confirmed' },
            {
              status: 'pending',
              verificationCodeExpiresAt: { $gt: now }
            }
          ]
        }
      }
    });

    if (!event || !event.participants || event.participants.length === 0) {
      return null;
    }

    // Find the matching participant in the returned participants array
    // Note: MongoDB $elemMatch in the query ensures an event with matching participant exists,
    // but returns ALL participants in the array, so we need to find the specific one
    const participant = event.participants.find(
      p =>
        p.email.toLowerCase() === normalizedEmail &&
        (p.status === 'confirmed' || (p.status === 'pending' && p.verificationCodeExpiresAt > now))
    );

    if (!participant) {
      return null;
    }

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

  async findParticipantByPhone(eventId, phone) {
    // Find participants with matching phone that are either:
    // 1. Confirmed (always check these)
    // 2. Pending with non-expired verification code (ignore expired pending)
    const now = new Date(); // Store current date to avoid multiple Date() calls

    const event = await EventModel.findOne({
      _id: eventId,
      participants: {
        $elemMatch: {
          phone: phone,
          $or: [
            { status: 'confirmed' },
            {
              status: 'pending',
              verificationCodeExpiresAt: { $gt: now }
            }
          ]
        }
      }
    });

    if (!event || !event.participants || event.participants.length === 0) {
      return null;
    }

    // Find the matching participant in the returned participants array
    // Note: MongoDB $elemMatch in the query ensures an event with matching participant exists,
    // but returns ALL participants in the array, so we need to find the specific one
    const participant = event.participants.find(
      p =>
        p.phone === phone && (p.status === 'confirmed' || (p.status === 'pending' && p.verificationCodeExpiresAt > now))
    );

    if (!participant) {
      return null;
    }

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

  async cancelParticipant(eventId, participantId) {
    // First, find the event and participant to check their status
    const event = await EventModel.findOne({
      _id: eventId,
      'participants._id': participantId
    });

    if (!event) {
      return false;
    }

    const participant = event.participants.find(p => p._id.toString() === participantId);
    if (!participant || !['pending', 'confirmed'].includes(participant.status)) {
      return false;
    }

    // Cancel participant - only increment slots if they were confirmed
    const updateQuery = {
      $set: { 'participants.$.status': 'cancelled' }
    };

    if (participant.status === 'confirmed') {
      updateQuery.$inc = { availableSlots: 1 };
    }

    const updatedEvent = await EventModel.findOneAndUpdate(
      {
        _id: eventId,
        'participants._id': participantId,
        'participants.status': { $in: ['pending', 'confirmed'] }
      },
      updateQuery,
      { new: true, runValidators: true }
    );

    return !!updatedEvent;
  }

  async confirmParticipant(eventId, participantId) {
    // Confirm participant and decrement available slots atomically
    const updatedEvent = await EventModel.findOneAndUpdate(
      {
        _id: eventId,
        'participants._id': participantId,
        'participants.status': 'pending',
        availableSlots: { $gt: 0 }
      },
      {
        $set: {
          'participants.$.status': 'confirmed',
          'participants.$.confirmedAt': new Date()
        },
        $inc: { availableSlots: -1 }
      },
      { new: true, runValidators: true }
    );

    return !!updatedEvent;
  }

  async getParticipants(eventId) {
    const event = await EventModel.findById(eventId);
    if (!event) return null;

    return event.participants
      .filter(p => p.status === 'confirmed')
      .map(
        participant =>
          new Registration({
            id: participant._id.toString(),
            eventId: eventId,
            name: participant.name,
            email: participant.email,
            phone: participant.phone,
            registeredAt: participant.registeredAt,
            status: participant.status
          })
      );
  }

  async removeParticipant(eventId, participantId) {
    const updatedEvent = await EventModel.findOneAndUpdate(
      { _id: eventId },
      { $pull: { participants: { _id: participantId } } },
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
      participants: eventModel.participants
        ? eventModel.participants.map(p => ({
            id: p._id.toString(),
            name: p.name,
            email: p.email,
            phone: p.phone,
            registeredAt: p.registeredAt,
            status: p.status,
            verificationCode: p.verificationCode,
            verificationCodeExpiresAt: p.verificationCodeExpiresAt
          }))
        : [],
      createdAt: eventModel.createdAt,
      userId: eventModel.userId ? eventModel.userId.toString() : null,
      local: eventModel.local,
      isActive: eventModel.isActive !== undefined ? eventModel.isActive : true
    });
  }
}

module.exports = MongoEventRepository;
