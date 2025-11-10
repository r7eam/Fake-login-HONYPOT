# Honeypot Attack Simulation Test
# Sends realistic attack traffic to test the complete pipeline

param(
    [string]$HoneypotUrl = "http://localhost:8080/fake-login"
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  HONEYPOT ATTACK SIMULATION TEST" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check honeypot
Write-Host "[*] Checking honeypot at $HoneypotUrl..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $HoneypotUrl -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "[+] Honeypot is ONLINE (Status: $($response.StatusCode))`n" -ForegroundColor Green
} catch {
    Write-Host "[-] Cannot reach honeypot!" -ForegroundColor Red
    Write-Host "[*] Starting honeypot container..." -ForegroundColor Yellow
    docker start fullcraft_honeypot
    Start-Sleep -Seconds 5
}

# Attack payloads
$attacks = @(
    @{user="admin"; pass="admin"},
    @{user="admin"; pass="password"},
    @{user="admin"; pass="123456"},
    @{user="admin"; pass="admin123"},
    @{user="admin"; pass="P@ssw0rd"},
    @{user="root"; pass="root"},
    @{user="root"; pass="toor"},
    @{user="root"; pass="password"},
    @{user="john.doe"; pass="qwerty123"},
    @{user="jane.smith"; pass="welcome1"},
    @{user="user123"; pass="letmein"},
    @{user="test"; pass="test123"},
    @{user="administrator"; pass="admin"},
    @{user="webmaster"; pass="admin"},
    @{user="support"; pass="admin"},
    @{user="manager"; pass="password"},
    @{user="admin"; pass="' OR '1'='1"},
    @{user="admin"; pass="admin'--"},
    @{user="<script>alert(1)</script>"; pass="test"},
    @{user="admin"; pass="<img src=x>"},
    @{user="../admin"; pass="admin"},
    @{user="admin; ls -la"; pass="admin"},
    @{user="admin"; pass="burst1"},
    @{user="admin"; pass="burst2"},
    @{user="admin"; pass="burst3"},
    @{user="admin"; pass="burst4"},
    @{user="admin"; pass="burst5"}
)

Write-Host "[*] Launching $($attacks.Count) attack simulations...`n" -ForegroundColor Yellow

$successCount = 0
$startTime = Get-Date

for ($i = 0; $i -lt $attacks.Count; $i++) {
    $attack = $attacks[$i]
    
    $body = @{
        username = $attack.user
        password = $attack.pass
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri $HoneypotUrl `
                                      -Method POST `
                                      -Body $body `
                                      -ContentType "application/json" `
                                      -TimeoutSec 10
        
        $successCount++
        Write-Host "[$($i+1)/$($attacks.Count)] [+] Attack logged: $($attack.user) / ******" -ForegroundColor Green
        
    } catch {
        Write-Host "[$($i+1)/$($attacks.Count)] [-] Failed" -ForegroundColor Red
    }
    
    Start-Sleep -Milliseconds 300
}

$endTime = Get-Date
$duration = ($endTime - $startTime).TotalSeconds

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  TEST COMPLETE" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "RESULTS:" -ForegroundColor Cyan
Write-Host "  Total attacks: $($attacks.Count)" -ForegroundColor White
Write-Host "  Successful: $successCount" -ForegroundColor Green
Write-Host "  Duration: $([math]::Round($duration, 2)) seconds`n" -ForegroundColor White

Write-Host "NEXT STEPS:`n" -ForegroundColor Yellow
Write-Host "1. Check raw logs:" -ForegroundColor Cyan
Write-Host "   Get-Content data\honeypot_raw.log | Select-Object -Last 10`n" -ForegroundColor White
Write-Host "2. Wait 30 seconds for enrichment, then:" -ForegroundColor Cyan
Write-Host "   Get-Content data\honeypot_enriched.jsonl | Select-Object -Last 5`n" -ForegroundColor White
Write-Host "3. Run analytics:" -ForegroundColor Cyan
Write-Host "   .\run-analysis.ps1" -ForegroundColor White
Write-Host "   py analysis\export_to_db.py`n" -ForegroundColor White
Write-Host "4. View dashboards:" -ForegroundColor Cyan
Write-Host "   Flask: cd dashboard; py app.py" -ForegroundColor White
Write-Host "   Jupyter: http://localhost:8889`n" -ForegroundColor White

Write-Host "[+] Test complete!`n" -ForegroundColor Green
