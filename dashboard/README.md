# Honeypot Analytics Dashboard

A beautiful web-based dashboard for visualizing honeypot attack data in real-time.

## Features

- 📊 **Interactive Charts** - Plotly.js-powered visualizations
- 🌐 **Geographic Analysis** - See attacks by country
- ⏰ **Temporal Analysis** - Daily trends and hourly heatmaps
- 🎯 **Attack Patterns** - Visualize attack types and methods
- 📋 **Real-time Tables** - Top IPs, paths, and recent events
- 🔄 **Auto-refresh** - Updates every 30 seconds
- 🌙 **Dark Theme** - Professional cybersecurity aesthetic

## Quick Start

### 1. Install Dependencies

```powershell
cd dashboard
py -m pip install -r requirements.txt
```

### 2. Run the Dashboard

```powershell
py app.py
```

### 3. Access the Dashboard

Open your browser and go to:
```
http://localhost:5000
```

## Dashboard Sections

### Summary Cards
- **Total Events** - Total number of attacks detected
- **Unique Attackers** - Number of unique IP addresses
- **Countries** - Number of countries attacks originated from
- **Attack Types** - Number of different attack patterns

### Charts
1. **Daily Attack Trends** - Line chart showing attacks over time
2. **Hourly Distribution** - Bar chart showing peak attack hours
3. **Top Attack Sources** - Pie chart of countries
4. **Attack Type Distribution** - Bar chart of attack patterns

### Tables
- **Top Attacking IPs** - Most active attackers
- **Most Targeted Paths** - Which honeypot endpoints are hit most
- **Recent Events** - Last 20 attack attempts with full details

## Integration with Analysis Pipeline

The dashboard automatically reads from:
- `analysis/out/results.db` - SQLite database with all metrics

To update the dashboard with new data:

```powershell
# Run full analysis pipeline
.\run-analysis.ps1

# Dashboard will automatically show updated data
```

## API Endpoints

The dashboard exposes REST APIs:

- `GET /api/summary` - Summary statistics
- `GET /api/countries` - Country distribution
- `GET /api/tags` - Attack tags
- `GET /api/hourly` - Hourly distribution
- `GET /api/daily` - Daily trends
- `GET /api/top-ips` - Top attacking IPs
- `GET /api/top-paths` - Most targeted paths
- `GET /api/recent-events` - Recent attack events

## Customization

### Change Port

Edit `app.py`:
```python
app.run(host='0.0.0.0', port=5000, debug=True)  # Change port here
```

### Auto-refresh Interval

Edit `dashboard.html`:
```javascript
setInterval(() => {
    loadData();
}, 30000);  // Change interval (milliseconds)
```

## Production Deployment

For production, use a proper WSGI server:

```powershell
py -m pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

Or with Docker:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

## Security Notes

⚠️ **Important for Production:**

1. **Add Authentication** - The dashboard has no auth by default
2. **HTTPS** - Use SSL/TLS in production
3. **Firewall** - Restrict access to trusted IPs
4. **Read-only Database** - Dashboard only reads from DB

## Troubleshooting

**Database not found:**
```powershell
# Make sure you ran the analysis first
.\run-analysis.ps1
```

**Port already in use:**
```powershell
# Change port in app.py or kill the process using port 5000
netstat -ano | findstr :5000
```

**Charts not loading:**
- Check browser console for errors
- Ensure database has data
- Verify API endpoints return JSON

## Screenshots

The dashboard features:
- Dark cybersecurity-themed UI
- Responsive design (works on mobile)
- Interactive Plotly charts (hover, zoom, pan)
- Auto-refreshing data
- Professional color scheme

## License

Part of the Honeypot Analytics project.
