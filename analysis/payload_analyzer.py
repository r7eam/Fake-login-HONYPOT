#!/usr/bin/env python3
"""
Advanced Payload Analysis and Attack Classification
Analyzes usernames, passwords, and paths to identify attack patterns
"""

import re
import json
import sys
from collections import Counter

class PayloadAnalyzer:
    """Analyzes attack payloads and classifies attack types"""
    
    def __init__(self):
        # SQL Injection patterns
        self.sql_patterns = [
            r"('\s*(OR|AND)\s*'?\d*'?\s*=\s*'?\d*)",  # ' OR '1'='1
            r"(--|\#|\/\*)",  # SQL comments
            r"(UNION\s+SELECT|UNION\s+ALL)",
            r"(DROP\s+TABLE|DELETE\s+FROM|INSERT\s+INTO)",
            r"(EXEC\s*\(|EXECUTE\s*\()",
            r"(CONCAT\s*\(|CHAR\s*\()",
            r"(xp_cmdshell|sp_executesql)",
        ]
        
        # XSS patterns
        self.xss_patterns = [
            r"<script[^>]*>.*?</script>",
            r"javascript:",
            r"onerror\s*=",
            r"onload\s*=",
            r"onclick\s*=",
            r"<iframe[^>]*>",
            r"<img[^>]*onerror",
            r"alert\s*\(",
            r"document\.cookie",
            r"eval\s*\(",
        ]
        
        # Path Traversal patterns
        self.path_traversal_patterns = [
            r"\.\./",
            r"\.\.\\/",
            r"\.\.\\",
            r"%2e%2e/",
            r"%2e%2e\\",
            r"\.\.;/",
            r"/etc/passwd",
            r"/etc/shadow",
            r"C:\\Windows",
            r"..//",
            r"....//",
        ]
        
        # Command Injection patterns
        self.command_injection_patterns = [
            r";\s*(cat|ls|wget|curl|nc|netcat|bash|sh|cmd|powershell)",
            r"\|\s*(cat|ls|wget|curl|nc|netcat|bash|sh|cmd|powershell)",
            r"`.*`",
            r"\$\(.*\)",
            r"&&",
            r"\|\|",
        ]
        
        # LDAP Injection patterns
        self.ldap_patterns = [
            r"\*\)\(",
            r"\(\|\(",
            r"\)&\(",
        ]
        
        # NoSQL Injection patterns
        self.nosql_patterns = [
            r"\$ne",
            r"\$gt",
            r"\$regex",
            r"\$where",
        ]
        
        # XXE patterns
        self.xxe_patterns = [
            r"<!ENTITY",
            r"<!DOCTYPE",
            r"SYSTEM\s+[\"']",
        ]
        
        # Common credentials (brute-force indicators)
        self.common_passwords = {
            'admin', 'password', '123456', '12345678', 'qwerty', 'abc123',
            'password123', 'admin123', 'root', 'toor', 'pass', 'test',
            '1234', '12345', 'password1', 'letmein', 'welcome', 'monkey',
        }
        
        self.common_usernames = {
            'admin', 'administrator', 'root', 'user', 'test', 'guest',
            'demo', 'superuser', 'sysadmin', 'webmaster', 'support',
        }
    
    def analyze_payload(self, username, password, path="", method="POST"):
        """
        Analyze attack payload and return classification tags
        
        Returns:
            dict: {
                'tags': ['sql-injection', 'brute-force', ...],
                'confidence': {'sql_injection': 0.9, ...},
                'details': {...}
            }
        """
        tags = set()
        confidence = {
            'sql_injection': 0.0,
            'xss': 0.0,
            'path_traversal': 0.0,
            'command_injection': 0.0,
            'brute_force': 0.0,
            'credential_stuffing': 0.0,
            'ldap_injection': 0.0,
            'nosql_injection': 0.0,
            'xxe': 0.0,
            'scanning': 0.0,
        }
        
        details = {
            'username_length': len(username),
            'password_length': len(password),
            'contains_special_chars': False,
            'is_email': False,
            'patterns_detected': []
        }
        
        # Combine all input fields for analysis
        combined = f"{username} {password} {path}"
        
        # Check SQL Injection
        sql_matches = 0
        for pattern in self.sql_patterns:
            if re.search(pattern, combined, re.IGNORECASE):
                sql_matches += 1
                details['patterns_detected'].append(f"SQL: {pattern}")
        
        if sql_matches > 0:
            tags.add('sql-injection')
            confidence['sql_injection'] = min(0.3 + (sql_matches * 0.2), 1.0)
        
        # Check XSS
        xss_matches = 0
        for pattern in self.xss_patterns:
            if re.search(pattern, combined, re.IGNORECASE):
                xss_matches += 1
                details['patterns_detected'].append(f"XSS: {pattern}")
        
        if xss_matches > 0:
            tags.add('xss')
            confidence['xss'] = min(0.4 + (xss_matches * 0.2), 1.0)
        
        # Check Path Traversal
        pt_matches = 0
        for pattern in self.path_traversal_patterns:
            if re.search(pattern, combined, re.IGNORECASE):
                pt_matches += 1
                details['patterns_detected'].append(f"PathTraversal: {pattern}")
        
        if pt_matches > 0:
            tags.add('path-traversal')
            confidence['path_traversal'] = min(0.5 + (pt_matches * 0.2), 1.0)
        
        # Check Command Injection
        cmd_matches = 0
        for pattern in self.command_injection_patterns:
            if re.search(pattern, combined, re.IGNORECASE):
                cmd_matches += 1
                details['patterns_detected'].append(f"CommandInjection: {pattern}")
        
        if cmd_matches > 0:
            tags.add('command-injection')
            confidence['command_injection'] = min(0.6 + (cmd_matches * 0.2), 1.0)
        
        # Check LDAP Injection
        for pattern in self.ldap_patterns:
            if re.search(pattern, combined):
                tags.add('ldap-injection')
                confidence['ldap_injection'] = 0.7
                details['patterns_detected'].append(f"LDAP: {pattern}")
                break
        
        # Check NoSQL Injection
        for pattern in self.nosql_patterns:
            if re.search(pattern, combined):
                tags.add('nosql-injection')
                confidence['nosql_injection'] = 0.7
                details['patterns_detected'].append(f"NoSQL: {pattern}")
                break
        
        # Check XXE
        for pattern in self.xxe_patterns:
            if re.search(pattern, combined, re.IGNORECASE):
                tags.add('xxe')
                confidence['xxe'] = 0.8
                details['patterns_detected'].append(f"XXE: {pattern}")
                break
        
        # Check Brute Force (common credentials)
        if username.lower() in self.common_usernames:
            if password.lower() in self.common_passwords:
                tags.add('brute-force')
                confidence['brute_force'] = 0.8
        
        # Check Credential Stuffing (email + complex password)
        if '@' in username and '.' in username:
            details['is_email'] = True
            if len(password) >= 8 and any(c in password for c in '!@#$%^&*'):
                tags.add('credential-stuffing')
                confidence['credential_stuffing'] = 0.7
        
        # Check for scanning/enumeration
        if len(username) <= 4 and username.isalnum() and len(password) <= 4:
            tags.add('scanning')
            confidence['scanning'] = 0.6
        
        # Check special characters
        if re.search(r'[<>\"\'\\;$(){}[\]]', combined):
            details['contains_special_chars'] = True
            if not tags:  # If no specific attack detected
                tags.add('malicious-input')
        
        # Default tag if nothing detected
        if not tags:
            tags.add('unknown')
        
        return {
            'tags': sorted(list(tags)),
            'confidence': confidence,
            'details': details
        }
    
    def analyze_dataset(self, events):
        """Analyze entire dataset and return statistics"""
        all_tags = []
        attack_types = Counter()
        payload_samples = {}
        
        for event in events:
            username = event.get('username', '')
            password = event.get('password', '')
            path = event.get('path', '')
            
            result = self.analyze_payload(username, password, path)
            
            for tag in result['tags']:
                all_tags.append(tag)
                attack_types[tag] += 1
                
                # Store sample payloads
                if tag not in payload_samples:
                    payload_samples[tag] = {
                        'username': username,
                        'password': password,
                        'path': path,
                        'confidence': result['confidence']
                    }
        
        return {
            'total_events': len(events),
            'attack_types': dict(attack_types),
            'unique_attack_types': len(attack_types),
            'most_common': attack_types.most_common(10),
            'samples': payload_samples
        }


