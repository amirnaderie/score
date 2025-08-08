# ELK Integration for Score Backend

This document explains how to set up and use the ELK (Elasticsearch, Logstash, Kibana) integration for the Score Management System backend.

## Overview

The system now sends logs to both:
1. Local database (existing functionality)
2. ELK stack for centralized logging and analysis

## Setup Instructions

### 1. Prerequisites
Ensure your ELK stack is running with the following URLs:
- Elasticsearch: http://localhost:9200
- Kibana: http://localhost:5601
- Logstash: accepting logs on port 5044 and 12201/udp

### 2. Environment Configuration
The following environment variables are configured in your `.env` files:
```bash
ELASTICSEARCH_URL=http://localhost:9200
```

### 3. How Logs Are Sent

Logs are automatically sent to ELK when the `handleLogEvent` method is triggered by events. Each log includes:

- `fileName`: The source file where the log originated
- `logTypes`: Type/category of the log
- `message`: The actual log message
- `method`: The method/function name
- `stack`: Error stack trace (if applicable)
- `requestBody`: Request payload data
- `timestamp`: ISO timestamp
- `service`: Always set to 'score-backend'
- `environment`: Current environment (dev, stage, prod)

### 4. Kibana Index Pattern

In Kibana, you need to create an index pattern:
1. Go to Kibana: http://localhost:5601
2. Navigate to Stack Management > Index Patterns
3. Create index pattern: `score-logs-*`
4. Use `@timestamp` as the time field

### 5. Testing ELK Integration

You can test the ELK integration using the provided test service:

```typescript
// In any service or controller
import { ElkTestService } from './modules/event/elk-test.service';

// Then call:
await this.elkTestService.testElkLogging();
```

### 6. Log Levels

The system supports multiple log levels:
- `info`: General information logs
- `error`: Error logs with stack traces
- `warn`: Warning logs
- `debug`: Debug information

### 7. Custom Logging

To add custom logging to your services:

```typescript
import { ElkLoggerService } from './modules/event/elk-logger.service';

constructor(private readonly elkLoggerService: ElkLoggerService) {}

async yourMethod() {
  await this.elkLoggerService.info({
    message: 'Your custom log message',
    customField: 'your data',
    userId: user.id, // if applicable
  });
}
```

### 8. Log Format

Logs are sent in JSON format with the following structure:
```json
{
  "message": "Log message",
  "level": "info",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "fileName": "user.controller.ts",
  "logTypes": "API_REQUEST",
  "method": "createUser",
  "stack": "Error stack trace...",
  "requestBody": {...},
  "service": "score-backend",
  "environment": "dev"
}
```

### 9. Troubleshooting

If logs are not appearing in Kibana:
1. Check Elasticsearch is running: `curl http://localhost:9200`
2. Verify the ELASTICSEARCH_URL in your environment file
3. Check application logs for any ELK connection errors
4. Ensure the index pattern is correctly configured in Kibana

### 10. Performance Considerations

- Logs are sent asynchronously to avoid blocking the main application
- Failed ELK connections are logged but don't affect application flow
- Consider adjusting log levels in production to reduce noise

## Configuration Files

- `elk-logger.service.ts`: Main ELK logging service
- `event.handler.ts`: Modified to send logs to both database and ELK
- Environment files: Updated with ELASTICSEARCH_URL