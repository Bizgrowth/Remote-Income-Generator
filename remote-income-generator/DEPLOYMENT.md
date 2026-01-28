# Deployment Guide - Remote AI Agent Income Generator

## Option 1: Render.com (Recommended - Free Tier)

### Quick Deploy
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "Blueprint"
3. Connect your GitHub repo: `Bizgrowth/Remote-Income-Generator`
4. Render will detect `render.yaml` and create the service
5. Click "Apply" to deploy

### Manual Setup on Render
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "Web Service"
3. Connect to GitHub and select `Remote-Income-Generator`
4. Configure:
   - **Name**: `remote-income-generator`
   - **Region**: Oregon (or closest to you)
   - **Branch**: `master`
   - **Root Directory**: leave empty
   - **Runtime**: Node
   - **Build Command**:
     ```
     cd backend && npm install && npm run build && cd ../frontend && npm install && npm run build && cp -r dist ../backend/
     ```
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free

5. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `PORT` = `3001`

6. Click "Create Web Service"

### Your Live URL
After deployment, your app will be at:
```
https://remote-income-generator.onrender.com
```

---

## Option 2: Railway.app

### Setup
1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Initialize: `cd remote-income-generator && railway init`
4. Deploy: `railway up`

### Configure Services
Create two services in Railway dashboard:
- **Backend**: Point to `/backend` folder
- **Frontend**: Point to `/frontend` folder

---

## Option 3: Vercel (Frontend) + Render (Backend)

### Frontend on Vercel
1. Go to [Vercel](https://vercel.com)
2. Import GitHub repo
3. Set root directory to `frontend`
4. Add env variable: `VITE_API_URL=https://your-backend.onrender.com`
5. Deploy

### Backend on Render
1. Follow Render steps above but only for backend
2. Set root directory to `backend`

---

## Option 4: Self-Hosted / VPS

### Requirements
- Node.js 18+
- 512MB RAM minimum
- PM2 or similar process manager

### Steps
```bash
# Clone repo
git clone https://github.com/Bizgrowth/Remote-Income-Generator.git
cd Remote-Income-Generator

# Build backend
cd backend
npm install
npm run build

# Build frontend
cd ../frontend
npm install
npm run build

# Copy frontend build to backend
cp -r dist ../backend/

# Start with PM2
cd ../backend
pm2 start dist/index.js --name "income-generator"

# Or start directly
NODE_ENV=production npm start
```

### Nginx Configuration (optional)
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Backend port | `3001` |
| `FRONTEND_URL` | CORS origin for frontend | `*` in production |

---

## Post-Deployment Checklist

1. ✅ Verify health endpoint: `https://your-app.com/api/health`
2. ✅ Test job refresh functionality
3. ✅ Test file upload (PDF parsing)
4. ✅ Check that scrapers are working (some may need updates)
5. ✅ Set up uptime monitoring (UptimeRobot, Better Uptime, etc.)

---

## Troubleshooting

### "Cannot find module" errors
- Run `npm install` in both `backend` and `frontend` folders
- Ensure build completed successfully

### Scrapers returning empty results
- Some job sites block server IPs
- Try adding delays between requests
- Check console logs for error messages

### CORS errors
- Ensure `FRONTEND_URL` is set correctly
- Check that the production URL matches

### Database not persisting
- Render's free tier has ephemeral storage
- Data resets on each deploy
- Consider upgrading or using external database for production
