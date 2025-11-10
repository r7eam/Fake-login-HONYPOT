#!/usr/bin/env python3
"""Quick database query tool for testing."""
import sqlite3

conn = sqlite3.connect('analysis/out/results.db')
cursor = conn.cursor()

print("\n" + "="*70)
print("TABLES IN DATABASE")
print("="*70)
for row in cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"):
    print(f"  ✅ {row[0]}")

print("\n" + "="*70)
print("SUMMARY STATISTICS")
print("="*70)
summary = cursor.execute("SELECT * FROM summary").fetchone()
if summary:
    print(f"  Total Events: {summary[1]}")
    print(f"  Date Range: {summary[2]} to {summary[3]}")
    print(f"  Unique Countries: {summary[7]}")
    print(f"  Unique Tags: {summary[9]}")
    print(f"  Peak Day: {summary[12]} ({summary[13]} events)")

print("\n" + "="*70)
print("TOP 5 COUNTRIES")
print("="*70)
for row in cursor.execute("SELECT country, count FROM country_attempts ORDER BY count DESC LIMIT 5"):
    print(f"  🌍 {row[0]}: {row[1]} attempts")

print("\n" + "="*70)
print("ATTACK TAGS")
print("="*70)
for row in cursor.execute("SELECT tag, count FROM attack_tags ORDER BY count DESC"):
    print(f"  🎯 {row[0]}: {row[1]} occurrences")

print("\n" + "="*70)
print("ATTACK PATHS")
print("="*70)
for row in cursor.execute("SELECT path, count FROM attack_paths ORDER BY count DESC"):
    print(f"  📡 {row[0]}: {row[1]} requests")

print()
conn.close()
