# Architecture Documentation

## Clean Architecture Layers

This project follows the Clean Architecture pattern with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│  (HTML/CSS/JavaScript Frontend + Express Controllers)   │
├─────────────────────────────────────────────────────────┤
│                   Application Layer                      │
│              (Use Cases / Business Logic)                │
├─────────────────────────────────────────────────────────┤
│                     Domain Layer                         │
│           (Entities + Repository Interfaces)             │
├─────────────────────────────────────────────────────────┤
│                 Infrastructure Layer                     │
│        (MongoDB Repositories + Database Models)          │
└─────────────────────────────────────────────────────────┘
```

## Directory Structure

```
Events/
├── src/
│   ├── domain/                          # Domain Layer (Core Business)
│   │   ├── entities/                    # Business Entities
│   │   │   ├── Event.js                 # Event entity with business rules
│   │   │   └── Registration.js          # Registration entity with business rules
│   │   └── repositories/                # Repository Interfaces (abstractions)
│   │       ├── EventRepository.js       # Event repository interface
│   │       └── RegistrationRepository.js # Registration repository interface
│   │
│   ├── application/                     # Application Layer (Use Cases)
│   │   └── use-cases/                   # Business operations
│   │       ├── ListEventsUseCase.js     # UC: List all events
│   │       ├── GetEventDetailsUseCase.js # UC: Get event details
│   │       ├── CreateEventUseCase.js    # UC: Create new event
│   │       ├── RegisterForEventUseCase.js # UC: Register for event
│   │       └── CancelRegistrationUseCase.js # UC: Cancel registration
│   │
│   ├── infrastructure/                  # Infrastructure Layer
│   │   ├── database/                    # Database implementations
│   │   │   ├── connection.js            # MongoDB connection manager
│   │   │   ├── EventModel.js            # Mongoose Event schema
│   │   │   ├── RegistrationModel.js     # Mongoose Registration schema
│   │   │   ├── MongoEventRepository.js  # Event repository implementation
│   │   │   └── MongoRegistrationRepository.js # Registration repository impl
│   │   └── web/                         # Web infrastructure
│   │       ├── controllers/             # HTTP Controllers
│   │       │   ├── EventController.js   # Event HTTP endpoints
│   │       │   └── RegistrationController.js # Registration HTTP endpoints
│   │       └── routes/                  # Route definitions
│   │           ├── eventRoutes.js       # Event routes
│   │           └── registrationRoutes.js # Registration routes
│   │
│   ├── app.js                           # Express app configuration
│   └── server.js                        # Application entry point
│
├── public/                              # Frontend Static Files
│   ├── views/                           # HTML pages
│   │   ├── index.html                   # Home page (event list)
│   │   └── event-details.html           # Event details page
│   ├── css/
│   │   └── styles.css                   # Custom styles
│   └── js/
│       ├── index.js                     # Home page logic
│       └── event-details.js             # Event details logic
│
├── .github/
│   └── workflows/
│       └── azure-deploy.yml             # Azure deployment workflow
│
├── package.json                         # Node.js dependencies
├── .env.example                         # Environment variables template
├── .gitignore                           # Git ignore rules
├── README.md                            # Project documentation
├── DEPLOYMENT.md                        # Deployment guide
├── TESTING.md                           # Testing guide
├── ARCHITECTURE.md                      # This file
└── seed.js                              # Database seeding script
```

## Dependency Flow

The dependency rule states that source code dependencies can only point inward:

```
Frontend (HTML/JS)
      ↓
Controllers
      ↓
Use Cases  ←→  Domain Entities
      ↓              ↓
Repository Interface
      ↑
Repository Implementation
      ↓
