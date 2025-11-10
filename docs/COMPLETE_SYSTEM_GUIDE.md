# Complete System Guide - Main Project + Honeypot

**Date**: November 9, 2025  
**Status**: ✅ All Services Running

---

## 🚀 Services Currently Running

### 1. **Backend API (NestJS)** - Port 3000
- **URL**: http://localhost:3000
- **API Docs**: http://localhost:3000/api (Swagger)
- **Status**: ✅ Running
- **Purpose**: Main application API for Craft Mosul marketplace

### 2. **Frontend (React + Vite)** - Port 3001
- **URL**: http://localhost:3001
- **Status**: ✅ Running
- **Purpose**: User interface for marketplace

### 3. **Honeypot Service** - Port 80 (via Nginx)
- **URL**: http://localhost
- **Direct**: http://localhost:8080 (internal)
- **Status**: ✅ Running & Healthy
- **Purpose**: Fake admin login to capture attacker information

---

## 📍 How to Access the Fake Admin Login

### Option 1: Through the Main Application

1. **Visit**: http://localhost:3001
2. **Navigate to**: `/admin-login` route
3. **Full URL**: http://localhost:3001/admin-login

This will show a professional-looking fake admin portal integrated into your main application.

### Option 2: Direct Honeypot Access

1. **Visit**: http://localhost/
2. This shows the standalone honeypot page
3. Same functionality, different styling

---

## 🎯 Testing the Honeypot - Step by Step

### Step 1: Access the Fake Login Page

```
Open Browser → http://localhost:3001/admin-login
```

You should see:
- **Title**: "Admin Portal"
- **Professional design**: Dark theme, modern UI
- **Form fields**: Username and Password
- **Button**: "Sign in"

### Step 2: Try a Fake Login

Enter any credentials, for example:
- **Username**: `admin`
- **Password**: `password123`

Click **"Sign in"**

### Step 3: Observe the Response

You'll see:
- **Message**: "Invalid username or password."
- This is intentional - the honeypot NEVER authenticates anyone
- The page looks real to trick attackers

### Step 4: Check the Captured Data

**Open PowerShell** in the project root:

```powershell
# View all captured events
Get-Content .\data\honeypot_events.jsonl

# View in pretty format
Get-Content .\data\honeypot_events.jsonl | ForEach-Object { $_ | ConvertFrom-Json | ConvertTo-Json -Depth 5 }

# View just the latest event
Get-Content .\data\honeypot_events.jsonl -Tail 1 | ConvertFrom-Json | ConvertTo-Json -Depth 5
```

---

## 📊 Understanding Captured Attacker Information

### Example Event Log:

```json
{
  "id": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
  "received_at": "2025-11-09T22:15:30.123Z",
  "src_ip": "192.168.1.100",
  "path": "/fake-login",
  "method": "POST",
  "username_hash": "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918",
  "username_len": 5,
  "password_hash": "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92",
  "password_len": 11,
  "ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
  "referer": "http://localhost:3001/admin-login",
  "x_forwarded_for": "",
  "body_fingerprint": "a3f5b2c8...",
  "headers_sample": {
    "accept": "text/html,application/xhtml+xml...",
    "content_type": "application/x-www-form-urlencoded"
  },
  "tags": []
}
```

### Field Breakdown:

| Field | Description | Example Use |
|-------|-------------|-------------|
| **id** | Unique event identifier | Track individual attempts |
| **received_at** | Timestamp of attempt | Analyze attack timing patterns |
| **src_ip** | Attacker's IP address | Geographic analysis, blocking |
| **path** | Which endpoint was targeted | Common attack paths |
| **method** | HTTP method used | POST for logins, GET for scanning |
| **username_hash** | SHA-256 hash of username | See common usernames without storing plaintext |
| **username_len** | Length of username | Detect automated attacks (very long inputs) |
| **password_hash** | SHA-256 hash of password | Analyze password patterns |
| **password_len** | Length of password | Detect brute force vs targeted attacks |
| **ua** | User Agent string | Identify bots, scanners, real browsers |
| **referer** | Where request came from | Direct link or from your site |
| **x_forwarded_for** | Real IP if behind proxy | Bypass proxy IPs |
| **body_fingerprint** | Hash of request body | Deduplicate identical attempts |
| **headers_sample** | Selected HTTP headers | Browser capabilities, languages |
| **tags** | Automatic classifications | `scanner-ua`, `missing-ua`, etc. |

