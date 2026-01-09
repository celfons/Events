const MessagingService = require('../../domain/services/MessagingService');
const axios = require('axios');
const logger = require('../logging/logger');

/**
 * WhatsApp Business API Adapter
 * Implements the MessagingService interface using Meta's WhatsApp Business API
 * Documentation: https://developers.facebook.com/docs/whatsapp/cloud-api
 */
class WhatsAppService extends MessagingService {
  constructor(config = {}) {
    super();
    this.apiVersion = config.apiVersion || 'v21.0';
    this.phoneNumberId = config.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.accessToken = config.accessToken || process.env.WHATSAPP_ACCESS_TOKEN;
    this.apiUrl = config.apiUrl || `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
    this.enabled = config.enabled !== undefined ? config.enabled : process.env.WHATSAPP_ENABLED === 'true';

    if (this.enabled && (!this.phoneNumberId || !this.accessToken)) {
      logger.warn('WhatsApp service is enabled but credentials are missing. Messages will not be sent.');
      this.enabled = false;
    }
  }

  /**
   * Format phone number to E.164 format if needed
   * @param {string} phone - Phone number
   * @returns {string} - Formatted phone number
   */
  _formatPhoneNumber(phone) {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // If doesn't start with country code, assume Brazil (+55)
    if (!cleaned.startsWith('55') && cleaned.length <= 11) {
      cleaned = '55' + cleaned;
    }

    return cleaned;
  }

  /**
   * Format date to Brazilian format
   * @param {Date} date - Date object
   * @returns {string} - Formatted date string
   */
  _formatDate(date) {
    const dateObj = new Date(date);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} às ${hours}:${minutes}`;
  }

  /**
   * Send a message via WhatsApp Business API
   * @param {string} to - Recipient phone number
   * @param {string} message - Message text
   * @returns {Promise<Object>} - Result with success status and message ID
   */
  async _sendMessage(to, message) {
    if (!this.enabled) {
      logger.info('WhatsApp service is disabled. Message not sent.', { to, message });
      return {
        success: false,
        disabled: true,
        message: 'WhatsApp service is disabled'
      };
    }

    try {
      const formattedPhone = this._formatPhoneNumber(to);

      const response = await axios.post(
        this.apiUrl,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedPhone,
          type: 'text',
          text: {
            preview_url: false,
            body: message
          }
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const messages = response?.data?.messages;
      const messageId = Array.isArray(messages) && messages.length > 0 ? messages[0]?.id : undefined;

      logger.info('WhatsApp message sent successfully', {
        to: formattedPhone,
        messageId
      });

      return {
        success: true,
        messageId,
        to: formattedPhone
      };
    } catch (error) {
      logger.error('Failed to send WhatsApp message', {
        to,
        error: error.message,
        response: error.response?.data
      });

      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  /**
   * Send a registration confirmation message
   */
  async sendRegistrationConfirmation({ to, name, eventTitle, eventDate, eventLocal }) {
    const message = `Olá ${name}! 👋

Sua inscrição foi confirmada com sucesso! 🎉

*Evento:* ${eventTitle}
*Data:* ${this._formatDate(eventDate)}
*Local:* ${eventLocal}

Estamos ansiosos para vê-lo(a) no evento!

Em caso de dúvidas, entre em contato conosco.`;

    return await this._sendMessage(to, message);
  }

  /**
   * Send a cancellation confirmation message
   */
  async sendCancellationConfirmation({ to, name, eventTitle }) {
    const message = `Olá ${name},

Sua inscrição no evento *${eventTitle}* foi cancelada com sucesso.

Esperamos vê-lo(a) em nossos próximos eventos! 🎉

Até breve!`;

    return await this._sendMessage(to, message);
  }

  /**
   * Send an event reminder message
   */
  async sendEventReminder({ to, name, eventTitle, eventDate, eventLocal }) {
    const message = `Olá ${name}! 👋

Este é um lembrete sobre o evento que você se inscreveu:

*Evento:* ${eventTitle}
*Data:* ${this._formatDate(eventDate)}
*Local:* ${eventLocal}

Não esqueça de comparecer! Nos vemos lá! 🎉`;

    return await this._sendMessage(to, message);
  }

  /**
   * Send a verification code message
   */
  async sendVerificationCode({ to, name, eventTitle, verificationCode }) {
    const message = `Olá ${name}! 👋

Para confirmar sua inscrição no evento *${eventTitle}*, utilize o código de verificação:

*Código:* ${verificationCode}

Este código é válido por 15 minutos.

Por favor, insira este código no site para completar sua inscrição.`;

    return await this._sendMessage(to, message);
  }

  /**
   * Send a registration error notification
   */
  async sendRegistrationError({ to, name, eventTitle, error }) {
    const message = `Olá ${name},

Infelizmente, não foi possível completar sua inscrição no evento *${eventTitle}*.

*Motivo:* ${error}

Se você tiver dúvidas, entre em contato conosco.`;

    return await this._sendMessage(to, message);
  }

  /**
   * Send an event update notification
   */
  async sendEventUpdate({ to, name, eventTitle, newDate, newLocal }) {
    let changes = '';
    if (newDate) {
      changes += `\n*Nova Data:* ${this._formatDate(newDate)}`;
    }
    if (newLocal) {
      changes += `\n*Novo Local:* ${newLocal}`;
    }

    const message = `Olá ${name}! 📢

Informamos que o evento *${eventTitle}* teve alterações:
${changes}

Sua inscrição continua válida.

Se houver algum problema, entre em contato conosco.`;

    return await this._sendMessage(to, message);
  }
}

module.exports = WhatsAppService;
