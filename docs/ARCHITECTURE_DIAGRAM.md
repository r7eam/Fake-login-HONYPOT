# Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER'S BROWSER                              │
└────────────────┬────────────────────────────────────────────────────┘
                 │
                 ├─────────────────────────────────────────────────────┐
                 │                                                     │
                 ▼                                                     ▼
┌────────────────────────────────┐              ┌──────────────────────────────┐
│     MAIN APPLICATION (3001)     │              │   HONEYPOT SERVICE (80)      │
│  ┌──────────────────────────┐  │              │  ┌────────────────────────┐  │
│  │   React Frontend (Vite)   │  │              │  │   Nginx Reverse Proxy  │  │
│  │  - Marketplace UI          │  │              │  │   - Rate Limiting      │  │
│  │  - /admin-login route      │  │              │  │   - X-Forwarded-For    │  │
│  │  - Material-UI             │  │              │  └──────────┬─────────────┘  │
│  │  - Arabic RTL support      │  │              │             │                │
│  └────────────┬───────────────┘  │              │             ▼                │
│               │                   │              │  ┌────────────────────────┐  │
│               ▼                   │              │  │ Express.js Honeypot     │  │
│  ┌──────────────────────────┐    │              │  │ - GET / (fake page)     │  │
│  │   Backend API (3000)      │    │              │  │ - POST /fake-login      │  │
│  │  ┌─────────────────────┐  │    │              │  │ - SHA-256 hashing       │  │
│  │  │  NestJS + TypeORM    │  │    │              │  │ - Scanner detection     │  │
│  │  │  - JWT Auth          │  │    │              │  └──────────┬─────────────┘  │
│  │  │  - Users/Workers     │  │    │              │             │                │
│  │  │  - Requests          │  │    │              │             ▼                │
│  │  │  - Reviews           │  │    │              │  ┌────────────────────────┐  │
│  │  │  - Swagger API       │  │    │              │  │   JSONL Event Logger    │  │
│  │  └─────────┬───────────┘  │    │              │  │   /data/honeypot_       │  │
│  │            │               │    │              │  │   events.jsonl          │  │
│  │            ▼               │    │              │  └─────────────────────────┘  │
│  │  ┌─────────────────────┐  │    │              └──────────────────────────────┘
│  │  │   PostgreSQL DB      │  │    │
│  │  │  - craft_mosul        │  │    │
│  │  │  - users, workers    │  │    │
│  │  │  - requests, reviews │  │    │
│  │  └─────────────────────┘  │    │
│  └──────────────────────────┘    │
└────────────────────────────────┘


================================================================================
                            DATA FLOW DIAGRAM
================================================================================

LEGITIMATE USER FLOW:
═══════════════════════
User → Frontend (3001) → Backend API (3000) → PostgreSQL → Response
  └→ Browse workers
  └→ Create requests  
  └→ Leave reviews
  └→ Authentication (JWT)


ATTACKER FLOW (Honeypot):
═══════════════════════════
Attacker → Nginx (80) → Honeypot Service → JSONL Log
            │              │
            │              ├─ Hash username (SHA-256)
            │              ├─ Hash password (SHA-256)
            │              ├─ Capture IP (X-Forwarded-For)
            │              ├─ Capture User-Agent
            │              ├─ Detect scanner patterns
            │              ├─ Tag event (scanner-ua, missing-ua)
            │              └─ Append to honeypot_events.jsonl
            │
            └─ Rate Limit: 10 requests/minute per IP


FRONTEND INTEGRATED HONEYPOT:
═══════════════════════════════
User → Frontend /admin-login → Honeypot Service (80) → JSONL Log
  │
  └→ FakeAdminLogin.jsx component
      └→ POST to VITE_HONEYPOT_URL
          └→ Always returns "Invalid credentials"


================================================================================
                            PORT ALLOCATION
================================================================================

3000  │ NestJS Backend API (Production App)
3001  │ React Frontend (Vite Dev Server)  
80    │ Nginx Reverse Proxy (Honeypot Entry Point)
8080  │ Express Honeypot Service (Internal, not exposed directly)
5432  │ PostgreSQL Database (localhost)


================================================================================
                         SECURITY LAYERS
================================================================================

┌─────────────────────────────────────────────────────────────────┐
│                      PRODUCTION APP                             │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ Layer 1: JWT Authentication                             │     │
│  │  - Bearer tokens                                         │     │
│  │  - 7-day expiration                                      │     │
│  │  - Role-based access (client/worker/admin)              │     │
│  └────────────────────────────────────────────────────────┘     │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ Layer 2: Password Hashing                               │     │
│  │  - bcrypt with salt rounds                              │     │
│  │  - Never store plaintext                                │     │
│  └────────────────────────────────────────────────────────┘     │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ Layer 3: Input Validation                               │     │
│  │  - class-validator DTOs                                 │     │
│  │  - Whitelist/forbid unknown fields                      │     │
│  └────────────────────────────────────────────────────────┘     │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ Layer 4: CORS Protection                                │     │
│  │  - Restricted origins                                   │     │
│  │  - Credential support                                   │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      HONEYPOT SERVICE                           │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ Layer 1: Rate Limiting                                  │     │
│  │  - 10 requests/minute per IP                            │     │
│  │  - Burst allowance: 20                                  │     │
│  └────────────────────────────────────────────────────────┘     │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ Layer 2: SHA-256 Hashing                                │     │
│  │  - All credentials hashed before storage                │     │
│  │  - No plaintext ever written to disk                    │     │
│  └────────────────────────────────────────────────────────┘     │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ Layer 3: Field Truncation                               │     │
│  │  - Max 1024 chars per field                             │     │
│  │  - Prevents log bloat attacks                           │     │
│  └────────────────────────────────────────────────────────┘     │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ Layer 4: Container Isolation                            │     │
│  │  - Non-root user (honeypot:1001)                        │     │
│  │  - No database connection                               │     │
│  │  - Read-only file system (except /data)                 │     │
│  └────────────────────────────────────────────────────────┘     │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ Layer 5: Helmet.js Security Headers                     │     │
│  │  - CSP, X-Frame-Options, etc.                           │     │
│  │  - XSS protection                                       │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘


