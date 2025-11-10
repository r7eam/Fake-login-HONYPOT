# Complete End-to-End Test with Sample Data
# This creates realistic attack data and tests the complete pipeline

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  HONEYPOT PIPELINE E2E TEST" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$baseDir = "C:\Users\Alsakkal\Desktop\Fake login HONYPOT"
cd $baseDir

# Step 1: Create sample attack data
Write-Host "[STEP 1] Creating realistic attack data..." -ForegroundColor Yellow

$attacks = @(
    # Brute force attacks from China
    @{timestamp="2025-01-15T10:23:45Z"; ip="103.41.184.17"; user="admin"; pass="admin123"; ua="python-requests/2.31.0"},
    @{timestamp="2025-01-15T10:23:47Z"; ip="103.41.184.17"; user="admin"; pass="password"; ua="python-requests/2.31.0"},
    @{timestamp="2025-01-15T10:23:49Z"; ip="103.41.184.17"; user="admin"; pass="123456"; ua="python-requests/2.31.0"},
    @{timestamp="2025-01-15T10:23:51Z"; ip="103.41.184.17"; user="root"; pass="root"; ua="python-requests/2.31.0"},
    @{timestamp="2025-01-15T10:23:53Z"; ip="103.41.184.17"; user="admin"; pass="admin"; ua="python-requests/2.31.0"},
    
    # Scanner from Russia
    @{timestamp="2025-01-15T11:15:22Z"; ip="185.156.73.54"; user="admin"; pass="' OR '1'='1"; ua="curl/7.88.1"},
    @{timestamp="2025-01-15T11:15:24Z"; ip="185.156.73.54"; user="admin'--"; pass="anything"; ua="curl/7.88.1"},
    @{timestamp="2025-01-15T11:15:26Z"; ip="185.156.73.54"; user="administrator"; pass="admin"; ua="curl/7.88.1"},
    
    # Credential stuffing from USA
    @{timestamp="2025-01-15T14:32:11Z"; ip="45.79.203.142"; user="john.doe@company.com"; pass="Summer2023!"; ua="Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0"},
    @{timestamp="2025-01-15T14:32:14Z"; ip="45.79.203.142"; user="jane.smith@company.com"; pass="Winter2023!"; ua="Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0"},
    @{timestamp="2025-01-15T14:32:17Z"; ip="45.79.203.142"; user="bob.jones@company.com"; pass="Spring2023!"; ua="Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0"},
    
    # Automated bot from Germany
    @{timestamp="2025-01-15T16:45:33Z"; ip="194.36.191.88"; user="webmaster"; pass="webmaster"; ua="Scrapy/2.11.0"},
    @{timestamp="2025-01-15T16:45:35Z"; ip="194.36.191.88"; user="support"; pass="support123"; ua="Scrapy/2.11.0"},
    @{timestamp="2025-01-15T16:45:37Z"; ip="194.36.191.88"; user="info"; pass="info"; ua="Scrapy/2.11.0"},
    
    # High-frequency burst from Brazil
    @{timestamp="2025-01-15T18:12:05Z"; ip="177.54.144.195"; user="admin"; pass="password1"; ua="Go-http-client/1.1"},
    @{timestamp="2025-01-15T18:12:07Z"; ip="177.54.144.195"; user="admin"; pass="password2"; ua="Go-http-client/1.1"},
    @{timestamp="2025-01-15T18:12:09Z"; ip="177.54.144.195"; user="admin"; pass="password3"; ua="Go-http-client/1.1"},
    @{timestamp="2025-01-15T18:12:11Z"; ip="177.54.144.195"; user="admin"; pass="password4"; ua="Go-http-client/1.1"},
    @{timestamp="2025-01-15T18:12:13Z"; ip="177.54.144.195"; user="admin"; pass="password5"; ua="Go-http-client/1.1"},
    @{timestamp="2025-01-15T18:12:15Z"; ip="177.54.144.195"; user="admin"; pass="password6"; ua="Go-http-client/1.1"},
    @{timestamp="2025-01-15T18:12:17Z"; ip="177.54.144.195"; user="admin"; pass="password7"; ua="Go-http-client/1.1"},
    
    # XSS attempts from India
    @{timestamp="2025-01-15T20:33:42Z"; ip="103.253.145.29"; user="<script>alert(1)</script>"; pass="test"; ua="axios/1.6.2"},
    @{timestamp="2025-01-15T20:33:44Z"; ip="103.253.145.29"; user="admin"; pass="<img src=x onerror=alert(1)>"; ua="axios/1.6.2"},
    
    # Path traversal from Ukraine
    @{timestamp="2025-01-15T22:11:28Z"; ip="46.151.52.193"; user="../../../etc/passwd"; pass="admin"; ua="curl/8.0.1"},
    @{timestamp="2025-01-15T22:11:30Z"; ip="46.151.52.193"; user="....//....//admin"; pass="admin"; ua="curl/8.0.1"},
    
    # Recent attacks (last hour) for real-time testing
    @{timestamp="2025-01-15T23:45:12Z"; ip="103.41.184.17"; user="admin"; pass="test1"; ua="python-requests/2.31.0"},
    @{timestamp="2025-01-15T23:45:14Z"; ip="103.41.184.17"; user="admin"; pass="test2"; ua="python-requests/2.31.0"},
    @{timestamp="2025-01-15T23:45:16Z"; ip="103.41.184.17"; user="admin"; pass="test3"; ua="python-requests/2.31.0"}
)

# Create data directory
if (!(Test-Path "data")) {
    New-Item -ItemType Directory -Path "data" | Out-Null
}

