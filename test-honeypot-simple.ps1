# 🎯 Simple Honeypot Testing Script
# Tests honeypot directly without full stack dependencies

param(
    [int]$AttackCount = 30,
    [string]$HoneypotHost = "localhost",
    [int]$HoneypotPort = 8080,
    [int]$DelayMs = 300
)

$HoneypotUrl = "http://${HoneypotHost}:${HoneypotPort}/fake-login"

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🎯 HONEYPOT DIRECT TEST (Standalone)               ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Check honeypot status
Write-Host "🔍 Checking honeypot..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $HoneypotUrl -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Honeypot is ONLINE at $HoneypotUrl" -ForegroundColor Green
    Write-Host "   Status: $($response.StatusCode)`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Cannot reach honeypot!" -ForegroundColor Red
    Write-Host "`nTrying to start honeypot container..." -ForegroundColor Yellow
    docker start fullcraft_honeypot
    Start-Sleep -Seconds 5
    
    try {
        $response = Invoke-WebRequest -Uri $HoneypotUrl -Method GET -TimeoutSec 5 -ErrorAction Stop
        Write-Host "✅ Honeypot started successfully!`n" -ForegroundColor Green
    } catch {
        Write-Host "❌ Still cannot reach honeypot. Check Docker:" -ForegroundColor Red
        Write-Host "   docker ps | Select-String honeypot`n" -ForegroundColor White
        exit 1
    }
}

# Realistic attack data
$attacks = @(
    # Brute force - admin account
    @{user="admin"; pass="admin"; desc="Common admin/admin"},
    @{user="admin"; pass="password"; desc="Common admin/password"},
    @{user="admin"; pass="123456"; desc="Weak admin/123456"},
    @{user="admin"; pass="admin123"; desc="Variant admin123"},
    @{user="admin"; pass="P@ssw0rd"; desc="Complex-looking"},
    @{user="admin"; pass="root"; desc="Cross-account"},
    
    # Brute force - root account
    @{user="root"; pass="root"; desc="Common root/root"},
    @{user="root"; pass="toor"; desc="Reversed toor"},
    @{user="root"; pass="password"; desc="Weak root/password"},
    @{user="root"; pass="12345"; desc="Weak root/12345"},
    
    # Credential stuffing
    @{user="john.doe"; pass="qwerty123"; desc="Leaked credentials 1"},
    @{user="jane.smith"; pass="welcome1"; desc="Leaked credentials 2"},
    @{user="user123"; pass="letmein"; desc="Common pattern"},
    @{user="test"; pass="test123"; desc="Test account"},
    @{user="demo"; pass="demo"; desc="Demo account"},
    
    # Username enumeration
    @{user="administrator"; pass="admin"; desc="Enum: administrator"},
    @{user="webmaster"; pass="admin"; desc="Enum: webmaster"},
    @{user="support"; pass="admin"; desc="Enum: support"},
    @{user="manager"; pass="admin"; desc="Enum: manager"},
    @{user="info"; pass="admin"; desc="Enum: info"},
    
    # SQL injection attempts
    @{user="admin"; pass="' OR '1'='1"; desc="SQLi: OR 1=1"},
    @{user="admin"; pass="admin'--"; desc="SQLi: Comment"},
    @{user="' OR 1=1--"; pass="anything"; desc="SQLi: Username field"},
    
    # XSS attempts
    @{user="<script>alert(1)</script>"; pass="test"; desc="XSS: Script tag"},
    @{user="admin"; pass="<img src=x>"; desc="XSS: Image tag"},
    
    # Path traversal
    @{user="../admin"; pass="admin"; desc="Path: Parent dir"},
    @{user="....//....//admin"; pass="admin"; desc="Path: Deep traversal"},
    
    # Command injection
    @{user="admin; ls -la"; pass="admin"; desc="CmdInj: Semicolon"},
    @{user="admin``whoami``"; pass="admin"; desc="CmdInj: Backticks"},
    
    # High-frequency burst (same IP, rapid)
    @{user="admin"; pass="burst1"; desc="Burst attack 1"},
    @{user="admin"; pass="burst2"; desc="Burst attack 2"},
    @{user="admin"; pass="burst3"; desc="Burst attack 3"},
    @{user="admin"; pass="burst4"; desc="Burst attack 4"},
    @{user="admin"; pass="burst5"; desc="Burst attack 5"}
)

