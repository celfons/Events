# Fix Summary: Event Creation and Update 400 Errors

## Issue Resolved
**Original Issue**: "Criação e atualização de eventos está retornando status code 400"
- Event creation and updates were failing with 400 errors
- Users could not create or update events through the React frontend
- Validation errors were being returned for all datetime inputs

## Root Cause
The backend Zod validation schema (`dateTimeSchema` in `commonSchemas.js`) expected full ISO 8601 datetime strings with timezone information (e.g., `"2026-12-31T10:00:00.000Z"`), but the React frontend was sending datetime strings from HTML `datetime-local` inputs without timezone info (e.g., `"2026-12-31T10:00"`).

### Technical Details
- HTML5 `datetime-local` inputs return strings in the format `YYYY-MM-DDTHH:mm` without timezone
- Zod's `.datetime()` validation requires full ISO 8601 format with timezone
- This mismatch caused validation to fail with 400 Bad Request errors

## Solution Implemented

### 1. Updated Datetime Schema
Modified `src/infrastructure/web/validation/commonSchemas.js` to accept both formats:

```javascript
// Extracted constant for better maintainability
const DATETIME_LOCAL_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

// Updated schema to accept three formats
const dateTimeSchema = z.union([
  z.string().datetime(), // ISO 8601: "2026-12-31T10:00:00.000Z"
  z.string().regex(DATETIME_LOCAL_PATTERN)
    .transform(str => `${str}:00.000Z`), // datetime-local: "2026-12-31T10:00"
  z.date() // JavaScript Date objects
]);
```

### 2. Transformation Logic
The schema now automatically transforms datetime-local format to ISO 8601:
- Input: `"2026-12-31T10:00"`
- Output: `"2026-12-31T10:00:00.000Z"`

**Note**: The transformation treats the input as UTC time. This is documented in the schema comments for future reference.

### 3. Added Tests
Added comprehensive tests in `eventSchemas.test.js`:
- Validation of datetime-local format
- Validation of ISO 8601 format
- Verification of transformation to ISO 8601
- Tests for both create and update operations

## Test Results

All tests passing:
- ✅ Event schema validation tests: 23/23 passing
- ✅ Validation middleware tests: 13/13 passing  
- ✅ CreateEventUseCase tests: 11/11 passing
- ✅ UpdateEventUseCase tests: 18/18 passing
- ✅ All middleware tests: 41/41 passing
- ✅ CodeQL security scan: 0 alerts

## Files Changed

### Modified
- `src/infrastructure/web/validation/commonSchemas.js`
  - Updated `dateTimeSchema` to accept datetime-local format
  - Extracted `DATETIME_LOCAL_PATTERN` constant
  - Added comprehensive documentation

### Enhanced
- `src/infrastructure/web/validation/__tests__/eventSchemas.test.js`
  - Added tests for datetime-local format validation
  - Added tests for transformation verification

## Impact

### Before Fix
- ❌ Event creation failed with 400 error
- ❌ Event updates failed with 400 error
- ❌ Users couldn't use the React frontend for event management

### After Fix
- ✅ Event creation works correctly
- ✅ Event updates work correctly
- ✅ Both ISO 8601 and datetime-local formats accepted
- ✅ Automatic transformation ensures consistency
- ✅ No breaking changes to existing functionality

## Verification Steps

To verify the fix is working:

1. **Create an event**:
   ```bash
   curl -X POST http://localhost:3000/api/events \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <token>" \
     -d '{
       "title": "Test Event",
       "description": "Test Description",
       "dateTime": "2026-12-31T10:00",
       "totalSlots": 50
     }'
   ```
   Expected: 201 Created

2. **Update an event**:
   ```bash
   curl -X PUT http://localhost:3000/api/events/<id> \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <token>" \
     -d '{
       "dateTime": "2027-01-15T14:30"
     }'
   ```
   Expected: 200 OK

3. **Use React frontend**:
   - Navigate to Admin page
   - Click "Criar Evento"
   - Fill in form with datetime-local input
   - Submit form
   Expected: Success message and event created

## Security

- ✅ No vulnerabilities introduced
- ✅ CodeQL scan passed with 0 alerts
- ✅ Input validation remains strict
- ✅ Transformation logic is safe and deterministic
- ✅ No SQL injection or XSS vulnerabilities

## Performance Impact

- **Minimal overhead**: Regex matching and string concatenation are fast operations
- **No additional network calls**: Transformation happens during validation
- **No database impact**: Transformation occurs before data reaches the use case layer

## Future Considerations

1. **Timezone Handling**: Currently treats all datetime-local inputs as UTC. Future enhancement could:
   - Accept timezone information from client
   - Convert based on user's timezone preference
   - Store timezone information in the database

2. **API Documentation**: Update API documentation to specify:
   - Both formats are accepted
   - UTC timezone assumption for datetime-local format
   - Recommendation to use ISO 8601 for explicit timezone control

3. **Frontend Enhancement**: Consider updating React frontend to:
   - Display timezone information to users
   - Allow users to select their timezone
   - Convert times to user's local timezone for display

## Conclusion

This fix successfully resolves the 400 error issue when creating or updating events. The solution is minimal, well-tested, and doesn't introduce any breaking changes. Both legacy ISO 8601 format and new datetime-local format are supported, ensuring backward compatibility while fixing the immediate issue.

The implementation follows best practices:
- ✅ Minimal code changes
- ✅ Comprehensive testing
- ✅ Clear documentation
- ✅ Security verified
- ✅ No breaking changes
- ✅ Future-proof design
