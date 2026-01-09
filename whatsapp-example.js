/**
 * WhatsApp Integration Example
 * 
 * This script demonstrates how to use the WhatsApp Business API integration
 * to send messages to event participants.
 * 
 * Prerequisites:
 * 1. Set up WhatsApp Business API credentials in .env file
 * 2. Configure WHATSAPP_ENABLED=true
 * 3. Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN
 */

require('dotenv').config();
const WhatsAppService = require('./src/infrastructure/messaging/WhatsAppService');

async function demonstrateWhatsAppIntegration() {
  console.log('=== WhatsApp Business API Integration Demo ===\n');

  // Initialize the WhatsApp service
  const whatsAppService = new WhatsAppService();

  if (!whatsAppService.enabled) {
    console.log('⚠️  WhatsApp service is disabled or credentials are missing.');
    console.log('Please configure the following in your .env file:');
    console.log('  - WHATSAPP_ENABLED=true');
    console.log('  - WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id');
    console.log('  - WHATSAPP_ACCESS_TOKEN=your-access-token\n');
    return;
  }

  console.log('✅ WhatsApp service is configured and enabled\n');

  // Example 1: Send registration confirmation
  console.log('Example 1: Registration Confirmation Message');
  console.log('---------------------------------------------');
  const registrationParams = {
    to: '11987654321', // Replace with a test number
    name: 'João Silva',
    eventTitle: 'Workshop de Node.js',
    eventDate: new Date('2024-03-15T14:30:00'),
    eventLocal: 'Centro de Convenções - São Paulo'
  };

  console.log('Sending registration confirmation to:', registrationParams.to);
  try {
    const result1 = await whatsAppService.sendRegistrationConfirmation(registrationParams);
    if (result1.success) {
      console.log('✅ Message sent successfully!');
      console.log('Message ID:', result1.messageId);
    } else {
      console.log('❌ Failed to send message:', result1.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  console.log();

  // Example 2: Send cancellation confirmation
  console.log('Example 2: Cancellation Confirmation Message');
  console.log('--------------------------------------------');
  const cancellationParams = {
    to: '11987654321', // Replace with a test number
    name: 'João Silva',
    eventTitle: 'Workshop de Node.js'
  };

  console.log('Sending cancellation confirmation to:', cancellationParams.to);
  try {
    const result2 = await whatsAppService.sendCancellationConfirmation(cancellationParams);
    if (result2.success) {
      console.log('✅ Message sent successfully!');
      console.log('Message ID:', result2.messageId);
    } else {
      console.log('❌ Failed to send message:', result2.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  console.log();

  // Example 3: Send event reminder
  console.log('Example 3: Event Reminder Message');
  console.log('----------------------------------');
  const reminderParams = {
    to: '11987654321', // Replace with a test number
    name: 'João Silva',
    eventTitle: 'Workshop de Node.js',
    eventDate: new Date('2024-03-15T14:30:00'),
    eventLocal: 'Centro de Convenções - São Paulo'
  };

  console.log('Sending event reminder to:', reminderParams.to);
  try {
    const result3 = await whatsAppService.sendEventReminder(reminderParams);
    if (result3.success) {
      console.log('✅ Message sent successfully!');
      console.log('Message ID:', result3.messageId);
    } else {
      console.log('❌ Failed to send message:', result3.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  console.log();

  console.log('=== Demo Complete ===');
}

// Run the demonstration
if (require.main === module) {
  demonstrateWhatsAppIntegration()
    .then(() => {
      console.log('\nExiting...');
      process.exit(0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { demonstrateWhatsAppIntegration };
