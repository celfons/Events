class WhatsAppService {
  constructor(accessToken, phoneNumberId, apiVersion = 'v18.0') {
    this.accessToken = accessToken;
    this.phoneNumberId = phoneNumberId;
    this.apiVersion = apiVersion;
    this.baseUrl = `https://graph.facebook.com/${apiVersion}`;
  }

  async connect() {
    // Validate token by making a test API call
    try {
      const response = await fetch(`${this.baseUrl}/${this.phoneNumberId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (response.ok) {
        console.log('✅ WhatsApp Business API token validated successfully');
        return true;
      } else {
        const error = await response.json();
        console.error('❌ WhatsApp token validation failed:', error);
        throw new Error(`Token validation failed: ${error.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      if (error.message.includes('Token validation failed')) {
        throw error;
      }
      console.error('❌ Network error during WhatsApp token validation:', error);
      throw new Error(`Failed to validate WhatsApp token: ${error.message}`);
    }
  }

  async sendMessage(phoneNumber, message) {
    if (!this.accessToken || !this.phoneNumberId) {
      console.warn('⚠️  WhatsApp not configured. Message not sent to:', phoneNumber);
      return false;
    }

    try {
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      
      const response = await fetch(`${this.baseUrl}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedNumber,
          type: 'text',
          text: {
            body: message
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Message sent to ${phoneNumber} (ID: ${data.messages?.[0]?.id})`);
        return true;
      } else {
        const error = await response.json();
        const errorMessage = error.error?.message || 'Unknown API error';
        const errorCode = error.error?.code;
        
        if (errorCode === 131047) {
          console.error(`❌ Rate limit exceeded for ${phoneNumber}`);
        } else if (errorCode === 190) {
          console.error(`❌ Invalid access token for ${phoneNumber}`);
        } else {
          console.error(`❌ API error sending message to ${phoneNumber}: ${errorMessage}`);
        }
        return false;
      }
    } catch (error) {
      if (error.message.includes('Invalid phone number')) {
        console.error(`❌ ${error.message}`);
        return false;
      }
      console.error(`❌ Network error sending message to ${phoneNumber}: ${error.message}`);
      return false;
    }
  }

  formatPhoneNumber(phone) {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Validate minimum length
    if (cleaned.length < 10) {
      throw new Error(`Invalid phone number: ${phone} (too short)`);
    }
    
    // If number doesn't start with country code and has 10-11 digits (Brazilian format)
    if (!cleaned.startsWith('55') && cleaned.length >= 10 && cleaned.length <= 11) {
      cleaned = '55' + cleaned;
    }
    
    // Validate final length (Brazilian numbers: 12-13 digits including country code)
    if (cleaned.length < 12 || cleaned.length > 13) {
      throw new Error(`Invalid phone number format: ${phone}`);
    }
    
    return cleaned;
  }

  async disconnect() {
    // No persistent connection to close with API-based approach
    console.log('🔌 WhatsApp service stopped (no active connection to close)');
  }

  getConnectionStatus() {
    // With token-based API, we're always "connected" if token is configured
    return !!(this.accessToken && this.phoneNumberId);
  }
}

module.exports = WhatsAppService;
