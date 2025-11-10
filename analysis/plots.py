#!/usr/bin/env python3
"""
analysis/plots.py

Generates publication-quality charts for thesis/research paper:
- Time series (attempts per day)
- Hour-of-day heatmap
- Top source IPs bar chart
- Tag distribution
- Country breakdown
- Attack type confidence scores

Saves PNG files to ./analysis/out/
"""

import csv
import os
import sys

try:
    import matplotlib
    matplotlib.use('Agg')  # Non-interactive backend
    import matplotlib.pyplot as plt
    import matplotlib.dates as mdates
    from datetime import datetime
except ImportError:
    print("❌ Error: matplotlib not installed")
    print("   Install: pip install matplotlib")
    sys.exit(1)

# Configuration
OUTDIR = "./analysis/out"
os.makedirs(OUTDIR, exist_ok=True)

# Styling
plt.style.use('seaborn-v0_8-darkgrid' if 'seaborn-v0_8-darkgrid' in plt.style.available else 'default')
COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c']

def read_counter_csv(path):
    """Read CSV with (key, count) rows"""
    out = []
    if not os.path.exists(path):
        print(f"⚠️  File not found: {path}")
        return []
    
    with open(path, newline="", encoding="utf-8") as f:
        r = csv.reader(f)
        header = next(r, None)
        for row in r:
            if len(row) >= 2:
                try:
                    out.append((row[0], int(row[1])))
                except ValueError:
                    continue
    return out

def bar_plot(pairs, title, outpng, top=20, rotate=False, color='#3498db', xlabel=None, ylabel="Count"):
    """Generate horizontal or vertical bar chart"""
    if not pairs:
        print(f"⚠️  No data for {title}")
        return
    
    pairs = pairs[:top]
    labels = [p[0] for p in pairs]
    vals = [p[1] for p in pairs]
    
    fig, ax = plt.subplots(figsize=(12, 6))
    ax.set_title(title, fontsize=14, fontweight='bold', pad=20)
    
    bars = ax.bar(range(len(vals)), vals, color=color, alpha=0.8, edgecolor='black', linewidth=0.5)
    
    ax.set_xticks(range(len(labels)))
    ax.set_xticklabels(labels, rotation=90 if rotate else 45, ha='right')
    ax.set_ylabel(ylabel, fontsize=11)
    if xlabel:
        ax.set_xlabel(xlabel, fontsize=11)
    
    ax.grid(axis='y', alpha=0.3, linestyle='--')
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    
    # Add value labels on bars
    for i, (bar, val) in enumerate(zip(bars, vals)):
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height,
                f'{val}', ha='center', va='bottom', fontsize=8)
    
    plt.tight_layout()
    plt.savefig(outpng, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"   ✅ {outpng}")