Database (MongoDB)
```

## Component Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                         FRONTEND                              │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │ index.html │  │ event-details│  │    styles.css    │    │
│  │            │  │    .html     │  │                  │    │
│  └─────┬──────┘  └──────┬───────┘  └──────────────────┘    │
│        │                │                                     │
│  ┌─────▼──────┐  ┌──────▼──────────┐                        │
│  │ index.js   │  │event-details.js │                        │
│  └─────┬──────┘  └──────┬──────────┘                        │
│        │                │                                     │
│        └────────────────┴──────────────┐                     │
└───────────────────────────────────────┼─────────────────────┘
                                        │ HTTP/JSON
┌───────────────────────────────────────▼─────────────────────┐
│                      BACKEND (API)                           │
│  ┌────────────────────────────────────────────────────┐     │
│  │              Express Application                    │     │
│  │  ┌───────────────────┐  ┌────────────────────┐    │     │
│  │  │ EventController   │  │RegistrationCtrl    │    │     │
│  │  └────────┬──────────┘  └─────────┬──────────┘    │     │
│  └───────────┼──────────────────────┼─────────────────┘     │
│              │                      │                        │
│  ┌───────────▼──────────┐  ┌───────▼────────────┐          │
│  │   Use Cases Layer     │  │   Use Cases Layer  │          │
│  │ • ListEvents          │  │ • RegisterForEvent │          │
│  │ • GetEventDetails     │  │ • CancelRegistr.   │          │
│  │ • CreateEvent         │  │                    │          │
│  └───────────┬───────────┘  └────────┬───────────┘          │
│              │                       │                       │
│  ┌───────────▼──────────────────────▼───────────┐          │
│  │            Domain Entities                    │          │
│  │  ┌────────────────┐  ┌─────────────────┐    │          │
│  │  │     Event      │  │  Registration   │    │          │
│  │  │ • hasSlots()   │  │  • cancel()     │    │          │
│  │  │ • decrement()  │  │  • isActive()   │    │          │
│  │  └────────────────┘  └─────────────────┘    │          │
│  └──────────────────────────────────────────────┘          │
│              │                       │                       │
│  ┌───────────▼──────────────────────▼───────────┐          │
│  │        Repository Interfaces                  │          │
│  │  ┌──────────────────┐  ┌─────────────────┐  │          │
│  │  │ EventRepository  │  │RegistrationRepo │  │          │
│  │  └──────────────────┘  └─────────────────┘  │          │
│  └───────────┬──────────────────────┬───────────┘          │
│              │                      │                       │
│  ┌───────────▼──────────┐  ┌───────▼────────────┐          │
│  │ MongoEventRepository │  │MongoRegistrationR. │          │
│  └───────────┬──────────┘  └────────┬───────────┘          │
│              │                      │                       │
│  ┌───────────▼──────────────────────▼───────────┐          │
│  │              Mongoose Models                  │          │
│  │  ┌──────────────┐  ┌──────────────────┐     │          │
│  │  │  EventModel  │  │ RegistrationModel│     │          │
│  │  └──────────────┘  └──────────────────┘     │          │
│  └────────────────────┬──────────────────────────┘         │
└─────────────────────┼─────────────────────────────────────┘
                      │
┌─────────────────────▼─────────────────────────────────────┐
│                     MongoDB Database                       │
│  ┌──────────────────┐  ┌──────────────────────────┐      │
│  │  events          │  │  registrations           │      │
│  │  collection      │  │  collection              │      │
│  └──────────────────┘  └──────────────────────────┘      │
└────────────────────────────────────────────────────────────┘
```

## SOLID Principles Implementation

### Single Responsibility Principle (SRP)
Each class/module has only one reason to change:
- **Event.js**: Manages event business rules
- **Registration.js**: Manages registration business rules
- **ListEventsUseCase.js**: Handles listing events logic
- **MongoEventRepository.js**: Handles database operations for events
- **EventController.js**: Handles HTTP requests/responses for events

### Open/Closed Principle (OCP)
Code is open for extension, closed for modification:
- Repository interfaces allow different implementations
- Use cases can be extended without modifying core logic
- New use cases can be added without changing existing ones

### Liskov Substitution Principle (LSP)
Derived classes can substitute base classes:
- `MongoEventRepository` implements `EventRepository` interface
- Any repository implementation can be swapped without breaking code
- Controllers depend on interfaces, not concrete implementations

