# Attacker Simulation & Analysis Guide

## 🎭 Attack Simulation Scenarios

### Scenario 1: Basic Brute Force Attack
**What**: Try common username/password combinations
**Where**: http://localhost/fake-login

```powershell
# Run this in PowerShell from project root
# Simulate 10 different login attempts with common credentials

$attacks = @(
    @{username='admin'; password='admin'},
    @{username='admin'; password='password'},
    @{username='admin'; password='123456'},
    @{username='administrator'; password='admin123'},
    @{username='root'; password='toor'},
    @{username='admin'; password='admin123'},
    @{username='administrator'; password='password'},
    @{username='user'; password='user'},
    @{username='test'; password='test'},
    @{username='admin'; password='P@ssw0rd'}
)

Write-Host "=== SIMULATING BRUTE FORCE ATTACK ===" -ForegroundColor Red
foreach ($cred in $attacks) {
    Write-Host "Trying: $($cred.username) / $($cred.password)" -ForegroundColor Yellow
    Invoke-WebRequest -Uri "http://localhost/fake-login" `
        -Method POST `
        -Body $cred `
        -ContentType 'application/x-www-form-urlencoded' `
        -ErrorAction SilentlyContinue | Out-Null
    Start-Sleep -Milliseconds 500
}
Write-Host "Attack complete! Check honeypot logs." -ForegroundColor Green
```

### Scenario 2: SQL Injection Attempts
**What**: Try SQL injection payloads
**Where**: http://localhost/fake-login

```powershell
# SQL Injection attack simulation
$sqlInjections = @(
    "admin' OR '1'='1",
    "admin'--",
    "admin' #",
    "admin'/*",
    "' OR 1=1--",
    "admin' OR '1'='1'/*",
    "' OR 'a'='a",
    "admin'; DROP TABLE users--"
)

Write-Host "=== SIMULATING SQL INJECTION ATTACK ===" -ForegroundColor Red
foreach ($payload in $sqlInjections) {
    Write-Host "Injecting: $payload" -ForegroundColor Yellow
    Invoke-WebRequest -Uri "http://localhost/fake-login" `
        -Method POST `
        -Body @{username=$payload; password='anything'} `
        -ContentType 'application/x-www-form-urlencoded' `
        -ErrorAction SilentlyContinue | Out-Null
    Start-Sleep -Milliseconds 300
}
Write-Host "SQL Injection attack complete!" -ForegroundColor Green
```

### Scenario 3: Automated Scanner Simulation
**What**: Mimic security scanner tools
**Where**: http://localhost/fake-login

```powershell
# Scanner tool simulation with custom User-Agent
$scanners = @(
    'sqlmap/1.0',
    'nikto/2.1.5',
    'nmap',
    'masscan/1.0',
    'Burp Suite',
    'OWASP ZAP'
)

Write-Host "=== SIMULATING SCANNER TOOLS ===" -ForegroundColor Red
foreach ($scanner in $scanners) {
    Write-Host "Using scanner: $scanner" -ForegroundColor Yellow
    Invoke-WebRequest -Uri "http://localhost/fake-login" `
        -Method POST `
        -Body @{username='admin'; password='test'} `
        -UserAgent $scanner `
        -ContentType 'application/x-www-form-urlencoded' `
        -ErrorAction SilentlyContinue | Out-Null
    Start-Sleep -Milliseconds 400
}
Write-Host "Scanner attack complete!" -ForegroundColor Green
```

### Scenario 4: Credential Stuffing
**What**: Use leaked username/password combinations
**Where**: http://localhost/fake-login

```powershell
# Credential stuffing (simulated leaked database)
$leakedCreds = @(
    @{username='john.doe@example.com'; password='Summer2023!'},
    @{username='alice.smith@company.com'; password='MyPassword123'},
    @{username='bob.jones@mail.com'; password='qwerty123'},
    @{username='sarah.williams@test.com'; password='P@ssw0rd2024'},
    @{username='mike.brown@demo.com'; password='Welcome123'}
)

