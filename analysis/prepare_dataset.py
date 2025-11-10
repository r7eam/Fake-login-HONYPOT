#!/usr/bin/env python3
"""
analysis/prepare_dataset.py

Validates and cleans enriched honeypot events:
- Reads enriched JSONL from data/honeypot_enriched.jsonl
- Validates ISO timestamps
- Normalizes tags and fields
- Outputs clean CSV for analysis

Output: ./analysis/out/events.csv
"""

import json
import csv
import os
import datetime
import sys

# Configuration
INP = os.getenv("ENRICHED", "./data/honeypot_enriched.jsonl")
OUTDIR = "./analysis/out"
OUTCSV = f"{OUTDIR}/events.csv"

# Ensure output directory exists
os.makedirs(OUTDIR, exist_ok=True)

def iso(dt):
    """Parse ISO datetime string, return datetime object or None"""
    try:
        return datetime.datetime.fromisoformat(dt.replace("Z", "+00:00"))
    except:
        return None

def to_row(ev):
    """Convert enriched event JSON to flat CSV row"""
    # Handle both nested and flat structure
    if isinstance(ev.get("geo"), dict):
        geo = ev.get("geo", {})
        country = geo.get("country", "")
        city = geo.get("city", "")
        lat = geo.get("latitude", "")
        lon = geo.get("longitude", "")
    else:
        # Flat structure with geo_* fields
        country = ev.get("geo_country", "")
        city = ev.get("geo_city", "")
        lat = ev.get("geo_lat", "")
        lon = ev.get("geo_lon", "")
    
    if isinstance(ev.get("asn"), dict):
        asn_data = ev.get("asn", {})
        asn = asn_data.get("asn", "")
        org = asn_data.get("org", "")
    else:
        asn = ev.get("asn_number", "")
        org = ev.get("asn_org", "")
    
    if isinstance(ev.get("confidence"), dict):
        confidence = ev.get("confidence", {})
        conf_bf = confidence.get("brute_force", 0.0)
        conf_sqli = confidence.get("sql_injection", 0.0)
        conf_scan = confidence.get("scanner", 0.0)
        conf_bot = confidence.get("bot", 0.0)
    else:
        conf_bf = ev.get("confidence", 0.0)
        conf_sqli = 0.0
        conf_scan = 0.0
        conf_bot = 0.0
    
    return {
        "id": ev.get("id", ev.get("event_id", "")),
        "received_at": ev.get("received_at", ev.get("timestamp", "")),  # Use timestamp as fallback
        "enriched_at": ev.get("enriched_at", ""),
        "src_ip": ev.get("src_ip", ev.get("ip", "")),
        "src_port": ev.get("src_port", ""),
        "path": ev.get("path", ""),
        "method": ev.get("method", ""),
        "username": ev.get("username", ""),
        "password": ev.get("password", ""),
        "username_hash": ev.get("username_hash", ""),
        "password_hash": ev.get("password_hash", ""),
        "ua": ev.get("ua", ev.get("user_agent", ev.get("headers", {}).get("user_agent", ""))),
        "referer": ev.get("referer", ev.get("headers", {}).get("referer", "")),
        
        # GeoIP enrichment
        "country": country if country else "Unknown",  # Default for localhost
        "city": city if city else "Unknown",
        "latitude": lat,
        "longitude": lon,
        
        # ASN enrichment
        "asn": asn,
        "org": org,
        
        # rDNS
        "rdns": ev.get("rdns", ""),
        
        # Attack tracking
        "first_seen": ev.get("first_seen", ""),
        "last_seen": ev.get("last_seen", ""),
        "seen_count": ev.get("seen_count", 0),
        
        # Tags and confidence
        "tags": ",".join(ev.get("tags", [])),
        "confidence_bruteforce": conf_bf,
        "confidence_sqli": conf_sqli,
        "confidence_scanner": conf_scan,
        "confidence_bot": conf_bot,
    }

def main():
    if not os.path.exists(INP):
        print(f"❌ Error: Input file not found: {INP}")
        print(f"   Make sure enrichment has run and produced {INP}")
        sys.exit(1)
    
    print(f"📖 Reading enriched events from: {INP}")
    
    rows = []
    skipped = 0
    
    with open(INP, "r", encoding="utf-8", errors="ignore") as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            
            try:
                ev = json.loads(line)
            except json.JSONDecodeError as e:
                skipped += 1
                print(f"⚠️  Line {line_num}: Invalid JSON - {e}")
                continue
            
            # Validate required fields (accept either received_at or timestamp)
            timestamp_field = ev.get("received_at") or ev.get("timestamp")
            if not timestamp_field:
                skipped += 1
                print(f"⚠️  Line {line_num}: Missing received_at and timestamp")
                continue
            
            if not iso(timestamp_field):
                skipped += 1
                print(f"⚠️  Line {line_num}: Invalid timestamp: {timestamp_field}")
                continue
            
            rows.append(to_row(ev))
    
    if not rows:
        print("❌ Error: No valid events found!")
        sys.exit(1)
    
    # Sort by timestamp
    rows.sort(key=lambda r: r["received_at"])
    
    # Write CSV
    print(f"💾 Writing CSV to: {OUTCSV}")
    
    fieldnames = [
        "id", "received_at", "enriched_at", "src_ip", "src_port", "path", "method",
        "username", "password", "username_hash", "password_hash",
        "ua", "referer", "country", "city", "latitude", "longitude",
        "asn", "org", "rdns", "first_seen", "last_seen", "seen_count",
        "tags", "confidence_bruteforce", "confidence_sqli", "confidence_scanner", "confidence_bot"
    ]
    
    with open(OUTCSV, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)
    
    print(f"✅ Successfully processed {len(rows)} events")
    if skipped > 0:
        print(f"⚠️  Skipped {skipped} invalid events")
    
    # Summary stats
    print("\n📊 DATASET SUMMARY:")
    print(f"   Total events: {len(rows)}")
    print(f"   Date range: {rows[0]['received_at']} → {rows[-1]['received_at']}")
    
    unique_ips = len(set(r["src_ip"] for r in rows))
    print(f"   Unique IPs: {unique_ips}")
    
    countries = [r["country"] for r in rows if r["country"]]
    unique_countries = len(set(countries))
    print(f"   Countries: {unique_countries}")
    
    tags = [t for r in rows for t in r["tags"].split(",") if t]
    unique_tags = len(set(tags))
    print(f"   Unique tags: {unique_tags}")
    
    print(f"\n✅ Dataset ready for analysis!")
    print(f"   Next step: python analysis/metrics.py")

if __name__ == "__main__":
    main()
