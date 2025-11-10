# Cloud Deployment Guide for Real Attack Collection

## 🌍 Deploy Honeypot to Cloud (Recommended for Thesis)

### Why Cloud Deployment?
- **Local honeypot**: Gets 0-5 attacks per day (behind router/firewall)
- **Cloud honeypot**: Gets 50-500+ attacks per day (publicly exposed)
- **Cost**: $5-10 for 48 hours on DigitalOcean/AWS

---

## Option A: DigitalOcean (Easiest)

### Step 1: Create Droplet
```bash
# On DigitalOcean dashboard:
1. Create Droplet
2. Choose: Ubuntu 22.04 LTS
3. Plan: Basic ($6/month, can destroy after 2 days)
4. Region: Choose closest to Iraq (Bangalore, Frankfurt, or Singapore)
5. Authentication: SSH Key or Password
6. Hostname: honeypot-thesis
```

### Step 2: Connect and Setup
```bash
# SSH to server
ssh root@YOUR_SERVER_IP

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Clone your project (or upload via SCP)
git clone YOUR_REPO_URL
# OR upload: scp -r "Fake login HONYPOT" root@YOUR_SERVER_IP:/root/
```

### Step 3: Start Honeypot
```bash
cd "Fake login HONYPOT"

# Start honeypot (exposed on port 80)
docker-compose -f docker-compose.honeypot.yml up -d

# Start enrichment
docker-compose -f docker-compose.enrich.yml up -d

# Open firewall
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp  # SSH
ufw enable
```

### Step 4: Monitor Attacks
```bash
# Watch attacks in real-time
tail -f data/honeypot_raw.jsonl

# Check count
wc -l data/honeypot_enriched.jsonl

# Check every hour
watch -n 3600 'wc -l data/honeypot_enriched.jsonl'
```

### Step 5: Collect Data (After 24-48 hours)
```bash
# Download data to your PC
# On YOUR PC (PowerShell):
scp root@YOUR_SERVER_IP:/root/"Fake login HONYPOT"/data/honeypot_enriched.jsonl ./data/

# Destroy droplet to stop charges!
```

### Step 6: Analyze Data Locally
```powershell
# On your PC
.\analyze-real-attacks.ps1
```

---

## Option B: ngrok (Quick Test - Free but Slower)

### Expose local honeypot to internet:
```powershell
# 1. Download ngrok: https://ngrok.com/download
# 2. Run honeypot locally
docker-compose -f docker-compose.honeypot.yml up -d

# 3. Expose port 8080
ngrok http 8080

# Will give you URL like: https://abc123.ngrok.io
# Attacks will come to your local honeypot!
```

**Note**: ngrok free tier disconnects after 2 hours, need to keep restarting.

---

## Option C: AWS EC2 (Professional)

Similar to DigitalOcean but:
```bash
1. Launch t2.micro instance (Free tier eligible)
2. Ubuntu 22.04 AMI
3. Security Group: Allow ports 80, 443, 22
4. Same Docker setup as DigitalOcean
```

---

## 📊 Expected Attack Rates

### Local (behind NAT/firewall):
- Attacks per day: 0-5
- Time to 100 attacks: 20-30 days ❌

### Cloud (publicly exposed):
- First hour: 10-50 attacks
- First 24h: 100-500 attacks
- 48 hours: 200-1000 attacks ✅

### Attack Sources:
- **Shodan scanners**: Automated port scanning
- **Mirai botnet**: IoT device attacks
- **Chinese IPs**: Brute-force campaigns
- **Russian IPs**: Credential stuffing
- **Bots**: WordPress/PHPMyAdmin scanners

---

## 🎓 For Your Thesis

### Recommended Approach:
1. ✅ **Use fake data for development/testing** (what you have now)
2. ✅ **Deploy to cloud for 48 hours** (collect real attacks)
3. ✅ **Compare fake vs real** in thesis Chapter 5

### Thesis Benefits:
- **Authenticity**: "Real attack data from internet-exposed honeypot"
- **Diversity**: Attacks from 20+ countries
- **Patterns**: Actual botnet behavior, not simulated
- **Credibility**: Professors love real-world data!

### Cost Comparison:
- **DigitalOcean**: $0.40 (48 hours of $6/month droplet)
- **AWS Free Tier**: $0 (if new account)
- **ngrok Pro**: $8/month (not needed, free tier works)

---

## ⚡ Quick Decision Guide

**Need data TODAY for thesis deadline?**
→ Use current fake data (100 realistic events) ✅

**Have 2-3 days before thesis submission?**
→ Deploy to DigitalOcean for 48h, get real data ✅✅✅

**Just testing/developing?**
→ Keep using fake data, perfect for development ✅

---

## 🔥 Pro Tip for Maximum Attacks

After deploying to cloud, **advertise your honeypot**:

```bash
# 1. Submit to Shodan
# Shodan will find it automatically in 24h

# 2. Make it look vulnerable
# Add to honeypot HTML:
<meta name="generator" content="WordPress 4.7.0" />
<meta name="description" content="Admin Panel - Please Login" />

# 3. Use common paths
# /admin, /login, /phpmyadmin, /wp-admin
# Your honeypot already uses these! ✅
```

---

## 📋 Checklist

### Before Deployment:
- [ ] Backup your current fake data
- [ ] Test honeypot locally first
- [ ] Prepare cloud account (DO/AWS)
- [ ] Set calendar reminder to stop/destroy server

### During Collection (48h):
- [ ] Monitor attack count every 12h
- [ ] Check logs for errors
- [ ] Ensure enrichment worker running

### After Collection:
- [ ] Download honeypot_enriched.jsonl
- [ ] Destroy cloud server (stop charges!)
- [ ] Run analyze-real-attacks.ps1
- [ ] Take dashboard screenshots
- [ ] Compare with fake data results

---

## 🆘 Troubleshooting

**No attacks after 6 hours on cloud?**
```bash
# Check if honeypot accessible
curl http://YOUR_SERVER_IP/fake-login

# Check firewall
ufw status

# Check logs
docker logs honeypot_container
```

**Too many attacks (DDoS)?**
```bash
# Rate limit with iptables
iptables -A INPUT -p tcp --dport 80 -m limit --limit 25/minute -j ACCEPT
```

**Enrichment worker crashing?**
```bash
# Increase memory if needed
docker-compose -f docker-compose.enrich.yml down
# Edit docker-compose.enrich.yml: add memory: 1G
docker-compose -f docker-compose.enrich.yml up -d
```

---

## 🎯 Summary

**For Best Thesis Results:**
1. Use fake data for **demo/testing** (done! ✅)
2. Deploy to **DigitalOcean for 48h** ($0.40 cost)
3. Collect **200-500 real attacks**
4. Analyze both datasets
5. Compare in thesis: "Simulated vs Real-World Attack Patterns"

This gives you the BEST of both worlds! 🚀
