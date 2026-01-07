const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason, delay } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const path = require('path');

class WhatsAppService {
  constructor() {
    this.sock = null;
    this.isConnected = false;
    this.authPath = path.join(__dirname, '../../../.whatsapp-auth');
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  async connect() {
    try {
      const { state, saveCreds } = await useMultiFileAuthState(this.authPath);

      this.sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
      });

      // Handle QR code
      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          console.log('📱 WhatsApp QR Code:');
          qrcode.generate(qr, { small: true });
          console.log('Scan the QR code above with WhatsApp to connect');
        }

        if (connection === 'close') {
          const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
          console.log('Connection closed. Reconnecting:', shouldReconnect);
          
          if (shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delayMs = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
            console.log(`Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delayMs}ms`);
            await delay(delayMs);
            await this.connect();
          } else {
            this.isConnected = false;
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
              console.error('❌ Max reconnection attempts reached');
            }
          }
        } else if (connection === 'open') {
          console.log('✅ WhatsApp connected successfully');
          this.isConnected = true;
          this.reconnectAttempts = 0; // Reset on successful connection
        }
      });

      // Save credentials on update
      this.sock.ev.on('creds.update', saveCreds);

    } catch (error) {
      console.error('❌ Error connecting to WhatsApp:', error);
      throw error;
    }
  }

  async sendMessage(phoneNumber, message) {
    if (!this.isConnected || !this.sock) {
      console.warn('⚠️  WhatsApp not connected. Message not sent to:', phoneNumber);
      return false;
    }

    try {
      // Format phone number (remove non-numeric characters and add country code if needed)
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      const jid = `${formattedNumber}@s.whatsapp.net`;

      await this.sock.sendMessage(jid, { text: message });
      console.log(`✅ Message sent to ${phoneNumber}`);
      return true;
    } catch (error) {
      console.error(`❌ Error sending message to ${phoneNumber}:`, error);
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
    if (this.sock) {
      await this.sock.logout();
      this.isConnected = false;
      console.log('🔌 WhatsApp disconnected');
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }
}

module.exports = WhatsAppService;
