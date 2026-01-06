# Events Platform - Testing Guide

## Manual Testing Steps

### Prerequisites
Before testing, you need a MongoDB database. Choose one option:

#### Option 1: MongoDB Atlas (Recommended for Testing)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a free cluster (M0)
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Update `.env` file:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/events?retryWrites=true&w=majority
   ```

#### Option 2: Docker (Local Testing)
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

#### Option 3: Local MongoDB Installation
```bash
# Ubuntu/Debian
sudo apt-get install mongodb
sudo systemctl start mongodb

# macOS
brew install mongodb-community
brew services start mongodb-community
```

### Starting the Application

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env and set your MONGODB_URI
   ```

3. **Start the server**:
   ```bash
   npm start
   ```

4. **Access the application**:
   - Main page: http://localhost:3000
   - Health check: http://localhost:3000/health

## API Testing with cURL

### 1. Health Check
```bash
curl http://localhost:3000/health
```

### 2. Create an Event
```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Workshop de Node.js",
    "description": "Aprenda Node.js do básico ao avançado",
    "dateTime": "2024-12-31T14:00:00",
    "totalSlots": 30
  }'
```

### 3. List All Events
```bash
curl http://localhost:3000/api/events
```

### 4. Get Event Details
```bash
# Replace EVENT_ID with the actual ID from step 2
curl http://localhost:3000/api/events/EVENT_ID
```

### 5. Register for an Event
```bash
curl -X POST http://localhost:3000/api/registrations \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "EVENT_ID",
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "(11) 98765-4321"
  }'
```

### 6. Cancel Registration
```bash
# Replace REGISTRATION_ID with the actual ID from step 5
curl -X POST http://localhost:3000/api/registrations/REGISTRATION_ID/cancel
```

## Frontend Testing

### Test Scenario 1: View Events List
1. Open browser to http://localhost:3000
2. Verify events are displayed in cards
3. Check responsive design by resizing browser
4. Verify "Create Event" button is visible

### Test Scenario 2: Create Event
1. Click "Create Event" button
2. Fill in the form:
   - Title: "Test Event"
   - Description: "This is a test event"
   - Date/Time: Select future date
   - Slots: 25
3. Click "Create Event"
4. Verify event appears in the list
5. Verify success feedback

### Test Scenario 3: View Event Details
1. Click "View Details" on any event
2. Verify all event information is displayed
3. Verify registration form is visible
4. Check available slots badge

### Test Scenario 4: Register for Event
1. On event details page, fill registration form:
   - Name: "Maria Santos"
   - Email: "maria@example.com"
   - Phone: "(11) 91234-5678"
2. Click "Register"
3. Verify success message appears
4. Verify "Cancel Registration" button appears
5. Verify available slots decreased by 1

### Test Scenario 5: Cancel Registration
1. After registering, click "Cancel Registration"
2. Confirm cancellation in the popup
3. Verify registration form reappears
4. Verify available slots increased by 1

### Test Scenario 6: Duplicate Registration
1. Register for an event
2. Try to register again with same email
3. Verify error message appears

### Test Scenario 7: Full Event
1. Create event with 1 slot
2. Register for the event
3. Try to register again (different email)
4. Verify "Slots Full" message

## Testing Validation

### Backend Validation Tests
```bash
# Test missing fields
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{"title": "Test"}'
# Expected: 400 error with validation message

# Test invalid slots
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test",
    "description": "Test",
    "dateTime": "2024-12-31T14:00:00",
    "totalSlots": 0
  }'
# Expected: 400 error with validation message
```

### Frontend Validation Tests
1. Try to create event with empty fields
2. Try to register with invalid email
3. Try to register with empty phone

## Architecture Verification

### Clean Architecture Layers
- ✅ **Domain Layer**: Pure business logic (entities, interfaces)
- ✅ **Application Layer**: Use cases (business rules)
- ✅ **Infrastructure Layer**: External concerns (DB, Web, etc.)

### SOLID Principles
- ✅ **Single Responsibility**: Each class/module has one job
- ✅ **Open/Closed**: Extensible via interfaces
- ✅ **Liskov Substitution**: Repository implementations are interchangeable
- ✅ **Interface Segregation**: Specific interfaces for each need
- ✅ **Dependency Inversion**: Dependencies injected, not hard-coded

### Code Quality
- ✅ **Clean Code**: Readable, self-documenting code
- ✅ **Separation of Concerns**: Clear layer boundaries
- ✅ **DRY Principle**: No code duplication
- ✅ **Naming Conventions**: Clear, descriptive names

## Performance Testing

### Load Testing with Apache Bench
```bash
# Test event listing endpoint
ab -n 100 -c 10 http://localhost:3000/api/events

# Test event creation
ab -n 50 -c 5 -p event.json -T application/json http://localhost:3000/api/events
```

## Security Testing

### Input Validation
- ✅ All inputs are validated
- ✅ Email format validation
- ✅ Required fields enforcement
- ✅ Type checking (numbers, dates)

### XSS Prevention
- ✅ HTML escaping in frontend
- ✅ Content-Type headers set correctly

### NoSQL Injection Prevention
- ✅ Mongoose schema validation
- ✅ No raw queries with user input

## Browser Compatibility

Test on:
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Responsive Design Testing

Test breakpoints:
- ✅ Mobile: 320px - 767px
- ✅ Tablet: 768px - 1023px
- ✅ Desktop: 1024px+

## Expected Results

All tests should pass with:
- ✅ No console errors
- ✅ Proper error messages shown to users
- ✅ Data persisted correctly in MongoDB
- ✅ UI responsive and functional
- ✅ API returns correct status codes
- ✅ Validation working as expected

## Troubleshooting

### Server won't start
- Check MongoDB is running
- Verify .env file exists and is configured
- Check port 3000 is available

### Database connection error
- Verify MONGODB_URI is correct
- Check MongoDB is accessible
- Verify network/firewall settings

### Frontend not loading
- Clear browser cache
- Check browser console for errors
- Verify server is running

### API errors
- Check request format (Content-Type: application/json)
- Verify all required fields are provided
- Check MongoDB connection
