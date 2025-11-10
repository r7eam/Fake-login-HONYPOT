# MaxMind GeoLite2 Database Downloader
# Requires MaxMind account and license key

param(
    [Parameter(Mandatory=$false)]
    [string]$AccountId = $env:MAXMIND_ACCOUNT_ID,
    
    [Parameter(Mandatory=$false)]
    [string]$LicenseKey = $env:MAXMIND_LICENSE_KEY,
    
    [Parameter(Mandatory=$false)]
    [string]$OutputDir = "data"
)

Write-Host "🌍 MaxMind GeoLite2 Database Downloader" -ForegroundColor Cyan
Write-Host "=" * 60

# Check if account credentials are provided
if (-not $AccountId -or -not $LicenseKey) {
    Write-Host ""
    Write-Host "❌ MaxMind credentials not provided!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please provide your MaxMind account credentials:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1: Environment variables" -ForegroundColor Green
    Write-Host '  $env:MAXMIND_ACCOUNT_ID = "YOUR_ACCOUNT_ID"'
    Write-Host '  $env:MAXMIND_LICENSE_KEY = "YOUR_LICENSE_KEY"'
    Write-Host '  .\download-maxmind.ps1'
    Write-Host ""
    Write-Host "Option 2: Command line parameters" -ForegroundColor Green
    Write-Host '  .\download-maxmind.ps1 -AccountId "YOUR_ID" -LicenseKey "YOUR_KEY"'
    Write-Host ""
    Write-Host "📝 Get your free MaxMind account:" -ForegroundColor Cyan
    Write-Host "   1. Sign up: https://www.maxmind.com/en/geolite2/signup"
    Write-Host "   2. Get license key: https://www.maxmind.com/en/accounts/current/license-key"
    Write-Host ""
    exit 1
}

# Create output directory
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
    Write-Host "✅ Created directory: $OutputDir" -ForegroundColor Green
}

# Database editions to download
$editions = @(
    @{
        Name = "GeoLite2-City"
        FileName = "GeoLite2-City.mmdb"
        Url = "https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-City&license_key=${LicenseKey}&suffix=tar.gz"
    },
    @{
        Name = "GeoLite2-ASN"
        FileName = "GeoLite2-ASN.mmdb"
        Url = "https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-ASN&license_key=${LicenseKey}&suffix=tar.gz"
    }
)

foreach ($edition in $editions) {
    Write-Host ""
    Write-Host "📥 Downloading $($edition.Name)..." -ForegroundColor Cyan
    
    $tempFile = Join-Path $env:TEMP "$($edition.Name).tar.gz"
    
    try {
        # Download
        Invoke-WebRequest -Uri $edition.Url -OutFile $tempFile -ErrorAction Stop
        Write-Host "   ✅ Downloaded to temp" -ForegroundColor Green
        
        # Extract tar.gz (requires tar command on Windows 10+)
        $extractDir = Join-Path $env:TEMP $edition.Name
        if (Test-Path $extractDir) {
            Remove-Item $extractDir -Recurse -Force
        }
        New-Item -ItemType Directory -Path $extractDir | Out-Null
        
        # Extract using tar (available on Windows 10+)
        tar -xzf $tempFile -C $extractDir
        Write-Host "   ✅ Extracted archive" -ForegroundColor Green
        
        # Find .mmdb file in extracted directory
        $mmdbFile = Get-ChildItem -Path $extractDir -Filter "*.mmdb" -Recurse | Select-Object -First 1
        
        if ($mmdbFile) {
            $destPath = Join-Path $OutputDir $edition.FileName
            Copy-Item $mmdbFile.FullName -Destination $destPath -Force
            
            $sizeKB = [math]::Round($mmdbFile.Length / 1KB, 2)
            Write-Host "   ✅ Copied to $destPath ($sizeKB KB)" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Could not find .mmdb file in archive" -ForegroundColor Red
        }
        
        # Cleanup
        Remove-Item $tempFile -Force
        Remove-Item $extractDir -Recurse -Force
        
    } catch {
        Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
        
        if ($_.Exception.Message -like "*401*" -or $_.Exception.Message -like "*403*") {
            Write-Host ""
            Write-Host "⚠️  Authentication failed! Please check your credentials:" -ForegroundColor Yellow
            Write-Host "   - Account ID: $AccountId"
            Write-Host "   - License Key: ${LicenseKey.Substring(0, 8)}..." -ForegroundColor Gray
            Write-Host ""
            Write-Host "   Get your license key: https://www.maxmind.com/en/accounts/current/license-key"
            exit 1
        }
    }
}

Write-Host ""
Write-Host "=" * 60
Write-Host "✅ MaxMind Database Download Complete!" -ForegroundColor Green
Write-Host "=" * 60

# Verify files
$cityDb = Join-Path $OutputDir "GeoLite2-City.mmdb"
$asnDb = Join-Path $OutputDir "GeoLite2-ASN.mmdb"

if ((Test-Path $cityDb) -and (Test-Path $asnDb)) {
    Write-Host ""
    Write-Host "📁 Downloaded databases:" -ForegroundColor Cyan
    Get-ChildItem $OutputDir -Filter "*.mmdb" | ForEach-Object {
        $sizeKB = [math]::Round($_.Length / 1KB, 2)
        Write-Host "   ✓ $($_.Name) ($sizeKB KB)" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "💡 Next steps:" -ForegroundColor Yellow
    Write-Host "   1. Build enrichment container:"
    Write-Host "      docker compose -f docker-compose.honeypot.yml build enrich"
    Write-Host ""
    Write-Host "   2. Run enrichment worker:"
    Write-Host "      docker compose -f docker-compose.honeypot.yml run --rm enrich"
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "⚠️  Some databases are missing!" -ForegroundColor Yellow
    Write-Host "   Please try downloading manually from:" -ForegroundColor Yellow
    Write-Host "   https://www.maxmind.com/en/accounts/current/geoip/downloads"
    Write-Host ""
}
