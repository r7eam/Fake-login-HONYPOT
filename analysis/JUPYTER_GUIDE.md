# 📊 Jupyter Notebook Analysis Guide

## Phase 7 — Interactive Dashboard with Jupyter

This notebook provides **interactive visualizations** for honeypot attack analysis, complementing the Flask web dashboard with deeper analytical capabilities.

---

## 🚀 Quick Start

### 1. Install Jupyter Dependencies

```powershell
# Install Jupyter and required libraries
py -m pip install jupyter plotly pandas numpy seaborn

# Or install all at once
py -m pip install jupyter plotly pandas numpy seaborn matplotlib
```

### 2. Launch Jupyter Notebook

```powershell
cd analysis
jupyter notebook
```

This will open your browser at `http://localhost:8888`

### 3. Open the Analysis Notebook

Click on `honeypot_analysis.ipynb` to start analyzing!

---

## 📚 Notebook Sections

### 1️⃣ Import Libraries
- Loads pandas, plotly, matplotlib, seaborn
- Configures display settings
- Checks library versions

### 2️⃣ Load Data
- Connects to SQLite database (`out/results.db`)
- Loads all attack events
- Displays summary statistics

### 3️⃣ Top Attacking IPs
- **Interactive bar chart** showing most aggressive IPs
- Includes country, organization, and attempt counts
- Hover for detailed information

### 4️⃣ Attack Patterns Over Time
- **Daily trend line chart** with fill
- **Hourly distribution bar chart**
- Identifies peak attack times

### 5️⃣ Credential Analysis
- Top attempted usernames
- Top password patterns (hashed)
- Side-by-side comparison charts

### 6️⃣ Geographic Distribution
- **World choropleth map** showing attack intensity
- **Pie chart** for country distribution
- Interactive hover to see details

### 7️⃣ Threat Detection (Phase 8)
- Detects high-frequency attacks (≥10 attempts in 5 minutes)
- Flags suspicious IPs
- Generates threat summary table

### 8️⃣ Alert Generation (Phase 8)
- Creates Slack webhook payloads
- Exports alerts as JSON files
- Ready to send to Slack/email systems

### 9️⃣ Summary Dashboard
- Complete statistics overview
- ASCII visualization
- Data quality metrics

---

## 🎨 Features

### Interactive Plotly Charts
- **Zoom, pan, hover** for detailed exploration
- **Dark theme** for professional presentation
- **Responsive** design works on any screen size

### Real-Time Analysis
- Run cells individually to explore data
- Modify queries and parameters on-the-fly
- Export charts as PNG/SVG for thesis

### Export Capabilities
```python
# Save any chart as static image
fig.write_image("my_chart.png", width=1200, height=800, scale=2)

# Export DataFrame to CSV
df_threats.to_csv("threats_export.csv", index=False)

# Generate PDF report
# (requires additional library: pip install nbconvert)
```

---

## 🔄 Comparison: Jupyter vs Flask Dashboard

| Feature | Jupyter Notebook | Flask Dashboard |
|---------|-----------------|-----------------|
| **Purpose** | Deep analysis, exploration | Quick overview, monitoring |
| **Interactivity** | Full Python access | Limited to UI |
| **Customization** | Infinite (edit code) | Fixed views |
| **Real-time** | Manual refresh | Auto-refresh (30s) |
| **Best For** | Research, thesis writing | Presentations, demos |
| **Export** | PNG, SVG, PDF | Screenshots only |

**Recommendation:** Use **both**!
- Jupyter for detailed analysis and thesis charts
- Flask dashboard for live monitoring and presentations

---

## 📊 Advanced Usage

### Custom Analysis Example

```python
# Add a new cell to analyze attack tags
tag_analysis = df_events['tags'].value_counts()

fig = px.treemap(
    tag_analysis.reset_index(),
    path=['index'],
    values='tags',
    title='Attack Tag Distribution (Treemap)'
)
fig.show()
```

### Filter by Country

```python
# Analyze only attacks from specific country
iraq_attacks = df_events[df_events['geo_country'] == 'Iraq']

print(f"Attacks from Iraq: {len(iraq_attacks)}")
print(f"Top IPs: {iraq_attacks['ip'].value_counts().head()}")
```

### Time Series Analysis

```python
# Resample to hourly frequency
hourly_series = df_events.set_index('timestamp').resample('H').size()

# Plot with matplotlib
plt.figure(figsize=(15, 5))
plt.plot(hourly_series.index, hourly_series.values, linewidth=2)
plt.title('Hourly Attack Frequency')
plt.xlabel('Time')
plt.ylabel('Attacks')
plt.grid(True, alpha=0.3)
plt.show()
```

