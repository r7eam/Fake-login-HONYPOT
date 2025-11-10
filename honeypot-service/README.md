# Honeypot Service

A containerized honeypot microservice for capturing and logging fake admin login attempts.

## Overview

This service presents a realistic-looking admin login page and captures all login attempts for security research purposes. All credentials are hashed before storage, and events are logged in JSONL format for easy analysis.

## Features

- ✅ Realistic fake admin login page
- ✅ SHA-256 hashing of credentials (no plaintext storage)
- ✅ IP address capture with X-Forwarded-For support
- ✅ User agent and header collection
- ✅ JSONL event logging for easy parsing
- ✅ Docker containerization
- ✅ Health check endpoint
- ✅ Runs as non-root user for security

## Quick Start

### Prerequisites

- Docker installed on your system
- Access to the repository root

### Build the Container

```bash
# From the honeypot-service directory
docker build -t honeypot-service .
```

### Run the Container

```bash
# Run with volume mount for persistent data
docker run --rm -it \
  -v "$(pwd)/../data:/data" \
  -p 8081:8080 \
  honeypot-service
```

**Windows PowerShell:**
```powershell
docker run --rm -it -v "${PWD}\..\data:/data" -p 8081:8080 honeypot-service
```

### Test the Service

```bash
# Visit the fake login page
# Open browser: http://localhost:8081

# Test with curl
curl -X POST http://localhost:8081/fake-login \
  -d "username=admin&password=123456"

# Check health
curl http://localhost:8081/health
```

**Windows PowerShell:**
```powershell
# Test POST request
Invoke-WebRequest -Uri http://localhost:8081/fake-login -Method POST -Body @{username='admin';password='123456'}

# Check health
Invoke-WebRequest -Uri http://localhost:8081/health
```

## Event Log Format

Events are logged to `/data/honeypot_events.jsonl` in JSON Lines format:

```json
{
  "src_ip": "192.168.1.100",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
  "username_hash": "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918",
  "password_hash": "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92",
  "headers_sample": {
    "accept": "text/html,application/xhtml+xml",
    "accept-language": "en-US,en;q=0.9",
    "content-type": "application/x-www-form-urlencoded"
  },
  "received_at": "2025-11-09T10:30:45.123Z"
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Port the service listens on |
| `DATA_FILE` | `/data/honeypot_events.jsonl` | Path to event log file |
| `NODE_ENV` | `production` | Node environment |

## Endpoints

### `GET /`
Serves the fake admin login page.

### `POST /fake-login`
Accepts login attempts and logs them.

**Request Body:**
- `username` (string)
- `password` (string)

**Response:** 401 Unauthorized with error page

### `GET /health`
Health check endpoint for monitoring.

**Response:**
```json
{
  "status": "ok",
  "service": "honeypot",
  "timestamp": "2025-11-09T10:30:45.123Z"
}
```

## Security Considerations

1. **No Plaintext Storage**: Credentials are hashed with SHA-256 immediately
2. **Non-root User**: Container runs as unprivileged user (UID 1001)
3. **Restricted Permissions**: Data directory has 700 permissions
4. **No Database**: Simple file-based logging reduces attack surface
5. **Isolated Service**: Runs separately from main application

## Deployment Recommendations

### Production Deployment

1. **Use Subdomain**: Deploy to `admin.fullcraft.com` (not `/admin-login` path)
2. **HTTPS Required**: Use reverse proxy (nginx/traefik) with SSL
3. **Rate Limiting**: Add rate limiting to prevent DoS
4. **Log Rotation**: Implement log rotation for `honeypot_events.jsonl`
5. **Monitoring**: Set up alerts for unusual activity

### Example with Docker Compose

```yaml
version: '3.8'
services:
  honeypot:
    build: ./honeypot-service
    ports:
      - "8081:8080"
    volumes:
      - ./data:/data
    restart: unless-stopped
    environment:
      - PORT=8080
      - DATA_FILE=/data/honeypot_events.jsonl
```

### Example nginx Config (Subdomain)

```nginx
server {
    listen 443 ssl http2;
    server_name admin.fullcraft.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:8081;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Host $host;
    }
}
```

## Data Analysis

### View Recent Events

```bash
# Last 10 events
tail -n 10 ../data/honeypot_events.jsonl

# Pretty print
tail -n 10 ../data/honeypot_events.jsonl | jq '.'
```

### Count Events by IP

```bash
cat ../data/honeypot_events.jsonl | jq -r '.src_ip' | sort | uniq -c | sort -rn
```

### Extract Unique Username Hashes

```bash
cat ../data/honeypot_events.jsonl | jq -r '.username_hash' | sort -u
```

## Development

### Install Dependencies

```bash
npm install
```

### Run Locally (without Docker)

```bash
# Set environment variables
export DATA_FILE=../data/honeypot_events.jsonl
export PORT=8080

# Run
npm start
```

### Development Mode (with auto-reload)

```bash
npm run dev
```

## Troubleshooting

### Container won't start
- Check if port 8081 is already in use
- Verify data volume mount path is correct
- Check Docker logs: `docker logs <container-id>`

### Events not logging
- Verify `/data` directory exists and is mounted
- Check file permissions on host system
- Look for errors in container logs

### Can't access service
- Verify port mapping: `docker ps`
- Check firewall settings
- Test with curl from host machine

## License

This is a research project for graduate studies. Use responsibly and ethically.

## Support

For issues or questions, refer to the main project documentation or contact the project maintainer.
