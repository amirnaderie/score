# Utility Service Implementation Summary

## Overview
This document summarizes the changes made to make the UtilityService available throughout the application.

## Changes Made

### 1. Created UtilityModule
- File: `src/utility/utility.module.ts`
- Purpose: To provide and export the UtilityService for use in other modules
- Content:
```typescript
import { Module } from '@nestjs/common';
import { UtilityService } from './utility.service';

@Module({
  providers: [UtilityService],
  exports: [UtilityService],
})
export class UtilityModule {}
```

### 2. Updated AppModule
- File: `src/app.module.ts`
- Purpose: To import UtilityModule and make UtilityService available globally
- Change: Added `UtilityModule` to the imports array

### 3. Updated ScoreModule
- File: `src/modules/score/score.module.ts`
- Purpose: To import UtilityModule and make UtilityService available to score module services
- Change: Added `UtilityModule` to the imports array

### 4. Updated ApiScoreService
- File: `src/modules/score/provider/api-score.service.ts`
- Purpose: To demonstrate usage of UtilityService in a service
- Changes:
  - Added import for UtilityService
  - Added UtilityService to the constructor for dependency injection
  - Fixed usage of createBranchCode function (parameter type correction)
  - Commented out problematic branch code validation that was using non-existent properties

### 5. Created Example Files
- Files:
  - `src/utility/utility-usage-example.service.ts` - Example service showing how to use all utility functions
  - `src/utility/utility-usage-example.module.ts` - Module for the example service
  - `src/utility/utility-demo.controller.ts` - Controller to test the functions via API
  - `src/utility/README.md` - Documentation on how to use the utility functions

## Available Utility Functions
1. `onlyLettersAndNumbers(str: string): boolean` - Validates Persian/English alphanumeric strings
2. `randomString(length: number = 12): string` - Generates random strings
3. `getPersianDate(date?: Date | number): string` - Converts to Persian date format
4. `toShamsi(dateInt: string | null | undefined): string` - Converts Gregorian to Shamsi date
5. `jalaliToDate(jalaliStr: string): Date` - Converts Shamsi to Gregorian date
6. `createBranchCode(branchCode: string): string` - Formats branch codes with "150" prefix

## How to Use UtilityService in Any Service

### 1. Import the service:
```typescript
import { UtilityService } from '../utility/utility.service';
```

### 2. Add it to your service constructor:
```typescript
constructor(private readonly utilityService: UtilityService) {}
```

### 3. Use any of the available functions:
```typescript
// Examples of using utility functions
const branchCode = this.utilityService.createBranchCode('123');
const isValid = this.utilityService.onlyLettersAndNumbers('Test123');
const randomStr = this.utilityService.randomString(10);
```

## Testing
You can test the utility functions by accessing the demo endpoint:
`GET /utility-demo/functions`

This endpoint demonstrates all available utility functions and their outputs.