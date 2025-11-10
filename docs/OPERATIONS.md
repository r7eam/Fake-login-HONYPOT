# Enrichment Worker - Operational Runbook

## Quick Start

### Production Deployment

```bash
# 1. Download MaxMind databases
.\download-maxmind.ps1 -AccountId "YOUR_ID" -LicenseKey "YOUR_KEY"

# 2. Configure environment
cp .env.example .env
# Edit .env with your settings

# 3. Start services
docker-compose up -d enrich

# 4. Verify metrics
curl http://localhost:9090/health
curl http://localhost:9090/metrics
```

---

## Architecture Overview

```
┌─────────────────┐
│  Honeypot       │
│  Service        │──┐
└─────────────────┘  │
                     ├──> honeypot_events.jsonl (raw)
                     │
                     ▼
┌─────────────────────────────────────────────┐
│  Enrichment Worker                          │
│  ┌───────────────┐  ┌──────────────┐       │
│  │ State Manager │  │ Cache Manager│       │
│  │  (SQLite)     │  │  (LRU+TTL)   │       │
│  └───────────────┘  └──────────────┘       │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ Batch Processor (ThreadPoolExecutor)  │ │
│  └───────────────────────────────────────┘ │
│          │                                  │
│          ├──> GeoIP Lookup (MaxMind)       │
│          ├──> ASN Lookup (MaxMind)         │
│          ├──> Reverse DNS (Timeout: 2s)    │
│          └──> Attack Tagging (Rules)       │
│                                             │
│  ┌───────────────┐  ┌──────────────┐       │
│  │ Atomic Writer │  │ Metrics      │       │
│  │  (fsync)      │  │  :9090       │       │
│  └───────────────┘  └──────────────┘       │
└─────────────────────────────────────────────┘
                     │
                     ├──> honeypot_enriched.jsonl
                     └──> enrich_state.db
```

---

## Common Operations

### 1. Check Worker Status

```bash
# Docker status
docker ps | grep enrich

# Container logs (last 50 lines)
docker logs enrich --tail 50 -f

# Health check
curl http://localhost:9090/health
# Expected: "OK"

# Metrics (JSON format)
curl http://localhost:9090/metrics/json | jq
```

### 2. Monitor Performance

```bash
# Prometheus metrics
curl http://localhost:9090/metrics

# Key metrics to watch:
# - processed_events_total: Total enriched
# - error_events_total: Total errors
# - processing_queue_size: Backpressure (should be <1000)
# - cache_hit_rate_percent: Cache effectiveness (target: >70%)
# - processing_latency_seconds: p90 latency (target: <0.1s)
```

**Grafana Dashboard:**

```json
{
  "title": "Enrichment Worker",
  "panels": [
    {
      "title": "Events Processed",
      "targets": [{"expr": "rate(processed_events_total[5m])"}]
    },
    {
      "title": "Error Rate",
      "targets": [{"expr": "rate(error_events_total[5m])"}]
    },
    {
      "title": "Cache Hit Rate",
      "targets": [{"expr": "cache_hit_rate_percent"}]
    },
    {
      "title": "Processing Latency (p90)",
      "targets": [{"expr": "processing_latency_seconds{quantile=\"0.9\"}"}]
    }
  ]
}
```

### 3. Restart Worker

```bash
# Graceful restart (waits for current batch)
docker restart enrich

# Force restart (immediate)
docker kill enrich
docker start enrich

# Check state preserved
docker exec enrich cat /data/enrich_state.db
# Should exist and contain state
```

### 4. Reset State (Clear All History)

```bash
# Stop worker
docker stop enrich

# Delete state database
rm ./data/enrich_state.db

# Delete cache
rm -rf ./data/cache/*

# Restart (processes all events from beginning)
docker start enrich
```

**WARNING:** Only use for testing or data migrations!

### 5. Update MaxMind Databases

```bash
# Download latest databases
.\download-maxmind.ps1 -AccountId "YOUR_ID" -LicenseKey "YOUR_KEY"

# Restart worker to reload databases
docker restart enrich

# Verify new database loaded
docker logs enrich | grep "GeoIP database loaded"
```

**Automation (weekly cron):**

```cron
# Update MaxMind databases every Sunday at 2 AM
0 2 * * 0 /path/to/download-maxmind.ps1 && docker restart enrich
```

### 6. Backup Data

