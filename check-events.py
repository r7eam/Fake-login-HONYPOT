import sqlite3

conn = sqlite3.connect('analysis/out/results.db')
cur = conn.cursor()

print('\nSample events with passwords:')
for row in cur.execute('SELECT timestamp, ip, geo_country, username, password, path, tags FROM events LIMIT 5').fetchall():
    print(f'  Time: {row[0][:19] if row[0] else "N/A"}')
    print(f'  IP: {row[1]} ({row[2]})')
    print(f'  Username: {row[3]} / Password: {row[4]}')
    print(f'  Path: {row[5]} | Tags: {row[6]}')
    print()

conn.close()
