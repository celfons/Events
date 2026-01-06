# MongoDB Schema Refactoring - Embedded Participants

## Overview

This document describes the refactoring of the Events platform database schema to follow MongoDB's golden rule: **"Data that is accessed together should be stored together."**

## Problem Statement (Portuguese)
> Refatore todo repositório e schema do MongoDB e utilize a mesma coleção para gerenciar eventos e participantes. Use a regra de ouro do mongo. Dados consultados juntos devem ser salvo juntos.

**Translation**: Refactor the entire repository and MongoDB schema to use the same collection to manage events and participants. Use MongoDB's golden rule. Data accessed together should be stored together.

## Architecture Changes

### Before Refactoring
```
MongoDB Collections:
├── events (Event documents)
└── registrations (Registration documents with eventId reference)

Repositories:
├── MongoEventRepository
└── MongoRegistrationRepository
```

### After Refactoring
```
MongoDB Collections:
└── events (Event documents with embedded participants array)

Repositories:
└── MongoEventRepository (with participant management methods)
```

## Schema Comparison

### Old Schema (Separate Collections)

**Events Collection:**
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  dateTime: Date,
  totalSlots: Number,
  availableSlots: Number,
  createdAt: Date
}
```

**Registrations Collection:**
```javascript
{
  _id: ObjectId,
  eventId: ObjectId,  // Reference to events collection
  name: String,
  email: String,
  phone: String,
  registeredAt: Date,
  status: String  // 'active' | 'cancelled'
}
```

### New Schema (Embedded Documents)

**Events Collection:**
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  dateTime: Date,
  totalSlots: Number,
  availableSlots: Number,
  participants: [        // ← Embedded array
    {
      _id: ObjectId,
      name: String,
      email: String,
      phone: String,
      registeredAt: Date,
      status: String    // 'active' | 'cancelled'
    }
  ],
  createdAt: Date
}
```

## Implementation Details

### 1. Atomic Operations

All participant operations are atomic to prevent race conditions:

**Add Participant:**
```javascript
EventModel.findOneAndUpdate(
  { 
    _id: eventId,
    availableSlots: { $gt: 0 },
    participants: { 
      $not: { 
        $elemMatch: { 
          email: email.toLowerCase(), 
          status: 'active' 
        } 
      } 
    }
  },
  { 
    $push: { participants: participantData },
    $inc: { availableSlots: -1 }
  },
  { new: true, runValidators: true }
);
```

**Cancel Participant:**
```javascript
EventModel.findOneAndUpdate(
  { 
    _id: eventId,
    'participants._id': participantId,
    'participants.status': 'active',
    $expr: { $lt: ['$availableSlots', '$totalSlots'] }
  },
  { 
    $set: { 'participants.$.status': 'cancelled' },
    $inc: { availableSlots: 1 }
  },
  { new: true, runValidators: true }
);
```

### 2. Repository Methods

**New Methods Added to EventRepository:**

- `addParticipant(eventId, participantData)`: Add participant atomically
- `cancelParticipant(eventId, participantId)`: Cancel participant atomically
- `findParticipantByEmail(eventId, email)`: Find active participant by email
- `getParticipants(eventId)`: Get all active participants
- `removeParticipant(eventId, participantId)`: Remove participant completely

### 3. Use Cases Updated

All use cases were updated to work with the new embedded structure:

- **RegisterForEventUseCase**: Now calls `eventRepository.addParticipant()`
- **CancelRegistrationUseCase**: Changed signature to accept `(eventId, participantId)`
- **GetEventParticipantsUseCase**: Retrieves participants from event document
- **GetEventDetailsUseCase**: Counts participants from embedded array
- **UpdateEventUseCase**: Validates totalSlots against embedded participant count

### 4. Frontend Changes

**event-details.js:**
```javascript
// Before
fetch(`${API_URL}/api/registrations/${registrationId}/cancel`, {
  method: 'POST'
});

// After
fetch(`${API_URL}/api/registrations/${registrationId}/cancel`, {
  method: 'POST',
  body: JSON.stringify({ eventId })
});
```

**admin.js:**
Similar change to include eventId in cancellation requests.

## Benefits

### Performance Improvements
- ✅ **Single Query**: Event + participants retrieved in one query (no joins)
- ✅ **Reduced Latency**: Fewer round trips to database
- ✅ **Better Caching**: Related data cached together

### Data Consistency
- ✅ **Atomic Operations**: Participant operations and slot updates happen atomically
- ✅ **No Orphans**: Participants can't exist without their event
- ✅ **Referential Integrity**: Automatically maintained

### Code Simplicity
- ✅ **Fewer Files**: Removed 543 lines of code
- ✅ **Single Repository**: All event-related operations in one place
- ✅ **Easier Maintenance**: Fewer moving parts

### MongoDB Best Practices
- ✅ **Follows Golden Rule**: Data accessed together stored together
- ✅ **Document Model**: Leverages MongoDB's document structure
- ✅ **Embedded Documents**: Uses appropriate data modeling pattern

