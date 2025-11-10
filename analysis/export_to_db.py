#!/usr/bin/env python3
"""
Export analysis results to SQLite database.

This script reads all the CSV files and JSON summary from analysis/out/
and stores them in a SQLite database for easy querying and integration.

Usage:
    python analysis/export_to_db.py [--db DATABASE_PATH]

Output:
    analysis/out/results.db (SQLite database)
"""

import sqlite3
import json
import csv
import os
import sys
from pathlib import Path
from datetime import datetime

# Paths
OUT_DIR = Path("./analysis/out")
DEFAULT_DB_PATH = OUT_DIR / "results.db"


def create_database(db_path: Path):
    """Create SQLite database with schema for all analysis results."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Enable foreign keys
    cursor.execute("PRAGMA foreign_keys = ON;")
    
    # ============================================================================
    # Table: events (cleaned dataset from events.csv)
    # ============================================================================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            received_at TEXT NOT NULL,
            ip TEXT NOT NULL,
            username TEXT,
            password TEXT,
            password_hash TEXT,
            path TEXT,
            method TEXT,
            user_agent TEXT,
            geo_country TEXT,
            geo_city TEXT,
            geo_lat REAL,
            geo_lon REAL,
            asn_number TEXT,
            asn_org TEXT,
            rdns TEXT,
            tags TEXT,
            confidence_geo REAL,
            confidence_asn REAL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    # Indexes for common queries
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_ip ON events(ip);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_country ON events(geo_country);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_tags ON events(tags);")
    
    # ============================================================================
    # Table: daily_attempts (from attempts_per_day.csv)
    # ============================================================================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS daily_attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT UNIQUE NOT NULL,
            count INTEGER NOT NULL
        );
    """)
    
    # ============================================================================
    # Table: hourly_attempts (from attempts_per_hour.csv)
    # ============================================================================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS hourly_attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hour TEXT NOT NULL,
            count INTEGER NOT NULL
        );
    """)
    
    # ============================================================================
    # Table: ip_attempts (from attempts_per_ip.csv)
    # ============================================================================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ip_attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip TEXT UNIQUE NOT NULL,
            count INTEGER NOT NULL
        );
    """)
    
    # ============================================================================
    # Table: country_attempts (from attempts_by_country.csv)
    # ============================================================================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS country_attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            country TEXT UNIQUE NOT NULL,
            count INTEGER NOT NULL
        );
    """)
    
    # ============================================================================
    # Table: asn_attempts (from attempts_by_asn.csv)
    # ============================================================================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS asn_attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            asn TEXT UNIQUE NOT NULL,
            count INTEGER NOT NULL
        );
    """)
    
    # ============================================================================
    # Table: org_attempts (from attempts_by_org.csv)
    # ============================================================================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS org_attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            organization TEXT UNIQUE NOT NULL,
            count INTEGER NOT NULL
        );
    """)
    
    # ============================================================================
    # Table: attack_tags (from tags.csv)
    # ============================================================================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS attack_tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tag TEXT UNIQUE NOT NULL,
            count INTEGER NOT NULL
        );
    """)
    
    # ============================================================================
    # Table: attack_paths (from paths.csv)
    # ============================================================================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS attack_paths (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            path TEXT UNIQUE NOT NULL,
            count INTEGER NOT NULL
        );
    """)
    
    # ============================================================================
    # Table: http_methods (from methods.csv)
    # ============================================================================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS http_methods (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            method TEXT UNIQUE NOT NULL,
            count INTEGER NOT NULL
        );
    """)
    
    # ============================================================================
    # Table: top_usernames (from top_usernames.csv)
    # ============================================================================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS top_usernames (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username_hash TEXT UNIQUE NOT NULL,
            count INTEGER NOT NULL
        );
    """)
    
    # ============================================================================
    # Table: top_passwords (from top_passwords.csv)
    # ============================================================================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS top_passwords (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            password_hash TEXT UNIQUE NOT NULL,
            count INTEGER NOT NULL
        );
    """)
    
    # ============================================================================
    # Table: user_agents (from top_user_agents.csv)
    # ============================================================================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_agents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_agent TEXT UNIQUE NOT NULL,
            count INTEGER NOT NULL
        );
    """)
    
    # ============================================================================
    # Table: summary (from summary.json)
    # ============================================================================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS summary (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            total_events INTEGER,
            date_start TEXT,
            date_end TEXT,
            days_observed INTEGER,
            avg_events_per_day REAL,
            unique_ips INTEGER,
            unique_countries INTEGER,
            avg_attempts_per_ip REAL,
            unique_tags INTEGER,
            unique_usernames INTEGER,
            unique_passwords INTEGER,
            peak_day TEXT,
            peak_day_count INTEGER,
            peak_hour TEXT,
            peak_hour_count INTEGER,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    conn.commit()
    return conn


def import_csv_to_table(conn, csv_path: Path, table_name: str, columns: list):
    """Import CSV file into SQLite table."""
    if not csv_path.exists():
        print(f"⚠️  Skipping {csv_path.name} - file not found")
        return 0
    
    cursor = conn.cursor()
    
    # Clear existing data
    cursor.execute(f"DELETE FROM {table_name};")
    
    # Read and import CSV
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        
        if not rows:
            return 0
        
        # Build INSERT OR REPLACE statement to handle duplicates
        placeholders = ', '.join(['?' for _ in columns])
        insert_sql = f"INSERT OR REPLACE INTO {table_name} ({', '.join(columns)}) VALUES ({placeholders});"
        
        # Insert rows
        for row in rows:
            values = [row.get(col, '') for col in columns]
            cursor.execute(insert_sql, values)
    
    conn.commit()
    return len(rows)


def import_events(conn):
    """Import main events dataset."""
    csv_path = OUT_DIR / "events.csv"
    
    if not csv_path.exists():
        print(f"⚠️  Skipping events.csv - file not found")
        print(f"   ✅ Imported 0 events")
        return
    
    cursor = conn.cursor()
    cursor.execute("DELETE FROM events;")
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        
        for row in rows:
            cursor.execute("""
                INSERT INTO events (
                    timestamp, received_at, ip, username, password, password_hash,
                    path, method, user_agent, geo_country, geo_city,
                    geo_lat, geo_lon, asn_number, asn_org, rdns,
                    tags, confidence_geo, confidence_asn
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                row.get('received_at', ''),
                row.get('received_at', ''),
                row.get('src_ip', ''),
                row.get('username', ''),
                row.get('password', ''),  # Actual password
                row.get('password_hash', ''),
                row.get('path', ''),
                row.get('method', ''),
                row.get('ua', ''),
                row.get('country', ''),
                row.get('city', ''),
                row.get('latitude', ''),
                row.get('longitude', ''),
                row.get('asn', ''),
                row.get('org', ''),
                row.get('rdns', ''),
                row.get('tags', ''),
                row.get('confidence_bruteforce', 0.0),
                row.get('confidence_sqli', 0.0)
            ))
    
    conn.commit()
    count = len(rows)
    print(f"   ✅ Imported {count} events")


