# Multi-stage build for NestJS application
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder

# Set timezone
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Asia/Tehran /etc/localtime && \
    echo "Asia/Tehran" > /etc/timezone && \
    apk del tzdata

ENV TZ=Asia/Tehran

WORKDIR /app

# Copy package files and install all dependencies (including dev for build)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Compile datasource.ts to JavaScript for production use
RUN npx tsc src/config/datasource.ts --outDir dist --target es2020 --module commonjs --esModuleInterop --allowSyntheticDefaultImports --skipLibCheck --resolveJsonModule

# Production image, copy all the files and run the app
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy only production dependencies from deps stage
COPY --from=deps --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copy the built application
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json

# Create startup script using compiled JavaScript (no TypeScript needed)
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'set -e' >> /app/start.sh && \
    echo 'echo "Running database migrations..."' >> /app/start.sh && \
    echo 'npx typeorm migration:run -d dist/config/datasource.js' >> /app/start.sh && \
    echo 'MIGRATION_EXIT_CODE=$?' >> /app/start.sh && \
    echo 'if [ $MIGRATION_EXIT_CODE -eq 0 ]; then' >> /app/start.sh && \
    echo '  echo "Migrations completed successfully. Starting application..."' >> /app/start.sh && \
    echo 'else' >> /app/start.sh && \
    echo '  echo "Migration failed with exit code $MIGRATION_EXIT_CODE"' >> /app/start.sh && \
    echo '  exit $MIGRATION_EXIT_CODE' >> /app/start.sh && \
    echo 'fi' >> /app/start.sh && \
    echo 'exec node dist/main' >> /app/start.sh && \
    chmod +x /app/start.sh

# Change ownership of the startup script
RUN chown nestjs:nodejs /app/start.sh

# Expose the port the app runs on
EXPOSE 5004

# Set the user to run the application
USER nestjs

# Start the application with migrations
CMD ["/app/start.sh"]