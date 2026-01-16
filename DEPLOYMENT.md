# 🚀 Render Deployment Guide - CipherH

## ✅ Pre-Deployment Checklist

### Build & Test Status
- ✅ TypeScript compilation passes (`npm run check`)
- ✅ Production build succeeds (`npm run build`)
- ✅ Server starts correctly (`npm start`)
- ✅ All API endpoints functional
- ✅ Inner Loop executes successfully
- ✅ No critical errors or warnings

### Code Quality
- ✅ No TypeScript errors
- ✅ Proper error handling throughout
- ✅ Graceful degradation (works without API keys)
- ✅ Environment variables documented

### Configuration Files
- ✅ `package.json` - Scripts properly configured
- ✅ `Procfile` - Build and start commands correct
- ✅ `render.yaml` - Deployment configuration ready
- ✅ `.env.example` - All environment variables documented
- ✅ `.gitignore` - Excludes build artifacts and dependencies

## 📋 Deployment Steps on Render

### 1. Create New Web Service
1. Go to https://render.com/dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repository: `trancuong198/cipherh-1`

### 2. Configure Service
**Basic Settings:**
- **Name:** `cipherh` (or your preferred name)
- **Region:** Choose closest to your users
- **Branch:** `copilot/restore-removed-sections` (or your main branch)
- **Runtime:** `Node`
- **Build Command:** `npm run build`
- **Start Command:** `npm start`

**Instance Type:**
- **Plan:** Free (or higher for better performance)

### 3. Environment Variables
Add these in Render dashboard (Settings → Environment):

**Required:**
```
NODE_ENV=production
PORT=3000
```

**Optional (for full functionality):**
```
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
NOTION_TOKEN=your_notion_token
NOTION_DATABASE_ID=your_notion_database_id
HEARTBEAT_CRON=*/10 * * * *
```

**Security (Generate random string):**
```
SESSION_SECRET=your_random_secure_string_here
```

### 4. Deploy
1. Click "Create Web Service"
2. Render will automatically:
   - Clone your repository
   - Install dependencies (`npm install`)
   - Build the application (`npm run build`)
   - Start the server (`npm start`)

### 5. Verify Deployment
Once deployed, test these endpoints:

```bash
# Health check
curl https://your-app.onrender.com/api/health

# System status
curl https://your-app.onrender.com/api/core/status

# Dashboard data
curl https://your-app.onrender.com/api/dashboard
```

Expected response for health check:
```json
{
  "status": "ok",
  "timestamp": "2026-01-16T20:33:00.000Z"
}
```

## 🔧 Troubleshooting

### Build Fails

**Problem:** `tsx: not found` or `vite: not found` error during build
**Solution:** Build dependencies (tsx, vite, esbuild, typescript) are now in `dependencies` instead of `devDependencies` to ensure they're available during Render's build process.

**Problem:** Dependencies not installing
**Solution:** Check `package.json` is committed and valid

**Problem:** TypeScript errors
**Solution:** Run `npm run check` locally first

### Server Won't Start
**Problem:** Port binding error
**Solution:** Ensure `PORT` env var is set or code uses dynamic port

**Problem:** Import errors
**Solution:** Verify all imports use `.js` extensions for ESM compatibility

### Runtime Errors
**Problem:** Module not found
**Solution:** Check dependencies are in `dependencies`, not `devDependencies`

**Problem:** Database/API connection fails
**Solution:** Verify environment variables are set correctly

## 📊 Monitoring

### Logs
View logs in Render dashboard:
- Settings → Logs
- Look for "Server running on port 3000"
- Check for "Inner Loop completed" messages

### Health Checks
Render automatically monitors `/api/health` endpoint.
If it returns non-200, service will restart.

### Performance
- Monitor response times in Render dashboard
- Check memory usage (Node.js should use ~100-200MB)
- Inner Loop runs every 10 minutes (configurable via HEARTBEAT_CRON)

## 🔐 Security Notes

### Known Vulnerabilities
Run `npm audit` before deployment:
```bash
npm audit --production
```

**Current Status:**
- Some dependency vulnerabilities exist (low/moderate severity)
- These are in transitive dependencies
- Can fix with `npm audit fix` if needed

### Best Practices
- ✅ Never commit `.env` file with secrets
- ✅ Use strong SESSION_SECRET in production
- ✅ Rotate API keys regularly
- ✅ Monitor logs for suspicious activity
- ✅ Keep dependencies updated

## 🎯 Features Available

### Without API Keys (Placeholder Mode)
- ✅ Server starts and runs
- ✅ Inner Loop executes with rule-based logic
- ✅ Basic monitoring and health checks
- ✅ State persistence to file system
- ⚠️ No AI-powered features
- ⚠️ No Notion memory integration

### With OpenAI Key
- ✅ AI-powered strategy generation
- ✅ Intelligent code generation
- ✅ Autonomous planning
- ✅ Advanced analysis

### With Notion Integration
- ✅ Persistent memory storage
- ✅ Knowledge consolidation
- ✅ Historical tracking
- ✅ Cross-session learning

## 📈 Post-Deployment

### Test Functionality
1. Visit your app URL
2. Check dashboard loads
3. Verify API endpoints respond
4. Test manual Inner Loop trigger

### Monitor First Hour
- Watch logs for errors
- Check Inner Loop executes every 10 minutes
- Verify memory usage is stable
- Test all API endpoints

### Configure Auto-Deploy
In Render settings:
- Enable "Auto-Deploy" for automatic deployments
- Set branch to monitor (e.g., `main`)
- Push changes to trigger redeployment

## 🎉 Success Indicators

✅ Build completes without errors
✅ Server starts and shows "Server running on port 3000"
✅ "Initial Inner Loop completed" appears in logs
✅ Health endpoint returns 200 OK
✅ Dashboard page loads
✅ No crash loops or restarts

## 📞 Support

If issues persist:
1. Check Render logs first
2. Verify environment variables
3. Test locally with `npm run build && npm start`
4. Compare local vs production behavior

---

**Last Updated:** 2026-01-16
**Version:** 1.0.0
**Status:** Production Ready ✅
