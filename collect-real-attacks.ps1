# Script to collect real attack data from honeypot

Write-Host "🍯 Starting Honeypot Attack Collection..." -ForegroundColor Green
Write-Host ""

# Step 1: Start honeypot
Write-Host "📡 Step 1: Starting honeypot container..." -ForegroundColor Yellow
docker-compose -f docker-compose.honeypot.yml up -d
Start-Sleep -Seconds 5

# Step 2: Start enrichment worker
Write-Host "🔍 Step 2: Starting enrichment worker..." -ForegroundColor Yellow
docker-compose -f docker-compose.enrich.yml up -d
Start-Sleep -Seconds 5

# Check status
Write-Host ""
Write-Host "✅ Services started! Checking status..." -ForegroundColor Green
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

Write-Host ""
Write-Host "🎯 HONEYPOT IS NOW LIVE AND COLLECTING ATTACKS!" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Collection Info:" -ForegroundColor Yellow
Write-Host "   • Honeypot URL: http://localhost:8080/fake-login"
Write-Host "   • Raw logs: data/honeypot_raw.jsonl"
Write-Host "   • Enriched data: data/honeypot_enriched.jsonl"
Write-Host ""
Write-Host "⏱️  Recommended collection time:" -ForegroundColor Yellow
Write-Host "   • Minimum: 24 hours (for thesis demo)"
Write-Host "   • Better: 48-72 hours (more attack patterns)"
Write-Host "   • Best: 1 week (comprehensive dataset)"
Write-Host ""
Write-Host "🌍 To get MORE attacks, expose to internet:" -ForegroundColor Magenta
Write-Host "   1. Deploy to cloud VPS (DigitalOcean, AWS, Azure)"
Write-Host "   2. Or use ngrok: ngrok http 8080"
Write-Host "   3. Share URL on attacker forums (high risk!)"
Write-Host ""
Write-Host "📈 Monitor attacks in real-time:" -ForegroundColor Yellow
Write-Host "   docker logs -f honeypot_container"
Write-Host "   Get-Content data\honeypot_raw.jsonl -Wait"
Write-Host ""
Write-Host "🛑 When done collecting, run:" -ForegroundColor Red
Write-Host "   .\analyze-real-attacks.ps1"
Write-Host ""
