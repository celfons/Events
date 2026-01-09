const WhatsAppService = require('../WhatsAppService');
const axios = require('axios');

jest.mock('axios');
jest.mock('../../logging/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

const logger = require('../../logging/logger');

describe('WhatsAppService', () => {
  let whatsAppService;
  const mockConfig = {
    phoneNumberId: '123456789',
    accessToken: 'test_token',
    enabled: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with provided config', () => {
      whatsAppService = new WhatsAppService(mockConfig);
      expect(whatsAppService.phoneNumberId).toBe('123456789');
      expect(whatsAppService.accessToken).toBe('test_token');
      expect(whatsAppService.enabled).toBe(true);
    });

    it('should disable service if credentials are missing', () => {
      whatsAppService = new WhatsAppService({ enabled: true });
      expect(whatsAppService.enabled).toBe(false);
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should read from environment variables if config not provided', () => {
      process.env.WHATSAPP_PHONE_NUMBER_ID = '987654321';
      process.env.WHATSAPP_ACCESS_TOKEN = 'env_token';
      process.env.WHATSAPP_ENABLED = 'true';

      whatsAppService = new WhatsAppService();
      expect(whatsAppService.phoneNumberId).toBe('987654321');
      expect(whatsAppService.accessToken).toBe('env_token');
      expect(whatsAppService.enabled).toBe(true);

      delete process.env.WHATSAPP_PHONE_NUMBER_ID;
      delete process.env.WHATSAPP_ACCESS_TOKEN;
      delete process.env.WHATSAPP_ENABLED;
    });
  });

  describe('_formatPhoneNumber', () => {
    beforeEach(() => {
      whatsAppService = new WhatsAppService(mockConfig);
    });

    it('should remove non-digit characters', () => {
      const result = whatsAppService._formatPhoneNumber('(11) 98765-4321');
      expect(result).toBe('5511987654321');
    });

    it('should add Brazil country code if missing', () => {
      const result = whatsAppService._formatPhoneNumber('11987654321');
      expect(result).toBe('5511987654321');
    });

    it('should not add country code if already present', () => {
      const result = whatsAppService._formatPhoneNumber('5511987654321');
      expect(result).toBe('5511987654321');
    });
  });

  describe('_formatDate', () => {
    beforeEach(() => {
      whatsAppService = new WhatsAppService(mockConfig);
    });

    it('should format date to Brazilian format', () => {
      const date = new Date('2024-03-15T14:30:00');
      const result = whatsAppService._formatDate(date);
      expect(result).toMatch(/15\/03\/2024 às \d{2}:\d{2}/);
    });
  });

  describe('sendRegistrationConfirmation', () => {
    beforeEach(() => {
      whatsAppService = new WhatsAppService(mockConfig);
    });

    it('should send registration confirmation message successfully', async () => {
      const mockResponse = {
        data: {
          messages: [{ id: 'msg_123' }]
        }
      };
      axios.post.mockResolvedValue(mockResponse);

      const params = {
        to: '11987654321',
        name: 'João Silva',
        eventTitle: 'Workshop de Node.js',
        eventDate: new Date('2024-03-15T14:30:00'),
        eventLocal: 'Centro de Convenções'
      };

      const result = await whatsAppService.sendRegistrationConfirmation(params);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg_123');
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('messages'),
        expect.objectContaining({
          messaging_product: 'whatsapp',
          to: '5511987654321',
          type: 'text'
        }),
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer test_token',
            'Content-Type': 'application/json'
          }
        })
      );
    });

    it('should return failure when service is disabled', async () => {
      whatsAppService = new WhatsAppService({ enabled: false });

      const params = {
        to: '11987654321',
        name: 'João Silva',
        eventTitle: 'Workshop de Node.js',
        eventDate: new Date('2024-03-15T14:30:00'),
        eventLocal: 'Centro de Convenções'
      };

      const result = await whatsAppService.sendRegistrationConfirmation(params);

      expect(result.success).toBe(false);
      expect(result.disabled).toBe(true);
      expect(axios.post).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      const mockError = {
        message: 'API Error',
        response: {
          data: { error: 'Invalid token' }
        }
      };
      axios.post.mockRejectedValue(mockError);

      const params = {
        to: '11987654321',
        name: 'João Silva',
        eventTitle: 'Workshop de Node.js',
        eventDate: new Date('2024-03-15T14:30:00'),
        eventLocal: 'Centro de Convenções'
      };

      const result = await whatsAppService.sendRegistrationConfirmation(params);

      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('sendCancellationConfirmation', () => {
    beforeEach(() => {
      whatsAppService = new WhatsAppService(mockConfig);
    });

    it('should send cancellation confirmation message successfully', async () => {
      const mockResponse = {
        data: {
          messages: [{ id: 'msg_456' }]
        }
      };
      axios.post.mockResolvedValue(mockResponse);

      const params = {
        to: '11987654321',
        name: 'João Silva',
        eventTitle: 'Workshop de Node.js'
      };

      const result = await whatsAppService.sendCancellationConfirmation(params);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg_456');
      expect(axios.post).toHaveBeenCalled();
    });
  });

  describe('sendEventReminder', () => {
    beforeEach(() => {
      whatsAppService = new WhatsAppService(mockConfig);
    });

    it('should send event reminder message successfully', async () => {
      const mockResponse = {
        data: {
          messages: [{ id: 'msg_789' }]
        }
      };
      axios.post.mockResolvedValue(mockResponse);

      const params = {
        to: '11987654321',
        name: 'João Silva',
        eventTitle: 'Workshop de Node.js',
        eventDate: new Date('2024-03-15T14:30:00'),
        eventLocal: 'Centro de Convenções'
      };

      const result = await whatsAppService.sendEventReminder(params);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg_789');
      expect(axios.post).toHaveBeenCalled();
    });
  });
});
