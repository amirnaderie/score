# Correlation ID Implementation

## Overview
This implementation adds automatic correlation ID tracking to all requests in the application. Each incoming request is assigned a unique correlation ID that is propagated through all logs and services during the request lifecycle.

## How It Works

### 1. Correlation Middleware
- Generates a unique UUID for each incoming request
- Stores the correlation ID in AsyncLocalStorage for request-scoped access
- Adds the correlation ID to response headers for debugging

### 2. Correlation Service
- Provides methods to get/set the current correlation ID
- Uses AsyncLocalStorage to maintain request-scoped context
- Automatically injects correlation ID into log events

### 3. Log Integration
- All log events automatically include the correlation ID
- Correlation ID is stored in the database with each log entry
- Existing log calls require no changes

## Usage

### In Services/Controllers
```typescript
// The correlation ID is automatically available
constructor(private readonly correlationService: CorrelationService) {}

someMethod() {
  const correlationId = this.correlationService.getCorrelationId();
  // Use correlationId as needed
}
```

### In Logs
```typescript
// Logs automatically include correlation ID
this.eventEmitter.emit(
  'logEvent',
  new LogEvent({
    logTypes: logTypes.INFO,
    fileName: 'example.service',
    method: 'exampleMethod',
    message: 'Example log message',
    requestBody: JSON.stringify(data),
    stack: null,
  }),
);
```

## Testing
A test endpoint is available at `/correlation-test/test` to verify the implementation.