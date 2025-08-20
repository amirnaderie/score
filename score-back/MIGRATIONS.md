# Database Migrations Guide

## Overview

This project uses TypeORM migrations to manage database schema changes. Migrations allow for version control of your database schema and provide a way to apply and revert changes in a controlled manner.

## Available Migration Commands

```bash
# Generate a new migration based on entity changes
npm run migration:generate -- -n MigrationName

# Run pending migrations
npm run migration:run

# Revert the most recent migration
npm run migration:revert
```

## Migration Files

Migration files are stored in the `src/migrations` directory. Each migration file contains:

- An `up` method that applies the changes
- A `down` method that reverts the changes

## Configuration

Migrations are configured in the TypeORM configuration file (`src/config/typeorm.config.ts`). The following settings control migration behavior:

- `migrations`: Path to migration files
- `migrationsRun`: Whether to automatically run migrations on application startup (controlled by the `RUN_MIGRATIONS` environment variable)

## Environment Variables

- `RUN_MIGRATIONS`: Set to `true` to automatically run migrations when the application starts
- `DB_ALLOW_SYNC_WITH_TYPEORM`: Controls TypeORM's synchronize feature (should be `false` in production)

## Best Practices

1. Always test migrations in a development environment before applying them to production
2. Keep migrations small and focused on specific changes
3. Ensure that both `up` and `down` methods are properly implemented
4. Use descriptive names for migration files
5. Document complex migrations with comments