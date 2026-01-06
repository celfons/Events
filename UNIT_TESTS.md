# Unit Tests Documentation

## Overview
This document describes the unit tests implemented for the Events Platform. The tests validate the business rules in the domain entities and application use cases.

## Test Framework
- **Jest**: JavaScript testing framework
- **Coverage**: 100% for domain entities and use cases

## Test Structure
```
src/
├── domain/
│   └── entities/
│       └── __tests__/
│           ├── Event.test.js
│           └── Registration.test.js
└── application/
    └── use-cases/
        └── __tests__/
            ├── CreateEventUseCase.test.js
            ├── RegisterForEventUseCase.test.js
            ├── CancelRegistrationUseCase.test.js
            ├── ListEventsUseCase.test.js
            └── GetEventDetailsUseCase.test.js
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage report
```bash
npm run test:coverage
```

## Test Coverage

### Summary
| Layer                | Statements | Branches | Functions | Lines |
|---------------------|-----------|----------|-----------|-------|
| **Domain Entities**  | 100%      | 100%     | 100%      | 100%  |
| **Use Cases**        | 100%      | 100%     | 100%      | 100%  |

### Detailed Coverage
```
---------------------------------|---------|----------|---------|---------|
File                             | % Stmts | % Branch | % Funcs | % Lines |
---------------------------------|---------|----------|---------|---------|
 application/use-cases           |     100 |      100 |     100 |     100 |
  CancelRegistrationUseCase.js   |     100 |      100 |     100 |     100 |
  CreateEventUseCase.js          |     100 |      100 |     100 |     100 |
  GetEventDetailsUseCase.js      |     100 |      100 |     100 |     100 |
  ListEventsUseCase.js           |     100 |      100 |     100 |     100 |
  RegisterForEventUseCase.js     |     100 |      100 |     100 |     100 |
 domain/entities                 |     100 |      100 |     100 |     100 |
  Event.js                       |     100 |      100 |     100 |     100 |
  Registration.js                |     100 |      100 |     100 |     100 |
---------------------------------|---------|----------|---------|---------|
```

## Domain Entity Tests

### Event Entity Tests (18 tests)

#### Constructor Tests
- ✅ Creates an event with all properties
- ✅ Sets availableSlots equal to totalSlots when not provided
- ✅ Sets createdAt to current date when not provided

#### Business Rule: hasAvailableSlots()
- ✅ Returns true when availableSlots is greater than 0
- ✅ Returns false when explicitly checking zero slots after decrement

#### Business Rule: decrementSlots()
- ✅ Decreases availableSlots by 1
- ✅ Throws error when no available slots

#### Business Rule: incrementSlots()
- ✅ Increases availableSlots by 1
- ✅ Throws error when trying to increment beyond total slots

#### toJSON()
- ✅ Returns event data as plain object

### Registration Entity Tests (9 tests)

#### Constructor Tests
- ✅ Creates a registration with all properties
- ✅ Sets status to "active" when not provided
- ✅ Sets registeredAt to current date when not provided

#### Business Rule: cancel()
- ✅ Changes status to "cancelled"
- ✅ Throws error when trying to cancel already cancelled registration

#### Business Rule: isActive()
- ✅ Returns true when status is "active"
- ✅ Returns false when status is "cancelled"

#### toJSON()
- ✅ Returns registration data as plain object

## Use Case Tests

### CreateEventUseCase (10 tests)

#### Validation Tests
- ✅ Returns error when title is missing
- ✅ Returns error when description is missing
- ✅ Returns error when dateTime is missing
- ✅ Returns error when totalSlots is missing
- ✅ Returns error when totalSlots is less than 1
- ✅ Returns error when totalSlots is negative

#### Successful Creation Tests
- ✅ Creates event successfully with valid data
- ✅ Parses totalSlots as integer
- ✅ Sets availableSlots equal to totalSlots

#### Error Handling
- ✅ Handles repository errors gracefully

### RegisterForEventUseCase (10 tests)

#### Validation Tests
- ✅ Returns error when eventId is missing
- ✅ Returns error when name is missing
- ✅ Returns error when email is missing
- ✅ Returns error when phone is missing

#### Business Rule Tests
- ✅ Returns error when event does not exist
- ✅ Returns error when user is already registered
- ✅ Returns error when event has no available slots

#### Successful Registration Tests
- ✅ Registers user successfully and decrements available slots
- ✅ Creates registration with correct data

#### Error Handling
- ✅ Handles repository errors gracefully

### CancelRegistrationUseCase (10 tests)

#### Validation Tests
- ✅ Returns error when registration is not found
- ✅ Returns error when registration is already cancelled
- ✅ Returns error when event is not found

#### Successful Cancellation Tests
- ✅ Cancels registration successfully and increments available slots
- ✅ Properly updates registration status to cancelled
- ✅ Restores available slots when cancelling

#### Error Handling
- ✅ Handles repository errors gracefully
- ✅ Handles errors during cancellation process

### ListEventsUseCase (5 tests)

#### Successful Listing Tests
- ✅ Returns all events successfully
- ✅ Returns empty array when no events exist
- ✅ Calls toJSON on each event

#### Error Handling
- ✅ Handles repository errors gracefully
- ✅ Handles unexpected errors

### GetEventDetailsUseCase (7 tests)

#### Successful Retrieval Tests
- ✅ Returns event details with registrations count
- ✅ Returns event with zero registrations
- ✅ Calls toJSON on the event

#### Validation Tests
- ✅ Returns error when event is not found

#### Error Handling
- ✅ Handles repository errors gracefully
- ✅ Handles errors when fetching registrations

## Business Rules Validated

### Event Management
1. **Create Event**: Validates required fields (title, description, dateTime, totalSlots)
2. **Total Slots**: Must be at least 1
3. **Available Slots**: Initially equal to total slots
4. **Slot Management**: Cannot decrement below 0 or increment above total slots

### Registration Management
1. **Registration Fields**: Validates required fields (eventId, name, email, phone)
2. **Event Existence**: Event must exist before registration
3. **Duplicate Prevention**: User cannot register twice for the same event (checked by email)
4. **Slot Availability**: Event must have available slots for registration
5. **Slot Decrement**: Registering decrements available slots
6. **Cancellation**: Can only cancel active registrations
7. **Slot Restoration**: Cancelling restores available slots

### Data Integrity
1. **Status Management**: Registration status is either "active" or "cancelled"
2. **Timestamp Tracking**: createdAt and registeredAt are automatically set
3. **Data Serialization**: All entities can be serialized to JSON

## Test Statistics
- **Total Test Suites**: 7
- **Total Tests**: 57
- **All Tests Passing**: ✅
- **Test Execution Time**: ~1 second

## Mock Strategy
Tests use Jest mocks for repository dependencies:
- `mockEventRepository`: Simulates event data access
- `mockRegistrationRepository`: Simulates registration data access

This allows testing business logic in isolation without database dependencies.

## Continuous Integration
These tests should be run:
- Before committing code
- In CI/CD pipeline
- Before deploying to production

## Future Improvements
1. Add integration tests for database operations
2. Add end-to-end tests for API endpoints
3. Add performance tests for use cases
4. Add mutation testing to validate test quality
