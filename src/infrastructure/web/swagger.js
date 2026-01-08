const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Events Platform API',
      version: '1.0.0',
      description: 'API documentation for the Events Platform - A system for managing events and registrations',
      contact: {
        name: 'API Support'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Event: {
          type: 'object',
          required: ['title', 'description', 'dateTime', 'totalSlots'],
          properties: {
            id: {
              type: 'string',
              description: 'Event unique identifier',
              example: '507f1f77bcf86cd799439011'
            },
            title: {
              type: 'string',
              description: 'Event title',
              example: 'Workshop de Node.js'
            },
            description: {
              type: 'string',
              description: 'Event description',
              example: 'Aprenda Node.js do zero'
            },
            dateTime: {
              type: 'string',
              format: 'date-time',
              description: 'Event date and time',
              example: '2024-12-31T14:00:00.000Z'
            },
            totalSlots: {
              type: 'integer',
              description: 'Total number of slots available',
              example: 50
            },
            availableSlots: {
              type: 'integer',
              description: 'Number of slots still available',
              example: 45
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Event creation timestamp',
              example: '2024-01-01T10:00:00.000Z'
            }
          }
        },
        EventInput: {
          type: 'object',
          required: ['title', 'description', 'dateTime', 'totalSlots'],
          properties: {
            title: {
              type: 'string',
              description: 'Event title',
              example: 'Workshop de Node.js'
            },
            description: {
              type: 'string',
              description: 'Event description',
              example: 'Aprenda Node.js do zero'
            },
            dateTime: {
              type: 'string',
              format: 'date-time',
              description: 'Event date and time',
              example: '2024-12-31T14:00:00.000Z'
            },
            totalSlots: {
              type: 'integer',
              description: 'Total number of slots available',
              example: 50,
              minimum: 1
            }
          }
        },
        Registration: {
          type: 'object',
          required: ['eventId', 'name', 'email', 'phone'],
          properties: {
            id: {
              type: 'string',
              description: 'Registration unique identifier',
              example: '507f1f77bcf86cd799439012'
            },
            eventId: {
              type: 'string',
              description: 'Event ID reference',
              example: '507f1f77bcf86cd799439011'
            },
            name: {
              type: 'string',
              description: 'Participant name',
              example: 'João Silva'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Participant email',
              example: 'joao@example.com'
            },
            phone: {
              type: 'string',
              description: 'Participant phone number',
              example: '(11) 98765-4321'
            },
            registeredAt: {
              type: 'string',
              format: 'date-time',
              description: 'Registration timestamp',
              example: '2024-01-02T15:30:00.000Z'
            },
            status: {
              type: 'string',
              enum: ['active', 'cancelled'],
              description: 'Registration status',
              example: 'active'
            }
          }
        },
        RegistrationInput: {
          type: 'object',
          required: ['eventId', 'name', 'email', 'phone'],
          properties: {
            eventId: {
              type: 'string',
              description: 'Event ID reference',
              example: '507f1f77bcf86cd799439011'
            },
            name: {
              type: 'string',
              description: 'Participant name',
              example: 'João Silva'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Participant email',
              example: 'joao@example.com'
            },
            phone: {
              type: 'string',
              description: 'Participant phone number',
              example: '(11) 98765-4321'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
              example: 'An error occurred'
            }
          }
        },
        SuccessMessage: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Success message',
              example: 'Operation completed successfully'
            }
          }
        }
      }
    }
  },
  apis: [path.join(__dirname, 'routes', '*.js')]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