def import_summary(conn):
    """Import summary statistics from JSON."""
    json_path = OUT_DIR / "summary.json"
    
    if not json_path.exists():
        print(f"⚠️  Skipping summary.json - file not found")
        return
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    cursor = conn.cursor()
    
    # Clear existing summary
    cursor.execute("DELETE FROM summary;")
    
    # Insert summary
    cursor.execute("""
        INSERT INTO summary (
            total_events, date_start, date_end, days_observed,
            avg_events_per_day, unique_ips, unique_countries,
            avg_attempts_per_ip, unique_tags, unique_usernames,
            unique_passwords, peak_day, peak_day_count,
            peak_hour, peak_hour_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        data.get('total_events'),
        data.get('date_range', {}).get('start'),
        data.get('date_range', {}).get('end'),
        data.get('days_observed'),
        data.get('avg_events_per_day'),
        data.get('unique_ips'),
        data.get('unique_countries'),
        data.get('avg_attempts_per_ip'),
        data.get('unique_tags'),
        data.get('unique_usernames'),
        data.get('unique_passwords'),
        data.get('peak_day', {}).get('date'),
        data.get('peak_day', {}).get('count'),
        data.get('peak_hour', {}).get('hour'),
        data.get('peak_hour', {}).get('count')
    ))
    
    conn.commit()
    print(f"   ✅ Imported summary statistics")


def main():
    """Main export function."""
    print("📊 Exporting analysis results to SQLite...\n")
    
    # Get database path
    db_path = DEFAULT_DB_PATH
    if len(sys.argv) > 2 and sys.argv[1] == '--db':
        db_path = Path(sys.argv[2])
    
    # Create database
    print(f"📁 Database: {db_path}")
    conn = create_database(db_path)
    
    print("\n📥 Importing data...\n")
    
    # Import all CSV files
    mappings = [
        ('attempts_per_day.csv', 'daily_attempts', ['attempts_per_day', 'count']),
        ('attempts_per_hour.csv', 'hourly_attempts', ['attempts_per_hour', 'count']),
        ('attempts_per_ip.csv', 'ip_attempts', ['attempts_per_ip', 'count']),
        ('attempts_by_country.csv', 'country_attempts', ['attempts_by_country', 'count']),
        ('attempts_by_asn.csv', 'asn_attempts', ['attempts_by_asn', 'count']),
        ('attempts_by_org.csv', 'org_attempts', ['attempts_by_org', 'count']),
        ('tags.csv', 'attack_tags', ['tags', 'count']),
        ('paths.csv', 'attack_paths', ['paths', 'count']),
        ('methods.csv', 'http_methods', ['methods', 'count']),
        ('top_usernames.csv', 'top_usernames', ['top_usernames', 'count']),
        ('top_passwords.csv', 'top_passwords', ['top_passwords', 'count']),
        ('top_user_agents.csv', 'user_agents', ['top_user_agents', 'count']),
    ]
    
    for csv_file, table_name, csv_columns in mappings:
        csv_path = OUT_DIR / csv_file
        if not csv_path.exists():
            print(f"⚠️  Skipping {csv_file} - file not found")
            print(f"   ✅ {table_name}: 0 rows")
            continue
            
        cursor = conn.cursor()
        cursor.execute(f"DELETE FROM {table_name};")
        
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = list(reader)
            
            if rows:
                # Map CSV columns to table columns
                table_cols = ['country' if 'country' in table_name else 
                             'ip' if 'ip' in table_name else
                             'date' if 'daily' in table_name else
                             'hour' if 'hourly' in table_name else
                             'asn' if 'asn' in table_name else
                             'organization' if 'org' in table_name else
                             'tag' if 'tags' in table_name else
                             'path' if 'paths' in table_name else
                             'method' if 'methods' in table_name else
                             'username_hash' if 'usernames' in table_name else
                             'password_hash' if 'passwords' in table_name else
                             'user_agent' if 'agents' in table_name else
                             csv_columns[0], 'count']
                
                placeholders = ', '.join(['?' for _ in table_cols])
                insert_sql = f"INSERT OR REPLACE INTO {table_name} ({', '.join(table_cols)}) VALUES ({placeholders});"
                
                for row in rows:
                    # Get value from first column (the data column)
                    first_col_value = row[list(row.keys())[0]]
                    values = [first_col_value, row.get('count', 0)]
                    cursor.execute(insert_sql, values)
        
        conn.commit()
        count = len(rows) if csv_path.exists() and rows else 0
        print(f"   ✅ {table_name}: {count} rows")
    
    # Import events
    import_events(conn)
    
    # Import summary
    import_summary(conn)
    
    # Close connection
    conn.close()
    
    # Show database info
    print(f"\n" + "="*70)
    print("✅ EXPORT COMPLETE!")
    print("="*70)
    print(f"\n📁 Database: {db_path}")
    print(f"📊 Size: {db_path.stat().st_size / 1024:.1f} KB\n")
    
    print("🔍 Query examples:")
    print(f'   sqlite3 {db_path} "SELECT * FROM summary;"')
    print(f'   sqlite3 {db_path} "SELECT country, count FROM country_attempts ORDER BY count DESC LIMIT 10;"')
    print(f'   sqlite3 {db_path} "SELECT tag, count FROM attack_tags ORDER BY count DESC;"')
    print(f'   sqlite3 {db_path} "SELECT COUNT(*) FROM events WHERE geo_country = \'Iraq\';"')
    print()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n⚠️  Export cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
