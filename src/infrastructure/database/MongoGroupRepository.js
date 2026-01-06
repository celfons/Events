const GroupRepository = require('../../domain/repositories/GroupRepository');
const GroupModel = require('./GroupModel');
const Group = require('../../domain/entities/Group');

class MongoGroupRepository extends GroupRepository {
  async findById(id) {
    const groupDoc = await GroupModel.findById(id);
    if (!groupDoc) return null;
    return this.mapToEntity(groupDoc);
  }

  async findByName(name) {
    const groupDoc = await GroupModel.findOne({ name });
    if (!groupDoc) return null;
    return this.mapToEntity(groupDoc);
  }

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const groupDocs = await GroupModel.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await GroupModel.countDocuments();
    
    return {
      groups: groupDocs.map(doc => this.mapToEntity(doc)),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async create(group) {
    const groupDoc = new GroupModel({
      name: group.name,
      description: group.description || '',
      permissions: group.permissions || []
    });

    const saved = await groupDoc.save();
    return this.mapToEntity(saved);
  }

  async update(id, groupData) {
    const updated = await GroupModel.findByIdAndUpdate(
      id,
      {
        name: groupData.name,
        description: groupData.description,
        permissions: groupData.permissions
      },
      { new: true }
    );
    
    if (!updated) return null;
    return this.mapToEntity(updated);
  }

  async delete(id) {
    const result = await GroupModel.findByIdAndDelete(id);
    return result !== null;
  }

  mapToEntity(groupDoc) {
    const group = new Group(
      groupDoc.name,
      groupDoc.description,
      groupDoc.permissions
    );
    group.id = groupDoc._id.toString();
    group.createdAt = groupDoc.createdAt;
    return group;
  }
}

module.exports = MongoGroupRepository;
