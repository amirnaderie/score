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
#COPY .env.prod ./  
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

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

# Don't copy all env files - let docker-compose handle environment
# COPY --from=builder --chown=nestjs:nodejs /app/.env.prod ./  

# Expose the port the app runs on
EXPOSE 5004

# Set the user to run the application
USER nestjs

# Start the application
#CMD npm run start:${ENV}
CMD ["node", "dist/main"]