const RegistrationRepository = require('../../domain/repositories/RegistrationRepository');
const RegistrationModel = require('./RegistrationModel');
const Registration = require('../../domain/entities/Registration');

class MongoRegistrationRepository extends RegistrationRepository {
  async create(registration) {
    const registrationModel = new RegistrationModel({
      eventId: registration.eventId,
      name: registration.name,
      email: registration.email,
      phone: registration.phone,
      status: registration.status || 'active'
    });
    
    const savedRegistration = await registrationModel.save();
    return this._toDomain(savedRegistration);
  }

  async findById(id) {
    const registrationModel = await RegistrationModel.findById(id);
    if (!registrationModel) return null;
    return this._toDomain(registrationModel);
  }

  async findByEventId(eventId) {
    const registrations = await RegistrationModel.find({ eventId, status: 'active' });
    return registrations.map(reg => this._toDomain(reg));
  }

  async findByEmail(email) {
    const registrations = await RegistrationModel.find({ email: email.toLowerCase() });
    return registrations.map(reg => this._toDomain(reg));
  }

  async findByEventAndEmail(eventId, email) {
    const registration = await RegistrationModel.findOne({ 
      eventId, 
      email: email.toLowerCase(),
      status: 'active'
    });
    if (!registration) return null;
    return this._toDomain(registration);
  }

  async update(id, registrationData) {
    const updatedRegistration = await RegistrationModel.findByIdAndUpdate(
      id,
      registrationData,
      { new: true, runValidators: true }
    );
    if (!updatedRegistration) return null;
    return this._toDomain(updatedRegistration);
  }

  async delete(id) {
    const result = await RegistrationModel.findByIdAndDelete(id);
    return !!result;
  }

  _toDomain(registrationModel) {
    return new Registration({
      id: registrationModel._id.toString(),
      eventId: registrationModel.eventId.toString(),
      name: registrationModel.name,
      email: registrationModel.email,
      phone: registrationModel.phone,
      registeredAt: registrationModel.registeredAt,
      status: registrationModel.status
    });
  }
}

module.exports = MongoRegistrationRepository;
