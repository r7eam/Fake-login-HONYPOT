# Data Directory

This directory stores honeypot event logs in JSONL format.

## Security
- This directory should have restricted permissions (700 on Unix systems)
- Contains sensitive security research data
- Not to be committed to version control

## Contents
- `honeypot_events.jsonl` - Log of all fake login attempts

## Retention
- Data is retained for 180 days as per the retention policy
- Automated cleanup should be configured

## Windows Permissions
To secure this directory on Windows:
1. Right-click folder → Properties → Security
2. Remove inherited permissions
3. Grant Full Control only to the service account and administrators
