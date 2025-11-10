FROM node:18-alpine

# Create non-root user
RUN addgroup -S honeypot && adduser -S honeypot -G honeypot

WORKDIR /app

# Copy package manifest first to leverage Docker cache
COPY package.json package-lock.json* ./

# Install deps
RUN npm ci --only=production

# Copy app code
COPY app.js ./

# Install curl for healthcheck
RUN apk add --no-cache curl

# Create data mount point and ensure permissions
RUN mkdir -p /data && chown -R honeypot:honeypot /data

# Run as non-root
USER honeypot

ENV PORT=8080
EXPOSE 8080

CMD ["node", "app.js"]
