/**
 * DTO (Data Transfer Objects) exports
 */

// Error and Success responses
const { ErrorResponse, ErrorCodes } = require('./ErrorResponse');
const SuccessResponse = require('./SuccessResponse');

// Event DTOs
const { CreateEventRequest, UpdateEventRequest } = require('./EventRequest');
const { EventResponse, EventDetailsResponse } = require('./EventResponse');

// Auth DTOs
const { LoginRequest, RegisterRequest } = require('./AuthRequest');
const { LoginResponse, UserResponse } = require('./AuthResponse');

// Registration DTOs
const { CreateRegistrationRequest, CancelRegistrationRequest } = require('./RegistrationRequest');
const { RegistrationResponse } = require('./RegistrationResponse');

module.exports = {
  // Error and Success
  ErrorResponse,
  ErrorCodes,
  SuccessResponse,

  // Events
  CreateEventRequest,
  UpdateEventRequest,
  EventResponse,
  EventDetailsResponse,

  // Auth
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  UserResponse,

  // Registrations
  CreateRegistrationRequest,
  CancelRegistrationRequest,
  RegistrationResponse
};
