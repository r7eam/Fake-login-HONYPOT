# Honeypot Stack Deployment Guide

## Overview

Complete deployment of the integrated honeypot stack with enrichment and alerting.

## Services

| Service | Purpose | Port | Auto-Start |
|---------|---------|------|------------|
| **nginx** | Reverse proxy | 80 | Yes |
| **honeypot** | Fake login trap | 8080 | Yes |
| **enrich** | Event enrichment | 9090 (metrics) | Yes |
| **alerts** | Slack notifications | - | Yes |
| **prometheus** | Metrics collection | 9091 | Optional |

---

## Prerequisites

### 1. Install Docker

```powershell
# Verify Docker is installed
docker --version
docker-compose --version
```

### 2. Download MaxMind Databases

```powershell
# Get your MaxMind account credentials from:
# https://www.maxmind.com/en/geolite2/signup

.\download-maxmind.ps1 -AccountId "YOUR_ID" -LicenseKey "YOUR_KEY"

# Verify databases downloaded
ls ./data/GeoLite2-*.mmdb
```

### 3. Configure Environment

```powershell
# Copy example environment file
cp .env.example .env

# Edit .env and add your Slack webhook URL
notepad .env
```

**Get Slack Webhook URL:**
1. Go to https://api.slack.com/messaging/webhooks
2. Create a new webhook for your workspace
3. Copy the webhook URL
4. Add to `.env`: `SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...`

---

## Deployment

### Full Stack Deployment

```powershell
# Create data directory
mkdir -p data

# Start all services
docker-compose -f docker-compose.honeypot.yml up -d

# Verify services running
docker-compose -f docker-compose.honeypot.yml ps
```

**Expected output:**
```
NAME                    STATUS              PORTS
fullcraft_honeypot      Up (healthy)        
fullcraft_honeypot_nginx Up (healthy)       0.0.0.0:80->80/tcp
fullcraft_enrich        Up (healthy)        
fullcraft_alerts        Up                  
```

### View Logs

```powershell
# All services
docker-compose -f docker-compose.honeypot.yml logs -f

# Specific service
docker logs -f fullcraft_honeypot
docker logs -f fullcraft_enrich
docker logs -f fullcraft_alerts
```

### Health Checks

```powershell
# Honeypot health
curl http://localhost:8080/healthz

# Enrichment worker metrics
curl http://localhost:9090/health
curl http://localhost:9090/metrics

# Nginx proxy
curl http://localhost/
```

---

## Testing

### 1. Generate Test Events

```powershell
# Send fake login attempt
curl -X POST http://localhost/fake-login `
  -H "Content-Type: application/json" `
  -d '{"username":"admin","password":"password123"}'

# Send multiple attempts (trigger alert)
for ($i=1; $i -le 15; $i++) {
    curl -X POST http://localhost/fake-login `
      -H "Content-Type: application/json" `
      -d "{\"username\":\"admin\",\"password\":\"test$i\"}" `
      -s -o $null
    Write-Host "Attempt $i sent"
}
```

### 2. Verify Event Capture

```powershell
# Check raw events
Get-Content ./data/honeypot_events.jsonl | Select-Object -Last 5 | jq

# Check enriched events
Get-Content ./data/honeypot_enriched.jsonl | Select-Object -Last 5 | jq
```

### 3. Check Enrichment

```powershell
# View enrichment worker logs
docker logs fullcraft_enrich --tail 50

# Check metrics
curl http://localhost:9090/metrics/json | jq
```

### 4. Verify Alerts

```powershell
# View alert service logs
docker logs fullcraft_alerts --tail 50

# Should see alert messages after 10+ attempts from same IP
```

---

## Optional: Prometheus Monitoring

```powershell
# Start with monitoring profile
docker-compose -f docker-compose.honeypot.yml --profile monitoring up -d

# Access Prometheus UI
open http://localhost:9091

# View enrichment metrics
# - Go to Graph tab
# - Query: rate(processed_events_total[5m])
# - Query: cache_hit_rate_percent
```

---

## Service Management

### Restart Services

```powershell
# Restart all
docker-compose -f docker-compose.honeypot.yml restart