---

## 🎓 For Your Thesis

### Taking Screenshots

1. **Run all cells** (Cell → Run All)
2. **For each chart:**
   - Right-click → "Save as PNG"
   - Or use camera icon (top-right of Plotly chart)
3. **Save to thesis images folder**

### Exporting Notebook as PDF

```powershell
# Install nbconvert
py -m pip install nbconvert

# Convert to PDF (requires LaTeX)
jupyter nbconvert --to pdf honeypot_analysis.ipynb

# Or convert to HTML first
jupyter nbconvert --to html honeypot_analysis.ipynb
# Then print to PDF from browser
```

### Including in Thesis

**LaTeX Example:**
```latex
\begin{figure}[h]
\centering
\includegraphics[width=0.9\textwidth]{images/jupyter_geo_map.png}
\caption{Geographic distribution of honeypot attacks (interactive analysis)}
\label{fig:geo_distribution}
\end{figure}
```

**Word/DOCX:**
- Simply drag-and-drop PNG files
- Add captions: "Figure X: ... (Source: Jupyter analysis)"

---

## 🔧 Troubleshooting

### Issue: Jupyter won't start
```powershell
# Reinstall Jupyter
py -m pip install --upgrade jupyter

# Or use JupyterLab (modern interface)
py -m pip install jupyterlab
jupyter lab
```

### Issue: Plotly charts not showing
```powershell
# Install Plotly extension
py -m pip install --upgrade plotly

# Restart Jupyter kernel
# (Kernel → Restart in menu)
```

### Issue: Database not found
```powershell
# Make sure you're in analysis/ directory
cd analysis

# Verify database exists
ls out/results.db

# If missing, run export script
py export_to_db.py
```

### Issue: Out of memory with large datasets
```python
# Load data in chunks
chunks = []
for chunk in pd.read_sql_query("SELECT * FROM events", conn, chunksize=1000):
    # Process each chunk
    chunks.append(chunk)

df_events = pd.concat(chunks)
```

---

## 🌟 Tips & Tricks

### 1. Dark Theme for Screenshots
Already configured! All Plotly charts use `template='plotly_dark'`

### 2. High-Resolution Exports
```python
# 4K resolution for publications
fig.write_image("chart.png", width=3840, height=2160)

# 300 DPI for print
fig.write_image("chart.png", scale=3)
```

### 3. Keyboard Shortcuts
- `Shift + Enter`: Run current cell
- `Esc + A`: Insert cell above
- `Esc + B`: Insert cell below
- `Esc + D + D`: Delete cell
- `Esc + M`: Convert to Markdown
- `Esc + Y`: Convert to Code

### 4. Magic Commands
```python
# Time execution
%time df_events.groupby('ip').size()

# Load external Python file
%load metrics.py

# List all variables
%whos

# Display matplotlib inline
%matplotlib inline
```

---

## 📧 Phase 8 — Alert Integration

The notebook generates **Slack webhook payloads** compatible with the alert system:

### Workflow

1. **Jupyter detects threats** → Generates JSON payloads
2. **Saves to `out/alert_*.json`**
3. **Send to Slack:**
   ```bash
   curl -X POST -H 'Content-Type: application/json' \
        -d @out/alert_<IP>_<timestamp>.json \
        https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   ```

### Real-Time Alerting

For continuous monitoring, use the **alert_runner.py** service:

```powershell
# Set Slack webhook (optional)
$env:SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Run alert monitor
py ../alerts/alert_runner.py
```

This watches `honeypot_enriched.jsonl` in real-time and auto-sends alerts!

---

## 🎯 Next Steps

1. ✅ **Explore the notebook** - Run all cells, see interactive charts
2. ✅ **Customize analysis** - Add your own queries and visualizations
3. ✅ **Export charts** - Save high-res images for thesis
4. ✅ **Compare with Flask dashboard** - See which tool fits each use case
5. ✅ **Set up real-time alerts** - Configure Slack webhook for notifications

---

## 📚 Additional Resources

- **Plotly Documentation:** https://plotly.com/python/
- **Pandas Cheat Sheet:** https://pandas.pydata.org/docs/user_guide/
- **Jupyter Tips:** https://jupyter-notebook.readthedocs.io/
- **SQLite Queries:** https://www.sqlitetutorial.net/

---

**Happy Analyzing! 🎉**

For questions or issues, refer to the main project documentation in `COMPLETE_PROJECT_SUMMARY.md`.
