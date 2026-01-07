const MongoUserRepository = require('../MongoUserRepository');
const UserModel = require('../UserModel');
const bcrypt = require('bcryptjs');

describe('MongoUserRepository - Password Update Integration', () => {
  let repository;

  beforeEach(() => {
    repository = new MongoUserRepository();
  });

  describe('update with password', () => {
    it('should hash password when updating', async () => {
      const mockUserDoc = {
        _id: '123',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'user',
        createdAt: new Date()
      };

      // Mock findByIdAndUpdate to return a document with hashed password
      const newHashedPassword = await bcrypt.hash('newpassword123', 10);
      const updatedMockDoc = {
        ...mockUserDoc,
        password: newHashedPassword
      };

      UserModel.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedMockDoc);

      const result = await repository.update('123', {
        password: 'newpassword123'
      });

      // Verify that bcrypt.hash was called to hash the password
      // We can't directly verify bcrypt.hash was called, but we can verify
      // the password passed to findByIdAndUpdate was hashed
      expect(UserModel.findByIdAndUpdate).toHaveBeenCalled();
      const updateCall = UserModel.findByIdAndUpdate.mock.calls[0];
      const passwordArg = updateCall[1].password;
      
      // Verify the password is not plain text
      expect(passwordArg).not.toBe('newpassword123');
      
      // Verify it's a valid bcrypt hash (should be 60 characters starting with $2)
      expect(passwordArg).toMatch(/^\$2[aby]\$\d{2}\$/);
      expect(passwordArg.length).toBe(60);
    });

    it('should not modify password if not provided in update', async () => {
      const mockUserDoc = {
        _id: '123',
        username: 'newusername',
        email: 'test@example.com',
        password: 'existinghash',
        role: 'user',
        createdAt: new Date()
      };

      UserModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUserDoc);

      await repository.update('123', {
        username: 'newusername'
      });

      // Verify password was not included in update
      expect(UserModel.findByIdAndUpdate).toHaveBeenCalled();
      const updateCall = UserModel.findByIdAndUpdate.mock.calls[0];
      expect(updateCall[1].password).toBeUndefined();
    });
  });
});
