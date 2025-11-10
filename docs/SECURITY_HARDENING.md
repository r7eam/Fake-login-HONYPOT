# Security & Operational Hardening Guide

## Overview

This document describes security hardening and operational best practices for the honeypot enrichment worker.

## Table of Contents

1. [Idempotency & State Management](#idempotency--state-management)
2. [Data Durability](#data-durability)
3. [Performance Optimization](#performance-optimization)
4. [Network Security](#network-security)
5. [Access Control](#access-control)
6. [PII & Data Protection](#pii--data-protection)
7. [Observability](#observability)
8. [Log Management](#log-management)

---

## 1. Idempotency & State Management

### Problem
Worker crashes or restarts cause re-processing of events, leading to:
- Duplicate entries in enriched output
- Wasted CPU on re-enrichment
- Inconsistent attack statistics

### Solution: SQLite State Tracking

**Implementation:** `state_manager.py`

```python
from state_manager import StateManager

state = StateManager(state_db_path="/data/enrich_state.db")

# Resume from last processed position
offset = state.get_file_offset(input_file)
with open(input_file, 'r') as f:
    f.seek(offset)
    # Process new lines only...
    
# Track processed events
if not state.is_processed(event_id, input_file):
    enriched = enrich_event(event)
    state.mark_processed(event_id, input_file)
```

**Features:**
- File offset tracking (byte position in JSONL)
- Processed event ID deduplication
- Processing statistics (count, errors, last run)
- Automatic cleanup of old state (30-day retention)

**Configuration:**
```bash
# Environment variable
STATE_DB=/data/enrich_state.db

# Volume mount (Docker)
volumes:
  - ./data:/data  # Contains enrich_state.db
```

---

## 2. Data Durability

### Problem
Power loss or crashes during write operations cause:
- Partial line writes (corrupted JSON)
- Lost enriched events
- Data inconsistency

### Solution: Atomic Writes with fsync

**Implementation:** `atomic_writer.py`

```python
from atomic_writer import AtomicJSONLWriter

# Buffered writes with atomic flush
writer = AtomicJSONLWriter(
    output_file="/data/honeypot_enriched.jsonl",
    buffer_size=100,      # Flush every 100 events
    use_fsync=True        # Force disk sync
)

writer.write(enriched_event)  # Buffered
writer.flush()                 # Atomic write + fsync
```

**Write Pattern:**
1. Buffer events in memory (default: 100 events)
2. On flush: append to file with `O_APPEND`
3. Call `fsync()` to force disk write
4. Update file offset in state DB

**Trade-offs:**
- `use_fsync=True`: Slower but guarantees durability
- `use_fsync=False`: Faster but risk data loss on crash
- `buffer_size=1`: Real-time but highest overhead

**Recommendation:**
```python
# Production (balance speed/safety)
buffer_size=100, use_fsync=True

# High-throughput (accept some risk)
buffer_size=1000, use_fsync=False

# Critical (maximum safety)
buffer_size=10, use_fsync=True
```

---

## 3. Performance Optimization

### 3.1 Caching Layer

**Problem:** Expensive operations repeated unnecessarily
- GeoIP lookups: 1-5ms per query
- Reverse DNS: 50-500ms per query (network I/O)
- ASN lookups: 1-5ms per query

**Solution:** TTL-based caching

**Implementation:** `cache_manager.py`

```python
from cache_manager import CacheManager

cache = CacheManager(
    cache_dir="/data/cache",     # Persistent cache
    geoip_ttl=86400,             # 24 hours
    asn_ttl=86400,               # 24 hours
    rdns_ttl=3600,               # 1 hour (DNS changes)
    max_size=10000               # LRU eviction
)

# Check cache before expensive lookup
geo_data = cache.get_geoip(ip)
if not geo_data:
    geo_data = maxmind_lookup(ip)  # Expensive
    cache.set_geoip(ip, geo_data)
```

**Cache Hit Rates (typical):**
- GeoIP: 70-85% (attackers reuse IPs)
- ASN: 75-90% (ASN blocks are large)
- rDNS: 60-75% (hostname changes rare)

**Persistence:**
```python
# Save to disk on shutdown
cache.save_to_disk()  # /data/cache/geoip_cache.json

# Reload on startup
cache = CacheManager(cache_dir="/data/cache")  # Auto-loads
```

### 3.2 Batch Processing & Parallelism

**Problem:** Sequential processing is slow
- 1 event/sec = 86,400 events/day max
- CPU cores underutilized

**Solution:** Batch processing with worker pool

```python
from concurrent.futures import ThreadPoolExecutor

def enrich_batch(events):
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = [executor.submit(enrich_event, e) for e in events]
        return [f.result() for f in futures]

# Process in batches of 100
batch = []
for event in events:
    batch.append(event)
    if len(batch) >= 100:
        enriched = enrich_batch(batch)
        writer.write_all(enriched)
        batch.clear()
```

**Recommended Settings:**
- `max_workers=4`: Good for I/O-bound tasks (rDNS)
- `batch_size=100`: Balance memory vs throughput
- `max_workers=CPU_count`: For CPU-bound tasks

**Performance Gains:**
- Sequential: ~1,000 events/sec
- Batch (4 workers): ~3,500 events/sec
- Batch + cache (80% hit): ~10,000 events/sec

### 3.3 Reverse DNS Timeouts

**Problem:** Slow DNS lookups block entire pipeline

**Solution:** Timeout + async resolution

```python
import socket
socket.setdefaulttimeout(2.0)  # 2 second timeout

def safe_rdns(ip):
    try:
        return socket.gethostbyaddr(ip)[0]
    except (socket.timeout, socket.herror):
        return None  # Skip slow lookups
```

**Aggressive Optimization:**
```python
# Skip rDNS entirely for known cloud/datacenter IPs
SKIP_RDNS_NETWORKS = [
    '18.0.0.0/8',    # AWS
    '34.64.0.0/10',  # GCP
    # ...
]
```

---

## 4. Network Security

### 4.1 Egress Restrictions

**Principle:** Enrichment worker should NOT access internal network

**Required Egress:**
- ✅ DNS (UDP 53) - for reverse DNS lookups
- ✅ HTTPS (TCP 443) - for MaxMind database updates (optional)
- ❌ Internal services (honeypot, databases, APIs)

**Docker Network Policy:**

```yaml
# docker-compose.yml
services:
  enrich:
    networks:
      - enrich_isolated
    dns:
      - 8.8.8.8  # External DNS only
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE  # For metrics server

networks:
  enrich_isolated:
    driver: bridge
    internal: false  # Allow external DNS
    ipam:
      config:
        - subnet: 172.20.0.0/24
```

**Firewall Rules (iptables):**

```bash
# Allow DNS only
iptables -A OUTPUT -p udp --dport 53 -j ACCEPT
iptables -A OUTPUT -p tcp --dport 53 -j ACCEPT

# Allow HTTPS for MaxMind updates (optional)
iptables -A OUTPUT -p tcp --dport 443 -d download.maxmind.com -j ACCEPT

# Deny all other outbound
iptables -A OUTPUT -j DROP
```

### 4.2 Container Security

**Dockerfile Hardening:**

```dockerfile
# Non-root user
USER enrich:enrich

# Drop all capabilities
RUN setcap cap_net_bind_service=+ep /usr/local/bin/python3.11

# Read-only filesystem (except /data)
docker run --read-only -v ./data:/data enrich

# No new privileges
docker run --security-opt=no-new-privileges enrich
```

**Recommended Docker Run:**

```bash
docker run \
  --read-only \
  --tmpfs /tmp:rw,noexec,nosuid,size=100m \
  --security-opt=no-new-privileges \
  --cap-drop=ALL \
  --network=enrich_isolated \
  -v ./data:/data \
  enrich:latest
```

---

## 5. Access Control

### 5.1 File Permissions

**Principle:** Least privilege access

```bash
# Data directory ownership
chown -R enrich:enrich /data
chmod 750 /data

# Log files
chmod 640 /data/honeypot_events.jsonl
chmod 640 /data/honeypot_enriched.jsonl

# State database
chmod 600 /data/enrich_state.db

# MaxMind databases (read-only)
chmod 444 /data/GeoLite2-*.mmdb
```

**Docker Volume Mounts:**

```yaml
volumes:
  - ./data:/data:rw           # Worker needs write
  - ./data/GeoLite2-City.mmdb:/data/GeoLite2-City.mmdb:ro  # Read-only
  - ./data/GeoLite2-ASN.mmdb:/data/GeoLite2-ASN.mmdb:ro
```

### 5.2 Audit Logging

**Track access to enriched data:**

```python
import logging
logging.basicConfig(
    filename='/var/log/enrich/access.log',
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger.info(f"User {user} accessed {file} at {timestamp}")
```

**Required Audit Events:**
- File access (read/write)
- State DB modifications
- Cache evictions
- Configuration changes

---

## 6. PII & Data Protection

### 6.1 PII Minimization

**Current Implementation:**
- ✅ Passwords: SHA-256 hashed
- ✅ Usernames: SHA-256 hashed
- ✅ Headers: Sample subset only (not full headers)

**Additional Recommendations:**

```python
# Hash source IPs for privacy-focused deployments
import hashlib

def anonymize_ip(ip, salt):
    return hashlib.sha256(f"{ip}{salt}".encode()).hexdigest()[:16]

# Store anonymized instead of cleartext
event['src_ip_hash'] = anonymize_ip(event['src_ip'], SECRET_SALT)
del event['src_ip']  # Remove cleartext
```

**Retention Policy:**

```yaml
# Environment configuration
PII_RETENTION_DAYS: 30  # Delete raw IPs after 30 days
ENRICHED_RETENTION_DAYS: 365  # Keep anonymized for 1 year
```

### 6.2 Encryption at Rest

**For cleartext credentials (research use only):**

```bash
# Encrypt data volume with LUKS
cryptsetup luksFormat /dev/sdb
cryptsetup open /dev/sdb enrich_data
mkfs.ext4 /dev/mapper/enrich_data
mount /dev/mapper/enrich_data /data
```

**Approval & Documentation:**

```markdown
# PII Retention Approval Form

**Purpose:** Security research / threat analysis
**Data Types:** Source IPs, attack payloads, user agents
**Retention:** 30 days
**Access:** Restricted to research team
**Encryption:** AES-256 (LUKS)
**Approval:** [Signature] [Date]
```

---

## 7. Observability

### 7.1 Prometheus Metrics

**Exposed Metrics:**

```
# Counters
processed_events_total          # Total enriched events
error_events_total              # Total errors
error_events_by_type{type}      # Errors by category

# Gauges
processing_queue_size           # Backpressure indicator
cache_hit_rate_percent          # Cache effectiveness
uptime_seconds                  # Worker availability

# Histograms/Summaries
processing_latency_seconds{quantile}  # p50, p90, p99
cache_size_geoip               # Current cache sizes
cache_size_asn
cache_size_rdns
```

**Prometheus Configuration:**

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'enrichment_worker'
    static_configs:
      - targets: ['enrich:9090']
    scrape_interval: 15s
```

**Alerting Rules:**

```yaml
# alerts.yml
groups:
  - name: enrichment
    rules:
      - alert: HighErrorRate
        expr: rate(error_events_total[5m]) > 10
        for: 5m
        annotations:
          summary: "Enrichment error rate exceeded 10/sec"
      
      - alert: HighQueueSize
        expr: processing_queue_size > 10000
        for: 10m
        annotations:
          summary: "Enrichment queue backpressure detected"
      
      - alert: LowCacheHitRate
        expr: cache_hit_rate_percent < 50
        for: 15m
        annotations:
          summary: "Cache hit rate dropped below 50%"
```

### 7.2 Structured Logging

```python
import logging
import json

class StructuredLogger:
    def log_event(self, event_type, **kwargs):
        log_entry = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'event_type': event_type,
            **kwargs
        }
        print(json.dumps(log_entry))

logger = StructuredLogger()
logger.log_event('enrichment_complete', event_id=123, duration_ms=45)
```

**Log Aggregation:**

```yaml
# Filebeat configuration
filebeat.inputs:
  - type: log
    paths:
      - /data/enrich_error.log
    json.keys_under_root: true
    
output.elasticsearch:
  hosts: ["elasticsearch:9200"]
```

---

## 8. Log Management

### 8.1 Log Rotation

**Configuration:** `logrotate.conf`

```bash
# Install
sudo cp enrich/logrotate.conf /etc/logrotate.d/honeypot
sudo chmod 644 /etc/logrotate.d/honeypot

# Test
sudo logrotate -d /etc/logrotate.d/honeypot

# Force rotation
sudo logrotate -f /etc/logrotate.d/honeypot
```

**Rotation Schedule:**
- Daily rotation OR 100MB size limit
- Compress with gzip after 1 day
- Keep 30 days of logs
- Archive to S3 (optional)

### 8.2 Retention Policy

```bash
# Automatic cleanup (30 days)
find /data -name "honeypot_*.jsonl.gz" -mtime +30 -delete

# Archive to cold storage
aws s3 sync /data/archives/ s3://honeypot-archives/ \
  --storage-class GLACIER
```

### 8.3 Monitoring Disk Usage

```python
import shutil

def check_disk_space(path='/data'):
    usage = shutil.disk_usage(path)
    percent = (usage.used / usage.total) * 100
    
    if percent > 90:
        logger.error(f"Disk usage critical: {percent:.1f}%")
        # Trigger alert or cleanup
```

---

## Quick Reference

### Environment Variables

```bash
# Core paths
RAW_LOG=/data/honeypot_events.jsonl
ENRICHED_OUT=/data/honeypot_enriched.jsonl
STATE_DB=/data/enrich_state.db
CACHE_DIR=/data/cache

# MaxMind databases
GEOIP_CITY=/data/GeoLite2-City.mmdb
GEOIP_ASN=/data/GeoLite2-ASN.mmdb

# Performance tuning
BATCH_SIZE=100
MAX_WORKERS=4
CACHE_MAX_SIZE=10000

# Security
METRICS_PORT=9090
RDNS_TIMEOUT=2
```

### Production Checklist

- [ ] State tracking enabled (`STATE_DB` set)
- [ ] Cache persistence enabled (`CACHE_DIR` set)
- [ ] Atomic writes with fsync (`use_fsync=True`)
- [ ] Log rotation configured (`logrotate.conf` installed)
- [ ] Metrics exposed (`METRICS_PORT=9090`)
- [ ] Non-root user (`USER enrich:enrich`)
- [ ] Network egress restricted (DNS only)
- [ ] File permissions set (`chmod 640` logs, `600` state DB)
- [ ] Backups configured (S3 or similar)
- [ ] Alerts configured (Prometheus)

### Performance Tuning

**Low Volume (<1000 events/hour):**
```bash
BATCH_SIZE=10
MAX_WORKERS=1
CACHE_MAX_SIZE=1000
```

**Medium Volume (1000-10000 events/hour):**
```bash
BATCH_SIZE=100
MAX_WORKERS=4
CACHE_MAX_SIZE=10000
```

**High Volume (>10000 events/hour):**
```bash
BATCH_SIZE=1000
MAX_WORKERS=8
CACHE_MAX_SIZE=50000
```

---

## Support

For issues or questions:
- Check logs: `/var/log/enrich/enrich_error.log`
- Metrics: `http://localhost:9090/metrics`
- Health: `http://localhost:9090/health`
