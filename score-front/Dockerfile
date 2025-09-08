# Use a Node.js image as the base for building
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies (production + dev dependencies for build)
RUN npm ci --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Use a smaller image for the final runtime
FROM node:20-alpine AS runner

WORKDIR /app

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set timezone (more efficient approach)
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Asia/Tehran /etc/localtime && \
    echo "Asia/Tehran" > /etc/timezone && \
    apk del tzdata

# Install only production dependencies for runtime
COPY --from=builder /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application from builder
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
#COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./next.config.js


# Switch to non-root user
USER nextjs

EXPOSE 3002

# Keep your dynamic command
CMD npm run start:prod

# docker build -t score-front:v1.0.4 .
# docker save score-front > score-front1.0.12.tar