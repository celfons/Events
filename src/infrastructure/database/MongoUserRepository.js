const UserRepository = require('../../domain/repositories/UserRepository');
const User = require('../../domain/entities/User');
const UserModel = require('./UserModel');
const bcrypt = require('bcryptjs');

class MongoUserRepository extends UserRepository {
  async findById(id) {
    const userDoc = await UserModel.findById(id);
    if (!userDoc) return null;
    
    return new User({
      id: userDoc._id.toString(),
      username: userDoc.username,
      email: userDoc.email,
      password: userDoc.password,
      role: userDoc.role,
      isActive: userDoc.isActive,
      createdAt: userDoc.createdAt
    });
  }

  async findByEmail(email) {
    const userDoc = await UserModel.findOne({ email });
    if (!userDoc) return null;
    
    return new User({
      id: userDoc._id.toString(),
      username: userDoc.username,
      email: userDoc.email,
      password: userDoc.password,
      role: userDoc.role,
      isActive: userDoc.isActive,
      createdAt: userDoc.createdAt
    });
  }

  async findByUsername(username) {
    const userDoc = await UserModel.findOne({ username });
    if (!userDoc) return null;
    
    return new User({
      id: userDoc._id.toString(),
      username: userDoc.username,
      email: userDoc.email,
      password: userDoc.password,
      role: userDoc.role,
      isActive: userDoc.isActive,
      createdAt: userDoc.createdAt
    });
  }

  async create(user) {
    const userDoc = new UserModel({
      username: user.username,
      email: user.email,
      password: user.password,
      role: user.role,
      isActive: user.isActive
    });
    
    const savedUser = await userDoc.save();
    
    return new User({
      id: savedUser._id.toString(),
      username: savedUser.username,
      email: savedUser.email,
      password: savedUser.password,
      role: savedUser.role,
      isActive: savedUser.isActive,
      createdAt: savedUser.createdAt
    });
  }

  async update(id, userData) {
    // If password is being updated, hash it first
    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
    }
    
    const userDoc = await UserModel.findByIdAndUpdate(
      id,
      userData,
      { new: true, runValidators: true }
    );
    
    if (!userDoc) return null;
    
    return new User({
      id: userDoc._id.toString(),
      username: userDoc.username,
      email: userDoc.email,
      password: userDoc.password,
      role: userDoc.role,
      isActive: userDoc.isActive,
      createdAt: userDoc.createdAt
    });
  }

  async delete(id) {
    const userDoc = await UserModel.findByIdAndDelete(id);
    return userDoc !== null;
  }

  async findAll() {
    const userDocs = await UserModel.find();
    
    return userDocs.map(userDoc => new User({
      id: userDoc._id.toString(),
      username: userDoc.username,
      email: userDoc.email,
      password: userDoc.password,
      role: userDoc.role,
      isActive: userDoc.isActive,
      createdAt: userDoc.createdAt
    }));
  }

  async comparePassword(userId, candidatePassword) {
    const userDoc = await UserModel.findById(userId);
    if (!userDoc) return false;
    
    return await userDoc.comparePassword(candidatePassword);
  }

  async findModelByEmail(email) {
    return await UserModel.findOne({ email });
  }
}

module.exports = MongoUserRepository;