def time_series_plot(pairs, title, outpng):
    """Generate time series line chart"""
    if not pairs:
        print(f"⚠️  No data for {title}")
        return
    
    dates = [datetime.strptime(p[0], "%Y-%m-%d") for p in pairs]
    vals = [p[1] for p in pairs]
    
    fig, ax = plt.subplots(figsize=(14, 6))
    ax.set_title(title, fontsize=14, fontweight='bold', pad=20)
    
    ax.plot(dates, vals, color='#e74c3c', linewidth=2, marker='o', markersize=4, alpha=0.8)
    ax.fill_between(dates, vals, alpha=0.2, color='#e74c3c')
    
    ax.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
    ax.xaxis.set_major_locator(mdates.DayLocator(interval=max(1, len(dates)//20)))
    
    plt.xticks(rotation=45, ha='right')
    ax.set_ylabel("Attempts", fontsize=11)
    ax.set_xlabel("Date", fontsize=11)
    
    ax.grid(True, alpha=0.3, linestyle='--')
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    
    plt.tight_layout()
    plt.savefig(outpng, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"   ✅ {outpng}")

def heatmap_plot(pairs, title, outpng):
    """Generate hour-of-day heatmap"""
    if not pairs:
        print(f"⚠️  No data for {title}")
        return
    
    # Create 24-hour array
    hours = [0] * 24
    for hour_str, count in pairs:
        try:
            hour = int(hour_str)
            if 0 <= hour < 24:
                hours[hour] = count
        except ValueError:
            continue
    
    fig, ax = plt.subplots(figsize=(14, 4))
    ax.set_title(title, fontsize=14, fontweight='bold', pad=20)
    
    colors_gradient = plt.cm.Reds([(h / max(hours + [1])) for h in hours])
    bars = ax.bar(range(24), hours, color=colors_gradient, edgecolor='black', linewidth=0.5)
    
    ax.set_xticks(range(24))
    ax.set_xticklabels([f"{h:02d}:00" for h in range(24)], rotation=45, ha='right')
    ax.set_ylabel("Attempts", fontsize=11)
    ax.set_xlabel("Hour of Day (UTC)", fontsize=11)
    
    ax.grid(axis='y', alpha=0.3, linestyle='--')
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    
    # Add value labels
    for i, (bar, val) in enumerate(zip(bars, hours)):
        if val > 0:
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height,
                    f'{val}', ha='center', va='bottom', fontsize=8)
    
    plt.tight_layout()
    plt.savefig(outpng, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"   ✅ {outpng}")

def pie_chart(pairs, title, outpng, top=10):
    """Generate pie chart for distributions"""
    if not pairs:
        print(f"⚠️  No data for {title}")
        return
    
    pairs = pairs[:top]
    
    # Add "Others" category if more data exists
    total = sum(p[1] for p in pairs)
    
    labels = [p[0] for p in pairs]
    vals = [p[1] for p in pairs]
    
    fig, ax = plt.subplots(figsize=(10, 8))
    ax.set_title(title, fontsize=14, fontweight='bold', pad=20)
    
    colors_custom = COLORS[:len(vals)]
    
    wedges, texts, autotexts = ax.pie(
        vals, labels=labels, autopct='%1.1f%%',
        colors=colors_custom, startangle=90,
        textprops={'fontsize': 10}
    )
    
    # Make percentage text bold
    for autotext in autotexts:
        autotext.set_color('white')
        autotext.set_fontweight('bold')
    
    plt.tight_layout()
    plt.savefig(outpng, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"   ✅ {outpng}")

def main():
    print("📊 Generating charts...\n")
    
    # Check if metrics have been computed
    if not os.path.exists(f"{OUTDIR}/attempts_per_day.csv"):
        print("❌ Error: Metrics not computed yet!")
        print("   Run: python analysis/metrics.py")
        return
    
    # ========================================================================
    # TIME SERIES
    # ========================================================================
    print("📈 Time series plots...")
    
    time_series_plot(
        read_counter_csv(f"{OUTDIR}/attempts_per_day.csv"),
        "Honeypot Attempts Over Time",
        f"{OUTDIR}/timeseries_attempts.png"
    )
    
    # ========================================================================
    # HOUR HEATMAP
    # ========================================================================
    print("\n🔥 Hour-of-day heatmap...")
    
    heatmap_plot(
        read_counter_csv(f"{OUTDIR}/attempts_per_hour.csv"),
        "Attack Activity by Hour of Day",
        f"{OUTDIR}/heatmap_hourly.png"
    )
    
    # ========================================================================
    # TOP IPs
    # ========================================================================
    print("\n🌐 Top source IPs...")
    
    bar_plot(
        read_counter_csv(f"{OUTDIR}/attempts_per_ip.csv"),
        "Top 20 Source IP Addresses",
        f"{OUTDIR}/top_ips.png",
        top=20,
        rotate=True,
        color='#e74c3c',
        xlabel="IP Address"
    )
    
    # ========================================================================
    # ATTACK TAGS
    # ========================================================================
    print("\n🎯 Attack tags distribution...")
    
    bar_plot(
        read_counter_csv(f"{OUTDIR}/tags.csv"),
        "Attack Pattern Distribution",
        f"{OUTDIR}/tags_bar.png",
        top=15,
        rotate=True,
        color='#9b59b6',
        xlabel="Tag"
    )
    
    pie_chart(
        read_counter_csv(f"{OUTDIR}/tags.csv"),
        "Attack Types (Top 10)",
        f"{OUTDIR}/tags_pie.png",
        top=10
    )
    
    # ========================================================================
    # COUNTRIES
    # ========================================================================
    print("\n🌍 Geographic distribution...")
    
    bar_plot(
        read_counter_csv(f"{OUTDIR}/attempts_by_country.csv"),
        "Top 20 Source Countries",
        f"{OUTDIR}/countries.png",
        top=20,
        rotate=True,
        color='#2ecc71',
        xlabel="Country"
    )
    
    pie_chart(
        read_counter_csv(f"{OUTDIR}/attempts_by_country.csv"),
        "Top 10 Source Countries",
        f"{OUTDIR}/countries_pie.png",
        top=10
    )
    
    # ========================================================================
    # ORGANIZATIONS (ASN)
    # ========================================================================
    print("\n🏢 Top organizations (ASN)...")
    
    bar_plot(
        read_counter_csv(f"{OUTDIR}/attempts_by_org.csv"),
        "Top 15 Organizations (by ASN)",
        f"{OUTDIR}/top_orgs.png",
        top=15,
        rotate=True,
        color='#f39c12',
        xlabel="Organization"
    )
    
    # ========================================================================
    # HTTP METHODS
    # ========================================================================
    print("\n📡 HTTP methods...")
    
    bar_plot(
        read_counter_csv(f"{OUTDIR}/methods.csv"),
        "HTTP Methods Used",
        f"{OUTDIR}/methods.png",
        top=10,
        rotate=False,
        color='#1abc9c',
        xlabel="Method"
    )
    
    print("\n" + "="*70)
    print("✅ ALL CHARTS GENERATED!")
    print("="*70)
    print(f"\nSaved to {OUTDIR}/:")
    print("   📈 timeseries_attempts.png - Daily attempts over time")
    print("   🔥 heatmap_hourly.png - Hour-of-day activity")
    print("   🌐 top_ips.png - Top source IPs")
    print("   🎯 tags_bar.png, tags_pie.png - Attack patterns")
    print("   🌍 countries.png, countries_pie.png - Geographic distribution")
    print("   🏢 top_orgs.png - Top organizations")
    print("   📡 methods.png - HTTP methods")
    print(f"\n📝 Next step: Review analysis/RESULTS_TEMPLATE.md")

if __name__ == "__main__":
    main()
