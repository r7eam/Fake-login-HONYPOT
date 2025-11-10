# Smoke Tests for Enrichment Worker
# Tests mock mode, real mode, and container mode

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('all', 'mock', 'real', 'container')]
    [string]$Mode = 'all'
)

Write-Host "🧪 Enrichment Worker Smoke Tests" -ForegroundColor Cyan
Write-Host "=" * 60

$ErrorCount = 0
$TestCount = 0

function Test-MockMode {
    Write-Host "`n📝 Test 1: Mock Mode (No MaxMind DBs)" -ForegroundColor Yellow
    Write-Host "-" * 60
    
    $TestCount++
    
    try {
        # Run test worker which uses mock data
        python enrich/test_worker.py
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Mock mode test PASSED" -ForegroundColor Green
            
            # Verify output file exists
            if (Test-Path "data/honeypot_enriched_test.jsonl") {
                $lines = (Get-Content "data/honeypot_enriched_test.jsonl").Count
                Write-Host "   Generated $lines enriched events" -ForegroundColor Gray
            }
        } else {
            Write-Host "❌ Mock mode test FAILED (exit code: $LASTEXITCODE)" -ForegroundColor Red
            $script:ErrorCount++
        }
    } catch {
        Write-Host "❌ Mock mode test FAILED: $_" -ForegroundColor Red
        $script:ErrorCount++
    }
}

function Test-PytestUnits {
    Write-Host "`n📝 Test 2: Unit Tests (pytest)" -ForegroundColor Yellow
    Write-Host "-" * 60
    
    $TestCount++
    
    try {
        # Check if pytest is installed
        python -c "import pytest" 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "⚠️  pytest not installed, installing..." -ForegroundColor Yellow
            pip install -q pytest pytest-cov
        }
        
        # Run pytest
        Write-Host "Running pytest..." -ForegroundColor Gray
        pytest enrich/test_enrichment.py -v --tb=short
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Unit tests PASSED" -ForegroundColor Green
        } else {
            Write-Host "❌ Unit tests FAILED" -ForegroundColor Red
            $script:ErrorCount++
        }
    } catch {
        Write-Host "❌ Unit test failed: $_" -ForegroundColor Red
        $script:ErrorCount++
    }
}

function Test-RealMode {
    Write-Host "`n📝 Test 3: Real Mode (with MaxMind DBs)" -ForegroundColor Yellow
    Write-Host "-" * 60
    
    $TestCount++
    
    # Check for MaxMind databases
    $cityDb = "data/GeoLite2-City.mmdb"
    $asnDb = "data/GeoLite2-ASN.mmdb"
    
    if (-not (Test-Path $cityDb) -or -not (Test-Path $asnDb)) {
        Write-Host "⚠️  MaxMind databases not found" -ForegroundColor Yellow
        Write-Host "   Expected: $cityDb" -ForegroundColor Gray
        Write-Host "   Expected: $asnDb" -ForegroundColor Gray
        Write-Host "   Skipping real mode test" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "   To download databases:" -ForegroundColor Cyan
        Write-Host '   .\download-maxmind.ps1 -AccountId "YOUR_ID" -LicenseKey "YOUR_KEY"'
        return
    }
    
    # Check for input events
    if (-not (Test-Path "data/honeypot_events.jsonl")) {
        Write-Host "⚠️  No input events found (data/honeypot_events.jsonl)" -ForegroundColor Yellow
        Write-Host "   Skipping real mode test" -ForegroundColor Yellow
        return
    }
    
    try {
        # Backup existing enriched file
        if (Test-Path "data/honeypot_enriched.jsonl") {
            Copy-Item "data/honeypot_enriched.jsonl" "data/honeypot_enriched.jsonl.bak" -Force
        }
        
        # Run enrichment worker
        Write-Host "Running enrichment worker..." -ForegroundColor Gray
        
        $env:RAW_LOG = "data/honeypot_events.jsonl"
        $env:ENRICHED_OUT = "data/honeypot_enriched_smoke.jsonl"
        $env:GEOIP_CITY = $cityDb
        $env:GEOIP_ASN = $asnDb
        
        python enrich/worker.py
        
        if ($LASTEXITCODE -eq 0 -and (Test-Path "data/honeypot_enriched_smoke.jsonl")) {
            Write-Host "✅ Real mode test PASSED" -ForegroundColor Green
            
            # Verify enriched output
            $enriched = Get-Content "data/honeypot_enriched_smoke.jsonl" | Select-Object -First 1 | ConvertFrom-Json
            
            Write-Host "   Sample enriched event:" -ForegroundColor Gray
            if ($enriched.geo) {
                Write-Host "     - GeoIP: $($enriched.geo.country), $($enriched.geo.city)" -ForegroundColor Gray
            }
            if ($enriched.asn) {
                Write-Host "     - ASN: $($enriched.asn.asn) ($($enriched.asn.org))" -ForegroundColor Gray
            }
            if ($enriched.rdns) {
                Write-Host "     - rDNS: $($enriched.rdns)" -ForegroundColor Gray
            }
            Write-Host "     - Tags: $($enriched.tags -join ', ')" -ForegroundColor Gray
            if ($enriched.confidence) {
                Write-Host "     - Confidence: $($enriched.confidence | ConvertTo-Json -Compress)" -ForegroundColor Gray
            }
            
            # Cleanup
            Remove-Item "data/honeypot_enriched_smoke.jsonl" -Force
        } else {
            Write-Host "❌ Real mode test FAILED" -ForegroundColor Red
            $script:ErrorCount++
        }
    } catch {
        Write-Host "❌ Real mode test failed: $_" -ForegroundColor Red
        $script:ErrorCount++
    }
}

