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
            local: {
              type: 'string',
              description: 'Event location',
              example: 'Auditório Principal'
            },
            userId: {
              type: 'string',
              description: 'ID of the user who created the event',
              example: '507f1f77bcf86cd799439010'
            },
            isActive: {
              type: 'boolean',
              description: 'Whether the event is active',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Event creation timestamp',
              example: '2024-01-01T10:00:00.000Z'
            }
          }
        },
        EventDetails: {
          allOf: [
            { $ref: '#/components/schemas/Event' },
            {
              type: 'object',
              properties: {
                participantsCount: {
                  type: 'integer',
                  description: 'Number of registered participants',
                  example: 5
                }
              }
            }
          ]
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
            },
            local: {
              type: 'string',
              description: 'Event location',
              example: 'Auditório Principal'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User unique identifier',
              example: '507f1f77bcf86cd799439010'
            },
            username: {
              type: 'string',
              description: 'Username',
              example: 'johndoe'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email',
              example: 'john@example.com'
            },
            role: {
              type: 'string',
              enum: ['user', 'superuser'],
              description: 'User role',
              example: 'user'
            },
            isActive: {
              type: 'boolean',
              description: 'Whether the user is active',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp',
              example: '2024-01-01T10:00:00.000Z'
            }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              description: 'JWT authentication token',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            user: {
              $ref: '#/components/schemas/User'
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
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'Error code',
                  example: 'INVALID_INPUT'
                },
                message: {
                  type: 'string',
                  description: 'Error message',
                  example: 'Invalid input data'
                },
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Error timestamp',
                  example: '2024-01-01T10:00:00.000Z'
                },
                details: {
                  description: 'Additional error details (optional)',
                  oneOf: [{ type: 'object' }, { type: 'array' }]
                }
              }
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            data: {
              description: 'Response data',
              type: 'object'
            },
            message: {
              type: 'string',
              description: 'Success message (optional)',
              example: 'Operation completed successfully'
            },
            meta: {
              type: 'object',
              description: 'Additional metadata (optional)'
            }
          }
        },
        SuccessMessage: {
          type: 'object',
          properties: {
            data: {
              type: 'null',
              description: 'No data for delete operations'
            },
            message: {
              type: 'string',
              description: 'Success message',
              example: 'Operation completed successfully'
            }
          }
        },
        EventResponse: {
          type: 'object',
          properties: {
            data: {
              $ref: '#/components/schemas/Event'
            },
            message: {
              type: 'string',
              example: 'Event created successfully'
            }
          }
        },
        EventDetailsResponse: {
          type: 'object',
          properties: {
            data: {
              $ref: '#/components/schemas/EventDetails'
            }
          }
        },
        EventListResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Event'
              }
            }
          }
        },
        RegistrationResponse: {
          type: 'object',
          properties: {
            data: {
              $ref: '#/components/schemas/Registration'
            },
            message: {
              type: 'string',
              example: 'Registration created successfully'
            }
          }
        },
        RegistrationListResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Registration'
              }
            }
          }
        },
        UserResponse: {
          type: 'object',
          properties: {
            data: {
              $ref: '#/components/schemas/User'
            },
            message: {
              type: 'string',
              example: 'User created successfully'
            }
          }
        },
        UserListResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/User'
              }
            }
          }
        },
        LoginSuccessResponse: {
          type: 'object',
          properties: {
            data: {
              $ref: '#/components/schemas/LoginResponse'
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
