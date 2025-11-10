/**
 * honeypot-service/app.js
 *
 * Defensive fake-login honeypot for security research.
 * - Writes comprehensive JSONL events to HONEY_LOGFILE (default: /data/honeypot_events.jsonl)
 * - Stores PLAINTEXT credentials for research analysis
 * - Captures complete HTTP headers and request details
 * - Detects attack patterns: SQL injection, scanners, bots
 *
 * ENV:
 *   PORT (default 8080)
 *   HONEY_LOGFILE (default /data/honeypot_events.jsonl)
 */

const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const helmet = require('helmet');

const PORT = process.env.PORT || 8080;
const LOGFILE = process.env.HONEY_LOGFILE || '/data/honeypot_events.jsonl';
const MAX_FIELD = 1024; // truncate fields to reduce log bloat

const app = express();

// Basic hardening headers
app.use(helmet());

// Body parsers
app.use(bodyParser.urlencoded({ extended: false, limit: '1mb' }));
app.use(bodyParser.json({ limit: '1mb' }));

// Safe trim/truncate helper
function safeTrim(v, n = MAX_FIELD) {
  try { return String(v || '').slice(0, n); } catch (e) { return ''; }
}

function sha256(input) {
  return crypto.createHash('sha256').update(String(input || '')).digest('hex');
}

function appendEvent(ev) {
  // ensure directory exists
  try {
    const dir = require('path').dirname(LOGFILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  } catch (e) { /* ignore */ }

  const line = JSON.stringify(ev) + '\n';
  // append synchronously to reduce risk of lost events on crash (small volume expected)
  try {
    fs.appendFileSync(LOGFILE, line, { encoding: 'utf8', mode: 0o600 });
  } catch (err) {
    // If logging fails, print to stderr (container logs) but do not crash
    console.error('Failed to write honeypot event:', err);
  }
}

// Health check
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Simple fake login page (for manual testing only)
// In production you can serve the decoy from your frontend or use this for quick checks
app.get(['/', '/admin', '/login', '/wp-admin'], (req, res) => {
  res.set('X-Honeypot', 'true'); // internal marker
  res.send(`
    <!doctype html>
    <html>
      <head><meta charset="utf-8"><title>Admin Login</title></head>
      <body>
        <h3>Company Portal</h3>
        <form method="POST" action="/fake-login">
          <label>Username</label><input name="username" /><br/>
          <label>Password</label><input name="password" type="password" /><br/>
          <button type="submit">Sign in</button>
        </form>
        <p style="font-size:12px;color:#666">This is a decoy login (honeypot).</p>
      </body>
    </html>
  `);
});

// POST handler - trap and log attempts
app.post(['/fake-login', '/login', '/wp-login.php'], (req, res) => {
  // get client IP: prefer X-Forwarded-For if behind proxy
  const xf = req.headers['x-forwarded-for'];
  const src_ip = Array.isArray(xf) ? xf[0] : (xf || req.ip || req.connection.remoteAddress || '');

  const username_raw = safeTrim(req.body.username || req.body.user || req.body.email || '');
  const password_raw = safeTrim(req.body.password || req.body.pass || '');

  // Comprehensive event capture for research purposes
  const event = {
    // Event metadata
    event_id: uuidv4(),
    timestamp: new Date().toISOString(),
    
    // Attacker identification
    src_ip,
    src_port: req.socket.remotePort || null,
    
    // Request details
    method: req.method,
    path: req.path,
    protocol: req.protocol,
    http_version: req.httpVersion,
    
    // PLAINTEXT CREDENTIALS (for research analysis)
    username: username_raw,
    password: password_raw,
    username_length: String(username_raw).length,
    password_length: String(password_raw).length,
    
    // Also keep hashes for quick duplicate detection
    username_hash: sha256(username_raw),
    password_hash: sha256(password_raw),
    
    // Complete HTTP headers
    headers: {
      user_agent: safeTrim(req.headers['user-agent'] || ''),
      referer: safeTrim(req.headers['referer'] || ''),
      origin: safeTrim(req.headers['origin'] || ''),
      host: safeTrim(req.headers['host'] || ''),
      accept: safeTrim(req.headers['accept'] || ''),
      accept_language: safeTrim(req.headers['accept-language'] || ''),
      accept_encoding: safeTrim(req.headers['accept-encoding'] || ''),
      content_type: safeTrim(req.headers['content-type'] || ''),
      content_length: req.headers['content-length'] || null,
      connection: safeTrim(req.headers['connection'] || ''),
      x_forwarded_for: safeTrim(req.headers['x-forwarded-for'] || ''),
      x_real_ip: safeTrim(req.headers['x-real-ip'] || ''),
      cookie: safeTrim(req.headers['cookie'] || ''),
      authorization: safeTrim(req.headers['authorization'] || ''),
    },
    
    // Full request body (for detecting SQL injection, etc.)
    request_body: req.body,
    
    // Attack pattern detection
    tags: [],
    
    // Additional analysis fields
    is_email: username_raw.includes('@'),
    is_phone: /^[\d\+\-\(\)\s]+$/.test(username_raw),
    contains_sql_keywords: /('|"|;|--|union|select|insert|update|delete|drop|create)/i.test(username_raw + password_raw),
    contains_special_chars: /[<>{}[\]\\\/\|`~!@#$%^&*()]/.test(username_raw),
  };

  // Enhanced scanner detection
  const ua = (req.headers['user-agent'] || '').toLowerCase();
  if (ua.includes('sqlmap') || ua.includes('masscan') || ua.includes('nmap') || ua.includes('nikto')) {
    event.tags.push('scanner-ua');
  }
  if (ua.includes('bot') || ua.includes('crawler') || ua.includes('spider')) {
    event.tags.push('bot-ua');
  }
  if (!ua || ua === '') {
    event.tags.push('missing-ua');
  }
  
  // SQL injection detection
  if (event.contains_sql_keywords) {
    event.tags.push('potential-sqli');
  }
  
  // Long username/password (potential attack)
  if (username_raw.length > 50 || password_raw.length > 50) {
    event.tags.push('long-input');
  }
  
  // Suspicious special characters
  if (event.contains_special_chars) {
    event.tags.push('special-chars');
  }

  appendEvent(event);

  // Return a plausible response — always "invalid" to avoid accidental auth
  res.status(200).send('<p>Invalid username or password.</p>');
});

// Basic catchall for other requests (avoid leaking real app)
app.use((req, res) => {
  res.set('X-Honeypot', 'true');
  res.status(404).send('Not Found');
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Honeypot listening on port ${PORT}, logging to ${LOGFILE}`);
});
