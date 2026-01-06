class GroupController {
  constructor(createGroupUseCase, listGroupsUseCase, updateGroupUseCase, deleteGroupUseCase) {
    this.createGroupUseCase = createGroupUseCase;
    this.listGroupsUseCase = listGroupsUseCase;
    this.updateGroupUseCase = updateGroupUseCase;
    this.deleteGroupUseCase = deleteGroupUseCase;
  }

  async create(req, res) {
    try {
      const { name, description, permissions } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      const group = await this.createGroupUseCase.execute(name, description, permissions);
      res.status(201).json(group);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async list(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await this.listGroupsUseCase.execute(page, limit);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const groupData = req.body;

      const group = await this.updateGroupUseCase.execute(id, groupData);
      res.json(group);
    } catch (error) {
      if (error.message === 'Group not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;

      await this.deleteGroupUseCase.execute(id);
      res.json({ success: true, message: 'Group deleted successfully' });
    } catch (error) {
      if (error.message === 'Group not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = GroupController;
