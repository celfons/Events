const WhatsAppService = require('../../domain/services/WhatsAppService');
const twilio = require('twilio');

class TwilioWhatsAppService extends WhatsAppService {
  constructor(accountSid, authToken, fromNumber) {
    super();
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.fromNumber = fromNumber;
    this.client = null;
    
    // Only initialize if credentials are provided
    if (accountSid && authToken && fromNumber) {
      this.client = twilio(accountSid, authToken);
    }
  }

  async sendMessage(phoneNumber, message) {
    if (!this.client) {
      console.log('[WhatsApp Mock] Would send to:', phoneNumber, 'Message:', message);
      return {
        success: true,
        messageId: 'mock-' + Date.now(),
        mock: true
      };
    }

    try {
      const result = await this.client.messages.create({
        body: message,
        from: `whatsapp:${this.fromNumber}`,
        to: `whatsapp:${phoneNumber}`
      });

      return {
        success: true,
        messageId: result.sid
      };
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendBulkMessages(recipients) {
    const results = [];
    
    for (const recipient of recipients) {
      const result = await this.sendMessage(recipient.phoneNumber, recipient.message);
      results.push({
        phoneNumber: recipient.phoneNumber,
        ...result
      });
    }

    return {
      success: true,
      results,
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    };
  }
}

module.exports = TwilioWhatsAppService;
