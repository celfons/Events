require('dotenv').config();
const createApp = require('./app');
const databaseConnection = require('./infrastructure/database/connection');
const WhatsAppService = require('./infrastructure/services/WhatsAppService');
const CronJobService = require('./infrastructure/services/CronJobService');
const GetUpcomingEventsUseCase = require('./application/use-cases/GetUpcomingEventsUseCase');
const MongoEventRepository = require('./infrastructure/database/MongoEventRepository');

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/events';
const ENABLE_WHATSAPP = process.env.ENABLE_WHATSAPP_NOTIFICATIONS === 'true';
const LOCALE = process.env.LOCALE || 'pt-BR';
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

let whatsAppService = null;
let cronJobService = null;

async function start() {
  try {
    // Connect to database
    await databaseConnection.connect(MONGODB_URI);

    // Initialize WhatsApp service if enabled
    if (ENABLE_WHATSAPP) {
      console.log('🔌 Initializing WhatsApp service...');
      
      if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
        console.error('⚠️  WhatsApp credentials missing. Please set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID');
        console.log('ℹ️  Continuing without WhatsApp notifications');
        whatsAppService = null;
      } else {
        whatsAppService = new WhatsAppService(WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID);
        try {
          await whatsAppService.connect();
        } catch (error) {
          console.error('⚠️  WhatsApp token validation failed, but server will continue:', error.message);
          whatsAppService = null;
        }
      }
    } else {
      console.log('ℹ️  WhatsApp notifications are disabled. Set ENABLE_WHATSAPP_NOTIFICATIONS=true to enable.');
    }

    // Initialize cron job service
    const eventRepository = new MongoEventRepository();
    const getUpcomingEventsUseCase = new GetUpcomingEventsUseCase(eventRepository);
    
    // Use a mock WhatsApp service if not enabled
    const effectiveWhatsAppService = whatsAppService || {
      sendMessage: async () => {
        console.log('ℹ️  WhatsApp disabled - message not sent');
        return false;
      },
      getConnectionStatus: () => false,
      disconnect: async () => {
        // No-op for mock service
      }
    };
    
    cronJobService = new CronJobService(
      MONGODB_URI,
      effectiveWhatsAppService,
      getUpcomingEventsUseCase,
      LOCALE
    );
    await cronJobService.start();

    // Create and start server with WhatsApp service
    const app = createApp(effectiveWhatsAppService, LOCALE);
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📋 Events page: http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  if (cronJobService) await cronJobService.stop();
  if (whatsAppService) await whatsAppService.disconnect();
  await databaseConnection.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  if (cronJobService) await cronJobService.stop();
  if (whatsAppService) await whatsAppService.disconnect();
  await databaseConnection.disconnect();
  process.exit(0);
});

start();
