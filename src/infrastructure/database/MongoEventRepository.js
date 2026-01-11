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
      availableSlots: event.availableSlots ?? event.totalSlots,
      participants: [],
      userId: event.userId,
      local: event.local,
      isActive: event.isActive ?? true,
      eventCode: event.eventCode
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
    const events = await EventModel.find({ userId: { $eq: userId } }).sort({ dateTime: -1 });
    return events.map(event => this._toDomain(event));
  }

  async findByEventCode(eventCode) {
    const eventModel = await EventModel.findOne({ eventCode: { $eq: eventCode.toUpperCase() } });
    if (!eventModel) return null;
    return this._toDomain(eventModel);
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
    // Ensure no confirmed participant exists with same email
    // Pending registrations (even non-expired) should not block new registrations
    //
    // NOTE: We maintain the availableSlots field for backward compatibility and quick reference,
    // but validation uses actual participant counts to ensure accuracy even if availableSlots is out of sync.
    // The field will self-correct over time as registrations/cancellations occur.
    const updateQuery = {
      $push: { participants: participantData }
    };

    // Only decrement slots if participant is confirmed
    if (participantData.status === 'confirmed') {
      updateQuery.$inc = { availableSlots: -1 };
    }

    // Build the query conditions
    // Only block if there's a confirmed registration
    const queryConditions = {
      _id: eventId,
      participants: {
        $not: {
          $elemMatch: {
            email: participantData.email.toLowerCase(),
            status: 'confirmed'
          }
        }
      }
    };

    // For both pending and confirmed registrations, check based on actual participant counts
    // This ensures accuracy even if availableSlots field is out of sync
    if (participantData.status === 'pending') {
      const now = new Date();
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
      // Check that confirmed participants count is less than totalSlots
      // This is more reliable than checking availableSlots which might be out of sync
      queryConditions.$expr = this._buildConfirmedParticipantsCheck();
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
    // Find participants with matching email that are confirmed only
    // Pending registrations (even non-expired) should not block new registrations
    const normalizedEmail = email.toLowerCase(); // Normalize email once

    const event = await EventModel.findOne({
      _id: eventId,
      participants: {
        $elemMatch: {
          email: { $eq: normalizedEmail },
          status: 'confirmed'
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
      p => p.email.toLowerCase() === normalizedEmail && p.status === 'confirmed'
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
    // Find participants with matching phone that are confirmed only
    // Pending registrations (even non-expired) should not block new registrations

    const event = await EventModel.findOne({
      _id: eventId,
      participants: {
        $elemMatch: {
          phone: { $eq: phone },
          status: 'confirmed'
        }
      }
    });

    if (!event || !event.participants || event.participants.length === 0) {
      return null;
    }

    // Find the matching participant in the returned participants array
    // Note: MongoDB $elemMatch in the query ensures an event with matching participant exists,
    // but returns ALL participants in the array, so we need to find the specific one
    const participant = event.participants.find(p => p.phone === phone && p.status === 'confirmed');

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
    // Check that confirmed participants count is less than totalSlots
    // This is more reliable than checking availableSlots which might be out of sync
    //
    // NOTE: We continue to maintain availableSlots for backward compatibility,
    // but use actual participant counts for validation to ensure accuracy.
    const updatedEvent = await EventModel.findOneAndUpdate(
      {
        _id: eventId,
        'participants._id': participantId,
        'participants.status': 'pending',
        $expr: this._buildConfirmedParticipantsCheck()
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

  /**
   * Helper method to build MongoDB $expr aggregation for checking if confirmed
   * participants count is below totalSlots. This is used in addParticipant and
   * confirmParticipant to validate slot availability based on actual participant
   * data rather than the potentially stale availableSlots field.
   * @returns {Object} MongoDB $expr aggregation object
   */
  _buildConfirmedParticipantsCheck() {
    return {
      $lt: [
        {
          $size: {
            $filter: {
              input: '$participants',
              as: 'p',
              cond: { $eq: ['$$p.status', 'confirmed'] }
            }
          }
        },
        '$totalSlots'
      ]
    };
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
      isActive: eventModel.isActive ?? true,
      eventCode: eventModel.eventCode
    });
  }
}

module.exports = MongoEventRepository;
