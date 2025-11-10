#!/usr/bin/env python3
"""
Unit tests for enrichment worker

Run with:
    pytest test_enrichment.py -v
    pytest test_enrichment.py -v --cov=worker
"""

import pytest # pyright: ignore[reportMissingImports]
import json
import tempfile
from pathlib import Path
from datetime import datetime, timezone
import sys

# Import worker module
sys.path.insert(0, str(Path(__file__).parent))
from worker import EnrichmentWorker


class TestSchemaValidation:
    """Test canonical schema compliance"""
    
    def test_canonical_input_schema(self):
        """Test that worker accepts canonical v1.0 input"""
        event = {
            'id': 'test-uuid-1234',
            'received_at': '2025-11-10T12:00:00Z',
            'src_ip': '1.2.3.4',
            'src_port': 12345,
            'path': '/fake-login',
            'method': 'POST',
            'username_hash': 'abc123',
            'password_hash': 'def456',
            'ua': 'sqlmap/1.6',
            'referer': '',
            'body_fingerprint': 'abcd1234',
            'headers_sample': {'accept': '*/*'},
            'tags': ['scanner-ua'],
        }
        
        worker = EnrichmentWorker()
        enriched = worker.enrich_event(event)
        
        # Should preserve all original fields
        assert enriched['id'] == event['id']
        assert enriched['received_at'] == event['received_at']
        assert enriched['src_ip'] == event['src_ip']
        
        # Should add enrichment fields
        assert 'enriched_at' in enriched
        assert 'enrichment_version' in enriched
    
    def test_enriched_output_schema(self):
        """Test that enriched output matches canonical schema"""
        event = {
            'id': 'test-uuid-1234',
            'received_at': '2025-11-10T12:00:00Z',
            'src_ip': '8.8.8.8',  # Public IP for GeoIP
            'path': '/fake-login',
            'method': 'POST',
            'username_hash': 'abc123',
            'password_hash': 'def456',
            'ua': 'sqlmap/1.6',
            'referer': '',
            'body_fingerprint': 'abcd1234',
            'headers_sample': {},
            'tags': [],
        }
        
        worker = EnrichmentWorker()
        enriched = worker.enrich_event(event)
        
        # Required enrichment fields
        assert 'enriched_at' in enriched
        assert 'tags' in enriched
        assert isinstance(enriched['tags'], list)


class TestTaggingRules:
    """Test attack pattern detection and tagging"""
    
    def test_sql_injection_detection(self):
        """Test SQL injection pattern detection"""
        event = {
            'id': '1',
            'received_at': '2025-11-10T12:00:00Z',
            'src_ip': '1.2.3.4',
            'username': "admin' OR 1=1--",
            'password': 'test',
            'ua': 'curl/7.0',
            'tags': [],
        }
        
        worker = EnrichmentWorker()
        tags = worker.apply_tagging_rules(event)
        
        assert 'sql-injection' in tags
    
    def test_xss_detection(self):
        """Test XSS pattern detection"""
        event = {
            'id': '2',
            'received_at': '2025-11-10T12:00:00Z',
            'src_ip': '1.2.3.4',
            'username': '<script>alert(1)</script>',
            'password': 'test',
            'ua': 'Mozilla/5.0',
            'tags': [],
        }
        
        worker = EnrichmentWorker()
        tags = worker.apply_tagging_rules(event)
        
        assert 'xss-attempt' in tags
    
    def test_scanner_detection(self):
        """Test scanner user agent detection"""
        scanners = ['sqlmap/1.6', 'nikto/2.1', 'nmap', 'masscan/1.0']
        
        worker = EnrichmentWorker()
        
        for scanner_ua in scanners:
            event = {
                'id': '3',
                'received_at': '2025-11-10T12:00:00Z',
                'src_ip': '1.2.3.4',
                'username': 'admin',
                'password': 'test',
                'ua': scanner_ua,
                'headers': {'user-agent': scanner_ua},
                'tags': [],
            }
            
            tags = worker.apply_tagging_rules(event)
            assert 'scanner' in tags, f"Failed to detect scanner: {scanner_ua}"
    
    def test_bot_detection(self):
        """Test bot/crawler detection"""
        bots = ['curl/7.0', 'wget/1.0', 'python-requests/2.0', 'Googlebot']
        
        worker = EnrichmentWorker()
        
        for bot_ua in bots:
            event = {
                'id': '4',
                'received_at': '2025-11-10T12:00:00Z',
                'src_ip': '1.2.3.4',
                'username': 'admin',
                'password': 'test',
                'ua': bot_ua,
                'headers': {'user-agent': bot_ua},
                'tags': [],
            }
            
            tags = worker.apply_tagging_rules(event)
            assert 'bot' in tags, f"Failed to detect bot: {bot_ua}"
    
    def test_brute_force_detection(self):
        """Test brute force (common credentials) detection"""
        common_creds = [
            ('admin', 'admin'),
            ('root', 'password'),
            ('test', 'test'),
            ('admin', '123456'),
        ]
        
        worker = EnrichmentWorker()
        
        for username, password in common_creds:
            event = {
                'id': '5',
                'received_at': '2025-11-10T12:00:00Z',
                'src_ip': '1.2.3.4',
                'username': username,
                'password': password,
                'ua': 'curl/7.0',
                'tags': [],
            }
            
            tags = worker.apply_tagging_rules(event)
            assert 'brute-force' in tags, f"Failed to detect brute force: {username}:{password}"
    
    def test_long_input_detection(self):
        """Test long input (buffer overflow) detection"""
        event = {
            'id': '6',
            'received_at': '2025-11-10T12:00:00Z',
            'src_ip': '1.2.3.4',
            'username': 'A' * 100,  # Very long username
            'password': 'B' * 200,  # Very long password
            'ua': 'curl/7.0',
            'tags': [],
        }
        
        worker = EnrichmentWorker()
        tags = worker.apply_tagging_rules(event)
        
        assert 'long-input' in tags
    
    def test_command_injection_detection(self):
        """Test command injection pattern detection"""
        patterns = [
            'test | ls',
            'admin && whoami',
            'user; cat /etc/passwd',
            'test $(id)',
        ]
        
        worker = EnrichmentWorker()
        
        for pattern in patterns:
            event = {
                'id': '7',
                'received_at': '2025-11-10T12:00:00Z',
                'src_ip': '1.2.3.4',
                'username': pattern,
                'password': 'test',
                'ua': 'curl/7.0',
                'tags': [],
            }
            
            tags = worker.apply_tagging_rules(event)
            assert 'command-injection' in tags, f"Failed to detect command injection: {pattern}"
    
    def test_multiple_tags(self):
        """Test that multiple attack patterns generate multiple tags"""
        event = {
            'id': '8',
            'received_at': '2025-11-10T12:00:00Z',
            'src_ip': '1.2.3.4',
            'username': "admin' OR 1=1--",  # SQL injection
            'password': 'admin',  # Brute force
            'ua': 'sqlmap/1.6',  # Scanner
            'headers': {'user-agent': 'sqlmap/1.6'},
            'tags': [],
        }
        
        worker = EnrichmentWorker()
        tags = worker.apply_tagging_rules(event)
        
        assert 'sql-injection' in tags
        assert 'brute-force' in tags
        assert 'scanner' in tags
        assert len(tags) >= 3


