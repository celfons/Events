const Agenda = require('agenda');

class CronJobService {
  constructor(mongodbUri, whatsAppService, getUpcomingEventsUseCase, locale = 'pt-BR') {
    this.agenda = new Agenda({
      db: { address: mongodbUri, collection: 'agendaJobs' },
      processEvery: '1 minute',
      maxConcurrency: 20
    });

    this.whatsAppService = whatsAppService;
    this.getUpcomingEventsUseCase = getUpcomingEventsUseCase;
    this.locale = locale;

    this.setupJobs();
  }

  setupJobs() {
    // Define the job for sending WhatsApp notifications
    this.agenda.define('send-event-reminders', async (job) => {
      console.log('⏰ Running event reminders job...');

      try {
        // Get events occurring in the next hour
        const result = await this.getUpcomingEventsUseCase.execute();

        if (!result.success) {
          console.error('Failed to get upcoming events:', result.error);
          return;
        }

        const upcomingEvents = result.data;

        if (upcomingEvents.length === 0) {
          console.log('ℹ️  No events in the next hour');
          return;
        }

        console.log(`📅 Found ${upcomingEvents.length} event(s) in the next hour`);

        // Send WhatsApp messages to participants
        for (const event of upcomingEvents) {
          const eventDate = new Date(event.dateTime);
          const formattedDate = eventDate.toLocaleDateString(this.locale);
          const formattedTime = eventDate.toLocaleTimeString(this.locale, { 
            hour: '2-digit', 
            minute: '2-digit' 
          });

          const message = `🎉 *Lembrete de Evento*\n\n` +
            `📌 *${event.title}*\n` +
            `📝 ${event.description}\n` +
            `📅 Data: ${formattedDate}\n` +
            `⏰ Horário: ${formattedTime}\n` +
            `📍 Local: ${event.local || 'A definir'}\n\n` +
            `Te esperamos lá! 😊`;

          console.log(`📤 Sending reminders for event: ${event.title}`);

          for (const participant of event.participants) {
            if (participant.phone) {
              await this.whatsAppService.sendMessage(participant.phone, message);
              // Small delay to avoid rate limiting
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }

        console.log('✅ Event reminders sent successfully');
      } catch (error) {
        console.error('❌ Error in send-event-reminders job:', error);
      }
    });
  }

  async start() {
    try {
      await this.agenda.start();
      console.log('🚀 Agenda started successfully');

      // Schedule the job to run every hour
      await this.agenda.every('1 hour', 'send-event-reminders');
      console.log('⏰ Event reminders job scheduled to run every hour');

      // Optional: Run immediately on startup for testing
      // await this.agenda.now('send-event-reminders');
    } catch (error) {
      console.error('❌ Error starting Agenda:', error);
      throw error;
    }
  }

  async stop() {
    await this.agenda.stop();
    console.log('⏹️  Agenda stopped');
  }
}

module.exports = CronJobService;