## Testing

### Test Coverage
- **Total Tests**: 92 tests
- **Status**: All passing ✅
- **Coverage Areas**:
  - Entity validation and business logic
  - Use case execution paths
  - Repository operations
  - Error handling

### Test Updates
All tests were updated to reflect the new embedded structure:
- Mock objects updated to include participants array
- Use case tests updated for new method signatures
- Repository method tests rewritten for embedded operations

## Security

### Security Scan
- **Tool**: CodeQL
- **Result**: 0 vulnerabilities found ✅
- **Review**: Manual code review completed

### Security Considerations
- Email uniqueness checked via `$elemMatch` to prevent duplicates
- Status validation prevents invalid state transitions
- Atomic operations prevent race conditions
- Input validation maintained at all layers

## Migration Guide

For existing databases with separate collections, follow these steps:

### 1. Backup Data
```bash
mongodump --db events --out /backup/pre-migration
```

### 2. Migration Script
```javascript
// Pseudo-code for migration
const events = await EventModel.find();

for (const event of events) {
  const registrations = await RegistrationModel.find({ eventId: event._id });
  
  const participants = registrations.map(reg => ({
    name: reg.name,
    email: reg.email,
    phone: reg.phone,
    registeredAt: reg.registeredAt,
    status: reg.status
  }));
  
  await EventModel.updateOne(
    { _id: event._id },
    { $set: { participants } }
  );
}
```

### 3. Verify Data
```javascript
// Verify participant counts match
const eventCount = await EventModel.countDocuments();
const participantCount = await EventModel.aggregate([
  { $unwind: '$participants' },
  { $count: 'total' }
]);

console.log(`Events: ${eventCount}`);
console.log(`Participants: ${participantCount[0].total}`);
```

### 4. Drop Old Collection
```javascript
// Only after verification
await db.collection('registrations').drop();
```

## Files Changed

### Added/Modified
- `src/infrastructure/database/EventModel.js` - Added participants schema
- `src/infrastructure/database/MongoEventRepository.js` - Added participant methods
- `src/domain/entities/Event.js` - Added participants property
- `src/domain/repositories/EventRepository.js` - Added method signatures
- `src/application/use-cases/*` - Updated all use cases
- `src/app.js` - Removed registrationRepository dependency
- `public/js/event-details.js` - Added eventId to cancel request
- `public/js/admin.js` - Added eventId to cancel request
- All test files updated

### Removed
- `src/infrastructure/database/RegistrationModel.js` ❌
- `src/infrastructure/database/MongoRegistrationRepository.js` ❌
- `src/domain/repositories/RegistrationRepository.js` ❌

## Performance Considerations

### Query Performance
```javascript
// Before: 2 queries needed
const event = await EventModel.findById(eventId);
const participants = await RegistrationModel.find({ eventId });

// After: 1 query
const event = await EventModel.findById(eventId);
// participants are already embedded!
```

### Index Optimization
```javascript
// Recommended indexes
eventSchema.index({ 'participants.email': 1 });
eventSchema.index({ dateTime: 1 });
eventSchema.index({ 'participants.status': 1 });
```

### Document Size
- Average participant: ~150 bytes
- With 100 participants: ~15KB per event
- Well within MongoDB's 16MB document limit
- Suitable for events with up to ~1000 participants

## Monitoring

### Metrics to Track
- Event document sizes
- Query performance (should improve)
- Participant counts per event
- Failed atomic operations (should be zero)

### Health Checks
```javascript
// Check for data consistency
db.events.aggregate([
  {
    $project: {
      activeCount: {
        $size: {
          $filter: {
            input: '$participants',
            as: 'p',
            cond: { $eq: ['$$p.status', 'active'] }
          }
        }
      },
      occupiedSlots: { $subtract: ['$totalSlots', '$availableSlots'] }
    }
  },
  {
    $match: {
      $expr: { $ne: ['$activeCount', '$occupiedSlots'] }
    }
  }
]);
```

## Conclusion

This refactoring successfully implements MongoDB best practices by:
1. Following the golden rule of data modeling
2. Improving query performance
3. Ensuring atomic operations
4. Simplifying the codebase
5. Maintaining test coverage
6. Ensuring security

The new architecture is more aligned with MongoDB's strengths and provides a solid foundation for future enhancements.

## References

- [MongoDB Data Modeling](https://docs.mongodb.com/manual/core/data-modeling-introduction/)
- [MongoDB Embedded Documents](https://docs.mongodb.com/manual/tutorial/model-embedded-one-to-many-relationships-between-documents/)
- [MongoDB Atomic Operations](https://docs.mongodb.com/manual/core/write-operations-atomicity/)
- [MongoDB Schema Design Best Practices](https://www.mongodb.com/developer/products/mongodb/schema-design-anti-pattern-summary/)