class TestGeoIPEnrichment:
    """Test GeoIP enrichment (mock mode)"""
    
    def test_private_ip_skipped(self):
        """Test that private IPs skip GeoIP lookup"""
        worker = EnrichmentWorker()
        
        assert worker._is_private_ip('192.168.1.1') == True
        assert worker._is_private_ip('10.0.0.1') == True
        assert worker._is_private_ip('172.16.0.1') == True
        assert worker._is_private_ip('127.0.0.1') == True
        assert worker._is_private_ip('8.8.8.8') == False
        assert worker._is_private_ip('1.2.3.4') == False
    
    def test_enrichment_without_maxmind(self):
        """Test enrichment works without MaxMind databases"""
        event = {
            'id': '9',
            'received_at': '2025-11-10T12:00:00Z',
            'src_ip': '1.2.3.4',
            'username': 'test',
            'password': 'test',
            'ua': 'curl/7.0',
            'tags': [],
        }
        
        worker = EnrichmentWorker()
        enriched = worker.enrich_event(event)
        
        # Should still enrich even without GeoIP
        assert 'enriched_at' in enriched
        assert 'tags' in enriched


class TestIncrementalProcessing:
    """Test incremental mode"""
    
    def test_incremental_mode_skips_processed(self):
        """Test that incremental mode skips already processed events"""
        with tempfile.TemporaryDirectory() as tmpdir:
            input_file = Path(tmpdir) / 'input.jsonl'
            output_file = Path(tmpdir) / 'output.jsonl'
            
            # Create input with 3 events
            events = [
                {'id': '1', 'received_at': '2025-11-10T12:00:00Z', 'src_ip': '1.2.3.4', 'username': 'test1', 'password': 'pass1', 'tags': []},
                {'id': '2', 'received_at': '2025-11-10T12:01:00Z', 'src_ip': '1.2.3.5', 'username': 'test2', 'password': 'pass2', 'tags': []},
                {'id': '3', 'received_at': '2025-11-10T12:02:00Z', 'src_ip': '1.2.3.6', 'username': 'test3', 'password': 'pass3', 'tags': []},
            ]
            
            with open(input_file, 'w') as f:
                for event in events:
                    f.write(json.dumps(event) + '\n')
            
            # First run: process all
            worker1 = EnrichmentWorker(
                input_file=str(input_file),
                output_file=str(output_file),
                incremental=False
            )
            stats1 = worker1.process()
            assert stats1['enriched'] == 3
            
            # Second run: incremental mode should skip all
            worker2 = EnrichmentWorker(
                input_file=str(input_file),
                output_file=str(output_file),
                incremental=True
            )
            stats2 = worker2.process()
            assert stats2['skipped'] == 3
            assert stats2['enriched'] == 0


class TestProcessing:
    """Test full processing pipeline"""
    
    def test_full_processing(self):
        """Test complete processing workflow"""
        with tempfile.TemporaryDirectory() as tmpdir:
            input_file = Path(tmpdir) / 'events.jsonl'
            output_file = Path(tmpdir) / 'enriched.jsonl'
            
            # Create test events
            events = [
                {
                    'id': 'test-1',
                    'received_at': '2025-11-10T12:00:00Z',
                    'src_ip': '1.2.3.4',
                    'username': "admin' OR 1=1--",
                    'password': 'admin',
                    'ua': 'sqlmap/1.6',
                    'tags': []
                },
            ]
            
            with open(input_file, 'w') as f:
                for event in events:
                    f.write(json.dumps(event) + '\n')
            
            # Process
            worker = EnrichmentWorker(
                input_file=str(input_file),
                output_file=str(output_file)
            )
            stats = worker.process()
            worker.close()
            
            assert stats['enriched'] == 1
            assert stats['errors'] == 0
            
            # Verify output
            with open(output_file, 'r') as f:
                enriched_event = json.loads(f.readline())
                
                assert enriched_event['id'] == 'test-1'
                assert 'enriched_at' in enriched_event
                assert 'sql-injection' in enriched_event['tags']
                assert 'brute-force' in enriched_event['tags']
                assert 'scanner' in enriched_event['tags']


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
