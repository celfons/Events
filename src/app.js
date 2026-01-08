const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./infrastructure/web/swagger');

// Logger
const { httpLogger } = require('./infrastructure/logger/logger');

// Middleware
const { requestId } = require('./infrastructure/web/middleware/requestId');
const { errorHandler } = require('./infrastructure/web/middleware/errorHandler');

// Infrastructure
const MongoEventRepository = require('./infrastructure/database/MongoEventRepository');
const MongoUserRepository = require('./infrastructure/database/MongoUserRepository');

// Use Cases
const ListEventsUseCase = require('./application/use-cases/ListEventsUseCase');
const ListUserEventsUseCase = require('./application/use-cases/ListUserEventsUseCase');
const GetEventDetailsUseCase = require('./application/use-cases/GetEventDetailsUseCase');
const CreateEventUseCase = require('./application/use-cases/CreateEventUseCase');
const UpdateEventUseCase = require('./application/use-cases/UpdateEventUseCase');
const DeleteEventUseCase = require('./application/use-cases/DeleteEventUseCase');
const GetEventParticipantsUseCase = require('./application/use-cases/GetEventParticipantsUseCase');
const RegisterForEventUseCase = require('./application/use-cases/RegisterForEventUseCase');
const CancelRegistrationUseCase = require('./application/use-cases/CancelRegistrationUseCase');
const LoginUseCase = require('./application/use-cases/LoginUseCase');
const RegisterUseCase = require('./application/use-cases/RegisterUseCase');
const ListUsersUseCase = require('./application/use-cases/ListUsersUseCase');
const UpdateUserUseCase = require('./application/use-cases/UpdateUserUseCase');
const DeleteUserUseCase = require('./application/use-cases/DeleteUserUseCase');

// Controllers
const EventController = require('./infrastructure/web/controllers/EventController');
const RegistrationController = require('./infrastructure/web/controllers/RegistrationController');
const AuthController = require('./infrastructure/web/controllers/AuthController');
const UserController = require('./infrastructure/web/controllers/UserController');

// Routes
const createEventRoutes = require('./infrastructure/web/routes/eventRoutes');
const createRegistrationRoutes = require('./infrastructure/web/routes/registrationRoutes');
const createAuthRoutes = require('./infrastructure/web/routes/authRoutes');
const createUserRoutes = require('./infrastructure/web/routes/userRoutes');

function createApp(dependencies = {}) {
  const app = express();

  // Security headers with Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          // Note: 'unsafe-inline' is required for Bootstrap's inline styles
          // Consider using nonces or hashes in a future enhancement
          styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
          scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
          fontSrc: ["'self'", 'https://cdn.jsdelivr.net'],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
  });

  // Request ID middleware (must be early in the chain)
  app.use(requestId);

  // HTTP Logger middleware (after request ID)
  app.use(httpLogger);

  // Middleware
  // Note: CORS is currently permissive to maintain compatibility
  // Consider restricting origins in a future security enhancement
  app.use(cors());
  app.use(limiter);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, '../public')));

  // Dependency Injection - use provided dependencies or create defaults
  const eventRepository = dependencies.eventRepository || new MongoEventRepository();
  const userRepository = dependencies.userRepository || new MongoUserRepository();

  // Use Cases
  const listEventsUseCase = new ListEventsUseCase(eventRepository);
  const listUserEventsUseCase = new ListUserEventsUseCase(eventRepository);
  const getEventDetailsUseCase = new GetEventDetailsUseCase(eventRepository);
  const createEventUseCase = new CreateEventUseCase(eventRepository);
  const updateEventUseCase = new UpdateEventUseCase(eventRepository);
  const deleteEventUseCase = new DeleteEventUseCase(eventRepository);
  const getEventParticipantsUseCase = new GetEventParticipantsUseCase(eventRepository);
  const registerForEventUseCase = new RegisterForEventUseCase(eventRepository);
  const cancelRegistrationUseCase = new CancelRegistrationUseCase(eventRepository);
  const loginUseCase = new LoginUseCase(userRepository);
  const registerUseCase = new RegisterUseCase(userRepository);
  const listUsersUseCase = new ListUsersUseCase(userRepository);
  const updateUserUseCase = new UpdateUserUseCase(userRepository);
  const deleteUserUseCase = new DeleteUserUseCase(userRepository);

  // Controllers
  const eventController = new EventController(
    listEventsUseCase,
    getEventDetailsUseCase,
    createEventUseCase,
    updateEventUseCase,
    deleteEventUseCase,
    getEventParticipantsUseCase,
    listUserEventsUseCase
  );
  const registrationController = new RegistrationController(
    registerForEventUseCase,
    cancelRegistrationUseCase
  );
  const authController = new AuthController(loginUseCase, registerUseCase);
  const userController = new UserController(
    listUsersUseCase,
    updateUserUseCase,
    deleteUserUseCase,
    registerUseCase
  );

  // API Routes
  app.use('/api/auth', createAuthRoutes(authController));
  app.use('/api/users', createUserRoutes(userController));
  app.use('/api/events', createEventRoutes(eventController));
  app.use('/api/registrations', createRegistrationRoutes(registrationController));

  // Swagger API Documentation
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Events Platform API Documentation',
    })
  );

  // Serve HTML pages
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/views/index.html'));
  });

  app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/views/admin.html'));
  });

  app.get('/users', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/views/users.html'));
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
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found',
      },
    });
  });

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