### Interface Segregation Principle (ISP)
Clients shouldn't depend on interfaces they don't use:
- `EventRepository` only has event-related methods
- `RegistrationRepository` only has registration-related methods
- Controllers only depend on the use cases they need

### Dependency Inversion Principle (DIP)
Depend on abstractions, not concretions:
- Use cases depend on repository interfaces, not implementations
- Controllers depend on use cases, not database details
- Dependencies are injected, not hard-coded

## Data Flow Examples

### Creating an Event

```
User (Frontend)
    │
    ├─► POST /api/events (with event data)
    │
    └─► EventController.createEvent()
            │
            └─► CreateEventUseCase.execute()
                    │
                    ├─► Validate input
                    ├─► Create Event entity
                    └─► EventRepository.create()
                            │
                            └─► MongoEventRepository.create()
                                    │
                                    └─► EventModel.save()
                                            │
                                            └─► MongoDB
```

### Registering for an Event

```
User (Frontend)
    │
    ├─► POST /api/registrations (with registration data)
    │
    └─► RegistrationController.register()
            │
            └─► RegisterForEventUseCase.execute()
                    │
                    ├─► Validate input
                    ├─► Check if event exists
                    ├─► Check for duplicate registration
                    ├─► Check available slots
                    ├─► Create Registration entity
                    ├─► Save registration
                    └─► Decrement event slots
                            │
                            ├─► RegistrationRepository.create()
                            │       └─► MongoDB
                            │
                            └─► EventRepository.update()
                                    └─► MongoDB
```

## Design Patterns Used

1. **Repository Pattern**: Abstracts data access logic
2. **Dependency Injection**: Dependencies provided to constructors
3. **Use Case Pattern**: Encapsulates business operations
4. **Entity Pattern**: Domain objects with business rules
5. **MVC Pattern**: Separation of concerns in web layer
6. **Factory Pattern**: Creating entities and use cases
7. **Strategy Pattern**: Different repository implementations

## Key Design Decisions

### Why Clean Architecture?
- **Testability**: Business logic isolated and testable
- **Flexibility**: Easy to change frameworks or databases
- **Maintainability**: Clear structure, easy to understand
- **Scalability**: Can grow without becoming messy

### Why SOLID?
- **Code Quality**: Better organized, more maintainable
- **Flexibility**: Easy to extend and modify
- **Reusability**: Components can be reused
- **Testability**: Easier to test individual components

### Why MongoDB?
- **Flexibility**: Schema-less design for evolving requirements
- **Performance**: Fast read/write operations
- **Scalability**: Easy horizontal scaling
- **JSON-like**: Natural fit for JavaScript/Node.js

### Why Bootstrap?
- **Rapid Development**: Pre-built responsive components
- **Cross-browser**: Consistent across browsers
- **Mobile-first**: Responsive by default
- **Customizable**: Easy to customize styles

## Testing Strategy

### Unit Tests (Recommended)
- Test entities in isolation
- Test use cases with mocked repositories
- Test repositories with test database

### Integration Tests (Recommended)
- Test API endpoints
- Test database operations
- Test use case flows

### E2E Tests (Recommended)
- Test complete user flows
- Test UI interactions
- Test API + Database + Frontend

## Performance Considerations

1. **Database Indexing**: Indexes on frequently queried fields
2. **Connection Pooling**: MongoDB connection reuse
3. **Caching**: Can add Redis for frequently accessed data
4. **Pagination**: Implemented for large datasets
5. **Async Operations**: Non-blocking I/O throughout

## Security Considerations

1. **Input Validation**: All inputs validated
2. **XSS Prevention**: HTML escaping in frontend
3. **NoSQL Injection**: Mongoose schema validation
4. **CORS**: Configured for security
5. **Environment Variables**: Secrets not in code
6. **HTTPS**: Required in production (Azure)

## Future Enhancements

1. **Authentication**: User login/registration
2. **Authorization**: Role-based access control
3. **Email Notifications**: Confirmation emails
4. **Payment Integration**: Paid events
5. **Analytics**: Event statistics
6. **Search/Filter**: Advanced event search
7. **Calendar Integration**: Export to calendar
8. **Social Sharing**: Share events on social media