# User agents
$userAgents = @(
    "Mozilla/5.0 (Windows; Win64; x64) Chrome/120.0.0.0",
    "Mozilla/5.0 (X11; Linux) Chrome/119.0.0.0",
    "python-requests/2.31.0",
    "curl/7.88.1",
    "Scrapy/2.11.0"
)

Write-Host "🚀 Launching $($attacks.Count) attack simulations...`n" -ForegroundColor Yellow

$successCount = 0
$startTime = Get-Date

for ($i = 0; $i -lt $attacks.Count; $i++) {
    $attack = $attacks[$i]
    $userAgent = $userAgents | Get-Random
    
    $body = @{
        username = $attack.user
        password = $attack.pass
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri $HoneypotUrl `
                                      -Method POST `
                                      -Body $body `
                                      -ContentType "application/json" `
                                      -Headers @{"User-Agent" = $userAgent} `
                                      -TimeoutSec 10
        
        $successCount++
        Write-Host "[$($i+1)/$($attacks.Count)] ✅ " -NoNewline -ForegroundColor Green
        Write-Host "$($attack.user) / " -NoNewline -ForegroundColor White
        Write-Host "****** " -NoNewline -ForegroundColor DarkGray
        Write-Host "→ $($attack.desc)" -ForegroundColor Gray
        
    } catch {
        Write-Host "[$($i+1)/$($attacks.Count)] ❌ Failed: $($attack.desc)" -ForegroundColor Red
    }
    
    Start-Sleep -Milliseconds $DelayMs
}

$endTime = Get-Date
$duration = ($endTime - $startTime).TotalSeconds

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ✅ ATTACK TEST COMPLETE                            ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "📊 RESULTS:" -ForegroundColor Cyan
Write-Host "  Attacks Sent: $($attacks.Count)" -ForegroundColor White
Write-Host "  Successful: $successCount" -ForegroundColor Green
Write-Host "  Failed: $($attacks.Count - $successCount)" -ForegroundColor Red
Write-Host "  Duration: $([math]::Round($duration, 2)) seconds" -ForegroundColor White
Write-Host "  Rate: $([math]::Round($attacks.Count / $duration, 2)) attacks/sec`n" -ForegroundColor White

Write-Host "📂 CHECK LOGS:`n" -ForegroundColor Yellow

Write-Host "1. Raw logs (immediate):" -ForegroundColor Cyan
Write-Host "   Get-Content data\honeypot_raw.log | Select-Object -Last 10`n" -ForegroundColor White

Write-Host "2. Enriched logs (wait 30 sec for enrichment):" -ForegroundColor Cyan
Write-Host "   Get-Content data\honeypot_enriched.jsonl | Select-Object -Last 5 | ConvertFrom-Json | Format-List`n" -ForegroundColor White

Write-Host "3. Run analytics:" -ForegroundColor Cyan
Write-Host "   .\run-analysis.ps1" -ForegroundColor White
Write-Host "   py analysis\export_to_db.py`n" -ForegroundColor White

Write-Host "4. View in dashboards:" -ForegroundColor Cyan
Write-Host "   Flask: cd dashboard; py app.py -> http://localhost:5000" -ForegroundColor White
Write-Host "   Jupyter: -> http://localhost:8889 (already running)" -ForegroundColor White
Write-Host ""

Write-Host "🎉 Test complete! Now check logs and dashboards!" -ForegroundColor Green
Write-Host ""
