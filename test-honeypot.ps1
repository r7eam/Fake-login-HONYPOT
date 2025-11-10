# 🎯 Honeypot Testing Script - Realistic Attack Simulation

# This script simulates various attack patterns to test the complete honeypot pipeline:
# Raw logging → Enrichment → Analytics → Dashboard

param(
    [int]$AttackCount = 50,
    [string]$HoneypotUrl = "http://localhost/fake-login",
    [int]$DelayMs = 500
)

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🎯 HONEYPOT ATTACK SIMULATION                       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Check if honeypot is running
Write-Host "Checking honeypot availability..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $HoneypotUrl -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Honeypot is reachable at $HoneypotUrl`n" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Cannot reach honeypot at $HoneypotUrl" -ForegroundColor Red
    Write-Host "   Make sure Docker services are running:" -ForegroundColor Yellow
    Write-Host "   docker-compose -f docker-compose.fullstack.yml up -d`n" -ForegroundColor White
    exit 1
}

# Attack patterns
$attackPatterns = @(
    @{
        name = "Brute Force - Common Passwords"
        usernames = @("admin", "root", "administrator")
        passwords = @("admin", "password", "123456", "root", "admin123", "P@ssw0rd")
        count = 15
    },
    @{
        name = "Credential Stuffing - Leaked Credentials"
        usernames = @("john.doe", "jane.smith", "user123", "test", "demo")
        passwords = @("qwerty123", "welcome1", "letmein", "password123", "abc123")
        count = 12
    },
    @{
        name = "Enumeration - Username Guessing"
        usernames = @("admin", "webmaster", "support", "info", "sales", "contact", "manager", "user")
        passwords = @("test")
        count = 10
    },
    @{
        name = "Scanning - Automated Tool"
        usernames = @("admin")
        passwords = @("' OR '1'='1", "admin'--", "<script>alert(1)</script>")
        count = 8
    },
    @{
        name = "Persistent Attacker - Same IP"
        usernames = @("admin", "root")
        passwords = @("admin", "toor", "password", "12345", "admin123", "root123")
        count = 20
    }
)

# User agents (realistic browser/bot signatures)
$userAgents = @(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "python-requests/2.31.0",
    "curl/7.88.1",
    "Go-http-client/1.1",
    "Scrapy/2.11.0",
    "axios/1.6.2"
)

$totalAttacks = 0
$successCount = 0
$failureCount = 0

Write-Host "🚀 Starting attack simulation..`n" -ForegroundColor Yellow
Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "  Target: $HoneypotUrl" -ForegroundColor White
Write-Host "  Total Patterns: $($attackPatterns.Count)" -ForegroundColor White
Write-Host "  Delay: $DelayMs ms between attacks`n" -ForegroundColor White

# Progress tracking
$startTime = Get-Date

foreach ($pattern in $attackPatterns) {
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor DarkGray
    Write-Host "🎯 Pattern: $($pattern.name)" -ForegroundColor Yellow
    Write-Host "   Attacks: $($pattern.count)" -ForegroundColor Gray
    
    $patternSuccess = 0
    
    for ($i = 1; $i -le $pattern.count; $i++) {
        # Random username and password from pattern
        $username = $pattern.usernames | Get-Random
        $password = $pattern.passwords | Get-Random
        $userAgent = $userAgents | Get-Random
        
        # Build attack payload
        $body = @{
            username = $username
            password = $password
        } | ConvertTo-Json
        
        try {
            # Send attack
            $response = Invoke-RestMethod -Uri $HoneypotUrl `
                                         -Method POST `
                                         -Body $body `
                                         -ContentType "application/json" `
                                         -Headers @{"User-Agent" = $userAgent} `
                                         -TimeoutSec 10 `
                                         -ErrorAction Stop
            
            $totalAttacks++
            $patternSuccess++
            $successCount++
            
            # Show progress
            Write-Host "   [$i/$($pattern.count)] ✅ $username / " -NoNewline -ForegroundColor Green
            Write-Host "****** " -NoNewline -ForegroundColor DarkGray
            Write-Host "→ Logged" -ForegroundColor Green
            
        } catch {
            $totalAttacks++
            $failureCount++
            Write-Host "   [$i/$($pattern.count)] ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        # Delay between attacks
        Start-Sleep -Milliseconds $DelayMs
    }
    
    Write-Host "   Pattern Complete: $patternSuccess/$($pattern.count) successful`n" -ForegroundColor Cyan
}

$endTime = Get-Date
$duration = ($endTime - $startTime).TotalSeconds

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ✅ ATTACK SIMULATION COMPLETE                       ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "📊 SUMMARY:" -ForegroundColor Cyan
Write-Host "  Total Attacks Sent: $totalAttacks" -ForegroundColor White
Write-Host "  Successful: $successCount" -ForegroundColor Green
Write-Host "  Failed: $failureCount" -ForegroundColor Red
Write-Host "  Duration: $([math]::Round($duration, 2)) seconds" -ForegroundColor White
Write-Host "  Attack Rate: $([math]::Round($totalAttacks / $duration, 2)) attacks/sec`n" -ForegroundColor White

Write-Host "📝 NEXT STEPS:`n" -ForegroundColor Yellow

Write-Host "1. Check raw logs:" -ForegroundColor Cyan
Write-Host "   Get-Content data\honeypot_raw.log | Select-Object -Last 10`n" -ForegroundColor White

Write-Host "2. Wait for enrichment (15-30 seconds):" -ForegroundColor Cyan
Write-Host "   docker logs fullcraft_enrichment --tail 20`n" -ForegroundColor White

Write-Host "3. Check enriched logs:" -ForegroundColor Cyan
Write-Host "   Get-Content data\honeypot_enriched.jsonl | Select-Object -Last 5`n" -ForegroundColor White

Write-Host "4. Run analysis pipeline:" -ForegroundColor Cyan
Write-Host "   .\run-analysis.ps1" -ForegroundColor White
Write-Host "   py analysis\export_to_db.py`n" -ForegroundColor White

Write-Host "5. View results in dashboards:" -ForegroundColor Cyan
Write-Host "   Flask: cd dashboard; py app.py" -ForegroundColor White
Write-Host "          → http://localhost:5000" -ForegroundColor Yellow
Write-Host "   Jupyter: cd analysis; jupyter notebook" -ForegroundColor White
Write-Host "            → http://localhost:8889`n" -ForegroundColor Yellow

Write-Host "6. Check real-time alerts:" -ForegroundColor Cyan
Write-Host "   docker logs fullcraft_alerts --tail 30`n" -ForegroundColor White

Write-Host "🎉 Attack simulation complete! Check dashboards for results!`n" -ForegroundColor Green
