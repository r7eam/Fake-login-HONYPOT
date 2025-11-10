# Phase 6 - Analytics & Reporting

Complete analytics pipeline for generating thesis-ready metrics and charts from honeypot data.

## Overview

This analytics pipeline processes enriched honeypot events and generates:
- **CSV/JSON metrics** for KPIs and statistical analysis
- **Publication-quality charts** (PNG) for thesis/research papers
- **Results template** ready to paste into your report

## Quick Start

```powershell
# 1. Install Python dependencies
pip install -r analysis/requirements.txt

# 2. Prepare dataset (clean & validate)
python analysis/prepare_dataset.py

# 3. Compute metrics & KPIs
python analysis/metrics.py

# 4. Generate charts
python analysis/plots.py

# 5. Fill in RESULTS_TEMPLATE.md with your numbers
```

## Pipeline Components

### 1. `prepare_dataset.py`
**Purpose:** Validate and clean enriched JSONL events into tidy CSV format

**Input:** `./data/honeypot_enriched.jsonl`  
**Output:** `./analysis/out/events.csv`

**What it does:**
- Validates ISO timestamps
- Normalizes tags and fields
- Filters out invalid/corrupt events
- Sorts by timestamp
- Exports flat CSV for easy analysis

**Usage:**
```powershell
python analysis/prepare_dataset.py
```

**Output:**
```
📖 Reading enriched events from: ./data/honeypot_enriched.jsonl
💾 Writing CSV to: ./analysis/out/events.csv
✅ Successfully processed 1523 events
⚠️  Skipped 3 invalid events

📊 DATASET SUMMARY:
   Total events: 1523
   Date range: 2025-01-15T10:23:45Z → 2025-02-10T18:42:11Z
   Unique IPs: 342
   Countries: 45
   Unique tags: 8
```

---

### 2. `metrics.py`
**Purpose:** Compute comprehensive KPIs and statistical metrics

**Input:** `./analysis/out/events.csv`  
**Outputs:**
- `attempts_per_day.csv` - Daily attack counts
- `attempts_per_hour.csv` - Hourly distribution
- `attempts_per_ip.csv` - Top attacking IPs
- `attempts_by_country.csv` - Geographic distribution
- `attempts_by_asn.csv` - Network/organization breakdown
- `attempts_by_org.csv` - ISP/hosting provider breakdown
- `tags.csv` - Attack pattern distribution
- `paths.csv` - Targeted endpoints
- `methods.csv` - HTTP method usage
- `top_usernames.csv` - Most attempted usernames (hashed)
- `top_passwords.csv` - Most attempted passwords (hashed)
- `top_user_agents.csv` - User agent strings
- `summary.json` - Complete summary in JSON format

**Usage:**
```powershell
python analysis/metrics.py
```

**Output:**
```
📊 SUMMARY STATISTICS
====================================

📅 TEMPORAL:
   Total events: 1523
   Date range: 2025-01-15 → 2025-02-10
   Days observed: 27
   Avg events/day: 56.4

🌐 SOURCES:
   Unique IPs: 342
   Unique countries: 45
   Avg attempts/IP: 4.5

   Top 10 IPs:
      203.0.113.15: 87 attempts
      198.51.100.42: 64 attempts
      ...

🎯 ATTACK PATTERNS:
   Unique tags: 8

   Top 10 Tags:
      brute_force: 892 occurrences (58.5%)
      scanner: 421 occurrences (27.6%)
      ...
```

---

### 3. `plots.py`
**Purpose:** Generate publication-quality charts for thesis

**Input:** CSV files from `metrics.py`  
**Outputs:** PNG charts in `./analysis/out/`

**Charts Generated:**

1. **`timeseries_attempts.png`**
   - Daily attack attempts over time
   - Line chart with trend visualization

2. **`heatmap_hourly.png`**
   - Hour-of-day activity heatmap
   - Identifies peak attack hours

3. **`top_ips.png`**
   - Top 20 source IP addresses
   - Horizontal bar chart

4. **`tags_bar.png` & `tags_pie.png`**
   - Attack type distribution
   - Bar chart and pie chart views

5. **`countries.png` & `countries_pie.png`**
   - Geographic attack distribution
   - Shows top attacking countries

6. **`top_orgs.png`**
   - Top organizations/ISPs (by ASN)
   - Identifies hosting providers, cloud services

7. **`methods.png`**
   - HTTP method distribution
   - Shows POST vs GET vs others

**Usage:**
```powershell
python analysis/plots.py
```

**Output:**
```
📊 Generating charts...

📈 Time series plots...
   ✅ ./analysis/out/timeseries_attempts.png

🔥 Hour-of-day heatmap...
   ✅ ./analysis/out/heatmap_hourly.png

🌐 Top source IPs...
   ✅ ./analysis/out/top_ips.png

🎯 Attack tags distribution...
   ✅ ./analysis/out/tags_bar.png
   ✅ ./analysis/out/tags_pie.png

✅ ALL CHARTS GENERATED!
```

---

## Output Structure

After running the pipeline:

