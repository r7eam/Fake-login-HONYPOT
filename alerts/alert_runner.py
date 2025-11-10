#!/usr/bin/env python3
"""
Alert Runner for Honeypot Events

Simple tail-and-alert process:
- Watches ENRICHED_LOG for new lines
- Aggregates counts per src_ip in ALERT_WINDOW_MINUTES
- When count >= BRUTE_FORCE_THRESHOLD, posts to SLACK_WEBHOOK_URL

Security:
- Runs as non-root user (UID 1002)
- Read-only access to enriched log
- Safe for academic/demo use
"""

import os
import time
import json
import requests
import collections
import logging
from datetime import datetime, timedelta
from dateutil import parser

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration from environment
ENRICHED_LOG = os.getenv('ENRICHED_LOG', '/data/honeypot_enriched.jsonl')
WINDOW_MIN = int(os.getenv('ALERT_WINDOW_MINUTES', '10'))
THRESH = int(os.getenv('BRUTE_FORCE_THRESHOLD', '10'))
SLACK_WEBHOOK = os.getenv('SLACK_WEBHOOK_URL', '').strip()


def post_slack(text: str, blocks=None):
    """
    Post alert to Slack webhook.
    
    Args:
        text: Alert message text
        blocks: Optional Slack blocks for rich formatting
    """
    if not SLACK_WEBHOOK:
        logger.warning(f"No SLACK_WEBHOOK set; would alert: {text}")
        return
    
    payload = {"text": text}
    if blocks:
        payload["blocks"] = blocks
    
    try:
        response = requests.post(SLACK_WEBHOOK, json=payload, timeout=5)
        response.raise_for_status()
        logger.info(f"Alert sent to Slack: {text[:100]}...")
    except Exception as e:
        logger.error(f"Slack post failed: {e}")


def parse_line(line: str) -> dict:
    """
    Parse JSONL line safely.
    
    Args:
        line: JSON string
        
    Returns:
        Parsed dict or None on error
    """
    try:
        return json.loads(line)
    except json.JSONDecodeError:
        logger.debug(f"Failed to parse line: {line[:100]}")
        return None


def tail_file(path: str):
    """
    Generator that yields new lines appended to file.
    
    Args:
        path: Path to file to tail
        
    Yields:
        New lines as they are appended
    """
    with open(path, 'r', encoding='utf8', errors='ignore') as f:
        # Seek to end of file
        f.seek(0, 2)
        logger.info(f"Tailing file: {path}")
        
        while True:
            line = f.readline()
            if not line:
                time.sleep(1)
                continue
            yield line.strip()


def format_alert_message(ip: str, count: int, event: dict) -> str:
    """
    Format alert message for Slack.
    
    Args:
        ip: Source IP address
        count: Number of attempts
        event: Last event dict
        
    Returns:
        Formatted alert message
    """
    lines = [
        f"🚨 *Honeypot Brute-Force Alert*",
        f"",
        f"*Source IP:* `{ip}`",
        f"*Attempts:* {count} in last {WINDOW_MIN} minutes",
        f"*Threshold:* {THRESH}",
        f""
    ]
    
    # Add GeoIP info if available
    if event.get('geo'):
        geo = event['geo']
        location = f"{geo.get('city', 'Unknown')}, {geo.get('country', 'Unknown')}"
        lines.append(f"*Location:* {location}")
    
    # Add ASN info if available
    if event.get('asn'):
        asn = event['asn']
        lines.append(f"*ASN:* {asn.get('asn', 'Unknown')} ({asn.get('org', 'Unknown')})")
    
    # Add rDNS if available
    if event.get('rdns'):
        lines.append(f"*rDNS:* `{event['rdns']}`")
    
    # Add attack tags
    if event.get('tags'):
        tags = ', '.join(event['tags'][:5])
        lines.append(f"*Attack Tags:* {tags}")
    
    # Add confidence scores if available
    if event.get('confidence'):
        confidence = event['confidence']
        top_attacks = sorted(confidence.items(), key=lambda x: x[1], reverse=True)[:3]
        if top_attacks:
            conf_str = ', '.join([f"{attack}: {score:.2f}" for attack, score in top_attacks])
            lines.append(f"*Confidence:* {conf_str}")
    
    # Add event ID
    lines.append(f"")
    lines.append(f"*Event ID:* `{event.get('id', 'unknown')}`")
    
    return '\n'.join(lines)


def main():
    """
    Main alert loop.
    
    Maintains sliding window of events per IP and triggers alerts
    when threshold exceeded.
    """
    # Track events per IP (timestamp list)
    events = collections.defaultdict(list)
    
    # Ensure enriched log exists
    if not os.path.exists(ENRICHED_LOG):
        logger.warning(f"Enriched log not found, creating: {ENRICHED_LOG}")
        open(ENRICHED_LOG, 'a').close()
    
    logger.info(f"Alert runner started")
    logger.info(f"  Window: {WINDOW_MIN} minutes")
    logger.info(f"  Threshold: {THRESH} attempts")
    logger.info(f"  Slack webhook: {'configured' if SLACK_WEBHOOK else 'NOT SET'}")
    
    # Tail enriched log
    for line in tail_file(ENRICHED_LOG):
        # Parse event
        rec = parse_line(line)
        if not rec or 'src_ip' not in rec or 'enriched_at' not in rec:
            continue
        
        # Parse timestamp
        try:
            event_time = parser.isoparse(rec['enriched_at'])
            # Make timezone-aware if naive
            if event_time.tzinfo is None:
                event_time = event_time.replace(tzinfo=datetime.now().astimezone().tzinfo)
        except Exception as e:
            logger.debug(f"Failed to parse timestamp: {e}")
            event_time = datetime.now().astimezone()
        
        ip = rec.get('src_ip')
        
        # Add to events list for this IP
        events[ip].append({
            'timestamp': event_time,
            'event': rec
        })
        
        # Prune events older than window
        cutoff = datetime.now().astimezone() - timedelta(minutes=WINDOW_MIN)
        events[ip] = [e for e in events[ip] if e['timestamp'] >= cutoff]
        
        # Check threshold
        count = len(events[ip])
        if count >= THRESH:
            # Build alert message
            last_event = events[ip][-1]['event']
            alert_text = format_alert_message(ip, count, last_event)
            
            # Send alert
            post_slack(alert_text)
            
            # Reset counter to avoid spam (basic damping)
            # Keep only the last event to allow re-alerting after cooldown
            events[ip] = events[ip][-1:]
            
            logger.info(f"Alert triggered for {ip} ({count} attempts)")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("Alert runner stopped by user")
    except Exception as e:
        logger.error(f"Alert runner error: {e}", exc_info=True)
        raise
