# 🌐 Deploy Frontend + Run Backend Locally with Ngrok

## Setup Guide

### Step 1: Start Backend Locally
```powershell
cd backend
npm run start:dev
# Backend runs on http://localhost:3000
```

### Step 2: Expose Backend with Ngrok
```powershell
# In a new terminal:
ngrok http 3000
```

**You'll see:**
```
Session Status    online
Forwarding        https://abc123.ngrok.io -> http://localhost:3000
```

**Copy the ngrok URL:** `https://abc123.ngrok.io`

### Step 3: Update Frontend Environment
```powershell
cd fronted

# Create .env.production
echo VITE_API_URL=https://abc123.ngrok.io > .env.production
echo VITE_HONEYPOT_URL=https://abc123.ngrok.io/honeypot >> .env.production
```

### Step 4: Deploy Frontend to Vercel
```powershell
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Step 5: Share with Friends
```
Frontend: https://your-app.vercel.app
Backend: https://abc123.ngrok.io (via your PC)
```

---

## ⚠️ Ngrok FREE Limitations

- ❌ URL changes every time you restart ngrok
- ❌ Must keep your PC running
- ❌ Limited to 40 requests/minute
- ❌ Session expires after 2 hours (must restart)
- ✅ Good for quick testing

---

## 💡 Better Option: Just Deploy Backend Too

**Why deploy backend to Render:**

1. ✅ **Always on** - No need to keep PC running
2. ✅ **Permanent URL** - Doesn't change
3. ✅ **FREE** - Same as ngrok
4. ✅ **No limits** - Works 24/7
5. ✅ **Professional** - Real deployment experience

**Time to deploy backend on Render:** ~5 minutes
**Time to setup ngrok each time:** ~2 minutes (and must redo when PC restarts)

---

## 🎯 My Recommendation

**Just deploy backend to Render!** Here's why:

| Aspect | Local + Ngrok | Deploy to Render |
|--------|---------------|------------------|
| Setup time | 2 min (every time) | 5 min (one time) |
| PC must run | ✅ YES | ❌ NO |
| URL changes | ✅ YES | ❌ NO |
| Session limits | 2 hours | Unlimited |
| Professional | ❌ | ✅ |
| Cost | FREE | FREE |

---

## 🚀 Quick Start (Local + Ngrok)

If you still want to try ngrok:

```powershell
# Terminal 1: Backend
cd backend
npm run start:dev

# Terminal 2: Ngrok
ngrok http 3000
# Copy the https URL

# Terminal 3: Frontend
cd fronted
$ngrokUrl = "https://YOUR-NGROK-URL.ngrok.io"
"VITE_API_URL=$ngrokUrl" > .env.production
"VITE_HONEYPOT_URL=$ngrokUrl/honeypot" >> .env.production
vercel --prod
```

---

## 🤔 Which Should You Choose?

**Use Ngrok if:**
- ⏰ Testing for < 2 hours
- 🏠 PC will stay on
- 🧪 Just experimenting

**Deploy to Render if:**
- 🌍 Friends testing from different timezones
- 📅 Testing over multiple days
- 🎓 Want real deployment experience
- 💼 Building portfolio project

**What do you prefer?**
