# 🆓 FREE Honeypot Deployment Guide

## ✅ Completely Free Option (Recommended)

### Split Architecture:
1. **Frontend** → Vercel (FREE forever)
2. **Backend + Honeypot** → Render (FREE tier)
3. **Dashboard** → Render (FREE tier)

---

## 🚀 Step-by-Step FREE Deployment

### Part 1: Deploy Frontend to Vercel (FREE)

**Step 1: Create Vercel Account**
- Go to: https://vercel.com/signup
- Sign up with GitHub (free)

**Step 2: Prepare Frontend**
```bash
# Navigate to frontend folder
cd "C:\Users\Alsakkal\Desktop\Fake login HONYPOT\fronted"

# Create production env file
echo VITE_API_URL=https://your-backend.onrender.com/api > .env.production
echo VITE_HONEYPOT_URL=https://your-honeypot.onrender.com >> .env.production

# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

**Step 3: Follow prompts:**
- Set up and deploy? → Yes
- Which scope? → Your account
- Link to existing project? → No
- Project name? → honeypot-frontend
- Directory? → ./
- Build command? → npm run build
- Output directory? → dist

**Result:** You'll get a URL like: `https://honeypot-frontend.vercel.app`

---

### Part 2: Deploy Backend to Render (FREE)

**Step 1: Create Render Account**
- Go to: https://render.com/
- Sign up with GitHub (free)

**Step 2: Push Code to GitHub**
```bash
# Navigate to project root
cd "C:\Users\Alsakkal\Desktop\Fake login HONYPOT"

# Initialize git (if not already)
git init
git add .
git commit -m "Initial commit"

# Create GitHub repo at: https://github.com/new
# Then push:
git remote add origin https://github.com/YOUR_USERNAME/honeypot.git
git branch -M main
git push -u origin main
```

**Step 3: Deploy Backend on Render**
1. Go to Render Dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repo
4. Configure:
   - **Name:** honeypot-backend
   - **Root Directory:** backend
   - **Environment:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start:prod`
   - **Plan:** FREE
5. Click "Create Web Service"

**Result:** You'll get URL like: `https://honeypot-backend.onrender.com`

---

### Part 3: Deploy Dashboard to Render (FREE)

**Step 1: Create Render.yaml for Dashboard**
Create this file in your project root:

```yaml
# render.yaml
services:
  # Backend API
  - type: web
    name: honeypot-backend
    env: node
    region: oregon
    plan: free
    buildCommand: cd backend && npm install && npm run build
    startCommand: cd backend && npm run start:prod
    envVars:
      - key: NODE_ENV
        value: production

  # Dashboard
  - type: web
    name: honeypot-dashboard
    env: python
    region: oregon
    plan: free
    buildCommand: cd dashboard && pip install -r requirements.txt
    startCommand: cd dashboard && python app.py
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
```

**Step 2: Create requirements.txt for Dashboard**
```bash
cd dashboard
```

Create `requirements.txt`:
```
flask==3.0.0
plotly==5.18.0
```

**Step 3: Update Dashboard app.py**
Change the last line to:
```python
app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5001)), debug=False)
```

**Step 4: Deploy**
1. Push changes to GitHub
2. Render will auto-deploy from `render.yaml`
3. Or manually: New → Web Service → Select repo

**Result:** `https://honeypot-dashboard.onrender.com`

---

### Part 4: Deploy Honeypot Container (Alternative FREE)

**Option A: Use Render (with Docker)**
1. Render Dashboard → New → Web Service
2. Select your repo
3. **Runtime:** Docker
4. **Dockerfile Path:** (create Dockerfile for honeypot)
5. **Plan:** FREE

**Option B: Run on Render with Backend**
Merge honeypot into backend service (no separate container needed)

**Option C: Use Railway (500 hours/month FREE)**
- Go to: https://railway.app/
- Sign up with GitHub
- New Project → Deploy from GitHub
- Select honeypot folder
- FREE: 500 hours/month ($5 credit)

---

## 🔗 Final Configuration

