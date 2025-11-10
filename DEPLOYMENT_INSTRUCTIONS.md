# 🚀 Deploy Your Honeypot to Vercel & Render

## ✅ Step 1: Your Code is on GitHub
Repository: https://github.com/r7eam/Fake-login-HONYPOT

---

## 📦 Step 2: Deploy Frontend to Vercel (FREE)

### 2.1 Create Vercel Account
1. Go to: https://vercel.com/signup
2. Click "Continue with GitHub"
3. Authorize Vercel to access your repositories

### 2.2 Import Project
1. Click "Add New..." → "Project"
2. Find "Fake-login-HONYPOT" and click "Import"
3. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `fronted`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### 2.3 Add Environment Variables
Click "Environment Variables" and add:
```
VITE_API_URL=https://YOUR-BACKEND-URL.onrender.com
VITE_HONEYPOT_URL=https://YOUR-BACKEND-URL.onrender.com/honeypot
```
*(Leave these for now, we'll update after deploying backend)*

### 2.4 Deploy
- Click "Deploy"
- Wait 2-3 minutes
- You'll get URL like: `https://fake-login-honypot.vercel.app`

---

## 🔧 Step 3: Deploy Backend to Render (FREE)

### 3.1 Create Render Account
1. Go to: https://render.com/
2. Sign up with GitHub

### 3.2 Create New Web Service
1. Click "New +" → "Web Service"
2. Connect GitHub repository
3. Select "Fake-login-HONYPOT"

### 3.3 Configure Backend Service
```
Name: honeypot-backend
Region: Oregon (or closest to you)
Branch: main
Root Directory: backend
Runtime: Node
Build Command: npm install && npm run build
Start Command: npm run start:prod
Plan: Free
```

### 3.4 Add Environment Variables
```
NODE_ENV=production
PORT=3000
```

### 3.5 Deploy
- Click "Create Web Service"
- Wait 5-10 minutes
- You'll get URL like: `https://honeypot-backend.onrender.com`

---

## 📊 Step 4: Deploy Dashboard to Render (FREE)

### 4.1 Create Another Web Service
1. Click "New +" → "Web Service"
2. Select same repository
3. Configure:

```
Name: honeypot-dashboard
Region: Oregon
Branch: main
Root Directory: dashboard
Runtime: Python 3
Build Command: pip install -r requirements.txt
Start Command: python app.py
Plan: Free
```

### 4.2 Add Environment Variables
```
PYTHON_VERSION=3.11.0
PORT=5001
DASHBOARD_USER=admin
DASHBOARD_PASS=YourSecurePassword123
```

### 4.3 Deploy
- Click "Create Web Service"
- You'll get URL like: `https://honeypot-dashboard.onrender.com`

---

## 🔗 Step 5: Connect Frontend to Backend

### 5.1 Update Frontend Environment Variables

Go back to Vercel:
1. Your Project → Settings → Environment Variables
2. Edit the variables:
```
VITE_API_URL=https://honeypot-backend.onrender.com
VITE_HONEYPOT_URL=https://honeypot-backend.onrender.com/honeypot
```

### 5.2 Redeploy Frontend
1. Go to Deployments tab
2. Click "..." on latest deployment
3. Click "Redeploy"

---

## 🎉 Step 6: Test Your Deployment

### Your Live URLs:
```
Frontend (Fake Login): https://fake-login-honypot.vercel.app
Backend API: https://honeypot-backend.onrender.com
Dashboard: https://honeypot-dashboard.onrender.com
```

### Test the System:
1. **Share with friends:** `https://fake-login-honypot.vercel.app/fake-admin`
2. **They try attacks:** SQL injection, XSS, etc.
3. **View results:** `https://honeypot-dashboard.onrender.com`
   - Username: `admin`
   - Password: `YourSecurePassword123`

---

## ⚠️ Important Notes

### Free Tier Limitations:
- Services sleep after 15 minutes of inactivity
- First request takes 30-60 seconds to wake up
- Combined 750 hours/month across services

### Keep Services Awake (Optional):
Use **UptimeRobot** (free):
1. Go to: https://uptimerobot.com/
2. Add monitors for your URLs
3. Set interval to 5 minutes

### Data Persistence:
- Free tier has **NO persistent storage**
- Events will be lost when service restarts
- For production, upgrade to paid tier ($7/month)
- Or use external storage (MongoDB Atlas free tier)

---

## 🐛 Troubleshooting

### Frontend can't connect to backend:
1. Check CORS settings in backend
2. Verify environment variables in Vercel
3. Check Render logs for backend errors

### Backend build fails:
1. Check Render logs
2. Verify `package.json` has all dependencies
3. Ensure build command is correct

### Dashboard not loading:
1. Check if `requirements.txt` exists
2. Verify Python version (3.11)
3. Check Render logs

---

## 📱 Share with Friends

Once deployed, share this URL with friends:
```
https://fake-login-honypot.vercel.app/fake-admin
```

Tell them to:
- Try different usernames/passwords
- Attempt SQL injection: `admin' OR '1'='1`
- Try XSS: `<script>alert('xss')</script>`
- Use command injection: `; ls -la`

Then you can view all attacks at:
```
https://honeypot-dashboard.onrender.com
```

---

## 🎯 Next Steps

1. [ ] Deploy frontend to Vercel
2. [ ] Deploy backend to Render
3. [ ] Deploy dashboard to Render
4. [ ] Update frontend environment variables
5. [ ] Test the system
6. [ ] Share with friends
7. [ ] View analytics

**Total time: ~20 minutes**
**Total cost: $0/month**

---

Need help? Check the logs in Render dashboard or open an issue on GitHub!
