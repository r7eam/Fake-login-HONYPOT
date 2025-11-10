import sqlite3

conn = sqlite3.connect('analysis/out/results.db')
cur = conn.cursor()

print('\n=== DATABASE CONTENTS ===\n')

print('SUMMARY:')
row = cur.execute('SELECT * FROM summary').fetchone()
if row:
    print(f'  Total Events: {row[1]}')
    print(f'  Unique IPs: {row[2]}')
    print(f'  Countries: {row[3]}')

print('\nCOUNTRIES:')
for row in cur.execute('SELECT country, count FROM country_attempts ORDER BY count DESC').fetchall():
    print(f'  {row[0]}: {row[1]} attacks')

print('\nTOP IPs:')
for row in cur.execute('SELECT ip, count FROM ip_attempts ORDER BY count DESC LIMIT 10').fetchall():
    print(f'  {row[0]}: {row[1]} attempts')

print('\nATTACK TAGS:')
for row in cur.execute('SELECT tag, count FROM attack_tags ORDER BY count DESC').fetchall():
    print(f'  {row[0]}: {row[1]} occurrences')

print('\nTOP PATHS:')
for row in cur.execute('SELECT path, count FROM attack_paths ORDER BY count DESC').fetchall():
    print(f'  {row[0]}: {row[1]} requests')

conn.close()
print('\n=== END ===\n')