def main():
    """Analyze payloads from enriched data"""
    import os
    
    # Input: enriched JSONL
    INP = "./data/honeypot_enriched.jsonl"
    # Output: analysis report
    OUT_JSON = "./analysis/out/payload_analysis.json"
    OUT_TXT = "./analysis/out/payload_analysis_report.txt"
    
    if not os.path.exists(INP):
        print(f"❌ Error: {INP} not found!")
        sys.exit(1)
    
    print("🔍 Advanced Payload Analysis")
    print("=" * 70)
    print()
    
    # Load events
    events = []
    with open(INP, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                events.append(json.loads(line))
            except:
                pass
    
    print(f"📊 Loaded {len(events)} events")
    print()
    
    # Analyze
    analyzer = PayloadAnalyzer()
    
    print("🎯 Analyzing attack payloads...")
    results = analyzer.analyze_dataset(events)
    
    # Print summary
    print()
    print("=" * 70)
    print("📈 ATTACK PATTERN ANALYSIS")
    print("=" * 70)
    print()
    print(f"Total Events: {results['total_events']}")
    print(f"Unique Attack Types: {results['unique_attack_types']}")
    print()
    print("Attack Type Distribution:")
    for attack_type, count in results['most_common']:
        percentage = (count / results['total_events']) * 100
        print(f"  • {attack_type:30s} {count:4d} events ({percentage:5.1f}%)")
    
    print()
    print("=" * 70)
    print("📋 SAMPLE PAYLOADS BY ATTACK TYPE")
    print("=" * 70)
    print()
    
    for attack_type, sample in results['samples'].items():
        print(f"🎯 {attack_type.upper()}")
        print(f"   Username: {sample['username']}")
        print(f"   Password: {sample['password']}")
        print(f"   Path: {sample['path']}")
        
        # Show top confidence scores
        top_conf = sorted(sample['confidence'].items(), key=lambda x: x[1], reverse=True)[:3]
        print("   Confidence:")
        for conf_type, conf_val in top_conf:
            if conf_val > 0:
                print(f"     - {conf_type}: {conf_val:.2f}")
        print()
    
    # Save results
    os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
    
    with open(OUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"💾 Results saved to:")
    print(f"   • {OUT_JSON}")
    print(f"   • {OUT_TXT}")
    print()
    print("✅ Payload analysis complete!")


if __name__ == '__main__':
    main()
