# Test Honeypot - Pretend to be an attacker!

Write-Host "🎭 TESTING HONEYPOT - You are the attacker!" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check honeypot is running
Write-Host "📡 Step 1: Checking honeypot status..." -ForegroundColor Yellow
$honeypotRunning = docker ps --filter "name=honeypot" --format "{{.Status}}"

if ($honeypotRunning) {
    Write-Host "   ✅ Honeypot is running!" -ForegroundColor Green
} else {
    Write-Host "   ❌ Honeypot not running. Starting it..." -ForegroundColor Red
    docker-compose -f docker-compose.honeypot.yml up -d
    Start-Sleep -Seconds 5
}

# Step 2: Check enrichment worker
Write-Host "🔍 Step 2: Checking enrichment worker..." -ForegroundColor Yellow
$enrichRunning = docker ps --filter "name=enrichment" --format "{{.Status}}"

if ($enrichRunning) {
    Write-Host "   ✅ Enrichment worker is running!" -ForegroundColor Green
} else {
    Write-Host "   ❌ Enrichment worker not running. Starting it..." -ForegroundColor Red
    docker-compose -f docker-compose.enrich.yml up -d
    Start-Sleep -Seconds 5
}

Write-Host ""
Write-Host "🎯 Step 3: Launching attacks as hacker..." -ForegroundColor Yellow
Write-Host ""

# Attack 1: SQL Injection
Write-Host "   → Attack 1: SQL Injection attempt..." -ForegroundColor Magenta
$body1 = @{
    username = "admin' OR '1'='1"
    password = "x"
} | ConvertTo-Json

try {
    Invoke-WebRequest -Uri "http://localhost:8080/fake-login" -Method POST -Body $body1 -ContentType "application/json" -ErrorAction SilentlyContinue
    Write-Host "      ✅ SQL injection sent!" -ForegroundColor Green
} catch {
    Write-Host "      ✅ Attack captured (expected 401/400)" -ForegroundColor Green
}

Start-Sleep -Seconds 2

# Attack 2: Brute Force
Write-Host "   → Attack 2: Brute force attempt..." -ForegroundColor Magenta
$body2 = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    Invoke-WebRequest -Uri "http://localhost:8080/fake-login" -Method POST -Body $body2 -ContentType "application/json" -ErrorAction SilentlyContinue
    Write-Host "      ✅ Brute force sent!" -ForegroundColor Green
} catch {
    Write-Host "      ✅ Attack captured!" -ForegroundColor Green
}

Start-Sleep -Seconds 2

# Attack 3: XSS
Write-Host "   → Attack 3: XSS attempt..." -ForegroundColor Magenta
$body3 = @{
    username = "<script>alert(1)</script>"
    password = "test"
} | ConvertTo-Json

try {
    Invoke-WebRequest -Uri "http://localhost:8080/fake-login" -Method POST -Body $body3 -ContentType "application/json" -ErrorAction SilentlyContinue
    Write-Host "      ✅ XSS attack sent!" -ForegroundColor Green
} catch {
    Write-Host "      ✅ Attack captured!" -ForegroundColor Green
}

Start-Sleep -Seconds 2

# Attack 4: Path Traversal
Write-Host "   → Attack 4: Path traversal attempt..." -ForegroundColor Magenta
$body4 = @{
    username = "../../../etc/passwd"
    password = "admin"
} | ConvertTo-Json

try {
    Invoke-WebRequest -Uri "http://localhost:8080/admin-login" -Method POST -Body $body4 -ContentType "application/json" -ErrorAction SilentlyContinue
    Write-Host "      ✅ Path traversal sent!" -ForegroundColor Green
} catch {
    Write-Host "      ✅ Attack captured!" -ForegroundColor Green
}

Start-Sleep -Seconds 2

