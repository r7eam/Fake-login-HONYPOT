import sqlite3
import json

print("\n" + "="*50)
print("  HONEYPOT DATABASE VERIFICATION")
print("="*50 + "\n")

db_path = "analysis/out/results.db"

try:
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    # Summary statistics
    print("📊 SUMMARY STATISTICS:")
    cur.execute("SELECT * FROM summary")
    row = cur.fetchone()
    if row:
        print(f"  Total Events: {row[1]}")
        print(f"  Unique IPs: {row[2]}")
        print(f"  Countries: {row[3]}")
        print(f"  Date Range: {row[4]} to {row[5]}")
    
    # Country distribution
    print("\n🌍 COUNTRY DISTRIBUTION:")
    cur.execute("SELECT country, count FROM country_attempts ORDER BY count DESC")
    for row in cur.fetchall():
        print(f"  {row[0]}: {row[1]} attacks")
    
    # Attack tags
    print("\n🎯 ATTACK PATTERNS:")
    cur.execute("SELECT tag, count FROM attack_tags ORDER BY count DESC")
    for row in cur.fetchall():
        print(f"  {row[0]}: {row[1]} occurrences")
    
    # Targeted paths
    print("\n📡 TARGETED ENDPOINTS:")
    cur.execute("SELECT path, count FROM attack_paths ORDER BY count DESC")
    for row in cur.fetchall():
        print(f"  {row[0]}: {row[1]} requests")
    
    # Sample events
    print("\n📝 SAMPLE ATTACK EVENTS:")
    cur.execute("SELECT timestamp, ip, geo_country, tags FROM events LIMIT 3")
    for i, row in enumerate(cur.fetchall(), 1):
        print(f"\n  Event {i}:")
        print(f"    Time: {row[0]}")
        print(f"    IP: {row[1]}")
        print(f"    Country: {row[2]}")
        print(f"    Tags: {row[3]}")
    
    # Database size
    import os
    size_kb = os.path.getsize(db_path) / 1024
    print(f"\n💾 Database Size: {size_kb:.2f} KB")
    
    # Table count
    cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cur.fetchall()
    print(f"📊 Total Tables: {len(tables)}")
    
    print("\n" + "="*50)
    print("  ✅ DATABASE VERIFICATION COMPLETE")
    print("="*50 + "\n")
    
    print("DASHBOARDS:")
    print("  Flask: http://localhost:5000")
    print("  Jupyter: http://localhost:8889")
    print("\nAll data is ready for visualization!")
    
    conn.close()
    
except Exception as e:
    print(f"❌ Error: {e}")