Write-Host "=== SIMULATING CREDENTIAL STUFFING ===" -ForegroundColor Red
foreach ($cred in $leakedCreds) {
    Write-Host "Testing leaked credential: $($cred.username)" -ForegroundColor Yellow
    Invoke-WebRequest -Uri "http://localhost/fake-login" `
        -Method POST `
        -Body $cred `
        -ContentType 'application/x-www-form-urlencoded' `
        -ErrorAction SilentlyContinue | Out-Null
    Start-Sleep -Milliseconds 600
}
Write-Host "Credential stuffing complete!" -ForegroundColor Green
```

### Scenario 5: No User-Agent (Suspicious Behavior)
**What**: Attack without identifying browser
**Where**: http://localhost/fake-login

```powershell
# Anonymous attack (no user agent)
Write-Host "=== SIMULATING ANONYMOUS ATTACK ===" -ForegroundColor Red
Invoke-WebRequest -Uri "http://localhost/fake-login" `
    -Method POST `
    -Body @{username='admin'; password='test'} `
    -UserAgent '' `
    -ContentType 'application/x-www-form-urlencoded' `
    -ErrorAction SilentlyContinue | Out-Null
Write-Host "Anonymous attack complete!" -ForegroundColor Green
```

### Scenario 6: Multiple Endpoints Attack
**What**: Try different paths (path traversal)
**Where**: Multiple URLs

```powershell
# Try multiple endpoints
$endpoints = @(
    'http://localhost/fake-login',
    'http://localhost/login',
    'http://localhost/admin',
    'http://localhost/wp-login.php',
    'http://localhost/administrator',
    'http://localhost/admin/login'
)

Write-Host "=== SIMULATING ENDPOINT DISCOVERY ===" -ForegroundColor Red
foreach ($endpoint in $endpoints) {
    Write-Host "Trying: $endpoint" -ForegroundColor Yellow
    try {
        Invoke-WebRequest -Uri $endpoint `
            -Method POST `
            -Body @{username='admin'; password='admin'} `
            -ContentType 'application/x-www-form-urlencoded' `
            -ErrorAction SilentlyContinue | Out-Null
    } catch {}
    Start-Sleep -Milliseconds 200
}
Write-Host "Endpoint discovery complete!" -ForegroundColor Green
```

---

## 📊 ANALYSIS: Where to Get Your Data

### Location 1: Raw Event Log
**File**: `C:\Users\Alsakkal\Desktop\Fake login HONYPOT\data\honeypot_events.jsonl`

```powershell
# View all events
Get-Content .\data\honeypot_events.jsonl

# Count total attacks
(Get-Content .\data\honeypot_events.jsonl).Count

# View in pretty format
Get-Content .\data\honeypot_events.jsonl | ForEach-Object { 
    $_ | ConvertFrom-Json | ConvertTo-Json -Depth 5 
}
```

### Location 2: Docker Logs
**Source**: Honeypot container logs

```powershell
# View honeypot service logs
docker logs fullcraft_honeypot

# Follow live logs
docker logs -f fullcraft_honeypot

# Nginx access logs
docker logs fullcraft_honeypot_nginx
```

### Location 3: Nginx Log Files
**Directory**: `C:\Users\Alsakkal\Desktop\Fake login HONYPOT\nginx\logs\`

```powershell
# View nginx access log
Get-Content .\nginx\logs\honeypot_access.log

# View nginx error log
Get-Content .\nginx\logs\honeypot_error.log
```

---

## 🔍 ANALYSIS SCRIPTS

### Analysis 1: Attack Summary Statistics

```powershell
# Run from project root
Write-Host "`n=== HONEYPOT ATTACK ANALYSIS ===" -ForegroundColor Cyan

# Total attacks
$total = (Get-Content .\data\honeypot_events.jsonl).Count
Write-Host "`nTotal Attacks Captured: $total" -ForegroundColor Yellow

# Parse all events
$events = Get-Content .\data\honeypot_events.jsonl | ForEach-Object { $_ | ConvertFrom-Json }

# Most common IPs
Write-Host "`n--- Top Attacking IPs ---" -ForegroundColor Green
$events | Group-Object src_ip | Sort-Object Count -Descending | Select-Object -First 5 | Format-Table Count, Name -AutoSize