================================================================================
                    EVENT CAPTURE PIPELINE
================================================================================

ATTACKER ATTEMPT:
    │
    ▼
┌───────────────────────────────────────────────────────────┐
│ Step 1: Nginx Receives Request                            │
│  - Check rate limit (zone: hp_zone)                       │
│  - Add X-Forwarded-For header                             │
│  - Proxy to honeypot:8080                                 │
└────────────────────────┬──────────────────────────────────┘
                         │
                         ▼
┌───────────────────────────────────────────────────────────┐
│ Step 2: Express Routes Request                            │
│  - Match POST /fake-login                                 │
│  - Extract username & password from body                  │
└────────────────────────┬──────────────────────────────────┘
                         │
                         ▼
┌───────────────────────────────────────────────────────────┐
│ Step 3: Data Extraction                                   │
│  - Get client IP (X-Forwarded-For || req.ip)              │
│  - Get User-Agent header                                  │
│  - Truncate fields to 1024 chars max                      │
└────────────────────────┬──────────────────────────────────┘
                         │
                         ▼
┌───────────────────────────────────────────────────────────┐
│ Step 4: Cryptographic Hashing                             │
│  - username_hash = SHA256(username)                       │
│  - password_hash = SHA256(password)                       │
│  - body_fingerprint = SHA256(JSON.stringify(body))        │
└────────────────────────┬──────────────────────────────────┘
                         │
                         ▼
┌───────────────────────────────────────────────────────────┐
│ Step 5: Pattern Detection                                 │
│  - Check User-Agent for: sqlmap, nmap, nikto, masscan     │
│  - Check if User-Agent is empty/missing                   │
│  - Apply tags: scanner-ua, missing-ua                     │
└────────────────────────┬──────────────────────────────────┘
                         │
                         ▼
┌───────────────────────────────────────────────────────────┐
│ Step 6: Event Object Creation                             │
│  {                                                         │
│    id: uuid(),                                             │
│    received_at: ISO timestamp,                             │
│    src_ip, path, method,                                   │
│    username_hash, username_len,                            │
│    password_hash, password_len,                            │
│    ua, referer, x_forwarded_for,                           │
│    body_fingerprint,                                       │
│    headers_sample,                                         │
│    tags: []                                                │
│  }                                                         │
└────────────────────────┬──────────────────────────────────┘
                         │
                         ▼
┌───────────────────────────────────────────────────────────┐
│ Step 7: JSONL Append                                      │
│  - Stringify event to JSON                                │
│  - Append line to /data/honeypot_events.jsonl             │
│  - Flush to disk synchronously                            │
│  - Set file permissions to 600 (rw-------)                │
└────────────────────────┬──────────────────────────────────┘
                         │
                         ▼
┌───────────────────────────────────────────────────────────┐
│ Step 8: Response to Attacker                              │
│  - HTTP 200 OK                                             │
│  - Body: "<p>Invalid username or password.</p>"           │
│  - Looks like legitimate failed login                     │
└───────────────────────────────────────────────────────────┘


================================================================================
                         FILE STRUCTURE
================================================================================

Fake login HONYPOT/
│
├── backend/              ← NestJS Production API
│   ├── src/
│   │   ├── auth/         ← JWT authentication
│   │   ├── users/        ← User management
│   │   ├── workers/      ← Worker profiles
│   │   └── ...
│   └── uploads/          ← Static files
│
├── fronted/              ← React Frontend
│   ├── src/
│   │   ├── pages/
│   │   │   └── FakeAdminLogin.jsx  ← Honeypot UI component
│   │   ├── context/
│   │   └── config/
│   └── .env              ← VITE_HONEYPOT_URL=http://localhost:80
│
├── honeypot-service/     ← Express Honeypot
│   ├── app.js            ← Main server logic
│   ├── Dockerfile        ← Container definition
│   └── package.json
│
├── nginx/                ← Reverse Proxy
│   └── conf.d/
│       └── honeypot.conf ← Rate limiting, routing
│
├── data/                 ← Event Storage
│   └── honeypot_events.jsonl  ← All captured events (GITIGNORED)
│
└── docs/                 ← Documentation
    ├── scope.md
    ├── COMPLETE_SYSTEM_GUIDE.md
    └── ...


================================================================================
                   DEPLOYMENT SCENARIOS
================================================================================

SCENARIO 1: Local Development (Current)
───────────────────────────────────────
Frontend:  localhost:3001
Backend:   localhost:3000
Honeypot:  localhost:80
Database:  localhost:5432


SCENARIO 2: Production with Subdomain
──────────────────────────────────────
Frontend:  https://fullcraft.com
Backend:   https://api.fullcraft.com
Honeypot:  https://admin.fullcraft.com  ← Subdomain isolates honeypot
Database:  Private network


SCENARIO 3: Production with Path
─────────────────────────────────
Frontend:  https://fullcraft.com
Backend:   https://fullcraft.com/api
Honeypot:  https://fullcraft.com/admin-login  ← Path-based
Database:  Private network


================================================================================
```

**Legend:**
- `┌─┐` - Service boundary
- `│` - Data flow
- `▼` - Direction of flow
- `→` - HTTP request/response
- `═` - Section separator
