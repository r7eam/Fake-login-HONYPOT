#!/usr/bin/env python3
"""
Honeypot Analytics Dashboard

A web-based dashboard for visualizing honeypot attack data.
Uses Flask for the web server and Plotly for interactive charts.

Usage:
    python dashboard/app.py

Access:
    http://localhost:5000
"""

from flask import Flask, render_template, jsonify
import sqlite3
import json
from pathlib import Path
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime

app = Flask(__name__)

# Configuration
DB_PATH = Path("../analysis/out/results.db")
CHARTS_DIR = Path("../analysis/out")


def get_db():
    """Get database connection."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def get_summary_stats():
    """Get summary statistics from database."""
    conn = get_db()
    cursor = conn.cursor()
    
    summary = cursor.execute("SELECT * FROM summary ORDER BY id DESC LIMIT 1").fetchone()
    
    if not summary:
        return {}
    
    return {
        'total_events': summary['total_events'],
        'date_start': summary['date_start'],
        'date_end': summary['date_end'],
        'days_observed': summary['days_observed'],
        'avg_events_per_day': summary['avg_events_per_day'],
        'unique_ips': summary['unique_ips'],
        'unique_countries': summary['unique_countries'],
        'avg_attempts_per_ip': summary['avg_attempts_per_ip'],
        'unique_tags': summary['unique_tags'],
        'peak_day': summary['peak_day'],
        'peak_day_count': summary['peak_day_count'],
        'peak_hour': summary['peak_hour'],
        'peak_hour_count': summary['peak_hour_count']
    }


def get_country_data():
    """Get country attack distribution."""
    conn = get_db()
    cursor = conn.cursor()
    
    rows = cursor.execute("""
        SELECT country, count 
        FROM country_attempts 
        WHERE country IS NOT NULL AND country != ''
        ORDER BY count DESC 
        LIMIT 10
    """).fetchall()
    
    return [{'country': row['country'], 'count': row['count']} for row in rows]


def get_tag_data():
    """Get attack tag distribution."""
    conn = get_db()
    cursor = conn.cursor()
    
    rows = cursor.execute("""
        SELECT tag, count 
        FROM attack_tags 
        WHERE tag IS NOT NULL AND tag != ''
        ORDER BY count DESC
    """).fetchall()
    
    return [{'tag': row['tag'], 'count': row['count']} for row in rows]


def get_hourly_data():
    """Get hourly attack distribution."""
    conn = get_db()
    cursor = conn.cursor()
    
    rows = cursor.execute("""
        SELECT hour, count 
        FROM hourly_attempts 
        ORDER BY hour
    """).fetchall()
    
    return [{'hour': row['hour'], 'count': row['count']} for row in rows]


def get_daily_data():
    """Get daily attack trends."""
    conn = get_db()
    cursor = conn.cursor()
    
    rows = cursor.execute("""
        SELECT date, count 
        FROM daily_attempts 
        ORDER BY date
    """).fetchall()
    
    return [{'date': row['date'], 'count': row['count']} for row in rows]


def get_top_ips():
    """Get top attacking IPs."""
    conn = get_db()
    cursor = conn.cursor()
    
    rows = cursor.execute("""
        SELECT ip, count 
        FROM ip_attempts 
        WHERE ip IS NOT NULL AND ip != ''
        ORDER BY count DESC 
        LIMIT 10
    """).fetchall()
    
    return [{'ip': row['ip'], 'count': row['count']} for row in rows]


def get_top_paths():
    """Get most targeted paths."""
    conn = get_db()
    cursor = conn.cursor()
    
    rows = cursor.execute("""
        SELECT path, count 
        FROM attack_paths 
        ORDER BY count DESC
    """).fetchall()
    
    return [{'path': row['path'], 'count': row['count']} for row in rows]


@app.route('/')
def index():
    """Main dashboard page."""
    stats = get_summary_stats()
    return render_template('dashboard.html', stats=stats)


@app.route('/api/summary')
def api_summary():
    """API endpoint for summary statistics."""
    return jsonify(get_summary_stats())


@app.route('/api/countries')
def api_countries():
    """API endpoint for country data."""
    return jsonify(get_country_data())


@app.route('/api/tags')
def api_tags():
    """API endpoint for attack tags."""
    return jsonify(get_tag_data())


@app.route('/api/hourly')
def api_hourly():
    """API endpoint for hourly distribution."""
    return jsonify(get_hourly_data())


@app.route('/api/daily')
def api_daily():
    """API endpoint for daily trends."""
    return jsonify(get_daily_data())


@app.route('/api/top-ips')
def api_top_ips():
    """API endpoint for top IPs."""
    return jsonify(get_top_ips())


@app.route('/api/top-paths')
def api_top_paths():
    """API endpoint for top paths."""
    return jsonify(get_top_paths())


@app.route('/api/recent-events')
def api_recent_events():
    """API endpoint for recent events."""
    conn = get_db()
    cursor = conn.cursor()
    
    rows = cursor.execute("""
        SELECT timestamp, ip, geo_country, username, password, path, tags
        FROM events 
        ORDER BY timestamp DESC 
        LIMIT 20
    """).fetchall()
    
    events = []
    for row in rows:
        events.append({
            'timestamp': row['timestamp'],
            'ip': row['ip'],
            'country': row['geo_country'],
            'username': row['username'],
            'password': row['password'] if row['password'] else 'N/A',
            'path': row['path'],
            'tags': row['tags']
        })
    
    return jsonify(events)


@app.route('/x')
def dummy_x():
    """Dummy endpoint to handle browser probe requests (Safari/iOS)."""
    return '', 204  # No Content - silently ignore


@app.route('/test')
def test_page():
    """Debug test page to isolate alert source."""
    return render_template('test.html')


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors gracefully."""
    return jsonify({'error': 'Not found'}), 404


if __name__ == '__main__':
    print("\n" + "="*70)
    print("🚀 HONEYPOT ANALYTICS DASHBOARD")
    print("="*70)
    print(f"\n📊 Database: {DB_PATH}")
    print(f"🌐 Access URL: http://localhost:5001")
    print(f"\n⚡ Starting server...\n")
    
    app.run(host='0.0.0.0', port=5001, debug=True)
