const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./infrastructure/web/swagger');

// Infrastructure
const MongoEventRepository = require('./infrastructure/database/MongoEventRepository');

// Use Cases
const ListEventsUseCase = require('./application/use-cases/ListEventsUseCase');
const GetEventDetailsUseCase = require('./application/use-cases/GetEventDetailsUseCase');
const CreateEventUseCase = require('./application/use-cases/CreateEventUseCase');
const UpdateEventUseCase = require('./application/use-cases/UpdateEventUseCase');
const DeleteEventUseCase = require('./application/use-cases/DeleteEventUseCase');
const GetEventParticipantsUseCase = require('./application/use-cases/GetEventParticipantsUseCase');
const RegisterForEventUseCase = require('./application/use-cases/RegisterForEventUseCase');
const CancelRegistrationUseCase = require('./application/use-cases/CancelRegistrationUseCase');

// Controllers
const EventController = require('./infrastructure/web/controllers/EventController');
const RegistrationController = require('./infrastructure/web/controllers/RegistrationController');

// Routes
const createEventRoutes = require('./infrastructure/web/routes/eventRoutes');
const createRegistrationRoutes = require('./infrastructure/web/routes/registrationRoutes');

function createApp() {
  const app = express();

  // Security headers with Helmet
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // Note: 'unsafe-inline' is required for Bootstrap's inline styles
        // Consider using nonces or hashes in a future enhancement
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
        fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  });

  // Middleware
  // Note: CORS is currently permissive to maintain compatibility
  // Consider restricting origins in a future security enhancement
  app.use(cors());
  app.use(limiter);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, '../public')));

  // Dependency Injection
  const eventRepository = new MongoEventRepository();

  // Use Cases
  const listEventsUseCase = new ListEventsUseCase(eventRepository);
  const getEventDetailsUseCase = new GetEventDetailsUseCase(eventRepository);
  const createEventUseCase = new CreateEventUseCase(eventRepository);
  const updateEventUseCase = new UpdateEventUseCase(eventRepository);
  const deleteEventUseCase = new DeleteEventUseCase(eventRepository);
  const getEventParticipantsUseCase = new GetEventParticipantsUseCase(eventRepository);
  const registerForEventUseCase = new RegisterForEventUseCase(eventRepository);
  const cancelRegistrationUseCase = new CancelRegistrationUseCase(eventRepository);

  // Controllers
  const eventController = new EventController(listEventsUseCase, getEventDetailsUseCase, createEventUseCase, updateEventUseCase, deleteEventUseCase, getEventParticipantsUseCase);
  const registrationController = new RegistrationController(registerForEventUseCase, cancelRegistrationUseCase);

  // API Routes
  app.use('/api/events', createEventRoutes(eventController));
  app.use('/api/registrations', createRegistrationRoutes(registrationController));

  // Swagger API Documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Events Platform API Documentation'
  }));

  // Serve HTML pages
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/views/index.html'));
  });

  app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/views/admin.html'));
  });

  app.get('/event/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/views/event-details.html'));
  });

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

module.exports = createApp;
