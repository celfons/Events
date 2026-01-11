const { getConfirmedParticipants, sendNotificationsWithErrorHandling } = require('../notificationHelper');

describe('notificationHelper', () => {
  describe('getConfirmedParticipants', () => {
    it('should return only confirmed participants', () => {
      const event = {
        participants: [
          { id: '1', status: 'confirmed', name: 'User1' },
          { id: '2', status: 'pending', name: 'User2' },
          { id: '3', status: 'confirmed', name: 'User3' },
          { id: '4', status: 'cancelled', name: 'User4' }
        ]
      };

      const result = getConfirmedParticipants(event);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('3');
    });

    it('should return empty array when no confirmed participants', () => {
      const event = {
        participants: [
          { id: '1', status: 'pending', name: 'User1' },
          { id: '2', status: 'cancelled', name: 'User2' }
        ]
      };

      const result = getConfirmedParticipants(event);

      expect(result).toHaveLength(0);
    });
  });

  describe('sendNotificationsWithErrorHandling', () => {
    it('should send notifications to all participants', async () => {
      const participants = [
        { id: '1', name: 'User1' },
        { id: '2', name: 'User2' }
      ];
      const sendFunction = jest.fn().mockResolvedValue({ success: true });

      await sendNotificationsWithErrorHandling(participants, sendFunction, { eventId: '123' });

      expect(sendFunction).toHaveBeenCalledTimes(2);
      expect(sendFunction).toHaveBeenCalledWith(participants[0]);
      expect(sendFunction).toHaveBeenCalledWith(participants[1]);
    });

    it('should handle errors gracefully', async () => {
      const participants = [{ id: '1', name: 'User1' }];
      const sendFunction = jest.fn().mockRejectedValue(new Error('Network error'));

      await sendNotificationsWithErrorHandling(participants, sendFunction);

      expect(sendFunction).toHaveBeenCalled();
    });

    it('should continue with other notifications if one fails', async () => {
      const participants = [
        { id: '1', name: 'User1' },
        { id: '2', name: 'User2' }
      ];
      const sendFunction = jest
        .fn()
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce({ success: true });

      await sendNotificationsWithErrorHandling(participants, sendFunction);

      expect(sendFunction).toHaveBeenCalledTimes(2);
    });
  });
});
