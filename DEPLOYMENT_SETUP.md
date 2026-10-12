# Deployment Setup Guide - Mzansi Couriers

## Overview

This guide covers deploying Mzansi Couriers to production:
- **Backend:** Railway (Node.js + Express + MySQL + Redis)
- **Frontend:** Firebase Hosting (React + Vite)
- **Mobile:** iOS via Capacitor

---

## Part 1: Railway Backend Deployment

### 1.1 Create Railway Project

1. Go to [Railway.app](https://railway.app)
2. Click **New Project**
3. Select **Deploy from GitHub** (or create new)
4. Connect your GitHub account
5. Select `mzansi-couriers` repository
6. Click **Deploy**

### 1.2 Add Services

#### MySQL Database

1. In Railway project, click **New**
2. Select **Database → MySQL**
3. Railway creates database automatically
4. Copy connection string

#### Redis Cache

1. Click **New**
2. Select **Cache → Redis**
3. Railway creates Redis automatically
4. Copy connection string

### 1.3 Configure Environment Variables

In Railway project settings, add:

```
# Database
DATABASE_URL=mysql://user:password@host:port/database

# Redis
REDIS_URL=redis://user:password@host:port

# Secrets
JWT_SECRET=generate-random-secret-key-here
PAYSTACK_SECRET_KEY=pk_live_your-paystack-secret-key

# Twilio
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_WHATSAPP_NUMBER=+1234567890

# OAuth
VITE_APP_ID=your-manus-app-id
OAUTH_SERVER_URL=https://api.manus.im

# Owner Info
OWNER_OPEN_ID=your-owner-id
OWNER_NAME=Your Name

# Manus APIs
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-manus-api-key
```

### 1.4 Configure Build Settings

1. In Railway, go to **Settings**
2. Set **Build Command**:
   ```
   pnpm install && pnpm run build
   ```
3. Set **Start Command**:
   ```
   node dist/index.js
   ```
4. Set **Port**: `3000`

### 1.5 Deploy

1. Click **Deploy**
2. Railway builds and deploys automatically
3. Get public URL from Railway dashboard
4. Example: `https://mzansi-couriers-production.railway.app`

### 1.6 Verify Backend

```bash
# Test API endpoint
curl https://your-railway-url/api/trpc/auth.me

# Should return user info or null
```

---

## Part 2: Firebase Frontend Deployment

### 2.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **Create Project**
3. Name: `mzansi-couriers`
4. Enable Google Analytics (optional)
5. Click **Create**

### 2.2 Enable Hosting

1. In Firebase, go to **Hosting**
2. Click **Get Started**
3. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```
4. Login:
   ```bash
   firebase login
   ```

### 2.3 Initialize Firebase in Project

```bash
cd /home/ubuntu/mzansi-couriers

# Initialize Firebase
firebase init hosting

# When prompted:
# - Select your Firebase project
# - Public directory: dist/public
# - Single-page app: Yes
# - Overwrite index.html: No
```

### 2.4 Build and Deploy

```bash
# Build web assets
pnpm run build

# Deploy to Firebase
firebase deploy

# Get public URL from Firebase console
# Example: https://mzansi-couriers.web.app
```

### 2.5 Configure Custom Domain (Optional)

1. In Firebase Hosting, click **Connect domain**
2. Enter your domain (e.g., `mzansicouriers.com`)
3. Follow DNS configuration steps
4. Firebase provides SSL automatically

---

## Part 3: iOS App Store Deployment

### 3.1 Prepare for App Store

1. Follow **iOS_BUILD_GUIDE.md** steps 1-9
2. Create App Store Connect listing
3. Add screenshots and description
4. Set pricing and availability

### 3.2 Submit for Review

1. In App Store Connect, click **Submit for Review**
2. Answer review questions:
   - Does your app use encryption?
   - Does your app access health data?
   - Does your app use location services?
   - etc.
3. Click **Submit**

### 3.3 Review Process

- Apple reviews typically take 24-48 hours
- You'll receive email with approval or rejection
- If rejected, fix issues and resubmit
- Once approved, app appears on App Store

---

## Part 4: Environment Configuration

### Frontend Environment Variables

Create `.env.production` (not committed to git):

```
# Backend API
VITE_FRONTEND_FORGE_API_URL=https://your-railway-url
VITE_FRONTEND_FORGE_API_KEY=your-api-key

# Firebase
VITE_FIREBASE_PROJECT_ID=mzansi-couriers
VITE_FIREBASE_API_KEY=your-firebase-key
VITE_FIREBASE_AUTH_DOMAIN=mzansi-couriers.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://mzansi-couriers.firebaseio.com
VITE_FIREBASE_STORAGE_BUCKET=mzansi-couriers.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Paystack
VITE_PAYSTACK_PUBLIC_KEY=pk_live_your-paystack-key

# OAuth
VITE_OAUTH_PORTAL_URL=https://your-oauth-url
VITE_APP_ID=your-app-id

# Analytics
VITE_ANALYTICS_ENDPOINT=https://your-analytics-url
VITE_ANALYTICS_WEBSITE_ID=your-website-id

# App Info
VITE_APP_TITLE=Mzansi Couriers
VITE_APP_LOGO=https://your-logo-url/logo.png
```

### Backend Environment Variables

Set in Railway project settings (see Part 1.3)

---

## Part 5: Monitoring & Maintenance

### Monitor Backend

```bash
# View Railway logs
railway logs

# Monitor database
railway shell mysql

# Monitor Redis
railway shell redis
```

### Monitor Frontend

1. Firebase Console → Hosting → Analytics
2. View traffic, errors, performance
3. Set up alerts for errors

### Monitor iOS App

1. App Store Connect → Analytics
2. View crashes, performance
3. Monitor user feedback

---

## Part 6: Updates & Rollbacks

### Update Backend

```bash
# Push to GitHub
git push origin main

# Railway auto-deploys
# Monitor logs for errors
```

### Update Frontend

```bash
# Build and deploy
pnpm run build
firebase deploy
```

### Update iOS App

```bash
# Update version in Xcode
# Build and upload new archive
# Submit for review
# Wait for approval
```

---

## Part 7: Troubleshooting

### Backend Not Responding

```bash
# Check Railway logs
railway logs

# Restart service
railway restart

# Check environment variables
railway env
```

### Frontend Build Fails

```bash
# Clear cache
rm -rf node_modules dist
pnpm install
pnpm run build

# Check for errors
pnpm run build 2>&1 | grep error
```

### iOS App Crashes

1. Connect iPhone to Mac
2. Open Console.app
3. Filter by "Mzansi"
4. Check error messages
5. Fix code and rebuild

### Database Connection Issues

```bash
# Test connection
mysql -h host -u user -p database

# Check Railway database status
railway status
```

---

## Deployment Checklist

Before going live:

- [ ] Backend deployed to Railway
- [ ] Frontend deployed to Firebase
- [ ] iOS app submitted to App Store
- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Redis cache working
- [ ] Paystack live account active
- [ ] Twilio production account configured
- [ ] Push notifications working
- [ ] Email notifications working
- [ ] SMS notifications working
- [ ] WhatsApp notifications working
- [ ] GPS tracking working
- [ ] Payment processing working
- [ ] Courier payouts working
- [ ] Admin dashboard accessible
- [ ] Customer dashboard accessible
- [ ] Courier dashboard accessible
- [ ] All tests passing
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Security audit complete
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Support email configured

---

## Post-Launch Tasks

1. Monitor app performance
2. Respond to user feedback
3. Fix bugs quickly
4. Plan Phase 2 features
5. Optimize based on analytics
6. Scale infrastructure as needed

---

## Support

For deployment issues:
- **Email:** support@mzansicouriers.com
- **Railway Support:** https://railway.app/support
- **Firebase Support:** https://firebase.google.com/support
- **Apple Support:** https://developer.apple.com/support/

---

## Resources

- [Railway Documentation](https://docs.railway.app)
- [Firebase Hosting Guide](https://firebase.google.com/docs/hosting)
- [Capacitor iOS Guide](https://capacitorjs.com/docs/ios)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
