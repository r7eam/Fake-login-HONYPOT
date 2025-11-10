#!/usr/bin/env python3
"""
Quick test script for enrichment worker without MaxMind databases.
Uses mock data to demonstrate functionality.
"""

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

# Mock enrichment functions (no external dependencies)
def mock_geo_data(ip):
    """Return mock GeoIP data for testing"""
    # Simple geo assignment based on IP prefix
    if ip.startswith('192.168') or ip.startswith('127.'):
        return {'error': 'Private IP address'}
    
    return {
        'country_code': 'US',
        'country_name': 'United States',
        'city': 'New York',
        'latitude': 40.7128,
        'longitude': -74.0060,
        'timezone': 'America/New_York',
        'accuracy_radius': 1000
    }

def mock_asn_data(ip):
    """Return mock ASN data for testing"""
    if ip.startswith('192.168') or ip.startswith('127.'):
        return {'error': 'Private IP address'}
    
    return {
        'asn': 15169,
        'organization': 'Example ISP',
        'network': f'{".".join(ip.split(".")[:2])}.0.0/16'
    }

def apply_tags(event):
    """Simple tag detection (SQL injection, XSS, scanner)"""
    tags = []
    
    username = event.get('username', '').lower()
    password = event.get('password', '').lower()
    ua = event.get('headers', {}).get('user-agent', '').lower()
    
    # SQL Injection
    if any(kw in username or kw in password for kw in ['union', 'select', 'or 1=1', '--', 'drop']):
        tags.append('sql-injection')
    
    # XSS
    if any(pat in username or pat in password for pat in ['<script', 'alert(', 'onerror=']):
        tags.append('xss-attempt')
    
    # Scanner
    if any(scanner in ua for scanner in ['sqlmap', 'nikto', 'nmap', 'masscan']):
        tags.append('scanner')
    
    # Bot
    if any(bot in ua for bot in ['bot', 'curl', 'wget', 'python']):
        tags.append('bot')
    
    # Brute force
    if username in ['admin', 'root', 'test'] or password in ['admin', 'password', '123456']:
        tags.append('brute-force')
    
    return tags

def enrich_event(event):
    """Enrich a single event with mock data"""
    enriched = event.copy()
    
    # Add enrichment metadata
    enriched['enriched_at'] = datetime.now(timezone.utc).isoformat()
    enriched['enrichment_version'] = '1.0-mock'
    
    src_ip = event.get('src_ip', '')
    
    # Add mock GeoIP
    enriched['geo'] = mock_geo_data(src_ip)
    
    # Add mock ASN
    enriched['asn'] = mock_asn_data(src_ip)
    
    # Mock rDNS
    if not (src_ip.startswith('192.168') or src_ip.startswith('127.')):
        enriched['rdns'] = f'host-{src_ip.replace(".", "-")}.example.com'
    
    # Apply tagging
    new_tags = apply_tags(event)
    existing_tags = event.get('tags', [])
    enriched['tags'] = list(set(existing_tags + new_tags))
    
    return enriched

def main():
    input_file = Path('data/honeypot_events.jsonl')
    output_file = Path('data/honeypot_enriched_test.jsonl')
    
    if not input_file.exists():
        print(f"❌ Input file not found: {input_file}")
        print("   Run the honeypot first to generate events.")
        return 1
    
    print("🧪 Testing Enrichment Worker (Mock Mode)")
    print("=" * 60)
    print(f"📥 Input:  {input_file}")
    print(f"📤 Output: {output_file}")
    print("=" * 60)
    print("⚠️  Using MOCK data (no MaxMind databases required)")
    print()
    
    stats = {'read': 0, 'enriched': 0, 'errors': 0}
    
    try:
        with open(input_file, 'r', encoding='utf-8') as infile, \
             open(output_file, 'w', encoding='utf-8') as outfile:
            
            for line_num, line in enumerate(infile, 1):
                line = line.strip()
                if not line:
                    continue
                
                try:
                    event = json.loads(line)
                    stats['read'] += 1
                    
                    enriched = enrich_event(event)
                    
                    outfile.write(json.dumps(enriched, ensure_ascii=False) + '\n')
                    stats['enriched'] += 1
                    
                    # Show sample
                    if stats['enriched'] <= 2:
                        print(f"✨ Sample enriched event #{stats['enriched']}:")
                        print(json.dumps(enriched, indent=2, ensure_ascii=False))
                        print()
                    
                except json.JSONDecodeError as e:
                    print(f"⚠️  Line {line_num}: Invalid JSON - {e}")
                    stats['errors'] += 1
    
    except Exception as e:
        print(f"❌ Fatal error: {e}")
        return 1
    
    print("=" * 60)
    print("✅ Test Enrichment Complete!")
    print("=" * 60)
    print(f"📊 Events read:      {stats['read']}")
    print(f"✨ Events enriched:  {stats['enriched']}")
    print(f"❌ Errors:           {stats['errors']}")
    print("=" * 60)
    print(f"📁 Mock enriched data: {output_file}")
    print()
    print("💡 To use real enrichment:")
    print("   1. Download MaxMind databases (see docs/PHASE4_ENRICHMENT.md)")
    print("   2. Run: docker compose -f docker-compose.honeypot.yml run --rm enrich")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