### Update Frontend URLs
After deploying backend and dashboard, update frontend:

**File:** `fronted/.env.production`
```env
VITE_API_URL=https://honeypot-backend.onrender.com
VITE_HONEYPOT_URL=https://honeypot-backend.onrender.com/honeypot
```

**Redeploy Frontend:**
```bash
cd fronted
vercel --prod
```

---

## ⚡ Quick Deploy Script (All at Once)

Save this as `deploy-free.ps1`:

```powershell
# FREE Deployment Script

Write-Host "🚀 Starting FREE Deployment..." -ForegroundColor Green

# 1. Deploy Frontend to Vercel
Write-Host "`n📦 Deploying Frontend to Vercel..." -ForegroundColor Cyan
cd fronted
vercel --prod
cd ..

# 2. Push to GitHub (for Render)
Write-Host "`n📤 Pushing to GitHub..." -ForegroundColor Cyan
git add .
git commit -m "Deploy to production"
git push origin main

Write-Host "`n✅ Next Steps:" -ForegroundColor Green
Write-Host "1. Go to https://render.com/dashboard" -ForegroundColor White
Write-Host "2. Create Web Service from your GitHub repo" -ForegroundColor White
Write-Host "3. Select 'backend' folder, Node environment" -ForegroundColor White
Write-Host "4. Create another Web Service for 'dashboard' folder, Python environment" -ForegroundColor White
Write-Host "5. Update frontend .env.production with Render URLs" -ForegroundColor White
Write-Host "6. Redeploy frontend: cd fronted && vercel --prod" -ForegroundColor White
```

---

## 💰 FREE Tier Limits

| Platform | FREE Tier | Limits |
|----------|-----------|--------|
| **Vercel** | Frontend | Unlimited bandwidth, 100GB/month |
| **Render** | Backend + Dashboard | 750 hours/month (enough for 2 services) |
| **Railway** | Alternative | 500 hours/month or $5 credit |
| **GitHub** | Code hosting | Unlimited public repos |

---

## ⚠️ Important Notes

**FREE Tier Downsides:**
- Services **sleep after 15 minutes** of inactivity
- First request takes **30-60 seconds** to wake up
- Good for **testing**, not production
- **No persistent storage** on free tier

**Solutions:**
- Use **UptimeRobot** (free) to ping every 5 minutes (keeps services awake)
- For storage: Use **MongoDB Atlas** (free tier) instead of SQLite
- Or upgrade to $7/month for always-on services

---

## 🎯 Testing from Multiple Locations

**FREE Tools:**
1. **Uptime Robot** (https://uptimerobot.com/)
   - Free monitoring from multiple locations
   - Keeps your service awake

2. **WebPageTest** (https://www.webpagetest.org/)
   - Test from different countries
   - Free, no signup

3. **GTmetrix** (https://gtmetrix.com/)
   - Free performance testing
   - Multiple server locations

4. **VPN Services (Free):**
   - ProtonVPN (free tier)
   - Windscribe (10GB/month free)

---

## 📋 Deployment Checklist

- [ ] Create Vercel account
- [ ] Create Render account
- [ ] Create GitHub account
- [ ] Push code to GitHub
- [ ] Deploy frontend to Vercel
- [ ] Deploy backend to Render
- [ ] Deploy dashboard to Render
- [ ] Update frontend .env with backend URLs
- [ ] Redeploy frontend
- [ ] Test all services
- [ ] Setup UptimeRobot to keep services awake
- [ ] Test from different locations

---

## 🆘 Need Help?

**Common Issues:**

1. **"Build failed on Render"**
   - Check build logs
   - Ensure `package.json` has correct scripts
   - Add `npm install` before `npm run build`

2. **"Service won't start"**
   - Check start command
   - Verify PORT environment variable: `process.env.PORT`
   - Check Render logs

3. **"Frontend can't connect to backend"**
   - Update CORS in backend
   - Check .env.production URLs
   - Verify Render service is running

Would you like me to create the specific files needed for FREE deployment?