---

## 🔍 Analyzing Attack Patterns

### 1. Count Total Attacks

```powershell
(Get-Content .\data\honeypot_events.jsonl).Count
```

### 2. Find Most Common IP Addresses

```powershell
Get-Content .\data\honeypot_events.jsonl | 
  ForEach-Object { ($_ | ConvertFrom-Json).src_ip } | 
  Group-Object | 
  Sort-Object Count -Descending | 
  Select-Object Count, Name
```

### 3. Check for Scanner Activity

```powershell
Get-Content .\data\honeypot_events.jsonl | 
  ForEach-Object { $_ | ConvertFrom-Json } | 
  Where-Object { $_.tags -contains "scanner-ua" }
```

### 4. Analyze Attack Times

```powershell
Get-Content .\data\honeypot_events.jsonl | 
  ForEach-Object { ($_ | ConvertFrom-Json).received_at }
```

### 5. Check Common Username Lengths (to identify patterns)

```powershell
Get-Content .\data\honeypot_events.jsonl | 
  ForEach-Object { ($_ | ConvertFrom-Json).username_len } | 
  Group-Object | 
  Sort-Object Count -Descending
```

---

## 🎭 Simulating Different Attack Scenarios

### Scenario 1: Normal Login Attempt

```powershell
Invoke-WebRequest -Uri http://localhost/fake-login `
  -Method POST `
  -Body @{username='admin'; password='password123'}
```

**Expected Tags**: None (looks like normal user)

### Scenario 2: SQL Injection Attempt

```powershell
Invoke-WebRequest -Uri http://localhost/fake-login `
  -Method POST `
  -Body @{username="admin' OR '1'='1"; password='anything'}
```

**Expected Tags**: None, but large username_len recorded

### Scenario 3: Scanner Tool (Simulated)

```powershell
Invoke-WebRequest -Uri http://localhost/fake-login `
  -Method POST `
  -Body @{username='test'; password='test'} `
  -UserAgent 'sqlmap/1.0'
```

**Expected Tags**: `scanner-ua`

### Scenario 4: Missing User Agent

```powershell
Invoke-WebRequest -Uri http://localhost/fake-login `
  -Method POST `
  -Body @{username='admin'; password='pass'} `
  -UserAgent ''