```bash
# Backup enriched events (compressed)
tar -czf enriched-backup-$(date +%Y%m%d).tar.gz \
  ./data/honeypot_enriched.jsonl \
  ./data/enrich_state.db \
  ./data/cache/

# Upload to S3
aws s3 cp enriched-backup-*.tar.gz s3://honeypot-backups/

# Verify backup
tar -tzf enriched-backup-*.tar.gz
```

### 7. Restore from Backup

```bash
# Stop worker
docker stop enrich

# Restore files
tar -xzf enriched-backup-20251110.tar.gz -C ./

# Restart worker
docker start enrich

# Verify restored
docker logs enrich | grep "Resuming from offset"
```

---

## Troubleshooting

### Worker Not Processing Events

**Symptoms:**
- `processed_events_total` not increasing
- Queue size growing
- No logs in output

**Diagnosis:**

```bash
# Check if input file exists
ls -lh ./data/honeypot_events.jsonl

# Check file permissions
stat ./data/honeypot_events.jsonl
# Should be readable by UID 1001 (enrich user)

# Check worker logs
docker logs enrich --tail 100

# Check state DB
docker exec enrich sqlite3 /data/enrich_state.db \
  "SELECT * FROM processing_state;"
```

**Solutions:**

```bash
# Fix file permissions
chown 1001:1001 ./data/honeypot_events.jsonl

# Reset state if stuck
docker exec enrich rm /data/enrich_state.db
docker restart enrich

# Increase log verbosity
docker run -e LOG_LEVEL=DEBUG enrich
```

### High Error Rate

**Symptoms:**
- `error_events_total` increasing rapidly
- Alert: "HighErrorRate"

**Diagnosis:**

```bash
# Check error breakdown
curl http://localhost:9090/metrics/json | jq '.counters.errors_by_type'

# Common errors:
# - geoip_lookup: Missing/corrupt MaxMind DB
# - parse_error: Malformed JSON in input
# - dns_timeout: Network issues
```

**Solutions:**

```bash
# GeoIP errors: Update databases
.\download-maxmind.ps1

# Parse errors: Validate input file
jq -c '.' ./data/honeypot_events.jsonl | head

# DNS errors: Increase timeout or disable rDNS
docker run -e RDNS_ENABLED=false enrich
```

### Low Cache Hit Rate

**Symptoms:**
- `cache_hit_rate_percent` < 50%
- High latency (p90 > 0.5s)

**Diagnosis:**

```bash
# Check cache stats
curl http://localhost:9090/metrics/json | jq '.cache'

# Expected:
# - geoip: 70-85% hit rate
# - asn: 75-90% hit rate
# - rdns: 60-75% hit rate
```

**Solutions:**

```bash
# Increase cache size
docker run -e CACHE_MAX_SIZE=50000 enrich

# Increase TTL
docker run \
  -e GEOIP_TTL=172800 \  # 48 hours
  -e ASN_TTL=172800 \
  -e RDNS_TTL=7200 \      # 2 hours
  enrich

# Enable disk persistence
docker run -v ./data/cache:/data/cache enrich
```

### High Queue Size (Backpressure)

**Symptoms:**
- `processing_queue_size` > 10,000
- Alert: "HighQueueSize"
- Events delayed by hours

**Diagnosis:**

```bash
# Check processing rate
curl http://localhost:9090/metrics | grep rate

# Check latency
curl http://localhost:9090/metrics | grep processing_latency

# Identify bottleneck
docker stats enrich
# High CPU: Increase workers
# High I/O wait: Check disk, enable caching
```

**Solutions:**

```bash
# Increase worker pool
docker run -e MAX_WORKERS=8 enrich

# Increase batch size
docker run -e BATCH_SIZE=1000 enrich

# Disable slow operations
docker run -e RDNS_ENABLED=false enrich

# Scale horizontally (shard input)
# Split events by IP range, run multiple workers
```

### Disk Space Full

**Symptoms:**
- Write errors in logs
- Container crashes

**Diagnosis:**

```bash
# Check disk usage
df -h ./data

# Check log sizes
du -sh ./data/*.jsonl

# Check rotation
ls -lh ./data/*.jsonl.gz
```

**Solutions:**

```bash
# Force log rotation
sudo logrotate -f /etc/logrotate.d/honeypot

# Delete old archives
find ./data -name "*.jsonl.gz" -mtime +30 -delete

# Compress current logs
gzip ./data/honeypot_events.jsonl
gzip ./data/honeypot_enriched.jsonl

# Archive to S3 and delete local
aws s3 sync ./data/ s3://honeypot-archives/
rm ./data/*.jsonl.gz
```