# Attack timeline
Write-Host "`n--- Attack Timeline ---" -ForegroundColor Green
$events | ForEach-Object { $_.received_at } | Sort-Object | Select-Object -First 5 -Last 5

# Username length distribution (helps identify patterns)
Write-Host "`n--- Username Length Distribution ---" -ForegroundColor Green
$events | Group-Object username_len | Sort-Object Name | Format-Table Count, Name -AutoSize

# Password length distribution
Write-Host "`n--- Password Length Distribution ---" -ForegroundColor Green
$events | Group-Object password_len | Sort-Object Name | Format-Table Count, Name -AutoSize

# Tagged events (scanners, suspicious)
Write-Host "`n--- Tagged Events ---" -ForegroundColor Green
$tagged = $events | Where-Object { $_.tags.Count -gt 0 }
Write-Host "Scanner attempts: $($tagged.Count)"
$events | Where-Object { $_.tags -contains 'scanner-ua' } | Select-Object -ExpandProperty ua -Unique

# Missing User-Agent attacks
$noUA = $events | Where-Object { $_.tags -contains 'missing-ua' }
Write-Host "Missing User-Agent: $($noUA.Count)"
```

### Analysis 2: Find Most Common Username Hashes

```powershell
# Identify most frequently tried usernames (by hash)
Write-Host "`n=== MOST COMMON USERNAME ATTEMPTS ===" -ForegroundColor Cyan

$events = Get-Content .\data\honeypot_events.jsonl | ForEach-Object { $_ | ConvertFrom-Json }

$events | Group-Object username_hash | 
    Sort-Object Count -Descending | 
    Select-Object -First 10 Count, Name, @{
        Name='Username_Length'
        Expression={ ($events | Where-Object { $_.username_hash -eq $_.Name } | Select-Object -First 1).username_len }
    } | Format-Table -AutoSize

Write-Host "`nNote: Same hash = same username tried multiple times" -ForegroundColor Yellow
```

### Analysis 3: Time-based Analysis

```powershell
# Attack patterns over time
Write-Host "`n=== TIME-BASED ATTACK ANALYSIS ===" -ForegroundColor Cyan

$events = Get-Content .\data\honeypot_events.jsonl | ForEach-Object { $_ | ConvertFrom-Json }

# Group by hour
$byHour = $events | ForEach-Object {
    [PSCustomObject]@{
        Hour = ([DateTime]$_.received_at).Hour
        Timestamp = $_.received_at
    }
} | Group-Object Hour | Sort-Object Name

Write-Host "`nAttacks by Hour of Day:" -ForegroundColor Green
$byHour | Format-Table @{Name='Hour';Expression={$_.Name}}, @{Name='Attacks';Expression={$_.Count}} -AutoSize

# Time between attacks (attack speed)
Write-Host "`nAttack Speed Analysis:" -ForegroundColor Green
$times = $events | ForEach-Object { [DateTime]$_.received_at } | Sort-Object
for ($i = 1; $i -lt [Math]::Min(10, $times.Count); $i++) {
    $diff = ($times[$i] - $times[$i-1]).TotalSeconds
    Write-Host "Attack $i to $($i+1): $diff seconds"
}
```

### Analysis 4: Detect SQL Injection Attempts

```powershell
# Identify potential SQL injection by username length
Write-Host "`n=== SQL INJECTION DETECTION ===" -ForegroundColor Cyan

$events = Get-Content .\data\honeypot_events.jsonl | ForEach-Object { $_ | ConvertFrom-Json }

# Long usernames might indicate injection attempts
$suspicious = $events | Where-Object { $_.username_len -gt 20 }

Write-Host "Suspicious long usernames (potential SQL injection):" -ForegroundColor Yellow
Write-Host "Total: $($suspicious.Count)"

$suspicious | Select-Object username_len, username_hash, src_ip, received_at | Format-Table -AutoSize

# Very short passwords with long usernames = likely injection
$injectionPattern = $events | Where-Object { $_.username_len -gt 15 -and $_.password_len -lt 10 }
Write-Host "`nLikely SQL Injection Patterns: $($injectionPattern.Count)" -ForegroundColor Red
```

### Analysis 5: User-Agent Analysis

```powershell
# Analyze User-Agents to identify bots vs humans
Write-Host "`n=== USER-AGENT ANALYSIS ===" -ForegroundColor Cyan