```

**Expected Tags**: `missing-ua`

---

## 📈 Real-Time Monitoring

### Watch for New Attacks (Live Tail)

**PowerShell** (manual refresh):
```powershell
while ($true) { 
  Clear-Host
  Write-Host "=== Latest Honeypot Events ===" -ForegroundColor Cyan
  Get-Content .\data\honeypot_events.jsonl -Tail 5 | 
    ForEach-Object { $_ | ConvertFrom-Json | ConvertTo-Json -Compress }
  Start-Sleep -Seconds 5
}
```

### Check Honeypot Service Health

```powershell
Invoke-WebRequest -Uri http://localhost:8080/healthz
```

**Expected Response**:
```json
{"status":"ok"}
```

---

## 🔐 Privacy & Security Notes

### What is Stored:
- ✅ **Hashed** credentials (SHA-256)
- ✅ IP addresses
- ✅ User agents
- ✅ Timestamps
- ✅ Sample headers

### What is NOT Stored:
- ❌ **Plaintext** passwords
- ❌ **Plaintext** usernames
- ❌ Full request bodies
- ❌ Cookies or session data
- ❌ Personal identifying information (beyond IP)

### Hash Verification:

To verify a hash (if you know the original):
```powershell
$plaintext = "admin"
$hash = [System.Security.Cryptography.SHA256]::Create()
$bytes = [System.Text.Encoding]::UTF8.GetBytes($plaintext)
$hashBytes = $hash.ComputeHash($bytes)
$hashString = [System.BitConverter]::ToString($hashBytes).Replace("-","").ToLower()
Write-Host "SHA-256 of '$plaintext': $hashString"
```

---

## 🌐 Complete URL Map

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend Home** | http://localhost:3001 | Main marketplace UI |
| **Fake Admin Login** | http://localhost:3001/admin-login | Honeypot (integrated) |
| **Backend API** | http://localhost:3000 | REST API |
| **Swagger Docs** | http://localhost:3000/api | API documentation |
| **Honeypot (Direct)** | http://localhost | Standalone honeypot |
| **Honeypot Health** | http://localhost:8080/healthz | Service health check |

---

## 📸 What You Should See

### 1. Main Application (http://localhost:3001)
- Craft Mosul marketplace homepage
- Worker listings
- Arabic language support (RTL)
- Login/Register options

### 2. Fake Admin Login (http://localhost:3001/admin-login)
- **Dark professional theme**
- "Admin Portal" title
- Username/Password fields
- "Please sign in to continue" subtitle
- Looks completely legitimate

### 3. After Fake Login Attempt
- "Invalid username or password." message
- No authentication happens
- Event silently logged to JSONL file

---

## 🎓 Graduate Project Data Collection

### Research Questions You Can Answer:

1. **How many attacks occur per day/hour?**
2. **What are the most common usernames tried?** (via hash frequency)
3. **What's the average password length?**
4. **Which IP addresses are most aggressive?**
5. **Are attacks automated (scanners) or manual?**
6. **What time of day are attacks most common?**
7. **Do attackers try multiple usernames sequentially?**
8. **What user agents do attackers use?**

### Data Analysis Tools:

- **Excel/CSV**: Export JSONL to CSV for analysis
- **Python/Pandas**: Statistical analysis
- **PowerShell**: Quick queries and filtering
- **Visualization**: Charts showing attack patterns over time

---

## 🚨 Troubleshooting

### Frontend Not Loading?
```powershell
# Check if running
Get-Process -Name node | Where-Object { $_.MainWindowTitle -like "*vite*" }

# Restart
cd fronted
npm run dev
```

### Backend Not Responding?
```powershell
# Check logs
cd backend
npm run start:dev
```

### Honeypot Not Capturing?
```powershell
# Check container status
docker compose -f docker-compose.honeypot.yml ps

# Check logs
docker logs fullcraft_honeypot

# Restart
docker compose -f docker-compose.honeypot.yml restart
```

### No Events in Log File?
```powershell
# Check if file exists
Test-Path .\data\honeypot_events.jsonl

# Check permissions
Get-Acl .\data\honeypot_events.jsonl

# Try a test login
Invoke-WebRequest -Uri http://localhost/fake-login -Method POST -Body @{username='test';password='test'}
```

---

## ✅ Verification Checklist

- [ ] Backend running on port 3000
- [ ] Frontend running on port 3001
- [ ] Honeypot accessible at http://localhost
- [ ] Can access fake admin at http://localhost:3001/admin-login
- [ ] Fake login shows professional UI
- [ ] Login attempts return "Invalid" message
- [ ] Events appear in `data/honeypot_events.jsonl`
- [ ] Events contain hashed credentials
- [ ] IP addresses are captured correctly
- [ ] User agents are logged
- [ ] Tags are applied for scanners

---

## 🎯 Next Steps

1. **Test the complete flow**:
   - Visit http://localhost:3001/admin-login
   - Try logging in with fake credentials
   - Check the honeypot_events.jsonl file

2. **Monitor for patterns**:
   - Leave it running
   - Check periodically for new events
   - Analyze common attack patterns

3. **Document for your project**:
   - Screenshot the fake login page
   - Export sample event logs
   - Create charts/graphs of attack patterns
   - Write analysis of findings

4. **Production deployment** (when ready):
   - Set up domain name
   - Configure SSL certificates
   - Deploy to cloud server
   - Set up monitoring/alerts

---

**All systems operational!** 🎓🔒  
**Ready for graduate project demonstration and data collection!**