### MaxMind Database Errors

**Symptoms:**
- Errors: "AddressNotFoundError" for all IPs
- geo/asn fields missing from output

**Diagnosis:**

```bash
# Check database files exist
ls -lh ./data/GeoLite2-*.mmdb

# Check database validity
docker exec enrich python -c "
import geoip2.database
reader = geoip2.database.Reader('/data/GeoLite2-City.mmdb')
print(reader.metadata())
"
```

**Solutions:**

```bash
# Re-download databases
.\download-maxmind.ps1 -AccountId "YOUR_ID" -LicenseKey "YOUR_KEY"

# Verify downloads
file ./data/GeoLite2-*.mmdb
# Should show: "MaxMind DB database data"

# Update in Docker volume
docker cp ./data/GeoLite2-City.mmdb enrich:/data/
docker restart enrich
```

---

## Performance Tuning

### Baseline Performance

**Test Setup:**
- 10,000 events in input file
- MaxMind databases loaded
- No cache (cold start)

**Sequential Processing:**
```
Events/sec: ~1,000
Latency p90: ~50ms
Cache hit: 0%
```

**Batch (4 workers, size=100):**
```
Events/sec: ~3,500
Latency p90: ~120ms
Cache hit: 0%
```

**Batch + Cache (80% hit rate):**
```
Events/sec: ~10,000
Latency p90: ~20ms
Cache hit: 80%
```

### Tuning Guidelines

#### Low Volume (<1000 events/hour)

```bash
MAX_WORKERS=1
BATCH_SIZE=10
CACHE_MAX_SIZE=1000
RDNS_ENABLED=true
USE_FSYNC=true
```

**Trade-offs:** Real-time processing, minimal resources

#### Medium Volume (1000-10000 events/hour)

```bash
MAX_WORKERS=4
BATCH_SIZE=100
CACHE_MAX_SIZE=10000
RDNS_ENABLED=true
USE_FSYNC=true
```

**Trade-offs:** Balanced throughput and safety

#### High Volume (>10000 events/hour)

```bash
MAX_WORKERS=8
BATCH_SIZE=1000
CACHE_MAX_SIZE=50000
RDNS_ENABLED=false  # Too slow
USE_FSYNC=false     # Risk on crash
```

**Trade-offs:** Maximum throughput, some data risk

---

## Security Checklist

### Pre-Deployment

- [ ] Review `SECURITY_HARDENING.md`
- [ ] Configure firewall rules (DNS only)
- [ ] Set file permissions (`chmod 640` logs)
- [ ] Enable log rotation (`logrotate.conf`)
- [ ] Configure PII retention policy
- [ ] Set up encrypted backups

### Production

- [ ] Worker runs as non-root (`USER enrich`)
- [ ] Network egress restricted (DNS only)
- [ ] State DB permissions: `600`
- [ ] Metrics port firewalled (internal only)
- [ ] Alerts configured (Prometheus)
- [ ] Audit logging enabled

### Ongoing

- [ ] Weekly MaxMind updates (automated)
- [ ] Monthly state DB cleanup (30 days)
- [ ] Quarterly PII retention review
- [ ] Annual security audit

---

## Useful Commands

```bash
# View real-time metrics
watch -n 2 'curl -s http://localhost:9090/metrics/json | jq'

# Tail enriched output
tail -f ./data/honeypot_enriched.jsonl | jq

# Count events by tag
jq -r '.tags[]' ./data/honeypot_enriched.jsonl | sort | uniq -c

# Top 10 attacking countries
jq -r '.geo.country' ./data/honeypot_enriched.jsonl | sort | uniq -c | sort -rn | head

# Average confidence by attack type
jq -r '.confidence | to_entries[] | "\(.key):\(.value)"' ./data/honeypot_enriched.jsonl

# Check state DB stats
docker exec enrich sqlite3 /data/enrich_state.db \
  "SELECT total_processed, total_errors FROM processing_state;"
```

---

## Escalation

### Level 1: Operator

- Restart worker
- Check logs
- Verify disk space
- Update MaxMind databases

### Level 2: Engineer

- Adjust performance tuning
- Investigate error patterns
- Review cache effectiveness
- Optimize batch sizes

### Level 3: Developer

- Code changes
- Database schema migrations
- Architecture decisions
- Security reviews

---

## Contact

- **Oncall:** [Your team's oncall rotation]
- **Slack:** #honeypot-ops
- **Docs:** https://github.com/yourorg/honeypot/wiki
- **Runbook:** This document
