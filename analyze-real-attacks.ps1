# Script to analyze real attack data collected by honeypot

Write-Host "📊 Analyzing Real Attack Data..." -ForegroundColor Green
Write-Host ""

# Step 1: Check data files
Write-Host "📁 Step 1: Checking collected data..." -ForegroundColor Yellow

if (Test-Path "data/honeypot_enriched.jsonl") {
    $lineCount = (Get-Content "data/honeypot_enriched.jsonl" | Measure-Object -Line).Lines
    Write-Host "   ✅ Found enriched data: $lineCount events" -ForegroundColor Green
    
    # Show sample
    Write-Host ""
    Write-Host "   Sample attack:" -ForegroundColor Cyan
    Get-Content "data/honeypot_enriched.jsonl" -First 1 | ConvertFrom-Json | Format-List ip, username, password, geo_country, tags
} else {
    Write-Host "   ❌ No enriched data found!" -ForegroundColor Red
    Write-Host "   Make sure enrichment worker is running:" -ForegroundColor Yellow
    Write-Host "   docker-compose -f docker-compose.enrich.yml up -d"
    exit
}

Write-Host ""
Write-Host "🔄 Step 2: Running analytics pipeline..." -ForegroundColor Yellow

# Prepare dataset
Write-Host "   → Preparing dataset..." -ForegroundColor Cyan
py analysis/prepare_dataset.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Dataset preparation failed!" -ForegroundColor Red
    exit
}

# Calculate metrics
Write-Host "   → Calculating metrics..." -ForegroundColor Cyan
py analysis/metrics.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Metrics calculation failed!" -ForegroundColor Red
    exit
}

# Generate plots
Write-Host "   → Generating charts..." -ForegroundColor Cyan
py analysis/plots.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Chart generation failed!" -ForegroundColor Red
    exit
}

# Export to database
Write-Host "   → Exporting to database..." -ForegroundColor Cyan
py analysis/export_to_db.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Database export failed!" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "✅ ANALYSIS COMPLETE!" -ForegroundColor Green
Write-Host ""

# Show statistics
Write-Host "📊 Attack Statistics:" -ForegroundColor Yellow
py check-db.py

Write-Host ""
Write-Host "🌐 Step 3: Starting dashboard..." -ForegroundColor Yellow
Write-Host "   Dashboard will open at http://localhost:5000"
Write-Host ""

# Kill any existing dashboard
Get-Process | Where-Object {$_.ProcessName -like "*py*"} | Where-Object {$_.CommandLine -like "*app.py*"} | Stop-Process -Force -ErrorAction SilentlyContinue

# Start dashboard
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'dashboard'; py app.py"
Start-Sleep -Seconds 3
Start-Process "http://localhost:5000"

Write-Host ""
Write-Host "✅ Real attack analysis ready for your thesis!" -ForegroundColor Green
Write-Host ""
Write-Host "📸 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Take screenshots of dashboard charts"
Write-Host "   2. Export charts from analysis/out/*.png"
Write-Host "   3. Document findings in thesis Chapter 5"
Write-Host ""
