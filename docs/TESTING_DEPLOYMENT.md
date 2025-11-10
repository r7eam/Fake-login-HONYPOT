# Honeypot Service - Testing & Deployment Guide

## Phase 1 Complete ✅

This document provides step-by-step instructions for testing and deploying the honeypot service.

## Quick Test (Local - No Docker)

If you want to test the service quickly without Docker:

```bash
# Navigate to honeypot-service
cd honeypot-service

# Install dependencies
npm install

# Set environment variables (PowerShell)
$env:DATA_FILE="../data/honeypot_events.jsonl"
$env:PORT="8080"

# Run the service
npm start
```

Then open your browser to `http://localhost:8080` and try logging in with fake credentials.

## Docker Testing

### Step 1: Build the Docker Image

```powershell
# Navigate to honeypot-service directory
cd honeypot-service

# Build the image
docker build -t honeypot-service .
```

Expected output:
```
[+] Building X.Xs (XX/XX) FINISHED
Successfully built <image-id>
Successfully tagged honeypot-service:latest
```

### Step 2: Run the Container

**Option A: Using docker run**

```powershell
# Run with volume mount for persistent data
docker run --rm -it -v "${PWD}\..\data:/data" -p 8081:8080 honeypot-service
```

**Option B: Using docker-compose (Recommended)**

```powershell
# From repository root
docker-compose -f docker-compose.honeypot.yml up -d
```

### Step 3: Verify Service is Running

```powershell
# Check running containers
docker ps

# Check health
Invoke-WebRequest -Uri http://localhost:8081/health

# View logs
docker logs honeypot-service
```

### Step 4: Test the Fake Login

**Test 1: Visit in Browser**
- Open browser to `http://localhost:8081`
- You should see a professional-looking admin login page
- Try logging in with: username=`admin`, password=`password123`
- You should see an error page

**Test 2: Use PowerShell**

```powershell
# Test POST request
Invoke-WebRequest -Uri http://localhost:8081/fake-login `
  -Method POST `
  -Body @{username='admin'; password='password123'} `
  -ContentType 'application/x-www-form-urlencoded'
```

**Test 3: Use curl (if installed)**

```bash
curl -X POST http://localhost:8081/fake-login \
  -d "username=admin&password=password123"
```

### Step 5: Verify Event Logging

Check that events are being logged to the JSONL file:

```powershell
# View the log file
Get-Content ..\data\honeypot_events.jsonl

# Pretty print last event (requires jq - optional)
Get-Content ..\data\honeypot_events.jsonl | Select-Object -Last 1
```

Expected log entry format:
```json
{
  "src_ip": "172.17.0.1",
  "user_agent": "Mozilla/5.0...",
  "username_hash": "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918",
  "password_hash": "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92",
  "headers_sample": {...},
  "received_at": "2025-11-09T..."
}
```

### Step 6: Test Multiple Scenarios

Test various scenarios to ensure robustness:

```powershell
# Test 1: Empty credentials
Invoke-WebRequest -Uri http://localhost:8081/fake-login -Method POST -Body @{username=''; password=''}

# Test 2: Special characters
Invoke-WebRequest -Uri http://localhost:8081/fake-login -Method POST -Body @{username='admin@example.com'; password='P@ssw0rd!'}

# Test 3: SQL injection attempt (safely logged)
Invoke-WebRequest -Uri http://localhost:8081/fake-login -Method POST -Body @{username="admin' OR '1'='1"; password='anything'}

# Test 4: Long credentials
Invoke-WebRequest -Uri http://localhost:8081/fake-login -Method POST -Body @{username='a'*100; password='b'*100}
```

### Step 7: Verify Hashing

Verify that credentials are properly hashed (not stored in plaintext):

```powershell
# Check that no plaintext appears in logs
Get-Content ..\data\honeypot_events.jsonl | Select-String -Pattern "admin" -NotMatch
Get-Content ..\data\honeypot_events.jsonl | Select-String -Pattern "password123" -NotMatch

# The hashes should be present instead
Get-Content ..\data\honeypot_events.jsonl | Select-String -Pattern "_hash"
```

## Production Deployment

### Prerequisites

1. **Domain/Subdomain**: Set up DNS for `admin.fullcraft.com`
2. **SSL Certificate**: Obtain SSL cert (Let's Encrypt recommended)
3. **Reverse Proxy**: nginx or traefik
4. **Server**: VPS or cloud instance with Docker installed

### Deployment Steps

#### 1. Prepare the Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose -y
```