function Test-ContainerMode {
    Write-Host "`n📝 Test 4: Container Mode (Docker)" -ForegroundColor Yellow
    Write-Host "-" * 60
    
    $TestCount++
    
    # Check if Docker is available
    docker --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Docker not available, skipping container test" -ForegroundColor Yellow
        return
    }
    
    try {
        # Build enrichment container
        Write-Host "Building enrichment container..." -ForegroundColor Gray
        docker compose -f docker-compose.honeypot.yml build enrich 2>&1 | Out-Null
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Container build FAILED" -ForegroundColor Red
            $script:ErrorCount++
            return
        }
        
        # Check for input events
        if (-not (Test-Path "data/honeypot_events.jsonl")) {
            Write-Host "⚠️  No input events, skipping container run test" -ForegroundColor Yellow
            return
        }
        
        # Run enrichment in container
        Write-Host "Running enrichment in container..." -ForegroundColor Gray
        docker compose -f docker-compose.honeypot.yml run --rm enrich python worker.py 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Container mode test PASSED" -ForegroundColor Green
        } else {
            Write-Host "❌ Container mode test FAILED" -ForegroundColor Red
            $script:ErrorCount++
        }
    } catch {
        Write-Host "❌ Container test failed: $_" -ForegroundColor Red
        $script:ErrorCount++
    }
}

function Test-SchemaValidation {
    Write-Host "`n📝 Test 5: Canonical Schema Validation" -ForegroundColor Yellow
    Write-Host "-" * 60
    
    $TestCount++
    
    try {
        # Check if we have enriched output to validate
        $enrichedFile = if (Test-Path "data/honeypot_enriched.jsonl") {
            "data/honeypot_enriched.jsonl"
        } elseif (Test-Path "data/honeypot_enriched_test.jsonl") {
            "data/honeypot_enriched_test.jsonl"
        } else {
            $null
        }
        
        if (-not $enrichedFile) {
            Write-Host "⚠️  No enriched events to validate, skipping" -ForegroundColor Yellow
            return
        }
        
        Write-Host "Validating schema in: $enrichedFile" -ForegroundColor Gray
        
        $event = Get-Content $enrichedFile | Select-Object -First 1 | ConvertFrom-Json
        
        # Check required canonical fields
        $requiredFields = @('id', 'received_at', 'src_ip', 'enriched_at', 'tags')
        $missingFields = @()
        
        foreach ($field in $requiredFields) {
            if (-not $event.$field) {
                $missingFields += $field
            }
        }
        
        if ($missingFields.Count -eq 0) {
            Write-Host "✅ Schema validation PASSED" -ForegroundColor Green
            Write-Host "   All required canonical fields present" -ForegroundColor Gray
            
            # Check optional enrichment fields
            if ($event.geo) { Write-Host "   ✓ geo enrichment" -ForegroundColor Gray }
            if ($event.asn) { Write-Host "   ✓ asn enrichment" -ForegroundColor Gray }
            if ($event.rdns) { Write-Host "   ✓ rdns enrichment" -ForegroundColor Gray }
            if ($event.confidence) { Write-Host "   ✓ confidence scores" -ForegroundColor Gray }
            if ($event.first_seen) { Write-Host "   ✓ first_seen/last_seen/seen_count" -ForegroundColor Gray }
        } else {
            Write-Host "❌ Schema validation FAILED" -ForegroundColor Red
            Write-Host "   Missing fields: $($missingFields -join ', ')" -ForegroundColor Red
            $script:ErrorCount++
        }
    } catch {
        Write-Host "❌ Schema validation failed: $_" -ForegroundColor Red
        $script:ErrorCount++
    }
}

# Run tests based on mode
switch ($Mode) {
    'mock' {
        Test-MockMode
        Test-PytestUnits
        Test-SchemaValidation
    }
    'real' {
        Test-RealMode
        Test-SchemaValidation
    }
    'container' {
        Test-ContainerMode
    }
    'all' {
        Test-MockMode
        Test-PytestUnits
        Test-RealMode
        Test-ContainerMode
        Test-SchemaValidation
    }
}

# Summary
Write-Host "`n" + "=" * 60
if ($ErrorCount -eq 0) {
    Write-Host "✅ ALL TESTS PASSED!" -ForegroundColor Green
} else {
    Write-Host "❌ $ErrorCount test(s) FAILED" -ForegroundColor Red
}
Write-Host "=" * 60
Write-Host ""

exit $ErrorCount
