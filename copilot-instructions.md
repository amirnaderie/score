# Copilot Instructions for Next.js + NestJS Application

## Project Architecture

This is a full-stack application with:
- **Frontend**: Next.js (App Router) with TypeScript
- **Backend**: NestJS API with TypeScript
- **Database**: SQL Server with TypeORM
- **Styling**: [Specify - Tailwind CSS/styled-components/etc.]

## General Code Quality Guidelines

### TypeScript Standards
- Use strict TypeScript configuration
- Prefer explicit type annotations for function parameters and return types
- Use interfaces over type aliases for object shapes
- Avoid `any` type - use proper typing or `unknown` when necessary
- Implement proper error handling with typed exceptions

### Code Style
- Use consistent naming conventions: camelCase for variables/functions, PascalCase for classes/interfaces
- Prefer functional components and hooks over class components (Next.js)
- Use async/await over Promise chains
- Implement proper error boundaries and error handling
- Keep functions small and focused (single responsibility)
- Use meaningful variable and function names

## Next.js Frontend Guidelines

### File Structure & Organization
- Follow Next.js 14+ App Router conventions
- Place components in `/components` directory with proper categorization
- Use `page.tsx`, `layout.tsx`, and `loading.tsx` appropriately
- Implement proper folder structure: `/app`, `/components`, `/lib`, `/types`

### Component Guidelines
- Use functional components with TypeScript interfaces for props
- Implement proper prop validation and default values
- Use React hooks appropriately (useState, useEffect, useCallback, useMemo)
- Prefer server components by default, use 'use client' only when necessary
- Implement proper loading states and error handling

### Performance & SEO
- Use Next.js Image component for images
- Implement proper meta tags and SEO optimization
- Use dynamic imports for code splitting when appropriate
- Implement proper caching strategies
- Use streaming and suspense for better UX

### State Management
- Use React hooks for local state
- Implement proper data fetching with React Query/SWR or native fetch
- Use context sparingly - prefer prop drilling for simple cases

## NestJS Backend Guidelines

### Architecture Patterns
- Follow NestJS modular architecture
- Use dependency injection properly
- Implement proper separation of concerns: Controllers, Services, Repositories
- Use DTOs for data validation and transformation
- Implement proper middleware and guards

### API Design
- Follow RESTful API conventions
- Use proper HTTP status codes
- Implement consistent error responses
- Use OpenAPI/Swagger documentation
- Validate all incoming data with class-validator

### Database & Data Access
- Use TypeORM entities with proper decorators (@Entity, @Column, @PrimaryGeneratedColumn)
- Define relationships using @OneToMany, @ManyToOne, @ManyToMany decorators
- Implement proper database migrations using TypeORM CLI
- Use Repository pattern for data access with @InjectRepository
- Use QueryBuilder for complex queries instead of raw SQL when possible
- Implement proper indexing on frequently queried columns
- Use transactions for complex operations with @Transaction decorator
- Handle SQL Server specific constraints and data types
- Use connection pooling for performance optimization
- Handle database errors gracefully with proper exception handling

### Security
- Implement proper authentication (JWT/Passport)
- Use guards for route protection
- Validate and sanitize all inputs
- Implement rate limiting
- Use HTTPS and proper CORS configuration
- Hash passwords with bcrypt

## Testing Guidelines

### Frontend Testing
- Use Jest and React Testing Library
- Test components in isolation
- Focus on user interactions and behavior
- Mock external dependencies properly
- Aim for meaningful test coverage, not 100%

### Backend Testing
- Use Jest for unit and integration tests
- Test controllers, services, and repositories separately
- Use in-memory SQLite or test SQL Server database for integration tests
- Mock TypeORM repositories using createMock or jest.mock
- Test database transactions and rollbacks
- Test error scenarios and SQL Server specific constraints
- Use TypeORM testing utilities for database setup and teardown

## Documentation Standards

- Use JSDoc comments for complex functions and classes
- Maintain up-to-date README files
- Document API endpoints with OpenAPI/Swagger
- Include setup and deployment instructions
- Document environment variables and configuration

## Code Review Focus Areas

When reviewing code, pay special attention to:

### Security
- Input validation and sanitization
- Authentication and authorization
- SQL injection and XSS prevention
- Proper secret management
- CORS and security headers

### Performance
- Database query optimization
- Proper caching implementation
- Bundle size optimization
- Memory leak prevention
- Proper error handling

### Maintainability
- Code organization and structure
- Consistent naming conventions
- Proper abstraction levels
- Reusable components and services
- Clear separation of concerns

## Environment-Specific Guidelines

### Development
- Use proper environment variables
- Implement hot reloading
- Use development-friendly error messages
- Enable detailed logging

### Production
- Optimize for performance
- Implement proper error logging
- Use SQL Server connection pooling and optimization
- Configure proper SQL Server indexes and query optimization
- Enable compression and caching
- Implement health checks including database connectivity
- Monitor SQL Server performance metrics

## Common Patterns to Follow

### Frontend Patterns
```typescript
// Proper component typing
interface ComponentProps {
  title: string;
  onClick: () => void;
  isLoading?: boolean;
}

// Server component data fetching
async function getData() {
  const res = await fetch('api/data', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}