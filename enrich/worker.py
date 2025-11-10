#!/usr/bin/env python3
"""
Honeypot Event Enrichment Worker
Phase 4 - Graduate Project

Reads honeypot_events.jsonl incrementally and enriches each event with:
- GeoIP data (MaxMind GeoLite2)
- ASN information
- Reverse DNS lookup
- Advanced payload analysis and attack classification
- Enrichment metadata

Usage:
    python worker.py                    # Process all events
    python worker.py --incremental      # Only process new events
    docker compose run --rm enrich      # Run in container
"""

import json
import os
import sys
import socket
import argparse
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Any

# Optional imports - gracefully handle missing dependencies
try:
    import geoip2.database # type: ignore
    import geoip2.errors # type: ignore
    HAS_GEOIP = True
except ImportError:
    HAS_GEOIP = False
    print("⚠️  geoip2 not installed. GeoIP enrichment disabled.", file=sys.stderr)

try:
    import dns.resolver # pyright: ignore[reportMissingImports]
    import dns.reversename # type: ignore
    HAS_DNS = True
except ImportError:
    HAS_DNS = False
    print("⚠️  dnspython not installed. rDNS enrichment disabled.", file=sys.stderr)


class EnrichmentWorker:
    """Enriches honeypot events with geolocation, ASN, rDNS, and rule-based tags"""
    
    def __init__(self, 
                 input_file: str = None,
                 output_file: str = None,
                 maxmind_city_db: str = None,
                 maxmind_asn_db: str = None,
                 incremental: bool = False):
        
        # Use environment variables with fallbacks
        self.input_file = Path(input_file or os.environ.get('RAW_LOG', '/data/honeypot_events.jsonl'))
        self.output_file = Path(output_file or os.environ.get('ENRICHED_OUT', '/data/honeypot_enriched.jsonl'))
        self.maxmind_city_db = Path(maxmind_city_db or os.environ.get('GEOIP_CITY', '/data/GeoLite2-City.mmdb'))
        self.maxmind_asn_db = Path(maxmind_asn_db or os.environ.get('GEOIP_ASN', '/data/GeoLite2-ASN.mmdb'))
        self.incremental = incremental
        
        # Track attack patterns for confidence scoring
        self.attack_history = {}  # IP -> attack types seen
        
        # Initialize GeoIP readers
        self.city_reader = None
        self.asn_reader = None
        
        if HAS_GEOIP:
            try:
                if self.maxmind_city_db.exists():
                    self.city_reader = geoip2.database.Reader(str(self.maxmind_city_db))
                    print(f"✅ Loaded MaxMind City database: {self.maxmind_city_db}")
                else:
                    print(f"⚠️  MaxMind City DB not found: {self.maxmind_city_db}", file=sys.stderr)
                
                if self.maxmind_asn_db.exists():
                    self.asn_reader = geoip2.database.Reader(str(self.maxmind_asn_db))
                    print(f"✅ Loaded MaxMind ASN database: {self.maxmind_asn_db}")
                else:
                    print(f"⚠️  MaxMind ASN DB not found: {self.maxmind_asn_db}", file=sys.stderr)
            except Exception as e:
                print(f"❌ Failed to load MaxMind databases: {e}", file=sys.stderr)
        
        # Track processed event IDs for incremental mode
        self.processed_ids = set()
        if self.incremental and self.output_file.exists():
            self._load_processed_ids()
    
    def _load_processed_ids(self):
        """Load already processed event IDs from output file"""
        try:
            with open(self.output_file, 'r', encoding='utf-8') as f:
                for line in f:
                    try:
                        event = json.loads(line.strip())
                        if 'event_id' in event:
                            self.processed_ids.add(event['event_id'])
                    except json.JSONDecodeError:
                        continue
            print(f"📊 Loaded {len(self.processed_ids)} already processed events")
        except Exception as e:
            print(f"⚠️  Could not load processed IDs: {e}", file=sys.stderr)
    
    def get_geo_data(self, ip: str) -> Optional[Dict[str, Any]]:
        """Get geographic data from MaxMind City database - canonical schema"""
        if not self.city_reader:
            return None
        
        try:
            response = self.city_reader.city(ip)
            # Canonical schema: country (code), city, latitude, longitude
            return {
                'country': response.country.iso_code,  # ISO code e.g. "US"
                'city': response.city.name or 'Unknown',
                'latitude': response.location.latitude,
                'longitude': response.location.longitude,
            }
        except geoip2.errors.AddressNotFoundError:
            return None  # Return None for IPs not in database
        except Exception as e:
            return None
    
    def get_asn_data(self, ip: str) -> Optional[Dict[str, Any]]:
        """Get ASN data from MaxMind ASN database - canonical schema"""
        if not self.asn_reader:
            return None
        
        try:
            response = self.asn_reader.asn(ip)
            # Canonical schema: asn (number), org (organization name)
            return {
                'asn': response.autonomous_system_number,
                'org': response.autonomous_system_organization,
            }
        except geoip2.errors.AddressNotFoundError:
            return None
        except Exception as e:
            return None
    
    def get_rdns(self, ip: str, timeout: int = 2) -> Optional[str]:
        """Perform reverse DNS lookup (best-effort)"""
        if not HAS_DNS:
            # Fallback to socket module
            try:
                hostname, _, _ = socket.gethostbyaddr(ip)
                return hostname
            except (socket.herror, socket.gaierror, socket.timeout):
                return None
        
        try:
            # Use dnspython for better control
            rev_name = dns.reversename.from_address(ip)
            resolver = dns.resolver.Resolver()
            resolver.timeout = timeout
            resolver.lifetime = timeout
            
            answers = resolver.resolve(rev_name, 'PTR')
            if answers:
                return str(answers[0]).rstrip('.')
        except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer, dns.resolver.Timeout):
            return None
        except Exception:
            return None
    
    def apply_tagging_rules(self, event: Dict[str, Any]) -> List[str]:
        """
        Advanced payload analysis to identify attack patterns
        Analyzes username, password, and path for exploit attempts
        """
        username = event.get('username', '')
        password = event.get('password', '')
        path = event.get('path', '')
        combined = f"{username} {password} {path}"
        
        tags = []
        
        # SQL Injection patterns
        sql_patterns = [
            r"('\s*(OR|AND)\s*'?\d*'?\s*=\s*'?\d*)",  # ' OR '1'='1
            r"(--|\#|\/\*)",  # SQL comments
            r"(UNION\s+SELECT|UNION\s+ALL)",
            r"(DROP\s+TABLE|DELETE\s+FROM|INSERT\s+INTO)",
            r"(EXEC\s*\(|EXECUTE\s*\()",
            r"(xp_cmdshell|sp_executesql)",
        ]
        for pattern in sql_patterns:
            if re.search(pattern, combined, re.IGNORECASE):
                tags.append('sql-injection')
                break
        
        # XSS patterns
        xss_patterns = [
            r"<script[^>]*>",
            r"javascript:",
            r"onerror\s*=",
            r"onload\s*=",
            r"onclick\s*=",
            r"<iframe",
            r"<img[^>]*onerror",
            r"alert\s*\(",
            r"document\.cookie",
            r"eval\s*\(",
        ]
        for pattern in xss_patterns:
            if re.search(pattern, combined, re.IGNORECASE):
                tags.append('xss')
                break
        
        # Path Traversal patterns
        path_traversal_patterns = [
            r"\.\./",
            r"%2e%2e/",
            r"/etc/passwd",
            r"/etc/shadow",
            r"C:\\Windows",
            r"\.\.\\",
            r"....//",
        ]
        for pattern in path_traversal_patterns:
            if re.search(pattern, combined, re.IGNORECASE):
                tags.append('path-traversal')
                break
        
        # Command Injection patterns
        command_patterns = [
            r";\s*(cat|ls|wget|curl|nc|bash|sh|cmd|powershell)",
            r"\|\s*(cat|ls|wget|curl|nc|bash)",
            r"`.*`",
            r"\$\(.*\)",
            r"&&",
        ]
        for pattern in command_patterns:
            if re.search(pattern, combined, re.IGNORECASE):
                tags.append('command-injection')
                break
        
        # LDAP Injection
        if re.search(r"\*\)\(|\(\|\(|\)&\(", combined):
            tags.append('ldap-injection')
        
        # NoSQL Injection
        if re.search(r"\$ne|\$gt|\$regex|\$where", combined):
            tags.append('nosql-injection')
        
        # XXE patterns
        if re.search(r"<!ENTITY|<!DOCTYPE|SYSTEM\s+[\"']", combined, re.IGNORECASE):
            tags.append('xxe')
        
        # Brute Force (common credentials)
        common_users = {'admin', 'administrator', 'root', 'user', 'test', 'guest'}
        common_passes = {'admin', 'password', '123456', 'qwerty', 'test', 'root', 'pass'}
        
        if username.lower() in common_users and password.lower() in common_passes:
            tags.append('brute-force')
        
        # Credential Stuffing (email + complex password)
        if '@' in username and '.' in username:
            if len(password) >= 8 and re.search(r'[!@#$%^&*]', password):
                tags.append('credential-stuffing')
        
        # Scanning/Enumeration
        if len(username) <= 4 and username.isalnum() and len(password) <= 4:
            tags.append('scanning')
        
        # Special chars
        if re.search(r'[<>\"\'\\;$(){}[\]]', combined):
            if not tags:  # Only add if no specific attack detected
                tags.append('special-chars')
        
        return list(set(tags)) if tags else ['unknown']
    
    def calculate_confidence_scores(self, event: Dict[str, Any], tags: List[str]) -> Dict[str, float]:
        """
        Calculate confidence scores for each detected attack type
        
        Returns dict of {attack_type: confidence_score} where confidence is 0.0-1.0
        """
        confidence = {}
        
        username = event.get('username', '').lower()
        password = event.get('password', '').lower()
        ua = event.get('ua', '').lower()
        
        # SQL Injection confidence
        if 'sql-injection' in tags:
            score = 0.5  # Base score
            sql_keywords = ['union', 'select', 'drop', 'insert', 'delete', 'update']
            matches = sum(1 for kw in sql_keywords if kw in username or kw in password)
            score += min(matches * 0.15, 0.4)  # Up to +0.4
            if '--' in username or '--' in password:
                score += 0.1
            confidence['sql_injection'] = min(score, 1.0)
        
        # XSS Attempt confidence
        if 'xss-attempt' in tags:
            score = 0.5
            xss_patterns = ['<script', 'alert(', 'onerror=', 'onclick=']
            matches = sum(1 for pat in xss_patterns if pat in username or pat in password)
            score += min(matches * 0.15, 0.4)
            confidence['xss_attempt'] = min(score, 1.0)
        
        # Scanner confidence
        if 'scanner' in tags:
            known_scanners = ['sqlmap', 'nikto', 'nmap', 'masscan', 'acunetix']
            if any(scanner in ua for scanner in known_scanners):
                confidence['scanner'] = 0.9  # High confidence for known scanners
            else:
                confidence['scanner'] = 0.6  # Medium confidence
        
        # Bot confidence
        if 'bot' in tags:
            known_bots = ['bot', 'crawler', 'spider']
            if any(bot in ua for bot in known_bots):
                confidence['bot'] = 0.8
            else:
                confidence['bot'] = 0.5  # Lower for generic tools like curl
        
        # Brute Force confidence
        if 'brute-force' in tags:
            score = 0.6  # Base score for common credentials
            # Increase if seen multiple times from same IP
            src_ip = event.get('src_ip', '')
            if src_ip in self.attack_history:
                repeat_count = self.attack_history[src_ip].get('brute_force_count', 0)
                score += min(repeat_count * 0.05, 0.3)  # Up to +0.3
            confidence['brute_force'] = min(score, 1.0)
        
        # Command Injection confidence
        if 'command-injection' in tags:
            score = 0.6
            cmd_patterns = ['|', '&&', '||', '$(', '`']
            matches = sum(1 for pat in cmd_patterns if pat in username or pat in password)
            score += min(matches * 0.1, 0.3)
            confidence['command_injection'] = min(score, 1.0)
        
        # Other tags get default medium confidence
        for tag in tags:
            tag_key = tag.replace('-', '_')
            if tag_key not in confidence:
                confidence[tag_key] = 0.6
        
        return confidence
    
    def enrich_event(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Enrich a single event with all available data in canonical schema v1.0"""
        
        # Create enriched copy
        enriched = event.copy()
        
        # Canonical enrichment metadata
        enriched['enriched_at'] = datetime.now(timezone.utc).isoformat()
        
        # Get source IP
        src_ip = event.get('src_ip')
        if not src_ip:
            # Add minimal enrichment
            enriched['tags'] = event.get('tags', [])
            return enriched
        
        # Skip private/local IPs
            enriched['enrichment_notes'] = 'Private IP address - skipped GeoIP/ASN'
            src_ip_for_rdns = src_ip  # Still try rDNS for private IPs
        else:
            # Add GeoIP data
            geo_data = self.get_geo_data(src_ip)
            if geo_data:
                enriched['geo'] = geo_data
            
            # Add ASN data
            asn_data = self.get_asn_data(src_ip)
            if asn_data:
                enriched['asn'] = asn_data
            
            src_ip_for_rdns = src_ip
        
        # Add rDNS (best effort)
        rdns = self.get_rdns(src_ip_for_rdns)
        if rdns:
            enriched['rdns'] = rdns
        
        # Apply rule-based tagging
        tags = self.apply_tagging_rules(event)
        if tags:
            # Merge with existing tags if any
            existing_tags = event.get('tags', [])
            all_tags = list(set(existing_tags + tags))
            enriched['tags'] = all_tags
        else:
            enriched['tags'] = event.get('tags', [])
        
        # Calculate confidence scores for detected attacks
        confidence_scores = self.calculate_confidence_scores(enriched, enriched['tags'])
        if confidence_scores:
            enriched['confidence'] = confidence_scores
        
        # Track attack history for this IP (for seen_count)
        if src_ip not in self.attack_history:
            self.attack_history[src_ip] = {
                'first_seen': enriched.get('received_at', enriched.get('timestamp', '')),
                'last_seen': enriched.get('received_at', enriched.get('timestamp', '')),
                'count': 1,
                'brute_force_count': 0
            }
        else:
            self.attack_history[src_ip]['last_seen'] = enriched.get('received_at', enriched.get('timestamp', ''))
            self.attack_history[src_ip]['count'] += 1
        
        # Add canonical seen_count fields
        enriched['first_seen'] = self.attack_history[src_ip]['first_seen']
        enriched['last_seen'] = self.attack_history[src_ip]['last_seen']
        enriched['seen_count'] = self.attack_history[src_ip]['count']
        
        # Update brute force counter if detected
        if 'brute-force' in enriched['tags']:
            self.attack_history[src_ip]['brute_force_count'] = \
                self.attack_history[src_ip].get('brute_force_count', 0) + 1
        
        return enriched
    
    def _is_private_ip(self, ip: str) -> bool:
        """Check if IP is private/local"""
        try:
            parts = ip.split('.')
            if len(parts) != 4:
                return False
            
            first = int(parts[0])
            second = int(parts[1])
            
            # Private ranges
            if first == 10:
                return True
            if first == 172 and 16 <= second <= 31:
                return True
            if first == 192 and second == 168:
                return True
            if first == 127:  # Loopback
                return True
            if first == 169 and second == 254:  # Link-local
                return True
            
            return False
        except (ValueError, IndexError):
            return False
    
    def process(self) -> Dict[str, int]:
        """Process all events and write enriched output"""
        
        stats = {
            'total_read': 0,
            'skipped': 0,
            'enriched': 0,
            'errors': 0
        }
        
        # Check input file exists
        if not self.input_file.exists():
            print(f"❌ Input file not found: {self.input_file}", file=sys.stderr)
            return stats
        
        # Open output file in append mode
        output_mode = 'a' if self.incremental else 'w'
        
        try:
            with open(self.input_file, 'r', encoding='utf-8') as infile, \
                 open(self.output_file, output_mode, encoding='utf-8') as outfile:
                
                for line_num, line in enumerate(infile, 1):
                    line = line.strip()
                    if not line:
                        continue
                    
                    try:
                        event = json.loads(line)
                        stats['total_read'] += 1
                        
                        # Skip if already processed (incremental mode)
                        event_id = event.get('event_id')
                        if self.incremental and event_id in self.processed_ids:
                            stats['skipped'] += 1
                            continue
                        
                        # Enrich the event
                        enriched = self.enrich_event(event)
                        
                        # Write to output
                        outfile.write(json.dumps(enriched, ensure_ascii=False) + '\n')
                        outfile.flush()  # Ensure written immediately
                        
                        stats['enriched'] += 1
                        
                        # Progress indicator
                        if stats['enriched'] % 10 == 0:
                            print(f"📊 Enriched {stats['enriched']} events...", end='\r')
                        
                    except json.JSONDecodeError as e:
                        print(f"⚠️  Line {line_num}: Invalid JSON - {e}", file=sys.stderr)
                        stats['errors'] += 1
                    except Exception as e:
                        print(f"❌ Line {line_num}: Enrichment error - {e}", file=sys.stderr)
                        stats['errors'] += 1
        
        except Exception as e:
            print(f"❌ Fatal error: {e}", file=sys.stderr)
            return stats
        
        return stats
    
    def close(self):
        """Close database readers"""
        if self.city_reader:
            self.city_reader.close()
        if self.asn_reader:
            self.asn_reader.close()


def main():
    parser = argparse.ArgumentParser(
        description='Honeypot Event Enrichment Worker',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Process all events (full run)
  python worker.py
  
  # Process only new events (incremental)
  python worker.py --incremental
  
  # Custom file paths
  python worker.py --input /data/events.jsonl --output /data/enriched.jsonl
  
  # Specify MaxMind database locations
  python worker.py --city-db /opt/GeoLite2-City.mmdb --asn-db /opt/GeoLite2-ASN.mmdb
        """
    )
    
    parser.add_argument(
        '--incremental', '-i',
        action='store_true',
        help='Only process events not already in output file'
    )
    parser.add_argument(
        '--input',
        default=os.environ.get('HONEY_INPUT', '/data/honeypot_events.jsonl'),
        help='Input JSONL file (default: /data/honeypot_events.jsonl)'
    )
    parser.add_argument(
        '--output',
        default=os.environ.get('HONEY_OUTPUT', '/data/honeypot_enriched.jsonl'),
        help='Output enriched JSONL file (default: /data/honeypot_enriched.jsonl)'
    )
    parser.add_argument(
        '--city-db',
        default=os.environ.get('MAXMIND_CITY_DB', '/data/GeoLite2-City.mmdb'),
        help='MaxMind City database path'
    )
    parser.add_argument(
        '--asn-db',
        default=os.environ.get('MAXMIND_ASN_DB', '/data/GeoLite2-ASN.mmdb'),
        help='MaxMind ASN database path'
    )
    
    args = parser.parse_args()
    
    print("🚀 Honeypot Enrichment Worker - Phase 4")
    print("=" * 60)
    print(f"📥 Input:  {args.input}")
    print(f"📤 Output: {args.output}")
    print(f"🔄 Mode:   {'Incremental' if args.incremental else 'Full'}")
    print("=" * 60)
    
    # Create worker
    worker = EnrichmentWorker(
        input_file=args.input,
        output_file=args.output,
        maxmind_city_db=args.city_db,
        maxmind_asn_db=args.asn_db,
        incremental=args.incremental
    )
    
    try:
        # Process events
        stats = worker.process()
        
        print("\n" + "=" * 60)
        print("✅ Enrichment Complete!")
        print("=" * 60)
        print(f"📊 Total events read:    {stats['total_read']}")
        print(f"⏭️  Events skipped:       {stats['skipped']}")
        print(f"✨ Events enriched:      {stats['enriched']}")
        print(f"❌ Errors encountered:   {stats['errors']}")
        print("=" * 60)
        
        if stats['enriched'] > 0:
            print(f"📁 Enriched data saved to: {args.output}")
            print("\n💡 Next steps:")
            print("   - Run analysis on enriched data")
            print("   - Visualize geo distribution")
            print("   - Generate attack reports")
        
        sys.exit(0 if stats['errors'] == 0 else 1)
        
    finally:
        worker.close()


if __name__ == '__main__':
    main()
