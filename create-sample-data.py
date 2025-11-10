import json
from datetime import datetime, timedelta
import random
import hashlib

# Generate 100 realistic enriched events with REAL attack patterns
countries_ips = {
    "China": ["103.41.184", "121.42.153", "218.92.0"],
    "Russia": ["185.156.73", "91.234.99", "195.16.88"],
    "USA": ["45.79.203", "192.241.134", "167.99.12"],
    "Iraq": ["37.236.213", "185.107.56", "151.236.219"],
    "India": ["103.253.145", "117.239.240", "182.69.74"],
    "Brazil": ["177.54.144", "187.32.101", "200.98.137"],
    "Germany": ["194.36.191", "46.101.122", "95.216.54"],
    "Ukraine": ["46.151.52", "91.203.5", "178.209.52"]
}

# Real attack payloads
attack_patterns = [
    # SQL Injection
    {"user": "admin", "pass": "' OR '1'='1", "tag": "scanning", "path": "/fake-login"},
    {"user": "admin'--", "pass": "anything", "tag": "scanning", "path": "/fake-login"},
    {"user": "' OR 1=1--", "pass": "x", "tag": "scanning", "path": "/admin-login"},
    
    # XSS attempts
    {"user": "<script>alert(1)</script>", "pass": "test", "tag": "scanning", "path": "/fake-login"},
    {"user": "admin", "pass": "<img src=x onerror=alert(1)>", "tag": "scanning", "path": "/login"},
    
    # Path traversal
    {"user": "../../../etc/passwd", "pass": "admin", "tag": "scanning", "path": "/fake-login"},
    {"user": "....//....//admin", "pass": "admin", "tag": "scanning", "path": "/admin-login"},
    
    # Brute force - admin
    {"user": "admin", "pass": "admin", "tag": "brute-force", "path": "/fake-login"},
    {"user": "admin", "pass": "password", "tag": "brute-force", "path": "/fake-login"},
    {"user": "admin", "pass": "123456", "tag": "brute-force", "path": "/fake-login"},
    {"user": "admin", "pass": "admin123", "tag": "brute-force", "path": "/fake-login"},
    {"user": "admin", "pass": "P@ssw0rd", "tag": "brute-force", "path": "/fake-login"},
    {"user": "admin", "pass": "root", "tag": "brute-force", "path": "/fake-login"},
    
    # Brute force - root
    {"user": "root", "pass": "root", "tag": "brute-force", "path": "/fake-login"},
    {"user": "root", "pass": "toor", "tag": "brute-force", "path": "/fake-login"},
    {"user": "root", "pass": "password", "tag": "brute-force", "path": "/admin-login"},
    {"user": "root", "pass": "12345", "tag": "brute-force", "path": "/fake-login"},
    
    # Credential stuffing
    {"user": "john.doe@company.com", "pass": "Summer2023!", "tag": "credential-stuffing", "path": "/login"},
    {"user": "jane.smith@company.com", "pass": "Winter2023!", "tag": "credential-stuffing", "path": "/login"},
    {"user": "bob.jones@company.com", "pass": "Spring2023!", "tag": "credential-stuffing", "path": "/api/auth"},
    
    # Enumeration
    {"user": "administrator", "pass": "admin", "tag": "enumeration", "path": "/fake-login"},
    {"user": "webmaster", "pass": "admin", "tag": "enumeration", "path": "/admin-login"},
    {"user": "support", "pass": "support123", "tag": "enumeration", "path": "/fake-login"},
    {"user": "manager", "pass": "manager", "tag": "enumeration", "path": "/login"},
]

user_agents = [
    "python-requests/2.31.0",
    "curl/7.88.1", 
    "Scrapy/2.11.0",
    "Go-http-client/1.1",
    "axios/1.6.2",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
    "Mozilla/5.0 (X11; Linux x86_64) Chrome/119.0.0.0"
]

events = []
base_time = datetime.now()

for i in range(100):
    country = random.choice(list(countries_ips.keys()))
    ip_prefix = random.choice(countries_ips[country])
    ip = f"{ip_prefix}.{random.randint(1,255)}"
    
    pattern = random.choice(attack_patterns)
    
    # Hash the password to simulate real honeypot behavior
    pass_hash = hashlib.sha256(pattern["pass"].encode()).hexdigest()
    
    event = {
        "timestamp": (base_time - timedelta(hours=random.randint(0, 48), minutes=random.randint(0, 59))).isoformat() + "Z",
        "received_at": (base_time - timedelta(hours=random.randint(0, 48), minutes=random.randint(0, 59))).isoformat() + "Z",
        "ip": ip,
        "username": pattern["user"],
        "password": pattern["pass"],  # Keep actual password for demo
        "password_hash": pass_hash,
        "path": pattern["path"],
        "method": "POST",
        "user_agent": random.choice(user_agents),
        "geo_country": country,
        "geo_city": "Unknown",
        "geo_lat": random.uniform(-90, 90),
        "geo_lon": random.uniform(-180, 180),
        "asn_number": random.randint(1000, 99999),
        "asn_org": f"{country}-ISP-{random.randint(1, 50)}",
        "rdns": None,
        "tags": [pattern["tag"]],
        "confidence": {
            "brute_force": 0.9 if pattern["tag"] == "brute-force" else 0.1,
            "credential_stuffing": 0.9 if pattern["tag"] == "credential-stuffing" else 0.1,
            "scanning": 0.9 if pattern["tag"] == "scanning" else 0.1
        }
    }
    events.append(event)

# Write to file
with open("data/honeypot_enriched.jsonl", "w") as f:
    for event in events:
        f.write(json.dumps(event) + "\n")

print(f"✅ Created {len(events)} enriched events in data/honeypot_enriched.jsonl")