#### 2. Transfer Files

```bash
# Clone repository or upload files
git clone <your-repo-url>
cd <repo-name>
```

#### 3. Set Up nginx Reverse Proxy

Create `/etc/nginx/sites-available/admin.fullcraft.com`:

```nginx
server {
    listen 80;
    server_name admin.fullcraft.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name admin.fullcraft.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/admin.fullcraft.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.fullcraft.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Logging
    access_log /var/log/nginx/honeypot-access.log;
    error_log /var/log/nginx/honeypot-error.log;

    location / {
        proxy_pass http://localhost:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/admin.fullcraft.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 4. Get SSL Certificate

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d admin.fullcraft.com
```

#### 5. Deploy with Docker Compose

```bash
# Start the service
docker-compose -f docker-compose.honeypot.yml up -d

# Verify it's running
docker ps
docker logs honeypot-service
```

#### 6. Set Up Log Rotation

Create `/etc/logrotate.d/honeypot`:

```
/path/to/repo/data/honeypot_events.jsonl {
    daily
    rotate 180
    compress
    delaycompress
    notifempty
    create 0600 honeypot honeypot
    postrotate
        docker restart honeypot-service
    endscript
}
```

#### 7. Set Up Monitoring (Optional)

Create a simple monitoring script `/usr/local/bin/honeypot-monitor.sh`:

```bash
#!/bin/bash
if ! curl -f http://localhost:8081/health > /dev/null 2>&1; then
    echo "Honeypot service is down! Restarting..."
    docker-compose -f /path/to/repo/docker-compose.honeypot.yml restart
    # Send alert email
    echo "Honeypot service restarted at $(date)" | mail -s "Honeypot Alert" your@email.com
fi
```

Add to crontab:
```bash
*/5 * * * * /usr/local/bin/honeypot-monitor.sh
```

## Verification Checklist

After deployment, verify:

- [ ] Service is accessible at `https://admin.fullcraft.com`
- [ ] SSL certificate is valid (green padlock in browser)
- [ ] Login page renders correctly
- [ ] POST requests create log entries
- [ ] Credentials are hashed (not plaintext)
- [ ] X-Forwarded-For header is captured correctly
- [ ] Health check endpoint responds: `/health`
- [ ] Log file permissions are restrictive (600 or 700)
- [ ] Container restarts automatically if it crashes
- [ ] Logs are rotating properly

## Troubleshooting

### Service won't start
```powershell
# Check logs
docker logs honeypot-service

# Check if port is in use
netstat -ano | findstr :8081

# Rebuild image
docker-compose -f docker-compose.honeypot.yml build --no-cache
```

### No events being logged
```powershell
# Check data directory permissions
# Ensure the directory is writable by the container

# Check container logs for errors
docker logs honeypot-service -f

# Verify volume mount
docker inspect honeypot-service | Select-String -Pattern "Mounts" -Context 5
```

### Wrong IP address captured
- Ensure nginx/proxy sets `X-Forwarded-For` header
- Check proxy configuration
- Test with: `curl -H "X-Forwarded-For: 1.2.3.4" http://localhost:8081/fake-login`

## Next Steps (Future Phases)

1. **Analytics Dashboard**: Build a web UI to visualize attack patterns
2. **Email Alerts**: Send notifications for suspicious activity
3. **GeoIP Integration**: Track geographic origin of attacks
4. **Rate Limiting**: Prevent DoS attacks on the honeypot
5. **Machine Learning**: Detect anomalous patterns
6. **Integration with SIEM**: Export events to security tools

## Graduate Project Documentation

For your graduate project, document:

1. **Architecture Diagram**: Show how honeypot fits in infrastructure
2. **Data Flow**: From attacker → honeypot → logs → analysis
3. **Security Analysis**: Types of attacks captured, patterns observed
4. **Statistical Analysis**: Charts, graphs, trends
5. **Lessons Learned**: What you discovered about attack patterns

## Support

If you encounter issues:
1. Check container logs: `docker logs honeypot-service`
2. Verify file permissions on `data/` directory
3. Test locally first before deploying to production
4. Review the README.md in honeypot-service/

---

**Phase 1 Status**: ✅ COMPLETE  
**Deliverable**: Working container that writes JSONL to `data/honeypot_events.jsonl`