# Restart specific service
docker-compose -f docker-compose.honeypot.yml restart enrich
docker-compose -f docker-compose.honeypot.yml restart alerts
```

### Stop Services

```powershell
# Stop all
docker-compose -f docker-compose.honeypot.yml stop

# Stop and remove containers
docker-compose -f docker-compose.honeypot.yml down
```

### Update and Rebuild

```powershell
# Rebuild after code changes
docker-compose -f docker-compose.honeypot.yml build

# Rebuild and restart
docker-compose -f docker-compose.honeypot.yml up -d --build
```

---

## Data Management

### Backup Data

```powershell
# Backup enriched events and state
tar -czf honeypot-backup-$(Get-Date -Format "yyyyMMdd").tar.gz `
  ./data/honeypot_enriched.jsonl `
  ./data/enrich_state.db `
  ./data/cache/

# Upload to cloud storage (example: Azure Blob)
az storage blob upload `
  --account-name yourstorage `
  --container-name honeypot-backups `
  --file honeypot-backup-*.tar.gz
```

### Clean Old Data

```powershell
# Archive events older than 30 days
$cutoff = (Get-Date).AddDays(-30).ToString("yyyy-MM-dd")
Get-Content ./data/honeypot_events.jsonl | ForEach-Object {
    $event = $_ | ConvertFrom-Json
    if ($event.received_at -gt $cutoff) {
        $_ | Add-Content ./data/honeypot_events_new.jsonl
    }
}
Move-Item ./data/honeypot_events_new.jsonl ./data/honeypot_events.jsonl -Force
```

### Reset State (Testing Only!)

```powershell
# Stop enrichment worker
docker-compose -f docker-compose.honeypot.yml stop enrich

# Delete state database
Remove-Item ./data/enrich_state.db -Force