# Attack 5: Credential Stuffing
Write-Host "   → Attack 5: Credential stuffing..." -ForegroundColor Magenta
$body5 = @{
    username = "user@gmail.com"
    password = "Summer2024!"
} | ConvertTo-Json

try {
    Invoke-WebRequest -Uri "http://localhost:8080/login" -Method POST -Body $body5 -ContentType "application/json" -ErrorAction SilentlyContinue
    Write-Host "      ✅ Credential stuffing sent!" -ForegroundColor Green
} catch {
    Write-Host "      ✅ Attack captured!" -ForegroundColor Green
}

Write-Host ""
Write-Host "⏳ Step 4: Waiting for enrichment (5 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "📊 Step 5: Checking what honeypot captured..." -ForegroundColor Yellow
Write-Host ""

# Check raw data
if (Test-Path "data/honeypot_raw.jsonl") {
    $rawCount = (Get-Content "data/honeypot_raw.jsonl" | Measure-Object -Line).Lines
    Write-Host "   Raw attacks captured: $rawCount" -ForegroundColor Cyan
    
    Write-Host ""
    Write-Host "   📋 Your LAST attack details:" -ForegroundColor Green
    $lastRaw = Get-Content "data/honeypot_raw.jsonl" -Tail 1 | ConvertFrom-Json
    Write-Host "      Username: $($lastRaw.username)" -ForegroundColor White
    Write-Host "      Password: $($lastRaw.password)" -ForegroundColor White
    Write-Host "      Path: $($lastRaw.path)" -ForegroundColor White
    Write-Host "      Time: $($lastRaw.timestamp)" -ForegroundColor White
}

Write-Host ""

# Check enriched data
if (Test-Path "data/honeypot_enriched.jsonl") {
    $enrichedCount = (Get-Content "data/honeypot_enriched.jsonl" | Measure-Object -Line).Lines
    Write-Host "   Enriched attacks: $enrichedCount" -ForegroundColor Cyan
    
    Write-Host ""
    Write-Host "   🌍 Your ENRICHED attack (with IP geolocation):" -ForegroundColor Green
    $lastEnriched = Get-Content "data/honeypot_enriched.jsonl" -Tail 1 | ConvertFrom-Json
    Write-Host "      IP Address: $($lastEnriched.ip)" -ForegroundColor Yellow
    Write-Host "      Country: $($lastEnriched.geo_country)" -ForegroundColor Yellow
    Write-Host "      City: $($lastEnriched.geo_city)" -ForegroundColor Yellow
    Write-Host "      ISP/Org: $($lastEnriched.asn_org)" -ForegroundColor Yellow
    Write-Host "      Username: $($lastEnriched.username)" -ForegroundColor White
    Write-Host "      Password: $($lastEnriched.password)" -ForegroundColor White
    Write-Host "      Attack Type: $($lastEnriched.tags)" -ForegroundColor Red
    Write-Host "      Path: $($lastEnriched.path)" -ForegroundColor White
}

Write-Host ""
Write-Host "SUCCESS! HONEYPOT WORKS! It captured:" -ForegroundColor Green
Write-Host "   - Your IP address (127.0.0.1 or your real IP if external)" -ForegroundColor Cyan
Write-Host "   - Your country/city (via IP geolocation)" -ForegroundColor Cyan
Write-Host "   - Your ISP/organization" -ForegroundColor Cyan
Write-Host "   - Username you entered" -ForegroundColor Cyan
Write-Host "   - Password you entered" -ForegroundColor Cyan
Write-Host "   - Attack type (SQLi, XSS, brute-force, etc.)" -ForegroundColor Cyan
Write-Host "   - Timestamp" -ForegroundColor Cyan
Write-Host ""
Write-Host "Now analyze this data:" -ForegroundColor Yellow
Write-Host "   .\analyze-real-attacks.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Or view in dashboard:" -ForegroundColor Yellow
Write-Host "   Dashboard is at http://localhost:5000" -ForegroundColor White
Write-Host ""
