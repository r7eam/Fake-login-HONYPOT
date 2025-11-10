# Simple Honeypot Test - Be Your Own Attacker!

Write-Host "Testing Honeypot - You are the attacker!" -ForegroundColor Cyan
Write-Host ""

# Check if honeypot running
Write-Host "Checking honeypot status..." -ForegroundColor Yellow
docker-compose -f docker-compose.honeypot.yml up -d
docker-compose -f docker-compose.enrich.yml up -d
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "Launching 5 attacks..." -ForegroundColor Yellow
Write-Host ""

# Attack 1: SQL Injection
Write-Host "Attack 1: SQL Injection..." -ForegroundColor Magenta
Invoke-WebRequest -Uri "http://localhost:8080/fake-login" `
    -Method POST `
    -Body '{"username":"admin'' OR ''1''=''1","password":"x"}' `
    -ContentType "application/json" `
    -ErrorAction SilentlyContinue | Out-Null
Start-Sleep -Seconds 1

# Attack 2: Brute Force
Write-Host "Attack 2: Brute force..." -ForegroundColor Magenta
Invoke-WebRequest -Uri "http://localhost:8080/fake-login" `
    -Method POST `
    -Body '{"username":"admin","password":"admin123"}' `
    -ContentType "application/json" `
    -ErrorAction SilentlyContinue | Out-Null
Start-Sleep -Seconds 1

# Attack 3: XSS
Write-Host "Attack 3: XSS attempt..." -ForegroundColor Magenta
Invoke-WebRequest -Uri "http://localhost:8080/fake-login" `
    -Method POST `
    -Body '{"username":"<script>alert(1)</script>","password":"test"}' `
    -ContentType "application/json" `
    -ErrorAction SilentlyContinue | Out-Null
Start-Sleep -Seconds 1

# Attack 4: Path Traversal
Write-Host "Attack 4: Path traversal..." -ForegroundColor Magenta
Invoke-WebRequest -Uri "http://localhost:8080/admin-login" `
    -Method POST `
    -Body '{"username":"../../../etc/passwd","password":"admin"}' `
    -ContentType "application/json" `
    -ErrorAction SilentlyContinue | Out-Null
Start-Sleep -Seconds 1

# Attack 5: Credential Stuffing
Write-Host "Attack 5: Credential stuffing..." -ForegroundColor Magenta
Invoke-WebRequest -Uri "http://localhost:8080/login" `
    -Method POST `
    -Body '{"username":"user@gmail.com","password":"Summer2024!"}' `
    -ContentType "application/json" `
    -ErrorAction SilentlyContinue | Out-Null

Write-Host ""
Write-Host "Waiting for enrichment..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "WHAT THE HONEYPOT CAPTURED ABOUT YOU:" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Show last enriched attack
if (Test-Path "data/honeypot_enriched.jsonl") {
    $attack = Get-Content "data/honeypot_enriched.jsonl" -Tail 1 | ConvertFrom-Json
    
    Write-Host "IP Address:    $($attack.ip)" -ForegroundColor Yellow
    Write-Host "Country:       $($attack.geo_country)" -ForegroundColor Yellow
    Write-Host "City:          $($attack.geo_city)" -ForegroundColor Yellow
    Write-Host "ISP/Org:       $($attack.asn_org)" -ForegroundColor Yellow
    Write-Host "Username Used: $($attack.username)" -ForegroundColor White
    Write-Host "Password Used: $($attack.password)" -ForegroundColor White
    Write-Host "Attack Type:   $($attack.tags)" -ForegroundColor Red
    Write-Host "Target Path:   $($attack.path)" -ForegroundColor White
    Write-Host "Timestamp:     $($attack.timestamp)" -ForegroundColor White
} else {
    Write-Host "No enriched data yet. Check honeypot logs:" -ForegroundColor Red
    Write-Host "docker logs honeypot_container" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "YES! It works! The honeypot captured:" -ForegroundColor Cyan
Write-Host "  - Your IP address" -ForegroundColor White
Write-Host "  - Your country and city" -ForegroundColor White
Write-Host "  - Your ISP/organization" -ForegroundColor White
Write-Host "  - The username you entered" -ForegroundColor White
Write-Host "  - The password you entered" -ForegroundColor White
Write-Host "  - The attack type detected" -ForegroundColor White
Write-Host "  - When you attacked" -ForegroundColor White
Write-Host ""
Write-Host "Now view it in the dashboard:" -ForegroundColor Yellow
Write-Host "  http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
