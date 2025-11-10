#!/usr/bin/env python3
"""
Schema Adapter - Converts old honeypot schema to canonical v1.0

Usage:
    python schema_adapter.py input.jsonl output.jsonl
"""

import json
import sys
import hashlib
from pathlib import Path


def compute_fingerprint(event):
    """Compute body fingerprint from event data"""
    username = event.get('username', '')
    password = event.get('password', '')
    data = json.dumps({'u': username, 'p': password}, sort_keys=True)
    return hashlib.md5(data.encode()).hexdigest()[:8]


def extract_sample_headers(headers):
    """Extract sample headers from full headers object"""
    if not headers:
        return {}
    
    return {
        'accept': headers.get('accept', ''),
        'content_type': headers.get('content_type', ''),
        'accept_language': headers.get('accept_language', ''),
        'accept_encoding': headers.get('accept_encoding', ''),
        'host': headers.get('host', ''),
        'connection': headers.get('connection', ''),
        'x_forwarded_for': headers.get('x_forwarded_for', ''),
        'x_real_ip': headers.get('x_real_ip', ''),
    }


def migrate_to_canonical(old_event):
    """Convert old schema to canonical v1.0"""
    
    # Handle both old and new schema
    event_id = old_event.get('id') or old_event.get('event_id')
    timestamp = old_event.get('received_at') or old_event.get('timestamp')
    
    # Extract user agent from headers or ua field
    headers = old_event.get('headers', old_event.get('headers_sample', {}))
    ua = old_event.get('ua', headers.get('user_agent', ''))
    referer = old_event.get('referer', headers.get('referer', ''))
    
    canonical = {
        'id': event_id,
        'received_at': timestamp,
        'src_ip': old_event.get('src_ip'),
        'src_port': old_event.get('src_port'),
        'path': old_event.get('path', '/fake-login'),
        'method': old_event.get('method', 'POST'),
        'username_hash': old_event.get('username_hash'),
        'password_hash': old_event.get('password_hash'),
        'ua': ua,
        'referer': referer,
        'body_fingerprint': old_event.get('body_fingerprint') or compute_fingerprint(old_event),
        'headers_sample': extract_sample_headers(headers),
        'tags': old_event.get('tags', []),
    }
    
    # Optional fields from old schema
    if 'http_version' in old_event:
        canonical['http_version'] = old_event['http_version']
    if 'protocol' in old_event:
        canonical['protocol'] = old_event['protocol']
    if 'is_email' in old_event:
        canonical['is_email'] = old_event['is_email']
    if 'is_phone' in old_event:
        canonical['is_phone'] = old_event['is_phone']
    if 'contains_sql_keywords' in old_event:
        canonical['contains_sql_keywords'] = old_event['contains_sql_keywords']
    if 'contains_special_chars' in old_event:
        canonical['contains_special_chars'] = old_event['contains_special_chars']
    
    # Keep plaintext credentials if they exist (research mode)
    if 'username' in old_event:
        canonical['username'] = old_event['username']
    if 'password' in old_event:
        canonical['password'] = old_event['password']
    
    return canonical


def main():
    if len(sys.argv) != 3:
        print("Usage: python schema_adapter.py input.jsonl output.jsonl")
        sys.exit(1)
    
    input_file = Path(sys.argv[1])
    output_file = Path(sys.argv[2])
    
    if not input_file.exists():
        print(f"Error: Input file not found: {input_file}")
        sys.exit(1)
    
    print(f"Converting {input_file} to canonical schema...")
    print(f"Output: {output_file}")
    
    count = 0
    errors = 0
    
    with open(input_file, 'r', encoding='utf-8') as inf, \
         open(output_file, 'w', encoding='utf-8') as outf:
        
        for line_num, line in enumerate(inf, 1):
            line = line.strip()
            if not line:
                continue
            
            try:
                old_event = json.loads(line)
                canonical_event = migrate_to_canonical(old_event)
                outf.write(json.dumps(canonical_event, ensure_ascii=False) + '\n')
                count += 1
                
                if count % 100 == 0:
                    print(f"Processed {count} events...", end='\r')
            
            except json.JSONDecodeError as e:
                print(f"\nWarning: Line {line_num}: Invalid JSON - {e}")
                errors += 1
            except Exception as e:
                print(f"\nWarning: Line {line_num}: Migration error - {e}")
                errors += 1
    
    print(f"\n✅ Migration complete!")
    print(f"   Converted: {count} events")
    print(f"   Errors: {errors}")
    print(f"   Output: {output_file}")


if __name__ == '__main__':
    main()