$events = Get-Content .\data\honeypot_events.jsonl | ForEach-Object { $_ | ConvertFrom-Json }

# Group by user agent
Write-Host "`nUnique User-Agents:" -ForegroundColor Green
$events | Select-Object -ExpandProperty ua -Unique | ForEach-Object {
    if ($_ -match 'sqlmap|nikto|nmap|masscan|scanner|bot') {
        Write-Host "  [SCANNER] $_" -ForegroundColor Red
    } elseif ($_ -eq '') {
        Write-Host "  [NO UA] <empty>" -ForegroundColor Yellow
    } else {
        Write-Host "  [BROWSER] $($_.Substring(0, [Math]::Min(80, $_.Length)))..." -ForegroundColor Green
    }
}

# Scanner percentage
$scanners = $events | Where-Object { $_.tags -contains 'scanner-ua' }
$percentage = [Math]::Round(($scanners.Count / $events.Count) * 100, 2)
Write-Host "`nScanner Traffic: $percentage%" -ForegroundColor Yellow
```

---

## 📈 EXPORT DATA FOR ANALYSIS

### Export to CSV for Excel

```powershell
# Export to CSV for Excel analysis
$events = Get-Content .\data\honeypot_events.jsonl | ForEach-Object { $_ | ConvertFrom-Json }

$csv = $events | Select-Object `
    id,
    received_at,
    src_ip,
    username_hash,
    username_len,
    password_hash,
    password_len,
    ua,
    @{Name='is_scanner';Expression={$_.tags -contains 'scanner-ua'}},
    @{Name='missing_ua';Expression={$_.tags -contains 'missing-ua'}}

$csv | Export-Csv -Path ".\data\honeypot_analysis.csv" -NoTypeInformation

Write-Host "Exported to: .\data\honeypot_analysis.csv" -ForegroundColor Green
Write-Host "Open with Excel for visual analysis" -ForegroundColor Yellow
```

### Generate Statistics Report

```powershell
# Generate comprehensive report
$events = Get-Content .\data\honeypot_events.jsonl | ForEach-Object { $_ | ConvertFrom-Json }

$report = @"
==============================================
HONEYPOT SECURITY ANALYSIS REPORT
Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
==============================================

OVERVIEW:
---------
Total Attacks: $($events.Count)
Unique IPs: $(($events | Select-Object -ExpandProperty src_ip -Unique).Count)
Date Range: $($events[0].received_at) to $($events[-1].received_at)

TOP ATTACKERS:
--------------
$($events | Group-Object src_ip | Sort-Object Count -Descending | Select-Object -First 5 | ForEach-Object { "$($_.Name): $($_.Count) attempts" } | Out-String)

ATTACK PATTERNS:
----------------
Scanner Detection: $(($events | Where-Object { $_.tags -contains 'scanner-ua' }).Count)
Missing User-Agent: $(($events | Where-Object { $_.tags -contains 'missing-ua' }).Count)
Potential SQL Injection: $(($events | Where-Object { $_.username_len -gt 20 }).Count)

USERNAME STATISTICS:
--------------------
Avg Length: $([Math]::Round(($events | Measure-Object -Property username_len -Average).Average, 2))
Max Length: $(($events | Measure-Object -Property username_len -Maximum).Maximum)
Min Length: $(($events | Measure-Object -Property username_len -Minimum).Minimum)

PASSWORD STATISTICS:
--------------------
Avg Length: $([Math]::Round(($events | Measure-Object -Property password_len -Average).Average, 2))
Max Length: $(($events | Measure-Object -Property password_len -Maximum).Maximum)
Min Length: $(($events | Measure-Object -Property password_len -Minimum).Minimum)

RECOMMENDATIONS:
----------------
1. Block top attacking IPs if persistent
2. Implement stricter rate limiting for scanner tools
3. Alert on SQL injection patterns
4. Monitor for credential stuffing patterns

==============================================
"@

$report | Out-File -FilePath ".\data\security_report.txt"
Write-Host $report
Write-Host "`nReport saved to: .\data\security_report.txt" -ForegroundColor Green
```

---

## 🎯 COMPLETE ATTACK SIMULATION

### Run All Attacks at Once

```powershell
# Save this as attack-simulation.ps1 and run it

