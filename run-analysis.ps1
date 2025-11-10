# Run Complete Analysis Pipeline
# Executes all analysis steps in sequence

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "         PHASE 6 - ANALYTICS & REPORTING PIPELINE" -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$ErrorCount = 0

# Check Python
Write-Host "Checking Python installation..." -ForegroundColor Cyan
python --version 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Python not found!" -ForegroundColor Red
    Write-Host "   Install Python 3.11+ from python.org" -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] Python installed" -ForegroundColor Green
Write-Host ""

# Check dependencies
Write-Host "Checking dependencies..." -ForegroundColor Cyan
python -c "import matplotlib" 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARNING] matplotlib not installed" -ForegroundColor Yellow
    Write-Host "   Installing dependencies..." -ForegroundColor Cyan
    pip install -r analysis/requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to install dependencies" -ForegroundColor Red
        $ErrorCount++
    } else {
        Write-Host "[OK] Dependencies installed" -ForegroundColor Green
    }
} else {
    Write-Host "[OK] Dependencies already installed" -ForegroundColor Green
}
Write-Host ""

# Check input data
Write-Host "Checking input data..." -ForegroundColor Cyan
if (-not (Test-Path "data/honeypot_enriched.jsonl")) {
    Write-Host "[ERROR] No enriched events found!" -ForegroundColor Red
    Write-Host "   Expected: data/honeypot_enriched.jsonl" -ForegroundColor Yellow
    Write-Host "   Run enrichment first: python enrich/worker.py" -ForegroundColor Yellow
    exit 1
}
$lineCount = (Get-Content "data/honeypot_enriched.jsonl" | Measure-Object -Line).Lines
Write-Host "[OK] Found $lineCount enriched events" -ForegroundColor Green
Write-Host ""

# Step 1: Prepare Dataset
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "STEP 1: Preparing Dataset" -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

python analysis/prepare_dataset.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Dataset preparation failed" -ForegroundColor Red
    $ErrorCount++
} else {
    Write-Host ""
    Write-Host "[SUCCESS] Dataset prepared" -ForegroundColor Green
}
Write-Host ""

# Step 2: Compute Metrics
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "STEP 2: Computing Metrics & KPIs" -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

python analysis/metrics.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Metrics computation failed" -ForegroundColor Red
    $ErrorCount++
} else {
    Write-Host ""
    Write-Host "[SUCCESS] Metrics computed" -ForegroundColor Green
}
Write-Host ""

# Step 3: Generate Plots
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "STEP 3: Generating Charts" -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

python analysis/plots.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Chart generation failed" -ForegroundColor Red
    $ErrorCount++
} else {
    Write-Host ""
    Write-Host "[SUCCESS] Charts generated" -ForegroundColor Green
}
Write-Host ""

# Summary
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "ANALYSIS PIPELINE COMPLETE" -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

if ($ErrorCount -eq 0) {
    Write-Host "[SUCCESS] All steps completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "OUTPUT FILES:" -ForegroundColor Cyan
    Write-Host "   CSV/JSON Metrics:" -ForegroundColor White
    Get-ChildItem "analysis/out" -Filter "*.csv" | ForEach-Object {
        Write-Host "      - $($_.Name)" -ForegroundColor Gray
    }
    if (Test-Path "analysis/out/summary.json") {
        Write-Host "      - summary.json" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "   Charts (PNG):" -ForegroundColor White
    Get-ChildItem "analysis/out" -Filter "*.png" | ForEach-Object {
        Write-Host "      - $($_.Name)" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "NEXT STEPS:" -ForegroundColor Cyan
    Write-Host "   1. Review: analysis/out/summary.json" -ForegroundColor White
    Write-Host "   2. View charts in: analysis/out/*.png" -ForegroundColor White
    Write-Host "   3. Fill in: analysis/RESULTS_TEMPLATE.md" -ForegroundColor White
    Write-Host "   4. Copy to thesis document" -ForegroundColor White
} else {
    Write-Host "[ERROR] $ErrorCount step(s) failed" -ForegroundColor Red
    Write-Host "   Check error messages above" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