# Delete cache
Remove-Item -Recurse -Force ./data/cache/*

# Restart (will reprocess all events)
docker-compose -f docker-compose.honeypot.yml start enrich
```

---

## Troubleshooting

### Enrichment Worker Not Processing

**Symptoms:**
- No entries in `honeypot_enriched.jsonl`
- `processed_events_total` metric not increasing

**Solutions:**

```powershell
# Check worker logs
docker logs fullcraft_enrich --tail 100

# Verify input file exists and is readable
ls -l ./data/honeypot_events.jsonl

# Check file permissions
icacls ./data/honeypot_events.jsonl

# Verify MaxMind databases
ls -l ./data/GeoLite2-*.mmdb

# Check metrics
curl http://localhost:9090/metrics/json | jq '.counters'
```

### Alerts Not Sending

**Symptoms:**
- No Slack messages despite threshold exceeded
- Alert logs show "would alert" messages

**Solutions:**

```powershell
# Check Slack webhook configured
docker exec fullcraft_alerts env | grep SLACK_WEBHOOK

# Test webhook manually
$webhook = "YOUR_WEBHOOK_URL"
$body = @{text="Test alert from honeypot"} | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri $webhook -Body $body -ContentType "application/json"

# Verify alert service running
docker logs fullcraft_alerts --tail 50

# Check enriched log exists
ls -l ./data/honeypot_enriched.jsonl
```

### High Memory Usage

**Symptoms:**
- Container restarts due to OOM
- Slow enrichment processing

**Solutions:**

```powershell
# Check container stats
docker stats

# Increase memory limits in docker-compose.honeypot.yml
# Edit resources.limits.memory for enrich service

# Reduce cache size
# Edit .env: CACHE_MAX_SIZE=5000

# Disable rDNS (expensive)
# Edit .env: RDNS_ENABLED=false

# Restart services
docker-compose -f docker-compose.honeypot.yml restart enrich
```

### MaxMind Database Errors

**Symptoms:**
- Errors: "AddressNotFoundError" for all IPs
- No geo/asn data in enriched events

**Solutions:**

```powershell
# Re-download databases
.\download-maxmind.ps1 -AccountId "YOUR_ID" -LicenseKey "YOUR_KEY"

# Verify databases valid
file ./data/GeoLite2-City.mmdb
# Should show: "MaxMind DB database data"

# Restart enrichment worker
docker-compose -f docker-compose.honeypot.yml restart enrich
```

---

## Performance Tuning

### Low Volume (<100 events/hour)

Edit `.env`:
```bash
PROCESS_INTERVAL=60    # Poll every minute
BATCH_SIZE=10
MAX_WORKERS=1
CACHE_MAX_SIZE=1000
```

### Medium Volume (100-1000 events/hour)

Edit `.env`:
```bash
PROCESS_INTERVAL=15    # Poll every 15 seconds
BATCH_SIZE=100
MAX_WORKERS=4
CACHE_MAX_SIZE=10000
```

### High Volume (>1000 events/hour)

Edit `.env`:
```bash
PROCESS_INTERVAL=5     # Poll every 5 seconds
BATCH_SIZE=1000
MAX_WORKERS=8
CACHE_MAX_SIZE=50000
RDNS_ENABLED=false     # Disable slow rDNS lookups
```

---

## Security Checklist

- [ ] All services run as non-root users
- [ ] Read-only root filesystems enabled
- [ ] Network isolation configured (DNS egress only for enrich)
- [ ] Resource limits set for all services
- [ ] Health checks enabled
- [ ] Slack webhook stored in `.env` (not in git)
- [ ] Log rotation configured
- [ ] Backups automated
- [ ] Firewall rules restrict external access to port 80/443 only

---

## Monitoring

### Key Metrics to Watch

```powershell
# Processing rate
curl http://localhost:9090/metrics | grep processed_events_total

# Error rate
curl http://localhost:9090/metrics | grep error_events_total

# Cache effectiveness
curl http://localhost:9090/metrics | grep cache_hit_rate

# Queue size (backpressure)
curl http://localhost:9090/metrics | grep processing_queue_size

# Latency
curl http://localhost:9090/metrics | grep processing_latency
```

### Grafana Dashboard (Optional)

If you have Grafana installed:

1. Add Prometheus data source: `http://localhost:9091`
2. Import dashboard from `prometheus/grafana-dashboard.json` (to be created)
3. View real-time enrichment metrics

---

## Production Deployment

### 1. Domain Configuration

```powershell
# Add DNS A record
# admin.fullcraft.com -> YOUR_SERVER_IP

# Update nginx config
# Edit nginx/conf.d/honeypot.conf
# Change server_name to admin.fullcraft.com
```

### 2. SSL Certificates

```powershell
# Get Let's Encrypt certificate
certbot certonly --standalone -d admin.fullcraft.com

# Copy certificates to nginx
cp /etc/letsencrypt/live/admin.fullcraft.com/fullchain.pem ./nginx/certs/
cp /etc/letsencrypt/live/admin.fullcraft.com/privkey.pem ./nginx/certs/

# Enable HTTPS in docker-compose.honeypot.yml
# Uncomment port 443 mapping

# Restart nginx
docker-compose -f docker-compose.honeypot.yml restart nginx
```

### 3. Firewall Rules

```powershell
# Allow HTTP/HTTPS only
netsh advfirewall firewall add rule name="HTTP" dir=in action=allow protocol=TCP localport=80
netsh advfirewall firewall add rule name="HTTPS" dir=in action=allow protocol=TCP localport=443

# Block all other inbound
# (Configure based on your firewall)
```

### 4. Log Rotation

```powershell
# Install logrotate config
sudo cp enrich/logrotate.conf /etc/logrotate.d/honeypot

# Test rotation
sudo logrotate -d /etc/logrotate.d/honeypot
```

---

## Support

**Documentation:**
- Architecture: `docs/ARCHITECTURE.md`
- Security: `docs/SECURITY_HARDENING.md`
- Operations: `docs/OPERATIONS.md`
- Quick Reference: `HARDENING_QUICKREF.md`

**Health Checks:**
- Honeypot: http://localhost:8080/healthz
- Enrichment: http://localhost:9090/health
- Metrics: http://localhost:9090/metrics

**Logs:**
```powershell
docker-compose -f docker-compose.honeypot.yml logs -f
```