Write-Host @"
╔══════════════════════════════════════════════════════════╗
║     HONEYPOT ATTACK SIMULATION - RESEARCH MODE           ║
║  Testing security monitoring and event capture           ║
╚══════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

Start-Sleep -Seconds 2

# 1. Brute Force
Write-Host "`n[1/6] Running Brute Force Attack..." -ForegroundColor Yellow
@('admin/admin','admin/password','admin/123456','root/toor','test/test') | ForEach-Object {
    $parts = $_ -split '/'
    Invoke-WebRequest -Uri "http://localhost/fake-login" -Method POST -Body @{username=$parts[0];password=$parts[1]} -ErrorAction SilentlyContinue | Out-Null
    Start-Sleep -Milliseconds 300
}

# 2. SQL Injection
Write-Host "[2/6] Running SQL Injection Attack..." -ForegroundColor Yellow
@("admin' OR '1'='1","admin'--","' OR 1=1--") | ForEach-Object {
    Invoke-WebRequest -Uri "http://localhost/fake-login" -Method POST -Body @{username=$_;password='test'} -ErrorAction SilentlyContinue | Out-Null
    Start-Sleep -Milliseconds 300
}

# 3. Scanner Tools
Write-Host "[3/6] Running Scanner Tool Simulation..." -ForegroundColor Yellow
@('sqlmap/1.0','nikto/2.1.5','nmap') | ForEach-Object {
    Invoke-WebRequest -Uri "http://localhost/fake-login" -Method POST -Body @{username='admin';password='test'} -UserAgent $_ -ErrorAction SilentlyContinue | Out-Null
    Start-Sleep -Milliseconds 300
}

# 4. Credential Stuffing
Write-Host "[4/6] Running Credential Stuffing..." -ForegroundColor Yellow
@('john@example.com/Pass123','alice@test.com/Welcome1') | ForEach-Object {
    $parts = $_ -split '/'
    Invoke-WebRequest -Uri "http://localhost/fake-login" -Method POST -Body @{username=$parts[0];password=$parts[1]} -ErrorAction SilentlyContinue | Out-Null
    Start-Sleep -Milliseconds 300
}

# 5. No User Agent
Write-Host "[5/6] Running Anonymous Attack..." -ForegroundColor Yellow
Invoke-WebRequest -Uri "http://localhost/fake-login" -Method POST -Body @{username='admin';password='test'} -UserAgent '' -ErrorAction SilentlyContinue | Out-Null

# 6. Path Discovery
Write-Host "[6/6] Running Endpoint Discovery..." -ForegroundColor Yellow
@('/login','/admin','/wp-login.php') | ForEach-Object {
    try { Invoke-WebRequest -Uri "http://localhost$_" -Method POST -Body @{username='admin';password='admin'} -ErrorAction SilentlyContinue | Out-Null } catch {}
    Start-Sleep -Milliseconds 200
}

Write-Host "`n✓ Attack simulation complete!" -ForegroundColor Green
Write-Host "Check results with: Get-Content .\data\honeypot_events.jsonl" -ForegroundColor Cyan
```

---

## 📊 QUICK ANALYSIS COMMANDS

```powershell
# Quick analysis after attacks
cd "C:\Users\Alsakkal\Desktop\Fake login HONYPOT"

# Total attacks
(Get-Content .\data\honeypot_events.jsonl).Count

# Latest 5 attacks
Get-Content .\data\honeypot_events.jsonl -Tail 5 | ConvertFrom-Json | Format-List

# Top IPs
Get-Content .\data\honeypot_events.jsonl | ForEach-Object { ($_ | ConvertFrom-Json).src_ip } | Group-Object | Sort-Object Count -Descending

# Scanner detection
Get-Content .\data\honeypot_events.jsonl | ForEach-Object { ($_ | ConvertFrom-Json).tags } | Where-Object { $_ -contains 'scanner-ua' }
```
