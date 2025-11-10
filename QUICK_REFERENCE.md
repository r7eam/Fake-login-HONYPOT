# 📋 QUICK REFERENCE CARD

## 🚀 One-Command Actions

### Start Flask Dashboard
```powershell
cd dashboard; py app.py
```
**Access:** http://localhost:5000

### Start Jupyter Notebook
```powershell
cd analysis; jupyter notebook
```
**Access:** http://localhost:8888

### Run Full Analysis
```powershell
.\run-analysis.ps1; py analysis\export_to_db.py
```
**Output:** analysis/out/ (CSV, PNG, JSON, DB)

### Deploy Full Stack
```powershell
docker-compose -f docker-compose.fullstack.yml up -d
```
**Services:** honeypot, backend, frontend, nginx, postgres, enrichment, alerts

### Check Alerts
```powershell
docker logs -f fullcraft_alerts
```
**Shows:** Real-time Slack alert monitoring

### Query Database
```powershell
py analysis\query_db.py
```
**Shows:** Summary, countries, tags, paths

---

## 📊 Three Analysis Methods

| Method | Port | Best For | Command |
|--------|------|----------|---------|
| Flask Dashboard | 5000 | Monitoring, presentations | `cd dashboard; py app.py` |
| Jupyter Notebook | 8888 | Research, thesis charts | `cd analysis; jupyter notebook` |
| SQLite Database | N/A | Custom queries, integration | `py analysis\query_db.py` |

---

## 🎓 Thesis Workflow

1. **Collect Data:** Deploy honeypot → Wait for attacks
2. **Run Analysis:** `.\run-analysis.ps1; py analysis\export_to_db.py`
3. **Generate Charts:** Jupyter → Export PNGs
4. **Take Screenshots:** Flask dashboard
5. **Fill Template:** `analysis\RESULTS_TEMPLATE.md`
6. **Include in Thesis:** LaTeX/Word with images

---

## 🐳 Docker Commands

```powershell
# Start all services
docker-compose -f docker-compose.fullstack.yml up -d

# Check status
docker-compose -f docker-compose.fullstack.yml ps

# View logs
docker logs fullcraft_honeypot
docker logs fullcraft_enrichment
docker logs fullcraft_alerts

# Stop all
docker-compose -f docker-compose.fullstack.yml down

# Restart alerts (after config change)
docker-compose -f docker-compose.fullstack.yml restart alerts
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `analysis/honeypot_analysis.ipynb` | Jupyter notebook (9 sections) |
| `dashboard/app.py` | Flask web server |
| `alerts/alert_runner.py` | Real-time Slack monitor |
| `analysis/out/results.db` | SQLite database (13 tables) |
| `run-analysis.ps1` | One-click automation |
| `docker-compose.fullstack.yml` | Full deployment |

---

## 🔧 Configuration

### Slack Webhook
```yaml
# Edit docker-compose.fullstack.yml
SLACK_WEBHOOK_URL: "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

### Alert Threshold
```yaml
# Edit docker-compose.fullstack.yml
BRUTE_FORCE_THRESHOLD: "10"      # Attempts
ALERT_WINDOW_MINUTES: "10"       # Time window
```

### Dashboard Port
```python
# Edit dashboard/app.py
app.run(host='0.0.0.0', port=5000, debug=True)
```

---

## 📚 Documentation

- **Complete Overview:** `README.md`
- **Latest Phase:** `PHASE7_8_COMPLETE.md`
- **Full Details:** `COMPLETE_PROJECT_SUMMARY.md`
- **Jupyter Guide:** `analysis/JUPYTER_GUIDE.md`
- **Flask Guide:** `dashboard/README.md`
- **Docker Guide:** `INTEGRATION_GUIDE.md`
- **Thesis Template:** `analysis/RESULTS_TEMPLATE.md`

---

## ⚡ Keyboard Shortcuts (Jupyter)

- `Shift + Enter` — Run cell
- `Esc + A` — Insert cell above
- `Esc + B` — Insert cell below
- `Esc + D + D` — Delete cell
- `Esc + M` — Markdown mode
- `Esc + Y` — Code mode

---

## 🎯 Flask Dashboard URLs

**Local:**
- http://localhost:5000

**Network:**
- http://127.0.0.1:5000
- http://192.168.1.6:5000

**API Endpoints:**
- `/api/summary` — Overall stats
- `/api/countries` — Country distribution
- `/api/tags` — Attack tags
- `/api/hourly` — Hourly pattern
- `/api/daily` — Daily trends
- `/api/top-ips` — Top attackers
- `/api/top-paths` — Target paths
- `/api/recent-events` — Last 20 events

---

## 📊 SQLite Tables

1. `events` — Main attack dataset (18 columns)
2. `daily_attempts` — Attacks per day
3. `hourly_attempts` — Attacks per hour
4. `ip_attempts` — Top IPs
5. `country_attempts` — Top countries
6. `asn_attempts` — Top ASNs
7. `org_attempts` — Top organizations
8. `attack_tags` — Attack types
9. `attack_paths` — Target paths
10. `http_methods` — HTTP methods
11. `top_usernames` — Common usernames
12. `top_passwords` — Common passwords
13. `summary` — Overall statistics

---

## 🐛 Quick Fixes

**Dashboard: Database not found**
```powershell
py analysis\export_to_db.py
```

**Jupyter: Charts not showing**
```powershell
py -m pip install --upgrade plotly
# Restart Jupyter kernel
```

**Alerts: Not sending to Slack**
```powershell
# Check webhook URL is set
docker logs fullcraft_alerts
```

**Python: Command not found**
```powershell
# Use 'py' instead of 'python'
py --version
```

---

## ✅ Pre-Defense Checklist

- [ ] Run analysis with real attack data
- [ ] Export all charts from Jupyter
- [ ] Take Flask dashboard screenshots
- [ ] Fill RESULTS_TEMPLATE.md
- [ ] Test Flask dashboard demo
- [ ] Configure Slack alerts
- [ ] Review all documentation
- [ ] Prepare architecture diagram
- [ ] Test Docker deployment
- [ ] Practice presentation flow

---

**🎓 Ready for Thesis Defense!**

Print this card for quick reference during development and presentations.
