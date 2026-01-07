const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason, delay } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const path = require('path');

class WhatsAppService {
  constructor() {
    this.sock = null;
    this.isConnected = false;
    this.authPath = path.join(__dirname, '../../../.whatsapp-auth');
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
          
          if (shouldReconnect) {
            await delay(3000);
            await this.connect();
          } else {
            this.isConnected = false;
          }
        } else if (connection === 'open') {
          console.log('✅ WhatsApp connected successfully');
          this.isConnected = true;
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
    
    // If number doesn't start with country code, assume Brazil (+55)
    if (!cleaned.startsWith('55') && cleaned.length <= 11) {
      cleaned = '55' + cleaned;
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
