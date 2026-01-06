const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./infrastructure/web/swagger');

// Infrastructure
const MongoEventRepository = require('./infrastructure/database/MongoEventRepository');
const MongoRegistrationRepository = require('./infrastructure/database/MongoRegistrationRepository');
const MongoUserRepository = require('./infrastructure/database/MongoUserRepository');
const MongoGroupRepository = require('./infrastructure/database/MongoGroupRepository');

// Use Cases
const ListEventsUseCase = require('./application/use-cases/ListEventsUseCase');
const GetEventDetailsUseCase = require('./application/use-cases/GetEventDetailsUseCase');
const CreateEventUseCase = require('./application/use-cases/CreateEventUseCase');
const UpdateEventUseCase = require('./application/use-cases/UpdateEventUseCase');
const DeleteEventUseCase = require('./application/use-cases/DeleteEventUseCase');
const GetEventParticipantsUseCase = require('./application/use-cases/GetEventParticipantsUseCase');
const RegisterForEventUseCase = require('./application/use-cases/RegisterForEventUseCase');
const CancelRegistrationUseCase = require('./application/use-cases/CancelRegistrationUseCase');
const LoginUseCase = require('./application/use-cases/LoginUseCase');
const RegisterUserUseCase = require('./application/use-cases/RegisterUserUseCase');
const ListUsersUseCase = require('./application/use-cases/ListUsersUseCase');
const UpdateUserUseCase = require('./application/use-cases/UpdateUserUseCase');
const DeleteUserUseCase = require('./application/use-cases/DeleteUserUseCase');
const CreateGroupUseCase = require('./application/use-cases/CreateGroupUseCase');
const ListGroupsUseCase = require('./application/use-cases/ListGroupsUseCase');
const UpdateGroupUseCase = require('./application/use-cases/UpdateGroupUseCase');
const DeleteGroupUseCase = require('./application/use-cases/DeleteGroupUseCase');

// Controllers
const EventController = require('./infrastructure/web/controllers/EventController');
const RegistrationController = require('./infrastructure/web/controllers/RegistrationController');
const AuthController = require('./infrastructure/web/controllers/AuthController');
const UserController = require('./infrastructure/web/controllers/UserController');
const GroupController = require('./infrastructure/web/controllers/GroupController');

// Routes
const createEventRoutes = require('./infrastructure/web/routes/eventRoutes');
const createRegistrationRoutes = require('./infrastructure/web/routes/registrationRoutes');
const createAuthRoutes = require('./infrastructure/web/routes/authRoutes');
const createUserRoutes = require('./infrastructure/web/routes/userRoutes');
const createGroupRoutes = require('./infrastructure/web/routes/groupRoutes');

// Middleware
const { isAuthenticated } = require('./infrastructure/web/middleware/authMiddleware');

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
  
  // Session middleware
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/events';
  const SESSION_SECRET = process.env.SESSION_SECRET || 'your-secret-key-change-in-production';
  
  app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: MONGODB_URI,
      touchAfter: 24 * 3600 // lazy session update
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' // HTTPS only in production
    }
  }));
  
  app.use(express.static(path.join(__dirname, '../public')));

  // Dependency Injection
  const eventRepository = new MongoEventRepository();
  const registrationRepository = new MongoRegistrationRepository();
  const userRepository = new MongoUserRepository();
  const groupRepository = new MongoGroupRepository();

  // Use Cases
  const listEventsUseCase = new ListEventsUseCase(eventRepository);
  const getEventDetailsUseCase = new GetEventDetailsUseCase(eventRepository, registrationRepository);
  const createEventUseCase = new CreateEventUseCase(eventRepository);
  const updateEventUseCase = new UpdateEventUseCase(eventRepository, registrationRepository);
  const deleteEventUseCase = new DeleteEventUseCase(eventRepository);
  const getEventParticipantsUseCase = new GetEventParticipantsUseCase(eventRepository, registrationRepository);
  const registerForEventUseCase = new RegisterForEventUseCase(eventRepository, registrationRepository);
  const cancelRegistrationUseCase = new CancelRegistrationUseCase(eventRepository, registrationRepository);
  const loginUseCase = new LoginUseCase(userRepository);
  const registerUserUseCase = new RegisterUserUseCase(userRepository, groupRepository);
  const listUsersUseCase = new ListUsersUseCase(userRepository);
  const updateUserUseCase = new UpdateUserUseCase(userRepository, groupRepository);
  const deleteUserUseCase = new DeleteUserUseCase(userRepository);
  const createGroupUseCase = new CreateGroupUseCase(groupRepository);
  const listGroupsUseCase = new ListGroupsUseCase(groupRepository);
  const updateGroupUseCase = new UpdateGroupUseCase(groupRepository);
  const deleteGroupUseCase = new DeleteGroupUseCase(groupRepository);

  // Controllers
  const eventController = new EventController(listEventsUseCase, getEventDetailsUseCase, createEventUseCase, updateEventUseCase, deleteEventUseCase, getEventParticipantsUseCase);
  const registrationController = new RegistrationController(registerForEventUseCase, cancelRegistrationUseCase);
  const authController = new AuthController(loginUseCase, registerUserUseCase);
  const userController = new UserController(listUsersUseCase, updateUserUseCase, deleteUserUseCase);
  const groupController = new GroupController(createGroupUseCase, listGroupsUseCase, updateGroupUseCase, deleteGroupUseCase);

  // API Routes
  app.use('/api/events', createEventRoutes(eventController));
  app.use('/api/registrations', createRegistrationRoutes(registrationController));
  app.use('/api/auth', createAuthRoutes(authController));
  app.use('/api/users', createUserRoutes(userController));
  app.use('/api/groups', createGroupRoutes(groupController));

  // Swagger API Documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Events Platform API Documentation'
  }));

  // Serve HTML pages
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/views/index.html'));
  });

  app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/views/login.html'));
  });

  app.get('/admin', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/views/admin.html'));
  });

  app.get('/users', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/views/users.html'));
  });

  app.get('/groups', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/views/groups.html'));
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
