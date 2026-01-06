const EventRepository = require('../../domain/repositories/EventRepository');
const EventModel = require('./EventModel');
const Event = require('../../domain/entities/Event');

class MongoEventRepository extends EventRepository {
  async create(event) {
    const eventModel = new EventModel({
      title: event.title,
      description: event.description,
      dateTime: event.dateTime,
      totalSlots: event.totalSlots,
      availableSlots: event.availableSlots !== undefined ? event.availableSlots : event.totalSlots
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
    const events = await EventModel.find().sort({ dateTime: 1 });
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

  _toDomain(eventModel) {
    return new Event({
      id: eventModel._id.toString(),
      title: eventModel.title,
      description: eventModel.description,
      dateTime: eventModel.dateTime,
      totalSlots: eventModel.totalSlots,
      availableSlots: eventModel.availableSlots,
      createdAt: eventModel.createdAt
    });
  }
}

module.exports = MongoEventRepository;