# Write raw logs
$rawLogFile = "data\honeypot_raw.log"
$attacks | ForEach-Object {
    $event = @{
        timestamp = $_.timestamp
        src_ip = $_.ip
        username = $_.user
        password = $_.pass
        path = "/fake-login"
        method = "POST"
        user_agent = $_.ua
        headers = @{"Content-Type"="application/json"}
        body = @{username=$_.user; password=$_.pass}
        id = [System.Guid]::NewGuid().ToString()
    }
    ($event | ConvertTo-Json -Compress) | Add-Content -Path $rawLogFile -Encoding UTF8
}

Write-Host "[+] Created $($attacks.Count) raw attack events" -ForegroundColor Green
Write-Host "    File: $rawLogFile`n" -ForegroundColor Gray

# Step 2: Run enrichment
Write-Host "[STEP 2] Running enrichment..." -ForegroundColor Yellow
Write-Host "[*] Starting enrichment worker..." -ForegroundColor Gray

$enrichCmd = "py enrichment\enrich_worker.py"
$enrichJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$baseDir'; $enrichCmd" -PassThru -WindowStyle Minimized

Write-Host "[*] Waiting 30 seconds for enrichment to process..." -ForegroundColor Gray
Start-Sleep -Seconds 30

Write-Host "[*] Stopping enrichment worker..." -ForegroundColor Gray
Stop-Process -Id $enrichJob.Id -Force -ErrorAction SilentlyContinue

# Check enriched data
if (Test-Path "data\honeypot_enriched.jsonl") {
    $enrichedCount = (Get-Content "data\honeypot_enriched.jsonl" | Measure-Object -Line).Lines
    Write-Host "[+] Enriched $enrichedCount events" -ForegroundColor Green
    
    if ($enrichedCount -gt 0) {
        Write-Host "`nSample enriched event:" -ForegroundColor Cyan
        Get-Content "data\honeypot_enriched.jsonl" | Select-Object -First 1 | ConvertFrom-Json | Format-List timestamp, ip, geo_country, asn_org, tags
    }
} else {
    Write-Host "[-] No enriched data found" -ForegroundColor Red
}
Write-Host ""

# Step 3: Run analytics
Write-Host "[STEP 3] Running analytics pipeline..." -ForegroundColor Yellow

Write-Host "[*] Preparing dataset..." -ForegroundColor Gray
& py analysis\prepare_dataset.py

Write-Host "[*] Calculating metrics..." -ForegroundColor Gray
& py analysis\metrics.py

Write-Host "[*] Generating plots..." -ForegroundColor Gray
& py analysis\plots.py

Write-Host "[*] Exporting to database..." -ForegroundColor Gray
& py analysis\export_to_db.py

Write-Host "[+] Analytics complete`n" -ForegroundColor Green

# Step 4: Check outputs
Write-Host "[STEP 4] Checking outputs..." -ForegroundColor Yellow

if (Test-Path "out\results.db") {
    $dbSize = (Get-Item "out\results.db").Length
    Write-Host "[+] SQLite database created ($([math]::Round($dbSize/1024, 2)) KB)" -ForegroundColor Green
}

if (Test-Path "out\charts") {
    $chartCount = (Get-ChildItem "out\charts" -Filter "*.png").Count
    Write-Host "[+] Generated $chartCount PNG charts" -ForegroundColor Green
}

if (Test-Path "out\summary_metrics.json") {
    Write-Host "[+] Summary metrics generated" -ForegroundColor Green
    Write-Host "`nKey metrics:" -ForegroundColor Cyan
    $metrics = Get-Content "out\summary_metrics.json" | ConvertFrom-Json
    Write-Host "  Total events: $($metrics.total_events)" -ForegroundColor White
    Write-Host "  Unique IPs: $($metrics.unique_ips)" -ForegroundColor White
    Write-Host "  Countries: $($metrics.unique_countries)" -ForegroundColor White
}
Write-Host ""

# Step 5: Start dashboards
Write-Host "[STEP 5] Starting dashboards..." -ForegroundColor Yellow

Write-Host "[*] Starting Flask dashboard..." -ForegroundColor Gray
$flaskJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$baseDir\dashboard'; py app.py" -PassThru -WindowStyle Normal

Start-Sleep -Seconds 5

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  E2E TEST COMPLETE" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "RESULTS SUMMARY:" -ForegroundColor Cyan
Write-Host "  Attack events: $($attacks.Count)" -ForegroundColor White
Write-Host "  Countries: China, Russia, USA, Germany, Brazil, India, Ukraine" -ForegroundColor White
Write-Host "  Attack types: Brute-force, SQLi, XSS, Path-traversal, Enumeration`n" -ForegroundColor White

Write-Host "VIEW DASHBOARDS:" -ForegroundColor Yellow
Write-Host "  Flask (Real-time): http://localhost:5000" -ForegroundColor Green
Write-Host "  Jupyter (Analysis): http://localhost:8889" -ForegroundColor Green
Write-Host "`n  The Flask dashboard should now show:" -ForegroundColor Cyan
Write-Host "    - Total attacks: ~28" -ForegroundColor White
Write-Host "    - Interactive charts with country distribution" -ForegroundColor White
Write-Host "    - Top attacking IPs with flags" -ForegroundColor White
Write-Host "    - Timeline of attacks" -ForegroundColor White
Write-Host "    - Credential analysis`n" -ForegroundColor White

Write-Host "NEXT: Open your browser and check the dashboards!" -ForegroundColor Yellow
Write-Host ""