```
analysis/
├── prepare_dataset.py
├── metrics.py
├── plots.py
├── requirements.txt
├── RESULTS_TEMPLATE.md
└── out/
    ├── events.csv               # Clean dataset
    ├── summary.json             # JSON summary
    │
    ├── # Metric CSVs
    ├── attempts_per_day.csv
    ├── attempts_per_hour.csv
    ├── attempts_per_ip.csv
    ├── attempts_by_country.csv
    ├── tags.csv
    ├── top_usernames.csv
    ├── top_passwords.csv
    │
    └── # Charts (PNG)
        ├── timeseries_attempts.png
        ├── heatmap_hourly.png
        ├── top_ips.png
        ├── tags_bar.png
        ├── tags_pie.png
        ├── countries.png
        ├── countries_pie.png
        ├── top_orgs.png
        └── methods.png
```

---

## Using in Your Thesis

### Step 1: Run Full Pipeline

```powershell
# Run all analysis steps
python analysis/prepare_dataset.py
python analysis/metrics.py
python analysis/plots.py
```

### Step 2: Review Summary

Check `analysis/out/summary.json` for all key metrics:

```json
{
  "total_events": 1523,
  "unique_ips": 342,
  "unique_countries": 45,
  "top_ips": [
    {"ip": "203.0.113.15", "count": 87},
    ...
  ],
  "top_countries": [
    {"country": "CN", "count": 423, "percent": 27.8},
    ...
  ],
  ...
}
```

### Step 3: Insert Charts

Copy PNG files from `analysis/out/` into your thesis document:

```latex
\begin{figure}[h]
\centering
\includegraphics[width=0.8\textwidth]{analysis/out/timeseries_attempts.png}
\caption{Daily attack attempts over 27-day observation period}
\label{fig:timeseries}
\end{figure}
```

### Step 4: Fill Results Template

Use `RESULTS_TEMPLATE.md` and replace placeholders with your actual numbers:

```markdown
## Executive Summary

This honeypot deployment captured **1,523** attack attempts over **27** days 
from **342** unique source IP addresses across **45** countries.
```

---

## Customization

### Change Input File

```powershell
# Use different enriched file
$env:ENRICHED = "./data/honeypot_enriched_production.jsonl"
python analysis/prepare_dataset.py
```

### Adjust Chart Styling

Edit `plots.py`:

```python
# Change colors
COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6']

# Change DPI for higher quality
plt.savefig(outpng, dpi=600, bbox_inches='tight')  # 600 DPI for print

# Change figure size
fig, ax = plt.subplots(figsize=(16, 8))  # Wider charts
```

### Add Custom Metrics

Edit `metrics.py` to add your own analysis:

```python
# Example: Analyze password length distribution
password_lengths = collections.Counter(
    len(r["password_hash"]) for r in rows 
    if r["password_hash"]
)
write_counter("password_lengths", password_lengths)
```

---

## Troubleshooting

### No enriched events found

```
❌ Error: Input file not found: ./data/honeypot_enriched.jsonl
```

**Solution:** Run enrichment first:
```powershell
python enrich/worker.py
```

### Matplotlib not installed

```
❌ Error: matplotlib not installed
```

**Solution:** Install dependencies:
```powershell
pip install -r analysis/requirements.txt
```

### Invalid timestamps

```
⚠️  Line 42: Invalid timestamp: 2025-13-45T99:99:99Z
```

**Solution:** Check enrichment worker - it should produce valid ISO 8601 timestamps

### Empty charts

```
⚠️  No data for Top source IPs
```

**Solution:** Run `metrics.py` first to generate CSV files

---

## Advanced Usage

### Export to Excel

```powershell
# Install pandas
pip install pandas openpyxl

# Convert CSV to Excel
python -c "import pandas as pd; pd.read_csv('analysis/out/events.csv').to_excel('analysis/out/events.xlsx', index=False)"
```

### Filter by Date Range

```python
# Edit prepare_dataset.py
from datetime import datetime

START_DATE = datetime(2025, 1, 20)
END_DATE = datetime(2025, 2, 5)

# Filter in to_row() function
dt = iso(ev["received_at"])
if dt and START_DATE <= dt <= END_DATE:
    rows.append(to_row(ev))
```

### Statistical Analysis

```python
import pandas as pd
import numpy as np

df = pd.read_csv('analysis/out/events.csv')

# Descriptive statistics
print(df['country'].value_counts())
print(df.groupby('country')['src_ip'].nunique())

# Correlation analysis
df['hour'] = pd.to_datetime(df['received_at']).dt.hour
hourly_correlation = df.groupby('hour').size()
```

---

## For Your Thesis

This analytics pipeline provides everything you need for the **Results** section of your thesis:

✅ **Quantitative Metrics:** Total events, unique IPs, geographic distribution  
✅ **Temporal Analysis:** Daily trends, hour-of-day patterns  
✅ **Attack Classification:** Tag distribution, confidence scores  
✅ **Threat Intelligence:** ASN/organization analysis, GeoIP enrichment  
✅ **Professional Charts:** Publication-ready PNG figures  
✅ **Reproducible:** Fully automated pipeline

Simply run the three Python scripts and fill in the template with your actual numbers!

---

**Next Steps:**
1. Run the pipeline on your enriched data
2. Review `summary.json` for all metrics
3. Copy charts to your thesis document
4. Fill in `RESULTS_TEMPLATE.md`
5. Analyze and interpret the findings!
