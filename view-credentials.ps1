# View captured credentials from honeypot
# Run from: C:\Users\Alsakkal\Desktop\Fake login HONYPOT

Write-Host @"
╔══════════════════════════════════════════════════════════╗
║         CAPTURED ATTACKER CREDENTIALS                    ║
║  WARNING: Contains plaintext passwords for research      ║
╚══════════════════════════════════════════════════════════╝
"@ -ForegroundColor Yellow

# Check if data file exists
if (-not (Test-Path ".\data\honeypot_events.jsonl")) {
    Write-Host "`n❌ No events file found!" -ForegroundColor Red
    Write-Host "Run .\simulate-attacks.ps1 first to generate attack data." -ForegroundColor Yellow
    exit
}

# Load events
$events = Get-Content ".\data\honeypot_events.jsonl" | ForEach-Object { $_ | ConvertFrom-Json }

if ($events.Count -eq 0) {
    Write-Host "`n❌ No events captured yet!" -ForegroundColor Red
    exit
}

Write-Host "`n✓ Found $($events.Count) attack attempts`n" -ForegroundColor Green

# Display options
Write-Host "Choose view option:" -ForegroundColor Cyan
Write-Host "  1. View all attempts (detailed)" -ForegroundColor Gray
Write-Host "  2. View unique username/password combinations" -ForegroundColor Gray
Write-Host "  3. View last 10 attempts" -ForegroundColor Gray
Write-Host "  4. Export to text file" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "Enter choice (1-4)"

switch ($choice) {
    "1" {
        # View all attempts
        Write-Host "`n══════════════════════════════════════════════════════════" -ForegroundColor Cyan
        Write-Host "  ALL CAPTURED ATTEMPTS ($($events.Count) total)" -ForegroundColor Cyan
        Write-Host "══════════════════════════════════════════════════════════`n" -ForegroundColor Cyan
        
        $counter = 1
        foreach ($event in $events) {
            Write-Host "[$counter] " -NoNewline -ForegroundColor DarkGray
            Write-Host "$(($event.timestamp -or $event.received_at))" -ForegroundColor Gray
            Write-Host "    IP: " -NoNewline -ForegroundColor Yellow
            Write-Host "$($event.src_ip)" -ForegroundColor White
            Write-Host "    Username: " -NoNewline -ForegroundColor Yellow
            Write-Host "$($event.username)" -ForegroundColor Cyan
            Write-Host "    Password: " -NoNewline -ForegroundColor Yellow
            Write-Host "$($event.password)" -ForegroundColor Magenta
            
            if ($event.tags -and $event.tags.Count -gt 0) {
                Write-Host "    Tags: " -NoNewline -ForegroundColor Yellow
                Write-Host "$($event.tags -join ', ')" -ForegroundColor Red
            }
            
            $ua = if ($event.headers) { $event.headers.user_agent } else { $event.ua }
            if ($ua) {
                Write-Host "    User-Agent: " -NoNewline -ForegroundColor Yellow
                Write-Host "$($ua.Substring(0, [Math]::Min(70, $ua.Length)))" -ForegroundColor DarkGray
            }
            
            Write-Host ""
            $counter++
        }
    }
    
    "2" {
        # View unique combinations
        Write-Host "`n══════════════════════════════════════════════════════════" -ForegroundColor Cyan
        Write-Host "  UNIQUE USERNAME/PASSWORD COMBINATIONS" -ForegroundColor Cyan
        Write-Host "══════════════════════════════════════════════════════════`n" -ForegroundColor Cyan
        
        $unique = $events | Group-Object { "$($_.username):$($_.password)" } | Sort-Object Count -Descending
        
        Write-Host "Found $($unique.Count) unique combinations:`n" -ForegroundColor Green
        
        foreach ($combo in $unique) {
            $parts = $combo.Name -split ':'
            Write-Host "  Username: " -NoNewline -ForegroundColor Yellow
            Write-Host "$($parts[0])".PadRight(40) -NoNewline -ForegroundColor Cyan
            Write-Host "Password: " -NoNewline -ForegroundColor Yellow
            Write-Host "$($parts[1])".PadRight(30) -NoNewline -ForegroundColor Magenta
            Write-Host "($($combo.Count)x)" -ForegroundColor Gray
        }
    }
    
    "3" {
        # View last 10
        Write-Host "`n══════════════════════════════════════════════════════════" -ForegroundColor Cyan
        Write-Host "  LAST 10 ATTEMPTS" -ForegroundColor Cyan
        Write-Host "══════════════════════════════════════════════════════════`n" -ForegroundColor Cyan
        
        $last10 = $events | Select-Object -Last 10
        
        foreach ($event in $last10) {
            Write-Host "⏰ " -NoNewline -ForegroundColor Gray
            Write-Host "$(($event.timestamp -or $event.received_at))" -ForegroundColor Gray
            Write-Host "  IP: $($event.src_ip)" -ForegroundColor White
            Write-Host "  Username: " -NoNewline -ForegroundColor Yellow
            Write-Host "$($event.username)" -ForegroundColor Cyan
            Write-Host "  Password: " -NoNewline -ForegroundColor Yellow
            Write-Host "$($event.password)" -ForegroundColor Magenta
            Write-Host ""
        }
    }
    
    "4" {
        # Export to file
        $outputPath = ".\data\captured_credentials.txt"
        
        $output = @"
═══════════════════════════════════════════════════════════
HONEYPOT CAPTURED CREDENTIALS REPORT
Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Total Attempts: $($events.Count)
═══════════════════════════════════════════════════════════

"@
        
        $counter = 1
        foreach ($event in $events) {
            $ua = if ($event.headers) { $event.headers.user_agent } else { $event.ua }
            $output += @"

[$counter] $(($event.timestamp -or $event.received_at))
IP Address: $($event.src_ip)
Username: $($event.username)
Password: $($event.password)
User-Agent: $ua
Tags: $($event.tags -join ', ')
---

"@
            $counter++
        }
        
        $output | Out-File -FilePath $outputPath -Encoding UTF8
        Write-Host "`n✓ Exported to: $outputPath" -ForegroundColor Green
        Write-Host "You can open this file in any text editor.`n" -ForegroundColor Gray
    }
    
    default {
        Write-Host "`n❌ Invalid choice!" -ForegroundColor Red
    }
}

Write-Host "`n═══════════════════════════════════════════════════════════`n" -ForegroundColor Cyan
