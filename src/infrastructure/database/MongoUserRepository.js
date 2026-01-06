const UserRepository = require('../../domain/repositories/UserRepository');
const UserModel = require('./UserModel');
const User = require('../../domain/entities/User');

class MongoUserRepository extends UserRepository {
  async findById(id) {
    const userDoc = await UserModel.findById(id).populate('groups');
    if (!userDoc) return null;
    return this.mapToEntity(userDoc);
  }

  async findByUsername(username) {
    const userDoc = await UserModel.findOne({ username }).populate('groups');
    if (!userDoc) return null;
    return userDoc; // Return the document for authentication
  }

  async findByEmail(email) {
    const userDoc = await UserModel.findOne({ email }).populate('groups');
    if (!userDoc) return null;
    return userDoc;
  }

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const userDocs = await UserModel.find()
      .populate('groups')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await UserModel.countDocuments();
    
    return {
      users: userDocs.map(doc => this.mapToEntity(doc)),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async create(user) {
    const userDoc = new UserModel({
      username: user.username,
      email: user.email,
      password: user.password, // Should already be hashed
      groups: user.groups || [],
      isActive: user.isActive !== undefined ? user.isActive : true
    });

    const saved = await userDoc.save();
    return this.mapToEntity(saved);
  }

  async update(id, userData) {
    const updateData = {
      username: userData.username,
      email: userData.email,
      groups: userData.groups,
      isActive: userData.isActive
    };

    // Only update password if provided
    if (userData.password) {
      updateData.password = userData.password;
    }

    const updated = await UserModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('groups');
    
    if (!updated) return null;
    return this.mapToEntity(updated);
  }

  async delete(id) {
    const result = await UserModel.findByIdAndDelete(id);
    return result !== null;
  }

  mapToEntity(userDoc) {
    const user = new User(
      userDoc.username,
      userDoc.email,
      userDoc.password,
      userDoc.groups || [],
      userDoc.isActive
    );
    user.id = userDoc._id.toString();
    user.createdAt = userDoc.createdAt;
    return user;
  }
}

module.exports = MongoUserRepository;
