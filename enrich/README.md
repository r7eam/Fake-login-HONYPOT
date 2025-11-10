# Enrichment Worker

Python-based service for enriching honeypot events with geolocation, ASN, rDNS, and rule-based attack tagging.

## Quick Start

### Option 1: Test Without MaxMind Databases

Use mock data to test the enrichment pipeline:

```powershell
# Make sure you have some events captured
python enrich/test_worker.py
```

This creates `data/honeypot_enriched_test.jsonl` with mock GeoIP/ASN data.

### Option 2: Full Enrichment with MaxMind

1. **Download MaxMind databases** (free account required):
   - Sign up: https://www.maxmind.com/en/geolite2/signup
   - Download GeoLite2-City.mmdb and GeoLite2-ASN.mmdb
   - Place in `data/` directory

2. **Run enrichment worker**:
   ```powershell
   # Build container
   docker compose -f docker-compose.honeypot.yml build enrich
   
   # Run enrichment (incremental mode)
   docker compose -f docker-compose.honeypot.yml run --rm enrich
   ```

## Files

```
enrich/
├── worker.py           # Main enrichment worker (Python 3.11)
├── test_worker.py      # Test script with mock data (no MaxMind needed)
├── requirements.txt    # Python dependencies
├── Dockerfile          # Container build
├── config.json         # Configuration (tagging rules, thresholds)
└── README.md           # This file
```

## Features

✅ **GeoIP Enrichment**: Country, city, coordinates (MaxMind GeoLite2)  
✅ **ASN Lookup**: Autonomous System Number and organization  
✅ **rDNS Resolution**: Best-effort reverse DNS for source IPs  
✅ **Attack Tagging**: 9 pattern-based rules:
- SQL Injection
- XSS Attempts
- Scanner Detection
- Bot Detection
- Brute Force
- Long Input (buffer overflow)
- Suspicious Characters
- Command Injection
- LDAP Injection

✅ **Incremental Mode**: Only process new events  
✅ **Security**: Non-root user, read-only filesystem, capability dropping  

## Usage

### Process All Events
```powershell
docker compose -f docker-compose.honeypot.yml run --rm enrich python worker.py
```

### Process Only New Events (Default)
```powershell
docker compose -f docker-compose.honeypot.yml run --rm enrich
```

### Custom Paths
```powershell
docker compose -f docker-compose.honeypot.yml run --rm enrich python worker.py \
  --input /data/custom_events.jsonl \
  --output /data/custom_enriched.jsonl
```

## Output Format

Each enriched event includes:

```json
{
  "event_id": "...",
  "timestamp": "...",
  "src_ip": "203.0.113.42",
  "username": "admin' OR 1=1--",
  "password": "test123",
  "tags": ["potential-sqli", "sql-injection", "scanner"],
  
  "enriched_at": "2025-11-10T12:40:00Z",
  "enrichment_version": "1.0",
  
  "geo": {
    "country_code": "US",
    "country_name": "United States",
    "city": "New York",
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  
  "asn": {
    "asn": 15169,
    "organization": "Google LLC"
  },
  
  "rdns": "scanner.example.com"
}
```

## Configuration

Edit `config.json` to customize:
- Tagging rules and keywords
- MaxMind database paths
- rDNS timeout
- Threat intelligence APIs (future)

## Documentation

See **[docs/PHASE4_ENRICHMENT.md](../docs/PHASE4_ENRICHMENT.md)** for:
- Complete setup instructions
- MaxMind database download guide
- Tagging rules reference
- Performance tips
- Analysis examples
- Troubleshooting

## Requirements

- Python 3.11+
- geoip2 (for MaxMind)
- dnspython (for rDNS)
- Docker + Docker Compose

## License

Part of Craft Mosul Honeypot Graduate Project
