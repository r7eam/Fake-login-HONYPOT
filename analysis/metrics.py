#!/usr/bin/env python3
"""
analysis/metrics.py

Computes key performance indicators (KPIs) from cleaned honeypot dataset:
- Unique IPs per day
- Attempts per IP
- Top usernames and passwords
- Tag distribution
- Country breakdown
- Temporal patterns

Outputs CSV files and JSON summary for reporting.
"""

import csv
import os
import json
import collections
import datetime

# Configuration
INCSV = "./analysis/out/events.csv"
OUTDIR = "./analysis/out"
SUMMARY_JSON = f"{OUTDIR}/summary.json"

os.makedirs(OUTDIR, exist_ok=True)

def read_rows():
    """Read cleaned events CSV"""
    with open(INCSV, newline="", encoding="utf-8") as f:
        r = csv.DictReader(f)
        return list(r)

def day(dts):
    """Extract date from ISO timestamp"""
    return dts.split("T")[0] if "T" in dts else dts

def hour(dts):
    """Extract hour from ISO timestamp"""
    try:
        return dts.split("T")[1].split(":")[0] if "T" in dts else "00"
    except:
        return "00"

def write_counter(name, counter):
    """Write Counter to CSV file"""
    path = f"{OUTDIR}/{name}.csv"
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow([name, "count"])
        for k, v in counter.most_common():
            w.writerow([k, v])
    print(f"   ✅ {path}")
    return path

def main():
    if not os.path.exists(INCSV):
        print(f"❌ Error: Dataset not found: {INCSV}")
        print(f"   Run: python analysis/prepare_dataset.py")
        return
    
    print(f"📖 Loading dataset from: {INCSV}")
    rows = read_rows()
    
    if not rows:
        print("❌ Error: No data to analyze!")
        return
    
    print(f"✅ Loaded {len(rows)} events\n")
    
    # ========================================================================
    # TEMPORAL METRICS
    # ========================================================================
    print("📅 Computing temporal metrics...")
    
    by_day = collections.Counter(day(r["received_at"]) for r in rows)
    by_hour = collections.Counter(hour(r["received_at"]) for r in rows)
    
    write_counter("attempts_per_day", by_day)
    write_counter("attempts_per_hour", by_hour)
    
    # ========================================================================
    # SOURCE METRICS
    # ========================================================================
    print("\n🌐 Computing source metrics...")
    
    by_ip = collections.Counter(r["src_ip"] for r in rows if r["src_ip"])
    by_country = collections.Counter(r["country"] for r in rows if r["country"])
    by_asn = collections.Counter(r["asn"] for r in rows if r["asn"])
    by_org = collections.Counter(r["org"] for r in rows if r["org"])
    
    write_counter("attempts_per_ip", by_ip)
    write_counter("attempts_by_country", by_country)
    write_counter("attempts_by_asn", by_asn)
    write_counter("attempts_by_org", by_org)
    
    # ========================================================================
    # ATTACK PATTERN METRICS
    # ========================================================================
    print("\n🎯 Computing attack pattern metrics...")
    
    by_tag = collections.Counter(
        t.strip() for r in rows 
        for t in (r["tags"].split(",") if r["tags"] else [])
        if t.strip()
    )
    
    by_path = collections.Counter(r["path"] for r in rows if r["path"])
    by_method = collections.Counter(r["method"] for r in rows if r["method"])
    
    write_counter("tags", by_tag)
    write_counter("paths", by_path)
    write_counter("methods", by_method)
    
    # ========================================================================
    # CREDENTIAL METRICS
    # ========================================================================
    print("\n🔐 Computing credential metrics...")
    
    by_username = collections.Counter(r["username_hash"] for r in rows if r["username_hash"])
    by_password = collections.Counter(r["password_hash"] for r in rows if r["password_hash"])
    
    write_counter("top_usernames", by_username)
    write_counter("top_passwords", by_password)
    
    # ========================================================================
    # USER AGENT METRICS
    # ========================================================================
    print("\n🤖 Computing user agent metrics...")
    
    by_ua = collections.Counter(r["ua"] for r in rows if r["ua"])
    
    write_counter("top_user_agents", by_ua)
    
    # ========================================================================
    # SUMMARY STATISTICS
    # ========================================================================
    print("\n" + "="*70)
    print("📊 SUMMARY STATISTICS")
    print("="*70)
    
    summary = {}
    
    # Temporal
    date_min = min(day(r["received_at"]) for r in rows)
    date_max = max(day(r["received_at"]) for r in rows)
    days_observed = len(by_day)
    
    print(f"\n📅 TEMPORAL:")
    print(f"   Total events: {len(rows)}")
    print(f"   Date range: {date_min} → {date_max}")
    print(f"   Days observed: {days_observed}")
    print(f"   Avg events/day: {len(rows) / max(days_observed, 1):.1f}")
    
    summary["total_events"] = len(rows)
    summary["date_range"] = {"start": date_min, "end": date_max}
    summary["days_observed"] = days_observed
    summary["avg_events_per_day"] = round(len(rows) / max(days_observed, 1), 2)
    
    # Sources
    unique_ips = len(by_ip)
    unique_countries = len(by_country)
    
    print(f"\n🌐 SOURCES:")
    print(f"   Unique IPs: {unique_ips}")
    print(f"   Unique countries: {unique_countries}")
    print(f"   Avg attempts/IP: {len(rows) / max(unique_ips, 1):.1f}")
    print(f"\n   Top 10 IPs:")
    for ip, count in by_ip.most_common(10):
        print(f"      {ip}: {count} attempts")
    
    summary["unique_ips"] = unique_ips
    summary["unique_countries"] = unique_countries
    summary["avg_attempts_per_ip"] = round(len(rows) / max(unique_ips, 1), 2)
    summary["top_ips"] = [{"ip": ip, "count": count} for ip, count in by_ip.most_common(10)]
    
    # Countries
    print(f"\n   Top 10 Countries:")
    for country, count in by_country.most_common(10):
        pct = (count / len(rows)) * 100
        print(f"      {country}: {count} attempts ({pct:.1f}%)")
    
    summary["top_countries"] = [
        {"country": c, "count": count, "percent": round((count/len(rows))*100, 2)}
        for c, count in by_country.most_common(10)
    ]
    
    # Attack patterns
    unique_tags = len(by_tag)
    
    print(f"\n🎯 ATTACK PATTERNS:")
    print(f"   Unique tags: {unique_tags}")
    print(f"\n   Top 10 Tags:")
    for tag, count in by_tag.most_common(10):
        pct = (count / sum(by_tag.values())) * 100
        print(f"      {tag}: {count} occurrences ({pct:.1f}%)")
    
    summary["unique_tags"] = unique_tags
    summary["top_tags"] = [
        {"tag": t, "count": count, "percent": round((count/sum(by_tag.values()))*100, 2)}
        for t, count in by_tag.most_common(10)
    ]
    
    # Methods & Paths
    print(f"\n   Top HTTP Methods:")
    for method, count in by_method.most_common(5):
        print(f"      {method}: {count}")
    
    print(f"\n   Top Paths:")
    for path, count in by_path.most_common(10):
        print(f"      {path}: {count}")
    
    summary["top_methods"] = [{"method": m, "count": c} for m, c in by_method.most_common(5)]
    summary["top_paths"] = [{"path": p, "count": c} for p, c in by_path.most_common(10)]
    
    # Credentials
    print(f"\n🔐 CREDENTIALS:")
    print(f"   Unique usernames: {len(by_username)}")
    print(f"   Unique passwords: {len(by_password)}")
    print(f"\n   Top 10 Usernames (hashed):")
    for username, count in by_username.most_common(10):
        print(f"      {username[:16]}...: {count}")
    
    summary["unique_usernames"] = len(by_username)
    summary["unique_passwords"] = len(by_password)
    summary["top_usernames"] = [
        {"hash": u[:16]+"...", "count": c} 
        for u, c in by_username.most_common(10)
    ]
    
    # Peak activity
    peak_day = by_day.most_common(1)[0] if by_day else ("", 0)
    peak_hour = by_hour.most_common(1)[0] if by_hour else ("", 0)
    
    print(f"\n⏰ PEAK ACTIVITY:")
    print(f"   Peak day: {peak_day[0]} ({peak_day[1]} events)")
    print(f"   Peak hour: {peak_hour[0]}:00 ({peak_hour[1]} events)")
    
    summary["peak_day"] = {"date": peak_day[0], "count": peak_day[1]}
    summary["peak_hour"] = {"hour": peak_hour[0], "count": peak_hour[1]}
    
    # ========================================================================
    # SAVE SUMMARY JSON
    # ========================================================================
    print(f"\n💾 Saving summary to: {SUMMARY_JSON}")
    
    with open(SUMMARY_JSON, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    
    print("\n" + "="*70)
    print("✅ METRICS COMPLETE!")
    print("="*70)
    print(f"\nGenerated files in {OUTDIR}/:")
    print("   - attempts_per_day.csv")
    print("   - attempts_per_hour.csv")
    print("   - attempts_per_ip.csv")
    print("   - attempts_by_country.csv")
    print("   - tags.csv")
    print("   - top_usernames.csv")
    print("   - top_passwords.csv")
    print("   - summary.json")
    print(f"\n📊 Next step: python analysis/plots.py")

if __name__ == "__main__":
    main()
